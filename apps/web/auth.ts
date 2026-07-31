import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createAuthMiddleware } from "better-auth/api";
import { admin, customSession } from "better-auth/plugins";
import { waitUntil } from "cloudflare:workers";
import { sendEmailDirect } from "@repo/mail";
import {
  user as usersTable,
  account as accountsTable,
  session as sessionsTable,
  verification as verificationsTable,
} from "@repo/db/schema";

async function sendAuthEmail(
  kind: "verification" | "password-reset",
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    await sendEmailDirect(to, subject, html);
  } catch (error) {
    console.error(`[auth] Failed to send ${kind} email to ${to}:`, error);
    throw error;
  }
}


// Type definitions for database hooks
// Better Auth passes user data with Record<string, unknown> for extensibility
type UserData = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  [key: string]: unknown;
};

/**
 * Determines user role based on email domain
 * @param email - User's email address
 * @returns "admin" for @darkalphacapital.com emails, "user" for all others
 */
function getUserRoleFromEmail(email: string): string {
  if (email.toLowerCase().endsWith("@darkalphacapital.com")) {
    return "admin";
  }
  return "user";
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://investors.darkalphacapital.com",
    "http://localhost:3000",
  ],
  // Keep email sends alive on Cloudflare Workers after the auth response.
  // advanced: {
  //   backgroundTasks: {
  //     handler: (promise) => {
  //       waitUntil(promise);
  //     },
  //   },
  // },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: usersTable,
      verification: verificationsTable,
      account: accountsTable,
      session: sessionsTable,
    },
  }),
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
      token: string;
    }) => {
      await sendAuthEmail(
        "password-reset",
        user.email,
        "Reset your password",
        `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>
         <p>This link will expire in 1 hour.</p>
         <p>If you didn't request this, please ignore this email.</p>`,
      );
    },
    onPasswordReset: async ({ user }) => {
      console.log(`[auth] Password reset completed for ${user.email}`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
      token: string;
    }) => {
      await sendAuthEmail(
        "verification",
        user.email,
        "Verify your email address",
        `<p>Click the link to verify your email: <a href="${url}">${url}</a></p>
         <p>If you didn't create an account, you can ignore this email.</p>`,
      );
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Skip failed auth responses — only enrich successful sign-ins.
      const returned = ctx.context.returned;
      if (
        returned &&
        typeof returned === "object" &&
        ("statusCode" in returned ||
          (returned as { name?: string }).name === "APIError")
      ) {
        return;
      }

      // After sign-in endpoints, ensure user has a role set
      if (ctx.path === "/sign-in/email" || ctx.path === "/sign-in/social") {
        const newSession = ctx.context.newSession;
        if (
          newSession?.user &&
          !newSession.user.role &&
          newSession.user.email
        ) {
          const role = getUserRoleFromEmail(newSession.user.email);
          // Update the user's role in the database
          await db
            .update(user)
            .set({ role })
            .where(eq(user.id, newSession.user.id));
        }
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (userData: UserData) => {
          // Set role based on email domain when user is created
          const role = getUserRoleFromEmail(userData.email);
          return {
            data: {
              ...userData,
              role,
            },
          };
        },
      },
      update: {
        before: async (data: Partial<UserData>) => {
          // If email is being updated, check and update role accordingly
          if (data.email && typeof data.email === "string" && !data.role) {
            const role = getUserRoleFromEmail(data.email);
            return {
              data: {
                ...data,
                role,
              },
            };
          }
          return { data };
        },
      },
    },
    session: {
      create: {
        after: async (sessionData, ctx) => {
          // When a session is created (user signs in), ensure they have a role
          // This handles existing users who might not have roles set
          const contextUser = ctx?.context?.user as
            | { id: string; email?: string; role?: string | null }
            | undefined;

          if (contextUser && !contextUser.role && contextUser.email) {
            const role = getUserRoleFromEmail(contextUser.email);
            // Update the user's role in the database
            await db
              .update(user)
              .set({ role })
              .where(eq(user.id, contextUser.id));
          }
        },
      },
    },
  },

  plugins: [
    admin(),
    customSession(async ({ user, session }) => {
      // Include the role field from the user object
      // Better Auth with Drizzle adapter includes all user table fields
      return {
        user: {
          ...user,
          role: (user as typeof user & { role?: string | null }).role ?? null,
        },
        session,
      };
    }),
    tanstackStartCookies(),
  ],
});

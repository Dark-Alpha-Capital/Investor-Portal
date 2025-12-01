import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/db";
import { user } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { sendEmail } from "./lib/mail";

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
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async (
      {
        user,
        url,
        token,
      }: { user: { email: string }; url: string; token: string },
      request?: unknown
    ) => {
      void sendEmail(
        user.email,
        "Verify your email address",
        `<p>Click the link to verify your email: <a href="${url}">${url}</a></p>`
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
        before: async (userData, ctx) => {
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
        before: async (data, ctx) => {
          // If email is being updated, check and update role accordingly
          if (data.email && !data.role) {
            const role = getUserRoleFromEmail(data.email);
            return {
              data: {
                ...data,
                role,
              },
            };
          }
          // If user doesn't have a role yet, set it based on email
          if (!data.role && ctx?.context?.user?.email) {
            const role = getUserRoleFromEmail(ctx.context.user.email);
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
          if (
            ctx?.context?.user &&
            !ctx.context.user.role &&
            ctx.context.user.email
          ) {
            const role = getUserRoleFromEmail(ctx.context.user.email);
            // Update the user's role in the database
            await db
              .update(user)
              .set({ role })
              .where(eq(user.id, ctx.context.user.id));
          }
        },
      },
    },
  },

  plugins: [nextCookies(), admin()],
});

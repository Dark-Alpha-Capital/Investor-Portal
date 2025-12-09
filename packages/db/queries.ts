import { db } from ".";
import { user, onboarding, onboardingDocument } from "./schema";
import { and, eq, or, isNull, ne } from "drizzle-orm";

/**
 *
 * Get a user by their ID
 * @param id
 * @returns
 */
export const getUserById = async (id: string) => {
  try {
    return await db.select().from(user).where(eq(user.id, id));
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const isUserOnboarded = async (id: string) => {
  try {
    const result = await db
      .select({ isOnboardingCompleted: user.isOnboardingCompleted })
      .from(user)
      .where(and(eq(user.id, id), eq(user.isOnboardingCompleted, true)))
      .limit(1);
    return result[0]?.isOnboardingCompleted ?? false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getUserWithKycStatus = async (id: string) => {
  try {
    const result = await db
      .select({
        isOnboardingCompleted: user.isOnboardingCompleted,
        kycStatus: user.kycStatus,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUserWithOnboarding = async (userId: string) => {
  try {
    // Get user data
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      return null;
    }

    const userRecord = userData[0];

    // Get onboarding data if exists
    const onboardingData = await db
      .select()
      .from(onboarding)
      .where(eq(onboarding.userId, userId))
      .limit(1);

    const onboardingRecord = onboardingData[0] || null;

    // Get documents if onboarding exists
    let documents: (typeof onboardingDocument.$inferSelect)[] = [];
    if (onboardingRecord) {
      const docs = await db
        .select()
        .from(onboardingDocument)
        .where(eq(onboardingDocument.onboardingId, onboardingRecord.id));
      documents = docs;
    }

    return {
      user: userRecord,
      onboarding: onboardingRecord,
      documents,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Update a user's KYC status
 * @param userId The user ID
 * @param kycStatus The new KYC status
 * @returns The updated user or null if update fails
 */
export const updateKycStatus = async (
  userId: string,
  kycStatus: "review" | "approved" | "pending_docs" | "rejected"
) => {
  try {
    // Update the user's KYC status
    await db.update(user).set({ kycStatus }).where(eq(user.id, userId));

    // Fetch the updated user to ensure we have the latest data
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return updatedUser || null;
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return null;
  }
};

/**
 * Get all investors (non-admin users) with their KYC status
 * @returns Array of investors with KYC status
 */
export const getAllInvestorsWithKycStatus = async () => {
  try {
    const investors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        banned: user.banned,
        createdAt: user.createdAt,
        kycStatus: user.kycStatus,
      })
      .from(user)
      .where(or(ne(user.role, "admin"), isNull(user.role)));

    return investors;
  } catch (error) {
    console.error("Error fetching investors with KYC status:", error);
    return [];
  }
};

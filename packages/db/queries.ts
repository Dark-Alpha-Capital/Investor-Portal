import { db } from ".";
import {
  user,
  onboarding,
  onboardingDocument,
  deal,
  dealInvite,
  dealInterest,
  investment,
} from "./schema";
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

/**
 * Get all investors (non-admin users) for curation
 * @returns Array of investors with KYC status and onboarding completion status
 */
export const getAllInvestors = async () => {
  try {
    const investors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        kycStatus: user.kycStatus,
        isOnboardingCompleted: user.isOnboardingCompleted,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(or(ne(user.role, "admin"), isNull(user.role)))
      .orderBy(user.name);

    return investors;
  } catch (error) {
    console.error("Error fetching investors:", error);
    return [];
  }
};

/**
 * Get a deal by its ID
 * @param dealId The deal ID
 * @returns The deal record or null if not found
 */
export const getDealById = async (dealId: string) => {
  try {
    const records = await db
      .select()
      .from(deal)
      .where(eq(deal.id, dealId))
      .limit(1);
    return records[0] || null;
  } catch (error) {
    console.error("Error fetching deal by ID:", error);
    return null;
  }
};

/**
 * Get all deal invites with user information for a specific deal
 * @param dealId The deal ID
 * @returns Array of deal invites with user data
 */
export const getDealInvitesWithUsersByDealId = async (dealId: string) => {
  try {
    const invites = await db
      .select({
        id: dealInvite.id,
        userId: dealInvite.userId,
        curationNote: dealInvite.curationNote,
        createdAt: dealInvite.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          kycStatus: user.kycStatus,
          isOnboardingCompleted: user.isOnboardingCompleted,
        },
      })
      .from(dealInvite)
      .innerJoin(user, eq(dealInvite.userId, user.id))
      .where(eq(dealInvite.dealId, dealId));

    return invites;
  } catch (error) {
    console.error("Error fetching deal invites with users:", error);
    return [];
  }
};

/**
 * Get all deal interests with user information for a specific deal
 * @param dealId The deal ID
 * @returns Array of deal interests with user data
 */
export const getDealInterestsWithUsersByDealId = async (dealId: string) => {
  try {
    const interests = await db
      .select({
        id: dealInterest.id,
        userId: dealInterest.userId,
        status: dealInterest.status,
        proposedAmount: dealInterest.proposedAmount,
        createdAt: dealInterest.createdAt,
        updatedAt: dealInterest.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(dealInterest)
      .innerJoin(user, eq(dealInterest.userId, user.id))
      .where(eq(dealInterest.dealId, dealId));

    return interests;
  } catch (error) {
    console.error("Error fetching deal interests with users:", error);
    return [];
  }
};

/**
 * Get all investments with user information for a specific deal
 * @param dealId The deal ID
 * @returns Array of investments with user data
 */
export const getDealInvestmentsWithUsersByDealId = async (dealId: string) => {
  try {
    const investments = await db
      .select({
        id: investment.id,
        userId: investment.userId,
        committedAmount: investment.committedAmount,
        fundedAmount: investment.fundedAmount,
        currentValue: investment.currentValue,
        distributions: investment.distributions,
        status: investment.status,
        ownershipPercentage: investment.ownershipPercentage,
        committedDate: investment.committedDate,
        createdAt: investment.createdAt,
        updatedAt: investment.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(investment)
      .innerJoin(user, eq(investment.userId, user.id))
      .where(eq(investment.dealId, dealId));

    return investments;
  } catch (error) {
    console.error("Error fetching deal investments with users:", error);
    return [];
  }
};

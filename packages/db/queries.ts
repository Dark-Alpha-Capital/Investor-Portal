import { db } from ".";
import {
  user,
  onboarding,
  onboardingDocument,
  onboardingEditHistory,
  deal,
  dealInvite,
  dealInterest,
  investment,
  investorClearance,
  vehiclePermission,
} from "./schema";
import { and, eq, or, isNull, ne, desc, sql, ilike } from "drizzle-orm";

/**
 * Get paginated deals for admin with filtering
 * @param page Page number (1-indexed)
 * @param limit Number of results per page
 * @param search Optional search term for name, description, or sector
 * @param status Optional status filter
 * @param visibility Optional visibility filter
 * @returns Paginated list of deals with formatted dates and pagination info
 */
export const getAdminDeals = async ({
  page,
  limit,
  search,
  status,
  visibility,
}: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  visibility?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(deal.name, searchTerm),
          ilike(deal.description, searchTerm),
          ilike(deal.sector, searchTerm)
        )!
      );
    }

    // Add status filter
    if (status && status !== "all") {
      conditions.push(
        eq(
          deal.status,
          status as
            | "draft"
            | "coming_soon"
            | "live"
            | "closing"
            | "funded"
            | "exited"
            | "cancelled"
        )
      );
    }

    // Add visibility filter
    if (visibility && visibility !== "all") {
      conditions.push(
        eq(
          deal.visibility,
          visibility as "public" | "accredited" | "invite_only"
        )
      );
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deal)
      .where(whereCondition);

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated deals
    const deals = await db
      .select()
      .from(deal)
      .where(whereCondition)
      .orderBy(desc(deal.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      deals: deals.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt?.toISOString() ?? null,
        launchDate: d.launchDate?.toISOString() ?? null,
        closeDate: d.closeDate?.toISOString() ?? null,
        targetRaise: d.targetRaise?.toString() ?? null,
        minInvestment: d.minInvestment?.toString() ?? null,
        targetIrr: d.targetIrr?.toString() ?? null,
        targetMoic: d.targetMoic?.toString() ?? null,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching admin deals:", error);
    return {
      success: false,
      deals: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
};

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
 * Get all investors for deal curation with ISO string dates
 * @returns Array of investors with dates as ISO strings
 */
export const getInvestorsForCuration = async () => {
  try {
    const investors = await getAllInvestors();
    return investors.map((investor) => ({
      ...investor,
      createdAt: investor.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching investors for curation:", error);
    return [];
  }
};

/**
 * Get deal invites for curation with ISO string dates
 * @param dealId The deal ID
 * @returns Array of deal invites with user data and ISO string dates
 */
export const getDealInvitesForCuration = async (dealId: string) => {
  try {
    const invites = await getDealInvitesWithUsersByDealId(dealId);
    return invites.map((invite) => ({
      ...invite,
      createdAt: invite.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching deal invites for curation:", error);
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
 * Get a deal by its ID with formatted fields for editing
 * Transforms numeric fields to strings and dates to ISO strings
 * @param dealId The deal ID
 * @returns Object with success flag and formatted deal data
 */
export const getDealByIdForEdit = async (dealId: string) => {
  try {
    const dealRecord = await getDealById(dealId);

    if (!dealRecord) {
      return {
        success: false as const,
        deal: null,
      };
    }

    // Transform numeric fields to strings and dates to ISO strings
    const transformedDeal = {
      ...dealRecord,
      targetRaise: dealRecord.targetRaise?.toString() ?? null,
      minInvestment: dealRecord.minInvestment?.toString() ?? null,
      targetIrr: dealRecord.targetIrr?.toString() ?? null,
      targetMoic: dealRecord.targetMoic?.toString() ?? null,
      launchDate: dealRecord.launchDate?.toISOString() ?? null,
      closeDate: dealRecord.closeDate?.toISOString() ?? null,
      createdAt: dealRecord.createdAt.toISOString(),
      updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
    };

    return {
      success: true as const,
      deal: transformedDeal,
    };
  } catch (error) {
    console.error("Error fetching deal by ID for edit:", error);
    return {
      success: false as const,
      deal: null,
    };
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

/**
 * Get investors pending compliance review
 * @param page Page number (1-indexed)
 * @param limit Number of results per page
 * @param search Optional search term for name or email
 * @param clearanceStatus Optional clearance status filter
 * @returns Paginated list of investors with clearance status and permission counts
 */
export const getPendingInvestors = async ({
  page,
  limit,
  search,
  clearanceStatus,
}: {
  page: number;
  limit: number;
  search?: string;
  clearanceStatus?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    // Get users who have completed onboarding but may need clearance review
    const conditions = [
      or(ne(user.role, "admin"), isNull(user.role)),
      eq(user.isOnboardingCompleted, true),
    ];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))!
      );
    }

    const whereCondition = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(whereCondition);

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Get users with their latest clearance status
    const investors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        kycStatus: user.kycStatus,
        isOnboardingCompleted: user.isOnboardingCompleted,
      })
      .from(user)
      .where(whereCondition)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Get clearance status and permission count for each investor
    const investorsWithClearance = await Promise.all(
      investors.map(async (investor) => {
        // Get clearance status
        const [clearance] = await db
          .select({
            status: investorClearance.status,
            conditions: investorClearance.conditions,
            conditionsJson: investorClearance.conditionsJson,
            clearedAt: investorClearance.clearedAt,
            clearedBy: investorClearance.clearedBy,
          })
          .from(investorClearance)
          .where(eq(investorClearance.userId, investor.id))
          .orderBy(desc(investorClearance.createdAt))
          .limit(1);

        // Get permission count (active, non-revoked permissions)
        const [permissionCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.userId, investor.id),
              isNull(vehiclePermission.revokedAt)
            )
          );

        return {
          ...investor,
          clearance: clearance || null,
          dealAccessCount: permissionCount?.count ?? 0,
        };
      })
    );

    // Filter by clearance status if provided
    let filteredInvestors = investorsWithClearance;
    if (clearanceStatus && clearanceStatus !== "all") {
      if (clearanceStatus === "no_clearance") {
        filteredInvestors = investorsWithClearance.filter(
          (inv) => !inv.clearance
        );
      } else {
        filteredInvestors = investorsWithClearance.filter(
          (inv) => inv.clearance?.status === clearanceStatus
        );
      }
    }

    return {
      success: true,
      investors: filteredInvestors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching pending investors:", error);
    return {
      success: false,
      investors: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }
};

/**
 * Get complete deal detail with invites, interests, and investments
 * This function fetches all deal-related data from the database and transforms it
 * Note: Files are handled separately via Nextcloud/WebDAV
 * @param dealId The deal ID
 * @returns Deal detail data with invites, interests, and investments, or null if deal not found
 */
export const getDealDetail = async (dealId: string) => {
  try {
    // Fetch all data in parallel
    const [dealRecord, invites, interests, investments] = await Promise.all([
      getDealById(dealId),
      getDealInvitesWithUsersByDealId(dealId),
      getDealInterestsWithUsersByDealId(dealId),
      getDealInvestmentsWithUsersByDealId(dealId),
    ]);

    // Check if deal exists
    if (!dealRecord) {
      return {
        success: false as const,
        deal: null,
        invites: [],
        interests: [],
        investments: [],
      };
    }

    // Transform deal data
    const transformedDeal = {
      ...dealRecord,
      targetRaise: dealRecord.targetRaise?.toString() ?? null,
      minInvestment: dealRecord.minInvestment?.toString() ?? null,
      targetIrr: dealRecord.targetIrr?.toString() ?? null,
      targetMoic: dealRecord.targetMoic?.toString() ?? null,
      launchDate: dealRecord.launchDate?.toISOString() ?? null,
      closeDate: dealRecord.closeDate?.toISOString() ?? null,
      createdAt: dealRecord.createdAt.toISOString(),
      updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
    };

    // Transform invites
    const transformedInvites = invites.map((invite) => ({
      ...invite,
      createdAt: invite.createdAt.toISOString(),
    }));

    // Transform interests
    const transformedInterests = interests.map((interest) => ({
      ...interest,
      proposedAmount: interest.proposedAmount?.toString() ?? null,
      createdAt: interest.createdAt.toISOString(),
      updatedAt: interest.updatedAt?.toISOString() ?? null,
    }));

    // Transform investments
    const transformedInvestments = investments.map((inv) => ({
      ...inv,
      committedAmount: inv.committedAmount.toString(),
      fundedAmount: inv.fundedAmount?.toString() ?? null,
      currentValue: inv.currentValue?.toString() ?? null,
      distributions: inv.distributions?.toString() ?? null,
      ownershipPercentage: inv.ownershipPercentage?.toString() ?? null,
      committedDate: inv.committedDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt?.toISOString() ?? null,
    }));

    return {
      success: true as const,
      deal: transformedDeal,
      invites: transformedInvites,
      interests: transformedInterests,
      investments: transformedInvestments,
    };
  } catch (error) {
    console.error("Error fetching deal detail:", error);
    return {
      success: false as const,
      deal: null,
      invites: [],
      interests: [],
      investments: [],
    };
  }
};

/**
 * Get user onboarding status
 * @param userId The user ID
 * @returns Whether the user has completed onboarding
 */
export const getUserOnboardingStatus = async (userId: string) => {
  try {
    const [userData] = await db
      .select({
        isOnboardingCompleted: user.isOnboardingCompleted,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      isOnboardingCompleted: userData?.isOnboardingCompleted ?? false,
    };
  } catch (error) {
    console.error("Error fetching user onboarding status:", error);
    return {
      isOnboardingCompleted: false,
    };
  }
};

/**
 * Get onboarding data with edit history for a user
 * @param userId The user ID
 * @returns Onboarding data and edit history, or null if not found
 */
export const getOnboardingWithEditHistory = async (userId: string) => {
  try {
    // Fetch onboarding data
    const [onboardingData] = await db
      .select({
        id: onboarding.id,
        submittedAt: onboarding.submittedAt,
        lastEditedAt: onboarding.lastEditedAt,
        editCount: onboarding.editCount,
        isEditable: onboarding.isEditable,
        organizationName: onboarding.organizationName,
      })
      .from(onboarding)
      .where(eq(onboarding.userId, userId))
      .orderBy(desc(onboarding.createdAt))
      .limit(1);

    if (!onboardingData) {
      return null;
    }

    // Fetch edit history
    const editHistory = await db
      .select({
        id: onboardingEditHistory.id,
        fieldName: onboardingEditHistory.fieldName,
        fieldLabel: onboardingEditHistory.fieldLabel,
        previousValue: onboardingEditHistory.previousValue,
        newValue: onboardingEditHistory.newValue,
        editedAt: onboardingEditHistory.editedAt,
      })
      .from(onboardingEditHistory)
      .where(eq(onboardingEditHistory.onboardingId, onboardingData.id))
      .orderBy(desc(onboardingEditHistory.editedAt))
      .limit(10);

    return {
      onboarding: onboardingData,
      editHistory,
    };
  } catch (error) {
    console.error("Error fetching onboarding with edit history:", error);
    return null;
  }
};

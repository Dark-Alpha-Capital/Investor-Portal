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
  beneficialOwner,
  authorizedSignatory,
  kycAttestation,
  auditLog,
} from "./schema";
import {
  and,
  eq,
  or,
  isNull,
  ne,
  desc,
  sql,
  ilike,
  inArray,
} from "drizzle-orm";

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
      .select({ count: sql<number>`count(*)` })
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

/**
 * Get user's onboarding status and current clearance status
 * @param userId The user ID
 * @returns Object with onboarding status and clearance status, or null if user not found
 */
export const getUserWithKycAndClearance = async (userId: string) => {
  try {
    // Run both queries in parallel
    const [userResult, clearanceResult] = await Promise.all([
      db
        .select({
          isOnboardingCompleted: user.isOnboardingCompleted,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1),
      db
        .select({
          status: investorClearance.status,
        })
        .from(investorClearance)
        .where(eq(investorClearance.userId, userId))
        .orderBy(desc(investorClearance.createdAt))
        .limit(1),
    ]);

    const [userData] = userResult;
    const [clearance] = clearanceResult;

    if (!userData) {
      return null;
    }

    return {
      isOnboardingCompleted: userData.isOnboardingCompleted,
      clearanceStatus: clearance?.status ?? null,
    };
  } catch (error) {
    console.error("Error fetching user with KYC and clearance:", error);
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
 * @deprecated KYC status is no longer stored on user table. Use investorClearance instead.
 * This function is kept for backwards compatibility but does nothing.
 */
export const updateKycStatus = async (
  userId: string,
  kycStatus: "review" | "approved" | "pending_docs" | "rejected"
) => {
  console.warn(
    "updateKycStatus is deprecated. KYC status is now managed via investorClearance table."
  );
  // Fetch the user to maintain return type compatibility
  const [updatedUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return updatedUser || null;
};

/**
 * Get all investors (non-admin users)
 * @returns Array of investors
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
      .select({ count: sql<number>`count(*)` })
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
          .select({ count: sql<number>`count(*)` })
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
    // Fetch latest onboarding record with full columns
    const [onboardingData] = await db
      .select()
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

/**
 * Get portfolio data for a user including investments and calculated metrics
 * @param userId The user ID
 * @returns Portfolio data with metrics and investment list
 */
export const getPortfolioData = async (userId: string) => {
  try {
    const investments = await db
      .select({
        id: investment.id,
        dealId: investment.dealId,
        dealName: deal.name,
        committedAmount: investment.committedAmount,
        fundedAmount: investment.fundedAmount,
        currentValue: investment.currentValue,
        distributions: investment.distributions,
        status: investment.status,
        ownershipPercentage: investment.ownershipPercentage,
        committedDate: investment.committedDate,
      })
      .from(investment)
      .innerJoin(deal, eq(investment.dealId, deal.id))
      .where(eq(investment.userId, userId));

    // Calculate portfolio metrics
    const portfolio = {
      capitalCommitted: investments.reduce(
        (sum, inv) => sum + (inv.committedAmount || 0),
        0
      ),
      capitalDeployed: investments.reduce(
        (sum, inv) => sum + (inv.fundedAmount || 0),
        0
      ),
      currentValue: investments.reduce(
        (sum, inv) => sum + (inv.currentValue || 0),
        0
      ),
      totalInvestments: investments.length,
    };

    return {
      portfolio,
      investments: investments.map((inv) => ({
        id: inv.id,
        dealId: inv.dealId,
        dealName: inv.dealName,
        committedAmount: inv.committedAmount?.toString() || "0",
        fundedAmount: inv.fundedAmount?.toString() || "0",
        currentValue: inv.currentValue?.toString() || null,
        distributions: inv.distributions?.toString() || "0",
        status: inv.status,
        ownershipPercentage: inv.ownershipPercentage?.toString() || null,
        committedDate: inv.committedDate?.toISOString() || "",
      })),
    };
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return {
      portfolio: {
        capitalCommitted: 0,
        capitalDeployed: 0,
        currentValue: 0,
        totalInvestments: 0,
      },
      investments: [],
    };
  }
};

/**
 * Get clearance data for a user
 * @param userId The user ID
 * @returns Clearance data or null if not found
 */
export const getClearanceData = async (userId: string) => {
  try {
    const [clearance] = await db
      .select({
        status: investorClearance.status,
        conditions: investorClearance.conditions,
        conditionsJson: investorClearance.conditionsJson,
        clearedAt: investorClearance.clearedAt,
        investorVisibleNotes: investorClearance.investorVisibleNotes,
        expiresAt: investorClearance.expiresAt,
      })
      .from(investorClearance)
      .where(eq(investorClearance.userId, userId))
      .orderBy(desc(investorClearance.createdAt))
      .limit(1);

    return {
      clearance: clearance || null,
    };
  } catch (error) {
    console.error("Error fetching clearance data:", error);
    return {
      clearance: null,
    };
  }
};

/**
 * Get marketplace deals for a specific user with compliance-based access control
 *
 * Visibility Logic:
 * - Cleared investors see:
 *   - All public deals (deal.visibility = "public")
 *   - Accredited deals (deal.visibility = "accredited") if user is cleared
 *   - All deals they've been invited to (via dealInvite table)
 *
 * Action Permissions:
 * - vehiclePermission still controls action permissions (canViewDocuments, canExpressInterest, canInvest)
 */
export const getMarketplaceDeals = async ({
  userId,
  page,
  limit,
  search,
  status,
  sector,
}: {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sector?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    // Check user's role
    const [userRecord] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const isAdmin = userRecord?.role === "admin";

    // Check user's clearance status (for verification/accreditation)
    const [clearanceRecord] = await db
      .select({ status: investorClearance.status })
      .from(investorClearance)
      .where(eq(investorClearance.userId, userId))
      .orderBy(desc(investorClearance.createdAt))
      .limit(1);

    const clearanceStatus = clearanceRecord?.status ?? null;
    const isCleared =
      clearanceStatus === "cleared" ||
      clearanceStatus === "cleared_with_conditions";
    // User is "verified/accredited" if they are cleared
    const isVerified = isCleared;

    // Get user's deal invites (for invite-only deals and curation notes)
    let invitedDealIds: string[] = [];
    let inviteNotes = new Map<string, string | null>();

    if (isCleared || isAdmin) {
      const invites = await db
        .select({
          dealId: dealInvite.dealId,
          curationNote: dealInvite.curationNote,
        })
        .from(dealInvite)
        .where(eq(dealInvite.userId, userId));

      invitedDealIds = invites.map((i) => i.dealId);
      inviteNotes = new Map(
        invites.map((i) => [i.dealId, i.curationNote ?? null])
      );
    }

    // Get user's permitted deal IDs (where canViewTeaser = true and not revoked)
    // Only fetch if user is cleared (or admin)
    // This is used for action permissions (canViewDocuments, canExpressInterest, canInvest)
    let permittedDealIds: string[] = [];
    let permissionNotes = new Map<string, string | null>();

    if (isCleared || isAdmin) {
      const permissions = await db
        .select({
          dealId: vehiclePermission.dealId,
          notes: vehiclePermission.notes,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, userId),
            eq(vehiclePermission.canViewTeaser, true),
            isNull(vehiclePermission.revokedAt)
          )
        );

      permittedDealIds = permissions.map((p) => p.dealId);
      permissionNotes = new Map(permissions.map((p) => [p.dealId, p.notes]));
    }

    // Build base conditions
    const baseConditions = [ne(deal.status, "draft")];

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      baseConditions.push(
        or(
          ilike(deal.name, searchTerm),
          ilike(deal.teaserSummary, searchTerm),
          ilike(deal.description, searchTerm),
          ilike(deal.sector, searchTerm),
          ilike(deal.geography, searchTerm)
        )!
      );
    }

    // Add status filter
    if (status && status !== "all") {
      baseConditions.push(
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

    // Add sector filter
    if (sector && sector !== "all") {
      baseConditions.push(ilike(deal.sector, sector));
    }

    // Build visibility condition based on compliance clearance, deal visibility, and invites
    // Admin sees all non-draft deals
    // Cleared investors see:
    //   - Public deals (deal.visibility = "public")
    //   - Accredited deals (deal.visibility = "accredited" AND user is verified/cleared)
    //   - Invited deals (user has dealInvite entry, regardless of visibility)
    let whereCondition;

    if (isAdmin) {
      // Admins see all non-draft deals
      whereCondition = and(...baseConditions);
    } else if (isCleared) {
      // Build visibility conditions for cleared investors
      const visibilityConditions: ReturnType<typeof or>[] = [];

      // Public deals: visible to all cleared investors
      visibilityConditions.push(eq(deal.visibility, "public"));

      // Accredited deals: only visible if user is verified/cleared
      if (isVerified) {
        visibilityConditions.push(eq(deal.visibility, "accredited"));
      }

      // Invited deals: visible if user has an invite (regardless of visibility)
      if (invitedDealIds.length > 0) {
        visibilityConditions.push(inArray(deal.id, invitedDealIds));
      }

      // Combine visibility conditions with OR
      // If no visibility conditions exist, user sees no deals
      if (visibilityConditions.length === 0) {
        return {
          success: true,
          deals: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: {
            sectors: [],
          },
          clearanceStatus,
        };
      }

      whereCondition = and(...baseConditions, or(...visibilityConditions));
    } else {
      // Not cleared = no deals
      // Return empty result
      return {
        success: true,
        deals: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: {
          sectors: [],
        },
        clearanceStatus,
      };
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
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

    // Get unique sectors for filter dropdown (from all visible deals: public + accredited + invited)
    let sectorsResult: { sector: string | null }[] = [];
    if (isAdmin) {
      sectorsResult = await db
        .selectDistinct({ sector: deal.sector })
        .from(deal)
        .where(ne(deal.status, "draft"));
    } else if (isCleared) {
      // Build the same visibility conditions for sector query
      const sectorVisibilityConditions: ReturnType<typeof or>[] = [];
      sectorVisibilityConditions.push(eq(deal.visibility, "public"));
      if (isVerified) {
        sectorVisibilityConditions.push(eq(deal.visibility, "accredited"));
      }
      if (invitedDealIds.length > 0) {
        sectorVisibilityConditions.push(inArray(deal.id, invitedDealIds));
      }

      if (sectorVisibilityConditions.length > 0) {
        sectorsResult = await db
          .selectDistinct({ sector: deal.sector })
          .from(deal)
          .where(
            and(ne(deal.status, "draft"), or(...sectorVisibilityConditions))
          );
      }
    }

    const sectors = sectorsResult
      .map((s) => s.sector)
      .filter((s): s is string => s !== null)
      .sort();

    return {
      success: true,
      deals: deals.map((dealRecord) => ({
        ...dealRecord,
        createdAt: dealRecord.createdAt.toISOString(),
        updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
        launchDate: dealRecord.launchDate?.toISOString() ?? null,
        closeDate: dealRecord.closeDate?.toISOString() ?? null,
        targetRaise: dealRecord.targetRaise?.toString() ?? null,
        minInvestment: dealRecord.minInvestment?.toString() ?? null,
        targetIrr: dealRecord.targetIrr?.toString() ?? null,
        targetMoic: dealRecord.targetMoic?.toString() ?? null,
        // Deal is "curated" if user has an invite with curation note, or a permission note
        // Prioritize invite curation note over permission note
        isCurated:
          (inviteNotes.has(dealRecord.id) &&
            !!inviteNotes.get(dealRecord.id)) ||
          (permissionNotes.has(dealRecord.id) &&
            !!permissionNotes.get(dealRecord.id)),
        curationNote:
          inviteNotes.get(dealRecord.id) ??
          permissionNotes.get(dealRecord.id) ??
          null,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        sectors,
      },
      clearanceStatus,
    };
  } catch (error) {
    console.error("Error fetching marketplace deals:", error);
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
      filters: {
        sectors: [],
      },
      clearanceStatus: null,
    };
  }
};

/**
 * Get all non-draft deals with basic fields for admin views.
 */
export const getAllActiveDealsBasic = async () => {
  try {
    const records = await db
      .select({
        id: deal.id,
        name: deal.name,
        status: deal.status,
        createdAt: deal.createdAt,
      })
      .from(deal)
      .where(ne(deal.status, "draft"))
      .orderBy(desc(deal.createdAt));

    return records;
  } catch (error) {
    console.error("Error fetching active deals:", error);
    return [];
  }
};

/**
 * Get deal detail for view with user-specific data (interest, investment, permissions)
 * @param dealId The deal ID or slug
 * @param userId The user ID
 * @returns Deal detail with permissions, user interest, and investment data
 */
export const getDealForView = async ({
  dealId,
  userId,
  isAdmin

}: {
  dealId: string;
  userId: string;
  isAdmin: boolean

}) => {
  try {
    // Fetch the deal by ID or slug
    const [dealRecord] = await db
      .select()
      .from(deal)
      .where(or(eq(deal.id, dealId), eq(deal.slug, dealId)))
      .limit(1);

    if (!dealRecord) {
      return {
        success: false as const,
        error: "NOT_FOUND" as const,
        deal: null,
        permissions: null,
        clearanceStatus: null,
        userInterest: null,
        userInvestment: null,
        curationNote: null,
      };
    }

    // Exclude draft deals (except for admins)
    if (dealRecord.status === "draft" && !isAdmin) {
      return {
        success: false as const,
        error: "NOT_FOUND" as const,
        deal: null,
        permissions: null,
        clearanceStatus: null,
        userInterest: null,
        userInvestment: null,
        curationNote: null,
      };
    }

    const actualDealId = dealRecord.id;

    // Check access based on vehiclePermission (admins bypass this check)
    let permissions = {
      canViewTeaser: isAdmin,
      canViewDocuments: isAdmin,
      canExpressInterest: isAdmin,
      canInvest: isAdmin,
    };
    let clearanceStatus: string | null = null;
    let curationNote: string | null = null;

    // Parallelize independent queries for non-admin users
    if (!isAdmin) {
      // Clearance and permission queries can run in parallel
      const [clearanceResult, permissionResult] = await Promise.all([
        db
          .select({ status: investorClearance.status })
          .from(investorClearance)
          .where(eq(investorClearance.userId, userId))
          .orderBy(desc(investorClearance.createdAt))
          .limit(1)
          .then(([record]) => record),
        db
          .select({
            canViewTeaser: vehiclePermission.canViewTeaser,
            canViewDocuments: vehiclePermission.canViewDocuments,
            canExpressInterest: vehiclePermission.canExpressInterest,
            canInvest: vehiclePermission.canInvest,
            notes: vehiclePermission.notes,
          })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.userId, userId),
              eq(vehiclePermission.dealId, actualDealId),
              isNull(vehiclePermission.revokedAt)
            )
          )
          .limit(1)
          .then(([record]) => record),
      ]);

      clearanceStatus = clearanceResult?.status ?? null;
      const isCleared =
        clearanceStatus === "cleared" ||
        clearanceStatus === "cleared_with_conditions";

      if (!isCleared) {
        return {
          success: false as const,
          error: "FORBIDDEN" as const,
          deal: null,
          permissions: null,
          clearanceStatus,
          userInterest: null,
          userInvestment: null,
          curationNote: null,
        };
      }

      if (!permissionResult || !permissionResult.canViewTeaser) {
        return {
          success: false as const,
          error: "FORBIDDEN" as const,
          deal: null,
          permissions: null,
          clearanceStatus,
          userInterest: null,
          userInvestment: null,
          curationNote: null,
        };
      }

      permissions = {
        canViewTeaser: permissionResult.canViewTeaser,
        canViewDocuments: permissionResult.canViewDocuments,
        canExpressInterest: permissionResult.canExpressInterest,
        canInvest: permissionResult.canInvest,
      };
      curationNote = permissionResult.notes;
    }

    // Parallelize interest and investment queries (independent operations)
    const [userInterestResult, userInvestmentResult] = await Promise.all([
      db
        .select()
        .from(dealInterest)
        .where(
          and(
            eq(dealInterest.dealId, actualDealId),
            eq(dealInterest.userId, userId)
          )
        )
        .limit(1)
        .then(([record]) => record ?? null),
      db
        .select()
        .from(investment)
        .where(
          and(
            eq(investment.dealId, actualDealId),
            eq(investment.userId, userId)
          )
        )
        .limit(1)
        .then(([record]) => record ?? null),
    ]);

    return {
      success: true as const,
      deal: {
        ...dealRecord,
        targetRaise: dealRecord.targetRaise?.toString() ?? null,
        minInvestment: dealRecord.minInvestment?.toString() ?? null,
        targetIrr: dealRecord.targetIrr?.toString() ?? null,
        targetMoic: dealRecord.targetMoic?.toString() ?? null,
        launchDate: dealRecord.launchDate?.toISOString() ?? null,
        closeDate: dealRecord.closeDate?.toISOString() ?? null,
        createdAt: dealRecord.createdAt.toISOString(),
        updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
      },
      permissions,
      clearanceStatus,
      userInterest: userInterestResult
        ? {
          ...userInterestResult,
          proposedAmount:
            userInterestResult.proposedAmount?.toString() ?? null,
          createdAt: userInterestResult.createdAt.toISOString(),
          updatedAt: userInterestResult.updatedAt?.toISOString() ?? null,
        }
        : null,
      userInvestment: userInvestmentResult
        ? {
          ...userInvestmentResult,
          committedAmount:
            userInvestmentResult.committedAmount.toString(),
          fundedAmount:
            userInvestmentResult.fundedAmount?.toString() ?? null,
          currentValue:
            userInvestmentResult.currentValue?.toString() ?? null,
          distributions:
            userInvestmentResult.distributions?.toString() ?? null,
          ownershipPercentage:
            userInvestmentResult.ownershipPercentage?.toString() ?? null,
          committedDate:
            userInvestmentResult.committedDate.toISOString(),
        }
        : null,
      curationNote,
    };
  } catch (error) {
    console.error("Error fetching deal for view:", error);
    return {
      success: false as const,
      error: "INTERNAL_ERROR" as const,
      deal: null,
      permissions: null,
      clearanceStatus: null,
      userInterest: null,
      userInvestment: null,
      curationNote: null,
    };
  }
};

/**
 * Get full compliance details for an investor used by the admin compliance page.
 *
 * Returns:
 * - investor: basic investor info with current clearance
 * - onboarding: latest onboarding record with related data (owners, signatories, attestations, documents, edit history)
 * - clearanceHistory: all clearance records (latest first)
 * - permissions: active vehicle permissions with deal names and granter names
 * - auditLog: recent audit log entries involving this investor
 */
export const getInvestorComplianceDetails = async (userId: string) => {
  try {
    // Get user details
    const [investor] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        isOnboardingCompleted: user.isOnboardingCompleted,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!investor) {
      return {
        success: false as const,
        investor: null,
        onboarding: null,
        clearanceHistory: [],
        permissions: [],
        auditLog: [],
      };
    }

    // Get latest onboarding record
    const [onboardingData] = await db
      .select()
      .from(onboarding)
      .where(eq(onboarding.userId, userId))
      .orderBy(desc(onboarding.createdAt))
      .limit(1);

    // Related onboarding data
    let owners: (typeof beneficialOwner.$inferSelect)[] = [];
    let signatories: (typeof authorizedSignatory.$inferSelect)[] = [];
    let attestations: (typeof kycAttestation.$inferSelect)[] = [];
    let documents: (typeof onboardingDocument.$inferSelect)[] = [];
    let editHistory: (typeof onboardingEditHistory.$inferSelect)[] = [];

    if (onboardingData) {
      owners = await db
        .select()
        .from(beneficialOwner)
        .where(eq(beneficialOwner.onboardingId, onboardingData.id))
        .orderBy(beneficialOwner.createdAt);

      signatories = await db
        .select()
        .from(authorizedSignatory)
        .where(eq(authorizedSignatory.onboardingId, onboardingData.id))
        .orderBy(authorizedSignatory.createdAt);

      attestations = await db
        .select()
        .from(kycAttestation)
        .where(eq(kycAttestation.onboardingId, onboardingData.id))
        .orderBy(kycAttestation.createdAt);

      documents = await db
        .select()
        .from(onboardingDocument)
        .where(eq(onboardingDocument.onboardingId, onboardingData.id))
        .orderBy(desc(onboardingDocument.uploadedAt));

      editHistory = await db
        .select()
        .from(onboardingEditHistory)
        .where(eq(onboardingEditHistory.onboardingId, onboardingData.id))
        .orderBy(desc(onboardingEditHistory.editedAt))
        .limit(50);
    }

    // Clearance history (latest first)
    const clearanceHistory = await db
      .select({
        id: investorClearance.id,
        status: investorClearance.status,
        conditions: investorClearance.conditions,
        conditionsJson: investorClearance.conditionsJson,
        clearedBy: investorClearance.clearedBy,
        clearedAt: investorClearance.clearedAt,
        notes: investorClearance.notes,
        investorVisibleNotes: investorClearance.investorVisibleNotes,
        createdAt: investorClearance.createdAt,
      })
      .from(investorClearance)
      .where(eq(investorClearance.userId, userId))
      .orderBy(desc(investorClearance.createdAt));

    const currentClearance = clearanceHistory[0] || null;

    // Active vehicle permissions with deal and user names
    const permissionsRaw = await db
      .select({
        id: vehiclePermission.id,
        dealId: vehiclePermission.dealId,
        canViewTeaser: vehiclePermission.canViewTeaser,
        canViewDocuments: vehiclePermission.canViewDocuments,
        canExpressInterest: vehiclePermission.canExpressInterest,
        canInvest: vehiclePermission.canInvest,
        grantedAt: vehiclePermission.grantedAt,
        grantedBy: vehiclePermission.grantedBy,
      })
      .from(vehiclePermission)
      .where(
        and(
          eq(vehiclePermission.userId, userId),
          isNull(vehiclePermission.revokedAt),
        ),
      )
      .orderBy(desc(vehiclePermission.grantedAt));

    const permissions = await Promise.all(
      permissionsRaw.map(async (perm) => {
        const [dealInfo] = await db
          .select({ name: deal.name })
          .from(deal)
          .where(eq(deal.id, perm.dealId))
          .limit(1);

        let grantedByName: string | null = null;
        if (perm.grantedBy) {
          const [granter] = await db
            .select({ name: user.name })
            .from(user)
            .where(eq(user.id, perm.grantedBy))
            .limit(1);
          grantedByName = granter?.name || null;
        }

        return {
          ...perm,
          dealName: dealInfo?.name || "Unknown Deal",
          grantedByName,
        };
      }),
    );

    // Audit log entries involving this investor
    const auditLogEntries = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        previousValue: auditLog.previousValue,
        newValue: auditLog.newValue,
        metadata: auditLog.metadata,
        userId: auditLog.userId,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(
        or(
          eq(auditLog.targetId, userId),
          sql`${auditLog.targetId} LIKE ${userId + ":%"}`,
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    const auditLogWithNames = await Promise.all(
      auditLogEntries.map(async (entry) => {
        let performedByName = "System";
        if (entry.userId) {
          const [performer] = await db
            .select({ name: user.name })
            .from(user)
            .where(eq(user.id, entry.userId))
            .limit(1);
          performedByName = performer?.name || "Unknown User";
        }
        return {
          ...entry,
          performedByName,
        };
      }),
    );

    const investorWithClearance = {
      ...investor,
      clearance: currentClearance,
    };

    const onboardingWithRelations = onboardingData
      ? {
        ...onboardingData,
        beneficialOwners: owners,
        authorizedSignatories: signatories,
        attestations,
        documents,
        editHistory,
      }
      : null;

    return {
      success: true as const,
      investor: investorWithClearance,
      onboarding: onboardingWithRelations,
      clearanceHistory,
      permissions,
      auditLog: auditLogWithNames,
    };
  } catch (error) {
    console.error("Error fetching investor compliance details:", error);
    return {
      success: false as const,
      investor: null,
      onboarding: null,
      clearanceHistory: [],
      permissions: [],
      auditLog: [],
    };
  }
};

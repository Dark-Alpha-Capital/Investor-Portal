import { db } from ".";
import {
  user,
  onboarding,
  onboardingDocument,
  onboardingEditHistory,
  deal,
  dealInterest,
  investment,
  investorClearance,
  vehiclePermission,
  beneficialOwner,
  authorizedSignatory,
  kycAttestation,
  auditLog,
  knowledgeRequest,
  knowledgeAnswer,
  dealDocument,
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
  count,
} from "drizzle-orm";
import {
  MARKETPLACE_VISIBLE_STATUSES,
  isAccessibleDealDetail,
  isOpenForCommitments,
} from "./deal-marketplace";

/**
 * Get paginated deals for admin with filtering
 * @param page Page number (1-indexed)
 * @param limit Number of results per page
 * @param search Optional search term for name, description, or sector
 * @param status Optional status filter
 * @returns Paginated list of deals with formatted dates and pagination info
 */
export const getAdminDeals = async ({
  page,
  limit,
  search,
  status,
}: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [];

    // Add search filter (SQLite/D1: no ILIKE — use lower() + LIKE)
    if (search && search.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`lower(${deal.name}) like ${pattern}`,
          sql`lower(coalesce(${deal.description}, '')) like ${pattern}`,
          sql`lower(coalesce(${deal.sector}, '')) like ${pattern}`,
        )!,
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
      revenue: dealRecord.revenue?.toString() ?? null,
      ebitda: dealRecord.ebitda?.toString() ?? null,
      purchasePrice: dealRecord.purchasePrice?.toString() ?? null,
      debt: dealRecord.debt?.toString() ?? null,
      sponsorEquity: dealRecord.sponsorEquity?.toString() ?? null,
      lpEquity: dealRecord.lpEquity?.toString() ?? null,
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
 * Active compliance invitations (vehicle_permission) for a deal, with investor info.
 */
export const getDealInvitationsWithUsersByDealId = async (dealId: string) => {
  try {
    return await db
      .select({
        id: vehiclePermission.id,
        userId: vehiclePermission.userId,
        accessLevel: vehiclePermission.accessLevel,
        notes: vehiclePermission.notes,
        grantedAt: vehiclePermission.grantedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isOnboardingCompleted: user.isOnboardingCompleted,
        },
      })
      .from(vehiclePermission)
      .innerJoin(user, eq(user.id, vehiclePermission.userId))
      .where(
        and(
          eq(vehiclePermission.dealId, dealId),
          isNull(vehiclePermission.revokedAt),
        ),
      )
      .orderBy(desc(vehiclePermission.grantedAt));
  } catch (error) {
    console.error("Error fetching deal invitations with users:", error);
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
      getDealInvitationsWithUsersByDealId(dealId),
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
      revenue: dealRecord.revenue?.toString() ?? null,
      ebitda: dealRecord.ebitda?.toString() ?? null,
      purchasePrice: dealRecord.purchasePrice?.toString() ?? null,
      debt: dealRecord.debt?.toString() ?? null,
      sponsorEquity: dealRecord.sponsorEquity?.toString() ?? null,
      lpEquity: dealRecord.lpEquity?.toString() ?? null,
      launchDate: dealRecord.launchDate?.toISOString() ?? null,
      closeDate: dealRecord.closeDate?.toISOString() ?? null,
      createdAt: dealRecord.createdAt.toISOString(),
      updatedAt: dealRecord.updatedAt?.toISOString() ?? null,
    };

    // Transform invites (compliance vehicle_permission rows)
    const transformedInvites = invites.map((invite) => ({
      ...invite,
      grantedAt: invite.grantedAt.toISOString(),
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
 * Get marketplace deals for a specific user.
 *
 * Two orthogonal gates (investors):
 * 1. Deal lifecycle — {@link isVisibleInMarketplace} (MVP: live only)
 * 2. Investor access — approved + active invitation
 *
 * Admins see all non-draft deals (ops view).
 */
export const getMarketplaceDeals = async ({
  userId,
  page,
  limit,
  search,
  status,
  sector,
  geography,
  dealType,
}: {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sector?: string;
  geography?: string;
  dealType?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    const [userRecord] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const isAdmin = userRecord?.role === "admin";

    const [clearanceRecord] = await db
      .select({ status: investorClearance.status })
      .from(investorClearance)
      .where(eq(investorClearance.userId, userId))
      .orderBy(desc(investorClearance.createdAt))
      .limit(1);

    const clearanceStatus = clearanceRecord?.status ?? null;
    const isApproved = clearanceStatus === "approved";

    let invitedDealIds: string[] = [];
    let invitationNotes = new Map<string, string | null>();

    if (isApproved || isAdmin) {
      const invitations = await db
        .select({
          dealId: vehiclePermission.dealId,
          notes: vehiclePermission.notes,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, userId),
            isNull(vehiclePermission.revokedAt)
          )
        );

      invitedDealIds = invitations.map((i) => i.dealId);
      invitationNotes = new Map(
        invitations.map((i) => [i.dealId, i.notes ?? null])
      );
    }

    // Investors: marketed deals only. Admins: any non-draft.
    const baseConditions = isAdmin
      ? [ne(deal.status, "draft")]
      : [inArray(deal.status, [...MARKETPLACE_VISIBLE_STATUSES])];

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

    // Investor marketplace is live-only; ignore non-live status filters.
    if (isAdmin && status && status !== "all") {
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

    if (sector && sector !== "all") {
      baseConditions.push(ilike(deal.sector, sector));
    }

    if (geography && geography !== "all") {
      baseConditions.push(ilike(deal.geography, geography));
    }

    if (dealType && dealType !== "all") {
      baseConditions.push(ilike(deal.dealType, dealType));
    }

    const emptyFilters = {
      sectors: [] as string[],
      geographies: [] as string[],
      dealTypes: [] as string[],
    };

    let whereCondition;

    if (isAdmin) {
      whereCondition = and(...baseConditions);
    } else if (isApproved) {
      if (invitedDealIds.length === 0) {
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
          filters: emptyFilters,
          clearanceStatus,
        };
      }

      whereCondition = and(
        ...baseConditions,
        inArray(deal.id, invitedDealIds)
      );
    } else {
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
        filters: emptyFilters,
        clearanceStatus,
      };
    }

    const filterScopeWhere = isAdmin
      ? ne(deal.status, "draft")
      : and(
          inArray(deal.status, [...MARKETPLACE_VISIBLE_STATUSES]),
          inArray(deal.id, invitedDealIds),
        );

    const [countResult, deals, filterRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(deal)
        .where(whereCondition)
        .then(([row]) => row),
      db
        .select()
        .from(deal)
        .where(whereCondition)
        .orderBy(desc(deal.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          sector: deal.sector,
          geography: deal.geography,
          dealType: deal.dealType,
        })
        .from(deal)
        .where(filterScopeWhere),
    ]);

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    const uniqueSorted = (values: Array<string | null>) =>
      [...new Set(values.filter((v): v is string => !!v?.trim()))].sort((a, b) =>
        a.localeCompare(b),
      );

    const sectors = uniqueSorted(filterRows.map((r) => r.sector));
    const geographies = uniqueSorted(filterRows.map((r) => r.geography));
    const dealTypes = uniqueSorted(filterRows.map((r) => r.dealType));

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
        isCurated:
          invitationNotes.has(dealRecord.id) &&
          !!invitationNotes.get(dealRecord.id),
        curationNote: invitationNotes.get(dealRecord.id) ?? null,
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
        geographies,
        dealTypes,
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
        geographies: [],
        dealTypes: [],
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

    // Deal lifecycle gate (orthogonal to invitation). Admins bypass.
    if (!isAdmin && !isAccessibleDealDetail(dealRecord)) {
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

    // Check access based on deal invitation (admins bypass)
    // canInvest also requires deal lifecycle open for commitments (live).
    const dealOpenForCommitments = isOpenForCommitments(dealRecord);
    let permissions = {
      canViewTeaser: isAdmin,
      canViewDocuments: isAdmin,
      canExpressInterest: isAdmin,
      canInvest: isAdmin && dealOpenForCommitments,
      accessLevel: (isAdmin ? "data_room" : null) as
        | "teaser"
        | "data_room"
        | null,
      dataRoomRequestedAt: null as string | null,
    };
    let clearanceStatus: string | null = null;
    let curationNote: string | null = null;

    if (!isAdmin) {
      const [clearanceResult, invitationResult] = await Promise.all([
        db
          .select({ status: investorClearance.status })
          .from(investorClearance)
          .where(eq(investorClearance.userId, userId))
          .orderBy(desc(investorClearance.createdAt))
          .limit(1)
          .then(([record]) => record),
        db
          .select({
            accessLevel: vehiclePermission.accessLevel,
            notes: vehiclePermission.notes,
            dataRoomRequestedAt: vehiclePermission.dataRoomRequestedAt,
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
      const isApproved = clearanceStatus === "approved";

      if (!isApproved) {
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

      if (!invitationResult) {
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

      const isDataRoom = invitationResult.accessLevel === "data_room";
      permissions = {
        canViewTeaser: true,
        canViewDocuments: isDataRoom,
        canExpressInterest: isDataRoom,
        canInvest: isDataRoom && dealOpenForCommitments,
        accessLevel: invitationResult.accessLevel as "teaser" | "data_room",
        dataRoomRequestedAt:
          invitationResult.dataRoomRequestedAt?.toISOString() ?? null,
      };
      curationNote = invitationResult.notes;
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
        revenue: dealRecord.revenue?.toString() ?? null,
        ebitda: dealRecord.ebitda?.toString() ?? null,
        purchasePrice: dealRecord.purchasePrice?.toString() ?? null,
        debt: dealRecord.debt?.toString() ?? null,
        sponsorEquity: dealRecord.sponsorEquity?.toString() ?? null,
        lpEquity: dealRecord.lpEquity?.toString() ?? null,
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
 * - permissions: active deal invitations with deal names, access level, and participation
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

    // Active deal invitations with deal and user names
    const permissionsRaw = await db
      .select({
        id: vehiclePermission.id,
        dealId: vehiclePermission.dealId,
        accessLevel: vehiclePermission.accessLevel,
        grantedAt: vehiclePermission.grantedAt,
        grantedBy: vehiclePermission.grantedBy,
        notes: vehiclePermission.notes,
        dataRoomRequestedAt: vehiclePermission.dataRoomRequestedAt,
        dataRoomRequestMessage: vehiclePermission.dataRoomRequestMessage,
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
        const [dealInfo, interestRow, investmentRow] = await Promise.all([
          db
            .select({ name: deal.name })
            .from(deal)
            .where(eq(deal.id, perm.dealId))
            .limit(1)
            .then((r) => r[0]),
          db
            .select({ status: dealInterest.status })
            .from(dealInterest)
            .where(
              and(
                eq(dealInterest.dealId, perm.dealId),
                eq(dealInterest.userId, userId)
              )
            )
            .limit(1)
            .then((r) => r[0] ?? null),
          db
            .select({ status: investment.status })
            .from(investment)
            .where(
              and(
                eq(investment.dealId, perm.dealId),
                eq(investment.userId, userId)
              )
            )
            .limit(1)
            .then((r) => r[0] ?? null),
        ]);

        let grantedByName: string | null = null;
        if (perm.grantedBy) {
          const [granter] = await db
            .select({ name: user.name })
            .from(user)
            .where(eq(user.id, perm.grantedBy))
            .limit(1);
          grantedByName = granter?.name || null;
        }

        // Derive participation inline (same rules as apps/web/lib/participation.ts)
        let participationStatus:
          | "no_response"
          | "interested"
          | "committed"
          | "funded"
          | "declined" = "no_response";
        if (investmentRow) {
          participationStatus =
            investmentRow.status === "funded" ? "funded" : "committed";
        } else if (interestRow) {
          participationStatus =
            interestRow.status === "pass" ? "declined" : "interested";
        }

        return {
          ...perm,
          dealName: dealInfo?.name || "Unknown Deal",
          grantedByName,
          participationStatus,
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

export type KnowledgeSearchHit = {
  source: "verified_answer" | "deal_field" | "document";
  title: string;
  snippet: string;
  referenceCode?: string;
  documentId?: string;
  field?: string;
};

function tokenizeQuery(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (tokens.length > 0) {
    return tokens;
  }
  const trimmed = query.trim().toLowerCase();
  return trimmed.length > 0 ? [trimmed] : [];
}

function textMatchesTokens(text: string | null | undefined, tokens: string[]): boolean {
  if (!text || tokens.length === 0) return false;
  const hay = text.toLowerCase();
  return tokens.some((t) => hay.includes(t));
}

/**
 * Search deal knowledge: verified answers, deal fields, document metadata.
 */
export async function searchDealKnowledge({
  dealId,
  query,
  includeDocuments = true,
}: {
  dealId: string;
  query: string;
  includeDocuments?: boolean;
}): Promise<{ found: boolean; hits: KnowledgeSearchHit[]; dealName: string | null }> {
  const tokens = tokenizeQuery(query);
  const hits: KnowledgeSearchHit[] = [];

  const [dealRow] = await db
    .select({
      id: deal.id,
      name: deal.name,
      teaserSummary: deal.teaserSummary,
      description: deal.description,
      investmentThesis: deal.investmentThesis,
      risks: deal.risks,
      sector: deal.sector,
      geography: deal.geography,
      dealType: deal.dealType,
      targetCompany: deal.targetCompany,
      revenue: deal.revenue,
      ebitda: deal.ebitda,
      targetIrr: deal.targetIrr,
      targetMoic: deal.targetMoic,
      holdPeriod: deal.holdPeriod,
    })
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);

  if (!dealRow) {
    return { found: false, hits: [], dealName: null };
  }

  const answered = await db
    .select({
      referenceCode: knowledgeRequest.referenceCode,
      title: knowledgeRequest.title,
      question: knowledgeRequest.question,
      answer: knowledgeAnswer.answer,
    })
    .from(knowledgeRequest)
    .innerJoin(
      knowledgeAnswer,
      eq(knowledgeAnswer.requestId, knowledgeRequest.id)
    )
    .where(
      and(
        eq(knowledgeRequest.dealId, dealId),
        eq(knowledgeRequest.status, "answered"),
        eq(knowledgeAnswer.verified, true)
      )
    )
    .orderBy(desc(knowledgeAnswer.publishedAt))
    .limit(50);

  for (const row of answered) {
    const blob = `${row.title} ${row.question} ${row.answer}`;
    if (tokens.length === 0 || textMatchesTokens(blob, tokens)) {
      hits.push({
        source: "verified_answer",
        title: row.title,
        snippet: row.answer.slice(0, 800),
        referenceCode: row.referenceCode,
      });
    }
  }

  const dealFields: Array<{ field: string; title: string; value: string | null }> = [
    { field: "name", title: "Deal name", value: dealRow.name },
    { field: "teaserSummary", title: "Teaser summary", value: dealRow.teaserSummary },
    { field: "description", title: "Description", value: dealRow.description },
    { field: "investmentThesis", title: "Investment thesis", value: dealRow.investmentThesis },
    { field: "risks", title: "Risks", value: dealRow.risks },
    { field: "sector", title: "Sector", value: dealRow.sector },
    { field: "geography", title: "Geography", value: dealRow.geography },
    { field: "dealType", title: "Deal type", value: dealRow.dealType },
    { field: "targetCompany", title: "Target company", value: dealRow.targetCompany },
    {
      field: "financials",
      title: "Financial highlights",
      value: [
        dealRow.revenue != null ? `Revenue: ${dealRow.revenue}` : null,
        dealRow.ebitda != null ? `EBITDA: ${dealRow.ebitda}` : null,
        dealRow.targetIrr != null ? `Target IRR: ${dealRow.targetIrr}%` : null,
        dealRow.targetMoic != null ? `Target MOIC: ${dealRow.targetMoic}x` : null,
        dealRow.holdPeriod ? `Hold period: ${dealRow.holdPeriod}` : null,
      ]
        .filter(Boolean)
        .join("; ") || null,
    },
  ];

  for (const field of dealFields) {
    if (textMatchesTokens(field.value, tokens) || textMatchesTokens(field.title, tokens)) {
      hits.push({
        source: "deal_field",
        title: field.title,
        snippet: (field.value ?? "").slice(0, 800),
        field: field.field,
      });
    }
  }

  if (includeDocuments) {
    const docs = await db
      .select({
        id: dealDocument.id,
        name: dealDocument.name,
        description: dealDocument.description,
        documentCategory: dealDocument.documentCategory,
      })
      .from(dealDocument)
      .where(eq(dealDocument.dealId, dealId))
      .limit(100);

    for (const doc of docs) {
      const blob = `${doc.name} ${doc.description ?? ""} ${doc.documentCategory ?? ""}`;
      if (tokens.length === 0 || textMatchesTokens(blob, tokens)) {
        hits.push({
          source: "document",
          title: doc.name,
          snippet: (doc.description ?? doc.documentCategory ?? "Deal document").slice(0, 400),
          documentId: doc.id,
        });
      }
    }
  }

  // Prefer verified answers, then deal fields, then documents
  const rank = { verified_answer: 0, deal_field: 1, document: 2 } as const;
  hits.sort((a, b) => rank[a.source] - rank[b.source]);

  return {
    found: hits.length > 0,
    hits: hits.slice(0, 20),
    dealName: dealRow.name,
  };
}

export async function createKnowledgeRequest({
  id,
  dealId,
  askedByUserId,
  chatId,
  referenceCode,
  title,
  question,
}: {
  id: string;
  dealId: string;
  askedByUserId: string;
  chatId?: string | null;
  referenceCode: string;
  title: string;
  question: string;
}) {
  const [row] = await db
    .insert(knowledgeRequest)
    .values({
      id,
      dealId,
      askedByUserId,
      chatId: chatId ?? null,
      referenceCode,
      title,
      question,
      status: "open",
    })
    .returning();

  return row;
}

export async function nextKnowledgeReferenceCode(): Promise<string> {
  const [row] = await db
    .select({ total: count() })
    .from(knowledgeRequest);

  const next = (row?.total ?? 0) + 1;
  return `Q-${next}`;
}

export async function listKnowledgeRequestsByDeal({
  dealId,
  status,
}: {
  dealId: string;
  status?: "open" | "answered" | "closed" | "archived";
}) {
  const conditions = [eq(knowledgeRequest.dealId, dealId)];
  if (status) {
    conditions.push(eq(knowledgeRequest.status, status));
  }

  return db
    .select({
      id: knowledgeRequest.id,
      dealId: knowledgeRequest.dealId,
      askedByUserId: knowledgeRequest.askedByUserId,
      askerName: user.name,
      askerEmail: user.email,
      chatId: knowledgeRequest.chatId,
      referenceCode: knowledgeRequest.referenceCode,
      title: knowledgeRequest.title,
      question: knowledgeRequest.question,
      status: knowledgeRequest.status,
      createdAt: knowledgeRequest.createdAt,
      updatedAt: knowledgeRequest.updatedAt,
      answer: knowledgeAnswer.answer,
      answeredByUserId: knowledgeAnswer.answeredByUserId,
      publishedAt: knowledgeAnswer.publishedAt,
    })
    .from(knowledgeRequest)
    .innerJoin(user, eq(user.id, knowledgeRequest.askedByUserId))
    .leftJoin(
      knowledgeAnswer,
      eq(knowledgeAnswer.requestId, knowledgeRequest.id)
    )
    .where(and(...conditions))
    .orderBy(desc(knowledgeRequest.createdAt));
}

export async function getKnowledgeRequestById(requestId: string) {
  const [row] = await db
    .select({
      id: knowledgeRequest.id,
      dealId: knowledgeRequest.dealId,
      askedByUserId: knowledgeRequest.askedByUserId,
      askerName: user.name,
      askerEmail: user.email,
      chatId: knowledgeRequest.chatId,
      referenceCode: knowledgeRequest.referenceCode,
      title: knowledgeRequest.title,
      question: knowledgeRequest.question,
      status: knowledgeRequest.status,
      createdAt: knowledgeRequest.createdAt,
      updatedAt: knowledgeRequest.updatedAt,
      answer: knowledgeAnswer.answer,
      answeredByUserId: knowledgeAnswer.answeredByUserId,
      publishedAt: knowledgeAnswer.publishedAt,
      answerId: knowledgeAnswer.id,
    })
    .from(knowledgeRequest)
    .innerJoin(user, eq(user.id, knowledgeRequest.askedByUserId))
    .leftJoin(
      knowledgeAnswer,
      eq(knowledgeAnswer.requestId, knowledgeRequest.id)
    )
    .where(eq(knowledgeRequest.id, requestId))
    .limit(1);

  return row ?? null;
}

export async function publishKnowledgeAnswer({
  answerId,
  requestId,
  answer,
  answeredByUserId,
}: {
  answerId: string;
  requestId: string;
  answer: string;
  answeredByUserId: string;
}) {
  const now = new Date();

  await db.insert(knowledgeAnswer).values({
    id: answerId,
    requestId,
    answer,
    answeredByUserId,
    verified: true,
    publishedAt: now,
  });

  const [updated] = await db
    .update(knowledgeRequest)
    .set({ status: "answered", updatedAt: now })
    .where(eq(knowledgeRequest.id, requestId))
    .returning();

  return updated;
}

export async function closeKnowledgeRequest(requestId: string) {
  const [updated] = await db
    .update(knowledgeRequest)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(knowledgeRequest.id, requestId))
    .returning();

  return updated ?? null;
}

export async function countOpenKnowledgeRequests(dealId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(knowledgeRequest)
    .where(
      and(
        eq(knowledgeRequest.dealId, dealId),
        eq(knowledgeRequest.status, "open")
      )
    );

  return row?.total ?? 0;
}

export async function getDealNameById(dealId: string): Promise<string | null> {
  const [row] = await db
    .select({ name: deal.name })
    .from(deal)
    .where(eq(deal.id, dealId))
    .limit(1);
  return row?.name ?? null;
}

export async function listAdminUserEmails(): Promise<
  Array<{ id: string; email: string; name: string }>
> {
  return db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.role, "admin"));
}


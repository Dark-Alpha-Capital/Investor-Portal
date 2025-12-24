import { relations } from "drizzle-orm";
import {
  pgTable,
  doublePrecision,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const kyc_status_enum = pgEnum("kyc_status", [
  "review",
  "approved",
  "pending_docs",
  "rejected",
]);

export const document_status_enum = pgEnum("document_status", [
  "pending",
  "approved",
  "rejected",
  "incorrect_doc",
  "needs_revision",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isOnboardingCompleted: boolean("is_onboarding_completed")
    .default(false)
    .notNull(),
  kycStatus: kyc_status_enum("kyc_status").default("review").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  onboardings: many(onboarding),
  // NEW:
  investments: many(investment), // "My Portfolio"
  dealInterests: many(dealInterest), // "My Watchlist"
  dealInvites: many(dealInvite), // "Curated for Me"
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Onboarding status enum
export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "needs_more_info",
]);

// Onboarding table - stores investor questionnaire data
export const onboarding = pgTable(
  "onboarding",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Section 1: Investor / Lender Details
    organizationName: text("organization_name").notNull(),
    primaryContactName: text("primary_contact_name").notNull(),
    primaryContactTitle: text("primary_contact_title"),
    primaryContactEmail: text("primary_contact_email").notNull(),
    primaryContactPhone: text("primary_contact_phone").notNull(),
    capitalProviderType: text("capital_provider_type").notNull(),
    investorType: text("investor_type").notNull(),
    geographicFocus: text("geographic_focus"),

    // Step 2: Accreditation & Status
    accreditationStatus: text("accreditation_status"),
    accreditationMethod: text("accreditation_method"),
    entityTaxId: text("entity_tax_id"), // Tax ID / EIN for entity investors
    entitySignatoryName: text("entity_signatory_name"), // Authorized signatory name
    entitySignatoryTitle: text("entity_signatory_title"), // Authorized signatory title

    // Section 2: Independent Sponsor Fit
    openToEmergingSponsor: text("open_to_emerging_sponsor").notNull(),
    minimumRequirements: text("minimum_requirements"),
    priorDealAttribution: text("prior_deal_attribution").notNull(),
    priorDealAttributionExplanation: text("prior_deal_attribution_explanation"),

    // Section 3: NDAs & Confidentiality
    ndaPreference: text("nda_preference").notNull(),
    ndaLimitations: text("nda_limitations"),

    // Section 4: Process & Timing
    timingToLOI: text("timing_to_loi").notNull(),
    timingToCommitment: text("timing_to_commitment").notNull(),
    timingDrivers: text("timing_drivers"),

    // Section 5: Economics
    economicsDescription: text("economics_description").notNull(),

    // Section 6: Governance & Control
    preferredRole: text("preferred_role").notNull(),
    governanceExpectations: text("governance_expectations"),

    // Section 7: Support Letters (arrays stored as JSONB)
    provideSupportLetter: text("provide_support_letter").notNull(),
    joinBrokerConversations: text("join_broker_conversations").notNull(),
    supportLetterStages: jsonb("support_letter_stages")
      .$type<string[]>()
      .notNull(),

    // Section 8: Communication Preferences (arrays stored as JSONB)
    receiveUpdates: text("receive_updates").notNull(),
    updateFrequency: text("update_frequency"),
    updateFormat: jsonb("update_format").$type<string[]>(),
    industryPreferences: text("industry_preferences"),

    // Section 9: Investment Mandate - Size & Structure (arrays stored as JSONB)
    equityCheckSize: text("equity_check_size").notNull(),
    enterpriseValueRange: text("enterprise_value_range"),
    ebitdaRange: text("ebitda_range"),
    preferredOwnership: text("preferred_ownership").notNull(),
    typicalHoldPeriod: text("typical_hold_period"),
    transactionTypes: jsonb("transaction_types").$type<string[]>().notNull(),
    leverageTolerance: text("leverage_tolerance"),

    // Section 10: Investment Mandate - Company Profile
    revenueCharacteristics: text("revenue_characteristics").notNull(),
    customerConcentration: text("customer_concentration"),
    marginsAndCashFlow: text("margins_and_cash_flow"),
    assetProfile: text("asset_profile").notNull(),
    managementInvolvement: text("management_involvement"),

    // Section 11: Sectors & Themes
    sectorsOfInterest: text("sectors_of_interest").notNull(),
    sectorsToAvoid: text("sectors_to_avoid"),
    dealSizeThresholds: text("deal_size_thresholds"),
    specificThemes: text("specific_themes"),

    // Step 5: Legal & E-Sign
    legalDocumentsAcknowledged: boolean("legal_documents_acknowledged").default(false),
    electronicSignatureName: text("electronic_signature_name"), // Full legal name used for e-signature
    electronicSignatureDate: text("electronic_signature_date"), // Date of e-signature

    // Status and metadata
    status: onboardingStatusEnum("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by"), // Admin user ID who reviewed
    reviewNotes: text("review_notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("onboarding_userId_idx").on(table.userId),
    index("onboarding_status_idx").on(table.status),
    index("onboarding_submittedAt_idx").on(table.submittedAt),
  ]
);

// Onboarding document table - stores KYC document metadata
export const onboardingDocument = pgTable(
  "onboarding_document",
  {
    id: text("id").primaryKey(),
    onboardingId: text("onboarding_id")
      .notNull()
      .references(() => onboarding.id, { onDelete: "cascade" }),

    // Document type identifier (matches KycData field names)
    documentType: text("document_type").notNull(), // e.g., "identification", "w9OrW8BEN", etc.

    // File metadata
    fileName: text("file_name").notNull(),
    fileSize: text("file_size").notNull(), // Stored as string to handle large numbers
    fileType: text("file_type").notNull(), // MIME type
    fileUrl: text("file_url"), // URL to stored file (S3, etc.)
    filePath: text("file_path"), // Local file path if stored on server

    // Additional metadata
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),

    // Document review status
    status: document_status_enum("status").default("pending").notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by"), // Admin user ID who reviewed

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("onboarding_document_onboardingId_idx").on(table.onboardingId),
    index("onboarding_document_documentType_idx").on(table.documentType),
  ]
);

// Relations
export const onboardingRelations = relations(onboarding, ({ one, many }) => ({
  user: one(user, {
    fields: [onboarding.userId],
    references: [user.id],
  }),
  documents: many(onboardingDocument),
}));

export const onboardingDocumentRelations = relations(
  onboardingDocument,
  ({ one }) => ({
    onboarding: one(onboarding, {
      fields: [onboardingDocument.onboardingId],
      references: [onboarding.id],
    }),
  })
);

// 1. Status of the Deal itself (Admin controlled)
export const deal_status_enum = pgEnum("deal_status", [
  "draft", // Internal only
  "coming_soon", // Visible, no docs yet
  "live", // Open for investment
  "closing", // Finalizing
  "funded", // Active / Operating
  "exited", // Sold / IPO
  "cancelled",
]);

// 2. Visibility Level (For curation)
export const deal_visibility_enum = pgEnum("deal_visibility", [
  "public", // All registered users can see
  "accredited", // Only users with accredited status
  "invite_only", // Strictly curated (requires an entry in deal_invite)
]);

// 3. Status of a specific User's Investment
export const investment_status_enum = pgEnum("investment_status", [
  "committed", // Signed docs, money not wired yet
  "active", // Money wired, currently deployed
  "transferred", // Sold to someone else
  "liquidated", // Deal exited, money returned
  "written_off", // Loss
]);

// 4. User's interest level in a prospective deal
export const interest_status_enum = pgEnum("interest_status", [
  "interested", // "I want to know more"
  "soft_committed", // "Put me down for $50k"
  "pass", // "Not for me"
  "meeting_requested",
]);

// --- A. THE DEAL TABLE (Prospective & Active) ---
export const deal = pgTable("deal", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  slug: text("slug").unique(), // For pretty URLs /deals/project-alpha
  description: text("description"),
  teaserSummary: text("teaser_summary"), // Short text for card view

  sector: text("sector"),
  geography: text("geography"),
  dealType: text("deal_type"), // e.g., "Equity", "Debt", "Real Estate"

  // Financial Highlights (For the Deal Card)
  targetRaise: doublePrecision("target_raise"),
  minInvestment: doublePrecision("min_investment"),
  targetIrr: doublePrecision("target_irr"), // e.g. 15.50
  targetMoic: doublePrecision("target_moic"), // e.g. 2.50

  // State
  status: deal_status_enum("status").default("draft").notNull(),
  visibility: deal_visibility_enum("visibility")
    .default("invite_only")
    .notNull(),

  coverImageUrl: text("cover_image_url"),

  launchDate: timestamp("launch_date"),
  closeDate: timestamp("close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const dealInvite = pgTable(
  "deal_invite",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    curationNote: text("curation_note"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("deal_invite_user_idx").on(t.userId),
    index("deal_invite_deal_idx").on(t.dealId),
  ]
);

// --- C. PROSPECTIVE INTEREST (The Marketplace Workflow) ---
// Tracks when a user clicks "I'm Interested" or requests docs
export const dealInterest = pgTable("deal_interest", {
  id: text("id").primaryKey(),
  dealId: text("deal_id")
    .notNull()
    .references(() => deal.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  status: interest_status_enum("status").default("interested").notNull(),
  proposedAmount: doublePrecision("proposed_amount"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- D. CURRENT INVESTMENTS (The Portfolio/Holdings) ---
// This is the source of truth for "My Portfolio"
export const investment = pgTable("investment", {
  id: text("id").primaryKey(),
  dealId: text("deal_id")
    .notNull()
    .references(() => deal.id, { onDelete: "restrict" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),

  // The "Commitment" - What they signed for
  committedAmount: doublePrecision("committed_amount").notNull(),
  committedDate: timestamp("committed_date").notNull(),

  // The "Funded" - What they actually wired
  fundedAmount: doublePrecision("funded_amount").default(0),

  // Metrics for Dashboard (Calculated periodically via admin/script)
  currentValue: doublePrecision("current_value"), // NAV
  distributions: doublePrecision("distributions").default(0), // Cash returned

  status: investment_status_enum("status").default("active").notNull(),

  // Ownership specific
  ownershipPercentage: doublePrecision("ownership_percentage"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- E. INVESTMENT DOCUMENTS (K-1s, Quarterly Reports, etc.) ---
// Documents linked to investments (tax forms, reports, statements)
export const investmentDocument = pgTable(
  "investment_document",
  {
    id: text("id").primaryKey(),
    investmentId: text("investment_id")
      .notNull()
      .references(() => investment.id, { onDelete: "cascade" }),

    // Document type
    documentType: text("document_type").notNull(), // e.g., "k1", "quarterly_report", "annual_report", "tax_statement"

    // Document metadata
    fileName: text("file_name").notNull(),
    fileSize: text("file_size").notNull(),
    fileType: text("file_type").notNull(), // MIME type
    fileUrl: text("file_url"), // URL to stored file (S3, etc.)
    filePath: text("file_path"), // Local file path if stored on server

    // Period information (for reports)
    periodStart: timestamp("period_start"), // e.g., Q1 2024 start date
    periodEnd: timestamp("period_end"), // e.g., Q1 2024 end date
    year: text("year"), // e.g., "2024" for annual documents

    // Additional metadata
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("investment_document_investmentId_idx").on(table.investmentId),
    index("investment_document_documentType_idx").on(table.documentType),
    index("investment_document_year_idx").on(table.year),
  ]
);

// Add these to your existing 'relations' block

export const dealRelations = relations(deal, ({ many }) => ({
  investments: many(investment), // Who invested?
  interests: many(dealInterest), // Who is interested?
  invites: many(dealInvite), // Who is allowed to see?
}));

export const investmentRelations = relations(investment, ({ one, many }) => ({
  user: one(user, {
    fields: [investment.userId],
    references: [user.id],
  }),
  deal: one(deal, {
    fields: [investment.dealId],
    references: [deal.id],
  }),
  documents: many(investmentDocument), // Documents linked to this investment
}));

export const investmentDocumentRelations = relations(
  investmentDocument,
  ({ one }) => ({
    investment: one(investment, {
      fields: [investmentDocument.investmentId],
      references: [investment.id],
    }),
  })
);

export const dealInterestRelations = relations(dealInterest, ({ one }) => ({
  user: one(user, {
    fields: [dealInterest.userId],
    references: [user.id],
  }),
  deal: one(deal, {
    fields: [dealInterest.dealId],
    references: [deal.id],
  }),
}));

export const dealInviteRelations = relations(dealInvite, ({ one }) => ({
  user: one(user, {
    fields: [dealInvite.userId],
    references: [user.id],
  }),
  deal: one(deal, {
    fields: [dealInvite.dealId],
    references: [deal.id],
  }),
}));

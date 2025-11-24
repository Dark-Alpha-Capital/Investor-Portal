import { relations } from "drizzle-orm";
import {
  pgTable,
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

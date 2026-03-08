import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  doublePrecision,
  integer,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
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

export const outbox_status_enum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "dispatched",
  "failed",
]);

export const sideEffectOutbox = pgTable(
  "side_effect_outbox",
  {
    id: text("id").primaryKey(),
    topic: text("topic").notNull(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    payload: jsonb("payload").notNull(),
    status: outbox_status_enum("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    dispatchedAt: timestamp("dispatched_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("side_effect_outbox_status_idx").on(table.status),
    index("side_effect_outbox_created_at_idx").on(table.createdAt),
  ]
);

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
  // Portfolio & Deals
  investments: many(investment), // "My Portfolio"
  dealInterests: many(dealInterest), // "My Watchlist"
  dealInvites: many(dealInvite), // "Curated for Me"
  // Compliance Governance
  roleAssignments: many(userRoleAssignment), // Granular RBAC
  clearances: many(investorClearance), // Clearance status
  vehiclePermissions: many(vehiclePermission), // Deal-level access
  bankingVerifications: many(bankingVerification), // Banking changes
  capitalNoticeRecipients: many(capitalNoticeRecipient), // Capital notices
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

// Legal entity type for KYC branching (needed before onboarding table)
export const legal_entity_type_enum = pgEnum("legal_entity_type", [
  "individual", // Individual/HNWI
  "entity", // Corporate/Trust/Partnership
]);

// Onboarding table - stores investor questionnaire data
export const onboarding = pgTable(
  "onboarding",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // ======= COMPLIANCE GOVERNANCE FIELDS =======
    // KYC1: Legal Entity Type (driver field for conditional logic)
    legalEntityType: legal_entity_type_enum("legal_entity_type"), // "individual" or "entity"

    // KYC2: Individual-specific compliance fields
    pepStatus: boolean("pep_status").default(false), // Politically Exposed Person
    pepDetails: text("pep_details"), // If PEP, explain relationship
    sourceOfWealthNarrative: text("source_of_wealth_narrative"), // How wealth was acquired

    // KYC7: Mandatory attestations (tracked with timestamps in kyc_attestation table)
    // These are quick flags, detailed tracking in separate table
    accuracyAttestation: boolean("accuracy_attestation").default(false),
    sanctionsDeclaration: boolean("sanctions_declaration").default(false),
    dataConsent: boolean("data_consent").default(false),

    // ======= ORIGINAL FIELDS =======
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
    legalDocumentsAcknowledged: boolean("legal_documents_acknowledged").default(
      false
    ),
    electronicSignatureName: text("electronic_signature_name"), // Full legal name used for e-signature
    electronicSignatureDate: text("electronic_signature_date"), // Date of e-signature

    // Status and metadata
    status: onboardingStatusEnum("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by"), // Admin user ID who reviewed
    reviewNotes: text("review_notes"),

    // Edit tracking fields
    lastEditedAt: timestamp("last_edited_at"), // When was the onboarding last edited (after initial submission)
    lastEditedBy: text("last_edited_by"), // User ID who made the last edit
    editCount: text("edit_count").default("0"), // Number of times edited after submission
    isEditable: boolean("is_editable").default(true), // Can investor still edit?

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
  editHistory: many(onboardingEditHistory), // Track all field-level changes
  // Compliance governance extensions
  beneficialOwners: many(beneficialOwner), // Repeating UBO entries
  authorizedSignatories: many(authorizedSignatory), // Repeating signatory entries
  kycAttestations: many(kycAttestation), // Mandatory attestations
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

// Onboarding edit history - tracks field-level changes made by investor
export const onboardingEditHistory = pgTable(
  "onboarding_edit_history",
  {
    id: text("id").primaryKey(),
    onboardingId: text("onboarding_id")
      .notNull()
      .references(() => onboarding.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // Who made the edit

    // Change tracking
    fieldName: text("field_name").notNull(), // Name of the field that was changed
    fieldLabel: text("field_label"), // Human-readable label for the field
    previousValue: text("previous_value"), // Value before the change (stringified)
    newValue: text("new_value"), // Value after the change (stringified)

    // Metadata
    editedAt: timestamp("edited_at").defaultNow().notNull(),
    editReason: text("edit_reason"), // Optional reason for the edit

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("onboarding_edit_history_onboardingId_idx").on(table.onboardingId),
    index("onboarding_edit_history_userId_idx").on(table.userId),
    index("onboarding_edit_history_editedAt_idx").on(table.editedAt),
  ]
);

export const onboardingEditHistoryRelations = relations(
  onboardingEditHistory,
  ({ one }) => ({
    onboarding: one(onboarding, {
      fields: [onboardingEditHistory.onboardingId],
      references: [onboarding.id],
    }),
    user: one(user, {
      fields: [onboardingEditHistory.userId],
      references: [user.id],
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

// ============================================================================
// COMPLIANCE GOVERNANCE ENUMS
// ============================================================================

// 5. Granular roles for RBAC (beyond simple admin/user)
export const user_role_enum = pgEnum("user_role", [
  "portal_admin", // Full system access
  "compliance_lead", // Approve/reject KYC, set clearance
  "compliance_reviewer", // Review KYC, recommend decisions
  "ir_lead", // Investor relations lead - publish standard docs
  "ir_publisher", // Publish non-sensitive content
  "head_capital_markets", // Approve high-sensitivity documents
  "coo", // Approve capital notices
  "investor", // Standard investor access
]);

// 6. Investor clearance status (compliance decision)
export const clearance_status_enum = pgEnum("clearance_status", [
  "pending", // Awaiting review
  "cleared", // Full access granted
  "cleared_with_conditions", // Access with restrictions
  "rejected", // Access denied
]);

// Note: legal_entity_type_enum is defined before onboarding table (line ~152)

// 7. Document publish status (governance workflow)
export const document_publish_status_enum = pgEnum("document_publish_status", [
  "draft", // Internal only
  "pending_review", // Submitted for review
  "pending_approval", // Reviewed, awaiting approval
  "published", // Live to investors
  "superseded", // Replaced by newer version
]);

// 9. Document sensitivity level
export const document_sensitivity_enum = pgEnum("document_sensitivity", [
  "standard", // IR Lead can approve
  "high", // Requires Compliance + Head of Capital Markets
]);

// 10. Capital notice types
export const capital_notice_type_enum = pgEnum("capital_notice_type", [
  "capital_call", // Request for funds
  "distribution", // Return of funds
]);

// 11. Capital notice status
export const capital_notice_status_enum = pgEnum("capital_notice_status", [
  "draft", // Being prepared
  "pending_coo_approval", // Awaiting COO sign-off
  "approved", // Ready to send
  "sent", // Distributed to investors
]);

// 12. Banking verification status
export const banking_verification_status_enum = pgEnum(
  "banking_verification_status",
  [
    "pending_callback", // Awaiting out-of-band verification
    "callback_scheduled", // Callback scheduled
    "verified", // Verified via callback
    "rejected", // Verification failed
  ]
);

// 13. Banking request type
export const banking_request_type_enum = pgEnum("banking_request_type", [
  "add", // Add new bank account
  "change", // Change existing account
  "remove", // Remove account
]);

// 17. Audit action types
export const audit_action_enum = pgEnum("audit_action", [
  "user_created",
  "user_updated",
  "role_granted",
  "role_revoked",
  "clearance_set",
  "permission_granted",
  "permission_revoked",
  "document_uploaded",
  "document_published",
  "document_superseded",
  "document_reviewed",
  "capital_notice_created",
  "capital_notice_approved",
  "capital_notice_sent",
  "banking_change_requested",
  "banking_change_verified",
  "banking_change_rejected",
  "login_success",
  "login_failed",
  "session_expired",
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
    uniqueIndex("deal_invite_deal_user_uniq").on(t.dealId, t.userId),
  ]
);

// --- C. PROSPECTIVE INTEREST (The Marketplace Workflow) ---
// Tracks when a user clicks "I'm Interested" or requests docs
export const dealInterest = pgTable(
  "deal_interest",
  {
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
  },
  (table) => [
    uniqueIndex("deal_interest_deal_user_uniq").on(table.dealId, table.userId),
  ]
);

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
  // Compliance governance
  vehiclePermissions: many(vehiclePermission), // Granular access control
  documents: many(dealDocument), // Version-controlled documents
  capitalNotices: many(capitalNotice), // Capital calls/distributions
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

// ============================================================================
// COMPLIANCE GOVERNANCE TABLES
// ============================================================================

// --- AUDIT LOG ---
// Tracks all permission/status changes for compliance audit trail
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // User who performed action (null if system)
    action: audit_action_enum("action").notNull(),
    targetType: text("target_type").notNull(), // e.g., "user", "document", "clearance"
    targetId: text("target_id").notNull(), // ID of the affected entity
    previousValue: jsonb("previous_value"), // State before change
    newValue: jsonb("new_value"), // State after change
    metadata: jsonb("metadata"), // Additional context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_userId_idx").on(table.userId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_targetType_idx").on(table.targetType),
    index("audit_log_targetId_idx").on(table.targetId),
    index("audit_log_createdAt_idx").on(table.createdAt),
  ]
);

// --- USER ROLES (Many-to-Many for Granular RBAC) ---
export const userRoleAssignment = pgTable(
  "user_role_assignment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: user_role_enum("role").notNull(),
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"), // Null if still active
    revokedBy: text("revoked_by").references(() => user.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_role_assignment_userId_idx").on(table.userId),
    index("user_role_assignment_role_idx").on(table.role),
  ]
);

// --- BENEFICIAL OWNERS (Repeating UBO Entries) ---
export const beneficialOwner = pgTable(
  "beneficial_owner",
  {
    id: text("id").primaryKey(),
    onboardingId: text("onboarding_id")
      .notNull()
      .references(() => onboarding.id, { onDelete: "cascade" }),

    // Personal information
    fullName: text("full_name").notNull(),
    dateOfBirth: text("date_of_birth"), // ISO date string
    nationality: text("nationality"),
    countryOfResidence: text("country_of_residence"),

    // Ownership details
    ownershipPercentage: doublePrecision("ownership_percentage").notNull(), // 25%+ threshold
    controlType: text("control_type"), // e.g., "direct", "indirect", "voting_rights"

    // Address
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    stateProvince: text("state_province"),
    postalCode: text("postal_code"),
    country: text("country"),

    // ID document references (stored in onboarding_document)
    idDocumentType: text("id_document_type"), // passport, drivers_license, national_id
    idDocumentNumber: text("id_document_number"),
    idExpiryDate: text("id_expiry_date"),

    // PEP status
    isPep: boolean("is_pep").default(false),
    pepDetails: text("pep_details"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("beneficial_owner_onboardingId_idx").on(table.onboardingId)]
);

// --- AUTHORIZED SIGNATORIES (Repeating Entries) ---
export const authorizedSignatory = pgTable(
  "authorized_signatory",
  {
    id: text("id").primaryKey(),
    onboardingId: text("onboarding_id")
      .notNull()
      .references(() => onboarding.id, { onDelete: "cascade" }),

    // Personal information
    fullName: text("full_name").notNull(),
    title: text("title"), // e.g., "Managing Director", "CEO"
    email: text("email"),
    phone: text("phone"),

    // Authorization scope
    authorizationScope: text("authorization_scope"), // e.g., "full", "limited", "specific_transactions"
    authorizationLimit: doublePrecision("authorization_limit"), // Dollar limit if applicable

    // ID document references
    idDocumentType: text("id_document_type"),
    idDocumentNumber: text("id_document_number"),

    // Board resolution reference
    boardResolutionDate: text("board_resolution_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("authorized_signatory_onboardingId_idx").on(table.onboardingId),
  ]
);

// --- KYC ATTESTATIONS (Mandatory Checkboxes with Timestamps) ---
export const kycAttestation = pgTable(
  "kyc_attestation",
  {
    id: text("id").primaryKey(),
    onboardingId: text("onboarding_id")
      .notNull()
      .references(() => onboarding.id, { onDelete: "cascade" }),

    // Accuracy attestation
    accuracyAttested: boolean("accuracy_attested").default(false).notNull(),
    accuracyAttestedAt: timestamp("accuracy_attested_at"),

    // Sanctions/AML declaration
    sanctionsDeclarationAttested: boolean("sanctions_declaration_attested")
      .default(false)
      .notNull(),
    sanctionsDeclarationAttestedAt: timestamp(
      "sanctions_declaration_attested_at"
    ),

    // Data processing consent
    dataConsentAttested: boolean("data_consent_attested")
      .default(false)
      .notNull(),
    dataConsentAttestedAt: timestamp("data_consent_attested_at"),

    // IP address and user agent for audit
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("kyc_attestation_onboardingId_idx").on(table.onboardingId)]
);

// --- INVESTOR CLEARANCE (Compliance Decisions) ---
export const investorClearance = pgTable(
  "investor_clearance",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    status: clearance_status_enum("status").default("pending").notNull(),

    // Conditions (for "cleared_with_conditions")
    conditions: text("conditions"), // JSON array or text description of conditions
    conditionsJson: jsonb("conditions_json").$type<string[]>(), // Structured conditions

    // Decision metadata
    clearedBy: text("cleared_by").references(() => user.id, {
      onDelete: "set null",
    }),
    clearedAt: timestamp("cleared_at"),
    notes: text("notes"), // Internal notes (not shown to investor)
    investorVisibleNotes: text("investor_visible_notes"), // Notes shown to investor

    // Expiry (if clearance has time limit)
    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("investor_clearance_userId_idx").on(table.userId),
    index("investor_clearance_status_idx").on(table.status),
  ]
);

// --- VEHICLE PERMISSION (Deal-Level Access Control) ---
export const vehiclePermission = pgTable(
  "vehicle_permission",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),

    // Permission level
    canViewTeaser: boolean("can_view_teaser").default(true).notNull(),
    canViewDocuments: boolean("can_view_documents").default(false).notNull(),
    canExpressInterest: boolean("can_express_interest")
      .default(false)
      .notNull(),
    canInvest: boolean("can_invest").default(false).notNull(),

    // Grant metadata
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    notes: text("notes"),

    // Revocation
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by").references(() => user.id, {
      onDelete: "set null",
    }),
    revokeReason: text("revoke_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("vehicle_permission_userId_idx").on(table.userId),
    index("vehicle_permission_dealId_idx").on(table.dealId),
    uniqueIndex("vehicle_permission_user_deal_active_uniq")
      .on(table.userId, table.dealId)
      .where(sql`${table.revokedAt} is null`),
  ]
);

// --- DEAL DOCUMENT (Version-Controlled Documents) ---
export const dealDocument = pgTable(
  "deal_document",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // Document name
    description: text("description"),
    documentCategory: text("document_category"), // e.g., "legal", "financial", "marketing"

    // Current version pointer
    currentVersionId: text("current_version_id"),

    // Sensitivity classification
    sensitivity: document_sensitivity_enum("sensitivity")
      .default("standard")
      .notNull(),

    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("deal_document_dealId_idx").on(table.dealId),
    index("deal_document_category_idx").on(table.documentCategory),
  ]
);

// --- DOCUMENT VERSION (Version History) ---
export const documentVersion = pgTable(
  "document_version",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => dealDocument.id, { onDelete: "cascade" }),

    versionNumber: text("version_number").notNull(), // e.g., "1.0", "1.1", "2.0"

    // File storage
    fileName: text("file_name").notNull(),
    fileSize: text("file_size").notNull(),
    fileType: text("file_type").notNull(),
    filePath: text("file_path"),
    fileUrl: text("file_url"),

    // Workflow status
    status: document_publish_status_enum("status").default("draft").notNull(),

    // Upload metadata
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),

    // Review metadata
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),

    // Approval metadata (for high-sensitivity)
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),

    // Publish metadata
    publishedAt: timestamp("published_at"),
    publishedBy: text("published_by").references(() => user.id, {
      onDelete: "set null",
    }),

    // Superseded metadata
    supersededAt: timestamp("superseded_at"),
    supersededBy: text("superseded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    supersededByVersionId: text("superseded_by_version_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_version_documentId_idx").on(table.documentId),
    index("document_version_status_idx").on(table.status),
  ]
);

// --- DOCUMENT VISIBILITY (Audience Segmentation) ---
export const documentVisibility = pgTable(
  "document_visibility",
  {
    id: text("id").primaryKey(),
    documentVersionId: text("document_version_id")
      .notNull()
      .references(() => documentVersion.id, { onDelete: "cascade" }),

    // Visibility type
    visibilityType: text("visibility_type").notNull(), // "all_investors", "deal_invitees", "specific_users"

    // Specific user IDs (if visibilityType is "specific_users")
    userIds: jsonb("user_ids").$type<string[]>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_visibility_versionId_idx").on(table.documentVersionId),
  ]
);

// --- CAPITAL NOTICE (Capital Calls & Distributions) ---
export const capitalNotice = pgTable(
  "capital_notice",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),

    type: capital_notice_type_enum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),

    // Amount details
    totalAmount: doublePrecision("total_amount").notNull(),
    currency: text("currency").default("USD").notNull(),

    // Due date (for capital calls)
    dueDate: timestamp("due_date"),

    // Distribution date (for distributions)
    distributionDate: timestamp("distribution_date"),

    // Workflow status
    status: capital_notice_status_enum("status").default("draft").notNull(),

    // Creation metadata
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // COO approval
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    approvalNotes: text("approval_notes"),

    // Send metadata
    sentAt: timestamp("sent_at"),
    sentBy: text("sent_by").references(() => user.id, { onDelete: "set null" }),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("capital_notice_dealId_idx").on(table.dealId),
    index("capital_notice_status_idx").on(table.status),
    index("capital_notice_type_idx").on(table.type),
  ]
);

// --- CAPITAL NOTICE RECIPIENT (Tracking per-investor delivery) ---
export const capitalNoticeRecipient = pgTable(
  "capital_notice_recipient",
  {
    id: text("id").primaryKey(),
    noticeId: text("notice_id")
      .notNull()
      .references(() => capitalNotice.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Per-investor amount
    amount: doublePrecision("amount").notNull(),

    // Email delivery tracking
    emailSentAt: timestamp("email_sent_at"),
    emailDeliveredAt: timestamp("email_delivered_at"),
    emailBouncedAt: timestamp("email_bounced_at"),

    // Read receipt
    readAt: timestamp("read_at"),
    readIpAddress: text("read_ip_address"),

    // Response (for capital calls)
    respondedAt: timestamp("responded_at"),
    response: text("response"), // e.g., "will_fund", "need_extension"

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("capital_notice_recipient_noticeId_idx").on(table.noticeId),
    index("capital_notice_recipient_userId_idx").on(table.userId),
  ]
);

// --- BANKING VERIFICATION (High-Risk Change Requests) ---
export const bankingVerification = pgTable(
  "banking_verification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    requestType: banking_request_type_enum("request_type").notNull(),

    // Bank details (consider encryption for production)
    bankName: text("bank_name").notNull(),
    accountHolderName: text("account_holder_name").notNull(),
    accountNumberLast4: text("account_number_last4"), // Only store last 4 digits
    routingNumber: text("routing_number"),
    accountType: text("account_type"), // checking, savings
    swiftBic: text("swift_bic"), // For international

    // Verification workflow
    status: banking_verification_status_enum("status")
      .default("pending_callback")
      .notNull(),

    // Request metadata
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    requestIpAddress: text("request_ip_address"),

    // Callback scheduling
    callbackScheduledAt: timestamp("callback_scheduled_at"),
    callbackPhoneNumber: text("callback_phone_number"), // Pre-verified number to call
    callbackAttempts:
      jsonb("callback_attempts").$type<
        { attemptedAt: string; result: string; notes: string }[]
      >(),

    // Verification completion
    verifiedBy: text("verified_by").references(() => user.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at"),
    verificationNotes: text("verification_notes"),

    // Rejection
    rejectedBy: text("rejected_by").references(() => user.id, {
      onDelete: "set null",
    }),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("banking_verification_userId_idx").on(table.userId),
    index("banking_verification_status_idx").on(table.status),
  ]
);

// --- EVIDENCE EXPORT (Retention Tracking) ---
export const evidenceExport = pgTable(
  "evidence_export",
  {
    id: text("id").primaryKey(),
    exportType: text("export_type").notNull(), // "audit_logs", "kyc_packages", "notices", "read_receipts"
    exportPath: text("export_path").notNull(), // Path to exported file
    exportedBy: text("exported_by").references(() => user.id, {
      onDelete: "set null",
    }),
    exportedAt: timestamp("exported_at").defaultNow().notNull(),

    // Date range covered
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),

    // Retention
    retentionYears: text("retention_years").default("7").notNull(),
    expiresAt: timestamp("expires_at"),

    // File metadata
    fileSize: text("file_size"),
    checksum: text("checksum"), // SHA-256 for integrity verification

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("evidence_export_type_idx").on(table.exportType),
    index("evidence_export_exportedAt_idx").on(table.exportedAt),
  ]
);

// ============================================================================
// COMPLIANCE GOVERNANCE RELATIONS
// ============================================================================

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

export const userRoleAssignmentRelations = relations(
  userRoleAssignment,
  ({ one }) => ({
    user: one(user, {
      fields: [userRoleAssignment.userId],
      references: [user.id],
      relationName: "roleAssignments",
    }),
    grantedByUser: one(user, {
      fields: [userRoleAssignment.grantedBy],
      references: [user.id],
      relationName: "grantedByUser",
    }),
  })
);

export const beneficialOwnerRelations = relations(
  beneficialOwner,
  ({ one }) => ({
    onboarding: one(onboarding, {
      fields: [beneficialOwner.onboardingId],
      references: [onboarding.id],
    }),
  })
);

export const authorizedSignatoryRelations = relations(
  authorizedSignatory,
  ({ one }) => ({
    onboarding: one(onboarding, {
      fields: [authorizedSignatory.onboardingId],
      references: [onboarding.id],
    }),
  })
);

export const kycAttestationRelations = relations(kycAttestation, ({ one }) => ({
  onboarding: one(onboarding, {
    fields: [kycAttestation.onboardingId],
    references: [onboarding.id],
  }),
}));

export const investorClearanceRelations = relations(
  investorClearance,
  ({ one }) => ({
    user: one(user, {
      fields: [investorClearance.userId],
      references: [user.id],
    }),
    clearedByUser: one(user, {
      fields: [investorClearance.clearedBy],
      references: [user.id],
      relationName: "clearedByUser",
    }),
  })
);

export const vehiclePermissionRelations = relations(
  vehiclePermission,
  ({ one }) => ({
    user: one(user, {
      fields: [vehiclePermission.userId],
      references: [user.id],
    }),
    deal: one(deal, {
      fields: [vehiclePermission.dealId],
      references: [deal.id],
    }),
    grantedByUser: one(user, {
      fields: [vehiclePermission.grantedBy],
      references: [user.id],
      relationName: "grantedByUser",
    }),
  })
);

export const dealDocumentRelations = relations(
  dealDocument,
  ({ one, many }) => ({
    deal: one(deal, {
      fields: [dealDocument.dealId],
      references: [deal.id],
    }),
    versions: many(documentVersion),
    createdByUser: one(user, {
      fields: [dealDocument.createdBy],
      references: [user.id],
    }),
  })
);

export const documentVersionRelations = relations(
  documentVersion,
  ({ one, many }) => ({
    document: one(dealDocument, {
      fields: [documentVersion.documentId],
      references: [dealDocument.id],
    }),
    visibilityRules: many(documentVisibility),
    uploadedByUser: one(user, {
      fields: [documentVersion.uploadedBy],
      references: [user.id],
    }),
  })
);

export const documentVisibilityRelations = relations(
  documentVisibility,
  ({ one }) => ({
    documentVersion: one(documentVersion, {
      fields: [documentVisibility.documentVersionId],
      references: [documentVersion.id],
    }),
  })
);

export const capitalNoticeRelations = relations(
  capitalNotice,
  ({ one, many }) => ({
    deal: one(deal, {
      fields: [capitalNotice.dealId],
      references: [deal.id],
    }),
    recipients: many(capitalNoticeRecipient),
    createdByUser: one(user, {
      fields: [capitalNotice.createdBy],
      references: [user.id],
    }),
    approvedByUser: one(user, {
      fields: [capitalNotice.approvedBy],
      references: [user.id],
      relationName: "approvedByUser",
    }),
  })
);

export const capitalNoticeRecipientRelations = relations(
  capitalNoticeRecipient,
  ({ one }) => ({
    notice: one(capitalNotice, {
      fields: [capitalNoticeRecipient.noticeId],
      references: [capitalNotice.id],
    }),
    user: one(user, {
      fields: [capitalNoticeRecipient.userId],
      references: [user.id],
    }),
  })
);

export const bankingVerificationRelations = relations(
  bankingVerification,
  ({ one }) => ({
    user: one(user, {
      fields: [bankingVerification.userId],
      references: [user.id],
    }),
    verifiedByUser: one(user, {
      fields: [bankingVerification.verifiedBy],
      references: [user.id],
      relationName: "verifiedByUser",
    }),
  })
);

export const evidenceExportRelations = relations(evidenceExport, ({ one }) => ({
  exportedByUser: one(user, {
    fields: [evidenceExport.exportedBy],
    references: [user.id],
  }),
}));

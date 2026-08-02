import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import {
  deal,
  dealInvite,
  dealInterest,
  investment,
  sideEffectOutbox,
  user,
  vehiclePermission,
  investorClearance,
} from "@repo/db/schema";
import { adminProcedure, baseProcedure, createTRPCRouter } from "../init";
import slugify from "slugify";
import { createDealSchema } from "@/lib/schemas/create-deal-schema";
import { dispatchPendingOutbox } from "@/lib/queues/outbox";
import {
  desc,
  eq,
  or,
  ne,
  isNull,
  and,
  ilike,
  sql,
  inArray,
} from "drizzle-orm";
import { z } from "zod";
import {
  createNextcloudClientFromEnv,
  fileExists,
  listFiles,
  ensureDirectory,
  uploadBuffer,
  sanitizeUploadFileName,
  sanitizeDealFolderSegment,
} from "@repo/nextcloud";
import { authSession } from "@/lib/auth/session-from-request";
import { logDataRoomAccessRequest } from "@/lib/audit";
import { getMarketplaceDeals as getMarketplaceDealsQuery } from "@repo/db/queries";

const parseNumericField = (value: string | undefined | null): number | null => {
  if (!value) return null;
  // Accept typed money strings like "1,000,000"
  const parsed = parseFloat(value.replace(/,/g, ""));
  return isNaN(parsed) ? null : parsed;
};

const makeOutboxPayload = (
  jobName: string,
  jobId: string,
  data: Record<string, unknown>
) => ({
  queue: "deal" as const,
  jobName,
  jobId,
  data,
});

export const dealsRouter = createTRPCRouter({
  getDeals: baseProcedure.query(async ({ ctx }) => {
    const deals = await ctx.db
      .select()
      .from(deal)
      .orderBy(desc(deal.createdAt));
    return deals;
  }),
  create: baseProcedure
    .input(createDealSchema)
    .mutation(async ({ input, ctx }) => {
      // Start session check early (async-api-routes pattern)
      const sessionPromise = authSession();
      const session = await sessionPromise;

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can create deals",
        });
      }

      // Generate slug from name
      const slug = slugify(input.name, { lower: true, strict: true });
      const dealId = randomUUID();

      // Prepare deal data
      const dealData = {
        id: dealId,
        name: input.name,
        slug: slug,
        description: input.description || null,
        teaserSummary: input.teaserSummary || null,
        sector: input.sector || null,
        geography: input.geography || null,
        dealType: input.dealType || null,
        targetRaise: parseNumericField(input.targetRaise),
        minInvestment: parseNumericField(input.minInvestment),
        targetIrr: parseNumericField(input.targetIrr),
        targetMoic: parseNumericField(input.targetMoic),
        targetCompany: input.targetCompany || null,
        revenue: parseNumericField(input.revenue),
        ebitda: parseNumericField(input.ebitda),
        holdPeriod: input.holdPeriod || null,
        investmentThesis: input.investmentThesis || null,
        risks: input.risks || null,
        purchasePrice: parseNumericField(input.purchasePrice),
        debt: parseNumericField(input.debt),
        sponsorEquity: parseNumericField(input.sponsorEquity),
        lpEquity: parseNumericField(input.lpEquity),
        status: input.status || "draft",
        launchDate: input.launchDate ? new Date(input.launchDate) : null,
        closeDate: input.closeDate ? new Date(input.closeDate) : null,
      };

      try {
        const [newDeal] = await ctx.db.transaction(async (tx) => {
          const insertedDeals = await tx
            .insert(deal)
            .values(dealData)
            .returning();
          const insertedDeal = insertedDeals[0];

          await tx.insert(sideEffectOutbox).values({
            id: randomUUID(),
            topic: "queue",
            dedupeKey: `deal:create:${dealId}`,
            payload: makeOutboxPayload("create-deal", `create-deal:${dealId}`, {
              deal: {
                name: input.name,
                slug: slug,
              },
            }),
          });

          return [insertedDeal];
        });

        await dispatchPendingOutbox(ctx.db);

        return {
          success: true,
          deal: newDeal,
          message: "Deal created successfully",
        };
      } catch (error) {
        // Handle invalid numeric values
        if (
          error instanceof Error &&
          (error.message.includes("invalid input") ||
            error.message.includes("numeric"))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "One or more numeric fields contain invalid values. Please check your input.",
            cause: error,
          });
        }

        // Handle unique constraint violations
        if (
          error instanceof Error &&
          (error.message.includes("unique") ||
            error.message.includes("duplicate") ||
            error.message.includes("23505"))
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists. Please try again.",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create deal",
          cause: error,
        });
      }
    }),

  update: baseProcedure
    .input(
      createDealSchema.extend({
        dealId: z.string().min(1, "Deal ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can update deals",
        });
      }

      const { dealId, ...updateData } = input;

      // Check if deal exists and get existing deal in parallel with slug check prep
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Generate slug from name
      const slug = slugify(updateData.name, { lower: true, strict: true });

      // If slug is being updated, check for conflicts
      if (slug !== existingDeal.slug) {
        const [conflictingDeal] = await ctx.db
          .select()
          .from(deal)
          .where(eq(deal.slug, slug))
          .limit(1);

        if (conflictingDeal) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists",
          });
        }
      }

      // Prepare update data
      const dealUpdateData = {
        name: updateData.name,
        slug: slug,
        description: updateData.description || null,
        teaserSummary: updateData.teaserSummary || null,
        sector: updateData.sector || null,
        geography: updateData.geography || null,
        dealType: updateData.dealType || null,
        targetRaise: parseNumericField(updateData.targetRaise),
        minInvestment: parseNumericField(updateData.minInvestment),
        targetIrr: parseNumericField(updateData.targetIrr),
        targetMoic: parseNumericField(updateData.targetMoic),
        targetCompany: updateData.targetCompany || null,
        revenue: parseNumericField(updateData.revenue),
        ebitda: parseNumericField(updateData.ebitda),
        holdPeriod: updateData.holdPeriod || null,
        investmentThesis: updateData.investmentThesis || null,
        risks: updateData.risks || null,
        purchasePrice: parseNumericField(updateData.purchasePrice),
        debt: parseNumericField(updateData.debt),
        sponsorEquity: parseNumericField(updateData.sponsorEquity),
        lpEquity: parseNumericField(updateData.lpEquity),
        status: updateData.status || "draft",
        launchDate: updateData.launchDate
          ? new Date(updateData.launchDate)
          : null,
        closeDate: updateData.closeDate ? new Date(updateData.closeDate) : null,
      };

      try {
        const [updatedDeal] = await ctx.db.transaction(async (tx) => {
          const updatedDeals = await tx
            .update(deal)
            .set(dealUpdateData)
            .where(eq(deal.id, dealId))
            .returning();
          const nextDeal = updatedDeals[0];

          // Check if deal name changed and enqueue folder rename job
          if (existingDeal.name !== updateData.name) {
            await tx.insert(sideEffectOutbox).values({
              id: randomUUID(),
              topic: "queue",
              dedupeKey: `deal:rename:${dealId}:${slugify(updateData.name, {
                lower: true,
                strict: true,
              })}`,
              payload: makeOutboxPayload(
                "rename-deal",
                `rename-deal:${dealId}:${slugify(updateData.name, {
                  lower: true,
                  strict: true,
                })}`,
                {
                  oldDealName: existingDeal.name,
                  newDealName: updateData.name,
                }
              ),
            });
          }

          return [nextDeal];
        });

        await dispatchPendingOutbox(ctx.db);

        return {
          success: true,
          deal: updatedDeal,
          message: "Deal updated successfully",
        };
      } catch (error) {
        // Handle invalid numeric values
        if (
          error instanceof Error &&
          (error.message.includes("invalid input") ||
            error.message.includes("numeric"))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "One or more numeric fields contain invalid values. Please check your input.",
            cause: error,
          });
        }

        // Handle unique constraint violations
        if (
          error instanceof Error &&
          (error.message.includes("unique") ||
            error.message.includes("duplicate") ||
            error.message.includes("23505"))
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A deal with this slug already exists. Please try again.",
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to update deal",
          cause: error,
        });
      }
    }),

  delete: adminProcedure
    .input(z.object({ dealId: z.string().min(1, "Deal ID is required") }))
    .mutation(async ({ input, ctx }) => {
      // Check if deal exists
      const [existingDeal] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!existingDeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          // Delete first to ensure state is committed before cleanup is scheduled.
          await tx.delete(deal).where(eq(deal.id, input.dealId));

          await tx.insert(sideEffectOutbox).values({
            id: randomUUID(),
            topic: "queue",
            dedupeKey: `deal:delete:${input.dealId}`,
            payload: makeOutboxPayload(
              "delete-deal",
              `delete-deal:${input.dealId}`,
              {
                dealName: existingDeal.name,
              }
            ),
          });
        });

        await dispatchPendingOutbox(ctx.db);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete deal",
          cause: error,
        });
      }

      return {
        success: true,
        message: "Deal deleted successfully",
      };
    }),

  getById: baseProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Transform numeric fields to strings and dates to ISO strings
      return {
        success: true,
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
      };
    }),

  getInvites: baseProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const invites = await ctx.db
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
            kycStatus: user.kycStatus,
            isOnboardingCompleted: user.isOnboardingCompleted,
          },
        })
        .from(vehiclePermission)
        .innerJoin(user, eq(user.id, vehiclePermission.userId))
        .where(
          and(
            eq(vehiclePermission.dealId, input.dealId),
            isNull(vehiclePermission.revokedAt),
          ),
        );

      return {
        success: true,
        invites: invites.map((invite) => ({
          ...invite,
          grantedAt: invite.grantedAt.toISOString(),
        })),
      };
    }),

  getInterests: baseProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {


      // Verify deal exists
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Get all interests for this deal with user info
      const interests = await ctx.db
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
        .where(eq(dealInterest.dealId, input.dealId));

      // Transform numeric fields to strings and dates to ISO strings
      return {
        success: true,
        interests: interests.map((interest) => ({
          ...interest,
          proposedAmount: interest.proposedAmount?.toString() ?? null,
          createdAt: interest.createdAt.toISOString(),
          updatedAt: interest.updatedAt?.toISOString() ?? null,
        })),
      };
    }),

  getInvestments: baseProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {


      // Verify deal exists
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Get all investments for this deal with user info
      const investments = await ctx.db
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
        .where(eq(investment.dealId, input.dealId));

      // Transform numeric fields to strings and dates to ISO strings
      return {
        success: true,
        investments: investments.map((inv) => ({
          ...inv,
          committedAmount: inv.committedAmount.toString(),
          fundedAmount: inv.fundedAmount?.toString() ?? null,
          currentValue: inv.currentValue?.toString() ?? null,
          distributions: inv.distributions?.toString() ?? null,
          ownershipPercentage: inv.ownershipPercentage?.toString() ?? null,
          committedDate: inv.committedDate.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt?.toISOString() ?? null,
        })),
      };
    }),

  getFiles: baseProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await authSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view deal documents",
        });
      }

      const isAdmin = session.user.role === "admin";

      // Get deal to construct folder path (accept id or slug)
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(or(eq(deal.id, input.dealId), eq(deal.slug, input.dealId)))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!isAdmin) {
        const [invitation] = await ctx.db
          .select({ accessLevel: vehiclePermission.accessLevel })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.userId, session.user.id),
              eq(vehiclePermission.dealId, dealRecord.id),
              isNull(vehiclePermission.revokedAt),
            ),
          )
          .limit(1);

        if (!invitation || invitation.accessLevel !== "data_room") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have data room access for this deal",
          });
        }
      }

      // Construct folder path based on deal slug
      // The worker creates folders using: Deal_{sanitizedName} where sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      // So we need to match that pattern exactly
      const dealSlug =
        dealRecord.slug ||
        slugify(dealRecord.name, { lower: true, strict: true });

      // Convert slug to match worker's sanitization (replace non-alphanumeric with underscore, lowercase)
      // slugify uses hyphens, but worker uses underscores
      const sanitizedName = sanitizeDealFolderSegment(dealSlug);
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      try {
        const client = createNextcloudClientFromEnv();

        const folderExists = await fileExists(client, folderPath);

        if (!folderExists) {
          return {
            success: true,
            files: [],
          };
        }

        const files = await listFiles(client, folderPath);

        return {
          success: true,
          files,
        };
      } catch (error) {
        // If folder doesn't exist, return empty array instead of error
        if (
          error instanceof Error &&
          error.message.includes("does not exist")
        ) {
          return {
            success: true,
            files: [],
          };
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch deal files",
        });
      }
    }),

  uploadFile: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        fileName: z.string().min(1, "File name is required"),
        fileData: z.string().min(1, "File data is required"), // base64 encoded
        fileType: z.string().min(1, "File type is required"), // MIME type
        fileSize: z
          .number()
          .max(10 * 1024 * 1024, "File size must be less than 10MB"), // 10MB max
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Start session check early
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can upload deal files",
        });
      }

      // Early validation: file type
      const allowedMimeTypes = [
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
        // Videos
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        // Audio
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/aac",
        "audio/flac",
        "audio/webm",
        // Documents
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-powerpoint", // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "text/plain", // .txt
        "text/csv",
        "application/rtf",
      ];

      if (!allowedMimeTypes.includes(input.fileType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File type ${input.fileType} is not allowed. Allowed types: images, videos (mp4), audio files, PDF, documents, and text files.`,
        });
      }

      // Get deal to construct folder path
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(eq(deal.id, input.dealId))
        .limit(1);

      if (!dealRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Construct folder path (same logic as getFiles)
      const dealSlug =
        dealRecord.slug ||
        slugify(dealRecord.name, { lower: true, strict: true });
      const sanitizedName = sanitizeDealFolderSegment(dealSlug);
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      // Sanitize file name to prevent path traversal and invalid characters
      const sanitizedFileName = sanitizeUploadFileName(input.fileName);
      const remoteFilePath = `${folderPath}/${sanitizedFileName}`;

      try {
        const client = createNextcloudClientFromEnv();

        await ensureDirectory(client, folderPath);

        const fileBuffer = Buffer.from(input.fileData, "base64");

        if (fileBuffer.length !== input.fileSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size mismatch. Please try uploading again.",
          });
        }

        const success = await uploadBuffer(client, remoteFilePath, fileBuffer, {
          overwrite: true,
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload file to Nextcloud",
          });
        }

        const fileStat = await client.stat(remoteFilePath);
        const statData = "data" in fileStat ? fileStat.data : fileStat;

        return {
          success: true,
          message: "File uploaded successfully",
          file: {
            name: sanitizedFileName,
            size: fileBuffer.length,
            mimeType: input.fileType,
            downloadUrl: client.getFileDownloadLink(remoteFilePath),
            lastModified: statData.lastmod || new Date().toISOString(),
          },
        };
      } catch (error) {
        // Handle specific Nextcloud errors
        if (error instanceof Error) {
          if (
            error.message.includes("409") ||
            error.message.includes("Conflict")
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "File already exists or folder conflict occurred",
            });
          }
          if (
            error.message.includes("413") ||
            error.message.includes("too large")
          ) {
            throw new TRPCError({
              code: "PAYLOAD_TOO_LARGE",
              message: "File is too large for the server",
            });
          }
          if (
            error.message.includes("quota") ||
            error.message.includes("space")
          ) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Insufficient storage space on Nextcloud",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to upload file",
          cause: error,
        });
      }
    }),

  getInvestors: baseProcedure.query(async ({ ctx }) => {
    const investors = await ctx.db
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

    return {
      success: true,
      investors: investors.map((investor) => ({
        ...investor,
        createdAt: investor.createdAt.toISOString(),
      })),
    };
  }),

  getPublicDeals: baseProcedure.query(async () => {
    const session = await authSession();

    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Public browse removed — marketplace is invite + live only.
    return {
      success: true as const,
      deals: [] as Array<{
        id: string;
        name: string;
        slug: string | null;
        description: string | null;
        teaserSummary: string | null;
        sector: string | null;
        geography: string | null;
        dealType: string | null;
        status: string;
        createdAt: string;
        updatedAt: string | null;
        launchDate: string | null;
        closeDate: string | null;
        targetRaise: string | null;
        minInvestment: string | null;
        targetIrr: string | null;
        targetMoic: string | null;
      }>,
    };
  }),

  getMarketplaceDeals: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        status: z.string().optional(),
        sector: z.string().optional(),
        geography: z.string().optional(),
        dealType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const session = await authSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view deals",
        });
      }

      return getMarketplaceDealsQuery({
        userId: session.user.id,
        page: input.page,
        limit: input.limit,
        search: input.search,
        status: input.status,
        sector: input.sector,
        geography: input.geography,
        dealType: input.dealType,
      });
    }),

  getCuratedDeals: baseProcedure.query(async ({ ctx }) => {
    const session = await authSession();
    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view curated deals",
      });
    }

    // Fetch invite-only deals that the user has been invited to
    // Join dealInvite to get only deals where user has an invite
    const deals = await ctx.db
      .select({
        id: deal.id,
        name: deal.name,
        slug: deal.slug,
        description: deal.description,
        teaserSummary: deal.teaserSummary,
        sector: deal.sector,
        geography: deal.geography,
        dealType: deal.dealType,
        targetRaise: deal.targetRaise,
        minInvestment: deal.minInvestment,
        targetIrr: deal.targetIrr,
        targetMoic: deal.targetMoic,
        status: deal.status,
        launchDate: deal.launchDate,
        closeDate: deal.closeDate,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        curationNote: dealInvite.curationNote,
      })
      .from(dealInvite)
      .innerJoin(deal, eq(dealInvite.dealId, deal.id))
      .where(
        and(
          eq(dealInvite.userId, session.user.id),
          ne(deal.status, "draft") // Exclude draft deals
        )
      )
      .orderBy(desc(deal.createdAt));

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
      })),
    };
  }),

  /**
   * Teaser-level investors request upgrade to data room access.
   * Logs an audit event for admins; does not change access level.
   */
  requestDataRoomAccess: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        message: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await authSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [dealRecord] = await ctx.db
        .select({ id: deal.id, name: deal.name, status: deal.status })
        .from(deal)
        .where(or(eq(deal.id, input.dealId), eq(deal.slug, input.dealId)))
        .limit(1);

      if (!dealRecord || dealRecord.status === "draft") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const [invitation] = await ctx.db
        .select({
          id: vehiclePermission.id,
          accessLevel: vehiclePermission.accessLevel,
          dataRoomRequestedAt: vehiclePermission.dataRoomRequestedAt,
        })
        .from(vehiclePermission)
        .where(
          and(
            eq(vehiclePermission.userId, session.user.id),
            eq(vehiclePermission.dealId, dealRecord.id),
            isNull(vehiclePermission.revokedAt)
          )
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this deal",
        });
      }

      if (invitation.accessLevel === "data_room") {
        return {
          success: true,
          message: "You already have data room access",
          alreadyHasAccess: true,
          alreadyRequested: false,
        };
      }

      if (invitation.dataRoomRequestedAt) {
        return {
          success: true,
          message: "Your data room access request is already pending review.",
          alreadyHasAccess: false,
          alreadyRequested: true,
        };
      }

      await ctx.db
        .update(vehiclePermission)
        .set({
          dataRoomRequestedAt: new Date(),
          dataRoomRequestMessage: input.message || null,
        })
        .where(eq(vehiclePermission.id, invitation.id));

      await logDataRoomAccessRequest({
        performedBy: session.user.id,
        dealId: dealRecord.id,
        notes: input.message || null,
      });

      return {
        success: true,
        message: "Data room access requested. An administrator will review.",
        alreadyHasAccess: false,
        alreadyRequested: false,
      };
    }),

  expressInterest: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        // soft_committed / meeting_requested accepted for backward compat;
        // investor UI only writes interested | pass.
        status: z.enum([
          "interested",
          "soft_committed",
          "pass",
          "meeting_requested",
        ]),
        proposedAmount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Start session check early
      const sessionPromise = authSession();
      const session = await sessionPromise;

      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to express interest",
        });
      }

      // Verify deal exists (by ID or slug)
      const [dealRecord] = await ctx.db
        .select()
        .from(deal)
        .where(or(eq(deal.id, input.dealId), eq(deal.slug, input.dealId)))
        .limit(1);

      const actualDealId = dealRecord?.id || input.dealId;

      if (!dealRecord || dealRecord.status === "draft") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      // Require data room invitation to express interest
      if (session.user.role !== "admin") {
        const [invitation] = await ctx.db
          .select({ accessLevel: vehiclePermission.accessLevel })
          .from(vehiclePermission)
          .where(
            and(
              eq(vehiclePermission.userId, session.user.id),
              eq(vehiclePermission.dealId, actualDealId),
              isNull(vehiclePermission.revokedAt)
            )
          )
          .limit(1);

        if (!invitation || invitation.accessLevel !== "data_room") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Data room access is required to express interest",
          });
        }
      }

      // Normalize legacy soft_commit / meeting → interested; keep pass.
      const normalizedStatus =
        input.status === "pass" ? "pass" : "interested";
      const proposedAmount =
        normalizedStatus === "pass" ? null : (input.proposedAmount ?? null);

      // Try insert first; if already present, update existing row.
      const [newInterest] = await ctx.db
        .insert(dealInterest)
        .values({
          id: randomUUID(),
          dealId: actualDealId,
          userId: session.user.id,
          status: normalizedStatus,
          proposedAmount,
        })
        .onConflictDoNothing()
        .returning();

      if (newInterest) {
        return {
          success: true,
          interest: {
            ...newInterest,
            proposedAmount: newInterest.proposedAmount?.toString() ?? null,
            createdAt: newInterest.createdAt.toISOString(),
            updatedAt: newInterest.updatedAt?.toISOString() ?? null,
          },
          message: "Interest expressed successfully",
        };
      }

      const [updatedInterest] = await ctx.db
        .update(dealInterest)
        .set({
          status: normalizedStatus,
          proposedAmount,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dealInterest.dealId, actualDealId),
            eq(dealInterest.userId, session.user.id)
          )
        )
        .returning();

      if (!updatedInterest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to persist interest",
        });
      }

      return {
        success: true,
        interest: {
          ...updatedInterest,
          proposedAmount: updatedInterest.proposedAmount?.toString() ?? null,
          createdAt: updatedInterest.createdAt.toISOString(),
          updatedAt: updatedInterest.updatedAt?.toISOString() ?? null,
        },
        message: "Interest updated successfully",
      };
    }),
});

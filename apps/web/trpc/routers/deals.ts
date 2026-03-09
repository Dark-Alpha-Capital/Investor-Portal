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
import { dispatchPendingOutbox } from "@/lib/outbox";
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
import { createClient } from "webdav";
import { FileStat } from "webdav";
import { revalidatePath } from "next/cache";
import { authSession } from "@/app/(auth)/auth";

// Helper functions hoisted outside mutations for better performance
const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, "_");
};

const sanitizeDealName = (dealName: string): string => {
  return dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

const parseNumericField = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const parsed = parseFloat(value);
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
        status: input.status || "draft",
        visibility: input.visibility || "invite_only",
        coverImageUrl: input.coverImageUrl || null,
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
        status: updateData.status || "draft",
        visibility: updateData.visibility || "invite_only",
        coverImageUrl: updateData.coverImageUrl || null,
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

        // Revalidate paths (non-blocking)
        revalidatePath(`/admin/deals/${dealId}`);
        revalidatePath(`/admin/deals`);

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

      // Get all invites for this deal with user info
      const invites = await ctx.db
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
        .where(eq(dealInvite.dealId, input.dealId));

      // Transform dates to ISO strings
      return {
        success: true,
        invites: invites.map((invite) => ({
          ...invite,
          createdAt: invite.createdAt.toISOString(),
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

      // Construct folder path based on deal slug
      // The worker creates folders using: Deal_{sanitizedName} where sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      // So we need to match that pattern exactly
      const dealSlug =
        dealRecord.slug ||
        slugify(dealRecord.name, { lower: true, strict: true });

      // Convert slug to match worker's sanitization (replace non-alphanumeric with underscore, lowercase)
      // slugify uses hyphens, but worker uses underscores
      const sanitizedName = sanitizeDealName(dealSlug);
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      try {
        const client = createClient(
          `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
          {
            username: process.env.NEXTCLOUD_USER,
            password: process.env.NEXTCLOUD_PASSWORD,
          }
        );

        // Check if folder exists first (like apps/server does)
        const folderExists = await client.exists(folderPath);

        if (!folderExists) {
          return {
            success: true,
            files: [],
          };
        }

        // Get directory contents
        const contents = await client.getDirectoryContents(folderPath);
        // Transform the data
        const files = (contents as FileStat[]).map((item) => ({
          name: item.basename,
          size: item.size,
          lastModified: item.lastmod,
          mimeType: item.mime ?? "",
          downloadUrl: client.getFileDownloadLink(item.filename),
        }));

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
      const sanitizedName = sanitizeDealName(dealSlug);
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      // Sanitize file name to prevent path traversal and invalid characters
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const remoteFilePath = `${folderPath}/${sanitizedFileName}`;

      try {
        // Create webdav client
        const client = createClient(
          `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
          {
            username: process.env.NEXTCLOUD_USER,
            password: process.env.NEXTCLOUD_PASSWORD,
          }
        );

        // Ensure folder exists, create if it doesn't
        const folderExists = await client.exists(folderPath);
        if (!folderExists) {
          await client.createDirectory(folderPath, { recursive: true });
        }

        // Decode base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // Verify decoded buffer size matches expected size
        if (fileBuffer.length !== input.fileSize) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size mismatch. Please try uploading again.",
          });
        }

        // Upload file using putFileContents
        const success = await client.putFileContents(
          remoteFilePath,
          fileBuffer,
          {
            overwrite: true,
            contentLength: fileBuffer.length,
          }
        );

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload file to Nextcloud",
          });
        }

        // Get file info after upload
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

  addInvites: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        userIds: z.array(z.string()),
        curationNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Start session check early
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can manage deal invites",
        });
      }

      // Early validation: check for empty array
      if (!input.userIds || input.userIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one user ID is required",
        });
      }

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

      // Verify all users exist and are investors (not admins) in parallel
      const userValidationPromises = input.userIds.map((userId) =>
        ctx.db
          .select()
          .from(user)
          .where(
            and(
              eq(user.id, userId),
              or(ne(user.role, "admin"), isNull(user.role))
            )
          )
          .limit(1)
          .then((r) => ({ userId, isValid: r.length > 0 }))
      );

      const userValidations = await Promise.all(userValidationPromises);
      const validUserIds = userValidations
        .filter((v) => v.isValid)
        .map((v) => v.userId);

      if (validUserIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid investor user IDs provided",
        });
      }

      // Insert invites with conflict-safe semantics to avoid race-condition failures
      const inviteRows = validUserIds.map((userId) => ({
          id: randomUUID(),
          dealId: input.dealId,
          userId,
          curationNote: input.curationNote || null,
        }));

      const insertedInvites =
        inviteRows.length > 0
          ? await ctx.db
              .insert(dealInvite)
              .values(inviteRows)
              .onConflictDoNothing()
              .returning({ id: dealInvite.id })
          : [];

      const addedCount = insertedInvites.length;
      const skippedCount = validUserIds.length - addedCount;

      return {
        success: true,
        message: `Added ${addedCount} invite(s) to deal`,
        addedCount,
        skippedCount,
      };
    }),

  removeInvites: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        userIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Start session check early
      const session = await authSession();

      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can manage deal invites",
        });
      }

      // Early validation
      if (!input.userIds || input.userIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one user ID is required",
        });
      }

      // Delete invites for specified users in parallel
      const deletePromises = input.userIds.map((userId) =>
        ctx.db
          .delete(dealInvite)
          .where(
            and(
              eq(dealInvite.dealId, input.dealId),
              eq(dealInvite.userId, userId)
            )
          )
      );

      await Promise.all(deletePromises);

      return {
        success: true,
        message: `Removed ${input.userIds.length} invite(s) from deal`,
        removedCount: input.userIds.length,
      };
    }),

  getPublicDeals: baseProcedure.query(async ({ ctx }) => {
    const session = await authSession();

    if (!session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Get user's KYC status
    const [userRecord] = await ctx.db
      .select({ kycStatus: user.kycStatus })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isAccredited = userRecord?.kycStatus === "approved";

    // Build visibility filter
    // Public deals: visible to everyone
    // Accredited deals: only visible if user is accredited
    const visibilityConditions = [eq(deal.visibility, "public")];

    if (isAccredited) {
      visibilityConditions.push(eq(deal.visibility, "accredited"));
    }

    // Fetch deals that are:
    // 1. Not draft (exclude draft deals)
    // 2. Public or (accredited if user is approved)
    // 3. Not invite_only (those are handled separately)
    const deals = await ctx.db
      .select()
      .from(deal)
      .where(
        and(
          ne(deal.status, "draft"), // Exclude draft deals
          ne(deal.visibility, "invite_only"), // Exclude invite-only deals
          or(...visibilityConditions) // Public or accredited (if user is accredited)
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

  getMarketplaceDeals: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        status: z.string().optional(),
        sector: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, sector } = input;
      const offset = (page - 1) * limit;

      const session = await authSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view deals",
        });
      }

      // Get user's KYC status
      const [userRecord] = await ctx.db
        .select({ kycStatus: user.kycStatus })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const isAccredited = userRecord?.kycStatus === "approved";

      // Get user's invited deal IDs
      const invitedDeals = await ctx.db
        .select({
          dealId: dealInvite.dealId,
          curationNote: dealInvite.curationNote,
        })
        .from(dealInvite)
        .where(eq(dealInvite.userId, session.user.id));

      const invitedDealIds = invitedDeals.map((d) => d.dealId);
      const invitedDealNotes = new Map(
        invitedDeals.map((d) => [d.dealId, d.curationNote])
      );

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

      // Build visibility conditions
      // User can see: public deals, accredited deals (if approved), and deals they're invited to
      const visibilityConditions = [eq(deal.visibility, "public")];

      if (isAccredited) {
        visibilityConditions.push(eq(deal.visibility, "accredited"));
      }

      if (invitedDealIds.length > 0) {
        visibilityConditions.push(inArray(deal.id, invitedDealIds));
      }

      // Combine all conditions
      const whereCondition = and(
        ...baseConditions,
        or(...visibilityConditions)
      );

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(deal)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get paginated deals
      const deals = await ctx.db
        .select()
        .from(deal)
        .where(whereCondition)
        .orderBy(desc(deal.createdAt))
        .limit(limit)
        .offset(offset);

      // Get unique sectors for filter dropdown
      const sectorsResult = await ctx.db
        .selectDistinct({ sector: deal.sector })
        .from(deal)
        .where(and(ne(deal.status, "draft"), or(...visibilityConditions)));

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
          isCurated: invitedDealIds.includes(dealRecord.id),
          curationNote: invitedDealNotes.get(dealRecord.id) ?? null,
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
      };
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
        visibility: deal.visibility,
        coverImageUrl: deal.coverImageUrl,
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

  expressInterest: baseProcedure
    .input(
      z.object({
        dealId: z.string(),
        status: z.enum([
          "interested",
          "soft_committed",
          "pass",
          "meeting_requested",
        ]),
        proposedAmount: z.number().optional(),
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

      // Prepare parallel access checks based on visibility
      const accessChecks: Promise<unknown>[] = [];

      if (dealRecord.visibility === "accredited") {
        // Check if user is accredited
        accessChecks.push(
          ctx.db
            .select({ kycStatus: user.kycStatus })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1)
            .then((r) => {
              if (r[0]?.kycStatus !== "approved") {
                throw new TRPCError({
                  code: "FORBIDDEN",
                  message:
                    "This deal is only available to accredited investors",
                });
              }
            })
        );
      } else if (dealRecord.visibility === "invite_only") {
        // Check if user has been invited
        accessChecks.push(
          ctx.db
            .select()
            .from(dealInvite)
            .where(
              and(
                eq(dealInvite.dealId, actualDealId),
                eq(dealInvite.userId, session.user.id)
              )
            )
            .limit(1)
            .then((r) => {
              if (r.length === 0) {
                throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You do not have access to this deal",
                });
              }
            })
        );
      }

      await Promise.all(accessChecks);

      // Try insert first; if already present, update existing row.
      const [newInterest] = await ctx.db
        .insert(dealInterest)
        .values({
          id: randomUUID(),
          dealId: actualDealId,
          userId: session.user.id,
          status: input.status,
          proposedAmount: input.proposedAmount ?? null,
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
          status: input.status,
          proposedAmount: input.proposedAmount ?? null,
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

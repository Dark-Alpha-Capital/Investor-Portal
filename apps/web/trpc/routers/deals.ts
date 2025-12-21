import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import {
  deal,
  dealInvite,
  dealInterest,
  investment,
  user,
} from "@repo/db/schema";
import { protectedProcedure, adminProcedure, createTRPCRouter } from "../init";
import slugify from "slugify";
import { getSession } from "@/lib/get-session";
import { createDealSchema } from "@/lib/schemas/create-deal-schema";
import { dealQueue } from "@/lib/redis";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "webdav";
import { FileStat } from "webdav";
import { revalidatePath } from "next/cache";

export const dealsRouter = createTRPCRouter({
  getDeals: protectedProcedure.query(async ({ ctx }) => {
    const deals = await ctx.db
      .select()
      .from(deal)
      .orderBy(desc(deal.createdAt));
    return deals;
  }),
  create: protectedProcedure
    .input(createDealSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can create deals",
        });
      }

      // Generate slug from name if not provided
      const slug = slugify(input.name, { lower: true, strict: true });

      console.log({ input, slug });

      try {
        const [newDeal] = await ctx.db
          .insert(deal)
          .values({
            id: randomUUID(),
            name: input.name,
            slug: slug,
            description: input.description || null,
            teaserSummary: input.teaserSummary || null,
            sector: input.sector || null,
            geography: input.geography || null,
            dealType: input.dealType || null,
            targetRaise: input.targetRaise
              ? parseFloat(input.targetRaise)
              : null,
            minInvestment: input.minInvestment
              ? parseFloat(input.minInvestment)
              : null,
            targetIrr: input.targetIrr ? parseFloat(input.targetIrr) : null,
            targetMoic: input.targetMoic ? parseFloat(input.targetMoic) : null,
            status: input.status || "draft",
            visibility: input.visibility || "invite_only",
            coverImageUrl: input.coverImageUrl || null,
            launchDate: input.launchDate ? new Date(input.launchDate) : null,
            closeDate: input.closeDate ? new Date(input.closeDate) : null,
          })
          .returning();

        await dealQueue.add("create-deal", {
          deal: {
            name: input.name,
            slug: slug,
          },
        });

        return {
          success: true,
          deal: newDeal,
          message: "Deal created successfully",
        };
      } catch (error) {
        console.error("Error creating deal:", error);

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
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create deal",
        });
      }
    }),

  update: protectedProcedure
    .input(
      createDealSchema.extend({
        dealId: z.string().min(1, "Deal ID is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can update deals",
        });
      }

      const { dealId, ...updateData } = input;

      // Check if deal exists
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

      try {
        const [updatedDeal] = await ctx.db
          .update(deal)
          .set({
            name: updateData.name,
            slug: slug,
            description: updateData.description || null,
            teaserSummary: updateData.teaserSummary || null,
            sector: updateData.sector || null,
            geography: updateData.geography || null,
            dealType: updateData.dealType || null,
            targetRaise: updateData.targetRaise
              ? parseFloat(updateData.targetRaise)
              : null,
            minInvestment: updateData.minInvestment
              ? parseFloat(updateData.minInvestment)
              : null,
            targetIrr: updateData.targetIrr
              ? parseFloat(updateData.targetIrr)
              : null,
            targetMoic: updateData.targetMoic
              ? parseFloat(updateData.targetMoic)
              : null,
            status: updateData.status || "draft",
            visibility: updateData.visibility || "invite_only",
            coverImageUrl: updateData.coverImageUrl || null,
            launchDate: updateData.launchDate
              ? new Date(updateData.launchDate)
              : null,
            closeDate: updateData.closeDate
              ? new Date(updateData.closeDate)
              : null,
          })
          .where(eq(deal.id, dealId))
          .returning();

        // Check if deal name changed and enqueue folder rename job
        if (existingDeal.name !== updateData.name) {
          console.log("Deal name changed, enqueuing folder rename job");

          await dealQueue.add("rename-deal", {
            oldDealName: existingDeal.name,
            newDealName: updateData.name,
          });
        }

        revalidatePath(`/admin/deals/${dealId}`);
        revalidatePath(`/admin/deals`);

        return {
          success: true,
          deal: updatedDeal,
          message: "Deal updated successfully",
        };
      } catch (error) {
        console.error("Error updating deal:", error);

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
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to update deal",
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
        // Delete from database first
        await ctx.db.delete(deal).where(eq(deal.id, input.dealId));

        // Queue background job to delete the Nextcloud folder
        // Use the deal name (same as used in create-deal handler)
        await dealQueue.add("delete-deal", {
          dealName: existingDeal.name,
        });

        return {
          success: true,
          message: "Deal deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting deal:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to delete deal",
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can access deals",
        });
      }

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

  getInvites: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can access deal invites",
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

  getInterests: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can access deal interests",
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

  getInvestments: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can access deal investments",
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

  getFiles: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can access deal files",
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

      // Construct folder path based on deal slug
      // The worker creates folders using: Deal_{sanitizedName} where sanitizedName = dealName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
      // So we need to match that pattern exactly
      const dealSlug =
        dealRecord.slug ||
        slugify(dealRecord.name, { lower: true, strict: true });

      // Convert slug to match worker's sanitization (replace non-alphanumeric with underscore, lowercase)
      // slugify uses hyphens, but worker uses underscores
      const sanitizedName = dealSlug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      console.log("Deal info:", {
        dealId: input.dealId,
        dealName: dealRecord.name,
        dealSlug: dealRecord.slug,
        computedSlug: dealSlug,
        sanitizedName,
        folderPath,
      });

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
        console.log("Folder exists check:", { folderPath, folderExists });

        if (!folderExists) {
          console.warn(`Folder does not exist: ${folderPath}`);
          return {
            success: true,
            files: [],
          };
        }

        // Get directory contents
        const contents = await client.getDirectoryContents(folderPath);
        console.log("Contents:", { contents });
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
        console.error("Error listing files:", error);

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

  uploadFile: protectedProcedure
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
      // Check if user is admin
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can upload deal files",
        });
      }

      // Validate file type
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
      const sanitizedName = dealSlug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const folderPath = `/Deals/Deal_${sanitizedName}`;

      // Sanitize file name to prevent path traversal and invalid characters
      const sanitizedFileName = input.fileName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.\./g, "_"); // Prevent path traversal
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
        console.error("Error uploading file:", error);

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
        });
      }
    }),
});

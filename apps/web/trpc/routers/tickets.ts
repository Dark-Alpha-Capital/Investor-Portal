/**
 * Tickets Router
 *
 * Handles service ticket management for investor support.
 * Includes both admin procedures (manage all tickets) and
 * investor procedures (create/view own tickets).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "../init";
import {
  user,
  serviceTicket,
  serviceTicketComment,
} from "@repo/db/schema";
import { eq, desc, and, or, sql, ilike, isNull, ne } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { nanoid } from "nanoid";
import { after } from "next/server";
import {
  logTicketCreated,
  logTicketAssigned,
  logTicketStatusChange,
  logTicketComment,
  logTicketResolved,
  logTicketClosed,
} from "@/lib/audit";

// Schema validations
const ticketStatusSchema = z.enum([
  "open",
  "in_progress",
  "pending_user",
  "resolved",
  "closed",
]);

const ticketPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const ticketCategorySchema = z.enum([
  "credentials",
  "documents",
  "profile",
  "banking",
  "investment",
  "other",
]);

export const ticketsRouter = createTRPCRouter({
  // ============================================================================
  // ADMIN PROCEDURES
  // ============================================================================

  /**
   * Get all tickets with pagination and filters (admin only)
   */
  getTickets: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        category: z.string().optional(),
        assignedTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const { page, limit, search, status, priority, category, assignedTo } =
        input;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions: ReturnType<typeof and>[] = [];

      if (status && status !== "all") {
        conditions.push(eq(serviceTicket.status, status as any));
      }
      if (priority && priority !== "all") {
        conditions.push(eq(serviceTicket.priority, priority as any));
      }
      if (category && category !== "all") {
        conditions.push(eq(serviceTicket.category, category as any));
      }
      if (assignedTo && assignedTo !== "all") {
        if (assignedTo === "unassigned") {
          conditions.push(isNull(serviceTicket.assignedTo));
        } else {
          conditions.push(eq(serviceTicket.assignedTo, assignedTo));
        }
      }

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countQuery = ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceTicket);
      if (whereCondition) {
        countQuery.where(whereCondition);
      }
      const [countResult] = await countQuery;
      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get tickets
      const ticketsQuery = ctx.db
        .select({
          id: serviceTicket.id,
          subject: serviceTicket.subject,
          description: serviceTicket.description,
          category: serviceTicket.category,
          status: serviceTicket.status,
          priority: serviceTicket.priority,
          userId: serviceTicket.userId,
          assignedTo: serviceTicket.assignedTo,
          createdAt: serviceTicket.createdAt,
          updatedAt: serviceTicket.updatedAt,
          resolvedAt: serviceTicket.resolvedAt,
        })
        .from(serviceTicket)
        .orderBy(desc(serviceTicket.createdAt))
        .limit(limit)
        .offset(offset);

      if (whereCondition) {
        ticketsQuery.where(whereCondition);
      }

      const tickets = await ticketsQuery;

      // Enrich tickets with user info
      const ticketsWithUsers = await Promise.all(
        tickets.map(async (ticket) => {
          // Get investor info
          const [investor] = await ctx.db
            .select({ name: user.name, email: user.email })
            .from(user)
            .where(eq(user.id, ticket.userId))
            .limit(1);

          // Get assignee info if assigned
          let assigneeName = null;
          if (ticket.assignedTo) {
            const [assignee] = await ctx.db
              .select({ name: user.name })
              .from(user)
              .where(eq(user.id, ticket.assignedTo))
              .limit(1);
            assigneeName = assignee?.name || null;
          }

          return {
            ...ticket,
            investorName: investor?.name || "Unknown",
            investorEmail: investor?.email || "Unknown",
            assigneeName,
          };
        })
      );

      // Filter by search (after enrichment since we search on investor name/email)
      let filteredTickets = ticketsWithUsers;
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredTickets = ticketsWithUsers.filter(
          (t) =>
            t.subject.toLowerCase().includes(searchLower) ||
            t.investorName?.toLowerCase().includes(searchLower) ||
            t.investorEmail?.toLowerCase().includes(searchLower)
        );
      }

      return {
        success: true,
        tickets: filteredTickets,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      };
    }),

  /**
   * Get a single ticket by ID with comments (admin only)
   */
  getTicketById: baseProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const [ticket] = await ctx.db
        .select()
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Get investor info
      const [investor] = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, ticket.userId))
        .limit(1);

      // Get assignee info
      let assignee = null;
      if (ticket.assignedTo) {
        const [assigneeData] = await ctx.db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(eq(user.id, ticket.assignedTo))
          .limit(1);
        assignee = assigneeData || null;
      }

      // Get resolver info
      let resolver = null;
      if (ticket.resolvedBy) {
        const [resolverData] = await ctx.db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(eq(user.id, ticket.resolvedBy))
          .limit(1);
        resolver = resolverData || null;
      }

      // Get comments with user info
      const comments = await ctx.db
        .select()
        .from(serviceTicketComment)
        .where(eq(serviceTicketComment.ticketId, input.ticketId))
        .orderBy(serviceTicketComment.createdAt);

      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const [commenter] = await ctx.db
            .select({ id: user.id, name: user.name, image: user.image })
            .from(user)
            .where(eq(user.id, comment.userId))
            .limit(1);

          return {
            ...comment,
            userName: commenter?.name || "Unknown",
            userImage: commenter?.image || null,
          };
        })
      );

      return {
        success: true,
        ticket: {
          ...ticket,
          investor,
          assignee,
          resolver,
        },
        comments: commentsWithUsers,
      };
    }),

  /**
   * Assign a ticket to an admin
   */
  assignTicket: baseProcedure
    .input(
      z.object({
        ticketId: z.string(),
        assignedTo: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get current ticket state
      const [ticket] = await ctx.db
        .select({ assignedTo: serviceTicket.assignedTo })
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Update ticket
      await ctx.db
        .update(serviceTicket)
        .set({
          assignedTo: input.assignedTo,
          assignedAt: new Date(),
        })
        .where(eq(serviceTicket.id, input.ticketId));

      // Log audit after response is sent
      after(async () => {
        await logTicketAssigned({
          performedBy: session.user.id,
          ticketId: input.ticketId,
          assignedTo: input.assignedTo,
          previousAssignee: ticket.assignedTo,
        });
      });

      return {
        success: true,
        message: "Ticket assigned successfully",
      };
    }),

  /**
   * Update ticket status
   */
  updateStatus: baseProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: ticketStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get current ticket state
      const [ticket] = await ctx.db
        .select({ status: serviceTicket.status })
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Update ticket
      await ctx.db
        .update(serviceTicket)
        .set({ status: input.status })
        .where(eq(serviceTicket.id, input.ticketId));

      // Log audit after response is sent
      after(async () => {
        await logTicketStatusChange({
          performedBy: session.user.id,
          ticketId: input.ticketId,
          previousStatus: ticket.status,
          newStatus: input.status,
        });
      });

      return {
        success: true,
        message: `Ticket status updated to ${input.status}`,
      };
    }),

  /**
   * Resolve a ticket
   */
  resolveTicket: baseProcedure
    .input(
      z.object({
        ticketId: z.string(),
        resolution: z.string().min(1, "Resolution is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get current ticket state
      const [ticket] = await ctx.db
        .select({ status: serviceTicket.status })
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Update ticket
      await ctx.db
        .update(serviceTicket)
        .set({
          status: "resolved",
          resolution: input.resolution,
          resolvedBy: session.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(serviceTicket.id, input.ticketId));

      // Log audit after response is sent
      after(async () => {
        await logTicketResolved({
          performedBy: session.user.id,
          ticketId: input.ticketId,
          resolution: input.resolution,
        });
      });

      return {
        success: true,
        message: "Ticket resolved successfully",
      };
    }),

  /**
   * Close a ticket
   */
  closeTicket: baseProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Get current ticket
      const [ticket] = await ctx.db
        .select({ status: serviceTicket.status })
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Update ticket
      await ctx.db
        .update(serviceTicket)
        .set({
          status: "closed",
          closedBy: session.user.id,
          closedAt: new Date(),
        })
        .where(eq(serviceTicket.id, input.ticketId));

      // Log audit after response is sent
      after(async () => {
        await logTicketClosed({
          performedBy: session.user.id,
          ticketId: input.ticketId,
        });
      });

      return {
        success: true,
        message: "Ticket closed successfully",
      };
    }),

  /**
   * Add a comment to a ticket (admin)
   */
  addAdminComment: baseProcedure
    .input(
      z.object({
        ticketId: z.string(),
        content: z.string().min(1, "Comment content is required"),
        isInternal: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Verify ticket exists
      const [ticket] = await ctx.db
        .select({ id: serviceTicket.id })
        .from(serviceTicket)
        .where(eq(serviceTicket.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Create comment
      const commentId = nanoid();
      await ctx.db.insert(serviceTicketComment).values({
        id: commentId,
        ticketId: input.ticketId,
        userId: session.user.id,
        content: input.content,
        isInternal: input.isInternal,
      });

      // Log audit after response is sent
      after(async () => {
        await logTicketComment({
          performedBy: session.user.id,
          ticketId: input.ticketId,
          commentId,
          isInternal: input.isInternal,
        });
      });

      return {
        success: true,
        commentId,
        message: "Comment added successfully",
      };
    }),

  /**
   * Create a ticket on behalf of an investor (admin only)
   */
  createTicketForInvestor: baseProcedure
    .input(
      z.object({
        investorId: z.string(),
        category: ticketCategorySchema,
        priority: ticketPrioritySchema.default("medium"),
        subject: z.string().min(1, "Subject is required"),
        description: z.string().min(1, "Description is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      // Verify investor exists
      const [investor] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, input.investorId))
        .limit(1);

      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor not found",
        });
      }

      // Create ticket
      const ticketId = nanoid();
      await ctx.db.insert(serviceTicket).values({
        id: ticketId,
        userId: input.investorId,
        category: input.category,
        priority: input.priority,
        subject: input.subject,
        description: input.description,
        status: "open",
      });

      // Log audit after response is sent
      after(async () => {
        await logTicketCreated({
          performedBy: session.user.id,
          ticketId,
          investorId: input.investorId,
          category: input.category,
          subject: input.subject,
          isCreatedByAdmin: true,
        });
      });

      return {
        success: true,
        ticketId,
        message: "Ticket created successfully",
      };
    }),

  /**
   * Get ticket metrics for dashboard
   */
  getTicketMetrics: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Admin access required",
      });
    }

    // Get counts by status
    const [openCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(eq(serviceTicket.status, "open"));

    const [inProgressCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(eq(serviceTicket.status, "in_progress"));

    const [pendingUserCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(eq(serviceTicket.status, "pending_user"));

    const [resolvedCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(eq(serviceTicket.status, "resolved"));

    // Get resolved today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [resolvedTodayCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(
        and(
          eq(serviceTicket.status, "resolved"),
          sql`${serviceTicket.resolvedAt} >= ${today}`
        )
      );

    // Get unassigned count
    const [unassignedCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTicket)
      .where(
        and(
          isNull(serviceTicket.assignedTo),
          ne(serviceTicket.status, "closed"),
          ne(serviceTicket.status, "resolved")
        )
      );

    return {
      success: true,
      metrics: {
        open: openCount?.count ?? 0,
        inProgress: inProgressCount?.count ?? 0,
        pendingUser: pendingUserCount?.count ?? 0,
        resolved: resolvedCount?.count ?? 0,
        resolvedToday: resolvedTodayCount?.count ?? 0,
        unassigned: unassignedCount?.count ?? 0,
      },
    };
  }),

  /**
   * Get admin users for assignment dropdown
   */
  getAdminUsers: baseProcedure.query(async ({ ctx }) => {
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Admin access required",
      });
    }

    const admins = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.role, "admin"))
      .orderBy(user.name);

    return admins;
  }),

  /**
   * Search investors for creating tickets on their behalf
   */
  searchInvestors: baseProcedure
    .input(z.object({ search: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user || session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin access required",
        });
      }

      const searchTerm = `%${input.search}%`;

      const investors = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(
          and(
            or(ne(user.role, "admin"), isNull(user.role)),
            or(ilike(user.name, searchTerm), ilike(user.email, searchTerm))
          )
        )
        .limit(10);

      return investors;
    }),

  // ============================================================================
  // INVESTOR PROCEDURES
  // ============================================================================

  /**
   * Get my tickets (investor)
   */
  getMyTickets: baseProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const { page, limit, status } = input;
      const offset = (page - 1) * limit;

      // Build conditions
      const conditions = [eq(serviceTicket.userId, session.user.id)];
      if (status && status !== "all") {
        conditions.push(eq(serviceTicket.status, status as any));
      }

      const whereCondition = and(...conditions);

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceTicket)
        .where(whereCondition);

      const totalCount = countResult?.count ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get tickets
      const tickets = await ctx.db
        .select({
          id: serviceTicket.id,
          subject: serviceTicket.subject,
          category: serviceTicket.category,
          status: serviceTicket.status,
          priority: serviceTicket.priority,
          createdAt: serviceTicket.createdAt,
          updatedAt: serviceTicket.updatedAt,
          resolvedAt: serviceTicket.resolvedAt,
        })
        .from(serviceTicket)
        .where(whereCondition)
        .orderBy(desc(serviceTicket.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        tickets,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      };
    }),

  /**
   * Get a single ticket by ID (investor - own tickets only)
   */
  getMyTicketById: baseProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [ticket] = await ctx.db
        .select()
        .from(serviceTicket)
        .where(
          and(
            eq(serviceTicket.id, input.ticketId),
            eq(serviceTicket.userId, session.user.id)
          )
        )
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Get comments (only non-internal)
      const comments = await ctx.db
        .select()
        .from(serviceTicketComment)
        .where(
          and(
            eq(serviceTicketComment.ticketId, input.ticketId),
            eq(serviceTicketComment.isInternal, false)
          )
        )
        .orderBy(serviceTicketComment.createdAt);

      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const [commenter] = await ctx.db
            .select({ id: user.id, name: user.name, image: user.image })
            .from(user)
            .where(eq(user.id, comment.userId))
            .limit(1);

          const isAdmin =
            (await ctx.db
              .select({ role: user.role })
              .from(user)
              .where(eq(user.id, comment.userId))
              .limit(1)
              .then((r) => r[0]?.role)) === "admin";

          return {
            ...comment,
            userName: commenter?.name || "Unknown",
            userImage: commenter?.image || null,
            isAdmin,
          };
        })
      );

      return {
        success: true,
        ticket,
        comments: commentsWithUsers,
      };
    }),

  /**
   * Create a new ticket (investor)
   */
  createTicket: baseProcedure
    .input(
      z.object({
        category: ticketCategorySchema,
        subject: z.string().min(1, "Subject is required").max(200),
        description: z.string().min(1, "Description is required").max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Create ticket
      const ticketId = nanoid();
      await ctx.db.insert(serviceTicket).values({
        id: ticketId,
        userId: session.user.id,
        category: input.category,
        subject: input.subject,
        description: input.description,
        status: "open",
        priority: "medium", // Default priority for investor-created tickets
      });

      // Log audit after response is sent
      after(async () => {
        await logTicketCreated({
          performedBy: session.user.id,
          ticketId,
          investorId: session.user.id,
          category: input.category,
          subject: input.subject,
          isCreatedByAdmin: false,
        });
      });

      return {
        success: true,
        ticketId,
        message: "Ticket created successfully",
      };
    }),

  /**
   * Add a comment to own ticket (investor)
   */
  addComment: baseProcedure
    .input(
      z.object({
        ticketId: z.string(),
        content: z.string().min(1, "Comment content is required").max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getSession();
      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Verify ticket belongs to user
      const [ticket] = await ctx.db
        .select({ id: serviceTicket.id, status: serviceTicket.status })
        .from(serviceTicket)
        .where(
          and(
            eq(serviceTicket.id, input.ticketId),
            eq(serviceTicket.userId, session.user.id)
          )
        )
        .limit(1);

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }

      // Don't allow comments on closed tickets
      if (ticket.status === "closed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add comments to closed tickets",
        });
      }

      // Create comment
      const commentId = nanoid();
      await ctx.db.insert(serviceTicketComment).values({
        id: commentId,
        ticketId: input.ticketId,
        userId: session.user.id,
        content: input.content,
        isInternal: false, // Investor comments are never internal
      });

      // Update ticket status to in_progress if it was pending_user
      if (ticket.status === "pending_user") {
        await ctx.db
          .update(serviceTicket)
          .set({ status: "in_progress" })
          .where(eq(serviceTicket.id, input.ticketId));
      }

      // Log audit after response is sent
      after(async () => {
        await logTicketComment({
          performedBy: session.user.id,
          ticketId: input.ticketId,
          commentId,
          isInternal: false,
        });
      });

      return {
        success: true,
        commentId,
        message: "Comment added successfully",
      };
    }),
});

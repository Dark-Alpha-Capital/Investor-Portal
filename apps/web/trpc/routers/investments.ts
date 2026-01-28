import { TRPCError } from "@trpc/server";
import { investmentDocument, investment, deal } from "@repo/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

export const investmentsRouter = createTRPCRouter({

});

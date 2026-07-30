import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as impl from "./profile-route-data.server";

const profileUserIdSchema = z.object({
  userId: z.string().min(1),
});

export const fetchProfilePageData = createServerFn({ method: "GET" })
  .validator((input) => profileUserIdSchema.parse(input))
  .handler(({ data }) => impl.runFetchProfilePageData(data.userId));

import { createServerFn } from "@tanstack/react-start";
import { prismicUidInputSchema } from "@/lib/schemas/server-fn/inputs";
import * as impl from "./fetch-homepage.server";

export const fetchHomepage = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await impl.runFetchHomepage();
  } catch (e) {
    console.error("[fetchHomepage] Prismic error:", e);
    throw new Error("Failed to load homepage");
  }
});

export const fetchPrismicPageByUid = createServerFn({ method: "GET" })
  .inputValidator((d) => prismicUidInputSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      return await impl.runFetchPrismicPageByUid(data);
    } catch (e) {
      console.error("[fetchPrismicPageByUid] error:", data.uid, e);
      return null;
    }
  });

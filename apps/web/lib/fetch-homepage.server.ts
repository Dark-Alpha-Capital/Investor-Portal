import { asImageSrc } from "@prismicio/client";
import { createClient } from "@/prismicio";
import type { PrismicUidInput } from "@/lib/schemas/server-fn/inputs";

export async function runFetchHomepage() {
  const client = createClient();
  const page = await client.getSingle("homepage");
  return {
    slices: page.data.slices,
    meta_title: page.data.meta_title,
    meta_description: page.data.meta_description,
    meta_image: page.data.meta_image,
    ogImageUrl: asImageSrc(page.data.meta_image) ?? "",
  };
}

export async function runFetchPrismicPageByUid(data: PrismicUidInput) {
  const client = createClient();
  const page = await client.getByUID("page", data.uid).catch(() => null);
  if (!page) return null;
  return {
    slices: page.data.slices,
    meta_title: page.data.meta_title,
    meta_description: page.data.meta_description,
    ogImageUrl: asImageSrc(page.data.meta_image) ?? "",
  };
}

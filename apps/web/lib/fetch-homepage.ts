import { createServerFn } from "@tanstack/react-start";
import { asImageSrc } from "@prismicio/client";
import { createClient } from "@/prismicio";

export const fetchHomepage = createServerFn({ method: "GET" }).handler(
  async () => {
    const client = createClient();
    const page = await client.getSingle("homepage");
    return {
      slices: page.data.slices,
      meta_title: page.data.meta_title,
      meta_description: page.data.meta_description,
      meta_image: page.data.meta_image,
      ogImageUrl: asImageSrc(page.data.meta_image) ?? "",
    };
  },
);

export const fetchPrismicPageByUid = createServerFn({ method: "GET" })
  .inputValidator((d: { uid: string }) => d)
  .handler(async ({ data }) => {
    const client = createClient();
    const page = await client.getByUID("page", data.uid).catch(() => null);
    if (!page) return null;
    return {
      slices: page.data.slices,
      meta_title: page.data.meta_title,
      meta_description: page.data.meta_description,
      ogImageUrl: asImageSrc(page.data.meta_image) ?? "",
    };
  });

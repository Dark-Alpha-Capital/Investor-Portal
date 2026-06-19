import { createFileRoute, notFound } from "@tanstack/react-router";
import { SliceZone } from "@prismicio/react";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeleton/page-skeleton";
import { fetchHomepage } from "@/lib/fetch-homepage";
import type { HomepageDocument } from "@/prismicio-types";
import { components } from "@/slices";

type PrismicHomeLoaderData = Pick<
  HomepageDocument["data"],
  "slices" | "meta_title" | "meta_description" | "meta_image"
> & { ogImageUrl: string };

export const Route = createFileRoute("/(main-site)/")({
  loader: async () => {
    try {
      return (await fetchHomepage()) as PrismicHomeLoaderData;
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const d = loaderData as PrismicHomeLoaderData;
    const title = String(d.meta_title ?? "");
    const description = String(d.meta_description ?? "");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(d.ogImageUrl
          ? [{ property: "og:image" as const, content: d.ogImageUrl }]
          : []),
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData() as PrismicHomeLoaderData;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <SliceZone slices={data.slices} components={components} />
    </Suspense>
  );
}

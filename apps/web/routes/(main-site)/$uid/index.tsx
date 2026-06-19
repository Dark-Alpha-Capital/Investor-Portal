import { createFileRoute, notFound } from "@tanstack/react-router";
import { SliceZone } from "@prismicio/react";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeleton/page-skeleton";
import { fetchPrismicPageByUid } from "@/lib/fetch-homepage";
import type { PageDocument } from "@/prismicio-types";
import { components } from "@/slices";

/** Explicit loader shape so `useLoaderData` / `head` infer correctly for this route. */
type PrismicUidPageLoaderData = Pick<
  PageDocument["data"],
  "slices" | "meta_title" | "meta_description"
> & { ogImageUrl: string };

export const Route = createFileRoute("/(main-site)/$uid/")({
  loader: async ({
    params,
  }: {
    params: { uid: string };
  }) => {
    const data = await fetchPrismicPageByUid({ data: { uid: params.uid } });
    if (!data) throw notFound();
    return data as PrismicUidPageLoaderData;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const d = loaderData as PrismicUidPageLoaderData;
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
  component: PrismicUidPage,
});

function PrismicUidPage() {
  const data = Route.useLoaderData() as PrismicUidPageLoaderData;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <SliceZone slices={data.slices} components={components} />
    </Suspense>
  );
}

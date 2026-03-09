import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { asImageSrc } from "@prismicio/client";
import { SliceZone } from "@prismicio/react";
import { Suspense } from "react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { PageSkeleton } from "@/components/skeleton/page-skeleton";

export default async function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FetchPageContent />
    </Suspense>
  );
}

async function FetchPageContent() {
  // Access headers first to mark request data access (required for Cache Components)
  await headers();
  const client = createClient();
  const page = await client.getSingle("homepage").catch(() => notFound());

  return <SliceZone slices={page.data.slices} components={components} />;
}

export async function generateMetadata(): Promise<Metadata> {
  // Access headers first to mark request data access (required for Cache Components)
  await headers();
  const client = createClient();
  const page = await client.getSingle("homepage").catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description,
    openGraph: {
      images: [{ url: asImageSrc(page.data.meta_image) ?? "" }],
    },
  };
}

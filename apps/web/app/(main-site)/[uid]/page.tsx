import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { asImageSrc } from "@prismicio/client";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeleton/page-skeleton";

type Params = Promise<{ uid: string }>;

export default async function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FetchPageWrapper p={params} />
    </Suspense>
  );
}

async function FetchPageWrapper({ p }: { p: Params }) {
  // Access headers first to mark request data access (required for Cache Components)
  await headers();
  const { uid } = await p;
  return (
    <div>
      <Suspense fallback={<PageSkeleton />}>
        <FetchPageContent uid={uid} />
      </Suspense>
    </div>
  );
}

async function FetchPageContent({ uid }: { uid: string }) {
  const client = createClient();
  const page = await client.getByUID("page", uid).catch(() => notFound());

  return <SliceZone slices={page.data.slices} components={components} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  // Access headers first to mark request data access (required for Cache Components)
  await headers();
  const { uid } = await params;
  const client = createClient();
  const page = await client.getByUID("page", uid).catch(() => notFound());

  return {
    title: page.data.meta_title,
    description: page.data.meta_description,
    openGraph: {
      images: [{ url: asImageSrc(page.data.meta_image) ?? "" }],
    },
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType("page");

  return pages.map((page) => ({ uid: page.uid }));
}

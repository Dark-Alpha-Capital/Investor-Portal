import type { Client } from "@prismicio/client";

/** @see https://prismic.io/docs/prismic-preview */
const PRISMIC_PREVIEW_COOKIE = "io.prismic.preview";

/**
 * Prismic preview entry (replaces @prismicio/next redirectToPreviewURL for TanStack Start).
 */
export async function redirectToPreviewURL({
  client,
  request,
}: {
  client: Client;
  request: Request;
}): Promise<Response> {
  const url = new URL(request.url);
  const documentID = url.searchParams.get("documentId") ?? undefined;
  const previewToken = url.searchParams.get("token") ?? undefined;

  const previewURL = await client.resolvePreviewURL({
    documentID,
    previewToken,
    defaultURL: "/",
  });

  const headers = new Headers();
  headers.set("Location", previewURL);
  if (previewToken) {
    headers.append(
      "Set-Cookie",
      `${PRISMIC_PREVIEW_COOKIE}=${encodeURIComponent(previewToken)}; Path=/; HttpOnly; SameSite=Lax`,
    );
  }

  return new Response(null, { status: 307, headers });
}

export function exitPreviewResponse(): Response {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": `${PRISMIC_PREVIEW_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    },
  });
}

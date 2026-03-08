import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const configuredSecret = process.env.REVALIDATE_SECRET;

  if (!configuredSecret) {
    return NextResponse.json({ error: "Revalidate secret is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const headerSecret = request.headers.get("x-revalidate-secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const providedSecret = querySecret ?? headerSecret ?? bearerSecret;

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("prismic", "default");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

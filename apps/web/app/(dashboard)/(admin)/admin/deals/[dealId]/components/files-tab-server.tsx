import { caller } from "@/trpc/server";
import { FilesTabWrapper } from "./files-tab-wrapper";

export async function FilesTabServer({ dealId }: { dealId: string }) {
  const result = await caller.deals.getFiles({ dealId });
  const files = result.files;

  return <FilesTabWrapper dealId={dealId} files={files} />;
}

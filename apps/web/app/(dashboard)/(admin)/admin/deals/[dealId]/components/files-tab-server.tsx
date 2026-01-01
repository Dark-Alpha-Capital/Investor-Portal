import { FilesTabWrapper } from "./files-tab-wrapper";

type DealFile = {
  name: string;
  size: number;
  lastModified: string;
  mimeType: string;
  downloadUrl: string;
};

export function FilesTabServer({
  dealId,
  files,
}: {
  dealId: string;
  files: DealFile[];
}) {
  return <FilesTabWrapper dealId={dealId} files={files} />;
}

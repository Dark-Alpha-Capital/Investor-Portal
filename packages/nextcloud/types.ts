export type NextcloudConfig = {
  url: string;
  user: string;
  password: string;
};

export type DealFile = {
  name: string;
  size: number;
  lastModified: string;
  mimeType: string;
  downloadUrl: string;
  path: string;
};

export type DealEntry = {
  kind: "folder" | "file";
  name: string;
  /** Full remote path, e.g. "/investor-portal/deals/acme/financials/Q3 model.xlsx". */
  path: string;
  /** Path relative to the deal folder root, e.g. "financials/Q3 model.xlsx". */
  relativePath: string;
  size: number;
  lastModified: string;
  mimeType: string;
  downloadUrl: string | null;
};

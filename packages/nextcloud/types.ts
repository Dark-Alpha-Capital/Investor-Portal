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
};

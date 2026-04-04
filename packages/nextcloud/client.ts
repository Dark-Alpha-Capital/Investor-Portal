import { createClient, type WebDAVClient } from "webdav";
import type { NextcloudConfig } from "./types";

export function createNextcloudClient(config: NextcloudConfig): WebDAVClient {
  const clientUrl = `${config.url.replace(/\/$/, "")}/remote.php/dav/files/${config.user}`;
  return createClient(clientUrl, {
    username: config.user,
    password: config.password,
  });
}

/**
 * Read Nextcloud settings from process.env (Node / Workers with nodejs_compat).
 */
export function getNextcloudConfigFromEnv(): NextcloudConfig {
  const url = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;

  if (!url || !user || !password) {
    throw new Error(
      "Nextcloud configuration is missing. Set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_PASSWORD.",
    );
  }

  return { url, user, password };
}

export function createNextcloudClientFromEnv(): WebDAVClient {
  return createNextcloudClient(getNextcloudConfigFromEnv());
}

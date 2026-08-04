/**
 * Canonical Nextcloud path layout for everything uploaded from the Investor
 * Portal. All uploads live under a single top-level `investor-portal` folder
 * so files are easy to find and manage in Nextcloud:
 *
 *   /investor-portal/deals/<deal-slug>/...                  → deal data room files
 *   /investor-portal/user-<Name>-Investor/kyc-files/onboarding/...  → investor KYC docs
 */

export const INVESTOR_PORTAL_ROOT = "/investor-portal";

/**
 * Keep a single path segment readable but safe: allow letters, digits, dots,
 * underscores and hyphens; collapse anything else to `_`; neutralise `..`.
 */
export function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.\./g, "_");
}

/** Deal data-room folder: /investor-portal/deals/<slug> */
export function dealFolderPath(dealSlug: string): string {
  return `${INVESTOR_PORTAL_ROOT}/deals/${sanitizePathSegment(dealSlug)}`;
}

/**
 * Investor KYC folder: /investor-portal/user-<Name>-Investor/kyc-files/onboarding
 * Falls back to a `user-<id>-Investor` segment when no name is available.
 */
export function investorKycFolderPath(userName: string): string {
  const namePart = userName && userName.trim() ? userName.replace(/\s+/g, "") : "unknown";
  return `${INVESTOR_PORTAL_ROOT}/${sanitizePathSegment(`user-${namePart}-Investor`)}/kyc-files/onboarding`;
}

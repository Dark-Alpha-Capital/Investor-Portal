import { isOpenForCommitments } from "./deal-marketplace";
import type { DealLifecycleStatus } from "./deal-marketplace";

export type { DealLifecycleStatus } from "./deal-marketplace";

/** Invitation access level granted to a user for a specific deal. */
export type DealAccessLevel = "teaser" | "data_room";

export type DealCapabilities = {
  canViewTeaser: boolean;
  canViewDocuments: boolean;
  canExpressInterest: boolean;
  canInvest: boolean;
  isAdminPreview: boolean;
  accessLevel: DealAccessLevel | null;
};

/**
 * Single authority for "what can this user do with this deal?"
 *
 * Policy is derived purely from inputs — no db access — so it is unit-testable
 * with zero mocks. Deal *access* (clearance + invitation) is a separate concern
 * handled by the caller; this module only maps {invitation level, lifecycle,
 * role} to capability flags.
 *
 * Rules:
 * - Admins preview the investor page but never act as LPs (canInvest=false).
 * - Teaser invitation: view teaser only.
 * - Data room invitation: documents + express interest; investing additionally
 *   requires the deal lifecycle to be open for commitments (live).
 */
export function getDealCapabilities({
  isAdmin,
  accessLevel,
  dealStatus,
}: {
  isAdmin: boolean;
  accessLevel: DealAccessLevel | null;
  dealStatus: DealLifecycleStatus;
}): DealCapabilities {
  if (isAdmin) {
    return {
      canViewTeaser: true,
      canViewDocuments: true,
      canExpressInterest: false,
      canInvest: false,
      isAdminPreview: true,
      accessLevel: "data_room",
    };
  }

  if (!accessLevel) {
    return {
      canViewTeaser: false,
      canViewDocuments: false,
      canExpressInterest: false,
      canInvest: false,
      isAdminPreview: false,
      accessLevel: null,
    };
  }

  const isDataRoom = accessLevel === "data_room";
  return {
    canViewTeaser: true,
    canViewDocuments: isDataRoom,
    canExpressInterest: isDataRoom,
    canInvest: isDataRoom && isOpenForCommitments({ status: dealStatus }),
    isAdminPreview: false,
    accessLevel,
  };
}

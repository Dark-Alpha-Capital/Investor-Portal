import { describe, expect, test } from "bun:test";
import {
  getDealCapabilities,
  type DealAccessLevel,
  type DealLifecycleStatus,
} from "./deal-policy";

const ALL_STATUSES: DealLifecycleStatus[] = [
  "draft",
  "coming_soon",
  "live",
  "closing",
  "funded",
  "exited",
  "cancelled",
];

describe("deal-policy getDealCapabilities", () => {
  test("no invitation → no capabilities for any lifecycle", () => {
    for (const dealStatus of ALL_STATUSES) {
      const caps = getDealCapabilities({
        isAdmin: false,
        accessLevel: null,
        dealStatus,
      });
      expect(caps).toEqual({
        canViewTeaser: false,
        canViewDocuments: false,
        canExpressInterest: false,
        canInvest: false,
        isAdminPreview: false,
        accessLevel: null,
      });
    }
  });

  test("teaser invitation → teaser only, never invest", () => {
    for (const dealStatus of ALL_STATUSES) {
      const caps = getDealCapabilities({
        isAdmin: false,
        accessLevel: "teaser",
        dealStatus,
      });
      expect(caps.canViewTeaser).toBe(true);
      expect(caps.canViewDocuments).toBe(false);
      expect(caps.canExpressInterest).toBe(false);
      expect(caps.canInvest).toBe(false);
      expect(caps.isAdminPreview).toBe(false);
      expect(caps.accessLevel).toBe("teaser");
    }
  });

  test("data room on live deal → full capabilities including invest", () => {
    const caps = getDealCapabilities({
      isAdmin: false,
      accessLevel: "data_room",
      dealStatus: "live",
    });
    expect(caps).toEqual({
      canViewTeaser: true,
      canViewDocuments: true,
      canExpressInterest: true,
      canInvest: true,
      isAdminPreview: false,
      accessLevel: "data_room",
    });
  });

  test("data room on non-live deal → no invest (lifecycle gate)", () => {
    const nonLive: DealLifecycleStatus[] = [
      "draft",
      "coming_soon",
      "closing",
      "funded",
      "exited",
      "cancelled",
    ];
    for (const dealStatus of nonLive) {
      const caps = getDealCapabilities({
        isAdmin: false,
        accessLevel: "data_room",
        dealStatus,
      });
      expect(caps.canViewDocuments).toBe(true);
      expect(caps.canExpressInterest).toBe(true);
      expect(caps.canInvest).toBe(false);
    }
  });

  test("admin previews but never participates as LP", () => {
    for (const dealStatus of ALL_STATUSES) {
      const caps = getDealCapabilities({
        isAdmin: true,
        accessLevel: null,
        dealStatus,
      });
      expect(caps.canViewTeaser).toBe(true);
      expect(caps.canViewDocuments).toBe(true);
      expect(caps.canExpressInterest).toBe(false);
      expect(caps.canInvest).toBe(false);
      expect(caps.isAdminPreview).toBe(true);
      expect(caps.accessLevel).toBe("data_room");
    }
  });
});

import { describe, expect, test } from "bun:test";
import { mapBetterAuthSession } from "./session-mapper";

type AnySession = Parameters<typeof mapBetterAuthSession>[0];

describe("session-mapper", () => {
  test("null session maps to null", () => {
    expect(mapBetterAuthSession(null)).toBeNull();
  });

  test("session without user maps to null", () => {
    expect(
      mapBetterAuthSession({ session: {} as never, user: null } as unknown as AnySession),
    ).toBeNull();
  });

  test("maps user fields including role", () => {
    const result = mapBetterAuthSession({
      user: {
        id: "u1",
        email: "a@darkalphacapital.com",
        name: "Ada",
        role: "admin",
        image: null,
      },
      session: {} as never,
    } as unknown as AnySession);
    expect(result).toEqual({
      user: {
        id: "u1",
        type: "regular",
        email: "a@darkalphacapital.com",
        name: "Ada",
        role: "admin",
        image: undefined,
      },
    });
  });

  test("omits absent name/image/role", () => {
    const result = mapBetterAuthSession({
      user: { id: "u2", email: "b@example.com" },
      session: {} as never,
    } as unknown as AnySession);
    expect(result).toEqual({
      user: {
        id: "u2",
        type: "regular",
        email: "b@example.com",
        name: undefined,
        role: undefined,
        image: undefined,
      },
    });
  });
});

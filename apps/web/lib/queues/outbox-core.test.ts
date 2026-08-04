import { describe, expect, test } from "bun:test";
import { dispatchOutboxCandidates, type DispatchTargets } from "./outbox-core";
import type { QueuePayload } from "./side-effect-payload";

/** Minimal in-memory outbox table backed by rows. */
function makeFakeOutbox() {
  const rows = new Map<
    string,
    { payload: unknown; status: string; attempts: number; lastError?: unknown; dispatchedAt?: unknown }
  >();
  let lastClaimedId: string | null = null;
  return {
    rows,
    insert(id: string, payload: unknown) {
      rows.set(id, { payload, status: "pending", attempts: 0 });
    },
    db: {
      select() {
        return {
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: (n: number) => {
                  const candidates = [...rows.entries()]
                    .filter(([, r]) => r.status === "pending" || r.status === "failed")
                    .filter(([, r]) => r.attempts < 5)
                    .slice(0, n)
                    .map(([id, r]) => ({ id, payload: r.payload, status: r.status }));
                  return Promise.resolve(candidates);
                },
              }),
            }),
          }),
        };
      },
      update() {
        return {
          set: (values: { status?: string; attempts?: unknown; lastError?: unknown; dispatchedAt?: unknown }) => ({
            where: () => {
              const apply = () => {
                // Claim phase: pick the first pending/failed row.
                if (values.status === "processing") {
                  for (const [id, r] of rows) {
                    if (r.status === "pending" || r.status === "failed") {
                      r.status = "processing";
                      if (typeof values.attempts === "object") r.attempts += 1;
                      lastClaimedId = id;
                      return [{ id, payload: r.payload }];
                    }
                  }
                  return [];
                }
                // Settlement phase: apply to the claimed row.
                if (lastClaimedId && rows.has(lastClaimedId)) {
                  const r = rows.get(lastClaimedId)!;
                  if (values.status) r.status = values.status;
                  if ("lastError" in values) r.lastError = values.lastError ?? null;
                  if (values.dispatchedAt) r.dispatchedAt = values.dispatchedAt;
                  lastClaimedId = null;
                  return [];
                }
                return [];
              };
              const thenable = {
                then: (resolve: (v: unknown) => void) => {
                  resolve(apply());
                },
              };
              return Object.assign(thenable, {
                returning: async () => apply(),
              });
            },
          }),
        };
      },
    } as never,
  };
}

const emailPayload: QueuePayload = {
  queue: "email",
  jobName: "knowledge-request-admin",
  jobId: "job-1",
  data: { to: "a@b.com" },
};

const dealPayload: QueuePayload = {
  queue: "deal",
  jobName: "create-deal",
  jobId: "job-2",
  data: {},
};

const onboardingPayload: QueuePayload = {
  queue: "onboarding",
  jobName: "upload-onboarding-files",
  jobId: "job-3",
  data: {},
};

describe("outbox dispatch loop", () => {
  test("claims pending rows and dispatches each via the right target", async () => {
    const outbox = makeFakeOutbox();
    outbox.insert("row-1", emailPayload);
    outbox.insert("row-2", dealPayload);

    const dispatched: string[] = [];
    const targets: DispatchTargets = {
      email: async (id) => {
        dispatched.push(`email:${id}`);
      },
      deal: async (id) => {
        dispatched.push(`deal:${id}`);
      },
      onboarding: async () => {},
    };

    await dispatchOutboxCandidates(outbox.db, targets);

    expect(dispatched).toEqual(["email:row-1", "deal:row-2"]);
    expect(outbox.rows.get("row-1")!.status).toBe("dispatched");
    expect(outbox.rows.get("row-2")!.status).toBe("dispatched");
  });

  test("onboarding target receives the outbox id and payload", async () => {
    const outbox = makeFakeOutbox();
    outbox.insert("row-3", onboardingPayload);

    let seen: { id: string; payload: QueuePayload } | null = null;
    const targets: DispatchTargets = {
      email: async () => {},
      deal: async () => {},
      onboarding: async (id, payload) => {
        seen = { id, payload };
      },
    };

    await dispatchOutboxCandidates(outbox.db, targets);
    expect(seen).not.toBeNull();
    expect(seen!).toEqual({ id: "row-3", payload: onboardingPayload });
    expect(outbox.rows.get("row-3")!.status).toBe("dispatched");
  });

  test("failed dispatch marks row failed and keeps attempts incremented", async () => {
    const outbox = makeFakeOutbox();
    outbox.insert("row-4", emailPayload);

    const targets: DispatchTargets = {
      email: async () => {
        throw new Error("boom");
      },
      deal: async () => {},
      onboarding: async () => {},
    };

    await dispatchOutboxCandidates(outbox.db, targets);
    expect(outbox.rows.get("row-4")!.status).toBe("failed");
    expect(outbox.rows.get("row-4")!.attempts).toBe(1);
  });

  test("skips rows already at the dispatch attempt ceiling", async () => {
    const outbox = makeFakeOutbox();
    outbox.rows.set("row-5", { payload: emailPayload, status: "failed", attempts: 5 });

    let called = 0;
    const targets: DispatchTargets = {
      email: async () => {
        called += 1;
      },
      deal: async () => {},
      onboarding: async () => {},
    };

    await dispatchOutboxCandidates(outbox.db, targets);
    expect(called).toBe(0);
    expect(outbox.rows.get("row-5")!.status).toBe("failed");
  });
});

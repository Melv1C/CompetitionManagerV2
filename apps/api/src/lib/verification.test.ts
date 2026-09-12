import { describe, expect, it } from "vitest";

import { createInMemoryVerificationTokenStore } from "./verification";

describe("verification token store", () => {
  it("consumes a token once and rejects expired or unknown values", async () => {
    const store = createInMemoryVerificationTokenStore();
    await store.issue("user@example.test", "valid-token", new Date(Date.now() + 60_000));

    await expect(store.consume("wrong-token")).resolves.toBe(false);
    await expect(store.consume("valid-token")).resolves.toBe(true);
    await expect(store.consume("valid-token")).resolves.toBe(false);

    await store.issue("user@example.test", "expired-token", new Date(Date.now() - 1));
    await expect(store.consume("expired-token")).resolves.toBe(false);
  });
});

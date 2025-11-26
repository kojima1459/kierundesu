import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { encryptApiKey, decryptApiKey } from "./encryption";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("apiKey router", () => {
  it("should save and retrieve API key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save API key
    const saveResult = await caller.apiKey.save({
      apiKey: "sk-test1234567890",
      keyType: "openai",
    });

    expect(saveResult.success).toBe(true);

    // Get API key
    const getResult = await caller.apiKey.get();

    expect(getResult.hasKey).toBe(true);
    expect(getResult.keyType).toBe("openai");
    expect(getResult.maskedKey).toContain("sk-t");
    expect(getResult.maskedKey).toContain("...");
  });

  it("should delete API key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save API key first
    await caller.apiKey.save({
      apiKey: "sk-test1234567890",
      keyType: "openai",
    });

    // Delete API key
    const deleteResult = await caller.apiKey.delete();
    expect(deleteResult.success).toBe(true);

    // Verify deletion
    const getResult = await caller.apiKey.get();
    expect(getResult.hasKey).toBe(false);
  });
});

describe("encryption", () => {
  it("should encrypt and decrypt API key correctly", () => {
    const originalKey = "sk-test1234567890abcdef";
    const encrypted = encryptApiKey(originalKey);
    const decrypted = decryptApiKey(encrypted);

    expect(decrypted).toBe(originalKey);
    expect(encrypted).not.toBe(originalKey);
  });

  it("should produce different ciphertext for the same plaintext", () => {
    const originalKey = "sk-test1234567890";
    const encrypted1 = encryptApiKey(originalKey);
    const encrypted2 = encryptApiKey(originalKey);

    // Different ciphertext due to random salt and IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both decrypt to the same plaintext
    expect(decryptApiKey(encrypted1)).toBe(originalKey);
    expect(decryptApiKey(encrypted2)).toBe(originalKey);
  });
});

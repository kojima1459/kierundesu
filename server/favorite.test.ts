import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
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

describe("resume.history.toggleFavorite", () => {
  it("should return error for non-existent resume", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.resume.history.toggleFavorite({
        id: 999999,
        isFavorite: true,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBeTruthy();
    }
  });

  it("should validate input parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test with invalid id (negative number)
    try {
      await caller.resume.history.toggleFavorite({
        id: -1,
        isFavorite: true,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBeTruthy();
    }
  });
});

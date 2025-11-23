import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            content: "再生成されたテスト用の内容です。",
          }),
        },
      },
    ],
  })),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("resume.regenerate", () => {
  it("正常に項目を再生成できる", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resume.regenerate({
      item: "motivation",
      resumeText: "私は10年間のソフトウェアエンジニア経験があります。",
      jobDescription: "シニアエンジニアを募集しています。",
      charLimit: 400,
      previousContent: "前回の志望動機です。",
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("職務経歴書が空の場合はエラーを返す", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.resume.regenerate({
        item: "motivation",
        resumeText: "",
        jobDescription: "シニアエンジニアを募集しています。",
        charLimit: 400,
      })
    ).rejects.toThrow();
  });

  it("求人情報が空の場合はエラーを返す", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.resume.regenerate({
        item: "motivation",
        resumeText: "私は10年間のソフトウェアエンジニア経験があります。",
        jobDescription: "",
        charLimit: 400,
      })
    ).rejects.toThrow();
  });
});

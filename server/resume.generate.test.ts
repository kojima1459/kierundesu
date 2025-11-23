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
            summary: "テスト用の職務要約です。",
            motivation: "テスト用の志望動機です。",
            self_pr: "テスト用の自己PRです。",
            why_company: "テスト用のなぜ御社かです。",
          }),
        },
      },
    ],
  })),
}));

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

describe("resume.generate", () => {
  it("正常に職務経歴書を生成できる", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resume.generate({
      resumeText: "私は10年間のソフトウェアエンジニア経験があります。",
      jobDescription: "シニアエンジニアを募集しています。",
      outputItems: ["summary", "motivation", "self_pr", "why_company"],
      charLimits: {
        summary: 350,
        motivation: 400,
        self_pr: 600,
        why_company: 400,
      },
    });

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("motivation");
    expect(result).toHaveProperty("self_pr");
    expect(result).toHaveProperty("why_company");
    expect(typeof result.summary).toBe("string");
    expect(typeof result.motivation).toBe("string");
    expect(typeof result.self_pr).toBe("string");
    expect(typeof result.why_company).toBe("string");
  });

  it("職務経歴書が空の場合はエラーを返す", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.resume.generate({
        resumeText: "",
        jobDescription: "シニアエンジニアを募集しています。",
        outputItems: ["summary"],
        charLimits: {},
      })
    ).rejects.toThrow();
  });

  it("求人情報が空の場合はエラーを返す", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.resume.generate({
        resumeText: "私は10年間のソフトウェアエンジニア経験があります。",
        jobDescription: "",
        outputItems: ["summary"],
        charLimits: {},
      })
    ).rejects.toThrow();
  });
});

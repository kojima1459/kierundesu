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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("resume.evaluate", () => {
  it("should evaluate resume content and return scores", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const resumeContent = `
職務要約:
10年以上のソフトウェア開発経験を持つフルスタックエンジニア。
React、Node.js、TypeScriptを使用したWebアプリケーション開発に精通。

職務経歴:
2020年-現在: ABC株式会社
- React/TypeScriptを使用したSPA開発
- Node.js/Expressを使用したRESTful API設計・実装
- AWS (EC2, S3, RDS) を使用したインフラ構築
    `;

    const jobDescription = `
【募集職種】フルスタックエンジニア
【必須スキル】
- React、TypeScript、Node.jsの実務経験3年以上
- RESTful API設計・実装経験
- AWSを使用したインフラ構築経験
【歓迎スキル】
- チームリーダー経験
- アジャイル開発経験
    `;

    const result = await caller.resume.evaluate({
      resumeContent,
      jobDescription,
    });

    // 評価結果の検証
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.details).toBeDefined();
    expect(result.details.relevance).toBeGreaterThanOrEqual(0);
    expect(result.details.relevance).toBeLessThanOrEqual(100);
    expect(result.details.clarity).toBeGreaterThanOrEqual(0);
    expect(result.details.clarity).toBeLessThanOrEqual(100);
    expect(result.details.impact).toBeGreaterThanOrEqual(0);
    expect(result.details.impact).toBeLessThanOrEqual(100);
    expect(result.details.completeness).toBeGreaterThanOrEqual(0);
    expect(result.details.completeness).toBeLessThanOrEqual(100);
    expect(result.details.feedback).toBeDefined();
    expect(typeof result.details.feedback).toBe("string");
  }, 30000); // 30秒のタイムアウト（LLM呼び出しのため）
});

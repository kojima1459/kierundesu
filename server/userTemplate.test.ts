import { describe, expect, it, beforeAll } from "vitest";
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

let createdTemplateId: number;

describe("userTemplate.create", () => {
  it("should create a new user template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.create({
      name: "テストテンプレート",
      description: "これはテスト用のテンプレートです",
      promptTemplate: "あなたは職務経歴書最適化の専門家です。\n\n職務経歴書: {{resumeText}}\n求人情報: {{jobDescription}}",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
    
    createdTemplateId = result.id!;
  });
});

describe("userTemplate.list", () => {
  it("should return a list of user templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    const template = result[0];
    expect(template).toHaveProperty("id");
    expect(template).toHaveProperty("name");
    expect(template).toHaveProperty("description");
    expect(template).toHaveProperty("promptTemplate");
  });
});

describe("userTemplate.getById", () => {
  it("should return a user template by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.getById({ id: createdTemplateId });

    expect(result).toBeDefined();
    expect(result.id).toBe(createdTemplateId);
    expect(result.name).toBe("テストテンプレート");
    expect(result.description).toBe("これはテスト用のテンプレートです");
  });

  it("should throw an error for non-existent template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.userTemplate.getById({ id: 999999 })
    ).rejects.toThrow("テンプレートが見つかりません");
  });
});

describe("userTemplate.update", () => {
  it("should update a user template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.update({
      id: createdTemplateId,
      name: "更新されたテンプレート",
      description: "説明も更新されました",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.userTemplate.getById({ id: createdTemplateId });
    expect(updated.name).toBe("更新されたテンプレート");
    expect(updated.description).toBe("説明も更新されました");
  });
});

describe("userTemplate.generateWithUserTemplate", () => {
  it("should generate content using a user template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.generateWithUserTemplate({
      templateId: createdTemplateId,
      resumeText: "5年間のWebエンジニア経験。React、Node.jsを使用した開発経験あり。",
      jobDescription: "フロントエンドエンジニア募集。React経験者優遇。",
      outputItems: ["summary", "motivation"],
      charLimits: { summary: 300, motivation: 400 },
      saveHistory: false,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("motivation");
    expect(typeof result.summary).toBe("string");
    expect(typeof result.motivation).toBe("string");
  }, 30000); // Increase timeout for LLM call
});

describe("userTemplate.delete", () => {
  it("should delete a user template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userTemplate.delete({ id: createdTemplateId });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify deletion
    await expect(
      caller.userTemplate.getById({ id: createdTemplateId })
    ).rejects.toThrow("テンプレートが見つかりません");
  });
});

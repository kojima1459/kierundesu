import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  resume: router({
    generate: publicProcedure
      .input(
        z.object({
          resumeText: z.string().min(1, "職務経歴書を入力してください"),
          jobDescription: z.string().min(1, "求人情報を入力してください"),
          outputItems: z.array(z.enum(["summary", "motivation", "self_pr", "why_company"])),
          charLimits: z.object({
            summary: z.number().optional(),
            motivation: z.number().optional(),
            self_pr: z.number().optional(),
            why_company: z.number().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { resumeText, jobDescription, outputItems, charLimits } = input;

        const itemLabels: Record<string, string> = {
          summary: "職務要約",
          motivation: "志望動機",
          self_pr: "自己PR",
          why_company: "なぜ御社か",
        };

        const outputInstructions = outputItems
          .map((item) => {
            const label = itemLabels[item] || item;
            const limit = charLimits[item as keyof typeof charLimits];
            return `- ${label}: ${limit ? `${limit}文字以内` : "適切な長さ"}`;
          })
          .join("\n");

        const prompt = `あなたは職務経歴書最適化の専門家です。

【入力情報】
■職務経歴書
${resumeText}

■求人情報
${jobDescription}

【指示】
上記の職務経歴書を、求人情報に最適化してください。
以下の条件を厳守してください:

1. 嘘は絶対につかない
2. 既存の経歴・スキルの「見せ方」を最適化
3. 求人が求める人物像に合わせて強調点を変える
4. 具体的な数字・実績を活用

【出力項目と文字数】
${outputInstructions}

【出力形式】
JSON形式で出力してください。キーは以下の通りです:
${outputItems.map((item) => `"${item}"`).join(", ")}

例:
{
  "summary": "...",
  "motivation": "...",
  "self_pr": "...",
  "why_company": "..."
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_optimization",
              strict: true,
              schema: {
                type: "object",
                properties: Object.fromEntries(
                  outputItems.map((item) => [
                    item,
                    {
                      type: "string",
                      description: `${itemLabels[item]}の内容`,
                    },
                  ])
                ),
                required: outputItems,
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("生成に失敗しました");
        }

        const result = JSON.parse(content);
        return result;
      }),

    regenerate: publicProcedure
      .input(
        z.object({
          item: z.enum(["summary", "motivation", "self_pr", "why_company"]),
          resumeText: z.string().min(1),
          jobDescription: z.string().min(1),
          charLimit: z.number().optional(),
          previousContent: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { item, resumeText, jobDescription, charLimit, previousContent } = input;

        const itemLabels: Record<string, string> = {
          summary: "職務要約",
          motivation: "志望動機",
          self_pr: "自己PR",
          why_company: "なぜ御社か",
        };

        const label = itemLabels[item] || item;

        const prompt = `あなたは職務経歴書最適化の専門家です。

【入力情報】
■職務経歴書
${resumeText}

■求人情報
${jobDescription}

${previousContent ? `■前回の生成内容\n${previousContent}\n` : ""}

【指示】
上記の情報を基に、「${label}」を${previousContent ? "別のパターンで" : ""}生成してください。
以下の条件を厳守してください:

1. 嘘は絶対につかない
2. 既存の経歴・スキルの「見せ方」を最適化
3. 求人が求める人物像に合わせて強調点を変える
4. 具体的な数字・実績を活用
${charLimit ? `5. ${charLimit}文字以内で記述` : ""}
${previousContent ? "6. 前回とは異なる表現や強調点を使用" : ""}

【出力形式】
JSON形式で出力してください:
{
  "content": "生成された${label}の内容"
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_regeneration",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: `${label}の内容`,
                  },
                },
                required: ["content"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("再生成に失敗しました");
        }

        const result = JSON.parse(content);
        return { content: result.content };
      }),
  }),
});

export type AppRouter = typeof appRouter;

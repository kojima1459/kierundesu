import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { saveResume, getUserResumes, getResumeById, deleteResume } from "./db";

const STANDARD_ITEMS = [
  "summary",
  "career_history",
  "motivation",
  "self_pr",
  "why_company",
  "what_to_achieve",
] as const;

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
    generate: protectedProcedure
      .input(
        z.object({
          resumeText: z.string().min(1, "職務経歴書を入力してください"),
          jobDescription: z.string().min(1, "求人情報を入力してください"),
          outputItems: z.array(z.string()),
          charLimits: z.record(z.string(), z.number()),
          customItems: z
            .array(
              z.object({
                key: z.string(),
                label: z.string(),
                charLimit: z.number().optional(),
              })
            )
            .optional(),
          saveHistory: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { resumeText, jobDescription, outputItems, charLimits, customItems, saveHistory } = input;

        const itemLabels: Record<string, string> = {
          summary: "職務要約",
          career_history: "職務経歴",
          motivation: "志望動機",
          self_pr: "自己PR",
          why_company: "なぜ御社か",
          what_to_achieve: "企業で実現したいこと",
        };

        // Add custom item labels
        if (customItems) {
          customItems.forEach((item) => {
            itemLabels[item.key] = item.label;
          });
        }

        const outputInstructions = outputItems
          .map((item) => {
            const label = itemLabels[item] || item;
            const limit = charLimits[item];
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

        // Save to history if requested
        if (saveHistory && ctx.user) {
          await saveResume({
            userId: ctx.user.id,
            resumeText,
            jobDescription,
            generatedContent: JSON.stringify(result),
            customItems: customItems ? JSON.stringify(customItems) : null,
          });
        }

        return result;
      }),

    regenerate: protectedProcedure
      .input(
        z.object({
          item: z.string(),
          resumeText: z.string().min(1),
          jobDescription: z.string().min(1),
          charLimit: z.number().optional(),
          previousContent: z.string().optional(),
          itemLabel: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { item, resumeText, jobDescription, charLimit, previousContent, itemLabel } = input;

        const defaultLabels: Record<string, string> = {
          summary: "職務要約",
          career_history: "職務経歴",
          motivation: "志望動機",
          self_pr: "自己PR",
          why_company: "なぜ御社か",
          what_to_achieve: "企業で実現したいこと",
        };

        const label = itemLabel || defaultLabels[item] || item;

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

    // History management
    history: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const resumes = await getUserResumes(ctx.user.id);
        return resumes.map((resume) => ({
          id: resume.id,
          createdAt: resume.createdAt,
          resumeTextPreview: resume.resumeText.substring(0, 100) + "...",
          jobDescriptionPreview: resume.jobDescription.substring(0, 100) + "...",
        }));
      }),

      get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const resume = await getResumeById(input.id, ctx.user.id);
          if (!resume) {
            throw new Error("履歴が見つかりません");
          }
          return {
            id: resume.id,
            resumeText: resume.resumeText,
            jobDescription: resume.jobDescription,
            generatedContent: JSON.parse(resume.generatedContent),
            customItems: resume.customItems ? JSON.parse(resume.customItems) : null,
            createdAt: resume.createdAt,
          };
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const success = await deleteResume(input.id, ctx.user.id);
          if (!success) {
            throw new Error("履歴の削除に失敗しました");
          }
          return { success };
        }),
    }),

    translate: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          itemLabel: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { text, itemLabel } = input;

        const prompt = `以下の日本語の「${itemLabel}」を英語に翻訳してください。

原文:
${text}

条件:
1. ビジネス英語として自然で洗練された表現を使用
2. 職務経歴書で使われる専門用語を適切に使用
3. 原文のニュアンスを保ちながら翻訳

出力形式:
JSON形式で出力してください:
{
  "translation": "翻訳された英語テキスト"
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
              name: "translation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  translation: {
                    type: "string",
                    description: "翻訳された英語テキスト",
                  },
                },
                required: ["translation"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("翻訳に失敗しました");
        }

        const result = JSON.parse(content);
        return { translation: result.translation };
      }),
  }),
});

export type AppRouter = typeof appRouter;

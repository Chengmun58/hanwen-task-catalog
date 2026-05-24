import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getArticlesByDate,
  getVocabularyByDate,
  getLatestContentDate,
  getAvailableContentDates,
  insertDailyArticles,
  insertDailyVocabulary,
  createDailyContentJob,
  updateDailyContentJob,
  hasContentForDate,
} from "../db";
import {
  generateDailyContent,
  getBeijingDateString,
  prepareArticlesForInsert,
  prepareVocabularyForInsert,
} from "../services/contentGenerator";

export const dailyContentRouter = router({
  /**
   * Get articles for a specific date (defaults to today Beijing time).
   */
  getArticles: publicProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ input }) => {
      const date = input.date ?? getBeijingDateString();
      const articles = await getArticlesByDate(date);
      return { date, articles };
    }),

  /**
   * Get vocabulary for a specific date (defaults to today Beijing time).
   */
  getVocabulary: publicProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ input }) => {
      const date = input.date ?? getBeijingDateString();
      const vocabulary = await getVocabularyByDate(date);
      return { date, vocabulary };
    }),

  /**
   * Get the latest available content date.
   */
  getLatestDate: publicProcedure.query(async () => {
    const date = await getLatestContentDate();
    return { date };
  }),

  /**
   * Get list of dates with available content.
   */
  getAvailableDates: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ input }) => {
      const dates = await getAvailableContentDates(input.limit);
      return { dates };
    }),

  /**
   * Manually trigger content generation for a specific date.
   * Protected: only authenticated users can trigger this.
   */
  generate: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const contentDate = input.date ?? getBeijingDateString();

      // Check if content already exists (unless force=true)
      if (!input.force) {
        const exists = await hasContentForDate(contentDate);
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `${contentDate} 的内容已存在。使用 force=true 强制重新生成。`,
          });
        }
      }

      // Create job record
      const { id: jobId } = await createDailyContentJob({
        contentDate,
        status: "running",
        scheduleCronTaskUid: null,
      });

      try {
        // Generate content via LLM
        const { articles, vocabulary } = await generateDailyContent(contentDate);

        // Insert into DB
        const articleRows = prepareArticlesForInsert(articles, contentDate);
        const vocabRows = prepareVocabularyForInsert(vocabulary, contentDate);

        await insertDailyArticles(articleRows);
        await insertDailyVocabulary(vocabRows);

        // Update job record
        await updateDailyContentJob(jobId, {
          status: "completed",
          articlesGenerated: articles.length,
          vocabularyGenerated: vocabulary.length,
          completedAt: new Date(),
        });

        return {
          success: true,
          date: contentDate,
          articlesGenerated: articles.length,
          vocabularyGenerated: vocabulary.length,
        };
      } catch (error) {
        await updateDailyContentJob(jobId, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `内容生成失败：${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),
});

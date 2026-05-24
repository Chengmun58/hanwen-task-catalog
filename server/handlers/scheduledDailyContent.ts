import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  getJobByTaskUid,
  createDailyContentJob,
  updateDailyContentJob,
  hasContentForDate,
  insertDailyArticles,
  insertDailyVocabulary,
} from "../db";
import {
  generateDailyContent,
  getBeijingDateString,
  prepareArticlesForInsert,
  prepareVocabularyForInsert,
} from "../services/contentGenerator";

/**
 * POST /api/scheduled/daily-content
 *
 * Heartbeat handler triggered daily at 09:00 Beijing time (01:00 UTC).
 * Generates 5 Korean articles + 5 MZ vocabulary items and saves to DB.
 *
 * Auth: platform sets user.isCron = true and user.taskUid on each trigger.
 */
export async function scheduledDailyContentHandler(req: Request, res: Response) {
  const startTime = Date.now();
  let jobId: number | null = null;

  try {
    // Authenticate the cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const taskUid = user.taskUid;
    const contentDate = getBeijingDateString();

    console.log(`[DailyContent] Heartbeat triggered for date: ${contentDate}, taskUid: ${taskUid}`);

    // Idempotency check: skip if content already exists for today
    const alreadyExists = await hasContentForDate(contentDate);
    if (alreadyExists) {
      console.log(`[DailyContent] Content already exists for ${contentDate}, skipping.`);
      return res.json({ ok: true, skipped: true, reason: "content already exists", date: contentDate });
    }

    // Create job record
    const { id } = await createDailyContentJob({
      contentDate,
      status: "running",
      scheduleCronTaskUid: taskUid,
    });
    jobId = id;

    // Generate content
    const { articles, vocabulary } = await generateDailyContent(contentDate);

    // Save to DB
    const articleRows = prepareArticlesForInsert(articles, contentDate);
    const vocabRows = prepareVocabularyForInsert(vocabulary, contentDate);

    await insertDailyArticles(articleRows);
    await insertDailyVocabulary(vocabRows);

    // Mark job as completed
    await updateDailyContentJob(jobId, {
      status: "completed",
      articlesGenerated: articles.length,
      vocabularyGenerated: vocabulary.length,
      completedAt: new Date(),
    });

    const duration = Date.now() - startTime;
    console.log(`[DailyContent] Generated ${articles.length} articles + ${vocabulary.length} vocab in ${duration}ms`);

    return res.json({
      ok: true,
      date: contentDate,
      articlesGenerated: articles.length,
      vocabularyGenerated: vocabulary.length,
      durationMs: duration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DailyContent] Handler error:", error);

    // Update job record if we created one
    if (jobId !== null) {
      try {
        await updateDailyContentJob(jobId, {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        });
      } catch (dbError) {
        console.error("[DailyContent] Failed to update job record:", dbError);
      }
    }

    return res.status(500).json({
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (error as any)?.taskUid ?? "unknown",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

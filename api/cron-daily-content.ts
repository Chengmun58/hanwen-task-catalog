import {
  createDailyContentJob,
  hasContentForDate,
  insertDailyArticles,
  insertDailyVocabulary,
  updateDailyContentJob,
} from "../server/db";
import {
  generateDailyContent,
  getBeijingDateString,
  prepareArticlesForInsert,
  prepareVocabularyForInsert,
} from "../server/services/contentGenerator";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers?.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const querySecret = typeof req.query?.secret === "string" ? req.query.secret : "";
    if (token !== cronSecret && querySecret !== cronSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized cron request" });
    }
  }

  const startedAt = Date.now();
  const contentDate = getBeijingDateString();
  let jobId: number | null = null;

  try {
    const exists = await hasContentForDate(contentDate);
    if (exists) {
      return res.status(200).json({ ok: true, skipped: true, date: contentDate, reason: "content already exists" });
    }

    const job = await createDailyContentJob({
      contentDate,
      status: "running",
      scheduleCronTaskUid: `vercel-cron-${contentDate}`,
    });
    jobId = job.id;

    const generated = await generateDailyContent(contentDate);
    const articles = prepareArticlesForInsert(generated.articles, contentDate);
    const vocabulary = prepareVocabularyForInsert(generated.vocabulary, contentDate);

    await insertDailyArticles(articles);
    await insertDailyVocabulary(vocabulary);

    await updateDailyContentJob(jobId, {
      status: "completed",
      articlesGenerated: articles.length,
      vocabularyGenerated: vocabulary.length,
      completedAt: new Date(),
    });

    return res.status(200).json({
      ok: true,
      date: contentDate,
      articlesGenerated: articles.length,
      vocabularyGenerated: vocabulary.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (jobId !== null) {
      try {
        await updateDailyContentJob(jobId, {
          status: "failed",
          errorMessage: message,
          completedAt: new Date(),
        });
      } catch {}
    }
    return res.status(500).json({ ok: false, date: contentDate, error: message });
  }
}

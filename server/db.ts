import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  uploadedFiles, InsertUploadedFile, UploadedFile,
  dailyArticles, InsertDailyArticle, DailyArticle,
  dailyVocabulary, InsertDailyVocabulary, DailyVocabulary,
  dailyContentJobs, InsertDailyContentJob, DailyContentJob,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── File Storage Queries ───────────────────────────────────────────────────

export async function insertUploadedFile(file: InsertUploadedFile): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploadedFiles).values(file);
  return { id: Number((result as any)[0]?.insertId ?? 0) };
}

export async function getFilesByUserId(userId: number): Promise<UploadedFile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.createdAt));
}

export async function getFileById(id: number, userId?: number): Promise<UploadedFile | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = userId !== undefined
    ? and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId))
    : eq(uploadedFiles.id, id);
  const result = await db.select().from(uploadedFiles).where(conditions).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteFileById(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.delete(uploadedFiles).where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}

export async function updateFileMetadata(
  id: number, userId: number,
  updates: { description?: string | null; category?: UploadedFile["category"] }
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(uploadedFiles).set(updates).where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));
  return (result as any)[0]?.affectedRows > 0;
}

// ─── Daily Content Queries ──────────────────────────────────────────────────

/**
 * Get all articles for a specific date.
 */
export async function getArticlesByDate(contentDate: string): Promise<DailyArticle[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(dailyArticles).where(eq(dailyArticles.contentDate, contentDate)).orderBy(dailyArticles.id);
}

/**
 * Get all vocabulary for a specific date.
 */
export async function getVocabularyByDate(contentDate: string): Promise<DailyVocabulary[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(dailyVocabulary).where(eq(dailyVocabulary.contentDate, contentDate)).orderBy(dailyVocabulary.id);
}

/**
 * Get the most recent content date that has articles.
 */
export async function getLatestContentDate(): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ contentDate: dailyArticles.contentDate })
    .from(dailyArticles)
    .orderBy(desc(dailyArticles.contentDate))
    .limit(1);
  return result.length > 0 ? result[0].contentDate : null;
}

/**
 * Get list of dates that have content (for calendar/navigation).
 */
export async function getAvailableContentDates(limit = 30): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.selectDistinct({ contentDate: dailyArticles.contentDate })
    .from(dailyArticles)
    .orderBy(desc(dailyArticles.contentDate))
    .limit(limit);
  return result.map(r => r.contentDate);
}

/**
 * Insert a batch of daily articles.
 */
export async function insertDailyArticles(articles: InsertDailyArticle[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (articles.length === 0) return;
  await db.insert(dailyArticles).values(articles);
}

/**
 * Insert a batch of daily vocabulary items.
 */
export async function insertDailyVocabulary(items: InsertDailyVocabulary[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;
  await db.insert(dailyVocabulary).values(items);
}

/**
 * Create a daily content job record.
 */
export async function createDailyContentJob(job: InsertDailyContentJob): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailyContentJobs).values(job);
  return { id: Number((result as any)[0]?.insertId ?? 0) };
}

/**
 * Update a daily content job status.
 */
export async function updateDailyContentJob(
  id: number,
  updates: Partial<Pick<DailyContentJob, "status" | "articlesGenerated" | "vocabularyGenerated" | "errorMessage" | "completedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyContentJobs).set(updates).where(eq(dailyContentJobs.id, id));
}

/**
 * Find a job by its cron task UID.
 */
export async function getJobByTaskUid(taskUid: string): Promise<DailyContentJob | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(dailyContentJobs)
    .where(eq(dailyContentJobs.scheduleCronTaskUid, taskUid)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Check if content already exists for a given date (to prevent duplicate generation).
 */
export async function hasContentForDate(contentDate: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ id: dailyArticles.id })
    .from(dailyArticles)
    .where(eq(dailyArticles.contentDate, contentDate))
    .limit(1);
  return result.length > 0;
}

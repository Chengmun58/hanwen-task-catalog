import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, uploadedFiles, InsertUploadedFile, UploadedFile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── File Storage Queries ───────────────────────────────────────────────────

/**
 * Insert a new uploaded file record into the database.
 */
export async function insertUploadedFile(file: InsertUploadedFile): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(uploadedFiles).values(file);
  return { id: Number((result as any)[0]?.insertId ?? 0) };
}

/**
 * Get all files uploaded by a specific user, ordered by newest first.
 */
export async function getFilesByUserId(userId: number): Promise<UploadedFile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.userId, userId))
    .orderBy(desc(uploadedFiles.createdAt));
}

/**
 * Get a single file by its ID, optionally scoped to a specific user.
 */
export async function getFileById(id: number, userId?: number): Promise<UploadedFile | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = userId !== undefined
    ? and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId))
    : eq(uploadedFiles.id, id);

  const result = await db.select().from(uploadedFiles).where(conditions).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Delete a file record by ID, scoped to a specific user for security.
 */
export async function deleteFileById(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(uploadedFiles)
    .where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));

  return (result as any)[0]?.affectedRows > 0;
}

/**
 * Update file description or category.
 */
export async function updateFileMetadata(
  id: number,
  userId: number,
  updates: { description?: string | null; category?: UploadedFile["category"] }
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(uploadedFiles)
    .set(updates)
    .where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));

  return (result as any)[0]?.affectedRows > 0;
}

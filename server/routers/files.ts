import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import {
  insertUploadedFile,
  getFilesByUserId,
  getFileById,
  deleteFileById,
  updateFileMetadata,
} from "../db";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
  "video/mp4",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const categoryEnum = z.enum(["vocabulary", "grammar", "listening", "reading", "other"]);

export const filesRouter = router({
  /**
   * Upload a file: accepts base64-encoded content, uploads to S3, saves metadata to DB.
   * Max file size: 16MB.
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(512),
        mimeType: z.string().min(1).max(128),
        base64Data: z.string().min(1),
        fileSize: z.number().int().positive(),
        category: categoryEnum.default("other"),
        description: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate file size
      if (input.fileSize > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`,
        });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `不支持的文件类型：${input.mimeType}`,
        });
      }

      // Decode base64 data (strip data URL prefix if present)
      const base64Content = input.base64Data.includes(",")
        ? input.base64Data.split(",")[1]
        : input.base64Data;

      const fileBuffer = Buffer.from(base64Content, "base64");

      // Sanitize filename for storage key
      const sanitizedName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `users/${ctx.user.id}/files/${Date.now()}_${sanitizedName}`;

      // Upload to S3
      const { key, url } = await storagePut(storageKey, fileBuffer, input.mimeType);

      // Save metadata to database
      const { id } = await insertUploadedFile({
        userId: ctx.user.id,
        filename: input.filename,
        fileKey: key,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        category: input.category,
        description: input.description ?? null,
      });

      return {
        id,
        filename: input.filename,
        fileKey: key,
        fileUrl: url,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        category: input.category,
        description: input.description ?? null,
        createdAt: new Date(),
      };
    }),

  /**
   * List all files uploaded by the current user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const files = await getFilesByUserId(ctx.user.id);
    return files;
  }),

  /**
   * Get a single file by ID (must belong to current user).
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const file = await getFileById(input.id, ctx.user.id);
      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "文件不存在或无权访问",
        });
      }
      return file;
    }),

  /**
   * Delete a file record (metadata only; the S3 object becomes unreachable).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership first
      const file = await getFileById(input.id, ctx.user.id);
      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "文件不存在或无权删除",
        });
      }

      const deleted = await deleteFileById(input.id, ctx.user.id);
      return { success: deleted };
    }),

  /**
   * Update file metadata (description and/or category).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        description: z.string().max(1000).nullable().optional(),
        category: categoryEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Verify ownership
      const file = await getFileById(id, ctx.user.id);
      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "文件不存在或无权修改",
        });
      }

      const updated = await updateFileMetadata(id, ctx.user.id, updates);
      return { success: updated };
    }),
});

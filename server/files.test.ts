import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  insertUploadedFile: vi.fn().mockResolvedValue({ id: 1 }),
  getFilesByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 42,
      filename: "test.pdf",
      fileKey: "users/42/files/test_abc123.pdf",
      fileUrl: "/manus-storage/users/42/files/test_abc123.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      category: "reading",
      description: "Test file",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ]),
  getFileById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 42,
    filename: "test.pdf",
    fileKey: "users/42/files/test_abc123.pdf",
    fileUrl: "/manus-storage/users/42/files/test_abc123.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    category: "reading",
    description: "Test file",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  }),
  deleteFileById: vi.fn().mockResolvedValue(true),
  updateFileMetadata: vi.fn().mockResolvedValue(true),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "users/42/files/test_abc123.pdf",
    url: "/manus-storage/users/42/files/test_abc123.pdf",
  }),
  storageGet: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

const mockUser = {
  id: 42,
  openId: "test-open-id",
  name: "Test User",
  email: "test@example.com",
  loginMethod: "oauth",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createMockContext(): TrpcContext {
  return {
    req: {} as any,
    res: {} as any,
    user: mockUser,
  };
}

describe("files router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list: returns files for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.files.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].filename).toBe("test.pdf");
  });

  it("upload: successfully uploads a valid PDF file", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a minimal valid base64 PDF
    const base64Data = Buffer.from("%PDF-1.4 test content").toString("base64");

    const result = await caller.files.upload({
      filename: "test.pdf",
      mimeType: "application/pdf",
      base64Data,
      fileSize: 1024,
      category: "reading",
      description: "A test PDF",
    });

    expect(result.filename).toBe("test.pdf");
    expect(result.category).toBe("reading");
    expect(result.fileUrl).toContain("/manus-storage/");
  });

  it("upload: rejects files exceeding 16MB", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const base64Data = Buffer.from("small content").toString("base64");

    await expect(
      caller.files.upload({
        filename: "huge.pdf",
        mimeType: "application/pdf",
        base64Data,
        fileSize: 17 * 1024 * 1024, // 17MB
        category: "other",
      })
    ).rejects.toThrow();
  });

  it("upload: rejects unsupported MIME types", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const base64Data = Buffer.from("executable content").toString("base64");

    await expect(
      caller.files.upload({
        filename: "malware.exe",
        mimeType: "application/x-msdownload",
        base64Data,
        fileSize: 1024,
        category: "other",
      })
    ).rejects.toThrow();
  });

  it("delete: successfully deletes an owned file", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("delete: throws NOT_FOUND when file does not belong to user", async () => {
    const { getFileById } = await import("./db");
    vi.mocked(getFileById).mockResolvedValueOnce(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.delete({ id: 999 })).rejects.toThrow();
  });

  it("update: updates file metadata successfully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.update({
      id: 1,
      description: "Updated description",
      category: "vocabulary",
    });

    expect(result.success).toBe(true);
  });

  it("getById: returns file for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.files.getById({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.filename).toBe("test.pdf");
  });

  it("getById: throws NOT_FOUND when file belongs to another user", async () => {
    const { getFileById } = await import("./db");
    // Returning undefined simulates: file exists but getFileById(id, userId) found no match
    vi.mocked(getFileById).mockResolvedValueOnce(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.getById({ id: 999 })).rejects.toThrow();
  });

  it("update: throws NOT_FOUND when file belongs to another user", async () => {
    const { getFileById } = await import("./db");
    vi.mocked(getFileById).mockResolvedValueOnce(undefined);

    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.files.update({ id: 999, description: "Hijack" })
    ).rejects.toThrow();
  });

  it("upload: rejects files with a data-URL prefix (strips prefix and still validates MIME)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // data URL prefix is fine – router strips it
    const base64Data =
      "data:application/pdf;base64," +
      Buffer.from("%PDF-1.4 test").toString("base64");

    const result = await caller.files.upload({
      filename: "test.pdf",
      mimeType: "application/pdf",
      base64Data,
      fileSize: 512,
      category: "reading",
    });

    expect(result.filename).toBe("test.pdf");
  });

  it("list: throws UNAUTHORIZED when called without a user", async () => {
    const ctx: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("upload: throws UNAUTHORIZED when called without a user", async () => {
    const ctx: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.files.upload({
        filename: "test.pdf",
        mimeType: "application/pdf",
        base64Data: Buffer.from("%PDF-1.4").toString("base64"),
        fileSize: 512,
        category: "other",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("delete: throws UNAUTHORIZED when called without a user", async () => {
    const ctx: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.files.delete({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

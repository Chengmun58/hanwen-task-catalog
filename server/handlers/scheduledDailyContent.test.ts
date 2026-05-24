import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { scheduledDailyContentHandler } from "./scheduledDailyContent";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

vi.mock("../db", () => ({
  hasContentForDate: vi.fn(),
  createDailyContentJob: vi.fn(),
  updateDailyContentJob: vi.fn(),
  insertDailyArticles: vi.fn(),
  insertDailyVocabulary: vi.fn(),
  getJobByTaskUid: vi.fn(),
}));

vi.mock("../services/contentGenerator", () => ({
  getBeijingDateString: vi.fn().mockReturnValue("2024-06-15"),
  generateDailyContent: vi.fn(),
  prepareArticlesForInsert: vi.fn().mockReturnValue([]),
  prepareVocabularyForInsert: vi.fn().mockReturnValue([]),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(): Request {
  return { url: "/api/scheduled/daily-content" } as unknown as Request;
}

function makeRes() {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnThis();
  // status().json() chain
  (status as any).mockImplementation(() => ({ json }));
  return { json, status } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

const mockArticles = [{ id: 1, title: "Test article" }];
const mockVocabulary = [{ id: 1, word: "갓생" }];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("scheduledDailyContentHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 403 when request is not a cron call (isCron=false)", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: false,
      taskUid: undefined,
    } as any);

    const req = makeReq();
    const res = makeRes();

    await scheduledDailyContentHandler(req, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 403 when taskUid is missing", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: undefined,
    } as any);

    const req = makeReq();
    const res = makeRes();

    await scheduledDailyContentHandler(req, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("skips generation and returns skipped=true when content already exists", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "task-abc",
    } as any);

    const db = await import("../db");
    vi.mocked(db.hasContentForDate).mockResolvedValue(true);

    const req = makeReq();
    const res = makeRes();

    await scheduledDailyContentHandler(req, res as any);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, skipped: true })
    );
    // No job should be created when skipping
    expect(db.createDailyContentJob).not.toHaveBeenCalled();
  });

  it("happy path: generates content and returns success response", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "task-abc",
    } as any);

    const db = await import("../db");
    vi.mocked(db.hasContentForDate).mockResolvedValue(false);
    vi.mocked(db.createDailyContentJob).mockResolvedValue({ id: 10 });
    vi.mocked(db.updateDailyContentJob).mockResolvedValue(undefined);
    vi.mocked(db.insertDailyArticles).mockResolvedValue(undefined);
    vi.mocked(db.insertDailyVocabulary).mockResolvedValue(undefined);

    const gen = await import("../services/contentGenerator");
    vi.mocked(gen.generateDailyContent).mockResolvedValue({
      articles: mockArticles as any,
      vocabulary: mockVocabulary as any,
    });

    const req = makeReq();
    const res = makeRes();

    await scheduledDailyContentHandler(req, res as any);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        date: "2024-06-15",
        articlesGenerated: mockArticles.length,
        vocabularyGenerated: mockVocabulary.length,
      })
    );
  });

  it("marks job as completed with correct counts on success", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "task-xyz",
    } as any);

    const db = await import("../db");
    vi.mocked(db.hasContentForDate).mockResolvedValue(false);
    vi.mocked(db.createDailyContentJob).mockResolvedValue({ id: 55 });
    vi.mocked(db.updateDailyContentJob).mockResolvedValue(undefined);
    vi.mocked(db.insertDailyArticles).mockResolvedValue(undefined);
    vi.mocked(db.insertDailyVocabulary).mockResolvedValue(undefined);

    const gen = await import("../services/contentGenerator");
    vi.mocked(gen.generateDailyContent).mockResolvedValue({
      articles: mockArticles as any,
      vocabulary: mockVocabulary as any,
    });

    const req = makeReq();
    const res = makeRes();
    await scheduledDailyContentHandler(req, res as any);

    expect(db.updateDailyContentJob).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        status: "completed",
        articlesGenerated: mockArticles.length,
        vocabularyGenerated: mockVocabulary.length,
      })
    );
  });

  it("returns 500 and marks job failed when generateDailyContent throws", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "task-fail",
    } as any);

    const db = await import("../db");
    vi.mocked(db.hasContentForDate).mockResolvedValue(false);
    vi.mocked(db.createDailyContentJob).mockResolvedValue({ id: 77 });
    vi.mocked(db.updateDailyContentJob).mockResolvedValue(undefined);

    const gen = await import("../services/contentGenerator");
    vi.mocked(gen.generateDailyContent).mockRejectedValue(
      new Error("LLM timeout")
    );

    const req = makeReq();
    const res = makeRes();
    await scheduledDailyContentHandler(req, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(db.updateDailyContentJob).toHaveBeenCalledWith(
      77,
      expect.objectContaining({ status: "failed", errorMessage: "LLM timeout" })
    );
  });

  it("returns 500 even if authenticateRequest throws", async () => {
    const { sdk } = await import("../_core/sdk");
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(
      new Error("Auth service down")
    );

    const req = makeReq();
    const res = makeRes();
    await scheduledDailyContentHandler(req, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

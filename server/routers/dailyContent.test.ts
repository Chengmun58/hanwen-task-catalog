import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../db", () => ({
  getArticlesByDate: vi.fn(),
  getVocabularyByDate: vi.fn(),
  getLatestContentDate: vi.fn(),
  getAvailableContentDates: vi.fn(),
  insertDailyArticles: vi.fn(),
  insertDailyVocabulary: vi.fn(),
  createDailyContentJob: vi.fn(),
  updateDailyContentJob: vi.fn(),
  hasContentForDate: vi.fn(),
  // Other db exports used by unrelated routers
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  insertUploadedFile: vi.fn(),
  getFilesByUserId: vi.fn(),
  getFileById: vi.fn(),
  deleteFileById: vi.fn(),
  updateFileMetadata: vi.fn(),
}));

vi.mock("../services/contentGenerator", () => ({
  getBeijingDateString: vi.fn().mockReturnValue("2024-06-15"),
  generateDailyContent: vi.fn(),
  prepareArticlesForInsert: vi.fn(),
  prepareVocabularyForInsert: vi.fn(),
}));

vi.mock("../storage", () => ({
  storagePut: vi.fn(),
  storageGet: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockArticles = [
  {
    id: 1,
    contentDate: "2024-06-15",
    title: "오늘의 뉴스",
    titleZh: "今日新闻",
    content: "한국 뉴스입니다.",
    contentZh: "这是韩国新闻。",
    articleType: "news",
    difficulty: "intermediate",
    keyWords: '["단어1"]',
    learningTips: "어휘에 집중하세요.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockVocabulary = [
  {
    id: 1,
    contentDate: "2024-06-15",
    word: "갓생",
    pronunciation: "gat-saeng",
    meaning: "充实的生活",
    wordType: "internet",
    exampleSentence: "오늘도 갓생 살자.",
    exampleTranslation: "今天也要充实地活。",
    culturalNote: "网络流行语",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUser = {
  id: 1,
  openId: "user-1",
  name: "Test User",
  email: "test@example.com",
  loginMethod: "oauth",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function makeCtx(user: typeof mockUser | null = mockUser): TrpcContext {
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user,
  };
}

// ---------------------------------------------------------------------------
// getArticles
// ---------------------------------------------------------------------------

describe("dailyContent.getArticles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns articles for the requested date", async () => {
    const { getArticlesByDate } = await import("../db");
    vi.mocked(getArticlesByDate).mockResolvedValue(mockArticles as any);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getArticles({ date: "2024-06-15" });

    expect(result.date).toBe("2024-06-15");
    expect(result.articles).toEqual(mockArticles);
    expect(getArticlesByDate).toHaveBeenCalledWith("2024-06-15");
  });

  it("defaults to the Beijing date when no date is provided", async () => {
    const { getArticlesByDate } = await import("../db");
    vi.mocked(getArticlesByDate).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getArticles({});

    expect(result.date).toBe("2024-06-15"); // value from mocked getBeijingDateString
    expect(getArticlesByDate).toHaveBeenCalledWith("2024-06-15");
  });

  it("returns empty articles array when none exist for the date", async () => {
    const { getArticlesByDate } = await import("../db");
    vi.mocked(getArticlesByDate).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getArticles({ date: "2099-01-01" });

    expect(result.articles).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getVocabulary
// ---------------------------------------------------------------------------

describe("dailyContent.getVocabulary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns vocabulary for the requested date", async () => {
    const { getVocabularyByDate } = await import("../db");
    vi.mocked(getVocabularyByDate).mockResolvedValue(mockVocabulary as any);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getVocabulary({ date: "2024-06-15" });

    expect(result.date).toBe("2024-06-15");
    expect(result.vocabulary).toEqual(mockVocabulary);
  });

  it("defaults to the Beijing date when no date is provided", async () => {
    const { getVocabularyByDate } = await import("../db");
    vi.mocked(getVocabularyByDate).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getVocabulary({});

    expect(result.date).toBe("2024-06-15");
  });
});

// ---------------------------------------------------------------------------
// getLatestDate
// ---------------------------------------------------------------------------

describe("dailyContent.getLatestDate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the latest content date", async () => {
    const { getLatestContentDate } = await import("../db");
    vi.mocked(getLatestContentDate).mockResolvedValue("2024-06-15");

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getLatestDate();

    expect(result.date).toBe("2024-06-15");
  });

  it("returns null when no content exists yet", async () => {
    const { getLatestContentDate } = await import("../db");
    vi.mocked(getLatestContentDate).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getLatestDate();

    expect(result.date).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAvailableDates
// ---------------------------------------------------------------------------

describe("dailyContent.getAvailableDates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of available dates", async () => {
    const { getAvailableContentDates } = await import("../db");
    vi.mocked(getAvailableContentDates).mockResolvedValue(["2024-06-15", "2024-06-14"]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.dailyContent.getAvailableDates({ limit: 30 });

    expect(result.dates).toEqual(["2024-06-15", "2024-06-14"]);
    expect(getAvailableContentDates).toHaveBeenCalledWith(30);
  });

  it("respects a custom limit", async () => {
    const { getAvailableContentDates } = await import("../db");
    vi.mocked(getAvailableContentDates).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    await caller.dailyContent.getAvailableDates({ limit: 7 });

    expect(getAvailableContentDates).toHaveBeenCalledWith(7);
  });

  it("rejects limit > 90", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.dailyContent.getAvailableDates({ limit: 91 })
    ).rejects.toThrow();
  });

  it("rejects limit < 1", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.dailyContent.getAvailableDates({ limit: 0 })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generate mutation
// ---------------------------------------------------------------------------

describe("dailyContent.generate", () => {
  beforeEach(() => vi.clearAllMocks());

  async function setupHappyPath() {
    const db = await import("../db");
    const gen = await import("../services/contentGenerator");

    vi.mocked(db.hasContentForDate).mockResolvedValue(false);
    vi.mocked(db.createDailyContentJob).mockResolvedValue({ id: 42 });
    vi.mocked(gen.generateDailyContent).mockResolvedValue({
      articles: mockArticles as any,
      vocabulary: mockVocabulary as any,
    });
    vi.mocked(gen.prepareArticlesForInsert).mockReturnValue([] as any);
    vi.mocked(gen.prepareVocabularyForInsert).mockReturnValue([] as any);
    vi.mocked(db.insertDailyArticles).mockResolvedValue(undefined);
    vi.mocked(db.insertDailyVocabulary).mockResolvedValue(undefined);
    vi.mocked(db.updateDailyContentJob).mockResolvedValue(undefined);
  }

  it("throws UNAUTHORIZED when called without a user", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.dailyContent.generate({})
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws CONFLICT when content already exists and force is false", async () => {
    const { hasContentForDate } = await import("../db");
    vi.mocked(hasContentForDate).mockResolvedValue(true);

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.dailyContent.generate({ force: false })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("skips duplicate check when force=true", async () => {
    await setupHappyPath();
    const { hasContentForDate } = await import("../db");
    vi.mocked(hasContentForDate).mockResolvedValue(true); // content exists

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.dailyContent.generate({ force: true });

    expect(result.success).toBe(true);
  });

  it("happy path: creates job, generates content, returns success", async () => {
    await setupHappyPath();

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.dailyContent.generate({});

    expect(result.success).toBe(true);
    expect(result.date).toBe("2024-06-15");
    expect(result.articlesGenerated).toBe(mockArticles.length);
    expect(result.vocabularyGenerated).toBe(mockVocabulary.length);
  });

  it("creates a job record before calling generateDailyContent", async () => {
    await setupHappyPath();
    const { createDailyContentJob, insertDailyArticles } = await import("../db");

    // Track call order
    const callOrder: string[] = [];
    vi.mocked(createDailyContentJob).mockImplementation(async () => {
      callOrder.push("createJob");
      return { id: 42 };
    });
    vi.mocked(insertDailyArticles).mockImplementation(async () => {
      callOrder.push("insertArticles");
    });

    const caller = appRouter.createCaller(makeCtx());
    await caller.dailyContent.generate({});

    expect(callOrder.indexOf("createJob")).toBeLessThan(
      callOrder.indexOf("insertArticles")
    );
  });

  it("marks job as completed with correct counts on success", async () => {
    await setupHappyPath();
    const { updateDailyContentJob } = await import("../db");

    const caller = appRouter.createCaller(makeCtx());
    await caller.dailyContent.generate({});

    expect(updateDailyContentJob).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: "completed",
        articlesGenerated: mockArticles.length,
        vocabularyGenerated: mockVocabulary.length,
      })
    );
  });

  it("marks job as failed and rethrows INTERNAL_SERVER_ERROR when LLM throws", async () => {
    const db = await import("../db");
    const gen = await import("../services/contentGenerator");

    vi.mocked(db.hasContentForDate).mockResolvedValue(false);
    vi.mocked(db.createDailyContentJob).mockResolvedValue({ id: 99 });
    vi.mocked(gen.generateDailyContent).mockRejectedValue(
      new Error("LLM timeout")
    );
    vi.mocked(db.updateDailyContentJob).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.dailyContent.generate({})).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });

    expect(db.updateDailyContentJob).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ status: "failed", errorMessage: "LLM timeout" })
    );
  });

  it("uses the provided date instead of the Beijing default", async () => {
    await setupHappyPath();
    const { hasContentForDate, createDailyContentJob } = await import("../db");

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.dailyContent.generate({ date: "2024-07-01" });

    expect(result.date).toBe("2024-07-01");
    expect(hasContentForDate).toHaveBeenCalledWith("2024-07-01");
    expect(createDailyContentJob).toHaveBeenCalledWith(
      expect.objectContaining({ contentDate: "2024-07-01" })
    );
  });
});

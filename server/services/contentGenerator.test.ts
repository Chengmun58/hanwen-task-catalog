import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getBeijingDateString,
  prepareArticlesForInsert,
  prepareVocabularyForInsert,
} from "./contentGenerator";

// ---------------------------------------------------------------------------
// getBeijingDateString
// ---------------------------------------------------------------------------

describe("getBeijingDateString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a string in YYYY-MM-DD format", () => {
    vi.setSystemTime(new Date("2024-06-15T00:00:00.000Z"));
    const result = getBeijingDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("converts UTC midnight to Beijing date (UTC+8 = next day)", () => {
    // UTC 2024-06-14T20:00:00Z = Beijing 2024-06-15T04:00:00+08:00
    vi.setSystemTime(new Date("2024-06-14T20:00:00.000Z"));
    const result = getBeijingDateString();
    expect(result).toBe("2024-06-15");
  });

  it("stays on same calendar day when UTC time maps to early Beijing morning", () => {
    // UTC 2024-06-15T01:00:00Z = Beijing 2024-06-15T09:00:00+08:00
    vi.setSystemTime(new Date("2024-06-15T01:00:00.000Z"));
    const result = getBeijingDateString();
    expect(result).toBe("2024-06-15");
  });

  it("handles the edge case at UTC 15:59:59 (Beijing 23:59:59 same day)", () => {
    // UTC 2024-06-15T15:59:59Z = Beijing 2024-06-15T23:59:59+08:00
    vi.setSystemTime(new Date("2024-06-15T15:59:59.000Z"));
    const result = getBeijingDateString();
    expect(result).toBe("2024-06-15");
  });

  it("handles the edge case at UTC 16:00:00 (Beijing midnight = next day)", () => {
    // UTC 2024-06-15T16:00:00Z = Beijing 2024-06-16T00:00:00+08:00
    vi.setSystemTime(new Date("2024-06-15T16:00:00.000Z"));
    const result = getBeijingDateString();
    expect(result).toBe("2024-06-16");
  });

  it("offsetDays=1 returns tomorrow in Beijing time", () => {
    vi.setSystemTime(new Date("2024-06-15T01:00:00.000Z")); // Beijing: 2024-06-15
    const result = getBeijingDateString(1);
    expect(result).toBe("2024-06-16");
  });

  it("offsetDays=-1 returns yesterday in Beijing time", () => {
    vi.setSystemTime(new Date("2024-06-15T01:00:00.000Z")); // Beijing: 2024-06-15
    const result = getBeijingDateString(-1);
    expect(result).toBe("2024-06-14");
  });

  it("offsetDays=0 is the same as calling without an argument", () => {
    vi.setSystemTime(new Date("2024-06-15T01:00:00.000Z"));
    expect(getBeijingDateString(0)).toBe(getBeijingDateString());
  });
});

// ---------------------------------------------------------------------------
// prepareArticlesForInsert
// ---------------------------------------------------------------------------

const sampleArticle = {
  title: "오늘의 뉴스",
  titleZh: "今日新闻",
  content: "한국에서 새로운 소식이 들려왔습니다.",
  contentZh: "韩国传来了新消息。",
  articleType: "news" as const,
  difficulty: "intermediate" as const,
  keyWords: ["뉴스", "한국", "소식", "새로운", "들리다"],
  learningTips: "注意动词时态的变化。",
};

describe("prepareArticlesForInsert", () => {
  it("maps all required fields through to the DB row", () => {
    const rows = prepareArticlesForInsert([sampleArticle], "2024-06-15");
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.contentDate).toBe("2024-06-15");
    expect(row.title).toBe(sampleArticle.title);
    expect(row.titleZh).toBe(sampleArticle.titleZh);
    expect(row.content).toBe(sampleArticle.content);
    expect(row.contentZh).toBe(sampleArticle.contentZh);
    expect(row.articleType).toBe(sampleArticle.articleType);
    expect(row.difficulty).toBe(sampleArticle.difficulty);
    expect(row.learningTips).toBe(sampleArticle.learningTips);
  });

  it("JSON-serialises the keyWords array", () => {
    const rows = prepareArticlesForInsert([sampleArticle], "2024-06-15");
    const parsed = JSON.parse(rows[0].keyWords as string);
    expect(parsed).toEqual(sampleArticle.keyWords);
  });

  it("produces one row per article", () => {
    const rows = prepareArticlesForInsert(
      [sampleArticle, { ...sampleArticle, articleType: "blog" as const }],
      "2024-06-15"
    );
    expect(rows).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(prepareArticlesForInsert([], "2024-06-15")).toEqual([]);
  });

  it("injects the provided contentDate into every row", () => {
    const rows = prepareArticlesForInsert(
      [sampleArticle, { ...sampleArticle, articleType: "blog" as const }],
      "2024-07-20"
    );
    expect(rows.every(r => r.contentDate === "2024-07-20")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// prepareVocabularyForInsert
// ---------------------------------------------------------------------------

const sampleVocab = {
  word: "갓생",
  pronunciation: "gat-saeng",
  meaning: "过充实/有意义的生活（网络流行语）",
  wordType: "internet" as const,
  exampleSentence: "나는 오늘도 갓생 살아야지.",
  exampleTranslation: "我今天也要过充实的一天。",
  culturalNote: "由[갓(God)+생(生)]合成，源于YouTube等社交媒体，指高效自律的生活方式。",
};

describe("prepareVocabularyForInsert", () => {
  it("maps all required fields through to the DB row", () => {
    const rows = prepareVocabularyForInsert([sampleVocab], "2024-06-15");
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.contentDate).toBe("2024-06-15");
    expect(row.word).toBe(sampleVocab.word);
    expect(row.pronunciation).toBe(sampleVocab.pronunciation);
    expect(row.meaning).toBe(sampleVocab.meaning);
    expect(row.wordType).toBe(sampleVocab.wordType);
    expect(row.exampleSentence).toBe(sampleVocab.exampleSentence);
    expect(row.exampleTranslation).toBe(sampleVocab.exampleTranslation);
    expect(row.culturalNote).toBe(sampleVocab.culturalNote);
  });

  it("maps missing pronunciation to null (not undefined)", () => {
    const vocab = { ...sampleVocab, pronunciation: "" };
    const rows = prepareVocabularyForInsert([vocab], "2024-06-15");
    // empty string pronunciation passes through as-is; test null mapping specifically
    const vocabNoPronounciation = { ...sampleVocab };
    // @ts-expect-error intentionally passing undefined to test null coercion
    vocabNoPronounciation.pronunciation = undefined;
    const rows2 = prepareVocabularyForInsert([vocabNoPronounciation], "2024-06-15");
    expect(rows2[0].pronunciation).toBeNull();
  });

  it("maps missing culturalNote to null (not undefined)", () => {
    const vocab = { ...sampleVocab };
    // @ts-expect-error intentionally passing undefined to test null coercion
    vocab.culturalNote = undefined;
    const rows = prepareVocabularyForInsert([vocab], "2024-06-15");
    expect(rows[0].culturalNote).toBeNull();
  });

  it("preserves non-empty culturalNote", () => {
    const rows = prepareVocabularyForInsert([sampleVocab], "2024-06-15");
    expect(rows[0].culturalNote).toBe(sampleVocab.culturalNote);
  });

  it("produces one row per vocabulary item", () => {
    const rows = prepareVocabularyForInsert(
      [sampleVocab, { ...sampleVocab, word: "꾸안꾸" }],
      "2024-06-15"
    );
    expect(rows).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(prepareVocabularyForInsert([], "2024-06-15")).toEqual([]);
  });

  it("injects the provided contentDate into every row", () => {
    const rows = prepareVocabularyForInsert(
      [sampleVocab, { ...sampleVocab, word: "꾸안꾸" }],
      "2024-08-01"
    );
    expect(rows.every(r => r.contentDate === "2024-08-01")).toBe(true);
  });
});

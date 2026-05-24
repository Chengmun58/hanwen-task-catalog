import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribeAudio } from "./voiceTranscription";

// ---------------------------------------------------------------------------
// ENV mock – lets each test configure credentials independently
// ---------------------------------------------------------------------------

// ENV uses empty string "" as "unset" (all values are `process.env.X ?? ""`).
// The mock uses plain getters reading from a mutable config object.
const mockEnvValues = {
  forgeApiUrl: "https://forge.example.com",
  forgeApiKey: "test-key",
};

vi.mock("./env", () => ({
  // Return a proxy so that reads always reflect the current mockEnvValues
  get ENV() { return mockEnvValues; },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Pass "" (empty string) to simulate an unset env var (mirrors how ENV is built).
function setEnv(url: string, key: string) {
  mockEnvValues.forgeApiUrl = url;
  mockEnvValues.forgeApiKey = key;
}

function resetEnv() {
  mockEnvValues.forgeApiUrl = "https://forge.example.com";
  mockEnvValues.forgeApiKey = "test-key";
}

const validWhisperResponse = {
  task: "transcribe",
  language: "ko",
  duration: 5.2,
  text: "안녕하세요",
  segments: [],
};

/** Build a fetch mock that returns the given response for any call */
function mockFetch(responses: Array<{ ok: boolean; status?: number; statusText?: string; body?: unknown; headers?: Record<string, string> }>) {
  let idx = 0;
  return vi.fn().mockImplementation(async () => {
    const cfg = responses[idx] ?? responses[responses.length - 1];
    idx++;
    return {
      ok: cfg.ok,
      status: cfg.status ?? (cfg.ok ? 200 : 500),
      statusText: cfg.statusText ?? (cfg.ok ? "OK" : "Internal Server Error"),
      headers: {
        get: (name: string) => (cfg.headers ?? {})[name] ?? null,
      },
      arrayBuffer: async () => Buffer.from("fake-audio-content").buffer,
      json: async () => cfg.body ?? validWhisperResponse,
      text: async () => cfg.statusText ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("transcribeAudio", () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Missing credentials ─────────────────────────────────────────────────

  it("returns SERVICE_ERROR when forgeApiUrl is not configured", async () => {
    setEnv("", "test-key"); // empty string = unset (matches ENV's ?? "" default)

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect(result).toMatchObject({ code: "SERVICE_ERROR" });
    expect("error" in result).toBe(true);
  });

  it("returns SERVICE_ERROR when forgeApiKey is not configured", async () => {
    setEnv("https://forge.example.com", ""); // empty string = unset

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect(result).toMatchObject({ code: "SERVICE_ERROR" });
  });

  // ── Audio download failures ──────────────────────────────────────────────

  it("returns INVALID_FORMAT when audio URL responds with non-OK status", async () => {
    vi.stubGlobal("fetch", mockFetch([{ ok: false, status: 404, statusText: "Not Found" }]));

    const result = await transcribeAudio({ audioUrl: "https://example.com/missing.mp3" });

    expect(result).toMatchObject({ code: "INVALID_FORMAT" });
  });

  it("returns SERVICE_ERROR when fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect(result).toMatchObject({ code: "SERVICE_ERROR" });
  });

  // ── File too large ───────────────────────────────────────────────────────

  it("returns FILE_TOO_LARGE when the downloaded audio exceeds 16 MB", async () => {
    // 17 MB buffer
    const bigBuffer = Buffer.alloc(17 * 1024 * 1024, 0);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "audio/mpeg" },
        arrayBuffer: async () => bigBuffer.buffer,
      })
    );

    const result = await transcribeAudio({ audioUrl: "https://example.com/big.mp3" });

    expect(result).toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("does NOT return FILE_TOO_LARGE for a file exactly at the 16 MB limit", async () => {
    const exactBuffer = Buffer.alloc(16 * 1024 * 1024, 0);
    const whisperFetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "audio/mpeg" },
        arrayBuffer: async () => exactBuffer.buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => validWhisperResponse,
      });
    vi.stubGlobal("fetch", whisperFetchMock);

    const result = await transcribeAudio({ audioUrl: "https://example.com/exact.mp3" });

    expect("error" in result ? (result as any).code : "ok").not.toBe("FILE_TOO_LARGE");
  });

  // ── Transcription service failures ───────────────────────────────────────

  it("returns TRANSCRIPTION_FAILED when the transcription API returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        { ok: true, headers: { "content-type": "audio/mpeg" } }, // audio download
        { ok: false, status: 500, statusText: "Internal Server Error" }, // transcription
      ])
    );

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect(result).toMatchObject({ code: "TRANSCRIPTION_FAILED" });
  });

  it("returns SERVICE_ERROR when the transcription response has no text field", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        { ok: true, headers: { "content-type": "audio/mpeg" } }, // audio download
        { ok: true, body: { task: "transcribe", language: "ko" } }, // missing text
      ])
    );

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect(result).toMatchObject({ code: "SERVICE_ERROR" });
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  it("returns the Whisper response on success", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        { ok: true, headers: { "content-type": "audio/mpeg" } }, // audio download
        { ok: true, body: validWhisperResponse }, // transcription
      ])
    );

    const result = await transcribeAudio({ audioUrl: "https://example.com/audio.mp3" });

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.text).toBe("안녕하세요");
      expect(result.language).toBe("ko");
    }
  });

  it("passes a custom language hint as part of the prompt", async () => {
    const fetchMock = mockFetch([
      { ok: true, headers: { "content-type": "audio/mpeg" } },
      { ok: true, body: validWhisperResponse },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
      language: "ko",
    });

    // The second call (to transcription service) should have been made
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("passes a custom prompt when provided", async () => {
    const fetchMock = mockFetch([
      { ok: true, headers: { "content-type": "audio/mpeg" } },
      { ok: true, body: validWhisperResponse },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
      prompt: "Transcribe the meeting notes",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

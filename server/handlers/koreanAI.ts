import type { Request, Response } from "express";
import { invokeLLM } from "../_core/llm";

type KoreanAIBody = {
  feature?: string;
  input?: string;
  tone?: string;
  platform?: string;
  situation?: string;
};

const FEATURE_LABELS: Record<string, string> = {
  "reply-generator": "natural reply generation",
  "tone-converter": "tone conversion",
  "mz-expression": "MZ expression coaching",
  "shadowing-trainer": "shadowing practice",
  "grammar-corrector": "grammar and naturalness correction",
  "situational-reply": "situational reply coaching",
  "platform-mimic": "platform-specific Korean writing",
  roleplay: "roleplay conversation",
};

function buildSystemPrompt(body: KoreanAIBody) {
  const feature = FEATURE_LABELS[body.feature || ""] || "Korean naturalness coaching";
  const platform = body.platform || "Daily conversation";
  const tone = body.tone || "natural Korean, not overdone";
  const situation = body.situation || "daily Korean conversation";

  return `You are a Korean native-sense language coach for a Chinese-speaking learner.

Task mode: ${feature}
Platform/context: ${platform}
Requested tone: ${tone}
Situation: ${situation}

Core output rules:
1. Produce Korean that a real Korean person would plausibly say in this context.
2. Do not overuse MZ slang. Use slang only when it fits the relationship, platform, and emotional intensity.
3. Avoid cringe, forced cuteness, excessive ㅋㅋㅋ/ㅠㅠ, and exaggerated endings like 아아아 unless specifically requested.
4. Separate safe natural version and stronger MZ version when the user asks for slang or casual tone.
5. If the user’s Korean has mistakes, correct them directly and explain the key issue in Chinese.
6. For KakaoTalk, prefer short, natural lines. For Instagram, keep it polished and caption-like. For YouTube, allow wit but avoid forced meme stacking.
7. For work or polite contexts, avoid 반말 unless the user asks.
8. Always include shadowing lines when useful, with short Korean chunks.

Response format:
- Start with "추천 표현" and give 1-3 Korean options.
- Then "뉘앙스" in Chinese, concise but specific.
- Then "주의할 점" if there is a register/slang risk.
- Then "섀도잉" with 2-4 Korean lines suitable for speaking practice.
`;
}

export async function koreanAIHandler(req: Request, res: Response) {
  try {
    const body = (req.body || {}) as KoreanAIBody;
    const input = typeof body.input === "string" ? body.input.trim() : "";

    if (!input) {
      return res.status(400).json({ ok: false, error: "Missing input." });
    }

    if (input.length > 1200) {
      return res.status(400).json({ ok: false, error: "Input is too long." });
    }

    const result = await invokeLLM({
      messages: [
        { role: "system", content: buildSystemPrompt(body) },
        { role: "user", content: input },
      ],
      max_tokens: 1800,
    });

    const content = result.choices?.[0]?.message?.content;
    const output = typeof content === "string" ? content : JSON.stringify(content || "");

    return res.json({ ok: true, mode: body.feature || "korean-ai", output });
  } catch (error) {
    console.error("koreanAIHandler error", error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unknown error." });
  }
}

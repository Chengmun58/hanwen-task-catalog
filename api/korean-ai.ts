type Feature =
  | "reply-generator"
  | "tone-converter"
  | "mz-expression"
  | "shadowing-trainer"
  | "grammar-corrector"
  | "situational-reply"
  | "platform-mimic";

type RequestBody = {
  feature?: Feature;
  input?: string;
  tone?: string;
  platform?: string;
  situation?: string;
};

const MAX_INPUT_CHARS = 1200;
const MAX_CONTEXT_CHARS = 180;
const ALLOWED_FEATURES: Feature[] = [
  "reply-generator",
  "tone-converter",
  "mz-expression",
  "shadowing-trainer",
  "grammar-corrector",
  "situational-reply",
  "platform-mimic",
];

const featureLabels: Record<Feature, string> = {
  "reply-generator": "Korean Reply Generator",
  "tone-converter": "Native Tone Converter",
  "mz-expression": "MZ Expression Engine",
  "shadowing-trainer": "Shadowing Trainer",
  "grammar-corrector": "Grammar Corrector",
  "situational-reply": "Situational Reply Generator",
  "platform-mimic": "YouTube / Instagram Style Mimic",
};

function normalizeFeature(feature?: string): Feature {
  return ALLOWED_FEATURES.includes(feature as Feature) ? (feature as Feature) : "reply-generator";
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function buildPrompt(body: RequestBody) {
  const feature = normalizeFeature(body.feature);
  const input = cleanText(body.input, MAX_INPUT_CHARS);
  const tone = cleanText(body.tone || "natural Korean MZ but not cringe", MAX_CONTEXT_CHARS);
  const platform = cleanText(body.platform || "KakaoTalk / Instagram / YouTube / Theqoo depending on request", MAX_CONTEXT_CHARS);
  const situation = cleanText(body.situation || "daily conversation", MAX_CONTEXT_CHARS);

  return `You are a native Korean language coach specializing in Korean Gen Z/MZ internet language, KakaoTalk replies, Instagram captions/comments, YouTube comments, Theqoo/forum tone, grammar correction, and shadowing practice.

Feature: ${featureLabels[feature]}
Target tone: ${tone}
Target platform: ${platform}
Situation: ${situation}
User input:
${input}

Return the answer in this exact structure:

1. BEST NATIVE KOREAN
- Give 3 strong Korean versions.
- Make them sound human, natural, platform-specific, and not textbook-like.

2. PLATFORM STYLE
- KakaoTalk version
- Instagram version
- YouTube / 댓글 version
- Theqoo / community version

3. WHY IT SOUNDS NATIVE
- Explain in Chinese.
- Explain particles, endings, slang, emotion level, and what sounds unnatural.

4. GRAMMAR / NATURALNESS FIX
- If the user provided Korean, correct it.
- If the user provided Chinese/English, explain how to avoid direct translation Korean.

5. SHADOWING
- Give 3 short Korean lines for shadowing.
- Add romanization only when helpful.
- Add Chinese meaning.

6. MZ EXPRESSIONS
- List useful MZ words or phrases from the output.
- Explain each in Chinese.

Rules:
- Do not overuse emojis.
- Do not make every sentence childish.
- Keep Korean natural and current.
- Do not invent celebrity references unless asked.
- If the input is ambiguous, still produce a best-effort answer.`;
}

function fallbackResponse(body: RequestBody) {
  const input = cleanText(body.input, MAX_INPUT_CHARS) || "오늘 너무 피곤해";
  return {
    ok: true,
    mode: "fallback",
    output: `1. BEST NATIVE KOREAN\n- 나 오늘 진짜 너무 피곤해서 말할 힘도 없음...\n- 오늘 하루 왜 이렇게 길었냐ㅠㅠ 그냥 바로 눕고 싶다.\n- 지금 완전 방전됨... 답장 늦어도 이해해줘.\n\n2. PLATFORM STYLE\n- KakaoTalk: 나 오늘 진짜 기 다 빨림ㅠㅠ 좀 누워있을게...\n- Instagram: 오늘 하루도 겨우 버텼다. 진짜 방전 완료.\n- YouTube / 댓글: 와 오늘 피로도 실화냐ㅋㅋㅋ 침대가 나를 부른다.\n- Theqoo / community: 오늘 진짜 아무것도 안 했는데 왜 이렇게 피곤함...?\n\n3. WHY IT SOUNDS NATIVE\n中文说明：比起直译“저는 오늘 매우 피곤합니다”，韩国人更常用“기 빨리다 / 방전되다 / 눕고 싶다”来表达累到没电。句尾用“음/함/게”会更像聊天和论坛语气。\n\n4. GRAMMAR / NATURALNESS FIX\n输入参考：${input}\n避免直接翻译成太正式的韩语。日常语境下少用“저는”“매우”“~습니다”。\n\n5. SHADOWING\n- 나 오늘 진짜 기 다 빨림. = 我今天真的精气神被吸干了。\n- 그냥 바로 눕고 싶다. = 只想直接躺下。\n- 답장 늦어도 이해해줘. = 如果我回复慢，请理解我。\n\n6. MZ EXPRESSIONS\n- 기 빨림：精气被吸干，很累。\n- 방전됨：没电了，精神耗尽。\n- 실화냐：真的假的，用来表达夸张震惊。`,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-AI-Input-Limit", String(MAX_INPUT_CHARS));

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const rawBody = (req.body ?? {}) as RequestBody;
  const input = cleanText(rawBody.input, MAX_INPUT_CHARS + 1);

  if (!input) {
    return res.status(400).json({ ok: false, error: "Input is required" });
  }

  if (input.length > MAX_INPUT_CHARS) {
    return res.status(413).json({
      ok: false,
      error: `Input is too long. Maximum ${MAX_INPUT_CHARS} characters allowed.`,
    });
  }

  const body: RequestBody = {
    feature: normalizeFeature(rawBody.feature),
    input,
    tone: cleanText(rawBody.tone, MAX_CONTEXT_CHARS),
    platform: cleanText(rawBody.platform, MAX_CONTEXT_CHARS),
    situation: cleanText(rawBody.situation, MAX_CONTEXT_CHARS),
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json(fallbackResponse(body));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You are a precise Korean native-language coach. Generate current, natural Korean and explain in Chinese. Avoid fake slang and avoid overdoing emojis.",
          },
          { role: "user", content: buildPrompt(body) },
        ],
        temperature: 0.75,
        max_completion_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        ...fallbackResponse(body),
        mode: "fallback-openai-error",
        openaiError: errorText.slice(0, 500),
      });
    }

    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content ?? "No output returned.";
    return res.status(200).json({ ok: true, mode: "openai", output });
  } catch (error) {
    return res.status(200).json({
      ...fallbackResponse(body),
      mode: "fallback-exception",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

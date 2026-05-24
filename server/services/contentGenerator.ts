import { invokeLLM } from "../_core/llm";
import { InsertDailyArticle, InsertDailyVocabulary } from "../../drizzle/schema";

/**
 * Get today's date in Beijing time (UTC+8) as YYYY-MM-DD string.
 */
export function getBeijingDateString(offsetDays = 0): string {
  const now = new Date();
  const beijingOffset = 8 * 60; // UTC+8 in minutes
  const localOffset = now.getTimezoneOffset(); // minutes behind UTC
  const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000 + offsetDays * 86400 * 1000);
  return beijingTime.toISOString().split("T")[0];
}

type ArticleType = "news" | "novel" | "blog" | "professional" | "social";
type Difficulty = "beginner" | "intermediate" | "advanced";
type WordType = "slang" | "internet" | "youth" | "formal" | "expression";

interface GeneratedArticle {
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  articleType: ArticleType;
  difficulty: Difficulty;
  keyWords: string[];
  learningTips: string;
}

interface GeneratedVocabulary {
  word: string;
  pronunciation: string;
  meaning: string;
  wordType: WordType;
  exampleSentence: string;
  exampleTranslation: string;
  culturalNote: string;
}

interface GeneratedContent {
  articles: GeneratedArticle[];
  vocabulary: GeneratedVocabulary[];
}

const ARTICLE_TYPES: ArticleType[] = ["news", "novel", "blog", "professional", "social"];
const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  news: "新闻报道",
  novel: "小说/故事",
  blog: "博客/日记",
  professional: "专业/学术",
  social: "社交媒体/聊天",
};

/**
 * Generate daily Korean learning content using LLM.
 * Returns 5 articles of different types + 5 MZ vocabulary items.
 */
export async function generateDailyContent(contentDate: string): Promise<GeneratedContent> {
  const [articlesResult, vocabularyResult] = await Promise.all([
    generateArticles(contentDate),
    generateVocabulary(contentDate),
  ]);

  return {
    articles: articlesResult,
    vocabulary: vocabularyResult,
  };
}

async function generateArticles(contentDate: string): Promise<GeneratedArticle[]> {
  const prompt = `你是一位专业的韩语学习内容创作者，专门为中国韩语学习者创作真实、地道的韩语阅读材料。

今天是 ${contentDate}（北京时间）。请为韩语学习者生成 5 篇不同类型的韩语文章，帮助他们接触真实的韩语表达。

要求：
1. 每篇文章必须是不同类型：新闻报道(news)、小说/故事(novel)、博客/日记(blog)、专业/学术(professional)、社交媒体/聊天(social)
2. 每篇文章长度：200-400个韩文字符
3. 语言要地道自然，反映真实的韩国人表达方式
4. 难度要适中（intermediate），适合有一定基础的学习者
5. 内容要贴近现代韩国生活，可以涉及：K-pop、美食、职场、人际关系、社会现象等

请以 JSON 格式返回，结构如下：
{
  "articles": [
    {
      "title": "韩文标题",
      "titleZh": "中文标题翻译",
      "content": "韩文正文（200-400字）",
      "contentZh": "中文翻译",
      "articleType": "news|novel|blog|professional|social",
      "difficulty": "intermediate",
      "keyWords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
      "learningTips": "学习要点说明（中文，100字以内）"
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是专业的韩语学习内容创作者。请严格按照JSON格式返回内容，不要添加任何额外说明。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_articles",
        strict: true,
        schema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  titleZh: { type: "string" },
                  content: { type: "string" },
                  contentZh: { type: "string" },
                  articleType: { type: "string", enum: ["news", "novel", "blog", "professional", "social"] },
                  difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                  keyWords: { type: "array", items: { type: "string" } },
                  learningTips: { type: "string" },
                },
                required: ["title", "titleZh", "content", "contentZh", "articleType", "difficulty", "keyWords", "learningTips"],
                additionalProperties: false,
              },
            },
          },
          required: ["articles"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  return (parsed.articles ?? []) as GeneratedArticle[];
}

async function generateVocabulary(contentDate: string): Promise<GeneratedVocabulary[]> {
  const prompt = `你是韩国MZ世代（1980-2000年代出生）文化专家，专门研究韩国年轻人的语言和网络用语。

今天是 ${contentDate}（北京时间）。请为中国韩语学习者生成 5 个韩国MZ世代常用词汇/表达，帮助他们了解真实的韩国年轻人语言。

要求：
1. 选择真实流行于韩国年轻人中的词汇（可以是网络用语、缩写、新造词、流行表达等）
2. 词汇类型要多样：slang（俚语）、internet（网络用语）、youth（年轻人用语）、expression（表达方式）
3. 例句要自然，反映真实使用场景
4. 文化背景说明要有深度，帮助学习者真正理解这个词的文化含义

请以 JSON 格式返回：
{
  "vocabulary": [
    {
      "word": "韩文词汇",
      "pronunciation": "罗马字注音（可选）",
      "meaning": "中文释义（50字以内）",
      "wordType": "slang|internet|youth|formal|expression",
      "exampleSentence": "韩文例句",
      "exampleTranslation": "中文翻译",
      "culturalNote": "文化背景说明（中文，80字以内）"
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是韩国MZ世代文化专家。请严格按照JSON格式返回内容。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_vocabulary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            vocabulary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  pronunciation: { type: "string" },
                  meaning: { type: "string" },
                  wordType: { type: "string", enum: ["slang", "internet", "youth", "formal", "expression"] },
                  exampleSentence: { type: "string" },
                  exampleTranslation: { type: "string" },
                  culturalNote: { type: "string" },
                },
                required: ["word", "pronunciation", "meaning", "wordType", "exampleSentence", "exampleTranslation", "culturalNote"],
                additionalProperties: false,
              },
            },
          },
          required: ["vocabulary"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  return (parsed.vocabulary ?? []) as GeneratedVocabulary[];
}

/**
 * Convert generated content to DB insert format.
 */
export function prepareArticlesForInsert(articles: GeneratedArticle[], contentDate: string): InsertDailyArticle[] {
  return articles.map(a => ({
    contentDate,
    title: a.title,
    titleZh: a.titleZh,
    content: a.content,
    contentZh: a.contentZh,
    articleType: a.articleType,
    difficulty: a.difficulty,
    keyWords: JSON.stringify(a.keyWords),
    learningTips: a.learningTips,
  }));
}

export function prepareVocabularyForInsert(vocabulary: GeneratedVocabulary[], contentDate: string): InsertDailyVocabulary[] {
  return vocabulary.map(v => ({
    contentDate,
    word: v.word,
    pronunciation: v.pronunciation || null,
    meaning: v.meaning,
    wordType: v.wordType,
    exampleSentence: v.exampleSentence,
    exampleTranslation: v.exampleTranslation,
    culturalNote: v.culturalNote || null,
  }));
}

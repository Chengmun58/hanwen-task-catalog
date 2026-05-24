import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Newspaper,
  BookOpen,
  Headphones,
  MessageSquare,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Loader2,
  Volume2,
  Zap,
  Globe,
  PenLine,
  Hash,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────

type ArticleType = "news" | "novel" | "blog" | "professional" | "social";
type WordType = "slang" | "internet" | "youth" | "formal" | "expression";

const ARTICLE_TYPE_CONFIG: Record<ArticleType, { label: string; labelKo: string; icon: React.ElementType; color: string; bg: string }> = {
  news: { label: "新闻", labelKo: "뉴스", icon: Newspaper, color: "text-[#1E1E1E]", bg: "bg-[#FFB100]" },
  novel: { label: "小说", labelKo: "소설", icon: BookOpen, color: "text-white", bg: "bg-[#1E1E1E]" },
  blog: { label: "博客", labelKo: "블로그", icon: PenLine, color: "text-[#1E1E1E]", bg: "bg-[#2EC4B6]" },
  professional: { label: "专业", labelKo: "전문", icon: FileText, color: "text-white", bg: "bg-[#FF6B35]" },
  social: { label: "社交", labelKo: "SNS", icon: MessageSquare, color: "text-[#1E1E1E]", bg: "bg-[#E8F5E9]" },
};

const WORD_TYPE_CONFIG: Record<WordType, { label: string; color: string }> = {
  slang: { label: "俚语", color: "bg-[#FF6B35] text-white" },
  internet: { label: "网络用语", color: "bg-[#2EC4B6] text-[#1E1E1E]" },
  youth: { label: "年轻人用语", color: "bg-[#FFB100] text-[#1E1E1E]" },
  formal: { label: "正式用语", color: "bg-[#1E1E1E] text-white" },
  expression: { label: "表达方式", color: "bg-[#E8F5E9] text-[#1E1E1E] border border-[#1E1E1E]" },
};

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: any }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const typeConfig = ARTICLE_TYPE_CONFIG[article.articleType as ArticleType] ?? ARTICLE_TYPE_CONFIG.blog;
  const TypeIcon = typeConfig.icon;
  const keywords: string[] = (() => {
    try { return JSON.parse(article.keyWords ?? "[]"); } catch { return []; }
  })();

  return (
    <div className="bg-white border-4 border-[#1E1E1E] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">
      {/* Card Header */}
      <div className={`${typeConfig.bg} border-b-4 border-[#1E1E1E] p-4 flex items-start gap-3`}>
        <div className="w-10 h-10 bg-white border-2 border-[#1E1E1E] flex items-center justify-center shrink-0">
          <TypeIcon className={`w-5 h-5 ${typeConfig.color === "text-white" ? "text-[#1E1E1E]" : typeConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black px-2 py-0.5 border border-[#1E1E1E] bg-white text-[#1E1E1E]`}>
              {typeConfig.label} {typeConfig.labelKo}
            </span>
            <span className="text-[10px] font-bold text-[#555]">{article.difficulty}</span>
          </div>
          <h3 className={`font-black text-base leading-tight ${typeConfig.color}`}>{article.title}</h3>
          <p className="text-xs font-bold text-[#555] mt-0.5">{article.titleZh}</p>
        </div>
      </div>

      {/* Article Content */}
      <div className="p-4 space-y-3">
        {/* Korean text */}
        <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-3">
          <p className={`text-sm leading-relaxed font-medium text-[#1E1E1E] ${!expanded ? "line-clamp-4" : ""}`}>
            {article.content}
          </p>
          {article.content?.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-black text-[#FF6B35] hover:text-[#1E1E1E] transition-colors"
            >
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> 收起</> : <><ChevronDown className="w-3.5 h-3.5" /> 展开全文</>}
            </button>
          )}
        </div>

        {/* Translation toggle */}
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`w-full flex items-center justify-between px-3 py-2 border-2 border-[#1E1E1E] text-xs font-black transition-all ${
            showTranslation ? "bg-[#FFB100]" : "bg-white hover:bg-[#FAF9F5]"
          }`}
        >
          <span>查看中文翻译</span>
          {showTranslation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTranslation && (
          <div className="bg-[#FFFDE7] border-2 border-[#FFB100] p-3">
            <p className="text-sm leading-relaxed text-[#555] font-medium">{article.contentZh}</p>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t-2 border-dashed border-[#DDD]">
            {keywords.map((kw: string, i: number) => (
              <span key={i} className="text-[10px] font-black px-2 py-0.5 bg-[#1E1E1E] text-white border border-[#1E1E1E]">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Learning tips */}
        {article.learningTips && (
          <div className="bg-[#E8F5FE] border-2 border-[#1E1E1E] p-2.5 flex gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B35] shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-[#555]">{article.learningTips}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vocabulary Card ──────────────────────────────────────────────────────────

function VocabCard({ vocab }: { vocab: any }) {
  const [showExample, setShowExample] = useState(false);
  const typeConfig = WORD_TYPE_CONFIG[vocab.wordType as WordType] ?? WORD_TYPE_CONFIG.youth;

  return (
    <div className="bg-white border-4 border-[#1E1E1E] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all p-4 space-y-3">
      {/* Word header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl font-black text-[#1E1E1E] leading-none">{vocab.word}</div>
          {vocab.pronunciation && (
            <div className="text-xs font-bold text-[#888] mt-1 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> {vocab.pronunciation}
            </div>
          )}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 border border-[#1E1E1E] shrink-0 ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Meaning */}
      <div className="bg-[#FFB100] border-2 border-[#1E1E1E] p-2.5">
        <p className="text-sm font-black text-[#1E1E1E]">{vocab.meaning}</p>
      </div>

      {/* Example sentence toggle */}
      <button
        onClick={() => setShowExample(!showExample)}
        className={`w-full flex items-center justify-between px-3 py-2 border-2 border-[#1E1E1E] text-xs font-black transition-all ${
          showExample ? "bg-[#2EC4B6]" : "bg-white hover:bg-[#FAF9F5]"
        }`}
      >
        <span>例句 보기</span>
        {showExample ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showExample && (
        <div className="space-y-2">
          <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-2.5">
            <p className="text-sm font-bold text-[#1E1E1E]">{vocab.exampleSentence}</p>
          </div>
          <div className="bg-[#FFFDE7] border-2 border-[#FFB100] p-2.5">
            <p className="text-xs font-medium text-[#555]">{vocab.exampleTranslation}</p>
          </div>
        </div>
      )}

      {/* Cultural note */}
      {vocab.culturalNote && (
        <div className="flex gap-2 pt-1 border-t-2 border-dashed border-[#DDD]">
          <Globe className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-[#666]">{vocab.culturalNote}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyContentPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"articles" | "vocabulary">("articles");

  const { data: latestDate } = trpc.dailyContent.getLatestDate.useQuery();
  const { data: availableDates } = trpc.dailyContent.getAvailableDates.useQuery({ limit: 30 });

  const displayDate = selectedDate ?? latestDate?.date ?? undefined;

  const { data: articlesData, isLoading: articlesLoading } = trpc.dailyContent.getArticles.useQuery(
    { date: displayDate },
    { enabled: !!displayDate }
  );

  const { data: vocabData, isLoading: vocabLoading } = trpc.dailyContent.getVocabulary.useQuery(
    { date: displayDate },
    { enabled: !!displayDate }
  );

  const utils = trpc.useUtils();
  const generateMutation = trpc.dailyContent.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`生成完成！${data.articlesGenerated} 篇文章 + ${data.vocabularyGenerated} 个词汇 🎉`);
      utils.dailyContent.getArticles.invalidate();
      utils.dailyContent.getVocabulary.invalidate();
      utils.dailyContent.getLatestDate.invalidate();
      utils.dailyContent.getAvailableDates.invalidate();
    },
    onError: (err) => {
      toast.error(`生成失败：${err.message}`);
    },
  });

  const todayBeijing = useMemo(() => {
    const now = new Date();
    const beijingOffset = 8 * 60;
    const localOffset = now.getTimezoneOffset();
    const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000);
    return beijingTime.toISOString().split("T")[0];
  }, []);

  const hasContentToday = availableDates?.dates.includes(todayBeijing);
  const isEmpty = !articlesData?.articles?.length && !vocabData?.vocabulary?.length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1E1E] font-sans pb-12">
      {/* Header */}
      <header className="border-b-4 border-[#1E1E1E] bg-[#FF6B35] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFB100] rounded-full translate-x-12 -translate-y-12 border-4 border-[#1E1E1E] z-0" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-[#1E1E1E] rounded-full translate-y-12 border-4 border-[#FFB100] z-0" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1E1E1E] text-white px-3 py-1 text-xs font-black uppercase tracking-widest mb-3 border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Zap className="w-3.5 h-3.5 text-[#FFB100]" /> 매일 업데이트
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            每日韩语内容
          </h1>
          <p className="text-base font-bold text-[#1E1E1E] mt-1">
            AI 每日生成 5 篇地道韩语文章 + 5 个 MZ 世代核心词汇
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">

        {/* Date selector + Generate button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#888]" />
            <select
              value={displayDate ?? ""}
              onChange={e => setSelectedDate(e.target.value || undefined)}
              className="border-2 border-[#1E1E1E] bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            >
              {!displayDate && <option value="">选择日期...</option>}
              {availableDates?.dates.map(d => (
                <option key={d} value={d}>{d} {d === todayBeijing ? "（今天）" : ""}</option>
              ))}
            </select>
          </div>

          {user && (
            <Button
              onClick={() => generateMutation.mutate({ date: todayBeijing, force: false })}
              disabled={generateMutation.isPending || hasContentToday}
              className="bg-[#1E1E1E] hover:bg-[#333] text-white border-2 border-[#1E1E1E] rounded-none font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> 生成中...</>
              ) : hasContentToday ? (
                <><Sparkles className="w-4 h-4 mr-1.5 text-[#FFB100]" /> 今日已生成</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-1.5" /> 立即生成今日内容</>
              )}
            </Button>
          )}
        </div>

        {/* No content state */}
        {!displayDate || (!articlesLoading && !vocabLoading && isEmpty) ? (
          <div className="bg-white border-4 border-[#1E1E1E] p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-16 h-16 bg-[#FAF9F5] border-2 border-[#1E1E1E] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#888]" />
            </div>
            <h3 className="text-xl font-black text-[#888]">
              {!displayDate ? "暂无内容" : `${displayDate} 暂无内容`}
            </h3>
            <p className="text-sm font-bold text-[#AAA] mt-2">
              {user ? "点击「立即生成今日内容」按钮生成今天的学习材料" : "每日 09:00 自动生成，请稍后再来"}
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex border-4 border-[#1E1E1E] overflow-hidden">
              <button
                onClick={() => setActiveTab("articles")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-colors ${
                  activeTab === "articles" ? "bg-[#1E1E1E] text-white" : "bg-white hover:bg-[#FAF9F5] text-[#1E1E1E]"
                }`}
              >
                <Newspaper className="w-4 h-4" />
                韩语文章 ({articlesData?.articles?.length ?? 0})
              </button>
              <div className="w-1 bg-[#1E1E1E]" />
              <button
                onClick={() => setActiveTab("vocabulary")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black transition-colors ${
                  activeTab === "vocabulary" ? "bg-[#1E1E1E] text-white" : "bg-white hover:bg-[#FAF9F5] text-[#1E1E1E]"
                }`}
              >
                <Hash className="w-4 h-4" />
                MZ 词汇 ({vocabData?.vocabulary?.length ?? 0})
              </button>
            </div>

            {/* Articles tab */}
            {activeTab === "articles" && (
              <div className="space-y-4">
                {articlesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
                    <span className="ml-3 font-black text-[#888]">加载文章中...</span>
                  </div>
                ) : (
                  articlesData?.articles?.map((article: any) => (
                    <ArticleCard key={article.id} article={article} />
                  ))
                )}
              </div>
            )}

            {/* Vocabulary tab */}
            {activeTab === "vocabulary" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vocabLoading ? (
                  <div className="col-span-full flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
                    <span className="ml-3 font-black text-[#888]">加载词汇中...</span>
                  </div>
                ) : (
                  vocabData?.vocabulary?.map((vocab: any) => (
                    <VocabCard key={vocab.id} vocab={vocab} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

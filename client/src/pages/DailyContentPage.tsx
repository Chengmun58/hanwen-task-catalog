import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Newspaper,
  BookOpen,
  MessageSquare,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Loader2,
  Volume2,
  Globe,
  PenLine,
  Hash,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
type ArticleType = "news" | "novel" | "blog" | "professional" | "social";
type WordType = "slang" | "internet" | "youth" | "formal" | "expression";

const ARTICLE_TYPE_CONFIG: Record<ArticleType, {
  label: string; labelKo: string; icon: React.ElementType;
  textColor: string; headerBg: string;
}> = {
  news:         { label: "新闻",   labelKo: "뉴스",   icon: Newspaper,     textColor: "text-[#0F0F0F]", headerBg: "bg-[#C9A84C]" },
  novel:        { label: "小说",   labelKo: "소설",   icon: BookOpen,      textColor: "text-white",     headerBg: "bg-[#0F0F0F]" },
  blog:         { label: "博客",   labelKo: "블로그", icon: PenLine,       textColor: "text-[#0F0F0F]", headerBg: "bg-[#2EC4B6]" },
  professional: { label: "专业",   labelKo: "전문",   icon: FileText,      textColor: "text-white",     headerBg: "bg-[#E8432D]" },
  social:       { label: "社交",   labelKo: "SNS",    icon: MessageSquare, textColor: "text-[#0F0F0F]", headerBg: "bg-[#F7F4EE]" },
};

const WORD_TYPE_CONFIG: Record<WordType, { label: string; labelKo: string; color: string }> = {
  slang:      { label: "俚语",       labelKo: "속어",     color: "bg-[#E8432D] text-white" },
  internet:   { label: "网络用语",   labelKo: "인터넷어", color: "bg-[#2EC4B6] text-white" },
  youth:      { label: "年轻人用语", labelKo: "MZ어",     color: "bg-[#C9A84C] text-[#0F0F0F]" },
  formal:     { label: "正式用语",   labelKo: "공식어",   color: "bg-[#0F0F0F] text-white" },
  expression: { label: "表达方式",   labelKo: "표현",     color: "bg-[#F7F4EE] text-[#0F0F0F] border border-[#E8E5DF]" },
};

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, index }: { article: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const typeConfig = ARTICLE_TYPE_CONFIG[article.articleType as ArticleType] ?? ARTICLE_TYPE_CONFIG.blog;
  const TypeIcon = typeConfig.icon;
  const keywords: string[] = (() => {
    try { return JSON.parse(article.keyWords ?? "[]"); } catch { return []; }
  })();
  const paragraphs: string[] = article.content?.split("\n").filter(Boolean) ?? [];
  const previewParagraphs = paragraphs.slice(0, 2);
  const hasMore = paragraphs.length > 2;

  return (
    <div
      className="card-luxury rounded-xl overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className={`${typeConfig.headerBg} px-5 py-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <TypeIcon className={`w-5 h-5 ${typeConfig.textColor === "text-white" ? "text-white" : "text-[#0F0F0F]"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 ${typeConfig.textColor}`}>
                {typeConfig.labelKo} · {typeConfig.label}
              </span>
              <span className={`text-[10px] font-bold opacity-60 ${typeConfig.textColor}`}>{article.difficulty}</span>
            </div>
            <h3 className={`font-black text-base leading-snug ${typeConfig.textColor}`}>{article.title}</h3>
            <p className={`text-xs font-medium mt-0.5 opacity-70 ${typeConfig.textColor}`}>{article.titleZh}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          {(expanded ? paragraphs : previewParagraphs).map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-[#333] font-medium">{para}</p>
          ))}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-bold text-[#E8432D] hover:text-[#0F0F0F] transition-colors mt-1"
            >
              {expanded
                ? <><ChevronUp className="w-3.5 h-3.5" /> 접기 · 收起</>
                : <><ChevronDown className="w-3.5 h-3.5" /> 전체 보기 · 展开全文</>}
            </button>
          )}
        </div>

        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            showTranslation
              ? "bg-[#FFFBF0] border-[#C9A84C] text-[#0F0F0F]"
              : "bg-[#F7F4EE] border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
          }`}
        >
          <span>중국어 번역 보기 · 查看中文翻译</span>
          {showTranslation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showTranslation && (
          <div className="bg-[#FFFBF0] border border-[#C9A84C]/30 rounded-xl p-4">
            <p className="text-sm leading-relaxed text-[#555] font-medium">{article.contentZh}</p>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#F0EDE6]">
            <span className="text-[10px] font-bold text-[#AAA] uppercase tracking-wider self-center mr-1">키워드</span>
            {keywords.map((kw: string, i: number) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-[#0F0F0F] text-white rounded-full">
                {kw}
              </span>
            ))}
          </div>
        )}

        {article.learningTips && (
          <div className="bg-[#F7F4EE] rounded-xl p-3 flex gap-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A84C] shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-[#555] leading-relaxed">{article.learningTips}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vocabulary Card ──────────────────────────────────────────────────────────
function VocabCard({ vocab, index }: { vocab: any; index: number }) {
  const [showExample, setShowExample] = useState(false);
  const typeConfig = WORD_TYPE_CONFIG[vocab.wordType as WordType] ?? WORD_TYPE_CONFIG.youth;

  return (
    <div
      className="card-luxury rounded-xl overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div
              className="text-3xl font-black text-[#0F0F0F] leading-none"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {vocab.word}
            </div>
            {vocab.pronunciation && (
              <div className="text-xs font-bold text-[#AAA] mt-1.5 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> {vocab.pronunciation}
              </div>
            )}
          </div>
          <span className={`text-[10px] font-black px-2 py-1 rounded-full flex-shrink-0 ${typeConfig.color}`}>
            {typeConfig.labelKo}
          </span>
        </div>
        <div className="bg-[#0F0F0F] rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-white leading-snug">{vocab.meaning}</p>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <button
          onClick={() => setShowExample(!showExample)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            showExample
              ? "bg-[#2EC4B6]/10 border-[#2EC4B6]/30 text-[#0F0F0F]"
              : "bg-[#F7F4EE] border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
          }`}
        >
          <span>예문 보기 · 查看例句</span>
          {showExample ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExample && (
          <div className="space-y-2">
            <div className="bg-[#F7F4EE] rounded-xl p-3">
              <p className="text-sm font-bold text-[#0F0F0F] leading-relaxed">{vocab.exampleSentence}</p>
            </div>
            <div className="bg-[#FFFBF0] border border-[#C9A84C]/20 rounded-xl p-3">
              <p className="text-xs font-medium text-[#666] leading-relaxed">{vocab.exampleTranslation}</p>
            </div>
          </div>
        )}

        {vocab.culturalNote && (
          <div className="flex gap-2 pt-2 border-t border-[#F0EDE6]">
            <Globe className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-[#666] leading-relaxed">{vocab.culturalNote}</p>
          </div>
        )}
      </div>
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
      toast.success(`오늘의 콘텐츠 생성 완료! 文章 ${data.articlesGenerated}篇 + 词汇 ${data.vocabularyGenerated}个 🎉`);
      utils.dailyContent.getArticles.invalidate();
      utils.dailyContent.getVocabulary.invalidate();
      utils.dailyContent.getLatestDate.invalidate();
      utils.dailyContent.getAvailableDates.invalidate();
    },
    onError: (err) => toast.error(`생성 실패: ${err.message}`),
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
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="relative overflow-hidden bg-[#0F0F0F] rounded-2xl">
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden pr-6">
            <span
              className="text-[10rem] font-black text-white leading-none select-none"
              style={{ opacity: 0.04, fontFamily: "'Noto Serif KR', serif" }}
            >
              일
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E8432D] via-[#C9A84C] to-[#2EC4B6]" />
          <div className="relative z-10 px-6 py-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-[#E8432D]/10 border border-[#E8432D]/20 text-[#E8432D] px-3 py-1 rounded-full text-xs font-semibold">
                <Zap className="w-3 h-3" />
                매일 09:00 자동 생성 · 每日09:00自动生成
              </div>
            </div>
            <h1
              className="text-3xl md:text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              매일 콘텐츠
            </h1>
            <p className="text-white/50 text-sm mt-1">Daily Korean Content · 每日韩语学习内容</p>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-white/40" />
                <select
                  value={displayDate ?? ""}
                  onChange={e => setSelectedDate(e.target.value || undefined)}
                  className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
                >
                  {!displayDate && <option value="">날짜 선택...</option>}
                  {availableDates?.dates.map(d => (
                    <option key={d} value={d} className="text-[#0F0F0F]">
                      {d} {d === todayBeijing ? "（오늘）" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {user && (
                <Button
                  onClick={() => generateMutation.mutate({ date: todayBeijing, force: false })}
                  disabled={generateMutation.isPending || !!hasContentToday}
                  className="bg-[#E8432D] hover:bg-[#D03020] text-white font-bold border-0 rounded-xl"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> 생성 중... · 生成中...</>
                  ) : hasContentToday ? (
                    <><Sparkles className="w-4 h-4 mr-1.5 text-[#C9A84C]" /> 오늘 완료 · 今日已生成</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-1.5" /> 오늘 콘텐츠 생성 · 立即生成</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!displayDate || (!articlesLoading && !vocabLoading && isEmpty) ? (
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-xl font-black text-[#AAA]">
              {!displayDate ? "콘텐츠 없음 · 暂无内容" : `${displayDate} 콘텐츠 없음`}
            </h3>
            <p className="text-sm text-[#CCC] mt-2 font-medium">
              {user
                ? "「오늘 콘텐츠 생성」 버튼을 클릭하세요"
                : "매일 09:00에 자동 생성됩니다 · 每日09:00自动生成"}
            </p>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex gap-2">
              {[
                { id: "articles" as const, ko: "한국어 문장", zh: "韩语文章", icon: Newspaper, count: articlesData?.articles?.length ?? 0 },
                { id: "vocabulary" as const, ko: "MZ 단어", zh: "MZ词汇", icon: Hash, count: vocabData?.vocabulary?.length ?? 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-[#0F0F0F] text-white shadow-lg"
                      : "bg-white border border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.ko}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-[#F7F4EE] text-[#888]"
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Articles */}
            {activeTab === "articles" && (
              <div className="space-y-4">
                {articlesLoading ? (
                  <div className="flex items-center justify-center py-16 card-luxury rounded-2xl">
                    <Loader2 className="w-7 h-7 animate-spin text-[#E8432D]" />
                    <span className="ml-3 font-bold text-[#888]">문장 로딩 중... · 加载文章中...</span>
                  </div>
                ) : (
                  articlesData?.articles?.map((article: any, i: number) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))
                )}
              </div>
            )}

            {/* Vocabulary */}
            {activeTab === "vocabulary" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vocabLoading ? (
                  <div className="col-span-full flex items-center justify-center py-16 card-luxury rounded-2xl">
                    <Loader2 className="w-7 h-7 animate-spin text-[#E8432D]" />
                    <span className="ml-3 font-bold text-[#888]">단어 로딩 중... · 加载词汇中...</span>
                  </div>
                ) : (
                  vocabData?.vocabulary?.map((vocab: any, i: number) => (
                    <VocabCard key={vocab.id} vocab={vocab} index={i} />
                  ))
                )}
              </div>
            )}
          </>
        )}

        <div className="text-center py-4">
          <p className="text-xs text-[#CCC] font-medium">
            매일 09:00 (베이징 시간) 자동 생성 · 每日北京时间09:00自动生成
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

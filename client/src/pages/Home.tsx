import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { 
  Flame, 
  BookOpen, 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Volume2, 
  Copy, 
  Check, 
  ChevronRight, 
  Mic, 
  Clock, 
  TrendingUp, 
  Smile,
  Zap,
  Target,
  ArrowRight,
  Star,
  Newspaper,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import lessonsData from "../lessons.json";

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  readTime: string;
  reading: string[];
  breakdown: {
    term: string;
    literal: string;
    nuance: string;
  }[];
  mzExpressions: {
    term: string;
    desc: string;
  }[];
  shadowing: string[];
  chatSimulator: {
    friendMessage: string;
    wrongResponses: {
      text: string;
      reason: string;
    }[];
    nativeResponse: {
      text: string;
      explanation: string;
    };
  };
}

export default function Home() {
  let { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"notes" | "tone" | "eraser">("notes");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessonsData[0] as Lesson);
  const [toneInput, setToneInput] = useState("예전에는 사람 만나는 게 즐거웠는데 요즘은 연락 오는 것만 봐도 피곤해요.");
  const [selectedTone, setSelectedTone] = useState<"kakao" | "insta" | "youtube">("kakao");
  const [copiedText, setCopiedText] = useState(false);
  const [selectedEraserId, setSelectedEraserId] = useState<string | null>(null);
  const [shadowingProgress, setShadowingProgress] = useState<Record<string, number>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [chatAnswer, setChatAnswer] = useState<{ type: "wrong" | "correct"; index?: number } | null>(null);

  const categories = [
    { id: "all", label: "전체", labelZh: "全部", count: lessonsData.length },
    { id: "인간관계", label: "인간관계", labelZh: "人际关系", count: lessonsData.filter(l => l.tags.includes("인간관계")).length },
    { id: "사회적 피로", label: "사회적 피로", labelZh: "社会疲劳", count: lessonsData.filter(l => l.tags.includes("사회적 피로") || l.tags.includes("감정")).length },
    { id: "표현", label: "표현 & 문화", labelZh: "表达与文化", count: lessonsData.filter(l => l.tags.includes("표현") || l.tags.includes("문화")).length }
  ];

  const filteredLessons = selectedCategory === "all" 
    ? lessonsData 
    : lessonsData.filter(l => 
        l.tags.includes(selectedCategory) || 
        (selectedCategory === "사회적 피로" && (l.tags.includes("사회적 피로") || l.tags.includes("감정")))
      );

  const toneOutputs = {
    kakao: {
      title: "카카오톡 말투",
      titleZh: "KakaoTalk 闺蜜死党风",
      platform: "KakaoTalk",
      color: "#FFB100",
      desc: "不加句号，缩写连连，使用 ㅋㅋ 或 ㅠ，透露出极其慵懒、随性的日常感。",
      text: "아 진짜 예전엔 사람 만나는 거 개즐거웠는데 요즘은 연락 오는 거만 봐도 기 다 빨림 요즘 진짜 잠수 마려움 ㅠㅠ",
      slang: ["개즐거웠는데 (超开心)", "기 다 빨림 (精气神吸干)", "잠수 마려움 (超想人间蒸发)"]
    },
    insta: {
      title: "인스타 감성 말투",
      titleZh: "Instagram 圣水洞网红感",
      platform: "Instagram",
      color: "#E8432D",
      desc: "使用韩式精致感叹，搭配中性略带空虚的氛围感词汇，不带攻击性地表达现代人的社交疲劳。",
      text: "예전엔 만남이 즐거웠는데, 요즘은 알림 소리만 들어도 살짝 에너지 소모가 느껴지는 요즘... 다들 현생 잘 챙기고 계시죠? ☕️✨ #현타 #인간관계피로 #현생살기",
      slang: ["에너지 소모 (情绪消耗)", "현생 (现实生活)", "현타 (现实空虚感)"]
    },
    youtube: {
      title: "유튜브 댓글 말투",
      titleZh: "YouTube 毒舌热评共鸣风",
      platform: "YouTube",
      color: "#2EC4B6",
      desc: "极其毒舌但一针见血，使用 뼈 때리다、팩폭，迅速占领热评第一的即视感。",
      text: "아니 이거 나만 그런 거 아니었네ㅋㅋㅋㅋ 연락 알림만 봐도 숨 턱 막히는 거 ㄹㅇ 팩폭임ㅋㅋㅋ 인간관계 유지하는 게 세상에서 제일 빡세다 진짜...",
      slang: ["ㄹㅇ (Real/真)", "팩폭 (事实暴击)", "빡세다 (极其艰难/硬核)"]
    }
  };

  const eraserItems = [
    {
      id: "e1",
      textbook: "한국말을 잘 못합니다.",
      native: "한국어 아직 응애 수준임 ㅠ",
      explanation: "教科书式表达太生硬。'응애 수준' 是亲近关系里可用的可爱网感说法，表示自己还在超初级阶段。正式一点可以说：나 아직 한국어 초보예요.",
      tags: ["MZ口语", "超高频"]
    },
    {
      id: "e2",
      textbook: "이것은 얼마입니까?",
      native: "이거 얼마임?",
      explanation: "去掉繁琐的敬语尾，直接用 'ㅁ' 结尾收尾，是韩国年轻人发消息时最常用的'无力感'极简语气。",
      tags: ["打字专用", "极简风"]
    },
    {
      id: "e3",
      textbook: "오늘 정말 피곤합니다.",
      native: "오늘 진짜 기 다 빨림... 기절 각",
      explanation: "不说피곤하다，说'气全被吸干了（기 빨림）'，还要加上'准备晕倒的节奏（기절 각）'，极具网感！",
      tags: ["社交疲惫", "情绪传递"]
    },
    {
      id: "e4",
      textbook: "네, 알겠습니다.",
      native: "아 넵! 확인요! 🫡",
      explanation: "在职场或日常群聊中，'넵!' 比 '네' 显得更有精神且不卑不亢，配上敬礼表情是现代打工人的灵魂回复。",
      tags: ["职场必备", "神仙语气"]
    },
    {
      id: "e5",
      textbook: "그 소식은 정말 충격적입니다.",
      native: "헐 이건 좀 선 넘었는데;;",
      explanation: "用 '헐' 表示震惊，'선 넘었다' 表示行为或情况已经过界、太过分。比 '충격적입니다' 更像真实聊天里的无语反应。",
      tags: ["网感表达", "无语瞬间"]
    }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("클립보드에 복사되었습니다! (已成功复制到剪贴板！)");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const startRecording = (id: string) => {
    setIsRecording(id);
    toast.info("마이크 입력 감지 중... (模拟录音中，请大声朗读！)");
    setTimeout(() => {
      setIsRecording(null);
      setShadowingProgress(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + 1
      }));
      toast.success("섀도잉 완료! 훈련도가 상승했습니다. 🎉");
    }, 3000);
  };

  useEffect(() => {
    setChatAnswer(null);
  }, [selectedLesson]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#0F0F0F] selection:bg-[#E8432D]/20 selection:text-[#E8432D]">

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-[#0F0F0F]">
        {/* Korean watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            className="ko-watermark text-[28vw] leading-none text-white"
            style={{ opacity: 0.04 }}
          >
            한국어
          </span>
        </div>
        {/* Accent lines */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E8432D] via-[#C9A84C] to-[#2EC4B6]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            {/* Left: Title block */}
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#E8432D]/10 border border-[#E8432D]/30 text-[#E8432D] px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                  <Flame className="w-3 h-3" />
                  NATIVE MODE · 원어민 감각 훈련
                </div>
                <div className="h-px w-12 bg-white/20" />
                <span className="text-white/40 text-xs font-medium tracking-widest uppercase">몰입 훈련소</span>
              </div>

              {/* Main heading */}
              <div>
                <h1 className="ko-serif text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight">
                  3개월
                </h1>
                <h1 className="ko-serif text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
                  <span className="text-gradient-brand">원어민 감각 장착</span>
                </h1>
                <p className="text-white/50 text-sm md:text-base font-medium mt-3 tracking-wide">
                  MZ 표현부터 대화 감각까지, 진짜 한국어처럼 익히는 몰입 훈련 · 从 MZ 表达到聊天语感，训练真正像韩国人一样使用韩语
                </p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  { ko: "감각 노트", zh: "语感秘籍", value: `${lessonsData.length}편` },
                  { ko: "MZ 표현", zh: "MZ词汇", value: "50+" },
                  { ko: "실전 훈련", zh: "训练模式", value: "3가지" },
                ].map((stat) => (
                  <div key={stat.ko} className="flex flex-col">
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                    <span className="text-[10px] text-white/40 font-medium tracking-wider">
                      {stat.ko} · {stat.zh}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Trainer card */}
            <div className="animate-fade-in-up animate-delay-200 flex-shrink-0">
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-5 w-full md:w-72">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8432D] to-[#C9A84C] flex items-center justify-center font-black text-white text-lg shadow-lg">
                    MZ
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">민지 쌤</div>
                    <div className="text-white/50 text-xs">Minji Coach · 首尔土生土长</div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-3 h-3 fill-[#C9A84C] text-[#C9A84C]" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-white/60 text-xs leading-relaxed border-t border-white/10 pt-3">
                  "설명은 길게 필요 없어요. 그냥 듣고, 느끼고, 따라 하면 돼요. 3개월이면 충분해요."
                </p>
                <p className="text-white/30 text-[10px] mt-1 italic">
                  "不需要太多解释，听、感受并跟着做。3个月足够了。"
                </p>
              </div>
            </div>
          </div>

          {/* Quick nav pills */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10 animate-fade-in-up animate-delay-300">
            <Link href="/daily">
              <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer">
                <Newspaper className="w-3 h-3" />
                매일 콘텐츠 · 每日内容
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
            <Link href="/files">
              <span className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer">
                <FolderOpen className="w-3 h-3" />
                자료실 · 学习资料
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
            {user && (
              <span className="inline-flex items-center gap-1.5 bg-[#E8432D]/10 border border-[#E8432D]/20 text-[#E8432D] text-xs font-medium px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                로그인됨 · {user.name || "훈련생"}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="lg:col-span-4 flex flex-col gap-6">

          {/* Today's Mission */}
          <div className="card-luxury rounded-xl overflow-hidden">
            <div className="bg-[#0F0F0F] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C9A84C]" />
                <span className="text-white font-bold text-sm tracking-wide">오늘 미션</span>
                <span className="text-white/40 text-xs">· 今日训练</span>
              </div>
              <span className="text-[#E8432D] text-xs font-bold bg-[#E8432D]/10 border border-[#E8432D]/20 px-2 py-0.5 rounded-full">
                D-90
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                { badge: "MZ", badgeColor: "bg-[#C9A84C] text-white", title: "MZ 유행어 체크", desc: "掌握高频词 '분좋카' (氛围超好的咖啡厅)" },
                { badge: "READ", badgeColor: "bg-[#E8432D] text-white", title: "깊이 읽기", desc: "精读：圣水洞快闪店文化的'现实还原'现象" },
                { badge: "SHDW", badgeColor: "bg-[#0F0F0F] text-white", title: "섀도잉 훈련", desc: "跟读练习：在韩综里最自然的'无力感'表达" },
              ].map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F4EE] hover:bg-[#F0EDE6] transition-colors">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${m.badgeColor} flex-shrink-0 mt-0.5`}>
                    {m.badge}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[#0F0F0F]">{m.title}</div>
                    <div className="text-xs text-[#666] mt-0.5">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training Progress */}
          <div className="card-luxury rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E5DF] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E8432D]" />
              <span className="font-bold text-sm text-[#0F0F0F]">내 훈련 현황</span>
              <span className="text-[#999] text-xs">· 训练进度</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { ko: "감각 노트 정복", zh: "语感秘籍", value: `${lessonsData.length} / ${lessonsData.length}`, color: "text-[#E8432D]" },
                { ko: "섀도잉 훈련도", zh: "跟读次数", value: `${Object.values(shadowingProgress).reduce((a, b) => a + b, 0)} 회`, color: "text-[#2EC4B6]" },
              ].map((stat) => (
                <div key={stat.ko} className="bg-[#F7F4EE] rounded-lg p-3 text-center">
                  <div className="text-xs text-[#999] font-medium">{stat.ko}</div>
                  <div className={`text-xl font-black mt-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-[#BBB] mt-0.5">{stat.zh}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Korean Phrase of the Day */}
          <div className="card-luxury rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#E8432D] to-[#C9A84C] px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">오늘의 표현</span>
                <span className="text-white/60 text-xs">· 今日表达</span>
              </div>
              <div className="ko-serif text-2xl font-black text-white leading-snug">
                "분위기 장인"
              </div>
              <div className="text-white/70 text-xs mt-1 font-medium">
                bun-wi-gi jang-in · 氛围大师
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-[#555] leading-relaxed">
                形容一个人极其擅长营造氛围感的人。在咖啡厅、聚会场合中，能让整个空间变得更有"感觉"的人就是 분위기 장인。
              </p>
              <div className="mt-3 bg-[#F7F4EE] rounded-lg p-3">
                <div className="text-[10px] text-[#999] font-bold uppercase tracking-wider mb-1">예문 · 例句</div>
                <p className="text-sm font-bold text-[#0F0F0F]">야, 너 진짜 분위기 장인이다 ㄹㅇ</p>
                <p className="text-xs text-[#888] mt-0.5">哇，你真的是氛围大师啊，真的</p>
              </div>
            </div>
          </div>

          {/* MZ Slang Quick Reference */}
          <div className="card-luxury rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E5DF] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2EC4B6]" />
              <span className="font-bold text-sm text-[#0F0F0F]">MZ 슬랭 사전</span>
              <span className="text-[#999] text-xs">· 网感词典</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {[
                { word: "갓생", rom: "gat-saeng", zh: "神级人生（自律充实的生活）" },
                { word: "현타", rom: "hyeon-ta", zh: "现实空虚感（突然清醒的失落）" },
                { word: "킹받다", rom: "king-bat-da", zh: "极度气愤（King+받다 合成词）" },
                { word: "스불재", rom: "seu-bul-jae", zh: "自作自受（스스로 불러온 재앙）" },
                { word: "TMI", rom: "tee-em-ai", zh: "信息过量（Too Much Info）" },
              ].map((item) => (
                <div key={item.word} className="flex items-center gap-3 py-2 border-b border-[#F0EDE6] last:border-0">
                  <div className="ko-serif text-base font-black text-[#E8432D] w-16 flex-shrink-0">{item.word}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#BBB] font-mono">{item.rom}</div>
                    <div className="text-xs text-[#555] font-medium truncate">{item.zh}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONSOLE ── */}
        <main className="lg:col-span-8 flex flex-col gap-6">

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "notes" as const, ko: "원어민 감각 노트", zh: "语感秘籍", icon: BookOpen, accent: "#C9A84C" },
              { id: "tone" as const, ko: "MZ 말투 변환기", zh: "语气转换", icon: MessageSquare, accent: "#E8432D" },
              { id: "eraser" as const, ko: "어색한 표현 교정", zh: "外国人味纠正", icon: Sparkles, accent: "#2EC4B6" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "text-white shadow-lg"
                    : "bg-white border border-[#E8E5DF] text-[#666] hover:text-[#0F0F0F] hover:border-[#CCC]"
                }`}
                style={activeTab === tab.id ? { background: tab.accent } : {}}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.ko}</span>
                <span className="sm:hidden">{tab.zh}</span>
                <span className={`text-[10px] font-medium opacity-70 hidden md:inline`}>
                  {activeTab === tab.id ? tab.zh : ""}
                </span>
              </button>
            ))}
          </div>

          {/* ── TAB 1: SECRET NOTES ── */}
          {activeTab === "notes" && (
            <div className="flex flex-col gap-5 animate-fade-in-up">
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-[#C9A84C]" />
                <div>
                  <h2 className="font-black text-xl text-[#0F0F0F]">원어민 감각 노트</h2>
                  <p className="text-xs text-[#999]">Native Speaker Sense Notes · 语感秘籍</p>
                </div>
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat.id
                        ? "bg-[#0F0F0F] text-white"
                        : "bg-white border border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
                    }`}
                  >
                    {cat.label}
                    <span className="ml-1 opacity-60">({cat.count})</span>
                  </button>
                ))}
              </div>

              {/* Lessons grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson as Lesson)}
                    className={`card-luxury rounded-xl p-5 cursor-pointer transition-all border-2 ${
                      selectedLesson.id === lesson.id
                        ? "border-[#C9A84C] bg-[#FFFBF0] shadow-[0_0_0_3px_rgba(201,168,76,0.15)]"
                        : "border-transparent"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex flex-wrap gap-1 mb-2">
                      {lesson.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-[#E8432D] bg-[#E8432D]/8 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-black text-base leading-snug line-clamp-2 text-[#0F0F0F]">{lesson.title}</h4>
                    <p className="text-xs text-[#888] mt-1 line-clamp-1">{lesson.subtitle}</p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#F0EDE6]">
                      <span className="text-xs text-[#AAA] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lesson.readTime}
                      </span>
                      <span className="text-xs font-bold text-[#C9A84C] flex items-center gap-1">
                        훈련하기 <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lesson Reader */}
              {selectedLesson && (
                <div className="card-luxury rounded-xl overflow-hidden mt-2">
                  {/* Reader header */}
                  <div className="bg-[#0F0F0F] px-6 py-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black bg-[#E8432D] text-white px-2 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                      <span className="text-white/40 text-xs">{selectedLesson.readTime}</span>
                    </div>
                    <h3 className="ko-serif text-xl md:text-2xl font-black text-white leading-snug">
                      {selectedLesson.title}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">{selectedLesson.subtitle}</p>
                  </div>

                  <div className="p-6 flex flex-col gap-8">
                    {/* Note 1: Reading */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center text-white text-[10px] font-black">1</div>
                        <h3 className="font-black text-base text-[#0F0F0F]">원문 읽기</h3>
                        <span className="text-[#999] text-xs">精读原文</span>
                      </div>
                      <div className="bg-[#F7F4EE] rounded-xl p-5 space-y-3">
                        {selectedLesson.reading.map((para, idx) => (
                          <p key={idx} className="text-sm leading-relaxed text-[#333] font-medium">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Note 2: Breakdown */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#2EC4B6] flex items-center justify-center text-white text-[10px] font-black">2</div>
                        <h3 className="font-black text-base text-[#0F0F0F]">뉘앙스 해부</h3>
                        <span className="text-[#999] text-xs">深层语感拆解</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedLesson.breakdown.map((item, idx) => (
                          <div key={idx} className="card-luxury rounded-xl p-4">
                            <h4 className="font-black text-base text-[#E8432D] flex items-center gap-1.5">
                              <Volume2 className="w-4 h-4 text-[#0F0F0F]" /> {item.term}
                            </h4>
                            <div className="text-xs text-[#AAA] mt-0.5 font-medium">直译：{item.literal}</div>
                            <p className="text-xs text-[#555] mt-2 leading-relaxed border-t border-[#F0EDE6] pt-2">
                              {item.nuance}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Note 3: MZ Expressions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center text-white text-[10px] font-black">3</div>
                        <h3 className="font-black text-base text-[#0F0F0F]">오늘 MZ 표현</h3>
                        <span className="text-[#999] text-xs">今日 MZ 词汇</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.mzExpressions.map((exp, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#F7F4EE] border border-[#E8E5DF] rounded-full px-3 py-1.5">
                            <span className="ko-serif text-sm font-black text-[#E8432D]">{exp.term}</span>
                            <span className="text-xs text-[#666]">{exp.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Note 4: Shadowing */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#0F0F0F] flex items-center justify-center text-white text-[10px] font-black">4</div>
                        <h3 className="font-black text-base text-[#0F0F0F]">섀도잉 훈련</h3>
                        <span className="text-[#999] text-xs">跟读发音与语气</span>
                      </div>
                      <div className="space-y-3">
                        {selectedLesson.shadowing.map((sentence, idx) => (
                          <div key={idx} className="card-luxury rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex-1">
                              <p className="font-bold text-sm text-[#0F0F0F]">{sentence}</p>
                              <div className="text-xs text-[#AAA] mt-1">
                                建议反复读 30 次 · 已完成：
                                <span className="font-black text-[#E8432D] ml-1">{shadowingProgress[sentence] || 0}</span> / 30
                              </div>
                            </div>
                            <button
                              onClick={() => startRecording(sentence)}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isRecording === sentence
                                  ? "bg-[#E8432D] text-white animate-pulse"
                                  : "bg-[#F7F4EE] hover:bg-[#0F0F0F] hover:text-white text-[#0F0F0F]"
                              }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              {isRecording === sentence ? "녹음 중..." : "녹음 시작"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Note 5: Chat Simulator */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#E8432D] flex items-center justify-center text-white text-[10px] font-black">5</div>
                        <h3 className="font-black text-base text-[#0F0F0F]">한국인식 답변 훈련</h3>
                        <span className="text-[#999] text-xs">韩式情绪共鸣测试</span>
                      </div>
                      <div className="bg-[#F7F4EE] rounded-xl p-5">
                        <div className="text-[10px] font-bold text-[#AAA] uppercase tracking-wider mb-3">상황 · 情景对话</div>
                        {/* Friend bubble */}
                        <div className="flex items-start gap-3 mb-5">
                          <div className="w-9 h-9 rounded-full bg-[#C9A84C] flex items-center justify-center font-black text-white text-xs flex-shrink-0">
                            친구
                          </div>
                          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-xs">
                            <p className="text-sm font-medium text-[#0F0F0F]">{selectedLesson.chatSimulator.friendMessage}</p>
                          </div>
                        </div>
                        {/* Response options */}
                        <div className="text-xs font-bold text-[#AAA] uppercase tracking-wider mb-2">어떻게 답하시겠습니까? · 你将如何回复？</div>
                        <div className="space-y-2">
                          {selectedLesson.chatSimulator.wrongResponses.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setChatAnswer({ type: "wrong", index: idx })}
                              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${
                                chatAnswer?.type === "wrong" && chatAnswer.index === idx
                                  ? "bg-red-50 border-2 border-red-200 text-red-700"
                                  : "bg-white border border-[#E8E5DF] hover:border-[#CCC] text-[#333]"
                              }`}
                            >
                              <span>{option.text}</span>
                              <span className="text-[10px] font-black text-[#E8432D] ml-2 flex-shrink-0">교과서식 ❌</span>
                            </button>
                          ))}
                          <button
                            onClick={() => setChatAnswer({ type: "correct" })}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${
                              chatAnswer?.type === "correct"
                                ? "bg-emerald-50 border-2 border-emerald-200 text-emerald-700"
                                : "bg-white border border-[#E8E5DF] hover:border-[#CCC] text-[#333]"
                            }`}
                          >
                            <span>{selectedLesson.chatSimulator.nativeResponse.text.split('\n')[0]}...</span>
                            <span className="text-[10px] font-black text-[#2EC4B6] ml-2 flex-shrink-0">네이티브 ✅</span>
                          </button>
                        </div>
                        {/* Feedback */}
                        {chatAnswer && (
                          <div className={`mt-4 p-4 rounded-xl border ${
                            chatAnswer.type === "correct"
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-red-50 border-red-200"
                          }`}>
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                              {chatAnswer.type === "correct" ? (
                                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 완벽한 답변입니다! · 完美共鸣！</>
                              ) : (
                                <><HelpCircle className="w-4 h-4 text-red-400" /> 살짝 아쉬운 답변... · 有点像外国人哦</>
                              )}
                            </h4>
                            {chatAnswer.type === "correct" ? (
                              <div>
                                <div className="bg-white rounded-xl p-3 font-bold text-sm my-2 whitespace-pre-line text-[#0F0F0F]">
                                  {selectedLesson.chatSimulator.nativeResponse.text}
                                </div>
                                <p className="text-xs text-[#555] leading-relaxed">
                                  {selectedLesson.chatSimulator.nativeResponse.explanation}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-[#555] leading-relaxed">
                                {selectedLesson.chatSimulator.wrongResponses[chatAnswer.index || 0].reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: TONE SHIFTER ── */}
          {activeTab === "tone" && (
            <div className="card-luxury rounded-xl overflow-hidden animate-fade-in-up">
              <div className="bg-[#0F0F0F] px-6 py-5">
                <h2 className="ko-serif text-2xl font-black text-white">MZ 말투 변환기</h2>
                <p className="text-white/50 text-xs mt-1">多平台语气转换 · 一键变身地道网感表达</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                {/* Input */}
                <div>
                  <label className="block text-xs font-bold text-[#AAA] uppercase tracking-wider mb-2">
                    1. 표준어 입력 · 输入标准韩语
                  </label>
                  <textarea
                    value={toneInput}
                    onChange={(e) => setToneInput(e.target.value)}
                    className="w-full h-24 p-4 rounded-xl border border-[#E8E5DF] bg-[#F7F4EE] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8432D]/30 focus:border-[#E8432D] resize-none transition-all"
                    placeholder="예: 오늘 기분이 정말 좋습니다."
                  />
                </div>
                {/* Platform selector */}
                <div>
                  <label className="block text-xs font-bold text-[#AAA] uppercase tracking-wider mb-3">
                    2. 플랫폼 선택 · 选择平台
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["kakao", "insta", "youtube"] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                          selectedTone === tone
                            ? "text-white shadow-lg"
                            : "bg-[#F7F4EE] text-[#666] hover:bg-[#F0EDE6]"
                        }`}
                        style={selectedTone === tone ? { background: toneOutputs[tone].color } : {}}
                      >
                        <span className="text-base">
                          {tone === "kakao" ? "💬" : tone === "insta" ? "📸" : "▶️"}
                        </span>
                        <span>{toneOutputs[tone].platform}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Output */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-black text-sm text-[#0F0F0F]">{toneOutputs[selectedTone].title}</div>
                      <div className="text-xs text-[#999]">{toneOutputs[selectedTone].titleZh}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(toneOutputs[selectedTone].text)}
                      className="p-2 rounded-lg bg-[#F7F4EE] hover:bg-[#E8432D] hover:text-white text-[#666] transition-all"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="bg-[#F7F4EE] rounded-xl p-4 font-bold text-sm text-[#0F0F0F] leading-relaxed">
                    {toneOutputs[selectedTone].text}
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-[#AAA] uppercase tracking-wider mb-2">핵심 슬랭 · 核心网感词汇</div>
                    <div className="flex flex-wrap gap-2">
                      {toneOutputs[selectedTone].slang.map((s, idx) => (
                        <span key={idx} className="bg-white border border-[#E8E5DF] text-xs font-bold px-3 py-1 rounded-full text-[#333]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 bg-[#FFFBF0] border border-[#C9A84C]/20 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider mb-1">포인트 · 要点</div>
                    <p className="text-xs text-[#555] leading-relaxed">{toneOutputs[selectedTone].desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: FOREIGNER ERASER ── */}
          {activeTab === "eraser" && (
            <div className="flex flex-col gap-5 animate-fade-in-up">
              {/* Header */}
              <div className="card-luxury rounded-xl overflow-hidden">
                <div className="bg-[#0F0F0F] px-6 py-5">
                  <h2 className="ko-serif text-2xl font-black text-white">어색한 표현 교정기</h2>
                  <p className="text-white/50 text-xs mt-1">外国人味纠正仪 · 一秒看懂真实原民表达</p>
                </div>
                <div className="px-6 py-4 bg-[#FFFBF0] border-b border-[#E8E5DF]">
                  <p className="text-xs text-[#666] leading-relaxed">
                    点击你经常在教科书里见到的死板韩语，一秒揭秘韩国年轻人天天挂在嘴边的真实原民表达。
                  </p>
                </div>
              </div>

              {/* Eraser items */}
              <div className="flex flex-col gap-3">
                {eraserItems.map((item) => {
                  const isSelected = selectedEraserId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEraserId(isSelected ? null : item.id)}
                      className={`card-luxury rounded-xl overflow-hidden cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-[#2EC4B6] ring-offset-2" : ""
                      }`}
                    >
                      <div className={`px-5 py-4 transition-colors ${isSelected ? "bg-[#2EC4B6]/5" : "bg-white"}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map((tag) => (
                                <span key={tag} className="text-[10px] font-black bg-[#0F0F0F] text-white px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] font-bold text-[#AAA] uppercase tracking-wider mb-1">
                              ❌ 교과서식 · 教科书式
                            </div>
                            <h4 className="text-base font-black text-[#E8432D] line-through decoration-2">
                              {item.textbook}
                            </h4>
                          </div>
                          <div className="text-xs font-bold text-[#999] flex items-center gap-1 flex-shrink-0 mt-1">
                            {isSelected ? "접기 ▲" : "보기 ▼"}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="border-t border-[#E8E5DF] px-5 py-4 bg-[#F7F4EE]">
                          <div className="text-[10px] font-bold text-[#2EC4B6] uppercase tracking-wider mb-2">
                            ✅ 원어민 표현 · 原民表达
                          </div>
                          <div className="ko-serif text-xl font-black text-[#0F0F0F] flex items-center gap-2">
                            <Smile className="w-5 h-5 text-[#C9A84C]" /> {item.native}
                          </div>
                          <p className="text-xs text-[#555] mt-3 leading-relaxed border-l-2 border-[#2EC4B6] pl-3">
                            {item.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E8E5DF] mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="ko-serif text-2xl font-black text-[#E8432D]">한</div>
            <div>
              <div className="font-black text-sm text-[#0F0F0F]">3개월 원어민 감각 훈련소</div>
              <div className="text-xs text-[#AAA]">Korean Native Sense Lab · 몰입 훈련소</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/daily">
              <span className="text-xs text-[#AAA] hover:text-[#E8432D] transition-colors cursor-pointer">매일 콘텐츠</span>
            </Link>
            <Link href="/files">
              <span className="text-xs text-[#AAA] hover:text-[#E8432D] transition-colors cursor-pointer">자료실</span>
            </Link>
            <span className="text-xs text-[#DDD]">|</span>
            <span className="text-xs text-[#DDD]">© 2025 한문 훈련소</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
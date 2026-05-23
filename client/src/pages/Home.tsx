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
  RefreshCw, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Smile,
  Zap,
  Target,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
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
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"notes" | "tone" | "eraser">("notes");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessonsData[0] as Lesson);
  
  // Tone Shifter State
  const [toneInput, setToneInput] = useState("예전에는 사람 만나는 게 즐거웠는데 요즘은 연락 오는 것만 봐도 피곤해요.");
  const [selectedTone, setSelectedTone] = useState<"kakao" | "insta" | "youtube">("kakao");
  const [copiedText, setCopiedText] = useState(false);

  // Foreigner-Vibe Eraser State
  const [selectedEraserId, setSelectedEraserId] = useState<string | null>(null);

  // Shadowing Progress
  const [shadowingProgress, setShadowingProgress] = useState<Record<string, number>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null);

  // Chat Simulator State
  const [chatAnswer, setChatAnswer] = useState<{ type: "wrong" | "correct"; index?: number } | null>(null);

  // Categories mapping
  const categories = [
    { id: "all", label: "전체 주제 (全部主题)", count: lessonsData.length },
    { id: "인간관계", label: "인간관계 (人际关系)", count: lessonsData.filter(l => l.tags.includes("인간관계")).length },
    { id: "사회적 피로", label: "사회적 피로 (社会疲劳)", count: lessonsData.filter(l => l.tags.includes("사회적 피로") || l.tags.includes("감정")).length },
    { id: "표현", label: "표현 & 문화 (表达与文化)", count: lessonsData.filter(l => l.tags.includes("표현") || l.tags.includes("문화")).length }
  ];

  const filteredLessons = selectedCategory === "all" 
    ? lessonsData 
    : lessonsData.filter(l => 
        l.tags.includes(selectedCategory) || 
        (selectedCategory === "사회적 피로" && (l.tags.includes("사회적 피로") || l.tags.includes("감정")))
      );

  const toneOutputs = {
    kakao: {
      title: "카카오톡 톡방 말투 (KakaoTalk 闺蜜死党风)",
      desc: "不加句号，缩写连连，使用 ㅋㅋ (哈哈) 或 ㅠ (哭哭)，透露出极其慵懒、随性的日常感。",
      text: "아 진짜 예전엔 사람 만나는 거 개즐거웠는데 요즘은 연락 오는 거만 봐도 기 다 빨림 요즘 진짜 잠수 마려움 ㅠㅠ",
      slang: ["개즐거웠는데 (超开心)", "기 다 빨림 (精气神吸干)", "잠수 마려움 (超想人间蒸发)"]
    },
    insta: {
      title: "인스타그램 감성 피드 말투 (Instagram 圣水洞网红感)",
      desc: "使用韩式精致感叹，搭配中性略带空虚的氛围感词汇，不带攻击性地表达现代人的社交疲劳。",
      text: "예전엔 만남이 즐거웠는데, 요즘은 알림 소리만 들어도 살짝 에너지 소모가 느껴지는 요즘... 다들 현생 잘 챙기고 계시죠? ☕️✨ #현타 #인간관계피로 #현생살기",
      slang: ["에너지 소모 (情绪消耗)", "현생 (现实生活)", "현타 (现实空虚感)"]
    },
    youtube: {
      title: "유튜브 댓글 공감 말투 (YouTube 毒舌热评共鸣风)",
      desc: "极其毒舌但一针见血，使用 뼈 때리다 (扎心)、팩폭 (事实暴击)，迅速占领热评第一的即视感。",
      text: "아니 이거 나만 그런 거 아니었네ㅋㅋㅋㅋ 연락 알림만 봐도 숨 턱 막히는 거 ㄹㅇ 팩폭임ㅋㅋㅋ 인간관계 유지하는 게 세상에서 제일 빡세다 진짜...",
      slang: ["ㄹㅇ (Real/真)", "팩폭 (事实暴击)", "빡세다 (极其艰难/硬核)"]
    }
  };

  const eraserItems = [
    {
      id: "e1",
      textbook: "한국말을 잘 못합니다.",
      native: "한국어 아직 응애 수준임 ㅠ",
      explanation: "教科书式表达太生硬，说自己还是“婴儿（응애）”阶段，既可爱又接地气，瞬间拉近距离！",
      tags: ["MZ口语", "超高频"]
    },
    {
      id: "e2",
      textbook: "이것은 얼마입니까?",
      native: "이거 얼마임?",
      explanation: "去掉繁琐的敬语尾，直接用 'ㅁ' 结尾收尾，是韩国年轻人发消息时最常用的“无力感”极简语气。",
      tags: ["打字专用", "极简风"]
    },
    {
      id: "e3",
      textbook: "오늘 정말 피곤합니다.",
      native: "오늘 진짜 기 다 빨림... 기절 각",
      explanation: "不说피곤하다，说“气全被吸干了（기 빨림）”，还要加上“准备晕倒的节奏（기절 각）”，极具网感！",
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
      native: "헐 진짜 뇌절 오네;;",
      explanation: "用 '헐' 表示震惊，'뇌절' (脑回路断线/无语) 表达对荒谬消息的真实无力感，配上两个分号 ';;' 绝了。",
      tags: ["网冲必备", "无语瞬间"]
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

  // Reset simulator when changing lesson
  useEffect(() => {
    setChatAnswer(null);
  }, [selectedLesson]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E1E1E] font-sans selection:bg-[#FF6B35] selection:text-white pb-12">
      {/* Top Banner / Hero Header */}
      <header className="border-b-4 border-[#1E1E1E] bg-[#FF6B35] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB100] rounded-full translate-x-20 -translate-y-20 border-4 border-[#1E1E1E] z-0"></div>
        <div className="absolute -bottom-10 left-1/3 w-32 h-32 bg-[#2EC4B6] rotate-12 border-4 border-[#1E1E1E] z-0"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#1E1E1E] text-white px-3 py-1 text-xs font-black uppercase tracking-widest mb-3 border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Flame className="w-3.5 h-3.5 text-[#FFB100] animate-bounce" /> NATIVE MODE
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              3개월 한국인화 지옥 훈련소
            </h1>
            <p className="text-lg md:text-xl font-bold text-[#1E1E1E] mt-2">
              3-Month Korean Native Mastery Console
            </p>
          </div>
          
          <div className="bg-white border-4 border-[#1E1E1E] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
            <div className="bg-[#FFB100] p-3 border-2 border-[#1E1E1E] rounded-none">
              <Target className="w-8 h-8 text-[#1E1E1E]" />
            </div>
            <div>
              <div className="text-xs font-black text-[#888]">TRAINING DAY</div>
              <div className="text-2xl font-black text-[#1E1E1E]">D-90 COUNTDOWN</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Trainer Profile & Sidebar Info (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Trainer Card */}
          <div className="bg-white border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
            <div className="absolute -top-3 -right-3 bg-[#2EC4B6] text-[#1E1E1E] font-black px-3 py-1 border-2 border-[#1E1E1E] text-xs uppercase tracking-wider rotate-6">
              SUPER TRAINER
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-none border-4 border-[#1E1E1E] bg-[#FFB100] overflow-hidden flex items-center justify-center font-black text-2xl text-[#1E1E1E] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                MZ
              </div>
              <div>
                <h3 className="text-xl font-black">민지 쌤 (Minji Coach)</h3>
                <p className="text-xs font-bold text-[#FF6B35]">首尔土生土长 · 资深网冲冲浪手</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#555] border-t-2 border-dashed border-[#1E1E1E] pt-3 leading-relaxed">
              “别再用那些死板的教科书韩语了！在我的控制台，你将彻底重塑大脑。少解释、多传递情绪，3个月让你在 KakaoTalk 和圣水洞横着走！”
            </p>
          </div>

          {/* Today's Mission Console */}
          <div className="bg-[#2EC4B6] border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(1,1,1,1)] text-[#1E1E1E]">
            <h3 className="text-xl font-black flex items-center gap-2 mb-4 uppercase tracking-wider">
              <Zap className="w-5 h-5 fill-current" /> 오늘 완료할 미션 (今日必修)
            </h3>
            
            <div className="flex flex-col gap-4">
              {/* Mission 1 */}
              <div className="bg-white border-2 border-[#1E1E1E] p-3 flex items-start gap-3">
                <div className="bg-[#FFB100] text-xs font-black px-2 py-0.5 border border-[#1E1E1E] mt-0.5">MZ</div>
                <div>
                  <h4 className="font-black text-sm">MZ流行语打卡</h4>
                  <p className="text-xs text-[#555] mt-1">掌握高频词 “분좋카” (氛围超好的咖啡厅)</p>
                </div>
              </div>

              {/* Mission 2 */}
              <div className="bg-white border-2 border-[#1E1E1E] p-3 flex items-start gap-3">
                <div className="bg-[#FF6B35] text-white text-xs font-black px-2 py-0.5 border border-[#1E1E1E] mt-0.5">READ</div>
                <div>
                  <h4 className="font-black text-sm">深度语感阅读</h4>
                  <p className="text-xs text-[#555] mt-1">精读：圣水洞快闪店文化的“现实还原”现象</p>
                </div>
              </div>

              {/* Mission 3 */}
              <div className="bg-white border-2 border-[#1E1E1E] p-3 flex items-start gap-3">
                <div className="bg-[#1E1E1E] text-white text-xs font-black px-2 py-0.5 border border-[#1E1E1E] mt-0.5">SHDW</div>
                <div>
                  <h4 className="font-black text-sm">语气语气 Shadowing</h4>
                  <p className="text-xs text-[#555] mt-1">跟读练习：在韩综里最自然的“无力感”表达</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B35]" /> 내 훈련 현황 (训练进度)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-3 text-center">
                <div className="text-xs font-bold text-[#888]">비밀노트 정복</div>
                <div className="text-2xl font-black text-[#FF6B35] mt-1">4 / 4</div>
              </div>
              <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-3 text-center">
                <div className="text-xs font-bold text-[#888]">섀도잉 훈련도</div>
                <div className="text-2xl font-black text-[#2EC4B6] mt-1">
                  {Object.values(shadowingProgress).reduce((a, b) => a + b, 0)} 회
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* Right Column: Interactive Console Tabs (8 Cols) */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Neo-Brutalist Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b-4 border-[#1E1E1E] pb-2">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-5 py-3 font-black text-sm md:text-base border-4 border-[#1E1E1E] transition-all relative ${
                activeTab === "notes"
                  ? "bg-[#FFB100] -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              📖 원어민 비밀 노트 (语感秘籍)
            </button>
            <button
              onClick={() => setActiveTab("tone")}
              className={`px-5 py-3 font-black text-sm md:text-base border-4 border-[#1E1E1E] transition-all relative ${
                activeTab === "tone"
                  ? "bg-[#FF6B35] text-white -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              💬 다채로운 톤 체인저 (语气转换)
            </button>
            <button
              onClick={() => setActiveTab("eraser")}
              className={`px-5 py-3 font-black text-sm md:text-base border-4 border-[#1E1E1E] transition-all relative ${
                activeTab === "eraser"
                  ? "bg-[#2EC4B6] -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              ✨ 외국인 티 박멸 (外国人味纠正)
            </button>
          </div>

          {/* TAB 1: SECRET NOTES */}
          {activeTab === "notes" && (
            <div className="flex flex-col gap-6">
              
              {/* Categories Selector */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-black border-2 border-[#1E1E1E] rounded-none transition-all ${
                      selectedCategory === cat.id
                        ? "bg-[#1E1E1E] text-white"
                        : "bg-white hover:bg-[#FAF9F5]"
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Grid of Lessons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson as Lesson)}
                    className={`border-4 border-[#1E1E1E] p-5 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedLesson.id === lesson.id
                        ? "bg-[#FFB100] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
                        : "bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {lesson.tags.map((tag) => (
                          <span key={tag} className="bg-white text-[#1E1E1E] text-[10px] font-black px-1.5 py-0.5 border border-[#1E1E1E]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-lg font-black leading-snug line-clamp-2">{lesson.title}</h4>
                      <p className="text-xs font-bold text-[#666] mt-1">{lesson.subtitle}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 border-t-2 border-dashed border-[#1E1E1E] pt-3">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {lesson.readTime}
                      </span>
                      <span className="text-xs font-black flex items-center gap-1 text-[#FF6B35]">
                        훈련하기 <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Lesson Reader Console */}
              {selectedLesson && (
                <div className="bg-white border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-4">
                  
                  {/* Header */}
                  <div className="border-b-4 border-[#1E1E1E] pb-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#FF6B35] text-white text-xs font-black px-2 py-0.5 border-2 border-[#1E1E1E]">
                        RECOMMENDED
                      </span>
                      <span className="text-xs font-bold text-[#888]">
                        Estimated read: {selectedLesson.readTime}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black">{selectedLesson.title}</h2>
                    <p className="text-sm font-bold text-[#666] mt-1">{selectedLesson.subtitle}</p>
                  </div>

                  {/* Note 2: Reading Material */}
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#1E1E1E] text-white px-3 py-1 inline-block border-2 border-[#1E1E1E] mb-4">
                      Note 1 ｜ 읽기 자료 (沉浸式精读)
                    </h3>
                    <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-4 font-medium leading-relaxed text-sm md:text-base space-y-3">
                      {selectedLesson.reading.map((para, idx) => (
                        <p key={idx} className="hover:bg-[#FFB100]/20 p-1 transition-colors rounded">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Note 3: Breakdown */}
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#2EC4B6] text-[#1E1E1E] px-3 py-1 inline-block border-2 border-[#1E1E1E] mb-4">
                      Note 2 ｜ 뉘앙스 해부 (深层语感拆解)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLesson.breakdown.map((item, idx) => (
                        <div key={idx} className="bg-white border-2 border-[#1E1E1E] p-4 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                          <h4 className="font-black text-base text-[#FF6B35] flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4 text-[#1E1E1E]" /> {item.term}
                          </h4>
                          <div className="text-xs font-bold text-[#888] mt-0.5">直译：{item.literal}</div>
                          <p className="text-xs font-medium text-[#555] mt-2 border-t border-dashed border-[#DDD] pt-2 leading-relaxed">
                            {item.nuance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note 4: Today's MZ Expressions */}
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#FFB100] text-[#1E1E1E] px-3 py-1 inline-block border-2 border-[#1E1E1E] mb-4">
                      Note 3 ｜ 오늘 MZ 표현 (今日 MZ 词汇)
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedLesson.mzExpressions.map((exp, idx) => (
                        <div key={idx} className="bg-white border-2 border-[#1E1E1E] px-3 py-2 flex items-center gap-2">
                          <span className="bg-[#1E1E1E] text-white text-xs font-black px-1.5 py-0.5">
                            {exp.term}
                          </span>
                          <span className="text-xs font-bold text-[#555]">
                            {exp.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note 5: Reading Shadowing */}
                  <div className="mb-8">
                    <h3 className="text-lg font-black bg-[#1E1E1E] text-white px-3 py-1 inline-block border-2 border-[#1E1E1E] mb-4">
                      Note 4 ｜ 섀도잉 훈련 (跟读发音与语气)
                    </h3>
                    <div className="space-y-3">
                      {selectedLesson.shadowing.map((sentence, idx) => (
                        <div key={idx} className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <p className="font-black text-sm md:text-base text-[#1E1E1E]">{sentence}</p>
                            <div className="text-xs text-[#888] mt-1">
                              建议反复读 30 次 · 已完成: <span className="font-black text-[#FF6B35]">{shadowingProgress[sentence] || 0}</span> / 30
                            </div>
                          </div>
                          <button
                            onClick={() => startRecording(sentence)}
                            className={`px-4 py-2 text-xs font-black border-2 border-[#1E1E1E] transition-all flex items-center gap-1.5 ${
                              isRecording === sentence
                                ? "bg-[#FF6B35] text-white animate-pulse"
                                : "bg-white hover:bg-[#FFB100]"
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            {isRecording === sentence ? "녹음 중 (录音中)..." : "녹음 시작 (开始跟读)"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note 6: Interactive Chat Simulator */}
                  <div className="border-t-4 border-[#1E1E1E] pt-6">
                    <h3 className="text-lg font-black bg-[#FF6B35] text-white px-3 py-1 inline-block border-2 border-[#1E1E1E] mb-4">
                      Note 5 ｜ 한국인식 답변 훈련 (韩式情绪共鸣测试)
                    </h3>
                    
                    <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-4 rounded-none">
                      <div className="text-xs font-bold text-[#888] mb-2 uppercase tracking-wider">상황 (情景对话)</div>
                      
                      {/* Friend's Message Bubble */}
                      <div className="flex items-start gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#FFB100] border-2 border-[#1E1E1E] flex items-center justify-center font-black text-sm">
                          친구
                        </div>
                        <div className="bg-white border-2 border-[#1E1E1E] p-3 max-w-[80%] relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <p className="font-black text-sm md:text-base">{selectedLesson.chatSimulator.friendMessage}</p>
                          <div className="text-[10px] text-[#888] mt-1">오후 2:30</div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <div className="text-xs font-black text-[#1E1E1E] mb-2">어떻게 답장하시겠습니까? (你将如何回复？)</div>
                        
                        {/* Wrong Responses */}
                        {selectedLesson.chatSimulator.wrongResponses.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setChatAnswer({ type: "wrong", index: idx })}
                            className={`w-full text-left p-3 border-2 border-[#1E1E1E] transition-all text-xs md:text-sm font-bold flex justify-between items-center ${
                              chatAnswer?.type === "wrong" && chatAnswer.index === idx
                                ? "bg-[#FFD1D1] border-[#FF6B35]"
                                : "bg-white hover:bg-[#FAF9F5]"
                            }`}
                          >
                            <span>{option.text}</span>
                            <span className="text-[10px] font-black text-[#FF6B35] uppercase">教科书式 ❌</span>
                          </button>
                        ))}

                        {/* Native Response */}
                        <button
                          onClick={() => setChatAnswer({ type: "correct" })}
                          className={`w-full text-left p-3 border-2 border-[#1E1E1E] transition-all text-xs md:text-sm font-black flex justify-between items-center ${
                            chatAnswer?.type === "correct"
                              ? "bg-[#D1F7D1] border-[#2EC4B6]"
                              : "bg-white hover:bg-[#FAF9F5]"
                          }`}
                        >
                          <span className="whitespace-pre-line">{selectedLesson.chatSimulator.nativeResponse.text.split('\n')[0]}...</span>
                          <span className="text-[10px] font-black text-[#2EC4B6] uppercase">网感满分 ✅</span>
                        </button>
                      </div>

                      {/* Feedback Pane */}
                      {chatAnswer && (
                        <div className={`mt-6 p-4 border-2 border-[#1E1E1E] ${
                          chatAnswer.type === "correct" ? "bg-[#D1F7D1]" : "bg-[#FFD1D1]"
                        }`}>
                          <h4 className="font-black text-sm mb-1 flex items-center gap-1.5">
                            {chatAnswer.type === "correct" ? (
                              <><CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" /> 완벽한 답변입니다! (完美共鸣！)</>
                            ) : (
                              <><HelpCircle className="w-4 h-4 text-[#FF6B35]" /> 살짝 아쉬운 답변... (有点像外国人哦)</>
                            )}
                          </h4>
                          
                          {chatAnswer.type === "correct" ? (
                            <div>
                              <div className="bg-white border border-[#1E1E1E] p-3 font-black text-sm my-2 whitespace-pre-line">
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
              )}

            </div>
          )}

          {/* TAB 2: TONE SHIFTER */}
          {activeTab === "tone" && (
            <div className="bg-white border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b-4 border-[#1E1E1E] pb-4 mb-6">
                <h2 className="text-2xl font-black">다채로운 톤 체인저 (多平台语气转换)</h2>
                <p className="text-xs font-bold text-[#666] mt-1">
                  输入最平淡的韩语，一键转换成 KakaoTalk、Instagram、YouTube 等社交平台最地道的网感表达。
                </p>
              </div>

              {/* Input Pane */}
              <div className="mb-6">
                <label className="block text-xs font-black text-[#1E1E1E] uppercase tracking-wider mb-2">
                  1. 표준어 입력 (输入标准韩语)
                </label>
                <textarea
                  value={toneInput}
                  onChange={(e) => setToneInput(e.target.value)}
                  className="w-full h-24 p-3 border-2 border-[#1E1E1E] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  placeholder="예: 오늘 기분이 정말 좋습니다."
                />
              </div>

              {/* Tone Buttons Selector */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {(["kakao", "insta", "youtube"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTone(t)}
                    className={`p-3 font-black text-xs md:text-sm border-2 border-[#1E1E1E] transition-all ${
                      selectedTone === t
                        ? "bg-[#FF6B35] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-[#FAF9F5]"
                    }`}
                  >
                    {t === "kakao" && "💬 KakaoTalk"}
                    {t === "insta" && "📸 Instagram"}
                    {t === "youtube" && "📺 YouTube"}
                  </button>
                ))}
              </div>

              {/* Output Pane */}
              <div className="bg-[#FAF9F5] border-2 border-[#1E1E1E] p-4">
                <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-2 mb-4">
                  <div>
                    <h4 className="font-black text-sm text-[#FF6B35]">
                      {toneOutputs[selectedTone].title}
                    </h4>
                    <p className="text-[10px] font-bold text-[#888] mt-0.5">
                      {toneOutputs[selectedTone].desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(toneOutputs[selectedTone].text)}
                    className="p-1.5 bg-white border border-[#1E1E1E] hover:bg-[#FFB100] transition-colors"
                    title="복사하기 (复制)"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-white border-2 border-[#1E1E1E] p-4 font-black text-base md:text-lg text-[#1E1E1E] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {toneOutputs[selectedTone].text}
                </div>

                {/* Slang breakdown */}
                <div className="mt-4">
                  <div className="text-[10px] font-black text-[#888] uppercase tracking-wider mb-2">핵심 슬랭 (核心网感词汇)</div>
                  <div className="flex flex-wrap gap-2">
                    {toneOutputs[selectedTone].slang.map((s, idx) => (
                      <span key={idx} className="bg-white border border-[#1E1E1E] text-xs font-bold px-2 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FOREIGNER ERASER */}
          {activeTab === "eraser" && (
            <div className="bg-white border-4 border-[#1E1E1E] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b-4 border-[#1E1E1E] pb-4 mb-6">
                <h2 className="text-2xl font-black">외국인 티 박멸 (外国人味纠正仪)</h2>
                <p className="text-xs font-bold text-[#666] mt-1">
                  点击你经常在教科书里见到的死板韩语，一秒揭秘韩国年轻人天天挂在嘴边的野生原民表达。
                </p>
              </div>

              <div className="space-y-4">
                {eraserItems.map((item) => {
                  const isSelected = selectedEraserId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEraserId(isSelected ? null : item.id)}
                      className={`border-4 border-[#1E1E1E] p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#2EC4B6] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
                          : "bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                        <div>
                          <div className="flex gap-1 mb-1">
                            {item.tags.map((tag) => (
                              <span key={tag} className="bg-[#1E1E1E] text-white text-[9px] font-black px-1.5 py-0.5">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs font-bold text-[#888]">
                            ❌ 教科书式死板表达:
                          </div>
                          <h4 className="text-sm md:text-base font-black text-[#FF6B35] mt-0.5 line-through decoration-2">
                            {item.textbook}
                          </h4>
                        </div>
                        <div className="text-xs font-black text-[#1E1E1E] flex items-center gap-1 bg-white border border-[#1E1E1E] px-2 py-1 self-start md:self-auto">
                          {isSelected ? "상세 보기 접기 ▲" : "원어민 표현 보기 ▼"}
                        </div>
                      </div>

                      {/* Expanded Panel */}
                      {isSelected && (
                        <div className="mt-4 border-t-2 border-dashed border-[#1E1E1E] pt-4 bg-white p-3 border-2 border-[#1E1E1E] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="text-xs font-bold text-[#2EC4B6]">
                            ✅ 韩国野生原民表达:
                          </div>
                          <div className="text-lg md:text-xl font-black text-[#1E1E1E] mt-1 flex items-center gap-2">
                            <Smile className="w-5 h-5 text-[#FFB100] fill-current" /> {item.native}
                          </div>
                          <p className="text-xs text-[#555] font-medium mt-3 leading-relaxed border-l-4 border-[#2EC4B6] pl-2">
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
    </div>
  );
}

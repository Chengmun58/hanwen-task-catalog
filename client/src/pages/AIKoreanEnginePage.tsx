import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Copy,
  Heart,
  Loader2,
  MessageSquare,
  Mic,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";

type Feature =
  | "reply-generator"
  | "tone-converter"
  | "mz-expression"
  | "shadowing-trainer"
  | "grammar-corrector"
  | "situational-reply"
  | "platform-mimic";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

type Preset = {
  id: string;
  label: string;
  labelKr: string;
  feature: Feature;
  tone: string;
  platform: string;
  situation: string;
  starter: string;
};

type LocalMemory = {
  messages: ChatMessage[];
  favorites: ChatMessage[];
  feature: Feature;
  tone: string;
  platform: string;
  situation: string;
};

const STORAGE_KEY = "hanwen-ai-korean-memory-v1";
const MAX_LOCAL_MESSAGES = 80;
const MAX_FAVORITES = 60;

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  meta: "AI Korean Native Engine",
  content: "输入中文、英文或韩文，我会生成韩国人更自然会说的版本，并解释语气、语法、MZ 表达和 shadowing。",
};

const features: { id: Feature; label: string; sub: string; icon: typeof MessageSquare }[] = [
  { id: "reply-generator", label: "Reply", sub: "自然韩文回复", icon: MessageSquare },
  { id: "tone-converter", label: "Tone", sub: "韩国人语气", icon: Wand2 },
  { id: "mz-expression", label: "MZ", sub: "网感表达", icon: Sparkles },
  { id: "shadowing-trainer", label: "Shadowing", sub: "跟读训练", icon: Mic },
  { id: "grammar-corrector", label: "Grammar", sub: "语法修正", icon: CheckCircle2 },
  { id: "situational-reply", label: "Situation", sub: "场景回复", icon: PenLine },
  { id: "platform-mimic", label: "Platform", sub: "IG / YouTube", icon: Bot },
];

const presets: Preset[] = [
  { id: "kakao-girl", label: "韩国女生聊天", labelKr: "여자친구 톤", feature: "reply-generator", tone: "soft feminine KakaoTalk, natural but not childish", platform: "KakaoTalk", situation: "daily chat with Korean friend", starter: "我想用韩国女生自然聊天语气回复：" },
  { id: "cool-dry", label: "冷淡自然风", labelKr: "무심한 톤", feature: "tone-converter", tone: "cool and dry Korean tone, concise, not rude", platform: "Daily conversation", situation: "casual friend chat", starter: "帮我改成韩国人冷淡但自然的语气：" },
  { id: "dating", label: "暧昧恋爱回复", labelKr: "썸 톤", feature: "situational-reply", tone: "romantic but not cheesy, Korean dating chat", platform: "Dating chat", situation: "flirting / talking stage", starter: "我想回复暧昧对象：" },
  { id: "insta", label: "Instagram 留言", labelKr: "인스타 댓글", feature: "platform-mimic", tone: "friendly Instagram comment, short and natural", platform: "Instagram", situation: "Instagram comment or caption", starter: "帮我写成韩国 Instagram 风格：" },
  { id: "youtube", label: "YouTube 评论", labelKr: "유튜브 댓글", feature: "platform-mimic", tone: "funny YouTube comment, witty but not overdone", platform: "YouTube comments", situation: "Korean YouTube comment", starter: "帮我写韩国 YouTube 评论：" },
  { id: "grammar", label: "韩文纠错", labelKr: "교정", feature: "grammar-corrector", tone: "polite but clear Korean correction coach", platform: "Daily conversation", situation: "grammar and naturalness correction", starter: "帮我修正这句韩文，让它更自然：" },
  { id: "shadowing", label: "跟读训练", labelKr: "쉐도잉", feature: "shadowing-trainer", tone: "native Korean speaking practice", platform: "Daily conversation", situation: "shadowing and pronunciation practice", starter: "帮我生成 5 句跟读练习，主题是：" },
];

const quickExamples = [
  "昨天喝酒了，今天好累，想喝解酒汤",
  "我还想再睡一下，时间过得太快了",
  "日常生活太烦了，用韩国朋友聊天语气怎么说？",
  "난 오히려 시간이넘빨어",
  "想回复对方：你是不是身体管理得很好？",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadMemory(): Partial<LocalMemory> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<LocalMemory>;
  } catch {
    return null;
  }
}

function saveMemory(memory: LocalMemory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // localStorage can fail in private mode or when storage is full.
  }
}

export default function AIKoreanEnginePage() {
  const stored = typeof window !== "undefined" ? loadMemory() : null;
  const [feature, setFeature] = useState<Feature>((stored?.feature as Feature) || "reply-generator");
  const [input, setInput] = useState("昨天喝酒了，今天好累，想喝解酒汤");
  const [tone, setTone] = useState(stored?.tone || "natural Korean MZ but not cringe");
  const [platform, setPlatform] = useState(stored?.platform || "KakaoTalk");
  const [situation, setSituation] = useState(stored?.situation || "daily chat with Korean friend");
  const [messages, setMessages] = useState<ChatMessage[]>(stored?.messages?.length ? stored.messages : [welcomeMessage]);
  const [favorites, setFavorites] = useState<ChatMessage[]>(stored?.favorites || []);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"modes" | "favorites">("modes");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeFeature = useMemo(() => features.find((item) => item.id === feature) ?? features[0], [feature]);
  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  useEffect(() => {
    saveMemory({
      messages: messages.slice(-MAX_LOCAL_MESSAGES),
      favorites: favorites.slice(0, MAX_FAVORITES),
      feature,
      tone,
      platform,
      situation,
    });
  }, [messages, favorites, feature, tone, platform, situation]);

  function applyPreset(preset: Preset) {
    setFeature(preset.feature);
    setTone(preset.tone);
    setPlatform(preset.platform);
    setSituation(preset.situation);
    setInput(preset.starter);
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
  }

  function appendAssistantWithTypewriter(meta: string, fullText: string) {
    const id = makeId();
    setMessages((prev) => [...prev, { id, role: "assistant", meta, content: "" }]);

    let index = 0;
    const chunkSize = Math.max(4, Math.ceil(fullText.length / 180));
    const timer = window.setInterval(() => {
      index = Math.min(index + chunkSize, fullText.length);
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content: fullText.slice(0, index) } : msg)));
      if (index >= fullText.length) {
        window.clearInterval(timer);
      }
    }, 16);
  }

  async function generate(customInput?: string) {
    const prompt = (customInput ?? input).trim();
    if (!prompt || loading) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      meta: `${activeFeature.label} · ${platform}`,
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/korean-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, input: prompt, tone, platform, situation }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "AI generation failed.");
      }
      appendAssistantWithTypewriter(data.mode ? `mode: ${data.mode}` : "openai", data.output || "No output returned.");
    } catch (err) {
      appendAssistantWithTypewriter("error", `Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  async function copyMessage(message: ChatMessage) {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 1400);
  }

  function toggleFavorite(message: ChatMessage) {
    if (message.role !== "assistant" || !message.content.trim()) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === message.id);
      if (exists) return prev.filter((item) => item.id !== message.id);
      return [{ ...message, meta: message.meta || "favorite" }, ...prev].slice(0, MAX_FAVORITES);
    });
  }

  function newChat() {
    setMessages([welcomeMessage]);
    setInput("");
  }

  function clearMemory() {
    setMessages([welcomeMessage]);
    setFavorites([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#111]">
      <header className="sticky top-0 z-30 border-b border-[#E8E5DF] bg-[#0F0F0F]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-black text-white/60">
              <Bot className="h-3.5 w-3.5 text-[#C9A84C]" />
              Private Korean AI OS
            </div>
            <h1 className="text-xl font-black leading-tight md:text-2xl">AI 한국어 네이티브 답장 생성기</h1>
            <p className="mt-1 text-xs font-bold text-white/45">本机自动保存 · 收藏常用回复 · 私人韩语沉浸系统</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/korean-genz" className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
              GenZ Library
            </a>
            <button onClick={newChat} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
              <RefreshCw className="h-3.5 w-3.5" />
              New Chat
            </button>
            <button onClick={clearMemory} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:grid-cols-[320px_1fr] md:px-6">
        <aside className="space-y-4 md:sticky md:top-28 md:self-start">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#E8E5DF] bg-white p-1">
            <button onClick={() => setActivePanel("modes")} className={`rounded-xl px-3 py-2 text-xs font-black ${activePanel === "modes" ? "bg-[#0F0F0F] text-white" : "text-neutral-500"}`}>Modes</button>
            <button onClick={() => setActivePanel("favorites")} className={`rounded-xl px-3 py-2 text-xs font-black ${activePanel === "favorites" ? "bg-[#0F0F0F] text-white" : "text-neutral-500"}`}>Favorites {favorites.length}</button>
          </div>

          {activePanel === "modes" ? (
            <>
              <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-4 shadow-[4px_4px_0_#1C1A17]">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400">
                  <Zap className="h-3.5 w-3.5" />
                  Quick Modes
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button key={preset.id} onClick={() => applyPreset(preset)} className={`rounded-2xl border p-3 text-left transition hover:border-[#E8432D] hover:bg-[#FFF7F4] ${feature === preset.feature && platform === preset.platform ? "border-[#E8432D] bg-[#FFF7F4]" : "border-[#E8E5DF] bg-[#FDFCF9]"}`}>
                      <div className="text-xs font-black">{preset.label}</div>
                      <div className="mt-1 text-[10px] font-bold text-neutral-400">{preset.labelKr}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">Features</div>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === feature;
                    return (
                      <button key={item.id} onClick={() => setFeature(item.id)} className={`rounded-2xl border p-3 text-left transition ${active ? "border-[#E8432D] bg-[#FFF7F4]" : "border-[#E8E5DF] bg-[#FDFCF9] hover:border-[#E8432D]/40"}`}>
                        <Icon className={`mb-2 h-4 w-4 ${active ? "text-[#E8432D]" : "text-neutral-400"}`} />
                        <div className="text-xs font-black">{item.label}</div>
                        <div className="mt-0.5 text-[10px] font-bold text-neutral-500">{item.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">Context</div>
                <div className="space-y-3">
                  <label className="block space-y-1"><span className="text-[11px] font-black text-neutral-500">Tone</span><input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2 text-xs font-bold outline-none focus:border-[#E8432D]" /></label>
                  <label className="block space-y-1"><span className="text-[11px] font-black text-neutral-500">Platform</span><input value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2 text-xs font-bold outline-none focus:border-[#E8432D]" /></label>
                  <label className="block space-y-1"><span className="text-[11px] font-black text-neutral-500">Situation</span><input value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2 text-xs font-bold outline-none focus:border-[#E8432D]" /></label>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-4 shadow-[4px_4px_0_#1C1A17]">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400">
                <Heart className="h-3.5 w-3.5" />
                Favorite Replies
              </div>
              <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                {favorites.length === 0 ? (
                  <div className="rounded-2xl bg-[#F5F2EB] p-4 text-xs font-bold leading-6 text-neutral-500">收藏的韩文回复会出现在这里。</div>
                ) : favorites.map((item) => (
                  <button key={item.id} onClick={() => setInput(item.content)} className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FDFCF9] p-3 text-left text-xs font-bold leading-5 text-neutral-600 hover:border-[#E8432D]">
                    {item.content.slice(0, 180)}{item.content.length > 180 ? "..." : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="flex min-h-[72vh] flex-col rounded-3xl border-2 border-[#1C1A17] bg-white shadow-[6px_6px_0_#1C1A17]">
          <div className="border-b border-[#E8E5DF] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div><div className="text-xs font-black uppercase tracking-widest text-[#E8432D]">Current Mode</div><h2 className="mt-1 text-lg font-black">{activeFeature.label} · {platform}</h2></div>
              <div className="rounded-2xl bg-[#F5F2EB] px-3 py-2 text-xs font-black text-neutral-500">{situation}</div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] rounded-3xl p-4 md:max-w-[78%] ${message.role === "user" ? "bg-[#E8432D] text-white" : "border border-[#E8E5DF] bg-[#FDFCF9] text-[#111]"}`}>
                  {message.meta && <div className={`mb-2 text-[10px] font-black uppercase tracking-widest ${message.role === "user" ? "text-white/55" : "text-neutral-400"}`}>{message.meta}</div>}
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm font-bold leading-7">{message.content}</pre>
                  {message.role === "assistant" && message.content && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => copyMessage(message)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F0F0F] px-3 py-1.5 text-[11px] font-black text-white hover:bg-[#242424]"><Copy className="h-3 w-3" />{copiedId === message.id ? "Copied" : "Copy"}</button>
                      <button onClick={() => toggleFavorite(message)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black ${favoriteIds.has(message.id) ? "bg-[#E8432D] text-white" : "bg-[#F5F2EB] text-neutral-600 hover:bg-[#EFE9DD]"}`}><Heart className="h-3 w-3" />{favoriteIds.has(message.id) ? "Saved" : "Save"}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && <div className="flex justify-start"><div className="inline-flex items-center gap-3 rounded-3xl border border-[#E8E5DF] bg-[#FDFCF9] p-4 text-sm font-bold text-neutral-500"><Loader2 className="h-4 w-4 animate-spin text-[#E8432D]" />Generating native Korean response...</div></div>}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#E8E5DF] bg-[#FFFDF9] p-4">
            <div className="mb-3 flex flex-wrap gap-2">{quickExamples.map((example) => <button key={example} onClick={() => setInput(example)} className="rounded-full border border-[#E8E5DF] bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-500 hover:border-[#E8432D] hover:text-[#E8432D]">{example}</button>)}</div>
            <div className="flex items-end gap-3">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generate(); } }} rows={3} maxLength={1200} placeholder="输入你想表达的中文/英文/韩文...  Ctrl/⌘ + Enter 发送" className="min-h-[84px] flex-1 resize-y rounded-2xl border-2 border-[#1C1A17] bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-[#E8432D]" />
              <button onClick={() => generate()} disabled={loading || !input.trim()} className="inline-flex h-[56px] items-center gap-2 rounded-2xl bg-[#E8432D] px-5 text-sm font-black text-white transition hover:bg-[#cf3523] disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden md:inline">Send</span></button>
            </div>
            <div className="mt-2 text-right text-[10px] font-bold text-neutral-400">{input.length}/1200 · Saved locally on this device</div>
          </div>
        </section>
      </main>
    </div>
  );
}

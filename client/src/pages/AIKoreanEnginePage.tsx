import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Mic,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

type Feature =
  | "reply-generator"
  | "tone-converter"
  | "mz-expression"
  | "shadowing-trainer"
  | "grammar-corrector"
  | "situational-reply"
  | "platform-mimic";

const features: { id: Feature; label: string; sub: string; icon: typeof MessageSquare }[] = [
  { id: "reply-generator", label: "Korean Reply Generator", sub: "中文/英文 → 自然韩文回复", icon: MessageSquare },
  { id: "tone-converter", label: "Native Tone Converter", sub: "死板韩语 → 韩国人语气", icon: Wand2 },
  { id: "mz-expression", label: "MZ Expression Engine", sub: "加入韩国 MZ 网感表达", icon: Sparkles },
  { id: "shadowing-trainer", label: "Shadowing Trainer", sub: "生成跟读句子与语气训练", icon: Mic },
  { id: "grammar-corrector", label: "Grammar Corrector", sub: "韩文语法 + 自然度修正", icon: CheckCircle2 },
  { id: "situational-reply", label: "Situational Reply", sub: "按场景生成回复", icon: PenLine },
  { id: "platform-mimic", label: "Platform Style Mimic", sub: "KakaoTalk / IG / YouTube / Theqoo", icon: Bot },
];

const toneOptions = [
  "natural Korean MZ but not cringe",
  "soft feminine KakaoTalk",
  "cool and dry Korean tone",
  "friendly Instagram comment",
  "funny YouTube comment",
  "Theqoo community style",
  "romantic but not cheesy",
  "polite but not textbook",
];

const platformOptions = ["KakaoTalk", "Instagram", "YouTube comments", "Theqoo / community", "Daily conversation", "Dating chat", "Friend chat"];

function ExampleButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-[#E8E5DF] bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 transition hover:border-[#E8432D] hover:text-[#E8432D]"
    >
      {text}
    </button>
  );
}

export default function AIKoreanEnginePage() {
  const [feature, setFeature] = useState<Feature>("reply-generator");
  const [input, setInput] = useState("我想回复：昨天喝酒了，今天好累，想喝解酒汤");
  const [tone, setTone] = useState(toneOptions[0]);
  const [platform, setPlatform] = useState(platformOptions[0]);
  const [situation, setSituation] = useState("daily chat with Korean friend");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeFeature = useMemo(() => features.find((item) => item.id === feature) ?? features[0], [feature]);

  async function generate() {
    if (!input.trim()) {
      setError("Please enter text first.");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    setMode(null);

    try {
      const response = await fetch("/api/korean-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, input, tone, platform, situation }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "AI generation failed.");
      }
      setOutput(data.output || "No output returned.");
      setMode(data.mode || "unknown");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#111]">
      <header className="border-b border-[#E8E5DF] bg-[#0F0F0F] text-white">
        <div className="mx-auto max-w-7xl px-5 py-8 md:py-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
            <Bot className="h-3.5 w-3.5 text-[#C9A84C]" />
            OpenAI Korean Native Engine
          </div>
          <h1 className="max-w-4xl text-3xl font-black leading-tight md:text-5xl">
            AI 한국어 네이티브 답장 생성기
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
            输入中文、英文或韩文，自动生成韩国人自然会说的回复，并拆解语气、语法、MZ 表达、平台风格和 shadowing 训练。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/korean-genz" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-black text-white/80">
              Korean GenZ Library
            </a>
            <a href="/" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-black text-white/80">
              Home
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[360px_1fr] md:py-10">
        <aside className="space-y-4">
          <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-4 shadow-[5px_5px_0_#1C1A17]">
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">Features</div>
            <div className="space-y-2">
              {features.map((item) => {
                const Icon = item.icon;
                const active = item.id === feature;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFeature(item.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      active ? "border-[#E8432D] bg-[#FFF7F4]" : "border-[#E8E5DF] bg-[#FDFCF9] hover:border-[#E8432D]/40"
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-[#E8432D]" : "text-neutral-400"}`} />
                    <div>
                      <div className="text-xs font-black">{item.label}</div>
                      <div className="mt-0.5 text-[11px] font-bold leading-5 text-neutral-500">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">Quick Examples</div>
            <div className="flex flex-wrap gap-2">
              <ExampleButton text="昨天喝酒今天很累" onClick={() => setInput("昨天喝酒了，今天好累，想回对方：喝个解酒汤会不会好一点？")}/>
              <ExampleButton text="想睡多一点" onClick={() => setInput("我想表达：我还想再睡一下，时间过得太快了")}/>
              <ExampleButton text="日常生活太烦" onClick={() => setInput("日常生活太烦了，用韩国朋友聊天的语气怎么说？")}/>
              <ExampleButton text="帮我修韩文" onClick={() => setInput("난 오히려 시간이넘빨어")}/>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-5 shadow-[6px_6px_0_#1C1A17]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-[#E8432D]">Current Mode</div>
                <h2 className="mt-1 text-xl font-black">{activeFeature.label}</h2>
              </div>
              <div className="hidden rounded-2xl bg-[#F5F2EB] px-3 py-2 text-xs font-black text-neutral-500 md:block">
                {platform}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1.5 md:col-span-1">
                <span className="text-xs font-black text-neutral-500">Tone</span>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2.5 text-xs font-bold outline-none focus:border-[#E8432D]">
                  {toneOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-1">
                <span className="text-xs font-black text-neutral-500">Platform</span>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2.5 text-xs font-bold outline-none focus:border-[#E8432D]">
                  {platformOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-1">
                <span className="text-xs font-black text-neutral-500">Situation</span>
                <input value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FDFCF9] px-3 py-2.5 text-xs font-bold outline-none focus:border-[#E8432D]" />
              </label>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-black text-neutral-500">Input</span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={7}
                placeholder="输入你想表达的中文/英文/韩文..."
                className="w-full resize-y rounded-2xl border-2 border-[#1C1A17] bg-[#FFFDF9] p-4 text-sm font-bold leading-7 outline-none transition focus:border-[#E8432D]"
              />
            </label>

            {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</div>}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E8432D] px-5 py-3 text-sm font-black text-white transition hover:bg-[#cf3523] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Generate Native Korean
              </button>
              <button
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E8E5DF] bg-white px-5 py-3 text-sm font-black text-neutral-600 transition hover:border-[#E8432D] hover:text-[#E8432D]"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-[#1C1A17] bg-[#0F0F0F] p-5 text-white shadow-[6px_6px_0_#1C1A17]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-[#C9A84C]">AI Output</div>
                <h2 className="mt-1 text-xl font-black">Native Korean Result</h2>
              </div>
              {mode && <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/60">{mode}</span>}
            </div>

            {!output && !loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm font-bold leading-7 text-white/45">
                点击 Generate 后，这里会显示韩文回复、平台风格版本、语法修正、MZ 表达和 shadowing 训练。
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm font-bold text-white/60">
                <Loader2 className="h-4 w-4 animate-spin text-[#C9A84C]" />
                Generating Korean native response...
              </div>
            )}

            {output && (
              <>
                <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm font-medium leading-7 text-white/85">
                  {output}
                </pre>
                <button
                  onClick={copyOutput}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#0F0F0F] transition hover:bg-[#F5F2EB]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy Result"}
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

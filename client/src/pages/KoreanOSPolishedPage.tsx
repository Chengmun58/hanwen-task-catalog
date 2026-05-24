import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type View = "today" | "feed" | "routine" | "vault" | "ai";
type Mode = "chat" | "correct" | "tone";
type Routine = { id: string; tag: string; ko: string; cn: string; time: string; done: boolean; streak: number; color: string };
type FeedItem = { id: string; tag: string; ko: string; cn: string; note: string };
type Persona = { id: string; label: string; desc: string; prompt: string };
type Msg = { id: string; role: "user" | "assistant"; content: string; meta?: string };

const C = { ink: "#0F0E0C", cream: "#FDFCF9", sand: "#F0EBE1", gold: "#C9A84C", red: "#E8432D", blue: "#2563EB", border: "#E7DED0", muted: "#8A8480" };

const ROUTINES_DEFAULT: Routine[] = [
  { id: "r1", tag: "문장", ko: "오늘의 한 문장", cn: "今日韩文一句", time: "08:00", done: false, streak: 4, color: C.red },
  { id: "r2", tag: "복습", ko: "저장 문장 복습", cn: "复习收藏句子", time: "13:00", done: false, streak: 2, color: C.gold },
  { id: "r3", tag: "쉐도잉", ko: "쉐도잉 10분", cn: "跟读 10 分钟", time: "18:00", done: false, streak: 0, color: C.blue },
  { id: "r4", tag: "스토리", ko: "밤 10시 이야기", cn: "10PM 韩语故事", time: "22:00", done: false, streak: 2, color: "#7C3AED" },
];

const FEED_DEFAULT: FeedItem[] = [
  { id: "f1", tag: "오늘의 문장", ko: "오늘 하루도 생각보다 잘 버텼다.", cn: "今天这一天也比想象中撑得不错。", note: "혼잣말처럼 자연스럽게" },
  { id: "f2", tag: "엠지 표현", ko: "기 빨림", cn: "精气被吸干；社交电量耗尽。", note: "친한 사이에서 쓰기 좋은 표현" },
  { id: "f3", tag: "카톡 톤", ko: "너 오늘 좀 조용하네. 무슨 일 있어?", cn: "你今天有点安静。发生什么事了吗？", note: "부드럽게 걱정하는 말투" },
  { id: "f4", tag: "쉐도잉", ko: "나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", cn: "我现在完全没电了。休息一下再联系你。", note: "짧게 끊어 읽기" },
  { id: "f5", tag: "밤 이야기", ko: "달빛 아래 작은 고양이는 익숙한 골목에서 낯선 문 하나를 발견했다.", cn: "月光下的小猫在熟悉的小巷发现了一扇陌生的门。", note: "밤 10시 몰입용" },
  { id: "f6", tag: "엠지 표현", ko: "현타 왔어", cn: "现实感打击来了；幻灭感来袭。", note: "멘탈이 꺼질 때 쓰는 표현" },
  { id: "f7", tag: "분위기", ko: "분좋카 가고 싶다... 혹시 연남동에 새로 생긴 분좋카 알아?", cn: "好想去氛围超赞的咖啡馆。你知道延南洞新开的那家吗？", note: "분좋카 = 분위기 좋은 카페" },
  { id: "f8", tag: "문화", ko: "요즘 성수동은 진짜 팝업스토어 공화국임ㅋㅋ 주말에 가면 대기 줄만 2시간 기본이라 기절각인데...", cn: "最近圣水洞简直是快闪店共和国。周末去基本排队两小时起，要昏厥了。", note: "기절각 = 快晕倒的局面" },
];

const PERSONAS: Persona[] = [
  { id: "p1", label: "한국 친구", desc: "편하게 받아주는 일상 말투", prompt: "친한 한국 친구처럼 자연스럽고 편안하게 대화해줘." },
  { id: "p2", label: "무심한 MZ", desc: "짧고 쿨하지만 무례하지 않게", prompt: "MZ세대처럼 짧고 쿨하게, 무심하지만 무례하지 않게 대답해줘." },
  { id: "p3", label: "가까운 사이", desc: "조금 다정하고 자연스럽게", prompt: "가까운 친구처럼 다정하고 솔직하게 대화해줘." },
  { id: "p4", label: "인스타 댓글", desc: "짧고 감성 있게", prompt: "인스타그램 댓글처럼 짧고 감성적으로 반응해줘." },
];

const TABS: { id: View; ko: string; en: string; icon: string }[] = [
  { id: "today", ko: "오늘", en: "Today", icon: "◎" },
  { id: "feed", ko: "피드", en: "Feed", icon: "◈" },
  { id: "routine", ko: "루틴", en: "Routine", icon: "◷" },
  { id: "vault", ko: "보관함", en: "Vault", icon: "◫" },
  { id: "ai", ko: "AI", en: "AI", icon: "◬" },
];

function makeId(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function useStorage<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; }
  });
  const save = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (old: T) => T)(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(resolved)); } catch {}
      return resolved;
    });
  }, [key]);
  return [value, save];
}

function speak(text: string, rate = 0.88) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) || null;
  window.speechSynthesis.speak(utterance);
}

const Ico = {
  play: () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M3 2.5 13 8 3 13.5V2.5Z" /></svg>,
  copy: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5"><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M2 11V3a1 1 0 0 1 1-1h8" /></svg>,
  save: () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M8 1 9.85 5.3 15 6.2l-3.5 3.3.83 4.8L8 12 3.67 14.3l.83-4.8L1 6.2l5.15-.9L8 1Z" /></svg>,
  trash: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5"><path d="M2 4h12M6 4V2h4v2M5 4l1 9h4l1-9" /></svg>,
  check: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m2 8 4 4 8-8" /></svg>,
  refresh: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5"><path d="M14 8A6 6 0 1 1 2 8" /><path d="M14 4v4h-4" /></svg>,
  send: () => <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="m1 2 14 6-14 6v-4l9-2-9-2V2Z" /></svg>,
  spin: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 animate-spin"><circle cx="8" cy="8" r="6" strokeOpacity=".3" /><path d="M8 2a6 6 0 0 1 6 6" /></svg>,
};

function LangCard({ item, onSave, saved }: { item: FeedItem; onSave?: (item: FeedItem) => void; saved?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard?.writeText(item.ko); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }
  return (
    <article className="group rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111] hover:shadow-[4px_4px_0_#111]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#0F0E0C] px-3 py-1 text-[10px] font-black tracking-widest text-white">{item.tag}</span>
        <div className="flex gap-1.5">
          <button onClick={() => speak(item.ko)} className="inline-flex items-center gap-1 rounded-full border border-[#E7DED0] bg-white px-2.5 py-1 text-[10px] font-bold transition-colors hover:border-[#E8432D] hover:text-[#E8432D]"><Ico.play />듣기</button>
          <button onClick={copy} className="inline-flex items-center gap-1 rounded-full border border-[#E7DED0] bg-white px-2.5 py-1 text-[10px] font-bold transition-colors hover:border-[#0F0E0C]">{copied ? <Ico.check /> : <Ico.copy />}</button>
          {onSave && <button onClick={() => onSave(item)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${saved ? "border-[#C9A84C] bg-[#FFF9EC] text-[#C9A84C]" : "border-[#E7DED0] bg-white hover:border-[#C9A84C] hover:text-[#C9A84C]"}`}><Ico.save /></button>}
        </div>
      </div>
      <p className="mb-1 text-xl font-black leading-snug text-[#0F0E0C]" style={{ fontFamily: "'Noto Serif KR', serif" }}>{item.ko}</p>
      <p className="mb-3 text-sm text-[#8A8480]">{item.cn}</p>
      {item.note && <p className="rounded-xl bg-[#F5F0E8] px-3 py-2 text-xs leading-relaxed text-[#5A5550]">{item.note}</p>}
    </article>
  );
}

function TodayTab({ feed, routines, onToggleRoutine }: { feed: FeedItem[]; routines: Routine[]; onToggleRoutine: (index: number) => void }) {
  const done = routines.filter((routine) => routine.done).length;
  const pct = Math.round((done / Math.max(1, routines.length)) * 100);
  const featured = feed[0];
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "야행성이네" : hour < 12 ? "좋은 아침" : hour < 17 ? "오후도 화이팅" : hour < 21 ? "저녁이야" : "밤도 한국어";
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-[#0F0E0C] p-7 text-white">
        <div className="mb-2 text-xs font-black tracking-[0.2em] text-white/50">{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}</div>
        <h2 className="mb-1 text-3xl font-black leading-tight">{greeting}</h2>
        <p className="text-sm text-white/60">오늘 루틴 {done}/{routines.length} 완료</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        <div className="mt-2 text-right text-xs font-bold text-white/40">{pct}%</div>
      </div>
      {featured && <div className="rounded-[28px] border-2 border-[#E8432D] bg-[#FFF5F3] p-6"><div className="mb-3 text-[10px] font-black tracking-widest text-[#E8432D]">오늘의 한 문장</div><p className="mb-2 text-2xl font-black leading-snug text-[#0F0E0C]" style={{ fontFamily: "'Noto Serif KR', serif" }}>{featured.ko}</p><p className="mb-4 text-sm text-[#8A8480]">{featured.cn}</p><button onClick={() => speak(featured.ko)} className="inline-flex items-center gap-2 rounded-full bg-[#E8432D] px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#cf3523]"><Ico.play />발음 듣기</button></div>}
      <div><h3 className="mb-3 text-xs font-black tracking-widest text-[#8A8480]">오늘의 루틴</h3><div className="space-y-2">{routines.map((routine, index) => <button key={routine.id} onClick={() => onToggleRoutine(index)} className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all ${routine.done ? "border-[#E7DED0] bg-[#F5F0E8] opacity-70" : "border-[#E7DED0] bg-white hover:border-[#0F0E0C]"}`}><div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${routine.done ? "border-[#0F0E0C] bg-[#0F0E0C] text-white" : "border-[#E7DED0]"}`}>{routine.done && <Ico.check />}</div><div className="min-w-0 flex-1"><span className="text-sm font-bold text-[#0F0E0C]">{routine.ko}</span><span className="ml-2 text-xs text-[#8A8480]">{routine.cn}</span></div><div className="flex flex-shrink-0 items-center gap-2">{routine.streak > 0 && <span className="text-[10px] font-black text-[#C9A84C]">🔥{routine.streak}</span>}<span className="text-xs text-[#8A8480]">{routine.time}</span></div></button>)}</div></div>
    </div>
  );
}

function FeedTab({ items, onRefresh, onSave, savedKeys }: { items: FeedItem[]; onRefresh: () => void; onSave: (item: FeedItem) => void; savedKeys: Set<string> }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("전체");
  const tags = ["전체", "오늘의 문장", "엠지 표현", "카톡 톤", "쉐도잉", "분위기", "문화", "밤 이야기"];
  const filtered = useMemo(() => items.filter((item) => (!query || `${item.ko} ${item.cn} ${item.note}`.toLowerCase().includes(query.toLowerCase())) && (tag === "전체" || item.tag === tag)), [items, query, tag]);
  return <div className="space-y-4"><div className="relative"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색..." className="w-full rounded-2xl border border-[#E7DED0] bg-white px-4 py-3 text-sm outline-none focus:border-[#0F0E0C]" />{query && <button onClick={() => setQuery("")} className="absolute right-4 top-3 text-lg text-[#8A8480]">×</button>}</div><div className="flex gap-2 overflow-x-auto pb-1">{tags.map((item) => <button key={item} onClick={() => setTag(item)} className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${tag === item ? "bg-[#0F0E0C] text-white" : "border border-[#E7DED0] bg-white text-[#8A8480] hover:border-[#0F0E0C]"}`}>{item}</button>)}</div><button onClick={onRefresh} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E7DED0] py-2.5 text-xs font-bold text-[#8A8480] transition-colors hover:border-[#0F0E0C] hover:text-[#0F0E0C]"><Ico.refresh />새로운 문장 불러오기</button><div className="grid gap-3">{filtered.map((item) => <LangCard key={item.id} item={item} onSave={onSave} saved={savedKeys.has(item.id)} />)}{filtered.length === 0 && <p className="py-12 text-center text-sm text-[#8A8480]">검색 결과 없음</p>}</div></div>;
}

function RoutineTab({ routines, onChange }: { routines: Routine[]; onChange: (items: Routine[]) => void }) {
  const done = routines.filter((item) => item.done).length;
  const pct = Math.round((done / Math.max(1, routines.length)) * 100);
  const totalStreak = routines.reduce((sum, item) => sum + item.streak, 0);
  function toggle(index: number) { onChange(routines.map((item, idx) => idx !== index ? item : { ...item, done: !item.done, streak: item.done ? Math.max(0, item.streak - 1) : item.streak + 1 })); }
  return <div className="space-y-5"><div className="grid grid-cols-3 gap-3">{[{ label: "완료", val: `${done}/${routines.length}`, color: C.red }, { label: "달성률", val: `${pct}%`, color: C.gold }, { label: "총 연속", val: `${totalStreak}일`, color: "#7C3AED" }].map((stat) => <div key={stat.label} className="rounded-2xl border border-[#E7DED0] bg-white p-4 text-center"><div className="text-2xl font-black" style={{ color: stat.color }}>{stat.val}</div><div className="mt-0.5 text-[10px] font-bold text-[#8A8480]">{stat.label}</div></div>)}</div><div><div className="mb-1.5 flex justify-between text-xs font-bold text-[#8A8480]"><span>오늘의 진행도</span><span>{pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#F0EBE1]"><div className="h-full rounded-full bg-[#0F0E0C] transition-all duration-700" style={{ width: `${pct}%` }} /></div></div><div className="space-y-3">{routines.map((item, index) => <div key={item.id} className={`rounded-[24px] border p-5 transition-all ${item.done ? "border-[#E7DED0] bg-[#F5F0E8]" : "border-[#E7DED0] bg-white"}`}><div className="flex items-start gap-4"><button onClick={() => toggle(index)} className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${item.done ? "border-[#0F0E0C] bg-[#0F0E0C] text-white" : "border-[#E7DED0] hover:border-[#0F0E0C]"}`}>{item.done && <Ico.check />}</button><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="text-[10px] font-black tracking-wider" style={{ color: item.color }}>{item.tag}</span><span className="text-[10px] text-[#8A8480]">{item.time}</span></div><p className={`text-base font-black leading-snug ${item.done ? "text-[#8A8480] line-through" : "text-[#0F0E0C]"}`} style={{ fontFamily: "'Noto Serif KR', serif" }}>{item.ko}</p><p className="mt-0.5 text-xs text-[#8A8480]">{item.cn}</p></div><div className="flex-shrink-0 text-right"><div className="text-lg font-black" style={{ color: item.streak > 0 ? C.gold : "#E7DED0" }}>{item.streak > 0 ? `🔥${item.streak}` : "—"}</div><div className="text-[9px] text-[#8A8480]">연속</div></div></div></div>)}</div><button onClick={() => onChange(routines.map((item) => ({ ...item, done: false })))} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E7DED0] py-3 text-xs font-bold text-[#8A8480] transition-colors hover:border-[#E8432D] hover:text-[#E8432D]"><Ico.refresh />오늘 루틴 초기화</button></div>;
}

function VaultTab({ items, onRemove }: { items: FeedItem[]; onRemove: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => items.filter((item) => !query || `${item.ko} ${item.cn} ${item.tag}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  if (items.length === 0) return <div className="py-20 text-center"><div className="mb-4 text-5xl">□</div><p className="mb-1 font-black text-[#0F0E0C]">보관함이 비어 있어요</p><p className="text-sm text-[#8A8480]">피드에서 저장 버튼을 누르면 여기에 쌓여요.</p></div>;
  return <div className="space-y-4"><div className="relative"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="보관함 검색..." className="w-full rounded-2xl border border-[#E7DED0] bg-white px-4 py-3 text-sm outline-none focus:border-[#0F0E0C]" />{query && <button onClick={() => setQuery("")} className="absolute right-4 top-3 text-lg text-[#8A8480]">×</button>}</div><p className="text-xs font-bold text-[#8A8480]">총 {filtered.length}개</p><div className="grid gap-3">{filtered.map((item) => <div key={item.id} className="group rounded-[24px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="mb-3 flex items-start justify-between"><span className="rounded-full bg-[#0F0E0C] px-3 py-1 text-[10px] font-black tracking-widest text-white">{item.tag}</span><div className="flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"><button onClick={() => speak(item.ko)} className="text-[#8A8480] transition-colors hover:text-[#E8432D]"><Ico.play /></button><button onClick={() => onRemove(item.id)} className="text-[#8A8480] transition-colors hover:text-[#E8432D]"><Ico.trash /></button></div></div><p className="mb-1 text-lg font-black text-[#0F0E0C]" style={{ fontFamily: "'Noto Serif KR', serif" }}>{item.ko}</p><p className="text-sm text-[#8A8480]">{item.cn}</p>{item.note && <p className="mt-2 rounded-xl bg-[#F5F0E8] px-3 py-2 text-xs text-[#8A8480]">{item.note}</p>}</div>)}</div></div>;
}

function AITab({ persona, onPersonaChange }: { persona: Persona; onPersonaChange: (persona: Persona) => void }) {
  const [messages, setMessages] = useStorage<Msg[]>("ko-ai-msgs-v2", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { id: makeId("u"), role: "user", content: text, meta: mode };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const feature = mode === "correct" ? "grammar-corrector" : mode === "tone" ? "tone-converter" : "roleplay";
      const response = await fetch("/api/korean-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feature, input: text, tone: persona.prompt, platform: "KakaoTalk", situation: "private Korean immersion practice" }) });
      const data = await response.json();
      const output = data?.output || "지금 답변을 생성하지 못했어. 다시 한번 보내줘.";
      setMessages((prev) => [...prev, { id: makeId("a"), role: "assistant", content: output, meta: persona.label }]);
    } catch {
      setMessages((prev) => [...prev, { id: makeId("a"), role: "assistant", content: "미안, 지금 연결이 불안정해. 문장을 조금 짧게 다시 보내줘.", meta: "fallback" }]);
    } finally { setLoading(false); }
  }

  return <div className="flex min-h-[68vh] flex-col rounded-[28px] border border-[#E7DED0] bg-white"><div className="border-b border-[#E7DED0] p-4"><div className="mb-3 flex gap-2 overflow-x-auto">{PERSONAS.map((item) => <button key={item.id} onClick={() => onPersonaChange(item)} className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${persona.id === item.id ? "bg-[#0F0E0C] text-white" : "border border-[#E7DED0] text-[#8A8480]"}`}>{item.label}</button>)}</div><div className="grid grid-cols-3 gap-2">{([{ id: "chat", label: "대화" }, { id: "correct", label: "교정" }, { id: "tone", label: "말투" }] as { id: Mode; label: string }[]).map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === item.id ? "bg-[#E8432D] text-white" : "bg-[#F5F0E8] text-[#8A8480]"}`}>{item.label}</button>)}</div></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length === 0 && <div className="rounded-2xl bg-[#F5F0E8] p-4 text-sm font-bold leading-7 text-[#8A8480]">한국어로 말하고 싶은 문장, 고치고 싶은 문장, 바꾸고 싶은 말투를 보내면 돼.</div>}{messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl p-4 text-sm font-bold leading-7 ${message.role === "user" ? "bg-[#0F0E0C] text-white" : "bg-[#F5F0E8] text-[#0F0E0C]"}`}><div className="mb-1 text-[10px] font-black uppercase opacity-45">{message.meta || message.role}</div><pre className="whitespace-pre-wrap font-sans">{message.content}</pre>{message.role === "assistant" && <button onClick={() => speak(message.content)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#0F0E0C]"><Ico.play />듣기</button>}</div></div>)}{loading && <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F5F0E8] p-4 text-sm font-bold text-[#8A8480]"><Ico.spin />생성 중...</div>}<div ref={endRef} /></div><div className="border-t border-[#E7DED0] p-4"><div className="flex gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); send(); } }} placeholder="한국어 / 중국어 / 영어로 입력..." rows={2} className="min-h-[54px] flex-1 resize-none rounded-2xl border border-[#E7DED0] bg-[#FFFDF9] px-4 py-3 text-sm font-bold outline-none focus:border-[#0F0E0C]" /><button onClick={send} disabled={!input.trim() || loading} className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-[#E8432D] text-white disabled:opacity-40"><Ico.send /></button></div><p className="mt-2 text-right text-[10px] font-bold text-[#8A8480]">Ctrl / ⌘ + Enter</p></div></div>;
}

export default function KoreanOSPolishedPage() {
  const [view, setView] = useState<View>("today");
  const [feed, setFeed] = useStorage<FeedItem[]>("ko-feed-v2", FEED_DEFAULT);
  const [routines, setRoutines] = useStorage<Routine[]>("ko-routines-v2", ROUTINES_DEFAULT);
  const [vault, setVault] = useStorage<FeedItem[]>("ko-vault-v2", []);
  const [persona, setPersona] = useStorage<Persona>("ko-persona-v2", PERSONAS[0]);

  const done = routines.filter((item) => item.done).length;
  const totalStreak = routines.reduce((sum, item) => sum + item.streak, 0);
  const progress = Math.round((done / Math.max(1, routines.length)) * 100);
  const savedKeys = useMemo(() => new Set(vault.map((item) => item.id)), [vault]);

  function toggleRoutine(index: number) { setRoutines((prev) => prev.map((item, idx) => idx !== index ? item : { ...item, done: !item.done, streak: item.done ? Math.max(0, item.streak - 1) : item.streak + 1 })); }
  function refreshFeed() { setFeed([
    { id: makeId("f"), tag: "오늘의 문장", ko: "괜찮은 척했는데 사실은 좀 힘들었어.", cn: "我装作没事，但其实有点累。", note: "솔직하지만 부담스럽지 않은 말투" },
    { id: makeId("f"), tag: "엠지 표현", ko: "현타 왔어", cn: "现实感打击来了；幻灭感来袭。", note: "멘탈이 꺼질 때 쓰는 표현" },
    { id: makeId("f"), tag: "카톡 톤", ko: "오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", cn: "今天就算不说什么，陪着我就好了。", note: "가까운 사이의 부드러운 톤" },
    { id: makeId("f"), tag: "쉐도잉", ko: "생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", cn: "其实没想象中严重。我之前那么担心还有点好笑。", note: "두 문장 리듬 연습" },
  ]); }
  function saveToVault(item: FeedItem) { setVault((prev) => prev.some((saved) => saved.id === item.id) ? prev : [{ ...item }, ...prev]); }
  function removeFromVault(id: string) { setVault((prev) => prev.filter((item) => item.id !== id)); }

  return <div className="min-h-screen bg-[#FDFCF9] text-[#0F0E0C]"><div className="mx-auto flex min-h-screen max-w-[1440px] flex-col md:flex-row"><aside className="bg-[#0F0E0C] p-4 text-white md:sticky md:top-0 md:h-screen md:w-[300px] md:p-6"><div className="mb-6 flex items-start justify-between"><div><div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Private Korean OS</div><h1 className="text-3xl font-black leading-[0.95] tracking-[-0.06em]">한국어<br />몰입 루틴</h1><p className="mt-3 text-xs font-bold leading-5 text-white/45">문장, 말투, 리듬을 매일 쌓는 개인 훈련소.</p></div><div className="rounded-2xl bg-[#E8432D] px-3 py-2 text-center text-xs font-black">DAY<br /><span className="text-lg">{Math.min(90, totalStreak + 1)}</span></div></div><div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.05] p-4"><div className="mb-2 flex items-center justify-between text-xs font-black text-white/45"><span>오늘 진행률</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${progress}%` }} /></div><div className="mt-3 text-xs font-bold text-white/40">완료 {done} / 전체 {routines.length}</div></div><nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:block md:space-y-2 md:overflow-visible md:pb-0">{TABS.map((tab) => <button key={tab.id} onClick={() => setView(tab.id)} className={`flex min-w-[126px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition md:w-full md:min-w-0 ${view === tab.id ? "bg-[#FDFCF9] text-[#0F0E0C]" : "text-white/55 hover:bg-white/[0.07]"}`}><span className="text-lg">{tab.icon}</span><span><div className="text-sm font-black">{tab.ko}</div><div className="text-[10px] font-black opacity-45">{tab.en}</div></span></button>)}</nav><div className="mt-6 hidden space-y-2 md:block"><a href="/ai-korean" className="block rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/60 hover:bg-white/[0.06]">AI 답장 생성기</a><a href="/korean-genz" className="block rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/60 hover:bg-white/[0.06]">MZ 표현 사전</a></div></aside><main className="flex-1 p-4 md:p-8"><header className="mb-6 rounded-[32px] border-2 border-[#0F0E0C] bg-[#FFFDF9] p-6 shadow-[6px_6px_0_#0F0E0C]"><div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E8432D]">Korean Immersion Console</div><h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">오늘도<br />한국어 모드.</h2><p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-[#8A8480]">번역보다 중요한 건 감각. 카톡 말끝, 거리감, 리듬, 표현을 매일 조금씩 조정한다.</p></header><div className="mx-auto max-w-4xl">{view === "today" && <TodayTab feed={feed} routines={routines} onToggleRoutine={toggleRoutine} />}{view === "feed" && <FeedTab items={feed} onRefresh={refreshFeed} onSave={saveToVault} savedKeys={savedKeys} />}{view === "routine" && <RoutineTab routines={routines} onChange={setRoutines} />}{view === "vault" && <VaultTab items={vault} onRemove={removeFromVault} />}{view === "ai" && <AITab persona={persona} onPersonaChange={setPersona} />}</div></main></div></div>;
}

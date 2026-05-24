import { useEffect, useMemo, useRef, useState } from "react";

type View = "today" | "immersion" | "routine" | "vault" | "ai";
type Mode = "chat" | "correct" | "tone";
type Routine = { id: string; tag: string; ko: string; cn: string; time: string; done: boolean; streak: number };
type Item = { id: string; tag: string; ko: string; cn: string; note: string; mission?: string };
type Msg = { id: string; role: "user" | "assistant"; content: string; meta?: string };
type Persona = { id: string; label: string; prompt: string };

const ROUTINES: Routine[] = [
  { id: "r1", tag: "문장", ko: "오늘의 한 문장", cn: "今日韩文一句", time: "08:00", done: false, streak: 4 },
  { id: "r2", tag: "복습", ko: "저장 문장 복습", cn: "复习收藏句子", time: "13:00", done: false, streak: 2 },
  { id: "r3", tag: "쉐도잉", ko: "쉐도잉 10분", cn: "跟读 10 分钟", time: "18:00", done: false, streak: 0 },
  { id: "r4", tag: "스토리", ko: "밤 10시 이야기", cn: "10PM 韩语故事", time: "22:00", done: false, streak: 2 },
];

const FEED: Item[] = [
  { id: "f1", tag: "01 오늘의 문장", ko: "오늘 하루도 생각보다 잘 버텼다.", cn: "今天这一天也比想象中撑得不错。", note: "혼잣말처럼 자연스럽게", mission: "3번 듣고 1번 따라 말하기" },
  { id: "f2", tag: "02 엠지 표현", ko: "기 빨림", cn: "精气被吸干；社交电量耗尽。", note: "친한 사이에서 쓰기 좋은 표현", mission: "오늘 대화에 한 번 넣어보기" },
  { id: "f3", tag: "03 카톡 톤", ko: "너 오늘 좀 조용하네. 무슨 일 있어?", cn: "你今天有点安静。发生什么事了吗？", note: "부드럽게 걱정하는 말투", mission: "말끝의 부드러움 기억하기" },
  { id: "f4", tag: "04 쉐도잉", ko: "나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", cn: "我现在完全没电了。休息一下再联系你。", note: "짧게 끊어 읽기", mission: "두 문장으로 나눠서 따라 읽기" },
  { id: "f5", tag: "05 밤 이야기", ko: "달빛 아래 작은 고양이는 익숙한 골목에서 낯선 문 하나를 발견했다.", cn: "月光下的小猫在熟悉的小巷发现了一扇陌生的门。", note: "밤 10시 몰입용", mission: "잠들기 전 한 번 듣기" },
];

const ALT_FEED: Item[] = [
  { id: "n1", tag: "01 오늘의 문장", ko: "괜찮은 척했는데 사실은 좀 힘들었어.", cn: "我装作没事，但其实有点累。", note: "솔직하지만 부담스럽지 않은 말투", mission: "감정 단어 없이 피곤함 표현하기" },
  { id: "n2", tag: "02 엠지 표현", ko: "현타 왔어", cn: "现实感打击来了；幻灭感来袭。", note: "멘탈이 꺼질 때 쓰는 표현", mission: "상황 하나를 떠올려서 문장 만들기" },
  { id: "n3", tag: "03 카톡 톤", ko: "오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", cn: "今天就算不说什么，陪着我就好了。", note: "가까운 사이의 부드러운 톤", mission: "너무 오글거리지 않게 읽기" },
  { id: "n4", tag: "04 쉐도잉", ko: "생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", cn: "其实没想象中严重。我之前那么担心还有点好笑。", note: "두 문장 리듬 연습", mission: "속도를 0.8배로 따라 읽기" },
  { id: "n5", tag: "05 밤 이야기", ko: "작은 별은 바다 위에 비쳤고, 한 아이는 그 빛을 따라 집으로 돌아갔다.", cn: "小星星照在海上，孩子跟着那道光回家。", note: "밤 루틴용 짧은 이야기", mission: "이미지를 떠올리며 듣기" },
];

const PERSONAS: Persona[] = [
  { id: "p1", label: "한국 친구", prompt: "친한 한국 친구처럼 자연스럽고 편안하게 대화해줘." },
  { id: "p2", label: "무심한 MZ", prompt: "MZ세대처럼 짧고 쿨하게, 무심하지만 무례하지 않게 대답해줘." },
  { id: "p3", label: "가까운 사이", prompt: "가까운 사람처럼 다정하고 자연스럽게 대화해줘." },
  { id: "p4", label: "인스타 댓글", prompt: "인스타그램 댓글처럼 짧고 감성적으로 반응해줘." },
];

const TABS: { id: View; ko: string; en: string; icon: string }[] = [
  { id: "today", ko: "오늘", en: "Today", icon: "◎" },
  { id: "immersion", ko: "몰입 업데이트", en: "Daily Flow", icon: "◈" },
  { id: "routine", ko: "루틴", en: "Routine", icon: "◷" },
  { id: "vault", ko: "자료실", en: "Library", icon: "◫" },
  { id: "ai", ko: "AI", en: "AI", icon: "◬" },
];

function uid(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function useStore<T>(key: string, initial: T): [T, (next: T | ((old: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : initial; } catch { return initial; } });
  function save(next: T | ((old: T) => T)) { setValue((old) => { const v = typeof next === "function" ? (next as (old: T) => T)(old) : next; try { localStorage.setItem(key, JSON.stringify(v)); } catch {} return v; }); }
  return [value, save];
}
function speak(text: string) { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ko-KR"; u.rate = 0.88; u.voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko")) || null; window.speechSynthesis.speak(u); }

function MiniButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) { return <button onClick={onClick} className="rounded-full border border-[#E7DED0] bg-white px-3 py-1.5 text-[10px] font-black text-[#0F0E0C] hover:border-[#E8432D] hover:text-[#E8432D]">{children}</button>; }

function ImmersionCard({ item, index, onSave, saved }: { item: Item; index: number; onSave: (item: Item) => void; saved: boolean }) {
  return <article className="rounded-[30px] border-2 border-[#0F0E0C] bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#0F0E0C] md:p-6">
    <div className="mb-4 flex items-center justify-between gap-3"><span className="rounded-full bg-[#0F0E0C] px-3 py-1 text-[10px] font-black tracking-widest text-white">{item.tag}</span><span className="text-xs font-black text-[#C9A84C]">STEP {index + 1}</span></div>
    <p className="text-2xl font-black leading-snug text-[#0F0E0C]" style={{ fontFamily: "'Noto Serif KR', serif" }}>{item.ko}</p>
    <p className="mt-2 text-sm font-bold leading-7 text-[#8A8480]">{item.cn}</p>
    <div className="mt-4 rounded-2xl bg-[#F5F0E8] p-4"><div className="text-[10px] font-black tracking-widest text-[#E8432D]">오늘의 미션</div><p className="mt-1 text-xs font-bold text-[#5A5550]">{item.mission}</p></div>
    <div className="mt-4 flex flex-wrap gap-2"><MiniButton onClick={() => speak(item.ko)}>듣기</MiniButton><MiniButton onClick={() => navigator.clipboard?.writeText(item.ko)}>복사</MiniButton><MiniButton onClick={() => onSave(item)}>{saved ? "저장됨" : "자료실 저장"}</MiniButton></div>
  </article>;
}

function LibraryCard({ item, onRemove }: { item: Item; onRemove: (id: string) => void }) {
  return <article className="rounded-[22px] border border-[#E7DED0] bg-white p-4"><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-[#0F0E0C] px-3 py-1 text-[10px] font-black text-white">{item.tag.replace(/^\d+\s*/, "")}</span><button onClick={() => onRemove(item.id)} className="text-xs font-black text-[#8A8480] hover:text-[#E8432D]">삭제</button></div><p className="text-lg font-black leading-snug" style={{ fontFamily: "'Noto Serif KR', serif" }}>{item.ko}</p><p className="mt-1 text-sm text-[#8A8480]">{item.cn}</p><div className="mt-3 flex gap-2"><MiniButton onClick={() => speak(item.ko)}>듣기</MiniButton><MiniButton onClick={() => navigator.clipboard?.writeText(item.ko)}>복사</MiniButton></div></article>;
}

function Today({ feed, routines, setView, toggle }: { feed: Item[]; routines: Routine[]; setView: (v: View) => void; toggle: (i: number) => void }) {
  const done = routines.filter((r) => r.done).length;
  const pct = Math.round(done / Math.max(1, routines.length) * 100);
  return <div className="space-y-6"><section className="rounded-[32px] bg-[#0F0E0C] p-7 text-white"><div className="text-xs font-black tracking-[0.22em] text-white/40">{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}</div><h2 className="mt-2 text-3xl font-black">오늘도 한국어 모드.</h2><p className="mt-2 text-sm font-bold text-white/55">오늘 루틴 {done}/{routines.length} 완료</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${pct}%` }} /></div></section><section className="rounded-[28px] border-2 border-[#E8432D] bg-[#FFF5F3] p-6"><div className="text-[10px] font-black tracking-widest text-[#E8432D]">오늘의 몰입 시작점</div><p className="mt-3 text-2xl font-black leading-snug" style={{ fontFamily: "'Noto Serif KR', serif" }}>{feed[0]?.ko}</p><p className="mt-2 text-sm text-[#8A8480]">{feed[0]?.cn}</p><div className="mt-4 flex gap-2"><button onClick={() => speak(feed[0]?.ko || "")} className="rounded-full bg-[#E8432D] px-5 py-2.5 text-sm font-black text-white">발음 듣기</button><button onClick={() => setView("immersion")} className="rounded-full border border-[#E8432D] px-5 py-2.5 text-sm font-black text-[#E8432D]">몰입 업데이트 보기</button></div></section><section><div className="mb-3 text-xs font-black tracking-widest text-[#8A8480]">오늘의 루틴</div><div className="space-y-2">{routines.map((r, i) => <button key={r.id} onClick={() => toggle(i)} className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left ${r.done ? "bg-[#F5F0E8] opacity-70" : "bg-white hover:border-[#0F0E0C]"}`}><span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${r.done ? "border-[#0F0E0C] bg-[#0F0E0C] text-white" : "border-[#E7DED0]"}`}>{r.done ? "✓" : ""}</span><span className="flex-1 text-sm font-black">{r.ko}<span className="ml-2 text-xs font-bold text-[#8A8480]">{r.cn}</span></span><span className="text-xs text-[#8A8480]">{r.time}</span></button>)}</div></section></div>;
}

function Immersion({ feed, onRefresh, onSave, saved }: { feed: Item[]; onRefresh: () => void; onSave: (item: Item) => void; saved: Set<string> }) {
  return <div className="space-y-5"><section className="rounded-[32px] border-2 border-[#0F0E0C] bg-[#0F0E0C] p-6 text-white shadow-[6px_6px_0_#E8432D]"><div className="text-[10px] font-black tracking-[0.28em] text-[#C9A84C]">DAILY IMMERSION FLOW</div><h2 className="mt-3 text-3xl font-black leading-tight">몰입 업데이트</h2><p className="mt-2 text-sm font-bold leading-7 text-white/50">이건 자료실이 아니라 오늘 할 훈련 순서다. 위에서 아래로 듣고, 따라 말하고, 저장한다.</p><button onClick={onRefresh} className="mt-5 rounded-full bg-[#E8432D] px-5 py-2.5 text-xs font-black text-white">오늘 업데이트 새로고침</button></section><div className="grid gap-4">{feed.map((item, index) => <ImmersionCard key={item.id} item={item} index={index} onSave={onSave} saved={saved.has(item.id)} />)}</div></div>;
}

function RoutineTab({ routines, onChange }: { routines: Routine[]; onChange: (items: Routine[]) => void }) {
  const done = routines.filter((r) => r.done).length; const pct = Math.round(done / Math.max(1, routines.length) * 100);
  return <div className="space-y-5"><div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border bg-white p-4 text-center"><div className="text-2xl font-black text-[#E8432D]">{done}/{routines.length}</div><div className="text-[10px] font-bold text-[#8A8480]">완료</div></div><div className="rounded-2xl border bg-white p-4 text-center"><div className="text-2xl font-black text-[#C9A84C]">{pct}%</div><div className="text-[10px] font-bold text-[#8A8480]">달성률</div></div><div className="rounded-2xl border bg-white p-4 text-center"><div className="text-2xl font-black">{routines.reduce((s, r) => s + r.streak, 0)}일</div><div className="text-[10px] font-bold text-[#8A8480]">누적</div></div></div><div className="space-y-3">{routines.map((r, i) => <button key={r.id} onClick={() => onChange(routines.map((x, idx) => idx === i ? { ...x, done: !x.done, streak: x.done ? Math.max(0, x.streak - 1) : x.streak + 1 } : x))} className={`block w-full rounded-[24px] border p-5 text-left ${r.done ? "bg-[#F5F0E8]" : "bg-white"}`}><div className="flex items-center justify-between"><div><div className="text-[10px] font-black text-[#E8432D]">{r.tag} · {r.time}</div><p className={`mt-1 text-lg font-black ${r.done ? "text-[#8A8480] line-through" : ""}`}>{r.ko}</p><p className="text-xs text-[#8A8480]">{r.cn}</p></div><div className="text-sm font-black text-[#C9A84C]">🔥{r.streak}</div></div></button>)}</div></div>;
}

function Vault({ items, onRemove }: { items: Item[]; onRemove: (id: string) => void }) {
  const [query, setQuery] = useState(""); const [cat, setCat] = useState("전체"); const cats = ["전체", ...Array.from(new Set(items.map((i) => i.tag.replace(/^\d+\s*/, ""))))];
  const filtered = items.filter((i) => (!query || `${i.ko} ${i.cn} ${i.tag}`.toLowerCase().includes(query.toLowerCase())) && (cat === "전체" || i.tag.includes(cat)));
  if (items.length === 0) return <div className="rounded-[32px] border-2 border-dashed border-[#E7DED0] bg-white p-10 text-center"><div className="text-5xl">◫</div><h2 className="mt-4 text-2xl font-black">자료실은 아직 비어 있어요</h2><p className="mt-2 text-sm font-bold text-[#8A8480]">몰입 업데이트에서 저장한 표현만 여기에 남는다. 여기는 매일 바뀌는 feed가 아니라 장기 보관함이다.</p></div>;
  return <div className="space-y-4"><section className="rounded-[30px] bg-[#0F0E0C] p-6 text-white"><div className="text-[10px] font-black tracking-[0.28em] text-[#C9A84C]">PERMANENT LIBRARY</div><h2 className="mt-3 text-3xl font-black">자료실</h2><p className="mt-2 text-sm font-bold text-white/50">저장한 표현만 모이는 곳. 검색하고 다시 듣고 복습한다.</p><div className="mt-4 text-xs font-black text-white/45">총 {items.length}개 저장됨</div></section><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="자료실 검색..." className="w-full rounded-2xl border border-[#E7DED0] bg-white px-4 py-3 text-sm outline-none focus:border-[#0F0E0C]" /><div className="flex gap-2 overflow-x-auto">{cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-black ${cat === c ? "bg-[#0F0E0C] text-white" : "border border-[#E7DED0] bg-white text-[#8A8480]"}`}>{c}</button>)}</div><div className="grid gap-3">{filtered.map((item) => <LibraryCard key={item.id} item={item} onRemove={onRemove} />)}</div></div>;
}

function AI({ persona, setPersona }: { persona: Persona; setPersona: (p: Persona) => void }) {
  const [messages, setMessages] = useStore<Msg[]>("ko-ai-msgs-v3", []); const [input, setInput] = useState(""); const [mode, setMode] = useState<Mode>("chat"); const [loading, setLoading] = useState(false); const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  async function send() { const text = input.trim(); if (!text || loading) return; setInput(""); setMessages((old) => [...old, { id: uid("u"), role: "user", content: text, meta: mode }]); setLoading(true); try { const feature = mode === "correct" ? "grammar-corrector" : mode === "tone" ? "tone-converter" : "roleplay"; const res = await fetch("/api/korean-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feature, input: text, tone: persona.prompt, platform: "KakaoTalk", situation: "private Korean immersion" }) }); const data = await res.json(); setMessages((old) => [...old, { id: uid("a"), role: "assistant", content: data?.output || "다시 보내줘.", meta: persona.label }]); } catch { setMessages((old) => [...old, { id: uid("a"), role: "assistant", content: "연결이 불안정해. 다시 시도해줘.", meta: "error" }]); } finally { setLoading(false); } }
  return <div className="flex min-h-[68vh] flex-col rounded-[28px] border border-[#E7DED0] bg-white"><div className="border-b p-4"><div className="mb-3 flex gap-2 overflow-x-auto">{PERSONAS.map((p) => <button key={p.id} onClick={() => setPersona(p)} className={`rounded-full px-3 py-1.5 text-xs font-black ${persona.id === p.id ? "bg-[#0F0E0C] text-white" : "border text-[#8A8480]"}`}>{p.label}</button>)}</div><div className="grid grid-cols-3 gap-2">{([{ id: "chat", label: "대화" }, { id: "correct", label: "교정" }, { id: "tone", label: "말투" }] as { id: Mode; label: string }[]).map((m) => <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === m.id ? "bg-[#E8432D] text-white" : "bg-[#F5F0E8] text-[#8A8480]"}`}>{m.label}</button>)}</div></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length === 0 && <div className="rounded-2xl bg-[#F5F0E8] p-4 text-sm font-bold text-[#8A8480]">한국어로 말하고 싶은 문장, 고치고 싶은 문장, 바꾸고 싶은 말투를 보내면 돼.</div>}{messages.map((m) => <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl p-4 text-sm font-bold leading-7 ${m.role === "user" ? "bg-[#0F0E0C] text-white" : "bg-[#F5F0E8]"}`}><div className="mb-1 text-[10px] font-black uppercase opacity-45">{m.meta}</div><pre className="whitespace-pre-wrap font-sans">{m.content}</pre>{m.role === "assistant" && <button onClick={() => speak(m.content)} className="mt-3 rounded-full bg-white px-3 py-1 text-[10px] font-black">듣기</button>}</div></div>)}{loading && <div className="rounded-2xl bg-[#F5F0E8] p-4 text-sm font-bold text-[#8A8480]">생성 중...</div>}<div ref={endRef} /></div><div className="border-t p-4"><div className="flex gap-2"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="한국어 / 중국어 / 영어로 입력..." rows={2} className="min-h-[54px] flex-1 resize-none rounded-2xl border bg-[#FFFDF9] px-4 py-3 text-sm outline-none focus:border-[#0F0E0C]" /><button onClick={send} disabled={!input.trim() || loading} className="h-[54px] rounded-2xl bg-[#E8432D] px-5 text-sm font-black text-white disabled:opacity-40">보내기</button></div></div></div>;
}

export default function KoreanOSPolishedPage() {
  const [view, setView] = useState<View>("today"); const [feed, setFeed] = useStore<Item[]>("ko-immersion-feed-v1", FEED); const [routines, setRoutines] = useStore<Routine[]>("ko-routines-v4", ROUTINES); const [vault, setVault] = useStore<Item[]>("ko-vault-v4", []); const [persona, setPersona] = useStore<Persona>("ko-persona-v4", PERSONAS[0]);
  const done = routines.filter((r) => r.done).length; const totalStreak = routines.reduce((s, r) => s + r.streak, 0); const progress = Math.round(done / Math.max(1, routines.length) * 100); const saved = useMemo(() => new Set(vault.map((v) => v.id)), [vault]);
  function toggleRoutine(i: number) { setRoutines((old) => old.map((r, idx) => idx === i ? { ...r, done: !r.done, streak: r.done ? Math.max(0, r.streak - 1) : r.streak + 1 } : r)); }
  function saveItem(item: Item) { setVault((old) => old.some((v) => v.id === item.id) ? old : [{ ...item }, ...old]); }
  function removeItem(id: string) { setVault((old) => old.filter((v) => v.id !== id)); }
  return <div className="min-h-screen bg-[#FDFCF9] text-[#0F0E0C]"><div className="mx-auto flex min-h-screen max-w-[1440px] flex-col md:flex-row"><aside className="bg-[#0F0E0C] p-4 text-white md:sticky md:top-0 md:h-screen md:w-[310px] md:p-6"><div className="mb-6 flex items-start justify-between"><div><div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Private Korean OS</div><h1 className="text-3xl font-black leading-[0.95] tracking-[-0.06em]">한국어<br />몰입 루틴</h1><p className="mt-3 text-xs font-bold leading-5 text-white/45">업데이트는 훈련, 자료실은 저장.</p></div><div className="rounded-2xl bg-[#E8432D] px-3 py-2 text-center text-xs font-black">DAY<br /><span className="text-lg">{Math.min(90, totalStreak + 1)}</span></div></div><div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.05] p-4"><div className="mb-2 flex justify-between text-xs font-black text-white/45"><span>오늘 진행률</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${progress}%` }} /></div><div className="mt-3 text-xs font-bold text-white/40">완료 {done} / 전체 {routines.length}</div></div><nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:block md:space-y-2 md:overflow-visible md:pb-0">{TABS.map((t) => <button key={t.id} onClick={() => setView(t.id)} className={`flex min-w-[150px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition md:w-full md:min-w-0 ${view === t.id ? "bg-[#FDFCF9] text-[#0F0E0C]" : "text-white/55 hover:bg-white/[0.07]"}`}><span className="text-lg">{t.icon}</span><span><div className="text-sm font-black">{t.ko}</div><div className="text-[10px] font-black opacity-45">{t.en}</div></span></button>)}</nav></aside><main className="flex-1 p-4 md:p-8"><header className="mb-6 rounded-[32px] border-2 border-[#0F0E0C] bg-[#FFFDF9] p-6 shadow-[6px_6px_0_#0F0E0C]"><div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E8432D]">Korean Immersion Console</div><h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">오늘도<br />한국어 모드.</h2><p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-[#8A8480]">몰입 업데이트는 오늘의 훈련 흐름이고, 자료실은 저장한 표현만 남기는 장기 보관함이다.</p></header><div className="mx-auto max-w-4xl">{view === "today" && <Today feed={feed} routines={routines} setView={setView} toggle={toggleRoutine} />}{view === "immersion" && <Immersion feed={feed} onRefresh={() => setFeed(feed[0]?.id === "f1" ? ALT_FEED : FEED)} onSave={saveItem} saved={saved} />}{view === "routine" && <RoutineTab routines={routines} onChange={setRoutines} />}{view === "vault" && <Vault items={vault} onRemove={removeItem} />}{view === "ai" && <AI persona={persona} setPersona={setPersona} />}</div></main></div></div>;
}

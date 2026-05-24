import { useMemo, useState } from "react";
import { Bell, BookOpen, CheckCircle2, Flame, Home, Moon, Play, RefreshCw, Search, Sparkles, UserRound, Volume2 } from "lucide-react";

type View = "today" | "feed" | "routine" | "vault" | "persona" | "story";
type Feed = { tag: string; ko: string; cn: string; note: string };
type Routine = { tag: string; ko: string; cn: string; time: string; done: boolean; streak: number };

const nav: { id: View; ko: string; en: string; icon: typeof Home }[] = [
  { id: "today", ko: "오늘", en: "Home", icon: Home },
  { id: "feed", ko: "피드", en: "Daily", icon: Sparkles },
  { id: "routine", ko: "루틴", en: "Routine", icon: CheckCircle2 },
  { id: "vault", ko: "보관함", en: "Vault", icon: BookOpen },
  { id: "persona", ko: "말투", en: "Persona", icon: UserRound },
  { id: "story", ko: "밤", en: "Story", icon: Moon },
];

const baseFeed: Feed[] = [
  { tag: "오늘의 문장", ko: "오늘 하루도 생각보다 잘 버텼다.", cn: "今天这一天也比想象中撑得不错。", note: "혼잣말처럼 자연스럽게" },
  { tag: "엠지 표현", ko: "기 빨림", cn: "精气被吸干；社交电量耗尽。", note: "친한 사이에서 쓰기 좋은 표현" },
  { tag: "카톡 톤", ko: "너 오늘 좀 조용하네. 무슨 일 있어?", cn: "你今天有点安静。发生什么事了吗？", note: "부드럽게 걱정하는 말투" },
  { tag: "쉐도잉", ko: "나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", cn: "我现在完全没电了。休息一下再联系你。", note: "짧게 끊어 읽기" },
  { tag: "밤 이야기", ko: "달빛 아래 작은 고양이는 익숙한 골목에서 낯선 문 하나를 발견했다.", cn: "月光下的小猫在熟悉的小巷发现了一扇陌生的门。", note: "밤 10시 몰입용" },
];

const baseRoutines: Routine[] = [
  { tag: "문장", ko: "오늘의 한 문장", cn: "今日韩文一句", time: "08:00", done: true, streak: 4 },
  { tag: "복습", ko: "저장 문장 복습", cn: "复习收藏句子", time: "13:00", done: false, streak: 2 },
  { tag: "쉐도잉", ko: "쉐도잉 10분", cn: "跟读 10 分钟", time: "18:00", done: false, streak: 0 },
  { tag: "스토리", ko: "밤 10시 이야기", cn: "10PM 韩语故事", time: "22:00", done: false, streak: 2 },
];

const vault = ["엠지", "일상", "인스타", "유튜브", "무심한 톤", "역할극", "쉐도잉", "스토리"];
const personas = [
  ["한국 친구", "편하게 받아주는 일상 말투"],
  ["무심한 MZ", "짧고 쿨하지만 무례하지 않게"],
  ["가까운 사이", "조금 다정하고 자연스럽게"],
  ["직장 동료", "예의 있지만 딱딱하지 않게"],
  ["인스타 댓글", "짧고 감성 있게"],
  ["커뮤니티 말투", "온라인에서 자연스럽게"],
];

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.9;
  u.voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko")) || null;
  window.speechSynthesis.speak(u);
}

export default function KoreanOSPolishedPage() {
  const [view, setView] = useState<View>("today");
  const [feed, setFeed] = useState(baseFeed);
  const [routines, setRoutines] = useState(baseRoutines);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(typeof Notification !== "undefined" ? Notification.permission : "off");

  const done = routines.filter((x) => x.done).length;
  const totalStreak = routines.reduce((sum, x) => sum + x.streak, 0);
  const progress = Math.round((done / routines.length) * 100);
  const shown = useMemo(() => feed.filter((x) => `${x.tag} ${x.ko} ${x.cn} ${x.note}`.toLowerCase().includes(query.toLowerCase())), [feed, query]);
  const mainLine = feed[0];

  async function enableNotice() {
    if (typeof Notification === "undefined") return setNotice("unsupported");
    const p = await Notification.requestPermission();
    setNotice(p);
    if (p === "granted") new Notification("한국어 루틴", { body: "오늘도 한국어 모드 켜기" });
  }

  function refresh() {
    setFeed([
      { tag: "오늘의 문장", ko: "괜찮은 척했는데 사실은 좀 힘들었어.", cn: "我装作没事，但其实有点累。", note: "솔직하지만 부담스럽지 않은 말투" },
      { tag: "엠지 표현", ko: "현타 왔어", cn: "现实感打击来了。", note: "멘탈이 꺼질 때 쓰는 표현" },
      { tag: "카톡 톤", ko: "오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", cn: "今天就算不说什么，陪着我就好了。", note: "가까운 사이의 부드러운 톤" },
      { tag: "쉐도잉", ko: "생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", cn: "其实没想象中严重。我之前那么担心还有点好笑。", note: "두 문장 리듬 연습" },
      { tag: "밤 이야기", ko: "작은 별은 바다 위에 비쳤고, 한 아이는 그 빛을 따라 집으로 돌아갔다.", cn: "小星星照在海上，孩子跟着那道光回家。", note: "밤 루틴용 짧은 이야기" },
    ]);
  }

  function toggleRoutine(index: number) {
    setRoutines((prev) => prev.map((item, i) => i === index ? { ...item, done: !item.done, streak: item.done ? item.streak : item.streak + 1 } : item));
  }

  function FeedCards({ compact = false }: { compact?: boolean }) {
    return (
      <div className={compact ? "grid gap-3" : "grid gap-3 xl:grid-cols-2"}>
        {shown.map((item) => (
          <article key={item.tag + item.ko} className="group rounded-[30px] border border-[#E7DED0] bg-[#FFFDF9] p-5 transition hover:-translate-y-0.5 hover:border-[#111] hover:shadow-[5px_5px_0_#111]">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-[#111] px-3 py-1 text-[10px] font-black tracking-widest text-white">{item.tag}</span>
              <button onClick={() => speak(item.ko)} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7DED0] bg-white px-3 py-1.5 text-[10px] font-black hover:border-[#E8432D] hover:text-[#E8432D]"><Volume2 className="h-3 w-3" />듣기</button>
            </div>
            <p className="text-[23px] font-black leading-9 tracking-[-0.03em]">{item.ko}</p>
            <p className="mt-3 text-sm font-bold leading-7 text-neutral-500">{item.cn}</p>
            <div className="mt-4 rounded-2xl bg-[#F4EEE4] px-4 py-3 text-xs font-black text-neutral-500">{item.note}</div>
          </article>
        ))}
      </div>
    );
  }

  function RoutineCards() {
    return (
      <div className="space-y-3">
        {routines.map((item, index) => (
          <button key={item.ko} onClick={() => toggleRoutine(index)} className={`block w-full rounded-[28px] border p-4 text-left transition ${item.done ? "border-[#7CB342] bg-[#F4FFE9]" : "border-[#E7DED0] bg-[#FFFDF9] hover:border-[#111]"}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#111] px-3 py-1 text-[10px] font-black text-white">{item.tag}</span><span className="text-xs font-black text-neutral-400">{item.time}</span></div>
                <h3 className="text-lg font-black tracking-[-0.02em]">{item.ko}</h3>
                <p className="mt-1 text-xs font-bold text-neutral-400">{item.cn}</p>
              </div>
              <div className="text-right"><div className="text-xs font-black text-[#E8432D]">{item.streak}일</div><div className={`mt-2 rounded-full px-3 py-1 text-[10px] font-black ${item.done ? "bg-[#111] text-white" : "bg-[#E8432D] text-white"}`}>{item.done ? "완료" : "하기"}</div></div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6EFE4] text-[#111]">
      <div className="mx-auto flex min-h-screen max-w-[1540px] flex-col lg:flex-row">
        <aside className="bg-[#0E0E0D] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[336px]">
          <div className="flex h-full flex-col p-4 lg:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Korean OS</div>
                <h1 className="text-3xl font-black leading-[0.92] tracking-[-0.07em] lg:text-4xl">한국어<br />몰입<br />훈련소</h1>
                <p className="mt-4 max-w-[220px] text-xs font-bold leading-5 text-white/42">매일 문장 하나, 말투 하나, 리듬 하나를 몸에 넣는다.</p>
              </div>
              <div className="rounded-3xl bg-[#E8432D] px-4 py-3 text-center text-xs font-black shadow-[0_0_30px_rgba(232,67,45,0.35)]">DAY<br /><span className="text-xl">{Math.min(90, totalStreak + 1)}</span></div>
            </div>

            <div className="mb-5 rounded-[30px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full text-lg font-black" style={{ background: `conic-gradient(#E8432D ${progress}%, rgba(255,255,255,.1) 0)` }}><div className="grid h-14 w-14 place-items-center rounded-full bg-[#0E0E0D]">{progress}%</div></div>
                <div><div className="text-sm font-black">오늘 진행률</div><div className="mt-1 text-xs font-bold text-white/42">완료 {done} / 전체 {routines.length}</div><div className="mt-2 flex items-center gap-1 text-xs font-black text-[#E8432D]"><Flame className="h-3.5 w-3.5" />{totalStreak} 누적</div></div>
              </div>
            </div>

            <nav className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:mx-0 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return <button key={item.id} onClick={() => setView(item.id)} className={`flex min-w-[142px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition lg:w-full lg:min-w-0 ${active ? "bg-[#F6EFE4] text-[#111]" : "text-white/55 hover:bg-white/[0.07] hover:text-white"}`}><Icon className={`h-4 w-4 ${active ? "text-[#E8432D]" : "text-white/35"}`} /><span><div className="text-sm font-black">{item.ko}</div><div className="text-[10px] font-black opacity-45">{item.en}</div></span></button>;
              })}
            </nav>

            <div className="mt-auto hidden space-y-2 pt-6 lg:block">
              <a href="/ai-korean" className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/65 hover:bg-white/[0.06]"><span>AI 답장 생성기</span><Play className="h-3.5 w-3.5" /></a>
              <a href="/korean-genz" className="block rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/65 hover:bg-white/[0.06]">MZ 표현 사전</a>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 md:px-6 lg:px-8 lg:py-8">
          <section className="mb-6 overflow-hidden rounded-[38px] border-2 border-[#111] bg-[#FFFDF9] shadow-[7px_7px_0_#111]">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
              <div className="p-6 lg:p-8"><div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8432D]">Private Korean Training Console</div><h2 className="mt-4 text-4xl font-black leading-[0.92] tracking-[-0.075em] md:text-6xl">오늘도<br />한국어 모드.</h2><p className="mt-5 max-w-xl text-sm font-bold leading-7 text-neutral-500">번역보다 중요한 건 감각. 말끝, 거리감, 리듬, 카톡 온도를 매일 조금씩 조정한다.</p></div>
              <div className="border-t border-[#E7DED0] bg-[#0E0E0D] p-6 text-white lg:border-l lg:border-t-0"><div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#C9A84C]">오늘의 입력</div><p className="mt-4 text-2xl font-black leading-10">{mainLine.ko}</p><p className="mt-4 text-sm font-bold leading-7 text-white/45">{mainLine.cn}</p><button onClick={() => speak(mainLine.ko)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#E8432D] px-4 py-2.5 text-xs font-black text-white"><Volume2 className="h-3.5 w-3.5" />듣기</button></div>
            </div>
          </section>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative flex-1 md:max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="문장, 표현, 말투 검색..." className="w-full rounded-2xl border border-[#E7DED0] bg-[#FFFDF9] py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-[#E8432D]" /></div><div className="flex flex-wrap gap-2"><button onClick={refresh} className="inline-flex items-center gap-2 rounded-2xl bg-[#111] px-4 py-3 text-xs font-black text-white"><RefreshCw className="h-3.5 w-3.5" />새 피드</button><button onClick={enableNotice} className="inline-flex items-center gap-2 rounded-2xl border border-[#111] bg-[#FFFDF9] px-4 py-3 text-xs font-black"><Bell className="h-3.5 w-3.5" />알림 {notice}</button></div></div>

          {view === "today" && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-[30px] border-2 border-[#111] bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#111]"><div className="text-xs font-black text-neutral-400">오늘 완료</div><div className="mt-2 text-4xl font-black">{done}/{routines.length}</div></div><div className="rounded-[30px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-xs font-black text-neutral-400">오늘 모드</div><div className="mt-2 text-3xl font-black">몰입</div></div><div className="rounded-[30px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-xs font-black text-neutral-400">누적</div><div className="mt-2 flex items-center gap-2 text-4xl font-black"><Flame className="h-7 w-7 text-[#E8432D]" />{totalStreak}</div></div></div><FeedCards /><RoutineCards /></div>}
          {view === "feed" && <FeedCards />}
          {view === "routine" && <RoutineCards />}
          {view === "vault" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{vault.map((x) => <div key={x} className="rounded-[30px] border border-[#E7DED0] bg-[#FFFDF9] p-5 transition hover:border-[#111]"><div className="text-2xl font-black">{x}</div><div className="mt-2 text-xs font-bold text-neutral-400">저장된 표현을 쌓는 곳</div></div>)}</div>}
          {view === "persona" && <div className="grid gap-3 md:grid-cols-2">{personas.map(([ko, desc]) => <div key={ko} className="rounded-[30px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-2xl font-black">{ko}</div><p className="mt-3 text-sm font-bold text-neutral-500">{desc}</p><a href="/ai-korean" className="mt-4 inline-flex rounded-2xl bg-[#111] px-4 py-2.5 text-xs font-black text-white">역할극 시작</a></div>)}</div>}
          {view === "story" && <div className="space-y-4">{feed.filter((x) => x.tag.includes("밤")).map((x) => <article key={x.ko} className="rounded-[38px] border-2 border-[#111] bg-[#0E0E0D] p-7 text-white shadow-[7px_7px_0_#E8432D]"><div className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A84C]">밤 이야기</div><p className="mt-5 text-3xl font-black leading-[1.35] tracking-[-0.04em]">{x.ko}</p><p className="mt-5 text-sm font-bold leading-7 text-white/45">{x.cn}</p><button onClick={() => speak(x.ko)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#E8432D] px-4 py-2.5 text-xs font-black text-white"><Volume2 className="h-3.5 w-3.5" />듣기</button></article>)}</div>}
        </main>
      </div>
    </div>
  );
}

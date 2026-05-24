import { useMemo, useState } from "react";
import { Bell, BookOpen, CheckCircle2, Clock, Flame, Home, Moon, RefreshCw, Search, Sparkles, UserRound, Volume2 } from "lucide-react";

type View = "today" | "feed" | "routine" | "vault" | "persona" | "story";

type Feed = { tag: string; ko: string; cn: string; note: string };
type Routine = { tag: string; ko: string; cn: string; time: string; done: boolean; streak: number };

const nav: { id: View; ko: string; en: string; icon: typeof Home }[] = [
  { id: "today", ko: "오늘", en: "Today", icon: Home },
  { id: "feed", ko: "데일리 피드", en: "Daily Feed", icon: Sparkles },
  { id: "routine", ko: "루틴", en: "Routine", icon: CheckCircle2 },
  { id: "vault", ko: "문장 보관함", en: "Vault", icon: BookOpen },
  { id: "persona", ko: "페르소나", en: "Persona", icon: UserRound },
  { id: "story", ko: "밤 이야기", en: "Story", icon: Moon },
];

const feedSeed: Feed[] = [
  { tag: "오늘의 문장", ko: "오늘 하루도 생각보다 잘 버텼다.", cn: "今天这一天也比想象中撑得不错。", note: "혼잣말처럼 자연스러운 일상 톤" },
  { tag: "엠지 표현", ko: "기 빨림", cn: "精气被吸干；社交电量耗尽。", note: "친한 사이에서 쓰기 좋은 표현" },
  { tag: "역할극", ko: "너 오늘 좀 조용하네. 무슨 일 있어?", cn: "你今天有点安静。发生什么事了吗？", note: "부드럽게 걱정하는 카톡 톤" },
  { tag: "쉐도잉", ko: "나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", cn: "我现在完全没电了。休息一下再联系你。", note: "짧게 끊어 읽기 좋은 문장" },
  { tag: "밤 이야기", ko: "달빛 아래 작은 고양이는 익숙한 골목에서 낯선 문 하나를 발견했다.", cn: "月光下的小猫在熟悉的小巷发现了一扇陌生的门。", note: "밤 10시 몰입용 짧은 이야기" },
];

const routinesSeed: Routine[] = [
  { tag: "문장", ko: "오늘의 한 문장", cn: "今日韩文一句", time: "08:00", done: true, streak: 3 },
  { tag: "복습", ko: "저장 문장 복습", cn: "复习收藏句子", time: "13:00", done: false, streak: 1 },
  { tag: "쉐도잉", ko: "쉐도잉 10분", cn: "跟读 10 分钟", time: "18:00", done: false, streak: 0 },
  { tag: "스토리", ko: "밤 10시 이야기", cn: "10PM 韩语故事", time: "22:00", done: false, streak: 2 },
  { tag: "역할극", ko: "자기 전 역할극", cn: "睡前角色对话", time: "23:00", done: false, streak: 1 },
];

const vault = ["엠지", "일상", "썸", "인스타", "유튜브", "무심한 톤", "여자 말투", "역할극", "쉐도잉", "스토리"];
const personas = ["한국 친구", "무심한 MZ", "가까운 사이", "직장 동료", "인스타 댓글", "커뮤니티 말투"];

function speakKorean(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 0.9;
  utter.voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko")) || null;
  window.speechSynthesis.speak(utter);
}

export default function KoreanOSPage() {
  const [view, setView] = useState<View>("today");
  const [feed, setFeed] = useState<Feed[]>(feedSeed);
  const [routines, setRoutines] = useState<Routine[]>(routinesSeed);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const doneCount = routines.filter((item) => item.done).length;
  const totalStreak = routines.reduce((sum, item) => sum + item.streak, 0);
  const progress = Math.round((doneCount / routines.length) * 100);
  const shownFeed = useMemo(() => {
    const q = query.toLowerCase();
    return feed.filter((item) => `${item.tag} ${item.ko} ${item.cn} ${item.note}`.toLowerCase().includes(q));
  }, [feed, query]);

  async function enableNotice() {
    if (typeof Notification === "undefined") return setNotice("unsupported");
    const permission = await Notification.requestPermission();
    setNotice(permission);
    if (permission === "granted") new Notification("한국어 루틴", { body: "오늘도 한국어 모드 켜기" });
  }

  function refreshFeed() {
    setFeed([
      { tag: "오늘의 문장", ko: "괜찮은 척했는데 사실은 좀 힘들었어.", cn: "我装作没事，但其实有点累。", note: "솔직하지만 부담스럽지 않은 말투" },
      { tag: "엠지 표현", ko: "현타 왔어", cn: "现实感打击来了。", note: "멘탈이 살짝 꺼질 때 쓰는 표현" },
      { tag: "역할극", ko: "오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", cn: "今天就算不说什么，陪着我就好了。", note: "가까운 사이의 부드러운 톤" },
      { tag: "쉐도잉", ko: "생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", cn: "其实没想象中严重。我之前那么担心还有点好笑。", note: "두 문장 리듬 연습" },
      { tag: "밤 이야기", ko: "작은 별은 바다 위에 비쳤고, 한 아이는 그 빛을 따라 집으로 돌아갔다.", cn: "小星星照在海上，孩子跟着那道光回家。", note: "밤 루틴용 짧은 이야기" },
    ]);
  }

  function toggleRoutine(index: number) {
    setRoutines((prev) => prev.map((item, i) => i === index ? { ...item, done: !item.done, streak: item.done ? item.streak : item.streak + 1 } : item));
  }

  const FeedCards = (
    <div className="grid gap-3 lg:grid-cols-2">
      {shownFeed.map((item) => (
        <article key={item.tag + item.ko} className="rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5 transition hover:border-[#111] hover:shadow-[4px_4px_0_#111]">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-[#111] px-3 py-1 text-[10px] font-black text-white">{item.tag}</span>
            <button onClick={() => speakKorean(item.ko)} className="inline-flex items-center gap-1 rounded-full border border-[#E7DED0] bg-white px-3 py-1.5 text-[10px] font-black hover:text-[#E8432D]"><Volume2 className="h-3 w-3" />듣기</button>
          </div>
          <p className="text-[22px] font-black leading-9 tracking-[-0.02em]">{item.ko}</p>
          <p className="mt-3 text-sm font-bold leading-7 text-neutral-500">{item.cn}</p>
          <div className="mt-4 rounded-2xl bg-[#F5EFE6] px-4 py-3 text-xs font-black text-neutral-500">{item.note}</div>
        </article>
      ))}
    </div>
  );

  const RoutineCards = (
    <div className="space-y-3">
      {routines.map((item, index) => (
        <div key={item.ko} className={`rounded-[28px] border p-4 ${item.done ? "border-[#7CB342] bg-[#F4FFE9]" : "border-[#E7DED0] bg-[#FFFDF9]"}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#111] px-3 py-1 text-[10px] font-black text-white">{item.tag}</span><span className="text-xs font-black text-neutral-400">{item.time}</span></div>
              <h3 className="text-lg font-black">{item.ko}</h3>
              <p className="mt-1 text-xs font-bold text-neutral-400">{item.cn}</p>
              <div className="mt-2 flex items-center gap-1 text-xs font-black text-[#E8432D]"><Flame className="h-3.5 w-3.5" />{item.streak}일</div>
            </div>
            <button onClick={() => toggleRoutine(index)} className={`rounded-2xl px-4 py-2.5 text-xs font-black ${item.done ? "bg-[#111] text-white" : "bg-[#E8432D] text-white"}`}>{item.done ? "완료됨" : "완료"}</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F3EA] text-[#111]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col lg:flex-row">
        <aside className="bg-[#0F0F0F] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[318px]">
          <div className="flex h-full flex-col p-4 lg:p-6">
            <div className="mb-5 flex justify-between gap-3">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45"><Clock className="h-3.5 w-3.5 text-[#C9A84C]" />Korean OS</div>
                <h1 className="text-2xl font-black leading-tight tracking-[-0.05em] lg:text-3xl">한국어<br />몰입 루틴</h1>
                <p className="mt-2 text-xs font-bold leading-5 text-white/45">매일 조금씩 한국어 감각을 쌓는 개인 공간.</p>
              </div>
              <div className="rounded-2xl bg-[#E8432D] px-3 py-2 text-center text-xs font-black">DAY<br />{Math.min(90, totalStreak + 1)}</div>
            </div>

            <div className="mb-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex justify-between text-[11px] font-black text-white/45"><span>오늘 진행률</span><span>{progress}%</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#E8432D]" style={{ width: `${progress}%` }} /></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/[0.05] p-2"><div className="text-lg font-black">{doneCount}</div><div className="text-[9px] font-black text-white/35">완료</div></div>
                <div className="rounded-2xl bg-white/[0.05] p-2"><div className="text-lg font-black text-[#E8432D]">{routines.length - doneCount}</div><div className="text-[9px] font-black text-white/35">남음</div></div>
                <div className="rounded-2xl bg-white/[0.05] p-2"><div className="text-lg font-black">{totalStreak}</div><div className="text-[9px] font-black text-white/35">누적</div></div>
              </div>
            </div>

            <nav className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:mx-0 lg:block lg:space-y-2">
              {nav.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setView(item.id)} className={`flex min-w-[140px] items-center gap-3 rounded-2xl px-4 py-3 text-left lg:w-full ${view === item.id ? "bg-[#FDFCF9] text-[#111]" : "text-white/55 hover:bg-white/[0.06]"}`}><Icon className={`h-4 w-4 ${view === item.id ? "text-[#E8432D]" : "text-white/35"}`} /><span><div className="text-sm font-black">{item.ko}</div><div className="text-[10px] font-black opacity-45">{item.en}</div></span></button>;
              })}
            </nav>

            <div className="mt-auto hidden space-y-2 pt-5 lg:block">
              <a href="/ai-korean" className="block rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/65">AI 답장 생성기</a>
              <a href="/korean-genz" className="block rounded-2xl border border-white/10 px-4 py-3 text-xs font-black text-white/65">MZ 표현 사전</a>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 md:px-6 lg:px-8 lg:py-8">
          <section className="mb-6 rounded-[34px] border-2 border-[#111] bg-[#FFFDF9] p-5 shadow-[6px_6px_0_#111]">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E8432D]">Private Korean Training Console</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] md:text-5xl">오늘도 한국어 모드.</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-neutral-500">번역보다 중요한 건 감각. 문장, 표현, 쉐도잉, 역할극, 밤 이야기까지 한 곳에서 돌린다.</p>
          </section>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="문장, 표현, 역할극 검색..." className="w-full rounded-2xl border border-[#E7DED0] bg-[#FFFDF9] py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-[#E8432D]" /></div>
            <div className="flex flex-wrap gap-2"><button onClick={refreshFeed} className="inline-flex items-center gap-2 rounded-2xl bg-[#111] px-4 py-3 text-xs font-black text-white"><RefreshCw className="h-3.5 w-3.5" />새 피드</button><button onClick={enableNotice} className="inline-flex items-center gap-2 rounded-2xl border border-[#111] bg-[#FFFDF9] px-4 py-3 text-xs font-black"><Bell className="h-3.5 w-3.5" />알림 {notice}</button></div>
          </div>

          {view === "today" && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-[28px] border-2 border-[#111] bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#111]"><div className="text-xs font-black text-neutral-400">오늘 완료</div><div className="mt-2 text-4xl font-black">{doneCount}/{routines.length}</div></div><div className="rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-xs font-black text-neutral-400">오늘 모드</div><div className="mt-2 text-3xl font-black">몰입</div></div><div className="rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-xs font-black text-neutral-400">누적</div><div className="mt-2 flex items-center gap-2 text-4xl font-black"><Flame className="h-7 w-7 text-[#E8432D]" />{totalStreak}</div></div></div>{FeedCards}{RoutineCards}</div>}
          {view === "feed" && FeedCards}
          {view === "routine" && RoutineCards}
          {view === "vault" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["엠지", "일상", "인스타", "유튜브", "무심한 톤", "역할극", "쉐도잉", "스토리"].map((x) => <div key={x} className="rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-2xl font-black">{x}</div><div className="mt-2 text-xs font-bold text-neutral-400">저장된 표현을 여기에 쌓기</div></div>)}</div>}
          {view === "persona" && <div className="grid gap-3 md:grid-cols-2">{["한국 친구", "무심한 MZ", "가까운 사이", "직장 동료", "인스타 댓글", "커뮤니티 말투"].map((x) => <div key={x} className="rounded-[28px] border border-[#E7DED0] bg-[#FFFDF9] p-5"><div className="text-2xl font-black">{x}</div><p className="mt-3 text-sm font-bold text-neutral-500">거리감과 말끝을 바꿔가며 자연스러운 대화를 연습.</p><a href="/ai-korean" className="mt-4 inline-flex rounded-2xl bg-[#111] px-4 py-2.5 text-xs font-black text-white">역할극 시작</a></div>)}</div>}
          {view === "story" && <div className="space-y-4">{feed.filter((x) => x.tag.includes("밤")).map((x) => <article key={x.ko} className="rounded-[34px] border-2 border-[#111] bg-[#0F0F0F] p-6 text-white shadow-[6px_6px_0_#E8432D]"><div className="text-xs font-black uppercase tracking-[0.24em] text-[#C9A84C]">밤 이야기</div><p className="mt-4 text-2xl font-black leading-10">{x.ko}</p><p className="mt-4 text-sm font-bold leading-7 text-white/50">{x.cn}</p><button onClick={() => speakKorean(x.ko)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#E8432D] px-4 py-2.5 text-xs font-black text-white"><Volume2 className="h-3.5 w-3.5" />듣기</button></article>)}</div>}
        </main>
      </div>
    </div>
  );
}

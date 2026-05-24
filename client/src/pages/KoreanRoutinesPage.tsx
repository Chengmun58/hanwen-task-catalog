import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpen, CheckCircle2, Clock, Flame, Heart, Mic, Plus, RefreshCw, Sparkles, Trash2, Volume2 } from "lucide-react";

type Routine = {
  id: string;
  title: string;
  category: "Shadowing" | "Roleplay" | "MZ" | "Favorites" | "Story" | "Custom";
  time: string;
  frequency: "Daily" | "Weekly" | "Custom";
  streak: number;
  lastDone?: string;
  enabled: boolean;
};

type FeedItem = {
  id: string;
  type: "Phrase" | "MZ" | "Roleplay" | "Shadowing" | "Story";
  title: string;
  korean: string;
  chinese: string;
};

const STORAGE_KEY = "hanwen-korean-routines-v1";

const defaultRoutines: Routine[] = [
  { id: "morning-phrase", title: "今日韩文一句", category: "MZ", time: "08:00", frequency: "Daily", streak: 0, enabled: true },
  { id: "favorite-review", title: "复习收藏回复", category: "Favorites", time: "13:00", frequency: "Daily", streak: 0, enabled: true },
  { id: "shadowing", title: "Shadowing 跟读", category: "Shadowing", time: "18:00", frequency: "Daily", streak: 0, enabled: true },
  { id: "night-story", title: "10PM 韩语寓言", category: "Story", time: "22:00", frequency: "Daily", streak: 0, enabled: true },
  { id: "roleplay", title: "睡前 Roleplay", category: "Roleplay", time: "23:00", frequency: "Daily", streak: 0, enabled: true },
];

const feedTemplates: FeedItem[] = [
  { id: "phrase", type: "Phrase", title: "今日句子", korean: "오늘 하루도 생각보다 잘 버텼다.", chinese: "今天这一天也比想象中撑得不错。" },
  { id: "mz", type: "MZ", title: "今日 MZ", korean: "기 빨림", chinese: "精气被吸干；很累、社交电量耗尽。" },
  { id: "roleplay", type: "Roleplay", title: "今日 Roleplay", korean: "너 오늘 좀 조용하네. 무슨 일 있어?", chinese: "你今天有点安静。发生什么事了吗？" },
  { id: "shadowing", type: "Shadowing", title: "今日跟读", korean: "나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", chinese: "我现在完全没电了。休息一下再联系你。" },
  { id: "story", type: "Story", title: "今晚短故事", korean: "달빛 아래 작은 고양이는 매일 같은 길을 걸었다. 그런데 어느 날, 익숙한 골목에서 낯선 문 하나를 발견했다.", chinese: "月光下的小猫每天走同一条路。某天，它在熟悉的小巷里发现了一扇陌生的门。" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRoutines;
    const parsed = JSON.parse(raw) as Routine[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultRoutines;
  } catch {
    return defaultRoutines;
  }
}

function minutesFromTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function speakKorean(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  utterance.voice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("ko")) || null;
  window.speechSynthesis.speak(utterance);
}

export default function KoreanRoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>(() => loadRoutines());
  const [feed, setFeed] = useState<FeedItem[]>(feedTemplates);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("21:30");
  const [notificationStatus, setNotificationStatus] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const today = todayKey();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }, [routines]);

  const summary = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const enabled = routines.filter((item) => item.enabled);
    const done = enabled.filter((item) => item.lastDone === today);
    const overdue = enabled.filter((item) => item.lastDone !== today && minutesFromTime(item.time) < nowMinutes);
    const next = enabled.filter((item) => item.lastDone !== today && minutesFromTime(item.time) >= nowMinutes).sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time))[0];
    return { enabled, done, overdue, next };
  }, [routines, today]);

  async function requestNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationStatus("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === "granted") {
      new Notification("Korean Routine enabled", { body: "提醒是本机浏览器通知；网站打开或安装成 PWA 时效果最好。" });
    }
  }

  function completeRoutine(id: string) {
    setRoutines((prev) => prev.map((item) => item.id === id ? { ...item, lastDone: today, streak: item.lastDone === today ? item.streak : item.streak + 1 } : item));
  }

  function resetRoutine(id: string) {
    setRoutines((prev) => prev.map((item) => item.id === id ? { ...item, lastDone: undefined, streak: 0 } : item));
  }

  function addRoutine() {
    if (!newTitle.trim()) return;
    setRoutines((prev) => [...prev, { id: makeId(), title: newTitle.trim(), category: "Custom", time: newTime, frequency: "Daily", streak: 0, enabled: true }]);
    setNewTitle("");
  }

  function deleteRoutine(id: string) {
    setRoutines((prev) => prev.filter((item) => item.id !== id));
  }

  function refreshFeed() {
    const variants = [
      { id: makeId(), type: "Phrase" as const, title: "今日句子", korean: "괜찮은 척했는데 사실은 좀 힘들었어.", chinese: "我装作没事，但其实有点累。" },
      { id: makeId(), type: "MZ" as const, title: "今日 MZ", korean: "현타 왔어", chinese: "突然清醒/突然觉得空虚现实打击来了。" },
      { id: makeId(), type: "Roleplay" as const, title: "今日 Roleplay", korean: "오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", chinese: "今天就算不说什么，能在旁边陪我就好了。" },
      { id: makeId(), type: "Shadowing" as const, title: "今日跟读", korean: "생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", chinese: "其实没想象中严重。我之前那么担心还有点好笑。" },
      { id: makeId(), type: "Story" as const, title: "今晚短故事", korean: "작은 별은 매일 밤 바다 위에 비쳤다. 아무도 보지 않는 줄 알았지만, 한 아이는 그 빛을 따라 집으로 돌아갔다.", chinese: "小星星每晚照在海面上。它以为没人看见，但有个孩子靠着那道光回到了家。" },
    ];
    setFeed(variants);
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#111]">
      <header className="border-b border-[#E8E5DF] bg-[#0F0F0F] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-black text-white/60"><Clock className="h-3.5 w-3.5 text-[#C9A84C]" />Private AI Routine System</div>
            <h1 className="text-2xl font-black md:text-4xl">Daily Korean OS</h1>
            <p className="mt-2 text-sm font-bold text-white/50">每日沉浸 · 本机提醒 · 收藏复习 · Shadowing · Roleplay · 10PM Story</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/ai-korean" className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/10">AI Chat</a>
            <a href="/korean-genz" className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black text-white/70 hover:bg-white/10">GenZ Library</a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:grid-cols-[1fr_380px] md:px-6">
        <section className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-4 shadow-[4px_4px_0_#1C1A17]"><div className="text-xs font-black text-neutral-400">TODAY DONE</div><div className="mt-2 text-3xl font-black">{summary.done.length}/{summary.enabled.length}</div></div>
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4"><div className="text-xs font-black text-neutral-400">OVERDUE</div><div className="mt-2 text-3xl font-black text-[#E8432D]">{summary.overdue.length}</div></div>
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4"><div className="text-xs font-black text-neutral-400">NEXT</div><div className="mt-2 text-xl font-black">{summary.next ? `${summary.next.time}` : "Done"}</div></div>
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-4"><div className="text-xs font-black text-neutral-400">TOTAL STREAK</div><div className="mt-2 flex items-center gap-2 text-3xl font-black"><Flame className="h-6 w-6 text-[#E8432D]" />{routines.reduce((sum, item) => sum + item.streak, 0)}</div></div>
          </div>

          <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-5 shadow-[6px_6px_0_#1C1A17]">
            <div className="mb-4 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-widest text-[#E8432D]">Daily AI Feed</div><h2 className="text-xl font-black">今日韩语沉浸</h2></div><button onClick={refreshFeed} className="inline-flex items-center gap-2 rounded-xl bg-[#0F0F0F] px-3 py-2 text-xs font-black text-white"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
            <div className="grid gap-3 md:grid-cols-2">
              {feed.map((item) => <div key={item.id} className="rounded-3xl border border-[#E8E5DF] bg-[#FDFCF9] p-4"><div className="mb-2 flex items-center justify-between"><span className="rounded-full bg-[#0F0F0F] px-2.5 py-1 text-[10px] font-black text-white">{item.type}</span><button onClick={() => speakKorean(item.korean)} className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[10px] font-black text-neutral-700"><Volume2 className="h-3 w-3" />Listen</button></div><h3 className="text-sm font-black text-[#E8432D]">{item.title}</h3><p className="mt-2 text-lg font-black leading-8">{item.korean}</p><p className="mt-2 text-sm font-bold leading-6 text-neutral-500">{item.chinese}</p></div>)}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-5">
            <div className="mb-4"><div className="text-xs font-black uppercase tracking-widest text-[#E8432D]">Today Routines</div><h2 className="text-xl font-black">今日任务</h2></div>
            <div className="space-y-3">
              {routines.map((item) => {
                const done = item.lastDone === today;
                return <div key={item.id} className={`rounded-3xl border p-4 ${done ? "border-[#7CB342] bg-[#F7FFF1]" : "border-[#E8E5DF] bg-[#FDFCF9]"}`}><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0F0F0F] px-2.5 py-1 text-[10px] font-black text-white">{item.category}</span><span className="text-xs font-black text-neutral-400">{item.time} · {item.frequency}</span></div><h3 className="text-base font-black">{item.title}</h3><div className="mt-1 flex items-center gap-1 text-xs font-black text-[#E8432D]"><Flame className="h-3.5 w-3.5" />{item.streak} day streak</div></div><div className="flex gap-2"><button onClick={() => completeRoutine(item.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8432D] px-3 py-2 text-xs font-black text-white"><CheckCircle2 className="h-3.5 w-3.5" />Done</button><button onClick={() => resetRoutine(item.id)} className="rounded-xl bg-[#F5F2EB] px-3 py-2 text-xs font-black text-neutral-600">Reset</button><button onClick={() => deleteRoutine(item.id)} className="rounded-xl bg-[#F5F2EB] px-3 py-2 text-xs font-black text-neutral-600"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>;
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border-2 border-[#1C1A17] bg-white p-5 shadow-[4px_4px_0_#1C1A17]"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400"><Bell className="h-3.5 w-3.5" />Local Reminder</div><p className="text-sm font-bold leading-7 text-neutral-600">提醒是 device-local browser notification。网站打开或安装成 PWA 时效果最好；不是云端 Manus 定时。</p><button onClick={requestNotifications} className="mt-4 w-full rounded-2xl bg-[#0F0F0F] px-4 py-3 text-sm font-black text-white">Enable Notification</button><div className="mt-2 text-xs font-black text-neutral-400">Status: {notificationStatus}</div></div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400"><Plus className="h-3.5 w-3.5" />Add Routine</div><div className="space-y-3"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="例如：复习暧昧回复" className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FDFCF9] px-4 py-3 text-sm font-bold outline-none focus:border-[#E8432D]" /><input value={newTime} onChange={(e) => setNewTime(e.target.value)} type="time" className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FDFCF9] px-4 py-3 text-sm font-bold outline-none focus:border-[#E8432D]" /><button onClick={addRoutine} className="w-full rounded-2xl bg-[#E8432D] px-4 py-3 text-sm font-black text-white">Add</button></div></div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400"><BookOpen className="h-3.5 w-3.5" />Korean Vault Map</div><div className="grid grid-cols-2 gap-2 text-xs font-black text-neutral-600">{["MZ", "Flirting", "Daily", "Instagram", "YouTube", "Cool Tone", "Feminine", "Roleplay", "Shadowing", "Story"].map((item) => <div key={item} className="rounded-2xl bg-[#F5F2EB] p-3">{item}</div>)}</div></div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400"><Sparkles className="h-3.5 w-3.5" />Persona Engine</div><div className="space-y-2 text-sm font-bold text-neutral-600">{["韩国女生朋友", "冷淡 MZ", "韩国男友", "韩国网友", "韩国同事", "Instagram commenter", "YouTube commenter", "Theqoo style"].map((item) => <div key={item} className="rounded-2xl border border-[#E8E5DF] bg-[#FDFCF9] p-3">{item}</div>)}</div></div>

          <div className="rounded-3xl border border-[#E8E5DF] bg-white p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400"><Heart className="h-3.5 w-3.5" />Best Use</div><p className="text-sm font-bold leading-7 text-neutral-600">每天打开一次：先完成 Today Routines，再听 Daily Feed，最后去 AI Chat 做 roleplay 或 shadowing。</p></div>
        </aside>
      </main>
    </div>
  );
}

import { BookOpen, MessageSquare, Sparkles, Mic, Layers, Search } from "lucide-react";

const missions = [
  {
    title: "今日 MZ 核心词汇：분좋카",
    korean: "분좋카 가고 싶다... 혹시 연남동에 새로 생긴 분좋카 알아?",
    zh: "好想去‘氛围超赞的咖啡馆’啊。你知道延南洞新开的那家氛围咖啡馆吗？",
    note: "분좋카 = 분위기 좋은 카페。韩国 Gen Z 常把较长名词压缩成三个字，语气更轻、更有网感。",
  },
  {
    title: "沉浸式拆解：성수동 팝업 문화",
    korean: "요즘 성수동은 진짜 팝업스토어 공화국임ㅋㅋㅋ 주말에 가면 대기 줄만 2시간 기본이라 기절각인데...",
    zh: "最近圣水洞简直是快闪店共和国。周末去基本排队两小时起，真的要昏厥。",
    note: "공화국임、기절각、털림、오운완、갓생러 都是韩国网感表达。重点不是逐字翻译，而是掌握语气强度。",
  },
  {
    title: "Shadowing：韩综式反应语气",
    korean: "아, 진짜요? 대박... 어떡해ㅠㅠㅠ 나 진짜 소름 돋았잖아!!!",
    zh: "啊，真的吗？大发……怎么办，我真的起鸡皮疙瘩了。",
    note: "跟读重点：진짜요 尾音微微上扬，소름 돋았잖아 的 잖아 要干脆，带有‘你看吧’的亲近感。",
  },
];

const toneShifts = [
  {
    idea: "这家咖啡馆太漂亮了，我太开心了",
    standard: "이 카페는 아주 아름답습니다. 저는 정말 행복합니다.",
    native: "여기 예카 대박이구 넘 조타아아ㅠㅠ 담에 나랑 또 오자아아!!",
    note: "教科书句子语法正确，但生活感弱。KakaoTalk 语气会用 예카、넘 조타、ㅠㅠ、拉长尾音。",
  },
  {
    idea: "我今天太累了，现在要睡觉了",
    standard: "저는 오늘 너무 피곤합니다. 그래서 지금 자겠습니다.",
    native: "나 오늘 진짜 갓생 살았더니 온몸이 바스러짐ㅋㅋㅋ 지금 바로 침대로 기절하러 감 ㅃㅇ...",
    note: "기절하러 감 比 자겠습니다 更像韩国朋友聊天；ㅃㅇ 是 빠이 的快速缩写。",
  },
  {
    idea: "今天发生了很烦的事，心情很差",
    standard: "오늘 안 좋은 일이 있었습니다. 기분이 좋지 않습니다.",
    native: "야 나 오늘 진짜 킹받는 일 있었어ㅠㅠ 지금 너무 현타 와서 그냥 집에서 쉬고 싶어.",
    note: "킹받다、현타 是真实韩国年轻人会用的情绪词，比 화나다 / 기분이 좋지 않다 更自然。",
  },
];

const lessons = [
  {
    title: "한국 사회의 인간관계 피로감",
    subtitle: "韩国社会的人际疲劳",
    reading: [
      "예전에는 사람 만나는 게 즐거웠는데",
      "요즘은 연락 오는 것만 봐도 피곤할 때가 있다.",
      "관계를 유지하는 것 자체가 에너지 소모처럼 느껴진다.",
      "그래서 일부러 잠수를 타거나 답장을 미루는 사람들도 많아졌다.",
    ],
    terms: ["기 빨린다", "현생 힘들다", "답장 텀 길어짐", "인간관계 현타 옴"],
    nativeReply: "아 뭔 느낌인지 알 것 같음\n사람 자체보다 관계 유지가 더 힘든 느낌…\n진짜 기 너무 빨림 요즘",
  },
  {
    title: "왜 한국 사람들은 ‘현실 고증’에 민감할까?",
    subtitle: "为什么韩国人对‘现实还原’很敏感？",
    reading: [
      "한국에서는 드라마나 영화, 웹툰을 볼 때 ‘현실 고증’이라는 말을 굉장히 자주 쓴다.",
      "요즘 인터넷에서는 단순한 역사뿐 아니라 ‘얼마나 현실 같냐’를 평가할 때도 사용된다.",
      "반대로 너무 현실적으로 표현하면 사람들은 ‘와 현실 고증 미쳤다’라고 감탄하기도 한다.",
    ],
    terms: ["현실 고증", "몰입 깨지다", "디테일", "공감 문화"],
    nativeReply: "와 이거 현실 고증 미쳤다… 작가님 사회생활 해본 사람 맞네ㅋㅋㅋ",
  },
];

export default function KoreanGenzPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#111]">
      <header className="border-b border-[#E8E5DF] bg-[#0F0F0F] text-white">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A84C]" />
            Korean GenZ API Integration
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
            한국어 네이티브 감각 통합 훈련소
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            将韩文任务库、MZ 回复模板、沉浸式精读、语气转换和 shadowing 内容合并成一个统一入口。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/daily" className="rounded-xl bg-[#E8432D] px-4 py-2 text-sm font-black text-white">每日内容</a>
            <a href="/immersion-updates" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-black text-white/80">沉浸更新</a>
            <a href="/files" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-black text-white/80">资料库</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <section className="mb-10 grid gap-4 md:grid-cols-4">
          {[
            [BookOpen, "Daily Missions", "每日 MZ 任务"],
            [MessageSquare, "Reply Templates", "自然回复模板"],
            [Mic, "Shadowing", "跟读语气训练"],
            [Search, "Search Ready", "后续可接搜索"],
          ].map(([Icon, title, sub]) => {
            const I = Icon as typeof BookOpen;
            return (
              <div key={title as string} className="rounded-2xl border-2 border-[#1C1A17] bg-white p-4 shadow-[4px_4px_0_#1C1A17]">
                <I className="mb-3 h-5 w-5 text-[#E8432D]" />
                <div className="text-sm font-black">{title as string}</div>
                <div className="mt-1 text-xs font-bold text-neutral-500">{sub as string}</div>
              </div>
            );
          })}
        </section>

        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#E8432D]" />
            <h2 className="text-xl font-black">每日任务 · Daily Missions</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {missions.map((item) => (
              <article key={item.title} className="rounded-3xl border-2 border-[#1C1A17] bg-[#FFFDF9] p-5 shadow-[5px_5px_0_#1C1A17]">
                <h3 className="text-sm font-black text-[#E8432D]">{item.title}</h3>
                <p className="mt-4 text-lg font-black leading-8">{item.korean}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{item.zh}</p>
                <p className="mt-4 rounded-2xl bg-[#F5F2EB] p-3 text-xs font-bold leading-6 text-neutral-600">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-black">语气转换 · Tone Shift</h2>
          <div className="space-y-4">
            {toneShifts.map((item) => (
              <article key={item.idea} className="rounded-3xl border border-[#E8E5DF] bg-white p-5">
                <div className="mb-4 text-sm font-black">原意：{item.idea}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#F5F2EB] p-4">
                    <div className="mb-2 text-xs font-black text-neutral-400">TEXTBOOK</div>
                    <p className="text-sm font-bold leading-7">{item.standard}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-[#E8432D] bg-[#FFF7F4] p-4">
                    <div className="mb-2 text-xs font-black text-[#E8432D]">NATIVE / MZ</div>
                    <p className="text-sm font-black leading-7">{item.native}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold leading-6 text-neutral-500">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-black">精读课程 · Lesson Reader</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => (
              <article key={lesson.title} className="rounded-3xl border-2 border-[#1C1A17] bg-white p-5 shadow-[5px_5px_0_#1C1A17]">
                <h3 className="text-lg font-black">{lesson.title}</h3>
                <p className="mt-1 text-sm font-bold text-neutral-500">{lesson.subtitle}</p>
                <div className="mt-4 space-y-2">
                  {lesson.reading.map((line) => (
                    <p key={line} className="rounded-xl bg-[#F7F4EE] px-3 py-2 text-sm font-bold leading-6">{line}</p>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lesson.terms.map((term) => (
                    <span key={term} className="rounded-full bg-[#0F0F0F] px-3 py-1 text-[11px] font-black text-white">{term}</span>
                  ))}
                </div>
                <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#FFF7F4] p-4 text-xs font-bold leading-6 text-[#E8432D]">{lesson.nativeReply}</pre>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

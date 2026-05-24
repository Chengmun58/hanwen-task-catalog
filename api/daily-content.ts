import { getArticlesByDate, getLatestContentDate, getVocabularyByDate } from "../server/db";
import { getBeijingDateString } from "../server/services/contentGenerator";

type ApiItem = {
  id: string;
  tag: string;
  ko: string;
  cn: string;
  note: string;
  mission: string;
};

function fallbackItems(date: string): ApiItem[] {
  const dayIndex = Number(date.replace(/-/g, "")) || 0;
  const banks = [
    [
      ["오늘 하루도 생각보다 잘 버텼다.", "今天这一天也比想象中撑得不错。", "혼잣말처럼 자연스럽게"],
      ["기 빨림", "精气被吸干；社交电量耗尽。", "친한 사이에서 쓰기 좋은 표현"],
      ["너 오늘 좀 조용하네. 무슨 일 있어?", "你今天有点安静。发生什么事了吗？", "부드럽게 걱정하는 말투"],
      ["나 지금 완전 방전됐어. 조금만 쉬고 다시 연락할게.", "我现在完全没电了。休息一下再联系你。", "짧게 끊어 읽기"],
      ["달빛 아래 작은 고양이는 익숙한 골목에서 낯선 문 하나를 발견했다.", "月光下的小猫在熟悉的小巷发现了一扇陌生的门。", "밤 10시 몰입용"],
    ],
    [
      ["괜찮은 척했는데 사실은 좀 힘들었어.", "我装作没事，但其实有点累。", "솔직하지만 부담스럽지 않은 말투"],
      ["현타 왔어", "现实感打击来了；幻灭感来袭。", "멘탈이 꺼질 때 쓰는 표현"],
      ["오늘은 그냥 별말 안 해도 옆에 있어주면 좋겠다.", "今天就算不说什么，陪着我就好了。", "가까운 사이의 부드러운 톤"],
      ["생각보다 별거 아니었어. 걱정한 내가 좀 웃기다.", "其实没想象中严重。我之前那么担心还有点好笑。", "두 문장 리듬 연습"],
      ["작은 별은 바다 위에 비쳤고, 한 아이는 그 빛을 따라 집으로 돌아갔다.", "小星星照在海上，孩子跟着那道光回家。", "밤 루틴용 짧은 이야기"],
    ],
  ];
  const selected = banks[dayIndex % banks.length];
  const missions = ["3번 듣고 1번 따라 말하기", "오늘 대화에 한 번 넣어보기", "말끝의 거리감 기억하기", "두 문장으로 나눠서 따라 읽기", "잠들기 전 한 번 듣기"];
  const tags = ["01 오늘의 문장", "02 엠지 표현", "03 카톡 톤", "04 쉐도잉", "05 밤 이야기"];
  return selected.map(([ko, cn, note], index) => ({
    id: `fallback-${date}-${index}`,
    tag: tags[index],
    ko,
    cn,
    note,
    mission: missions[index],
  }));
}

function compact(value: unknown, max = 520) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function dbItems(date: string): Promise<ApiItem[]> {
  const [articles, vocabulary] = await Promise.all([
    getArticlesByDate(date),
    getVocabularyByDate(date),
  ]);

  if (articles.length === 0 && vocabulary.length === 0) return [];

  const article = articles[0];
  const story = articles.find((item) => item.articleType === "novel") || articles[1] || article;
  const social = articles.find((item) => item.articleType === "social") || articles[2] || article;
  const vocab1 = vocabulary[0];
  const vocab2 = vocabulary[1] || vocabulary[0];

  const items: ApiItem[] = [];
  if (article) items.push({
    id: `article-${article.id}`,
    tag: "01 오늘의 읽기",
    ko: `${article.title}\n${compact(article.content)}`,
    cn: `${article.titleZh}\n${compact(article.contentZh)}`,
    note: compact(article.learningTips, 180),
    mission: "읽고 핵심 표현 1개를 자료실에 저장하기",
  });
  if (vocab1) items.push({
    id: `vocab-${vocab1.id}`,
    tag: "02 엠지 표현",
    ko: vocab1.word,
    cn: vocab1.meaning,
    note: `${vocab1.exampleSentence} = ${vocab1.exampleTranslation}`,
    mission: "예문을 듣고 비슷한 문장 하나 만들기",
  });
  if (social) items.push({
    id: `social-${social.id}`,
    tag: "03 카톡/소셜 톤",
    ko: compact(social.content, 300),
    cn: compact(social.contentZh, 300),
    note: compact(social.learningTips, 180),
    mission: "말끝과 거리감만 따로 기억하기",
  });
  if (vocab2) items.push({
    id: `shadow-${vocab2.id}`,
    tag: "04 쉐도잉",
    ko: vocab2.exampleSentence,
    cn: vocab2.exampleTranslation,
    note: compact(vocab2.culturalNote, 180),
    mission: "0.8배 속도로 3번 따라 읽기",
  });
  if (story) items.push({
    id: `story-${story.id}`,
    tag: "05 밤 이야기",
    ko: compact(story.content, 360),
    cn: compact(story.contentZh, 360),
    note: compact(story.learningTips, 180),
    mission: "밤에 듣고 이미지로 장면 떠올리기",
  });

  return items;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const requestedDate = typeof req.query?.date === "string" ? req.query.date : undefined;
  let date = requestedDate || getBeijingDateString();
  let source: "database" | "fallback" = "fallback";

  try {
    const latest = requestedDate ? requestedDate : await getLatestContentDate();
    if (latest) date = latest;
    const items = await dbItems(date);
    if (items.length > 0) {
      source = "database";
      return res.status(200).json({ ok: true, source, date, items });
    }
  } catch (error) {
    console.warn("[daily-content] database unavailable, using fallback", error instanceof Error ? error.message : error);
  }

  return res.status(200).json({ ok: true, source, date, items: fallbackItems(date) });
}

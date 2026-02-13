import type { Emotion } from "@/domain/values/emotion";
import type { GirlResponse } from "@/domain/values/girl-response";

interface ResponseRule {
  keywords: string[];
  responses: GirlResponse[];
}

const jaRules: ResponseRule[] = [
  {
    keywords: ["好き", "love", "すき", "大好き"],
    responses: [
      { content: "えっ…！急にそんなこと言われたら…照れちゃう♡", points: 30, emotion: "embarrassed" },
      { content: "もう…そういうの反則だよ～♡", points: 25, emotion: "embarrassed" },
    ],
  },
  {
    keywords: ["かわいい", "可愛い", "cute", "きれい", "綺麗", "美人"],
    responses: [
      { content: "ほんと？ えへへ、嬉しいな♪", points: 20, emotion: "joy" },
      { content: "そ、そんなことないよ…でもありがと♡", points: 20, emotion: "embarrassed" },
    ],
  },
  {
    keywords: ["こんにちは", "hello", "hi", "やっほー", "おはよう", "はじめまして"],
    responses: [
      { content: "やっほー！待ってたよ♪ 今日はたくさんお話しようね！", points: 10, emotion: "joy" },
      { content: "こんにちは！会えて嬉しい♡", points: 10, emotion: "joy" },
    ],
  },
  {
    keywords: ["趣味", "hobby", "何が好き"],
    responses: [
      { content: "音楽聴くのが好きかな♪ あとは…こうやって話すのも！", points: 15, emotion: "joy" },
      { content: "最近はカフェ巡りにハマってるの！一緒に行かない？", points: 15, emotion: "joy" },
    ],
  },
  {
    keywords: ["名前", "なまえ", "name", "誰"],
    responses: [
      { content: "私のこと？ ひ・み・つ♡ …なんてね、仲良くなったら教えてあげる！", points: 10, emotion: "embarrassed" },
    ],
  },
  {
    keywords: ["ありがとう", "thanks", "thank you", "サンキュー"],
    responses: [{ content: "どういたしまして♪ そういう言葉、大好き！", points: 15, emotion: "joy" }],
  },
  {
    keywords: ["デート", "date", "遊び", "どこか"],
    responses: [
      { content: "デートのお誘い!? やった～！どこ行く？♡", points: 25, emotion: "joy" },
      { content: "え、いいの？ 楽しみにしてるね♪", points: 20, emotion: "embarrassed" },
    ],
  },
];

const enRules: ResponseRule[] = [
  {
    keywords: ["love", "like you", "adore"],
    responses: [
      { content: "W-what…!? Saying that so suddenly… you're making me blush♡", points: 30, emotion: "embarrassed" },
      { content: "Geez… that's not fair～♡", points: 25, emotion: "embarrassed" },
    ],
  },
  {
    keywords: ["cute", "pretty", "beautiful", "gorgeous"],
    responses: [
      { content: "Really? Hehe, that makes me so happy♪", points: 20, emotion: "joy" },
      { content: "N-no way… but thank you♡", points: 20, emotion: "embarrassed" },
    ],
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "nice to meet"],
    responses: [
      { content: "Hiii! I was waiting for you♪ Let's chat a lot today!", points: 10, emotion: "joy" },
      { content: "Hello! I'm so happy to see you♡", points: 10, emotion: "joy" },
    ],
  },
  {
    keywords: ["hobby", "hobbies", "what do you like"],
    responses: [
      { content: "I love listening to music♪ And… chatting like this too!", points: 15, emotion: "joy" },
      { content: "Lately I'm into café hopping! Wanna go together?", points: 15, emotion: "joy" },
    ],
  },
  {
    keywords: ["name", "who are you", "what's your name"],
    responses: [
      {
        content: "Me? It's a se~cret♡ …just kidding, I'll tell you once we're closer!",
        points: 10,
        emotion: "embarrassed",
      },
    ],
  },
  {
    keywords: ["thanks", "thank you", "thx", "appreciate"],
    responses: [{ content: "You're welcome♪ I love hearing words like that!", points: 15, emotion: "joy" }],
  },
  {
    keywords: ["date", "hang out", "go out", "somewhere"],
    responses: [
      { content: "A date!? Yay～! Where should we go?♡", points: 25, emotion: "joy" },
      { content: "Wait, really? I can't wait♪", points: 20, emotion: "embarrassed" },
    ],
  },
];

const jaFallbackResponses: GirlResponse[] = [
  { content: "ふーん、なるほどね！もっと教えて♪", points: 5, emotion: "default" },
  { content: "えへへ、面白いね！", points: 5, emotion: "joy" },
  { content: "そうなんだ～！それでそれで？", points: 5, emotion: "joy" },
  { content: "うんうん、聞いてるよ♡", points: 5, emotion: "default" },
];

const enFallbackResponses: GirlResponse[] = [
  { content: "Hmm, I see! Tell me more♪", points: 5, emotion: "default" },
  { content: "Hehe, that's funny!", points: 5, emotion: "joy" },
  { content: "Oh really～! And then what?", points: 5, emotion: "joy" },
  { content: "Mhm mhm, I'm listening♡", points: 5, emotion: "default" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getGirlResponse(userMessage: string, locale: string): GirlResponse {
  const lower = userMessage.toLowerCase();
  const rules = locale === "ja" ? jaRules : enRules;
  const fallback = locale === "ja" ? jaFallbackResponses : enFallbackResponses;

  for (const rule of rules) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return pickRandom(rule.responses);
    }
  }

  return pickRandom(fallback);
}

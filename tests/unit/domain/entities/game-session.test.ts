import { describe, expect, it } from "vitest";
import { GameSession } from "@/domain/entities/game-session";
import { NgWord } from "@/domain/values/ng-word";

describe("GameSession", () => {
  const createSession = () =>
    new GameSession("session-1", "テストユーザー", "tsundere", [new NgWord("嫌い"), new NgWord("boring")]);

  it("初期状態はactive", () => {
    const session = createSession();
    expect(session.status).toBe("active");
  });

  it("空ngWordsで生成できる", () => {
    const session = new GameSession("session-2", "テストユーザー", "tsundere");
    expect(session.ngWords).toEqual([]);
    expect(session.checkNgWord("何でも言える")).toBeNull();
  });

  it("後からngWordsを設定できる", () => {
    const session = new GameSession("session-3", "テストユーザー", "tsundere");
    session.ngWords = [new NgWord("嫌い")];
    expect(session.checkNgWord("嫌いだ")).not.toBeNull();
  });

  it("初期メッセージカウントは0", () => {
    const session = createSession();
    expect(session.messageCount).toBe(0);
  });

  it("NGワードにヒットした場合そのNgWordを返す", () => {
    const session = createSession();
    const hit = session.checkNgWord("あなたが嫌いです");
    expect(hit).not.toBeNull();
    expect(hit?.word).toBe("嫌い");
  });

  it("NGワードにヒットしない場合nullを返す", () => {
    const session = createSession();
    expect(session.checkNgWord("あなたが好きです")).toBeNull();
  });

  it("incrementMessageCountでカウントが増える", () => {
    const session = createSession();
    session.incrementMessageCount();
    expect(session.messageCount).toBe(1);
    session.incrementMessageCount();
    expect(session.messageCount).toBe(2);
  });
});

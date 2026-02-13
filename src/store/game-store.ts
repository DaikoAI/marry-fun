import type { Emotion } from "@/domain/values/emotion";
import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "girl";
  content: string;
  timestamp: number;
}

interface GameState {
  username: string;
  sessionId: string;
  points: number;
  jackpot: number;
  tokenBonus: number;
  messages: ChatMessage[];
  isGirlTyping: boolean;
  currentEmotion: Emotion;
  hasSeenGoalPopup: boolean;
  hasEarnedAnyPoint: boolean;
  remainingChats: number;
  isGameOver: boolean;
  hitWord: string | null;
  shockMessage: string | null;
  lastPointsEarned: number | null;
  pointGainEventId: number;
}

interface GameActions {
  setUsername: (username: string) => void;
  setSessionId: (sessionId: string) => void;
  addPoints: (amount: number, balance?: number) => void;
  setPoints: (points: number) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setGirlTyping: (isTyping: boolean) => void;
  setEmotion: (emotion: Emotion) => void;
  setHasSeenGoalPopup: (value: boolean) => void;
  decrementRemainingChats: () => void;
  setGameOver: (hitWord: string, shockMessage?: string) => void;
  clearLastPoints: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  username: "",
  sessionId: "",
  points: 0,
  jackpot: 0,
  tokenBonus: 1.5,
  messages: [],
  isGirlTyping: false,
  currentEmotion: "default" satisfies Emotion,
  hasSeenGoalPopup: false,
  hasEarnedAnyPoint: false,
  remainingChats: 20,
  isGameOver: false,
  hitWord: null,
  shockMessage: null,
  lastPointsEarned: null,
  pointGainEventId: 0,
};

export const useGameStore = create<GameState & GameActions>()(set => ({
  ...initialState,

  setUsername: username => {
    set({ username });
  },

  setSessionId: sessionId => {
    set({ sessionId });
  },

  addPoints: (amount, balance) => {
    set(state => {
      return {
        points: balance ?? state.points + amount,
        jackpot: state.jackpot + Math.round(amount * 0.1),
        hasEarnedAnyPoint: state.hasEarnedAnyPoint || amount > 0,
        lastPointsEarned: amount,
        pointGainEventId: state.pointGainEventId + 1,
      };
    });
  },

  setPoints: points => {
    set({ points });
  },

  addMessage: message => {
    set(state => ({
      messages: [...state.messages, { ...message, id: crypto.randomUUID(), timestamp: Date.now() }],
    }));
  },

  setGirlTyping: isGirlTyping => {
    set({ isGirlTyping });
  },

  setEmotion: currentEmotion => {
    set({ currentEmotion });
  },

  setHasSeenGoalPopup: hasSeenGoalPopup => {
    set({ hasSeenGoalPopup });
  },

  decrementRemainingChats: () => {
    set(state => ({ remainingChats: Math.max(0, state.remainingChats - 1) }));
  },

  setGameOver: (hitWord, shockMessage) => {
    set({ isGameOver: true, hitWord, shockMessage: shockMessage ?? null, remainingChats: 0 });
  },

  clearLastPoints: () => {
    set({ lastPointsEarned: null });
  },

  resetGame: () => {
    set(initialState);
  },
}));

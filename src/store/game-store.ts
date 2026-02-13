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
  remainingChats: number;
  isGameOver: boolean;
  hitWord: string | null;
  shockMessage: string | null;
  lastPointsEarned: number | null;
  floatKeySeed: number;
}

interface GameActions {
  setUsername: (username: string) => void;
  setSessionId: (sessionId: string) => void;
  addPoints: (amount: number) => void;
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
  remainingChats: 20,
  isGameOver: false,
  hitWord: null,
  shockMessage: null,
  lastPointsEarned: null,
  floatKeySeed: 0,
};

export const useGameStore = create<GameState & GameActions>()(set => ({
  ...initialState,

  setUsername: username => {
    set({ username });
  },

  setSessionId: sessionId => {
    set({ sessionId });
  },

  addPoints: amount => {
    set(state => {
      const boosted = Math.round(amount * state.tokenBonus);
      return {
        points: state.points + boosted,
        jackpot: state.jackpot + Math.round(boosted * 0.1),
        lastPointsEarned: boosted,
        floatKeySeed: state.floatKeySeed + 1,
      };
    });
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

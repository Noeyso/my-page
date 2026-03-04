import { create } from 'zustand';

const NICKNAME_STORAGE_KEY = 'dreamdesk-nickname';

interface SessionStore {
  nickname: string | null;
  isUnlocked: boolean;
  setNickname: (name: string) => void;
  unlock: () => void;
  reset: () => void;
}

const getStoredNickname = (): string | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
  return stored && stored.trim() ? stored.trim() : null;
};

const initialNickname = getStoredNickname();

export const useSessionStore = create<SessionStore>((set) => ({
  nickname: initialNickname,
  isUnlocked: Boolean(initialNickname),
  setNickname: (name: string) => {
    const trimmed = name.trim();
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, trimmed);
    set({ nickname: trimmed });
  },
  unlock: () => set({ isUnlocked: true }),
  reset: () => {
    window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
    set({ nickname: null, isUnlocked: false });
  },
}));

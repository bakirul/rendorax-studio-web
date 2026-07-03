import { create } from 'zustand';

interface GlobalState {
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  isLiveSessionActive: boolean;
  setIsLiveSessionActive: (active: boolean) => void;
  socketConnection: any | null; // Can type this strictly as Socket later
  setSocketConnection: (socket: any | null) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  isMicActive: false,
  setIsMicActive: (active) => set({ isMicActive: active }),
  selectedLanguage: 'en-US',
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  isLiveSessionActive: false,
  setIsLiveSessionActive: (active) => set({ isLiveSessionActive: active }),
  socketConnection: null,
  setSocketConnection: (socket) => set({ socketConnection: socket }),
}));

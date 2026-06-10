import { create } from 'zustand';

interface ViewSettings {
  cardSize: string;
  aspectRatio: string;
  thumbnailScale: string;
  showCardInfo: boolean;
}

interface FileData {
  name: string;
  url: string;
  isVideo?: boolean;
}

interface DashboardState {
  // View Settings
  viewSettings: ViewSettings;
  setViewSettings: (settings: Partial<ViewSettings>) => void;

  // Layout State
  leftPaneWidth: number;
  setLeftPaneWidth: (width: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isLiveMinimized: boolean;
  setIsLiveMinimized: (isMinimized: boolean) => void;

  // Asset State
  currentFolder: string;
  setCurrentFolder: (folder: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  previewFile: FileData | null;
  setPreviewFile: (file: FileData | null) => void;
  compareFile: FileData | null;
  setCompareFile: (file: FileData | null) => void;
  isCompareMode: boolean;
  setIsCompareMode: (isCompare: boolean) => void;

  // RBAC & User State
  isEditor: boolean;
  setIsEditor: (isEditor: boolean) => void;

  // Stream States
  isLiveStreaming: boolean;
  setIsLiveStreaming: (isLive: boolean) => void;
  isScreenSharing: boolean;
  setIsScreenSharing: (isSharing: boolean) => void;
  
  // Project state
  projectStage: string;
  setProjectStage: (stage: string) => void;

  // Multi-lingual State
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  viewSettings: {
    cardSize: "M",
    aspectRatio: "video",
    thumbnailScale: "Fit",
    showCardInfo: true,
  },
  setViewSettings: (settings) =>
    set((state) => ({ viewSettings: { ...state.viewSettings, ...settings } })),

  leftPaneWidth: 35,
  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),
  
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isLiveMinimized: true,
  setIsLiveMinimized: (isMinimized) => set({ isLiveMinimized: isMinimized }),

  currentFolder: "",
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),
  
  compareFile: null,
  setCompareFile: (file) => set({ compareFile: file }),
  
  isCompareMode: false,
  setIsCompareMode: (isCompare) => set({ isCompareMode: isCompare }),

  isEditor: false,
  setIsEditor: (isEditor) => set({ isEditor: isEditor }),

  isLiveStreaming: false,
  setIsLiveStreaming: (isLive) => set({ isLiveStreaming: isLive }),
  
  isScreenSharing: false,
  setIsScreenSharing: (isSharing) => set({ isScreenSharing: isSharing }),
  
  projectStage: "Rough Cut", // Default
  setProjectStage: (stage) => set({ projectStage: stage }),

  userLanguage: "en-US", // Default to English
  setUserLanguage: (lang) => set({ userLanguage: lang }),
}));

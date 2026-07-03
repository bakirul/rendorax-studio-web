import { create } from 'zustand';
import { persistViewSettings } from '@/utils/viewSettingsPersistence';

interface ViewSettings {
  aspectRatio: string;
  /** Object-fit mode for thumbnails: Fit (contain) or Fill (cover). */
  thumbnailScale: string;
  /** Grid column scale as percentage (20–200, default 100). */
  thumbnailSizePercent: number;
  showCardInfo: boolean;
}

export type { ViewSettings };

interface FileData {
  name: string;
  url: string;
  publicUrl?: string;
  isVideo?: boolean;
  isCdn?: boolean;
  assetId?: string;
  previewKey?: string;
}

export interface GallerySelectableAsset {
  id: string;
  source: "cloud" | "vault";
  fileName: string;
  fileSize: number | null;
  mimeType?: string;
  objectKey?: string;
  publicUrl?: string;
  vaultDownloadUrl?: string;
  /** Stable key matching dashboard previewFile for CC tracks */
  previewKey?: string;
}

export interface VideoSubtitleTrack {
  language: string;
  label: string;
  vttUrl: string;
  isDefault?: boolean;
}

interface DashboardState {
  // View Settings
  viewSettings: ViewSettings;
  setViewSettings: (settings: Partial<ViewSettings>) => void;
  viewMode: 'list' | 'grid-sm' | 'grid-lg';
  setViewMode: (mode: 'list' | 'grid-sm' | 'grid-lg') => void;

  // Layout State
  leftPaneWidth: number;
  setLeftPaneWidth: (width: number) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isLiveMinimized: boolean;
  setIsLiveMinimized: (isMinimized: boolean) => void;

  // Asset State
  activeBin: "root" | "cloud" | "vault";
  setActiveBin: (bin: "root" | "cloud" | "vault") => void;
  currentFolder: string;
  setCurrentFolder: (folder: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGalleryAssets: GallerySelectableAsset[];
  gallerySelectionAnchorId: string | null;
  toggleGalleryAssetSelection: (asset: GallerySelectableAsset) => void;
  setGallerySelection: (assets: GallerySelectableAsset[]) => void;
  setGallerySelectionAnchorId: (id: string | null) => void;
  selectGalleryRange: (
    visibleAssets: GallerySelectableAsset[],
    targetId: string,
  ) => void;
  clearGallerySelection: () => void;
  previewFile: FileData | null;
  setPreviewFile: (file: FileData | null) => void;
  subtitleTracksByAssetKey: Record<string, VideoSubtitleTrack[]>;
  addPreviewSubtitleTrack: (
    assetKey: string,
    track: VideoSubtitleTrack,
  ) => void;
  getPreviewSubtitleTracks: (assetKey: string) => VideoSubtitleTrack[];
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
    aspectRatio: "video",
    thumbnailScale: "Fit",
    thumbnailSizePercent: 100,
    showCardInfo: true,
  },
  setViewSettings: (settings) =>
    set((state) => {
      const viewSettings = { ...state.viewSettings, ...settings };
      persistViewSettings(viewSettings);
      return { viewSettings };
    }),
  
  viewMode: 'grid-lg',
  setViewMode: (mode) => set({ viewMode: mode }),

  leftPaneWidth: 35,
  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),
  
  sidebarWidth: 240,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isLiveMinimized: true,
  setIsLiveMinimized: (isMinimized) => set({ isLiveMinimized: isMinimized }),

  activeBin: "root",
  setActiveBin: (bin) =>
    set({
      activeBin: bin,
      selectedGalleryAssets: [],
      gallerySelectionAnchorId: null,
    }),

  currentFolder: "",
  setCurrentFolder: (folder) =>
    set({
      currentFolder: folder,
      selectedGalleryAssets: [],
      gallerySelectionAnchorId: null,
    }),
  
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedGalleryAssets: [],
  gallerySelectionAnchorId: null,
  toggleGalleryAssetSelection: (asset) =>
    set((state) => {
      const exists = state.selectedGalleryAssets.some((item) => item.id === asset.id);
      return {
        selectedGalleryAssets: exists
          ? state.selectedGalleryAssets.filter((item) => item.id !== asset.id)
          : [...state.selectedGalleryAssets, asset],
      };
    }),
  setGallerySelection: (assets) => set({ selectedGalleryAssets: assets }),
  setGallerySelectionAnchorId: (id) => set({ gallerySelectionAnchorId: id }),
  selectGalleryRange: (visibleAssets, targetId) =>
    set((state) => {
      const anchorId = state.gallerySelectionAnchorId;
      const targetIndex = visibleAssets.findIndex((asset) => asset.id === targetId);

      if (targetIndex === -1) return state;

      if (!anchorId) {
        const target = visibleAssets[targetIndex];
        return {
          gallerySelectionAnchorId: targetId,
          selectedGalleryAssets: target ? [target] : [],
        };
      }

      const anchorIndex = visibleAssets.findIndex((asset) => asset.id === anchorId);
      if (anchorIndex === -1) {
        const target = visibleAssets[targetIndex];
        return {
          gallerySelectionAnchorId: targetId,
          selectedGalleryAssets: target ? [target] : [],
        };
      }

      const start = Math.min(anchorIndex, targetIndex);
      const end = Math.max(anchorIndex, targetIndex);

      return {
        gallerySelectionAnchorId: anchorId,
        selectedGalleryAssets: visibleAssets.slice(start, end + 1),
      };
    }),
  clearGallerySelection: () =>
    set({ selectedGalleryAssets: [], gallerySelectionAnchorId: null }),

  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),

  subtitleTracksByAssetKey: {},
  addPreviewSubtitleTrack: (assetKey, track) =>
    set((state) => {
      const existing = state.subtitleTracksByAssetKey[assetKey] ?? [];
      const duplicate = existing.find((item) => item.language === track.language);
      if (duplicate?.vttUrl) {
        try {
          URL.revokeObjectURL(duplicate.vttUrl);
        } catch {
          // ignore revoke failures
        }
      }

      const withoutLanguage = existing.filter(
        (item) => item.language !== track.language,
      );
      const hasDefault = withoutLanguage.some((item) => item.isDefault);
      const nextTrack: VideoSubtitleTrack = {
        ...track,
        isDefault: track.isDefault ?? (!hasDefault && withoutLanguage.length === 0),
      };

      return {
        subtitleTracksByAssetKey: {
          ...state.subtitleTracksByAssetKey,
          [assetKey]: [...withoutLanguage, nextTrack],
        },
      };
    }),
  getPreviewSubtitleTracks: (assetKey) => {
    return useDashboardStore.getState().subtitleTracksByAssetKey[assetKey] ?? [];
  },
  
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

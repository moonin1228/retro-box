import { create } from "zustand";

import {
  deleteRomFromCache,
  getRomCacheInfo,
  loadRomFromCache,
  saveRomToCache,
} from "@/emulator/util/indexedDBUtils.js";

const useRomCacheStore = create((set, get) => ({
  romCache: {},
  isLoading: false,
  error: null,

  saveRomToCache: async (fileName, romData) => {
    set({ isLoading: true, error: null });
    try {
      await saveRomToCache(fileName, romData);

      set((state) => ({
        romCache: {
          ...state.romCache,
          [fileName]: {
            size: romData.length,
            timestamp: Date.now(),
          },
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error("롬 캐시 저장 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  loadRomFromCache: async (fileName) => {
    set({ isLoading: true, error: null });
    try {
      const romData = await loadRomFromCache(fileName);
      set({ isLoading: false });
      return romData;
    } catch (error) {
      console.error("롬 캐시 로드 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
      return null;
    }
  },

  deleteRomFromCache: async (fileName) => {
    set({ isLoading: true, error: null });
    try {
      await deleteRomFromCache(fileName);

      set((state) => {
        const newRomCache = { ...state.romCache };
        delete newRomCache[fileName];
        return {
          romCache: newRomCache,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("롬 캐시 삭제 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  getRomCacheInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const romInfo = await getRomCacheInfo();

      const romCache = {};
      romInfo.forEach((rom) => {
        romCache[rom.fileName] = {
          size: rom.size,
          timestamp: rom.timestamp,
        };
      });

      set({
        romCache,
        isLoading: false,
      });

      return romInfo;
    } catch (error) {
      console.error("롬 캐시 정보 조회 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
      return [];
    }
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().getRomCacheInfo();
    } catch (error) {
      console.error("롬 캐시 스토어 초기화 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },
}));

export default useRomCacheStore;

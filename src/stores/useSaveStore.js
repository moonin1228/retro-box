import { create } from "zustand";

import {
  deleteAllGameSaves,
  deleteGameSave,
  getGameSaveStates,
  loadGameState,
  saveGameState,
} from "@/emulator/util/indexedDBUtils.js";

const useSaveStore = create((set, get) => ({
  saveStates: {},
  currentSlot: 1,
  isLoading: false,
  error: null,

  saveState: async (gameTitle, snapshot) => {
    set({ isLoading: true, error: null });
    try {
      await saveGameState(gameTitle, get().currentSlot, snapshot);

      const updatedStates = await getGameSaveStates(gameTitle);
      set((state) => ({
        saveStates: {
          ...state.saveStates,
          [gameTitle]: updatedStates,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error("세이브 저장 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  loadState: async (gameTitle, slot) => {
    set({ isLoading: true, error: null });
    try {
      const snapshot = await loadGameState(gameTitle, slot);
      set({ isLoading: false });
      return snapshot;
    } catch (error) {
      console.error("세이브 로드 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
      return null;
    }
  },

  setCurrentSlot: (slot) => set({ currentSlot: slot }),

  clearGameSaves: async (gameTitle) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAllGameSaves(gameTitle);
      set((state) => {
        const newSaveStates = { ...state.saveStates };
        delete newSaveStates[gameTitle];
        return {
          saveStates: newSaveStates,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("게임 세이브 삭제 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  deleteSaveSlot: async (gameTitle, slot) => {
    set({ isLoading: true, error: null });
    try {
      await deleteGameSave(gameTitle, slot);

      const updatedStates = await getGameSaveStates(gameTitle);
      set((state) => ({
        saveStates: {
          ...state.saveStates,
          [gameTitle]: updatedStates,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error("세이브 슬롯 삭제 실패:", error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },
  initialize: () => set({ saveStates: {}, error: null, isLoading: false }),
}));

export default useSaveStore;

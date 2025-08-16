import { create } from "zustand";

import {
  deleteGameSave,
  getGameSaveStates,
  loadGameState,
  saveGameState,
} from "@/emulator/util/indexedDBUtils";

const useSaveStore = create((set, get) => ({
  saveStates: {},
  currentSlot: 1,
  isLoading: false,

  saveState: async (gameTitle, snapshot) => {
    set({ isLoading: true });
    await saveGameState(gameTitle, get().currentSlot, snapshot);
    const updatedStates = await getGameSaveStates(gameTitle);
    set((state) => ({
      saveStates: { ...state.saveStates, [gameTitle]: updatedStates },
      isLoading: false,
    }));
  },

  loadState: async (gameTitle, slot) => {
    set({ isLoading: true });
    const snapshot = await loadGameState(gameTitle, slot);
    set({ isLoading: false });
    return snapshot;
  },

  setCurrentSlot: (slot) => set({ currentSlot: slot }),

  deleteSaveSlot: async (gameTitle, slot) => {
    set({ isLoading: true });
    await deleteGameSave(gameTitle, slot);
    const updatedStates = await getGameSaveStates(gameTitle);
    set((state) => ({
      saveStates: { ...state.saveStates, [gameTitle]: updatedStates },
      isLoading: false,
    }));
  },

  getSaveData: async (gameTitle) => {
    const saveStates = await getGameSaveStates(gameTitle);
    const saves = Object.entries(saveStates).map(([slot, save]) => ({
      name: `슬롯 ${slot}`,
      slot,
      timestamp: save.timestamp,
      data: save.data,
    }));
    return saves.sort((a, b) => b.timestamp - a.timestamp);
  },

  initialize: () => set({ saveStates: {}, isLoading: false }),
}));

export default useSaveStore;

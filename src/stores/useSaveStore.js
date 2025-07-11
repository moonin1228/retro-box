import { create } from "zustand";

const useSaveStore = create((set) => ({
  saveStates: {},

  currentSlot: 1,

  saveState: (gameTitle, snapshot) =>
    set((state) => {
      const newSaveStates = {
        ...state.saveStates,
        [gameTitle]: {
          ...(state.saveStates[gameTitle] || {}),
          [state.currentSlot]: {
            timestamp: Date.now(),
            data: snapshot,
          },
        },
      };

      localStorage.setItem("saveStates", JSON.stringify(newSaveStates));

      return { saveStates: newSaveStates };
    }),

  loadState: (gameTitle, slot) => {
    const saveStates = JSON.parse(localStorage.getItem("saveStates") || "{}");
    const gameStates = saveStates[gameTitle] || {};
    return gameStates[slot]?.data || null;
  },

  setCurrentSlot: (slot) => set({ currentSlot: slot }),

  clearGameSaves: (gameTitle) =>
    set((state) => {
      const newSaveStates = { ...state.saveStates };
      delete newSaveStates[gameTitle];
      localStorage.setItem("saveStates", JSON.stringify(newSaveStates));
      return { saveStates: newSaveStates };
    }),

  initialize: () =>
    set(() => {
      const savedStates = JSON.parse(localStorage.getItem("saveStates") || "{}");
      return { saveStates: savedStates };
    }),
}));

export default useSaveStore;

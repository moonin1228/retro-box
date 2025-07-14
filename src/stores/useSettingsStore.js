import { create } from "zustand";
import { persist } from "zustand/middleware";

const useSettingsStore = create(
  persist(
    (set, get) => ({
      autoSave: {
        enabled: false,
        interval: 300000,
      },

      setAutoSaveEnabled: (enabled) =>
        set((state) => ({
          autoSave: {
            ...state.autoSave,
            enabled,
          },
        })),

      setAutoSaveInterval: (interval) =>
        set((state) => ({
          autoSave: {
            ...state.autoSave,
            interval,
          },
        })),
    }),
    {
      name: "retro-box-settings",
      version: 1,
    },
  ),
);

export default useSettingsStore;

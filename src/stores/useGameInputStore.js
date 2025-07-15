import { create } from "zustand";
import { persist } from "zustand/middleware";

import BUTTON_BITS from "@/constants/buttonBits.js";

const DEFAULT_KEY_MAP = {
  ArrowRight: BUTTON_BITS.RIGHT,
  ArrowLeft: BUTTON_BITS.LEFT,
  ArrowUp: BUTTON_BITS.UP,
  ArrowDown: BUTTON_BITS.DOWN,
  KeyX: BUTTON_BITS.A,
  KeyZ: BUTTON_BITS.B,
  KeyS: BUTTON_BITS.START,
  ShiftRight: BUTTON_BITS.SELECT,
};

const useGameInputStore = create(
  persist(
    (set, get) => ({
      inputMask: 0,
      keyMap: { ...DEFAULT_KEY_MAP },

      setKey: (oldKey, newKey) =>
        set((state) => {
          const { [oldKey]: value, ...rest } = state.keyMap;
          if (value === undefined) return { keyMap: state.keyMap };

          return {
            keyMap: {
              ...rest,
              [newKey]: value,
            },
          };
        }),

      resetKeys: () => set({ keyMap: { ...DEFAULT_KEY_MAP } }),

      pressButton: (buttonBit) =>
        set((state) => ({
          inputMask: state.inputMask | buttonBit,
        })),

      keyUpButton: (buttonBit) =>
        set((state) => ({
          inputMask: state.inputMask & ~buttonBit,
        })),

      getInputMask: () => get().inputMask,
    }),
    {
      name: "game-input-storage",
      partialize: (state) => ({ keyMap: state.keyMap }),
    },
  ),
);

export default useGameInputStore;

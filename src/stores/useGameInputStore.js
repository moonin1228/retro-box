import { create } from "zustand";

const useGameInputStore = create((set, get) => ({
  inputMask: 0,

  pressButton: (buttonBit) =>
    set((state) => ({
      inputMask: state.inputMask | buttonBit,
    })),

  keyUpButton: (buttonBit) =>
    set((state) => ({
      inputMask: state.inputMask & ~buttonBit,
    })),

  getInputMask: () => get().inputMask,
}));

export default useGameInputStore;

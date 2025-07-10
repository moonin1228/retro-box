import { create } from "zustand";

const useSaveState = create({
  saveState: {},

  setSaveData: (data) => localStorage.setItem("savestate", JSON.stringify(data.saveState)),
});

export default useSaveState;

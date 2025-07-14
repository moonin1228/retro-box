import useSaveStore from "@/stores/useSaveStore.js";

export const saveCurrentState = async (cpu) => {
  const snapshot = {
    cpu: {
      register: { ...cpu.register },
      clock: { ...cpu.clock },
      ime: cpu.isInterruptMasterEnabled,
      halted: cpu.isHalted,
      paused: cpu.isPaused,
    },
    memory: cpu.memory.getSnapshot(),
  };

  const gameTitle = cpu.getGameName?.() || "UnknownGame";

  await useSaveStore.getState().saveState(gameTitle, snapshot);
};

export const loadCurrentState = async (cpu) => {
  const gameTitle = cpu.getGameName?.() || "UnknownGame";
  const currentSlot = useSaveStore.getState().currentSlot;
  const snapshot = await useSaveStore.getState().loadState(gameTitle, currentSlot);

  Object.assign(cpu.register, snapshot.cpu.register);
  cpu.clock.cycles = snapshot.cpu.clock.cycles;
  cpu.isInterruptMasterEnabled = snapshot.cpu.ime;
  cpu.isHalted = snapshot.cpu.halted;
  cpu.isPaused = snapshot.cpu.paused;

  cpu.memory.loadSnapshot(snapshot.memory);

  return true;
};

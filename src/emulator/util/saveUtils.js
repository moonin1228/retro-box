import useSaveStore from "@/stores/useSaveStore.js";

export async function saveCurrentState(cpu) {
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

  const title = cpu.getGameName?.() || "UnknownGame";
  const gameTitle = normalizeTitle(title);

  await useSaveStore.getState().saveState(gameTitle, snapshot);
}

export async function loadCurrentState(cpu) {
  const title = cpu.getGameName?.() || "UnknownGame";
  const gameTitle = normalizeTitle(title);

  const currentSlot = useSaveStore.getState().currentSlot;
  const snapshot = await useSaveStore.getState().loadState(gameTitle, currentSlot);

  Object.assign(cpu.register, snapshot.cpu.register);
  cpu.clock.cycles = snapshot.cpu.clock.cycles;
  cpu.isInterruptMasterEnabled = snapshot.cpu.ime;
  cpu.isHalted = snapshot.cpu.halted;
  cpu.isPaused = snapshot.cpu.paused;

  cpu.memory.loadSnapshot(snapshot.memory);

  return true;
}

function normalizeTitle(text) {
  if (typeof text !== "string") return "";
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

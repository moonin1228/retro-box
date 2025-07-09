export const createTimer = (cpu, memory) => {
  const DIV = 0xff04;
  const TIMA = 0xff05;
  const TMA = 0xff06;
  const TAC = 0xff07;

  let mainTime = 0;
  let divTime = 0;

  const updateTimer = (elapsed) => {
    if (!(memory.readByte(TAC) & 0x04)) return;

    mainTime += elapsed;

    const tacSel = memory.readByte(TAC) & 0x03;
    const base = [64, 1, 4, 16][tacSel] * 16;

    while (mainTime >= base) {
      mainTime -= base;

      const next = memory.readByte(TIMA) + 1;
      if (next > 0xff) {
        memory.writeByte(TIMA, memory.readByte(TMA));
        cpu.requestInterrupt(cpu.INTERRUPTS.TIMER);
      } else {
        memory.writeByte(TIMA, next);
      }
    }
  };

  const updateDiv = (elapsed) => {
    const DIV_THRESHOLD = 256;
    divTime += elapsed;

    if (divTime > DIV_THRESHOLD) {
      divTime -= DIV_THRESHOLD;
      memory.writeByte(DIV, (memory.readByte(DIV) + 1) & 0xff);
    }
  };

  const update = (elapsed) => {
    updateDiv(elapsed);
    updateTimer(elapsed);
  };

  const resetDiv = () => {
    divTime = 0;
    memory[DIV] = 0;
  };

  return Object.freeze({ update, resetDiv });
};

export default createTimer;

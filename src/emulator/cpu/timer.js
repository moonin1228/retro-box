function createTimer(mediator) {
  const DIV = 0xff04;
  const TIMA = 0xff05;
  const TMA = 0xff06;
  const TAC = 0xff07;

  let timerCounter = 0;
  let dividerCounter = 0;

  function updateTimer(elapsed) {
    const memory = mediator.getComponent("memory");
    if (!memory || !(memory.readByte(TAC) & 0x04)) return;

    timerCounter += elapsed;

    const timerSpeedSelector = memory.readByte(TAC) & 0x03;
    const timaCycleThreshold = [64, 1, 4, 16][timerSpeedSelector] * 16;
    const cpu = mediator.getComponent("cpu");

    while (timerCounter >= timaCycleThreshold) {
      timerCounter -= timaCycleThreshold;

      const nextTimaValue = memory.readByte(TIMA) + 1;
      if (nextTimaValue > 0xff) {
        memory.writeByte(TIMA, memory.readByte(TMA));

        if (cpu) cpu.requestInterrupt(cpu.INTERRUPTS.TIMER);
      } else {
        memory.writeByte(TIMA, nextTimaValue);
      }
    }
  }

  function updateDiv(elapsedCycles) {
    const memory = mediator.getComponent("memory");
    if (!memory) return;

    const DIV_THRESHOLD = 256;
    dividerCounter += elapsedCycles;

    if (dividerCounter > DIV_THRESHOLD) {
      dividerCounter -= DIV_THRESHOLD;
      memory.writeByte(DIV, (memory.readByte(DIV) + 1) & 0xff);
    }
  }

  function update(elapsedCycles) {
    updateDiv(elapsedCycles);
    updateTimer(elapsedCycles);
  }

  function resetDiv() {
    const memory = mediator.getComponent("memory");
    if (!memory) return;

    dividerCounter = 0;
    memory.writeByte(DIV, 0);
  }

  return Object.freeze({ update, resetDiv });
}

export default createTimer;

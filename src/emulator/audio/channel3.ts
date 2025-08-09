interface Channel3Registers {
  NR30: number;
  NR31: number;
  NR32: number;
  NR33: number;
  NR34: number;
}

interface Channel3State {
  enabled: boolean;
  frequency: number;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;

  waveTable: Uint8Array;
  waveTablePosition: number;
  volumeCode: number;
  masterVolume: number;

  lengthCounter: number;
  lengthEnabled: boolean;

  registers: Channel3Registers;
}

export function createChannel3(audioContext: AudioContext | null) {
  const state: Channel3State = {
    enabled: false,
    frequency: 0,
    oscillator: null,
    gainNode: null,

    waveTable: new Uint8Array(32).fill(0),
    waveTablePosition: 0,
    volumeCode: 0,
    masterVolume: 1,

    lengthCounter: 0,
    lengthEnabled: false,

    registers: {
      NR30: 0,
      NR31: 0,
      NR32: 0,
      NR33: 0,
      NR34: 0,
    },
  };

  function setupOscillator(): void {
    if (!audioContext) {
      console.error("[Channel3] audioContext가 null입니다.");
      return;
    }

    if (state.oscillator) {
      state.oscillator.disconnect();
      state.oscillator = null;
    }

    state.oscillator = audioContext.createOscillator();

    const waveform = new Float32Array(32);
    for (let i = 0; i < 32; i++) {
      waveform[i] = (state.waveTable[i] / 15) * 2 - 1;
    }
    const wave = audioContext.createPeriodicWave(waveform, waveform);
    state.oscillator.setPeriodicWave(wave);

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5300, audioContext.currentTime);
    filter.Q.setValueAtTime(0.7, audioContext.currentTime);

    state.gainNode = audioContext.createGain();
    state.gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    state.oscillator.connect(filter);
    filter.connect(state.gainNode);
    state.gainNode.connect(audioContext.destination);

    state.oscillator.start();
  }

  function updateFrequency() {
    if (!state.oscillator || !audioContext) return;

    const realFrequency = 65536 / (2048 - state.frequency);

    if (realFrequency >= 20 && realFrequency <= 20000) {
      state.oscillator.frequency.setValueAtTime(realFrequency, audioContext.currentTime);
    }
  }

  function updateVolume() {
    if (!state.gainNode || !audioContext) return;
    const volumeLevels = [0, 0.25, 0.5, 0.75];
    let volume = volumeLevels[state.volumeCode] || 0;
    volume *= state.masterVolume * 0.3;

    state.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  }

  function updateWaveTable() {
    if (!audioContext) {
      console.error("[Channel3] audioContext가 null입니다.");
      return;
    }

    if (!state.oscillator) return;

    const real = new Float32Array(32);
    const imag = new Float32Array(32);

    for (let i = 0; i < 32; i++) {
      real[i] = state.waveTable[i] / 7.5 - 1;
    }

    try {
      const wave = audioContext.createPeriodicWave(real, imag, {
        disableNormalization: true,
      });
      state.oscillator.setPeriodicWave(wave);
    } catch (e) {
      console.error("[Channel3] 웨이브 테이블을 업데이트 하는데 실패했습니다.", e);
    }
  }

  function trigger() {
    if (!state.oscillator || !state.gainNode) {
      setupOscillator();
    }

    if (state.lengthCounter === 0) {
      state.lengthCounter = 256 - state.registers.NR31;
    }

    updateWaveTable();
    updateVolume();
    updateFrequency();

    state.enabled = true;
  }

  function step() {
    if (!state.enabled) return;

    if (state.lengthEnabled && state.lengthCounter > 0) {
      state.lengthCounter--;
      if (state.lengthCounter === 0) {
        disable();
      }
    }
  }

  function enable() {
    if (!state.enabled) {
      trigger();
    }
  }

  function disable() {
    if (state.oscillator) {
      state.oscillator.disconnect();
      state.oscillator = null;
    }
    if (state.gainNode) {
      state.gainNode.disconnect();
      state.gainNode = null;
    }
    state.enabled = false;
    state.lengthCounter = 0;
  }

  function readRegister(address: number) {
    switch (address) {
      case 0xff1a:
        return state.registers.NR30;
      case 0xff1b:
        return state.registers.NR31;
      case 0xff1c:
        return state.registers.NR32;
      case 0xff1d:
        return state.registers.NR33;
      case 0xff1e:
        return state.registers.NR34;
      default:
        return 0xff;
    }
  }

  function writeRegister(address: number, value: number) {
    switch (address) {
      case 0xff1a:
        state.registers.NR30 = value;
        if (!(value & 0x80)) disable();
        break;
      case 0xff1b:
        state.registers.NR31 = value;
        state.lengthCounter = 256 - value;
        break;
      case 0xff1c:
        state.registers.NR32 = value;
        state.volumeCode = (value >> 5) & 0x03;
        updateVolume();
        break;
      case 0xff1d:
        state.registers.NR33 = value;
        state.frequency = (state.frequency & 0x700) | value;
        updateFrequency();
        break;
      case 0xff1e:
        state.registers.NR34 = value;
        state.frequency = ((value & 0x07) << 8) | (state.frequency & 0xff);
        state.lengthEnabled = (value & 0x40) !== 0;
        if (value & 0x80) trigger();
        updateFrequency();
        break;
    }
  }

  function readWaveTable(address: number) {
    const index = address - 0xff30;
    return state.waveTable[index];
  }

  function writeWaveTable(address: number, value: number) {
    const index = address - 0xff30;
    state.waveTable[index] = value;
    if (state.enabled) {
      updateWaveTable();
    }
  }

  return {
    writeRegister,
    readRegister,
    readWaveTable,
    writeWaveTable,
    step,
    enable,
    disable,
    connect: () => {
      if (state.enabled) {
        setupOscillator();
      }
    },
    disconnect: () => disable(),
    setMasterVolume: (volume: number) => {
      state.masterVolume = volume;
      updateVolume();
    },
    isEnabled: () => state.enabled,
  };
}

import {
  disableChannel,
  disconnectNodes,
  setPanning,
  setupNodes,
  updateEnvelope,
  updateFrequency,
  updateLength,
  updateVolume,
} from "@/emulator/util/audioUtils.ts";

const CHANNEL2_CONSTANTS = {
  DUTY_PATTERNS: [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ],
} as const;

interface Channel2State {
  enabled: boolean;
  frequency: number;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  panNode: StereoPannerNode | null;
  filter: BiquadFilterNode | null;
  masterVolume: number;
  leftEnabled: boolean;
  rightEnabled: boolean;
  dutyCycle: number;
  channelNumber: number;

  envelopeStep: number;
  envelopeTimer: number;
  envelopeDirection: number;
  envelopeVolume: number;

  lengthCounter: number;
  lengthEnabled: boolean;

  registers: {
    NR21: number;
    NR22: number;
    NR23: number;
    NR24: number;
  };
}

interface Channel2Interface {
  writeRegister(address: number, value: number): void;
  readRegister(address: number): number;
  step(cycles: number): void;
  enable(): void;
  disable(): void;
  connect(): void;
  disconnect(): void;
  setMasterVolume(volume: number): void;
  setPanning(left: boolean, right: boolean): void;
  isEnabled(): boolean;
  updateLength(): void;
  updateEnvelope(): void;
}

export function createChannel2(audioContext: AudioContext): Channel2Interface {
  const state: Channel2State = {
    enabled: false,
    frequency: 0,
    oscillator: null,
    gainNode: null,
    panNode: null,
    filter: null,
    masterVolume: 1,
    leftEnabled: true,
    rightEnabled: true,
    dutyCycle: 2,
    channelNumber: 2,

    envelopeStep: 0,
    envelopeTimer: 0,
    envelopeDirection: 0,
    envelopeVolume: 0,

    lengthCounter: 0,
    lengthEnabled: false,

    registers: {
      NR21: 0,
      NR22: 0,
      NR23: 0,
      NR24: 0,
    },
  };

  function updateDutyCycle(): void {
    if (!state.oscillator) return;

    try {
      const pattern = CHANNEL2_CONSTANTS.DUTY_PATTERNS[state.dutyCycle];
      const real = new Float32Array(pattern.length);
      const imag = new Float32Array(pattern.length);

      for (let i = 0; i < pattern.length; i++) {
        real[i] = pattern[i] * 2 - 1;
      }

      state.oscillator.setPeriodicWave(
        audioContext.createPeriodicWave(real, imag, { disableNormalization: true }),
      );
    } catch (error) {
      console.error("[Channel2] 듀티 사이클을 업데이트 하는데 실패했습니다.", error);
    }
  }

  function setupOscillator(): void {
    try {
      if (!state.gainNode) setupNodes(state, audioContext, "Channel2");
      if (state.oscillator) {
        state.oscillator.stop();
        state.oscillator.disconnect();
      }

      state.oscillator = audioContext.createOscillator();
      state.oscillator.connect(state.filter!);
      updateDutyCycle();
      updateFrequency(state, audioContext);
      updateVolume(state, audioContext);
      state.oscillator.start();
    } catch (error) {
      console.error("[Channel2] 오실레이터를 설정하는데 실패했습니다.", error);
      state.oscillator = null;
    }
  }

  function trigger(): void {
    if (!state.oscillator) setupOscillator();
    if (state.lengthCounter === 0) {
      state.lengthCounter = 64 - (state.registers.NR21 & 0x3f);
    }

    state.envelopeTimer = 0;
    state.envelopeVolume = state.registers.NR22 >> 4;
    state.envelopeDirection = state.registers.NR22 & 0x08 ? 1 : -1;
    state.envelopeStep = state.registers.NR22 & 0x07;

    state.enabled = true;
    updateDutyCycle();
    updateVolume(state, audioContext);
    updateFrequency(state, audioContext);
  }

  function step(cycles: number): void {
    if (!state.enabled) return;
    updateLength(state, audioContext);
    updateEnvelope(state, audioContext, cycles);
  }

  function enable(): void {
    if (!state.enabled) trigger();
  }

  function disable(): void {
    disableChannel(state, "Channel2", audioContext);
  }

  function readRegister(address: number): number {
    switch (address) {
      case 0xff16:
        return state.registers.NR21;
      case 0xff17:
        return state.registers.NR22;
      case 0xff18:
        return state.registers.NR23;
      case 0xff19:
        return state.registers.NR24;
      default:
        return 0xff;
    }
  }

  function writeRegister(address: number, value: number): void {
    switch (address) {
      case 0xff16:
        state.registers.NR21 = value;
        state.dutyCycle = (value >> 6) & 0x03;
        state.lengthCounter = 64 - (value & 0x3f);
        updateDutyCycle();
        break;
      case 0xff17:
        state.registers.NR22 = value;
        if ((value & 0xf8) === 0) disable();
        updateVolume(state, audioContext);
        break;
      case 0xff18:
        state.registers.NR23 = value;
        state.frequency = (state.frequency & 0x700) | value;
        updateFrequency(state, audioContext);
        break;
      case 0xff19:
        state.registers.NR24 = value;
        state.frequency = ((value & 0x07) << 8) | (state.frequency & 0xff);
        state.lengthEnabled = (value & 0x40) !== 0;
        if (value & 0x80) trigger();
        updateFrequency(state, audioContext);
        break;
    }
  }

  function connect(): void {
    if (state.enabled) {
      setupNodes(state, audioContext, "Channel2");
      setupOscillator();
    }
  }

  function disconnect(): void {
    if (state.gainNode) {
      state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, audioContext.currentTime);
      state.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
      setTimeout(() => {
        disconnectNodes(state, "Channel2");
      }, 60);
    } else {
      disconnectNodes(state, "Channel2");
    }
  }

  return {
    writeRegister,
    readRegister,
    step,
    enable,
    disable,
    connect,
    disconnect,
    setMasterVolume: (volume: number) => {
      state.masterVolume = volume;
      updateVolume(state, audioContext);
    },
    setPanning: (left: boolean, right: boolean) => {
      state.leftEnabled = left;
      state.rightEnabled = right;
      setPanning(state, audioContext);
    },
    isEnabled: () => state.enabled,
    updateLength: () => updateLength(state),
    updateEnvelope: () => updateEnvelope(state, audioContext, 0),
  };
}

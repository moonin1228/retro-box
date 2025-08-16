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

const CHANNEL1_CONSTANTS = {
  DUTY_PATTERNS: [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ],
} as const;

interface Channel1State {
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

  sweepEnabled: boolean;
  sweepTimer: number;
  sweepTime: number;
  sweepDirection: number;
  sweepShift: number;
  shadowFrequency: number;

  lengthCounter: number;
  lengthEnabled: boolean;

  registers: {
    NR10: number;
    NR11: number;
    NR12: number;
    NR13: number;
    NR14: number;
  };
}

interface Channel1Interface {
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
  updateSweep(cycles: number): void;
  updateEnvelope(): void;
  clearBuffer(): void;
}

export function createChannel1(audioContext: AudioContext): Channel1Interface {
  const state: Channel1State = {
    enabled: false,
    frequency: 0,
    oscillator: null,
    gainNode: null,
    panNode: null,
    filter: null,
    masterVolume: 0.5,
    leftEnabled: true,
    rightEnabled: true,
    dutyCycle: 2,
    channelNumber: 1,

    envelopeStep: 0,
    envelopeTimer: 0,
    envelopeDirection: 0,
    envelopeVolume: 0,

    sweepEnabled: false,
    sweepTimer: 0,
    sweepTime: 0,
    sweepDirection: 0,
    sweepShift: 0,
    shadowFrequency: 0,

    lengthCounter: 0,
    lengthEnabled: false,

    registers: {
      NR10: 0,
      NR11: 0,
      NR12: 0,
      NR13: 0,
      NR14: 0,
    },
  };

  function updateDutyCycle(): void {
    if (!state.oscillator) return;

    try {
      const pattern = CHANNEL1_CONSTANTS.DUTY_PATTERNS[state.dutyCycle];
      const real = new Float32Array(pattern.length);
      const imag = new Float32Array(pattern.length);

      for (let i = 0; i < pattern.length; i++) {
        real[i] = pattern[i] * 2 - 1;
      }

      state.oscillator.setPeriodicWave(
        audioContext.createPeriodicWave(real, imag, { disableNormalization: true }),
      );
    } catch (error) {
      console.error("[Channel1] 듀티 사이클을 업데이트 하는데 실패했습니다.", error);
    }
  }

  function setupOscillator(): void {
    try {
      if (!state.gainNode) setupNodes(state, audioContext, "Channel1");
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
      console.error("[Channel1] 오실레이터를 세팅하는데 실패했습니다.", error);
      state.oscillator = null;
    }
  }

  function updateSweep(cycles: number): void {
    if (!state.sweepEnabled || state.sweepTime === 0) return;

    state.sweepTimer -= cycles;
    if (state.sweepTimer <= 0) {
      state.sweepTimer = state.sweepTime;

      let newFreq = state.shadowFrequency;
      newFreq = newFreq >> state.sweepShift;

      if (state.sweepDirection < 0) {
        newFreq = state.shadowFrequency - newFreq;
      } else {
        newFreq = state.shadowFrequency + newFreq;
      }

      if (newFreq > 2047) {
        disable();
        return;
      }

      if (state.sweepShift > 0) {
        state.shadowFrequency = newFreq;
        state.frequency = newFreq;
        updateFrequency(state, audioContext);
      }
    }
  }

  function trigger(): void {
    if (!state.oscillator) setupOscillator();
    if (state.lengthCounter === 0) {
      state.lengthCounter = 64 - (state.registers.NR11 & 0x3f);
    }
    state.enabled = true;
    updateDutyCycle();
    updateVolume(state, audioContext);
    updateFrequency(state, audioContext);
  }

  function step(cycles: number): void {
    if (!state.enabled) return;
    updateLength(state, audioContext);
    updateSweep(cycles);
    updateEnvelope(state, audioContext, cycles);
  }

  function enable(): void {
    if (!state.enabled) trigger();
  }

  function disable(): void {
    disableChannel(state, "Channel1", audioContext);
  }

  function setMasterVolume(volume: number): void {
    state.masterVolume = volume;
    updateVolume(state, audioContext);
  }

  function connect(): void {
    if (state.enabled) {
      setupNodes(state, audioContext, "Channel1");
      setupOscillator();
    }
  }

  function disconnect(): void {
    if (state.gainNode) {
      state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, audioContext.currentTime);
      state.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
      setTimeout(() => {
        disconnectNodes(state, "Channel1");
      }, 60);
    } else {
      disconnectNodes(state, "Channel1");
    }
  }

  function readRegister(address: number): number {
    switch (address) {
      case 0xff10:
        return state.registers.NR10;
      case 0xff11:
        return state.registers.NR11;
      case 0xff12:
        return state.registers.NR12;
      case 0xff13:
        return state.registers.NR13;
      case 0xff14:
        return state.registers.NR14;
      default:
        return 0xff;
    }
  }

  function writeRegister(address: number, value: number): void {
    switch (address) {
      case 0xff10:
        state.registers.NR10 = value;
        state.sweepTime = (value >> 4) & 0x07;
        state.sweepDirection = value & 0x08 ? -1 : 1;
        state.sweepShift = value & 0x07;
        break;

      case 0xff11:
        state.registers.NR11 = value;
        state.dutyCycle = (value >> 6) & 0x03;
        state.lengthCounter = 64 - (value & 0x3f);
        updateDutyCycle();
        break;

      case 0xff12:
        state.registers.NR12 = value;
        if ((value & 0xf8) === 0) disable();
        updateVolume(state, audioContext);
        break;
      case 0xff13:
        state.registers.NR13 = value;
        state.frequency = (state.frequency & 0x700) | value;
        updateFrequency(state, audioContext);
        break;
      case 0xff14:
        state.registers.NR14 = value;
        state.frequency = ((value & 0x07) << 8) | (state.frequency & 0xff);
        state.lengthEnabled = (value & 0x40) !== 0;
        if (value & 0x80) trigger();
        updateFrequency(state, audioContext);
        break;
    }
  }

  function clearBuffer(): void {
    try {
      if (state.oscillator) {
        state.oscillator.stop();
        state.oscillator.disconnect();
        state.oscillator = null;
      }

      state.lengthCounter = 0;
      state.envelopeTimer = 0;
      state.frequency = 0;
      state.envelopeVolume = 0;
      state.enabled = false;

      setupOscillator();
    } catch (error) {
      console.error("[Channel 1] 버퍼 초기화 중 오류 발생:", error);
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
    setMasterVolume,
    setPanning: (left: boolean, right: boolean) => {
      state.leftEnabled = left;
      state.rightEnabled = right;
      setPanning(state, audioContext);
    },
    isEnabled: () => state.enabled,
    updateLength: () => updateLength(state),
    updateSweep,
    updateEnvelope: () => updateEnvelope(state, audioContext, 0),
    clearBuffer,
  };
}

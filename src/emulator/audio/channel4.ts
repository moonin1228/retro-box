import {
  AUDIO_CONSTANTS,
  disconnectNodes,
  setPanning,
  updateEnvelope,
  updateLength,
} from "@/emulator/util/audioUtils.ts";

const CHANNEL4_CONSTANTS = {
  DIVISORS: [8, 16, 32, 48, 64, 80, 96, 112],
  LFSR: {
    INITIAL: 0x7fff,
    WIDE_TAP: 0x6000,
    NARROW_TAP: 0x60,
  },
  BUFFER_SIZE: 8192,
  NOISE_FILTER: {
    FREQUENCY: 2000,
    Q: 1.0,
  },
} as const;

interface Channel4State {
  enabled: boolean;
  dacEnabled: boolean;
  oscillator: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  panNode: StereoPannerNode | null;
  filter: BiquadFilterNode | null;
  noiseFilter: BiquadFilterNode | null;
  masterVolume: number;
  leftEnabled: boolean;
  rightEnabled: boolean;
  channelNumber: number;

  envelopeStep: number;
  envelopeTimer: number;
  envelopeDirection: number;
  envelopeVolume: number;

  lengthCounter: number;
  lengthEnabled: boolean;

  shiftClock: number;
  divisorCode: number;
  widthMode: boolean;
  lfsr: number;
  cycleCount: number;

  registers: {
    NR41: number;
    NR42: number;
    NR43: number;
    NR44: number;
  };
}

interface Channel4Interface {
  writeRegister(address: number, value: number): void;
  readRegister(address: number): number;
  step(cycles: number): void;
  enable(): void;
  disable(): void;
  connect(): void;
  disconnect(): void;
  init(): void;
  setMasterVolume(volume: number): void;
  setPanning(left: boolean, right: boolean): void;
  isEnabled(): boolean;
  updateLength(): void;
  updateEnvelope(): void;
}

export const createChannel4 = (audioContext: AudioContext): Channel4Interface => {
  const state: Channel4State = {
    enabled: false,
    dacEnabled: false,
    oscillator: null,
    gainNode: null,
    panNode: null,
    filter: null,
    noiseFilter: null,
    masterVolume: 1,
    leftEnabled: true,
    rightEnabled: true,
    channelNumber: 4,

    envelopeStep: 0,
    envelopeTimer: 0,
    envelopeDirection: 0,
    envelopeVolume: 0,

    lengthCounter: 0,
    lengthEnabled: false,

    shiftClock: 0,
    divisorCode: 0,
    widthMode: false,
    lfsr: CHANNEL4_CONSTANTS.LFSR.INITIAL as number,
    cycleCount: 0,

    registers: {
      NR41: 0,
      NR42: 0,
      NR43: 0,
      NR44: 0,
    },
  };

  const init = (): void => {
    state.enabled = false;
    state.dacEnabled = false;
    state.envelopeVolume = 0;
    state.lengthCounter = 0;
    state.lengthEnabled = false;
    state.registers.NR41 = 0;
    state.registers.NR42 = 0;
    state.registers.NR43 = 0;
    state.registers.NR44 = 0;
    disconnectNodes(state, "Channel4");
  };

  const forceStop = (): void => {
    try {
      if (state.oscillator) {
        state.oscillator.stop();
        state.oscillator.disconnect();
        state.oscillator = null;
      }
      if (state.gainNode) {
        state.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        state.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      }
      disconnectNodes(state, "Channel4");
      state.enabled = false;
      state.dacEnabled = false;
    } catch (error) {
      console.error("[Channel4] 강제로 멈추는 것을 실패했습니다.", error);
    }
  };

  const setupNodes = (): boolean => {
    try {
      disconnectNodes(state, "Channel4");

      state.gainNode = audioContext.createGain();
      state.panNode = audioContext.createStereoPanner();
      state.filter = audioContext.createBiquadFilter();
      state.noiseFilter = audioContext.createBiquadFilter();

      state.filter.type = "lowpass";
      state.filter.frequency.setValueAtTime(
        AUDIO_CONSTANTS.FILTER.FREQUENCY,
        audioContext.currentTime,
      );
      state.filter.Q.setValueAtTime(AUDIO_CONSTANTS.FILTER.Q_FACTOR, audioContext.currentTime);

      state.noiseFilter.type = "lowpass";
      state.noiseFilter.frequency.setValueAtTime(
        CHANNEL4_CONSTANTS.NOISE_FILTER.FREQUENCY,
        audioContext.currentTime,
      );
      state.noiseFilter.Q.setValueAtTime(
        CHANNEL4_CONSTANTS.NOISE_FILTER.Q,
        audioContext.currentTime,
      );

      state.filter
        .connect(state.noiseFilter)
        .connect(state.panNode)
        .connect(state.gainNode)
        .connect(audioContext.destination);

      state.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      setPanning(state, audioContext);

      return true;
    } catch (error) {
      console.error("[Channel4] 노드를 설정하는데 실패했습니다.", error);
      disconnectNodes(state, "Channel4");
      return false;
    }
  };

  const setupOscillator = (): boolean => {
    try {
      if (!state.dacEnabled || !state.enabled) return false;

      if (!state.gainNode && !setupNodes()) return false;
      if (state.oscillator) {
        state.oscillator.stop();
        state.oscillator.disconnect();
      }

      const divisor = CHANNEL4_CONSTANTS.DIVISORS[state.divisorCode] << state.shiftClock;
      const bufferSize = CHANNEL4_CONSTANTS.BUFFER_SIZE;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      let lfsr: number = CHANNEL4_CONSTANTS.LFSR.INITIAL;
      for (let i = 0; i < bufferSize; i++) {
        const xorResult = (lfsr & 1) ^ ((lfsr >> 1) & 1);
        lfsr = (lfsr >> 1) | (xorResult << 14);
        if (state.widthMode) {
          lfsr = (lfsr & ~0x40) | (xorResult << 6);
        }
        data[i] = lfsr & 1 ? 0.25 : -0.25;
      }

      state.oscillator = audioContext.createBufferSource();
      state.oscillator.buffer = buffer;
      state.oscillator.loop = true;

      const gbFrequency = 524288 / (divisor << 4);
      state.oscillator.playbackRate.setValueAtTime(
        gbFrequency / (audioContext.sampleRate / bufferSize),
        audioContext.currentTime,
      );

      state.oscillator.connect(state.filter!);
      state.oscillator.start();
      updateVolume();
      return true;
    } catch (error) {
      console.error("[Channel4] 오실레이터를 설정하는데 실패했습니다.", error);
      forceStop();
      return false;
    }
  };

  const trigger = (): void => {
    try {
      if (!state.dacEnabled) {
        forceStop();
        return;
      }

      state.enabled = true;
      if (state.lengthCounter === 0) {
        state.lengthCounter = 64 - (state.registers.NR41 & 0x3f);
      }

      state.envelopeTimer = state.envelopeStep;
      state.envelopeVolume = state.registers.NR42 >> 4;

      if (!setupOscillator()) {
        forceStop();
      }
    } catch (error) {
      console.error("[Channel4] 트리거에서 발생한 오류입니다.", error);
      forceStop();
    }
  };

  const step = (cycles: number): void => {
    if (!state.enabled || !state.dacEnabled) return;

    try {
      updateLength(state, audioContext);
      updateEnvelope(state, audioContext, cycles);

      if (state.lengthEnabled && state.lengthCounter === 0) {
        forceStop();
        return;
      }

      const divisor = CHANNEL4_CONSTANTS.DIVISORS[state.divisorCode];
      const shiftAmount = state.shiftClock;
      const clockFreq = 4194304 / (divisor << shiftAmount);
      const cyclesPerSample = 4194304 / clockFreq;

      state.cycleCount = (state.cycleCount || 0) + cycles;
      if (state.cycleCount >= cyclesPerSample) {
        state.cycleCount -= cyclesPerSample;
        updateVolume();
      }
    } catch (error) {
      console.error("[Channel4] step에서 발생한 오류입니다.", error);
      forceStop();
    }
  };

  const enable = (): void => {
    try {
      state.enabled = true;
      trigger();
    } catch (error) {
      console.error("[Channel4] enable에서 발생한 오류입니다.", error);
    }
  };

  const updateVolume = (): void => {
    if (!state.gainNode) return;

    let volume = state.envelopeVolume / 15;

    volume *= state.masterVolume * 0.3;

    state.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  };

  const writeRegister = (addr: number, value: number): void => {
    try {
      switch (addr) {
        case 0xff20:
          state.registers.NR41 = value & 0x3f;
          state.lengthCounter = 64 - (value & 0x3f);
          break;

        case 0xff21: {
          const prevDacEnabled = state.dacEnabled;
          state.registers.NR42 = value;
          state.dacEnabled = (value & 0xf8) !== 0;

          if (prevDacEnabled && !state.dacEnabled) {
            forceStop();
            return;
          }

          state.envelopeVolume = value >> 4;
          state.envelopeDirection = value & 0x08 ? 1 : -1;
          state.envelopeStep = value & 0x07;
          state.envelopeTimer = state.envelopeStep;

          if (state.enabled && state.dacEnabled) {
            updateVolume();
          }
          break;
        }

        case 0xff22: {
          state.registers.NR43 = value;
          const prevShiftClock = state.shiftClock;
          const prevDivisorCode = state.divisorCode;

          state.shiftClock = value >> 4;
          state.widthMode = (value & 0x08) !== 0;
          state.divisorCode = value & 0x07;

          if (
            state.enabled &&
            state.dacEnabled &&
            (prevShiftClock !== state.shiftClock || prevDivisorCode !== state.divisorCode)
          ) {
            setupOscillator();
          }
          break;
        }

        case 0xff23: {
          const prevEnabled = state.enabled;
          state.registers.NR44 = value;
          state.lengthEnabled = (value & 0x40) !== 0;

          if (value & 0x80) {
            if (!prevEnabled) {
              trigger();
            } else {
              updateVolume();
            }
          } else if (state.lengthEnabled && state.lengthCounter === 0) {
            forceStop();
          }
          break;
        }
      }
    } catch (error) {
      console.error("[Channel4] 레지스터를 작성하는데 발생한 오류입니다.", error);
      forceStop();
    }
  };

  const readRegister = (addr: number): number => {
    switch (addr) {
      case 0xff20:
        return state.registers.NR41;
      case 0xff21:
        return state.registers.NR42;
      case 0xff22:
        return state.registers.NR43;
      case 0xff23:
        return state.registers.NR44;
      default:
        return 0xff;
    }
  };

  const connect = (): void => {
    if (state.enabled) {
      setupNodes();
      setupOscillator();
    }
  };

  const disconnect = (): void => {
    if (state.gainNode) {
      state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, audioContext.currentTime);
      state.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
      setTimeout(() => {
        disconnectNodes(state, "Channel4");
      }, 60);
    } else {
      disconnectNodes(state, "Channel4");
    }
  };

  return {
    writeRegister,
    readRegister,
    step,
    enable,
    disable: forceStop,
    connect,
    disconnect,
    init,
    setMasterVolume: (volume: number) => {
      state.masterVolume = volume;
      if (state.enabled && state.dacEnabled && state.gainNode) {
        updateVolume();
      }
    },
    setPanning: (left: boolean, right: boolean) => {
      state.leftEnabled = left;
      state.rightEnabled = right;
      if (state.panNode) {
        setPanning(state, audioContext);
      }
    },
    isEnabled: () => state.enabled && state.dacEnabled,
    updateLength: () => updateLength(state, audioContext),
    updateEnvelope: () => updateEnvelope(state, audioContext, 0),
  };
};

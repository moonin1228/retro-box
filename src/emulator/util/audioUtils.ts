interface AudioState {
  oscillator: OscillatorNode | AudioBufferSourceNode | null;
  filter: BiquadFilterNode | null;
  panNode: StereoPannerNode | null;
  gainNode: GainNode | null;
  masterVolume: number;
  leftEnabled: boolean;
  rightEnabled: boolean;
  envelopeVolume: number;
  frequency?: number;
  enabled: boolean;
  lengthCounter: number;
  lengthEnabled: boolean;
  envelopeTimer: number;
  envelopeStep?: number;
  envelopeDirection?: number;
}

export const AUDIO_CONSTANTS = {
  FILTER: {
    FREQUENCY: 5300,
    Q_FACTOR: 0.7871,
  },
  VOLUME: {
    MAX: 15,
    SCALE: 0.3,
  },
  FREQUENCY: {
    MIN: 20,
    MAX: 20000,
  },
} as const;

export const disconnectNodes = (state: AudioState, channelName: string): void => {
  try {
    [state.oscillator, state.filter, state.panNode, state.gainNode].forEach((node) => {
      if (node) {
        if ('stop' in node) node.stop();
        node.disconnect();
      }
    });
    state.oscillator = state.filter = state.panNode = state.gainNode = null;
  } catch (error) {
    console.error(`[${channelName}] Error disconnecting nodes:`, error);
  }
};

export const setupNodes = (state: AudioState, audioContext: AudioContext, channelName: string): void => {
  try {
    disconnectNodes(state, channelName);

    state.gainNode = audioContext.createGain();
    state.panNode = audioContext.createStereoPanner();
    state.filter = audioContext.createBiquadFilter();

    state.filter.type = "lowpass";
    state.filter.frequency.value = AUDIO_CONSTANTS.FILTER.FREQUENCY;
    state.filter.Q.value = AUDIO_CONSTANTS.FILTER.Q_FACTOR;

    state.filter.connect(state.panNode).connect(state.gainNode).connect(audioContext.destination);
    setPanning(state, audioContext);
  } catch (error) {
    console.error(`[${channelName}] Error setting up nodes:`, error);
  }
};

export const updateVolume = (state: AudioState, audioContext: AudioContext): void => {
  if (!state.gainNode) return;
  let volume = Math.max(0, Math.min(state.envelopeVolume, AUDIO_CONSTANTS.VOLUME.MAX));
  volume =
    (volume / AUDIO_CONSTANTS.VOLUME.MAX) * state.masterVolume * AUDIO_CONSTANTS.VOLUME.SCALE;
  state.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
};

export const setPanning = (state: AudioState, audioContext: AudioContext): void => {
  if (!state.panNode) return;

  let panValue = 0;
  if (!state.leftEnabled && state.rightEnabled) {
    panValue = 1;
  } else if (state.leftEnabled && !state.rightEnabled) {
    panValue = -1;
  }

  state.panNode.pan.setValueAtTime(panValue, audioContext.currentTime);
};

export const updateFrequency = (state: AudioState, audioContext: AudioContext, divider = 32): void => {
  if (!state.oscillator || !('frequency' in state.oscillator) || state.frequency === undefined) return;

  const realFrequency = 4194304 / divider / (2048 - state.frequency);
  if (
    realFrequency >= AUDIO_CONSTANTS.FREQUENCY.MIN &&
    realFrequency <= AUDIO_CONSTANTS.FREQUENCY.MAX
  ) {
    state.oscillator.frequency.setValueAtTime(realFrequency, audioContext.currentTime);
  }
};

export const disableChannel = (state: AudioState, channelName: string, audioContext: AudioContext): void => {
  if (state.gainNode) {
    state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, audioContext.currentTime);
    state.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
    setTimeout(() => {
      disconnectNodes(state, channelName);
    }, 60);
  } else {
    disconnectNodes(state, channelName);
  }
  state.enabled = false;
  state.lengthCounter = 0;
  state.envelopeTimer = 0;
};

export const updateLength = (state: AudioState, audioContext?: AudioContext): void => {
  if (state.lengthEnabled && state.lengthCounter > 0) {
    state.lengthCounter--;
    if (state.lengthCounter === 0) {
      state.enabled = false;
      if (state.gainNode) {
        state.gainNode.gain.setValueAtTime(state.gainNode.gain.value, audioContext?.currentTime || 0);
        state.gainNode.gain.linearRampToValueAtTime(0, (audioContext?.currentTime || 0) + 0.05);
      }
    }
  }
};

export const updateEnvelope = (state: AudioState, audioContext: AudioContext, cycles: number): void => {
  if (!state.enabled || state.envelopeStep === undefined || state.envelopeDirection === undefined) return;

  state.envelopeTimer += cycles;
  const envelopePeriod = state.envelopeStep === 0 ? 8 : state.envelopeStep * 8;

  if (state.envelopeTimer >= envelopePeriod) {
    state.envelopeTimer = 0;

    if (state.envelopeDirection > 0) {
      if (state.envelopeVolume < AUDIO_CONSTANTS.VOLUME.MAX) {
        state.envelopeVolume++;
      }
    } else if (state.envelopeDirection < 0) {
      if (state.envelopeVolume > 0) {
        state.envelopeVolume--;
      } else {
        state.enabled = false;
        if (state.gainNode) {
          state.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        }
      }
    }

    updateVolume(state, audioContext);
  }
};

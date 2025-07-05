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
};

export const disconnectNodes = (state, channelName) => {
  try {
    [state.oscillator, state.filter, state.panNode, state.gainNode].forEach((node) => {
      if (node) {
        if (node.stop) node.stop();
        node.disconnect();
      }
    });
    state.oscillator = state.filter = state.panNode = state.gainNode = null;
  } catch (error) {
    console.error(`[${channelName}] Error disconnecting nodes:`, error);
  }
};

export const setupNodes = (state, audioContext, channelName) => {
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

export const updateVolume = (state, audioContext) => {
  if (!state.gainNode) return;
  let volume = Math.max(0, Math.min(state.envelopeVolume, AUDIO_CONSTANTS.VOLUME.MAX));
  volume =
    (volume / AUDIO_CONSTANTS.VOLUME.MAX) * state.masterVolume * AUDIO_CONSTANTS.VOLUME.SCALE;
  state.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
};

export const setPanning = (state, audioContext) => {
  if (!state.panNode) return;

  let panValue = 0;
  if (!state.leftEnabled && state.rightEnabled) {
    panValue = 1;
  } else if (state.leftEnabled && !state.rightEnabled) {
    panValue = -1;
  }

  state.panNode.pan.setValueAtTime(panValue, audioContext.currentTime);
};

export const updateFrequency = (state, audioContext, divider = 32) => {
  if (!state.oscillator) return;

  const realFrequency = 4194304 / divider / (2048 - state.frequency);
  if (
    realFrequency >= AUDIO_CONSTANTS.FREQUENCY.MIN &&
    realFrequency <= AUDIO_CONSTANTS.FREQUENCY.MAX
  ) {
    state.oscillator.frequency.setValueAtTime(realFrequency, audioContext.currentTime);
  }
};

export const disableChannel = (state, channelName, audioContext) => {
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

export const updateLength = (state, audioContext) => {
  if (state.lengthEnabled && state.lengthCounter > 0) {
    state.lengthCounter--;
    if (state.lengthCounter === 0) {
      disableChannel(state, `Channel${state.channelNumber}`, audioContext);
    }
  }
};

export const updateEnvelope = (state, audioContext, cycles) => {
  if (state.envelopeStep > 0) {
    state.envelopeTimer -= cycles;
    if (state.envelopeTimer <= 0) {
      state.envelopeTimer = state.envelopeStep;
      const newVolume = state.envelopeVolume + state.envelopeDirection;
      if (newVolume >= 0 && newVolume <= AUDIO_CONSTANTS.VOLUME.MAX) {
        state.envelopeVolume = newVolume;
        updateVolume(state, audioContext);
      }
    }
  }
};

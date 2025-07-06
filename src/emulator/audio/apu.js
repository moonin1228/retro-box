import { createChannel1 } from "@/emulator/audio/channel1.js";
import { createChannel2 } from "@/emulator/audio/channel2.js";
import { createChannel3 } from "@/emulator/audio/channel3.js";
import { createChannel4 } from "@/emulator/audio/channel4.js";

const APU_CONSTANTS = {
  CPU_CLOCK: 4194304,
  CYCLES_PER_FRAME_SEQUENCER: 8192,
  REGISTERS: {
    NR50: 0xff24,
    NR51: 0xff25,
    NR52: 0xff26,
  },
  INITIAL_NR52: 0x80,
  FRAME_SEQUENCER: {
    LENGTH_COUNTER: [0, 4],
    SWEEP: [2, 6],
    ENVELOPE: [7],
  },
};

const handleChannelRegister = (channels, address, value) => {
  if (address >= 0xff10 && address <= 0xff14 && channels.channel1) {
    channels.channel1.writeRegister(address, value);
  } else if (address >= 0xff15 && address <= 0xff19 && channels.channel2) {
    channels.channel2.writeRegister(address, value);
  } else if (address >= 0xff1a && address <= 0xff1e && channels.channel3) {
    channels.channel3.writeRegister(address, value);
  } else if (address >= 0xff1f && address <= 0xff23 && channels.channel4) {
    channels.channel4.writeRegister(address, value);
  }
};

const getChannelStatus = (channels) => {
  let status = 0;
  if (channels.channel1?.isEnabled()) status |= 0x01;
  if (channels.channel2?.isEnabled()) status |= 0x02;
  if (channels.channel3?.isEnabled()) status |= 0x04;
  if (channels.channel4?.isEnabled()) status |= 0x08;
  return status;
};

const handleNR52Write = (state, value, registers, channels) => {
  const wasEnabled = (registers.NR52 & 0x80) !== 0;
  const willBeEnabled = (value & 0x80) !== 0;

  if (!wasEnabled && willBeEnabled) {
    if (!state.initialized) state.init();
    registers.NR52 = 0x80;

    Object.values(channels).forEach((channel) => {
      if (channel.init) {
        channel.init();
        channel.disable?.();
      }
    });
  } else if (wasEnabled && !willBeEnabled) {
    registers.NR52 = 0;

    Object.values(channels).forEach((channel) => {
      if (channel.disable) channel.disable();
    });
    state.reset();
  }
};

const readChannelRegister = (channels, address) => {
  if (address >= 0xff10 && address <= 0xff14) return channels.channel1.readRegister(address);
  if (address >= 0xff15 && address <= 0xff19) return channels.channel2.readRegister(address);
  if (address >= 0xff1a && address <= 0xff1e) return channels.channel3.readRegister(address);
  if (address >= 0xff1f && address <= 0xff23) return channels.channel4.readRegister(address);
  return 0xff;
};

const createApu = () => {
  const state = {
    audioContext: null,
    channels: null,
    initialized: false,
    isConnected: false,
    frameSequencer: 0,
    frameSequencerClock: 0,
    init,
    reset,
  };

  const registers = {
    NR50: 0,
    NR51: 0,
    NR52: APU_CONSTANTS.INITIAL_NR52,
  };

  const createAudioContext = () => {
    try {
      return new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error("[APU] Failed to create AudioContext:", error);
      return null;
    }
  };

  function init() {
    try {
      if (state.initialized) return true;

      state.audioContext = createAudioContext();
      if (!state.audioContext) {
        console.error("Failed to create AudioContext");
        return false;
      }

      state.channels = {
        channel1: createChannel1(state.audioContext),
        channel2: createChannel2(state.audioContext),
        channel3: createChannel3(state.audioContext),
        channel4: createChannel4(state.audioContext),
      };

      Object.values(state.channels).forEach((channel) => channel.init?.());

      state.frameSequencer = 0;
      state.frameSequencerClock = 0;
      state.initialized = true;
      registers.NR52 |= 0x80;
      return true;
    } catch (error) {
      console.error("Failed to initialize audio system:", error);
      state.initialized = false;
      return false;
    }
  }

  function reset() {
    try {
      if (!state.initialized && !init()) return;

      if (state.channels) {
        Object.values(state.channels).forEach((channel) => {
          if (channel.disable) channel.disable();
        });
      }

      registers.NR50 = 0;
      registers.NR51 = 0;
      registers.NR52 = 0;

      if (state.channels) {
        Object.values(state.channels).forEach((channel) => {
          try {
            if (channel.init) channel.init();
          } catch (error) {
            console.error("[APU] Error resetting channel:", error);
          }
        });
      }

      state.frameSequencer = 0;
      state.frameSequencerClock = 0;
    } catch (error) {
      console.error("[APU] Error resetting audio system:", error);
      state.initialized = false;
    }
  }

  const updateMasterVolume = () => {
    if (!state.initialized) return;

    const leftVol = ((registers.NR50 >> 4) & 0x7) / 7;
    const rightVol = (registers.NR50 & 0x7) / 7;
    const masterVol = Math.max(leftVol, rightVol);

    Object.values(state.channels).forEach((channel) => {
      channel.setMasterVolume?.(masterVol);
    });
  };

  const updatePanning = () => {
    try {
      if (!state.initialized) return;

      const value = registers.NR51;
      const channelMasks = {
        channel1: { left: 0x10, right: 0x01 },
        channel2: { left: 0x20, right: 0x02 },
        channel3: { left: 0x40, right: 0x04 },
        channel4: { left: 0x80, right: 0x08 },
      };

      Object.entries(state.channels).forEach(([name, channel]) => {
        if (!channel.setPanning) return;
        const mask = channelMasks[name];
        channel.setPanning((value & mask.left) !== 0, (value & mask.right) !== 0);
      });
    } catch (error) {
      console.error("[APU] Error updating panning:", error);
    }
  };

  const writeRegister = (address, value) => {
    if (!state.initialized && address !== APU_CONSTANTS.REGISTERS.NR52) {
      if (!init()) return;
    }

    try {
      if (!(registers.NR52 & 0x80) && address !== APU_CONSTANTS.REGISTERS.NR52) {
        return;
      }

      switch (address) {
        case APU_CONSTANTS.REGISTERS.NR50:
          registers.NR50 = value;
          updateMasterVolume();
          break;

        case APU_CONSTANTS.REGISTERS.NR51:
          registers.NR51 = value;
          updatePanning();
          break;

        case APU_CONSTANTS.REGISTERS.NR52:
          handleNR52Write(state, value, registers, state.channels);
          break;

        default:
          try {
            handleChannelRegister(state.channels, address, value);
          } catch (error) {
            console.error(
              `[APU] Error writing to channel register ${address.toString(16)}:`,
              error,
            );
          }
      }
    } catch (error) {
      console.error(`[APU] Error writing to register ${address.toString(16)}:`, error);
    }
  };

  const readRegister = (address) => {
    try {
      if (!state.initialized) return 0xff;

      if (!(registers.NR52 & 0x80) && address !== APU_CONSTANTS.REGISTERS.NR52) {
        return 0xff;
      }

      try {
        const channelRegValue = readChannelRegister(state.channels, address);
        if (channelRegValue !== 0xff) return channelRegValue;
      } catch (error) {
        console.error(`[APU] Error reading from channel register ${address.toString(16)}:`, error);
        return 0xff;
      }

      switch (address) {
        case APU_CONSTANTS.REGISTERS.NR50:
          return registers.NR50;
        case APU_CONSTANTS.REGISTERS.NR51:
          return registers.NR51;
        case APU_CONSTANTS.REGISTERS.NR52:
          return registers.NR52 | getChannelStatus(state.channels);
        default:
          return 0xff;
      }
    } catch (error) {
      console.error(`[APU] Error reading register ${address.toString(16)}:`, error);
      return 0xff;
    }
  };

  const step = (cycles) => {
    if (!state.initialized || !(registers.NR52 & 0x80)) return;

    try {
      state.frameSequencerClock += cycles;
      while (state.frameSequencerClock >= APU_CONSTANTS.CYCLES_PER_FRAME_SEQUENCER) {
        state.frameSequencerClock -= APU_CONSTANTS.CYCLES_PER_FRAME_SEQUENCER;

        if (APU_CONSTANTS.FRAME_SEQUENCER.LENGTH_COUNTER.includes(state.frameSequencer)) {
          Object.values(state.channels).forEach((channel) => channel.updateLength?.());
        }

        if (APU_CONSTANTS.FRAME_SEQUENCER.SWEEP.includes(state.frameSequencer)) {
          state.channels.channel1.updateSweep?.();
        }

        if (APU_CONSTANTS.FRAME_SEQUENCER.ENVELOPE.includes(state.frameSequencer)) {
          Object.values(state.channels).forEach((channel) => channel.updateEnvelope?.());
        }

        state.frameSequencer = (state.frameSequencer + 1) & 7;
      }

      Object.values(state.channels).forEach((channel) => channel.step?.(cycles));
    } catch (error) {
      console.error("[APU] Error in step:", error);
    }
  };

  const connect = () => {
    try {
      if (!state.initialized) {
        init();
      }
      if (!state.isConnected) {
        Object.values(state.channels).forEach((channel) => {
          if (channel.connect) channel.connect();
        });
        state.isConnected = true;
      }
    } catch (error) {
      console.error("[APU] Error connecting audio:", error);
    }
  };

  const disconnect = () => {
    try {
      if (state.isConnected) {
        Object.values(state.channels).forEach((channel) => {
          if (channel.disable) channel.disable();
          if (channel.disconnect) channel.disconnect();
        });
        state.isConnected = false;
      }
    } catch (error) {
      console.error("[APU] Error disconnecting audio:", error);
    }
  };

  return {
    writeRegister,
    readRegister,
    reset,
    step,
    connect,
    disconnect,
  };
};

export default createApu;

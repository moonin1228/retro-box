import { APU_CONSTANTS } from "@/constants/audioConstants.js";
import { createChannel1 } from "@/emulator/audio/channel1.js";
import { createChannel2 } from "@/emulator/audio/channel2.js";
import { createChannel3 } from "@/emulator/audio/channel3.js";
import { createChannel4 } from "@/emulator/audio/channel4.js";

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
    masterVolume: 0,
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
      console.error("[APU] audioContext 생성에 실패했습니다.", error);
      return null;
    }
  };

  function init() {
    try {
      if (state.initialized) return true;

      state.audioContext = createAudioContext();
      if (!state.audioContext) {
        console.error("[APU] audioContext 생성에 실패했습니다.");
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
      console.error("[APU] 오디오 시스템 초기화에 실패했습니다.", error);
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
            console.error("[APU] 재설정 채널 에러", error);
          }
        });
      }

      state.frameSequencer = 0;
      state.frameSequencerClock = 0;
    } catch (error) {
      console.error("[APU] APU를 재설정하는데 실패했습니다.", error);
      state.initialized = false;
    }
  }

  const updateMasterVolume = () => {
    if (!state.initialized) return;

    const leftVol = ((registers.NR50 >> 4) & 0x7) / 7;
    const rightVol = (registers.NR50 & 0x7) / 7;
    const masterVol = Math.max(leftVol, rightVol);

    state.masterVolume = masterVol;
    Object.values(state.channels).forEach((channel) => {
      if (channel && channel.setMasterVolume) {
        channel.setMasterVolume(masterVol);
      }
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
      console.error("[APU] 패닝 업데이트 에러", error);
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
              `[APU] 채널 레지스터에 쓰는 것을 실패했습니다. ${address.toString(16)}:`,
              error,
            );
          }
      }
    } catch (error) {
      console.error(
        `[APU] 채널 레지스터에 쓰는 것을 실패했습니다. ${address.toString(16)}:`,
        error,
      );
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
        console.error(
          `[APU]채널 레지스터를 읽는 것을 실패했습니다. ${address.toString(16)}:`,
          error,
        );
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
      console.error(
        `[APU] 채널 레지스터를 읽는 것을 실패했습니다. ${address.toString(16)}:`,
        error,
      );
      return 0xff;
    }
  };

  const step = (cycles) => {
    if (!state.initialized || !(registers.NR52 & 0x80)) return;

    try {
      state.frameSequencerClock += cycles;
      while (state.frameSequencerClock >= APU_CONSTANTS.CYCLES_PER_FRAME_SEQUENCER) {
        state.frameSequencerClock -= APU_CONSTANTS.CYCLES_PER_FRAME_SEQUENCER;

        updateMasterVolume();

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
      console.error("[APU] 채널 step 에러", error);
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
      console.error("[APU] 오디오 연결에 실패했습니다.", error);
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
      console.error("[APU] 오디오 연결 해제를 실패했습니다.", error);
    }
  };

  return {
    writeRegister,
    readRegister,
    reset,
    step,
    connect,
    disconnect,
    getMasterVolume: () => state.masterVolume,
  };
};

export default createApu;

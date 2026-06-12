import { DrumSynthConfig } from '@/types';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { playDrumSound } from '@/utils/audioUtils';

export interface AudioEngineState {
  audioContext: AudioContext | null;
  masterGain: GainNode | null;
  gainNodes: Map<string, GainNode>;
  playbackStartTime: number;
  loopStartAudioTime: number;
  loopStartPerfTime: number;
  scheduledNoteIds: Set<string>;
  drumVolumes: Record<string, number>;
}

const state: AudioEngineState = {
  audioContext: null,
  masterGain: null,
  gainNodes: new Map(),
  playbackStartTime: 0,
  loopStartAudioTime: 0,
  loopStartPerfTime: 0,
  scheduledNoteIds: new Set(),
  drumVolumes: {},
};

let onAudioContextCreated: ((ctx: AudioContext) => void) | null = null;

export function setAudioContextCreatedCallback(callback: (ctx: AudioContext) => void) {
  onAudioContextCreated = callback;
}

export function setDrumVolumes(volumes: Record<string, number>) {
  state.drumVolumes = { ...volumes };
  if (state.audioContext) {
    state.gainNodes.forEach((gainNode, drumId) => {
      const volume = state.drumVolumes[drumId];
      if (volume !== undefined) {
        gainNode.gain.setTargetAtTime(volume, state.audioContext!.currentTime, 0.01);
      }
    });
  }
}

export function ensureAudioContext(): AudioContext | null {
  if (!state.audioContext) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    state.audioContext = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
    state.masterGain = masterGain;

    const gains = new Map<string, GainNode>();
    DRUM_CONFIGS.forEach(drum => {
      const gain = ctx.createGain();
      const vol = state.drumVolumes[drum.id] ?? drum.defaultVolume;
      gain.gain.value = vol;
      gain.connect(masterGain);
      gains.set(drum.id, gain);
    });
    state.gainNodes = gains;

    (window as any).__drumGainNodes = gains;
    (window as any).__drumAudioContext = ctx;

    if (onAudioContextCreated) {
      onAudioContextCreated(ctx);
    }
  }

  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }

  return state.audioContext;
}

export function getAudioContext(): AudioContext | null {
  return state.audioContext;
}

export function getGainNodes(): Map<string, GainNode> {
  return state.gainNodes;
}

export function setPlaybackStartTime(perfTime: number) {
  state.playbackStartTime = perfTime;
}

export function setLoopStartTime(audioTime: number, perfTime: number) {
  state.loopStartAudioTime = audioTime;
  state.loopStartPerfTime = perfTime;
  state.playbackStartTime = perfTime;
}

export function getLoopStartPerfTime(): number {
  return state.loopStartPerfTime;
}

export function getLoopStartAudioTime(): number {
  return state.loopStartAudioTime;
}

export function getScheduledNoteIds(): Set<string> {
  return state.scheduledNoteIds;
}

export function getCurrentPlayheadTime(
  rhythmDuration: number,
  playbackSpeed: number,
  isLooping: boolean,
  recordingUsesPlayhead: boolean
): number {
  if (!isLooping || !recordingUsesPlayhead || rhythmDuration <= 0) return 0;

  const elapsed = performance.now() - state.loopStartPerfTime;
  const adjustedDuration = rhythmDuration / playbackSpeed;

  if (adjustedDuration <= 0) return 0;

  const loopElapsed = ((elapsed % adjustedDuration) + adjustedDuration) % adjustedDuration;
  return loopElapsed * playbackSpeed;
}

export function playDrumLive(drumId: string, velocity: number = 1): boolean {
  const ctx = ensureAudioContext();
  if (!ctx) return false;

  const drumConfig = DRUM_CONFIGS.find(d => d.id === drumId);
  if (!drumConfig) return false;

  const gainNode = state.gainNodes.get(drumId);
  if (!gainNode) return false;

  playDrumSound(
    ctx,
    drumConfig.synth as DrumSynthConfig,
    gainNode,
    velocity,
    ctx.currentTime
  );

  return true;
}

export function scheduleDrumAt(drumId: string, velocity: number, audioTime: number): boolean {
  const ctx = state.audioContext;
  if (!ctx) return false;

  const drumConfig = DRUM_CONFIGS.find(d => d.id === drumId);
  if (!drumConfig) return false;

  const gainNode = state.gainNodes.get(drumId);
  if (!gainNode) return false;

  playDrumSound(
    ctx,
    drumConfig.synth as DrumSynthConfig,
    gainNode,
    velocity,
    audioTime
  );

  return true;
}

export function clearScheduledNotes() {
  state.scheduledNoteIds.clear();
}

import { create } from 'zustand';
import { RhythmData, Note } from '@/types';
import { DRUM_CONFIGS, DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, DEFAULT_PLAYBACK_SPEED } from '@/utils/drumConfig';

interface DrumState {
  audioContext: AudioContext | null;
  setAudioContext: (ctx: AudioContext | null) => void;

  activePads: Set<string>;
  triggerPad: (drumId: string) => void;
  releasePad: (drumId: string) => void;

  drumVolumes: Record<string, number>;
  setDrumVolume: (drumId: string, volume: number) => void;
  setAllDrumVolumes: (volumes: Record<string, number>) => void;

  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  isRecording: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  rhythm: RhythmData | null;
  recordingStartTime: number;
  scheduledTimeouts: number[];

  startRecording: () => void;
  stopRecording: () => void;
  startPlayback: (loop?: boolean) => void;
  stopPlayback: () => void;
  toggleLooping: () => void;
  addNote: (note: Note) => void;
  addScheduledTimeout: (id: number) => void;
  clearScheduledTimeouts: () => void;
  clearRhythm: () => void;
  setRhythm: (rhythm: RhythmData | null) => void;

  metronomeEnabled: boolean;
  metronomeBpm: number;
  metronomeTimeSignature: string;
  metronomeCurrentBeat: number;
  setMetronomeEnabled: (enabled: boolean) => void;
  setMetronomeBpm: (bpm: number) => void;
  setMetronomeTimeSignature: (ts: string) => void;
  setMetronomeCurrentBeat: (beat: number) => void;
}

const initialVolumes: Record<string, number> = {};
DRUM_CONFIGS.forEach(drum => {
  initialVolumes[drum.id] = drum.defaultVolume;
});

export const useDrumStore = create<DrumState>((set, get) => ({
  audioContext: null,
  setAudioContext: (ctx) => set({ audioContext: ctx }),

  activePads: new Set(),
  triggerPad: (drumId) => {
    const newSet = new Set(get().activePads);
    newSet.add(drumId);
    set({ activePads: newSet });
  },
  releasePad: (drumId) => {
    const newSet = new Set(get().activePads);
    newSet.delete(drumId);
    set({ activePads: newSet });
  },

  drumVolumes: initialVolumes,
  setDrumVolume: (drumId, volume) => {
    set(state => ({
      drumVolumes: { ...state.drumVolumes, [drumId]: volume }
    }));
  },
  setAllDrumVolumes: (volumes) => set({ drumVolumes: volumes }),

  playbackSpeed: DEFAULT_PLAYBACK_SPEED,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  isRecording: false,
  isPlaying: false,
  isLooping: false,
  rhythm: null,
  recordingStartTime: 0,
  scheduledTimeouts: [],

  startRecording: () => {
    const now = performance.now();
    set({
      isRecording: true,
      recordingStartTime: now,
      isPlaying: false,
      scheduledTimeouts: [],
      rhythm: get().rhythm || {
        version: '1.0',
        name: '我的节奏',
        createdAt: Date.now(),
        duration: 0,
        bpm: get().metronomeBpm,
        timeSignature: get().metronomeTimeSignature,
        notes: [],
        drumVolumes: { ...get().drumVolumes }
      }
    });
  },

  stopRecording: () => {
    const state = get();
    if (state.rhythm) {
      const duration = performance.now() - state.recordingStartTime;
      set({
        isRecording: false,
        rhythm: { ...state.rhythm, duration }
      });
    } else {
      set({ isRecording: false });
    }
  },

  startPlayback: (loop = false) => {
    set({ isPlaying: true, isLooping: loop, scheduledTimeouts: [] });
  },

  stopPlayback: () => {
    const state = get();
    state.scheduledTimeouts.forEach(id => clearTimeout(id));
    set({ isPlaying: false, isLooping: false, scheduledTimeouts: [] });
  },

  toggleLooping: () => set(state => ({ isLooping: !state.isLooping })),

  addNote: (note) => {
    const state = get();
    if (state.rhythm) {
      set({
        rhythm: {
          ...state.rhythm,
          notes: [...state.rhythm.notes, note]
        }
      });
    } else {
      set({
        rhythm: {
          version: '1.0',
          name: '我的节奏',
          createdAt: Date.now(),
          duration: note.time + 100,
          bpm: state.metronomeBpm,
          timeSignature: state.metronomeTimeSignature,
          notes: [note],
          drumVolumes: { ...state.drumVolumes }
        }
      });
    }
  },

  addScheduledTimeout: (id) => {
    set(state => ({
      scheduledTimeouts: [...state.scheduledTimeouts, id]
    }));
  },

  clearScheduledTimeouts: () => {
    set({ scheduledTimeouts: [] });
  },

  clearRhythm: () => set({ rhythm: null, isPlaying: false, isLooping: false }),
  setRhythm: (rhythm) => set({ rhythm }),

  metronomeEnabled: false,
  metronomeBpm: DEFAULT_BPM,
  metronomeTimeSignature: DEFAULT_TIME_SIGNATURE,
  metronomeCurrentBeat: 0,
  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  setMetronomeBpm: (bpm) => set({ metronomeBpm: bpm }),
  setMetronomeTimeSignature: (ts) => set({ metronomeTimeSignature: ts }),
  setMetronomeCurrentBeat: (beat) => set({ metronomeCurrentBeat: beat })
}));

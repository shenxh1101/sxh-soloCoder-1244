import { create } from 'zustand';
import { RhythmData, Note, LoadErrorType, LoadError, TimelineSelection } from '@/types';
import { DRUM_CONFIGS, DEFAULT_BPM, DEFAULT_TIME_SIGNATURE, DEFAULT_PLAYBACK_SPEED, TIME_SIGNATURES } from '@/utils/drumConfig';

function generateNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRhythmId(): string {
  return `rhythm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
  recordingUsesPlayhead: boolean;
  scheduledTimeouts: number[];
  scheduledAudioIds: number[];

  startRecording: (withCountIn?: boolean, forcePlayhead?: boolean) => void;
  stopRecording: () => void;
  startPlayback: (loop?: boolean) => void;
  stopPlayback: () => void;
  toggleLooping: () => void;
  addNote: (note: Omit<Note, 'id'>) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
  addScheduledTimeout: (id: number) => void;
  addScheduledAudioId: (id: number) => void;
  clearScheduledTimeouts: () => void;
  clearRhythm: () => void;
  setRhythm: (rhythm: RhythmData | null) => void;

  metronomeEnabled: boolean;
  metronomeBpm: number;
  metronomeTimeSignature: string;
  metronomeCurrentBeat: number;
  countInEnabled: boolean;
  countInBars: number;
  isCountingIn: boolean;
  setMetronomeEnabled: (enabled: boolean) => void;
  setMetronomeBpm: (bpm: number) => void;
  setMetronomeTimeSignature: (ts: string) => void;
  setMetronomeCurrentBeat: (beat: number) => void;
  setCountInEnabled: (enabled: boolean) => void;
  setCountInBars: (bars: number) => void;
  setIsCountingIn: (isCounting: boolean) => void;

  loadError: LoadError | null;
  setLoadError: (error: LoadError | null) => void;

  timelineSelection: TimelineSelection;
  setSelectedNote: (noteId: string | null) => void;
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;

  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
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
  recordingUsesPlayhead: false,
  scheduledTimeouts: [],
  scheduledAudioIds: [],

  startRecording: (withCountIn = false, forcePlayhead = false) => {
    const state = get();
    const now = performance.now();

    const isPlayingAndHasRhythm = forcePlayhead || (state.isPlaying && state.rhythm && state.rhythm.notes.length > 0);

    if (!state.rhythm || state.rhythm.notes.length === 0) {
      set({
        isRecording: !withCountIn,
        recordingStartTime: now,
        recordingUsesPlayhead: false,
        scheduledTimeouts: [],
        rhythm: {
          id: generateRhythmId(),
          version: '1.0',
          name: '我的节奏',
          createdAt: Date.now(),
          duration: 0,
          bpm: state.metronomeBpm,
          timeSignature: state.metronomeTimeSignature,
          notes: [],
          drumVolumes: { ...state.drumVolumes }
        }
      });
    } else {
      if (withCountIn) {
        set({
          recordingStartTime: now,
          recordingUsesPlayhead: isPlayingAndHasRhythm,
          scheduledTimeouts: [],
        });
      } else {
        set({
          isRecording: true,
          recordingStartTime: now,
          recordingUsesPlayhead: isPlayingAndHasRhythm,
          rhythm: {
            ...state.rhythm,
            bpm: state.metronomeBpm,
            timeSignature: state.metronomeTimeSignature,
          }
        });
      }
    }
  },

  stopRecording: () => {
    const state = get();
    if (state.rhythm && state.rhythm.notes.length > 0) {
      const maxNoteTime = Math.max(...state.rhythm.notes.map(n => n.time));
      const duration = Math.max(maxNoteTime + 500, state.rhythm.duration);
      set({
        isRecording: false,
        isCountingIn: false,
        rhythm: { ...state.rhythm, duration }
      });
    } else {
      set({
        isRecording: false,
        isCountingIn: false,
      });
    }
  },

  startPlayback: (loop = false) => {
    set({
      isPlaying: true,
      isLooping: loop,
      scheduledTimeouts: [],
      scheduledAudioIds: [],
      playheadPosition: 0,
    });
  },

  stopPlayback: () => {
    const state = get();
    state.scheduledTimeouts.forEach(id => clearTimeout(id));
    set({
      isPlaying: false,
      scheduledTimeouts: [],
      scheduledAudioIds: [],
      playheadPosition: 0,
    });
  },

  toggleLooping: () => set(state => ({ isLooping: !state.isLooping })),

  addNote: (note) => {
    const state = get();
    const noteTime = note.time;

    const newNote: Note = {
      ...note,
      time: noteTime,
      id: generateNoteId(),
    };

    if (state.rhythm) {
      const newNotes = [...state.rhythm.notes, newNote];
      const maxTime = Math.max(...newNotes.map(n => n.time));
      set({
        rhythm: {
          ...state.rhythm,
          notes: newNotes,
          duration: Math.max(state.rhythm.duration, maxTime + 500),
        }
      });
    } else {
      set({
        rhythm: {
          id: generateRhythmId(),
          version: '1.0',
          name: '我的节奏',
          createdAt: Date.now(),
          duration: noteTime + 500,
          bpm: state.metronomeBpm,
          timeSignature: state.metronomeTimeSignature,
          notes: [newNote],
          drumVolumes: { ...state.drumVolumes }
        }
      });
    }
  },

  updateNote: (noteId, updates) => {
    const state = get();
    if (!state.rhythm) return;

    const updatedNotes = state.rhythm.notes.map(note =>
      note.id === noteId ? { ...note, ...updates } : note
    );

    const maxTime = Math.max(...updatedNotes.map(n => n.time));
    set({
      rhythm: {
        ...state.rhythm,
        notes: updatedNotes,
        duration: Math.max(state.rhythm.duration, maxTime + 500),
      }
    });
  },

  deleteNote: (noteId) => {
    const state = get();
    if (!state.rhythm) return;

    const updatedNotes = state.rhythm.notes.filter(note => note.id !== noteId);

    set({
      rhythm: {
        ...state.rhythm,
        notes: updatedNotes,
      },
      timelineSelection: { noteId: null }
    });
  },

  addScheduledTimeout: (id) => {
    set(state => ({
      scheduledTimeouts: [...state.scheduledTimeouts, id]
    }));
  },

  addScheduledAudioId: (id) => {
    set(state => ({
      scheduledAudioIds: [...state.scheduledAudioIds, id]
    }));
  },

  clearScheduledTimeouts: () => {
    set({ scheduledTimeouts: [], scheduledAudioIds: [] });
  },

  clearRhythm: () => {
    const state = get();
    state.scheduledTimeouts.forEach(id => clearTimeout(id));
    set({
      rhythm: null,
      isPlaying: false,
      isLooping: false,
      isRecording: false,
      scheduledTimeouts: [],
      scheduledAudioIds: [],
      playheadPosition: 0,
      timelineSelection: { noteId: null }
    });
  },

  setRhythm: (rhythm) => set({ rhythm, timelineSelection: { noteId: null } }),

  metronomeEnabled: false,
  metronomeBpm: DEFAULT_BPM,
  metronomeTimeSignature: DEFAULT_TIME_SIGNATURE,
  metronomeCurrentBeat: 0,
  countInEnabled: true,
  countInBars: 1,
  isCountingIn: false,

  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  setMetronomeBpm: (bpm) => set({ metronomeBpm: bpm }),
  setMetronomeTimeSignature: (ts) => set({ metronomeTimeSignature: ts }),
  setMetronomeCurrentBeat: (beat) => set({ metronomeCurrentBeat: beat }),
  setCountInEnabled: (enabled) => set({ countInEnabled: enabled }),
  setCountInBars: (bars) => set({ countInBars: bars }),
  setIsCountingIn: (isCountingIn) => set({ isCountingIn }),

  loadError: null,
  setLoadError: (error) => set({ loadError: error }),

  timelineSelection: { noteId: null },
  setSelectedNote: (noteId) => set({ timelineSelection: { noteId } }),
  timelineZoom: 1,
  setTimelineZoom: (zoom) => set({ timelineZoom: zoom }),

  playheadPosition: 0,
  setPlayheadPosition: (pos) => set({ playheadPosition: pos }),
}));

export function validateRhythmData(data: unknown): { valid: boolean; error?: LoadError } {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: {
        type: 'invalid_file',
        message: '文件格式无效，不是有效的 JSON 对象'
      }
    };
  }

  const obj = data as Record<string, unknown>;

  if (!('notes' in obj)) {
    return {
      valid: false,
      error: {
        type: 'invalid_file',
        message: '这不是节奏文件，缺少 notes 字段。请确认是否加载了正确的 .drums.json 文件'
      }
    };
  }

  if (!Array.isArray(obj.notes)) {
    return {
      valid: false,
      error: {
        type: 'invalid_notes_data',
        message: '节奏文件损坏，notes 字段不是有效的数组格式'
      }
    };
  }

  if (!('version' in obj)) {
    return {
      valid: false,
      error: {
        type: 'invalid_file',
        message: '这不是 V-DRUM 节奏文件，缺少版本标识'
      }
    };
  }

  if (obj.version !== '1.0') {
    return {
      valid: false,
      error: {
        type: 'invalid_version',
        message: `不支持的文件版本: ${obj.version}，请使用版本 1.0 的节奏文件`
      }
    };
  }

  if (obj.notes.length === 0) {
    return {
      valid: false,
      error: {
        type: 'no_notes',
        message: '节奏文件不包含任何鼓点音符'
      }
    };
  }

  const hasInvalidNote = obj.notes.some((n: unknown) => {
    const note = n as Record<string, unknown>;
    return typeof note.drumId !== 'string' || typeof note.time !== 'number' || typeof note.velocity !== 'number';
  });

  if (hasInvalidNote) {
    return {
      valid: false,
      error: {
        type: 'invalid_notes_data',
        message: '部分音符数据格式不正确，缺少 drumId、time 或 velocity 字段'
      }
    };
  }

  if (typeof obj.timeSignature === 'string' && !TIME_SIGNATURES.includes(obj.timeSignature)) {
    return {
      valid: false,
      error: {
        type: 'unsupported_time_signature',
        message: `不支持的拍号: ${obj.timeSignature}，支持的拍号: ${TIME_SIGNATURES.join(', ')}`
      }
    };
  }

  return { valid: true };
}

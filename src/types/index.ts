export interface DrumConfig {
  id: string;
  name: string;
  displayName: string;
  key: string;
  keyCode: string;
  defaultVolume: number;
  color: string;
  glowColor: string;
  position: { x: number; y: number };
  size: number;
  synth: DrumSynthConfig;
  trackOrder: number;
}

export interface DrumSynthConfig {
  type: 'kick' | 'snare' | 'tom' | 'hihat' | 'crash' | 'ride' | 'clap';
  frequency?: number;
  decay?: number;
  noiseAmount?: number;
  attack?: number;
  sustain?: number;
  release?: number;
}

export interface Note {
  id: string;
  drumId: string;
  time: number;
  velocity: number;
}

export interface RhythmData {
  id: string;
  version: string;
  name: string;
  createdAt: number;
  duration: number;
  bpm: number;
  timeSignature: string;
  notes: Note[];
  drumVolumes: Record<string, number>;
}

export interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  startTime: number;
  rhythm: RhythmData | null;
}

export interface MetronomeState {
  isRunning: boolean;
  bpm: number;
  timeSignature: string;
  currentBeat: number;
  countInEnabled: boolean;
  countInBars: number;
}

export type LoadErrorType =
  | 'invalid_file'
  | 'invalid_json'
  | 'invalid_version'
  | 'no_notes'
  | 'unsupported_time_signature'
  | 'invalid_notes_data';

export interface LoadError {
  type: LoadErrorType;
  message: string;
}

export interface TimelineSelection {
  noteId: string | null;
}

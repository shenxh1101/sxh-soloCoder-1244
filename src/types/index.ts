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
  drumId: string;
  time: number;
  velocity: number;
}

export interface RhythmData {
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
}

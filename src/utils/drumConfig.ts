import { DrumConfig } from '@/types';

export const DRUM_CONFIGS: DrumConfig[] = [
  {
    id: 'kick',
    name: 'Kick',
    displayName: '底鼓',
    key: 'a',
    keyCode: 'KeyA',
    defaultVolume: 0.9,
    color: '#dc2626',
    glowColor: '#ef4444',
    position: { x: 50, y: 78 },
    size: 140,
    synth: { type: 'kick', frequency: 60, decay: 0.5, attack: 0.001 }
  },
  {
    id: 'snare',
    name: 'Snare',
    displayName: '军鼓',
    key: 's',
    keyCode: 'KeyS',
    defaultVolume: 0.75,
    color: '#eab308',
    glowColor: '#facc15',
    position: { x: 30, y: 55 },
    size: 110,
    synth: { type: 'snare', noiseAmount: 0.8, decay: 0.2, attack: 0.001 }
  },
  {
    id: 'hihat-closed',
    name: 'Closed HH',
    displayName: '闭合踩镲',
    key: 'd',
    keyCode: 'KeyD',
    defaultVolume: 0.5,
    color: '#94a3b8',
    glowColor: '#cbd5e1',
    position: { x: 10, y: 30 },
    size: 80,
    synth: { type: 'hihat', decay: 0.05, noiseAmount: 1 }
  },
  {
    id: 'hihat-open',
    name: 'Open HH',
    displayName: '开放踩镲',
    key: 'f',
    keyCode: 'KeyF',
    defaultVolume: 0.55,
    color: '#94a3b8',
    glowColor: '#e2e8f0',
    position: { x: 10, y: 60 },
    size: 85,
    synth: { type: 'hihat', decay: 0.3, noiseAmount: 0.9 }
  },
  {
    id: 'tom-high',
    name: 'High Tom',
    displayName: '高音嗵鼓',
    key: 'g',
    keyCode: 'KeyG',
    defaultVolume: 0.7,
    color: '#f97316',
    glowColor: '#fb923c',
    position: { x: 42, y: 25 },
    size: 95,
    synth: { type: 'tom', frequency: 220, decay: 0.35, attack: 0.002 }
  },
  {
    id: 'tom-mid',
    name: 'Mid Tom',
    displayName: '中音嗵鼓',
    key: 'h',
    keyCode: 'KeyH',
    defaultVolume: 0.7,
    color: '#f97316',
    glowColor: '#fb923c',
    position: { x: 60, y: 25 },
    size: 100,
    synth: { type: 'tom', frequency: 170, decay: 0.4, attack: 0.002 }
  },
  {
    id: 'tom-floor',
    name: 'Floor Tom',
    displayName: '落地嗵鼓',
    key: 'j',
    keyCode: 'KeyJ',
    defaultVolume: 0.75,
    color: '#f97316',
    glowColor: '#fb923c',
    position: { x: 72, y: 58 },
    size: 115,
    synth: { type: 'tom', frequency: 110, decay: 0.5, attack: 0.002 }
  },
  {
    id: 'crash',
    name: 'Crash',
    displayName: '强音镲',
    key: 'k',
    keyCode: 'KeyK',
    defaultVolume: 0.6,
    color: '#e5e7eb',
    glowColor: '#f9fafb',
    position: { x: 88, y: 20 },
    size: 95,
    synth: { type: 'crash', decay: 1.2, noiseAmount: 1 }
  },
  {
    id: 'ride',
    name: 'Ride',
    displayName: '节奏镲',
    key: 'l',
    keyCode: 'KeyL',
    defaultVolume: 0.55,
    color: '#e5e7eb',
    glowColor: '#f9fafb',
    position: { x: 90, y: 50 },
    size: 100,
    synth: { type: 'ride', decay: 0.8, noiseAmount: 0.7 }
  }
];

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8'];

export const DEFAULT_BPM = 120;
export const DEFAULT_TIME_SIGNATURE = '4/4';
export const DEFAULT_PLAYBACK_SPEED = 1;
export const MIN_PLAYBACK_SPEED = 0.5;
export const MAX_PLAYBACK_SPEED = 2;

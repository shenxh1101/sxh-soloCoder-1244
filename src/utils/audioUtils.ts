import { DrumSynthConfig } from '@/types';

export function playDrumSound(
  ctx: AudioContext,
  synth: DrumSynthConfig,
  gainNode: GainNode,
  velocity: number = 1,
  when: number = 0
) {
  const startTime = when > 0 ? when : ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.value = velocity;
  masterGain.connect(gainNode);

  switch (synth.type) {
    case 'kick':
      createKick(ctx, masterGain, synth, startTime);
      break;
    case 'snare':
      createSnare(ctx, masterGain, synth, startTime);
      break;
    case 'tom':
      createTom(ctx, masterGain, synth, startTime);
      break;
    case 'hihat':
      createHiHat(ctx, masterGain, synth, startTime);
      break;
    case 'crash':
      createCrash(ctx, masterGain, synth, startTime);
      break;
    case 'ride':
      createRide(ctx, masterGain, synth, startTime);
      break;
    case 'clap':
      createClap(ctx, masterGain, synth, startTime);
      break;
  }
}

function createKick(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const baseFreq = synth.frequency || 60;
  osc.frequency.setValueAtTime(baseFreq, start);
  osc.frequency.exponentialRampToValueAtTime(30, start + 0.15);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(1, start + (synth.attack || 0.001));
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.5));

  osc.connect(gain);
  gain.connect(output);

  osc.start(start);
  osc.stop(start + (synth.decay || 0.5) + 0.05);
}

function createSnare(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const noiseBufferSize = ctx.sampleRate * (synth.decay || 0.2);
  const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, start);
  noiseGain.gain.linearRampToValueAtTime(synth.noiseAmount || 0.8, start + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.2));

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(output);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, start);
  osc.frequency.exponentialRampToValueAtTime(100, start + 0.1);

  oscGain.gain.setValueAtTime(0, start);
  oscGain.gain.linearRampToValueAtTime(0.5, start + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

  osc.connect(oscGain);
  oscGain.connect(output);

  noise.start(start);
  noise.stop(start + (synth.decay || 0.2) + 0.05);
  osc.start(start);
  osc.stop(start + 0.15);
}

function createTom(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  const baseFreq = synth.frequency || 150;
  osc.frequency.setValueAtTime(baseFreq, start);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, start + (synth.decay || 0.4));

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(1, start + (synth.attack || 0.002));
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.4));

  osc.connect(gain);
  gain.connect(output);

  osc.start(start);
  osc.stop(start + (synth.decay || 0.4) + 0.05);
}

function createHiHat(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const noiseBufferSize = ctx.sampleRate * (synth.decay || 0.1);
  const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 10000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(synth.noiseAmount || 0.7, start + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.1));

  noise.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(output);

  noise.start(start);
  noise.stop(start + (synth.decay || 0.1) + 0.05);
}

function createCrash(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const noiseBufferSize = ctx.sampleRate * (synth.decay || 1.2);
  const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 5000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(synth.noiseAmount || 0.8, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 1.2));

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(output);

  noise.start(start);
  noise.stop(start + (synth.decay || 1.2) + 0.05);
}

function createRide(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const noiseBufferSize = ctx.sampleRate * (synth.decay || 0.8);
  const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 4000;

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 600;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(synth.noiseAmount || 0.6, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.8));

  noise.connect(highpass);
  highpass.connect(gain);
  osc.connect(oscGain);
  oscGain.connect(gain);
  gain.connect(output);

  noise.start(start);
  noise.stop(start + (synth.decay || 0.8) + 0.05);
  osc.start(start);
  osc.stop(start + (synth.decay || 0.8) + 0.05);
}

function createClap(
  ctx: AudioContext,
  output: GainNode,
  synth: DrumSynthConfig,
  start: number
) {
  const noiseBufferSize = ctx.sampleRate * (synth.decay || 0.2);
  const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1500;
  bandpass.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(synth.noiseAmount || 0.8, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, start + (synth.decay || 0.2));

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(output);

  noise.start(start);
  noise.stop(start + (synth.decay || 0.2) + 0.05);
}

export function playMetronomeClick(
  ctx: AudioContext,
  output: GainNode,
  isStrong: boolean,
  when: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = isStrong ? 1500 : 1000;
  osc.type = 'square';

  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(isStrong ? 0.5 : 0.3, when + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05);

  osc.connect(gain);
  gain.connect(output);

  osc.start(when);
  osc.stop(when + 0.06);
}

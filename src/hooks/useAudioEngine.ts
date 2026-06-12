import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { playDrumSound } from '@/utils/audioUtils';
import { DrumSynthConfig } from '@/types';

export function useAudioEngine() {
  const setAudioContext = useDrumStore(state => state.setAudioContext);
  const drumVolumes = useDrumStore(state => state.drumVolumes);
  const isRecording = useDrumStore(state => state.isRecording);
  const recordingStartTime = useDrumStore(state => state.recordingStartTime);
  const addNote = useDrumStore(state => state.addNote);
  const triggerPad = useDrumStore(state => state.triggerPad);
  const releasePad = useDrumStore(state => state.releasePad);

  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioContextRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const gains = new Map<string, GainNode>();
      DRUM_CONFIGS.forEach(drum => {
        const gain = ctx.createGain();
        gain.gain.value = useDrumStore.getState().drumVolumes[drum.id] ?? drum.defaultVolume;
        gain.connect(masterGain);
        gains.set(drum.id, gain);
      });
      gainNodesRef.current = gains;
      (window as any).__drumGainNodes = gains;
      (window as any).__drumAudioContext = ctx;
      setAudioContext(ctx);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, [setAudioContext]);

  useEffect(() => {
    gainNodesRef.current.forEach((gainNode, drumId) => {
      const volume = drumVolumes[drumId];
      if (volume !== undefined && gainNode && audioContextRef.current) {
        gainNode.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.01);
      }
    });
  }, [drumVolumes]);

  const playDrum = useCallback((drumId: string, velocity: number = 1) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const drumConfig = DRUM_CONFIGS.find(d => d.id === drumId);
    if (!drumConfig) return;

    const gainNode = gainNodesRef.current.get(drumId);
    if (!gainNode) return;

    triggerPad(drumId);
    setTimeout(() => releasePad(drumId), 150);

    playDrumSound(
      ctx,
      drumConfig.synth as DrumSynthConfig,
      gainNode,
      velocity,
      ctx.currentTime
    );

    if (isRecording) {
      const elapsed = performance.now() - recordingStartTime;
      addNote({
        drumId,
        time: elapsed,
        velocity
      });
    }
  }, [ensureAudioContext, isRecording, recordingStartTime, addNote, triggerPad, releasePad]);

  const playDrumAt = useCallback((drumId: string, velocity: number = 1, audioTime: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const drumConfig = DRUM_CONFIGS.find(d => d.id === drumId);
    if (!drumConfig) return;

    const gainNode = gainNodesRef.current.get(drumId);
    if (!gainNode) return;

    playDrumSound(
      ctx,
      drumConfig.synth as DrumSynthConfig,
      gainNode,
      velocity,
      audioTime
    );
  }, []);

  return {
    ensureAudioContext,
    playDrum,
    playDrumAt,
    gainNodesRef,
    masterGainRef,
    audioContextRef
  };
}

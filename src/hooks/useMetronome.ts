import { useEffect, useRef, useCallback } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { playMetronomeClick } from '@/utils/audioUtils';

export function useMetronome() {
  const audioContext = useDrumStore(state => state.audioContext);
  const metronomeEnabled = useDrumStore(state => state.metronomeEnabled);
  const bpm = useDrumStore(state => state.metronomeBpm);
  const timeSignature = useDrumStore(state => state.metronomeTimeSignature);
  const setMetronomeCurrentBeat = useDrumStore(state => state.setMetronomeCurrentBeat);
  const masterGainRef = useRef<GainNode | null>(null);
  const metronomeGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);

  const getBeatsPerMeasure = useCallback(() => {
    return parseInt(timeSignature.split('/')[0], 10);
  }, [timeSignature]);

  const scheduler = useCallback(() => {
    const ctx = useDrumStore.getState().audioContext;
    if (!ctx || !metronomeGainRef.current) return;

    const lookahead = 0.1;
    const secondsPerBeat = 60.0 / bpm;

    while (nextBeatTimeRef.current < ctx.currentTime + lookahead) {
      const isStrong = currentBeatRef.current % getBeatsPerMeasure() === 0;
      
      playMetronomeClick(
        ctx,
        metronomeGainRef.current,
        isStrong,
        nextBeatTimeRef.current
      );

      const beatIndex = currentBeatRef.current;
      const scheduledTime = nextBeatTimeRef.current;
      const delay = Math.max(0, (scheduledTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setMetronomeCurrentBeat((beatIndex % getBeatsPerMeasure()) + 1);
      }, delay);

      nextBeatTimeRef.current += secondsPerBeat;
      currentBeatRef.current++;
    }
  }, [bpm, getBeatsPerMeasure, setMetronomeCurrentBeat]);

  useEffect(() => {
    if (audioContext && !metronomeGainRef.current) {
      const gain = audioContext.createGain();
      gain.gain.value = 0.5;
      gain.connect(audioContext.destination);
      metronomeGainRef.current = gain;
    }
  }, [audioContext]);

  useEffect(() => {
    if (metronomeEnabled && audioContext) {
      if (!metronomeGainRef.current) {
        const gain = audioContext.createGain();
        gain.gain.value = 0.5;
        gain.connect(audioContext.destination);
        metronomeGainRef.current = gain;
      }

      nextBeatTimeRef.current = audioContext.currentTime + 0.05;
      currentBeatRef.current = 0;

      schedulerRef.current = window.setInterval(scheduler, 25);
    } else {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      setMetronomeCurrentBeat(0);
    }

    return () => {
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
    };
  }, [metronomeEnabled, audioContext, scheduler, setMetronomeCurrentBeat]);

  return { masterGainRef };
}

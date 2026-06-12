import { useEffect, useRef, useCallback } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { playMetronomeClick } from '@/utils/audioUtils';
import { getBeatsPerMeasure, getMsPerBeat } from '@/utils/drumConfig';

export function useMetronome() {
  const audioContext = useDrumStore(state => state.audioContext);
  const metronomeEnabled = useDrumStore(state => state.metronomeEnabled);
  const bpm = useDrumStore(state => state.metronomeBpm);
  const timeSignature = useDrumStore(state => state.metronomeTimeSignature);
  const isRecording = useDrumStore(state => state.isRecording);
  const isCountingIn = useDrumStore(state => state.isCountingIn);
  const countInEnabled = useDrumStore(state => state.countInEnabled);
  const countInBars = useDrumStore(state => state.countInBars);
  const startRecording = useDrumStore(state => state.startRecording);
  const setIsCountingIn = useDrumStore(state => state.setIsCountingIn);
  const setMetronomeCurrentBeat = useDrumStore(state => state.setMetronomeCurrentBeat);

  const metronomeGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const countInBeatsRemainingRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  const startCountIn = useCallback(() => {
    const ctx = useDrumStore.getState().audioContext;
    if (!ctx) return;

    if (!metronomeGainRef.current) {
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);
      metronomeGainRef.current = gain;
    }

    setIsCountingIn(true);
    setMetronomeCurrentBeat(0);
    countInBeatsRemainingRef.current = beatsPerMeasure * countInBars;
    currentBeatRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    isRunningRef.current = true;

    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
    }
    schedulerRef.current = window.setInterval(scheduler, 25);
  }, [beatsPerMeasure, countInBars, setIsCountingIn, setMetronomeCurrentBeat]);

  const scheduler = useCallback(() => {
    const ctx = useDrumStore.getState().audioContext;
    if (!ctx || !metronomeGainRef.current || !isRunningRef.current) return;

    const lookahead = 0.1;
    const secondsPerBeat = getMsPerBeat(useDrumStore.getState().metronomeBpm) / 1000;

    while (nextBeatTimeRef.current < ctx.currentTime + lookahead) {
      const beatIndex = currentBeatRef.current;
      const totalBeats = beatsPerMeasure;
      const isStrong = beatIndex % totalBeats === 0;

      const countingIn = useDrumStore.getState().isCountingIn;

      if (countingIn && countInBeatsRemainingRef.current > 0) {
        playMetronomeClick(
          ctx,
          metronomeGainRef.current,
          countInBeatsRemainingRef.current === 1 || isStrong,
          nextBeatTimeRef.current
        );

        const scheduledTime = nextBeatTimeRef.current;
        const delay = Math.max(0, (scheduledTime - ctx.currentTime) * 1000);
        const remaining = countInBeatsRemainingRef.current;
        setTimeout(() => {
          setMetronomeCurrentBeat((remaining % totalBeats) || totalBeats);
        }, delay);

        countInBeatsRemainingRef.current--;

        if (countInBeatsRemainingRef.current === 0) {
          setTimeout(() => {
            setIsCountingIn(false);
            if (!useDrumStore.getState().isRecording) {
              startRecording(false);
            }
          }, delay + 50);
        }
      } else if (useDrumStore.getState().metronomeEnabled && !countingIn) {
        playMetronomeClick(
          ctx,
          metronomeGainRef.current,
          isStrong,
          nextBeatTimeRef.current
        );

        const scheduledTime = nextBeatTimeRef.current;
        const delay = Math.max(0, (scheduledTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          setMetronomeCurrentBeat((beatIndex % totalBeats) + 1);
        }, delay);
      }

      nextBeatTimeRef.current += secondsPerBeat;
      currentBeatRef.current++;
    }
  }, [beatsPerMeasure, setMetronomeCurrentBeat, setIsCountingIn, startRecording]);

  useEffect(() => {
    const shouldRun = metronomeEnabled || isCountingIn;

    if (shouldRun && audioContext) {
      if (!metronomeGainRef.current) {
        const gain = audioContext.createGain();
        gain.gain.value = 0.5;
        gain.connect(audioContext.destination);
        metronomeGainRef.current = gain;
      }

      if (!isCountingIn) {
        nextBeatTimeRef.current = audioContext.currentTime + 0.05;
        currentBeatRef.current = 0;
        isRunningRef.current = true;
      }

      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
      }
      schedulerRef.current = window.setInterval(scheduler, 25);
    } else if (!isCountingIn) {
      isRunningRef.current = false;
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      setMetronomeCurrentBeat(0);
    }

    return () => {
      if (!isCountingIn && !metronomeEnabled) {
        if (schedulerRef.current) {
          clearInterval(schedulerRef.current);
          schedulerRef.current = null;
        }
        isRunningRef.current = false;
      }
    };
  }, [metronomeEnabled, isCountingIn, audioContext, scheduler, setMetronomeCurrentBeat]);

  useEffect(() => {
    if (!isRecording && !isCountingIn && !metronomeEnabled) {
      isRunningRef.current = false;
      countInBeatsRemainingRef.current = 0;
    }
  }, [isRecording, isCountingIn, metronomeEnabled]);

  return { startCountIn };
}

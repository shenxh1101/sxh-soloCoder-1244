import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { useAudioEngine } from './useAudioEngine';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { DrumSynthConfig } from '@/types';
import { playDrumSound } from '@/utils/audioUtils';

export function usePlayback() {
  const isPlaying = useDrumStore(state => state.isPlaying);
  const isLooping = useDrumStore(state => state.isLooping);
  const isRecording = useDrumStore(state => state.isRecording);
  const rhythm = useDrumStore(state => state.rhythm);
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const stopPlayback = useDrumStore(state => state.stopPlayback);
  const startPlayback = useDrumStore(state => state.startPlayback);
  const addScheduledTimeout = useDrumStore(state => state.addScheduledTimeout);
  const triggerPad = useDrumStore(state => state.triggerPad);
  const releasePad = useDrumStore(state => state.releasePad);
  const setPlayheadPosition = useDrumStore(state => state.setPlayheadPosition);

  const { audioContextRef, gainNodesRef } = useAudioEngine();
  const loopTimeoutRef = useRef<number | null>(null);
  const playheadIntervalRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  const schedulePlayback = useCallback((startDelay: number = 0) => {
    if (!rhythm || rhythm.notes.length === 0) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const audioStartTime = ctx.currentTime + startDelay;
    const perfStartTime = performance.now() + startDelay * 1000;
    playbackStartTimeRef.current = perfStartTime;

    rhythm.notes.forEach(note => {
      const adjustedTime = note.time / playbackSpeed;
      const drumConfig = DRUM_CONFIGS.find(d => d.id === note.drumId);
      if (!drumConfig) return;

      const scheduledAudioTime = audioStartTime + (adjustedTime / 1000);
      const delayMs = adjustedTime;

      const gainNode = gainNodesRef.current.get(note.drumId);
      if (gainNode) {
        playDrumSound(
          ctx,
          drumConfig.synth as DrumSynthConfig,
          gainNode,
          note.velocity,
          scheduledAudioTime
        );
      }

      const timeoutId = window.setTimeout(() => {
        triggerPad(note.drumId);
        setTimeout(() => releasePad(note.drumId), 150);
      }, delayMs + startDelay * 1000);
      addScheduledTimeout(timeoutId);
    });
  }, [rhythm, playbackSpeed, audioContextRef, gainNodesRef, triggerPad, releasePad, addScheduledTimeout]);

  useEffect(() => {
    if (!isPlaying || !rhythm || rhythm.notes.length === 0) {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
        playheadIntervalRef.current = null;
      }
      return;
    }

    const adjustedDuration = rhythm.duration / playbackSpeed;

    schedulePlayback(0.05);

    if (playheadIntervalRef.current) {
      clearInterval(playheadIntervalRef.current);
    }
    playheadIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - playbackStartTimeRef.current;
      if (elapsed >= 0) {
        const progress = Math.min(1, elapsed / adjustedDuration);
        setPlayheadPosition(progress * rhythm.duration);
      }
    }, 30);
    addScheduledTimeout(playheadIntervalRef.current);

    if (isLooping) {
      const setupNextLoop = () => {
        loopTimeoutRef.current = window.setTimeout(() => {
          if (useDrumStore.getState().isLooping) {
            if (playheadIntervalRef.current) {
              clearInterval(playheadIntervalRef.current);
            }
            setPlayheadPosition(0);
            schedulePlayback(0);
            setupNextLoop();
          }
        }, adjustedDuration + 50);
      };
      setupNextLoop();
    } else {
      loopTimeoutRef.current = window.setTimeout(() => {
        if (!isRecording) {
          stopPlayback();
        }
      }, adjustedDuration + 300);
    }

    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      if (playheadIntervalRef.current) {
        clearInterval(playheadIntervalRef.current);
        playheadIntervalRef.current = null;
      }
    };
  }, [isPlaying, rhythm, isLooping, playbackSpeed, schedulePlayback, stopPlayback, setPlayheadPosition, addScheduledTimeout, isRecording]);

  return { schedulePlayback };
}

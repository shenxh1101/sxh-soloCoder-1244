import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { useAudioEngine } from './useAudioEngine';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { DrumSynthConfig } from '@/types';
import { playDrumSound } from '@/utils/audioUtils';

export function usePlayback() {
  const isPlaying = useDrumStore(state => state.isPlaying);
  const isLooping = useDrumStore(state => state.isLooping);
  const rhythm = useDrumStore(state => state.rhythm);
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const stopPlayback = useDrumStore(state => state.stopPlayback);
  const startPlayback = useDrumStore(state => state.startPlayback);
  const addScheduledTimeout = useDrumStore(state => state.addScheduledTimeout);
  const triggerPad = useDrumStore(state => state.triggerPad);
  const releasePad = useDrumStore(state => state.releasePad);

  const { audioContextRef, gainNodesRef } = useAudioEngine();
  const loopTimeoutRef = useRef<number | null>(null);

  const schedulePlayback = useCallback((startDelay: number = 0) => {
    if (!rhythm || rhythm.notes.length === 0) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const audioStartTime = ctx.currentTime + startDelay;

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
          playbackSpeed,
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
      return;
    }

    const adjustedDuration = rhythm.duration / playbackSpeed;

    schedulePlayback(0.05);

    if (isLooping) {
      const setupNextLoop = () => {
        loopTimeoutRef.current = window.setTimeout(() => {
          if (useDrumStore.getState().isLooping) {
            stopPlayback();
            setTimeout(() => {
              startPlayback(true);
            }, 50);
          }
        }, adjustedDuration + 150);
      };
      setupNextLoop();
    } else {
      loopTimeoutRef.current = window.setTimeout(() => {
        stopPlayback();
      }, adjustedDuration + 300);
    }

    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [isPlaying, rhythm, isLooping, playbackSpeed, schedulePlayback, stopPlayback, startPlayback]);

  return { schedulePlayback };
}

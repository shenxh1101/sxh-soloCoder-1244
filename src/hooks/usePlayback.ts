import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import { useAudioEngine } from './useAudioEngine';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { DrumSynthConfig, Note } from '@/types';
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
  const audioStartTimeRef = useRef<number>(0);
  const scheduledNotesRef = useRef<number>(0);

  const getSortedNotes = useCallback((): Note[] => {
    if (!rhythm || rhythm.notes.length === 0) return [];
    return [...rhythm.notes].sort((a, b) => a.time - b.time);
  }, [rhythm]);

  const scheduleLoop = useCallback((audioStartAt: number, perfStartAt: number) => {
    if (!rhythm || rhythm.notes.length === 0) return;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const sortedNotes = getSortedNotes();
    const adjustedDuration = rhythm.duration / playbackSpeed;

    sortedNotes.forEach(note => {
      const adjustedTime = note.time / playbackSpeed;
      const drumConfig = DRUM_CONFIGS.find(d => d.id === note.drumId);
      if (!drumConfig) return;

      const scheduledAudioTime = audioStartAt + (adjustedTime / 1000);
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
      }, delayMs + (perfStartAt - performance.now()));
      addScheduledTimeout(timeoutId);
    });

    scheduledNotesRef.current = sortedNotes.length;
  }, [rhythm, playbackSpeed, getSortedNotes, audioContextRef, gainNodesRef, triggerPad, releasePad, addScheduledTimeout]);

  const updatePlayhead = useCallback(() => {
    if (!rhythm) return;

    const elapsed = performance.now() - playbackStartTimeRef.current;
    const adjustedDuration = rhythm.duration / playbackSpeed;

    if (isLooping) {
      const loopElapsed = elapsed % adjustedDuration;
      const progress = loopElapsed / adjustedDuration;
      setPlayheadPosition(progress * rhythm.duration);
    } else {
      const progress = Math.min(1, elapsed / adjustedDuration);
      setPlayheadPosition(progress * rhythm.duration);
    }
  }, [rhythm, playbackSpeed, isLooping, setPlayheadPosition]);

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

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const startDelay = 0.05;
    const audioStartTime = ctx.currentTime + startDelay;
    const perfStartTime = performance.now() + startDelay * 1000;

    audioStartTimeRef.current = audioStartTime;
    playbackStartTimeRef.current = perfStartTime;

    scheduleLoop(audioStartTime, perfStartTime);

    if (playheadIntervalRef.current) {
      clearInterval(playheadIntervalRef.current);
    }
    playheadIntervalRef.current = window.setInterval(updatePlayhead, 16);
    addScheduledTimeout(playheadIntervalRef.current);

    if (isLooping) {
      const adjustedDuration = rhythm.duration / playbackSpeed;

      const scheduleNextLoop = () => {
        const nextAudioStart = audioStartTimeRef.current + (adjustedDuration / 1000);
        const nextPerfStart = playbackStartTimeRef.current + adjustedDuration;

        const scheduleDelay = (nextPerfStart - performance.now()) - 50;
        if (scheduleDelay > 0) {
          loopTimeoutRef.current = window.setTimeout(() => {
            if (useDrumStore.getState().isLooping && useDrumStore.getState().isPlaying) {
              scheduleLoop(nextAudioStart, nextPerfStart);
              audioStartTimeRef.current = nextAudioStart;
              playbackStartTimeRef.current = nextPerfStart;
              scheduleNextLoop();
            }
          }, scheduleDelay);
        } else {
          audioStartTimeRef.current = nextAudioStart;
          playbackStartTimeRef.current = nextPerfStart;
          scheduleLoop(nextAudioStart, nextPerfStart);
          scheduleNextLoop();
        }
      };

      scheduleNextLoop();
    } else {
      const adjustedDuration = rhythm.duration / playbackSpeed;
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
  }, [isPlaying, rhythm, isLooping, playbackSpeed, scheduleLoop, updatePlayhead, stopPlayback, addScheduledTimeout, isRecording, audioContextRef]);

  return { scheduleLoop };
}

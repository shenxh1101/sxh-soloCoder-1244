import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import {
  ensureAudioContext,
  setLoopStartTime,
  getLoopStartPerfTime,
  getLoopStartAudioTime,
  getScheduledNoteIds,
  clearScheduledNotes,
  scheduleDrumAt,
  getAudioContext,
} from '@/audio/engine';
import { Note } from '@/types';

const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD_INTERVAL = 25;
const PLAYHEAD_INTERVAL = 16;

let globalSchedulerTimer: number | null = null;
let globalPlayheadTimer: number | null = null;
let globalIsRunning = false;
let globalRhythmId: string | null = null;

export function usePlayback() {
  const schedulerTimerRef = useRef<number | null>(null);
  const playheadTimerRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const rhythmIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const getStore = () => useDrumStore.getState();

  const getSortedNotes = useCallback((): Note[] => {
    const { rhythm } = getStore();
    if (!rhythm || rhythm.notes.length === 0) return [];
    return [...rhythm.notes].sort((a, b) => a.time - b.time);
  }, []);

  const scheduleNotes = useCallback(() => {
    const ctx = getAudioContext();
    const store = getStore();
    const { rhythm, isLooping, playbackSpeed, triggerPad, releasePad, addScheduledTimeout } = store;
    if (!ctx || !rhythm || rhythm.notes.length === 0) return;

    const sortedNotes = getSortedNotes();
    const adjustedDuration = (rhythm.duration / playbackSpeed) / 1000;
    const currentAudioTime = ctx.currentTime;
    const loopStartAudio = getLoopStartAudioTime();

    if (loopStartAudio <= 0) return;

    const scheduleWindowEnd = currentAudioTime + SCHEDULE_AHEAD_TIME;
    const scheduledIds = getScheduledNoteIds();

    let loopAudioTime = loopStartAudio;
    let loopIndex = 0;

    while (loopAudioTime < scheduleWindowEnd) {
      for (let i = 0; i < sortedNotes.length; i++) {
        const note = sortedNotes[i];
        const adjustedNoteTime = (note.time / playbackSpeed) / 1000;
        const noteAudioTime = loopAudioTime + adjustedNoteTime;

        if (noteAudioTime > currentAudioTime && noteAudioTime <= scheduleWindowEnd) {
          const scheduleKey = `${note.id}_${loopIndex}_${i}`;
          if (!scheduledIds.has(scheduleKey)) {
            scheduledIds.add(scheduleKey);
            scheduleDrumAt(note.drumId, note.velocity, noteAudioTime);

            const delayMs = (noteAudioTime - currentAudioTime) * 1000;
            const drumId = note.drumId;
            const timeoutId = window.setTimeout(() => {
              triggerPad(drumId);
              setTimeout(() => releasePad(drumId), 150);
              scheduledIds.delete(scheduleKey);
            }, delayMs);
            addScheduledTimeout(timeoutId);
          }
        }
      }

      if (!isLooping) break;
      loopAudioTime += adjustedDuration;
      loopIndex++;
    }
  }, [getSortedNotes]);

  const updatePlayhead = useCallback(() => {
    const store = getStore();
    const { rhythm, isLooping, isRecording, playbackSpeed, setPlayheadPosition, stopPlayback } = store;
    if (!rhythm) return;

    const loopStart = getLoopStartPerfTime();
    if (loopStart <= 0) return;

    const elapsed = performance.now() - loopStart;
    const adjustedDuration = rhythm.duration / playbackSpeed;

    if (isLooping) {
      const loopElapsed = ((elapsed % adjustedDuration) + adjustedDuration) % adjustedDuration;
      const originalTime = loopElapsed * playbackSpeed;
      setPlayheadPosition(originalTime);
    } else {
      const progress = Math.min(1, elapsed / adjustedDuration);
      setPlayheadPosition(progress * rhythm.duration);

      if (elapsed >= adjustedDuration && !isRecording) {
        stopPlayback();
      }
    }
  }, []);

  const stopAllTimers = useCallback(() => {
    if (globalSchedulerTimer !== null) {
      clearInterval(globalSchedulerTimer);
      globalSchedulerTimer = null;
    }
    if (globalPlayheadTimer !== null) {
      clearInterval(globalPlayheadTimer);
      globalPlayheadTimer = null;
    }
    if (schedulerTimerRef.current !== null) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (playheadTimerRef.current !== null) {
      clearInterval(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    clearScheduledNotes();
    globalIsRunning = false;
    globalRhythmId = null;
    isRunningRef.current = false;
    rhythmIdRef.current = null;
  }, []);

  const startPlayback = useCallback(() => {
    const ctx = ensureAudioContext();
    const store = getStore();
    const { rhythm, addScheduledTimeout } = store;
    if (!ctx || !rhythm || rhythm.notes.length === 0) return;

    const rid = rhythm.id ?? 'default';
    if (globalIsRunning && globalRhythmId === rid) {
      return;
    }

    if (globalIsRunning) {
      stopAllTimers();
    }

    clearScheduledNotes();

    const startDelay = 0.05;
    const audioStartTime = ctx.currentTime + startDelay;
    const perfStartTime = performance.now() + startDelay * 1000;
    setLoopStartTime(audioStartTime, perfStartTime);

    globalSchedulerTimer = window.setInterval(scheduleNotes, LOOKAHEAD_INTERVAL);
    globalPlayheadTimer = window.setInterval(updatePlayhead, PLAYHEAD_INTERVAL);
    schedulerTimerRef.current = globalSchedulerTimer;
    playheadTimerRef.current = globalPlayheadTimer;
    addScheduledTimeout(globalSchedulerTimer);
    addScheduledTimeout(globalPlayheadTimer);

    globalIsRunning = true;
    globalRhythmId = rid;
    isRunningRef.current = true;
    rhythmIdRef.current = rid;
  }, [scheduleNotes, updatePlayhead, stopAllTimers]);

  useEffect(() => {
    const checkState = () => {
      const store = getStore();
      const { isPlaying, rhythm } = store;

      if (!isPlaying || !rhythm || rhythm.notes.length === 0) {
        if (globalIsRunning) {
          stopAllTimers();
        }
        return;
      }

      const rid = rhythm.id ?? 'default';
      if (!globalIsRunning || globalRhythmId !== rid) {
        startPlayback();
      }
    };

    unsubscribeRef.current = useDrumStore.subscribe(checkState);
    checkState();

    const interval = window.setInterval(checkState, 100);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearInterval(interval);
    };
  }, [startPlayback, stopAllTimers]);

  return { scheduleNotes };
}

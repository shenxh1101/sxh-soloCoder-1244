import { useEffect, useCallback, useRef } from 'react';
import { useDrumStore } from '@/store/drumStore';
import {
  ensureAudioContext,
  getAudioContext,
  getGainNodes,
  setLoopStartTime,
  getLoopStartPerfTime,
  getLoopStartAudioTime,
  getScheduledNoteIds,
  clearScheduledNotes,
  scheduleDrumAt,
} from '@/audio/engine';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { Note } from '@/types';

const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD_INTERVAL = 25;

export function usePlayback() {
  const isPlaying = useDrumStore(state => state.isPlaying);
  const isLooping = useDrumStore(state => state.isLooping);
  const isRecording = useDrumStore(state => state.isRecording);
  const rhythm = useDrumStore(state => state.rhythm);
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const stopPlayback = useDrumStore(state => state.stopPlayback);
  const addScheduledTimeout = useDrumStore(state => state.addScheduledTimeout);
  const triggerPad = useDrumStore(state => state.triggerPad);
  const releasePad = useDrumStore(state => state.releasePad);
  const setPlayheadPosition = useDrumStore(state => state.setPlayheadPosition);

  const schedulerTimerRef = useRef<number | null>(null);
  const playheadTimerRef = useRef<number | null>(null);

  const getSortedNotes = useCallback((): Note[] => {
    if (!rhythm || rhythm.notes.length === 0) return [];
    return [...rhythm.notes].sort((a, b) => a.time - b.time);
  }, [rhythm]);

  const getAdjustedTime = useCallback((noteTime: number): number => {
    return noteTime / playbackSpeed / 1000;
  }, [playbackSpeed]);

  const getAdjustedDurationSec = useCallback((): number => {
    if (!rhythm) return 0;
    return rhythm.duration / playbackSpeed / 1000;
  }, [rhythm, playbackSpeed]);

  const getAdjustedDurationMs = useCallback((): number => {
    if (!rhythm) return 0;
    return rhythm.duration / playbackSpeed;
  }, [rhythm, playbackSpeed]);

  const scheduleNotes = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx || !rhythm || rhythm.notes.length === 0) return;

    const sortedNotes = getSortedNotes();
    const adjustedDuration = getAdjustedDurationSec();
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
        const noteAudioTime = loopAudioTime + getAdjustedTime(note.time);

        if (noteAudioTime > currentAudioTime && noteAudioTime <= scheduleWindowEnd) {
          const scheduleKey = `${note.id}_${loopIndex}_${i}`;
          if (!scheduledIds.has(scheduleKey)) {
            scheduledIds.add(scheduleKey);

            scheduleDrumAt(note.drumId, note.velocity, noteAudioTime);

            const delayMs = (noteAudioTime - currentAudioTime) * 1000;
            const timeoutId = window.setTimeout(() => {
              triggerPad(note.drumId);
              setTimeout(() => releasePad(note.drumId), 150);
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
  }, [rhythm, isLooping, getSortedNotes, getAdjustedTime, getAdjustedDurationSec, triggerPad, releasePad, addScheduledTimeout]);

  const updatePlayhead = useCallback(() => {
    if (!rhythm) return;

    const loopStart = getLoopStartPerfTime();
    if (loopStart <= 0) return;

    const elapsed = performance.now() - loopStart;
    const adjustedDuration = getAdjustedDurationMs();

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
  }, [rhythm, playbackSpeed, isLooping, isRecording, setPlayheadPosition, stopPlayback, getAdjustedDurationMs]);

  const startPlaybackEngine = useCallback(() => {
    const ctx = ensureAudioContext();
    if (!ctx || !rhythm || rhythm.notes.length === 0) return;

    clearScheduledNotes();

    const startDelay = 0.05;
    const audioStartTime = ctx.currentTime + startDelay;
    const perfStartTime = performance.now() + startDelay * 1000;

    setLoopStartTime(audioStartTime, perfStartTime);

    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
    }
    schedulerTimerRef.current = window.setInterval(scheduleNotes, LOOKAHEAD_INTERVAL);
    addScheduledTimeout(schedulerTimerRef.current);

    if (playheadTimerRef.current) {
      clearInterval(playheadTimerRef.current);
    }
    playheadTimerRef.current = window.setInterval(updatePlayhead, 16);
    addScheduledTimeout(playheadTimerRef.current);
  }, [ensureAudioContext, rhythm, scheduleNotes, updatePlayhead, addScheduledTimeout]);

  const stopPlaybackEngine = useCallback(() => {
    if (schedulerTimerRef.current) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (playheadTimerRef.current) {
      clearInterval(playheadTimerRef.current);
      playheadTimerRef.current = null;
    }
    clearScheduledNotes();
  }, []);

  useEffect(() => {
    if (!isPlaying || !rhythm || rhythm.notes.length === 0) {
      stopPlaybackEngine();
      return;
    }

    startPlaybackEngine();

    return () => {
      stopPlaybackEngine();
    };
  }, [isPlaying, rhythm, startPlaybackEngine, stopPlaybackEngine]);

  return { scheduleNotes };
}

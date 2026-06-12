import { useEffect, useCallback } from 'react';
import { useDrumStore } from '@/store/drumStore';
import {
  ensureAudioContext,
  getAudioContext,
  getGainNodes,
  playDrumLive,
  scheduleDrumAt,
  getCurrentPlayheadTime,
  setDrumVolumes,
  setAudioContextCreatedCallback,
} from '@/audio/engine';

export function useAudioEngine() {
  const setAudioContext = useDrumStore(state => state.setAudioContext);
  const drumVolumes = useDrumStore(state => state.drumVolumes);
  const isRecording = useDrumStore(state => state.isRecording);
  const recordingUsesPlayhead = useDrumStore(state => state.recordingUsesPlayhead);
  const rhythm = useDrumStore(state => state.rhythm);
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const isLooping = useDrumStore(state => state.isLooping);
  const addNote = useDrumStore(state => state.addNote);
  const triggerPad = useDrumStore(state => state.triggerPad);
  const releasePad = useDrumStore(state => state.releasePad);

  useEffect(() => {
    setAudioContextCreatedCallback((ctx) => {
      setAudioContext(ctx);
    });

    const existingCtx = getAudioContext();
    if (existingCtx) {
      setAudioContext(existingCtx);
    }
  }, [setAudioContext]);

  useEffect(() => {
    setDrumVolumes(drumVolumes);
  }, [drumVolumes]);

  const playDrum = useCallback((drumId: string, velocity: number = 1) => {
    const hadSound = playDrumLive(drumId, velocity);
    if (!hadSound) return;

    triggerPad(drumId);
    setTimeout(() => releasePad(drumId), 150);

    if (isRecording) {
      let noteTime: number;

      if (recordingUsesPlayhead && rhythm && isLooping) {
        noteTime = getCurrentPlayheadTime(
          rhythm.duration,
          playbackSpeed,
          isLooping,
          recordingUsesPlayhead
        );
      } else {
        const state = useDrumStore.getState();
        noteTime = performance.now() - state.recordingStartTime;
      }

      addNote({
        drumId,
        time: noteTime,
        velocity
      });
    }
  }, [isRecording, recordingUsesPlayhead, rhythm, playbackSpeed, isLooping, addNote, triggerPad, releasePad]);

  const playDrumAt = useCallback((drumId: string, velocity: number = 1, audioTime: number) => {
    scheduleDrumAt(drumId, velocity, audioTime);
  }, []);

  const audioContextRef = {
    get current() { return getAudioContext(); },
    set current(_) {},
  };

  const gainNodesRef = {
    get current() { return getGainNodes(); },
    set current(_) {},
  };

  return {
    ensureAudioContext,
    playDrum,
    playDrumAt,
    gainNodesRef,
    masterGainRef: { current: null },
    audioContextRef,
  };
}

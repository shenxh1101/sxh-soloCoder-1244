import React from 'react';
import { Circle, Square, Play, Repeat, Trash2 } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { usePlayback } from '@/hooks/usePlayback';

export const ControlPanel: React.FC = () => {
  const isRecording = useDrumStore(state => state.isRecording);
  const isPlaying = useDrumStore(state => state.isPlaying);
  const isLooping = useDrumStore(state => state.isLooping);
  const rhythm = useDrumStore(state => state.rhythm);
  const startRecording = useDrumStore(state => state.startRecording);
  const stopRecording = useDrumStore(state => state.stopRecording);
  const startPlayback = useDrumStore(state => state.startPlayback);
  const stopPlayback = useDrumStore(state => state.stopPlayback);
  const toggleLooping = useDrumStore(state => state.toggleLooping);
  const clearRhythm = useDrumStore(state => state.clearRhythm);

  const { ensureAudioContext } = useAudioEngine();
  usePlayback();

  const handleRecord = () => {
    ensureAudioContext();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlay = () => {
    ensureAudioContext();
    if (!rhythm || rhythm.notes.length === 0) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(isLooping);
    }
  };

  const noteCount = rhythm?.notes.length ?? 0;
  const durationSec = rhythm ? (rhythm.duration / 1000).toFixed(1) : '0.0';

  return (
    <div
      className="rounded-2xl p-5 flex flex-wrap items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, #1c1c22 0%, #14141a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* 录音按钮 */}
      <button
        onClick={handleRecord}
        className="group relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200"
        style={{
          background: isRecording
            ? 'linear-gradient(145deg, #dc2626, #991b1b)'
            : 'linear-gradient(145deg, #2a2a32, #1a1a20)',
          color: isRecording ? '#fff' : '#ef4444',
          border: `1px solid ${isRecording ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
          boxShadow: isRecording
            ? '0 0 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <Circle
          size={14}
          fill={isRecording ? '#fff' : '#ef4444'}
          className={isRecording ? 'animate-pulse' : ''}
        />
        {isRecording ? '停止录制' : '录制'}
        {isRecording && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"
          />
        )}
      </button>

      {/* 播放按钮 */}
      <button
        onClick={handlePlay}
        disabled={!rhythm || rhythm.notes.length === 0}
        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isPlaying
            ? 'linear-gradient(145deg, #059669, #047857)'
            : 'linear-gradient(145deg, #2a2a32, #1a1a20)',
          color: isPlaying ? '#fff' : '#10b981',
          border: `1px solid ${isPlaying ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
          boxShadow: isPlaying
            ? '0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        {isPlaying ? '停止' : '播放'}
      </button>

      {/* 循环按钮 */}
      <button
        onClick={toggleLooping}
        className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200"
        style={{
          background: isLooping
            ? 'linear-gradient(145deg, #0891b2, #0e7490)'
            : 'linear-gradient(145deg, #2a2a32, #1a1a20)',
          color: isLooping ? '#fff' : '#06b6d4',
          border: `1px solid ${isLooping ? '#06b6d4' : 'rgba(6, 182, 212, 0.3)'}`,
          boxShadow: isLooping
            ? '0 0 20px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <Repeat size={14} />
        循环
      </button>

      {/* 清除按钮 */}
      <button
        onClick={clearRhythm}
        disabled={!rhythm || rhythm.notes.length === 0}
        className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(145deg, #2a2a32, #1a1a20)',
          color: '#6b7280',
          border: '1px solid rgba(107, 114, 128, 0.3)',
        }}
      >
        <Trash2 size={14} />
        清除
      </button>

      {/* 状态信息 */}
      <div className="flex items-center gap-6 ml-auto text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isRecording ? '#ef4444' : isPlaying ? '#10b981' : '#374151',
              boxShadow: isRecording || isPlaying ? `0 0 8px currentColor` : 'none',
            }}
          />
          <span style={{ color: '#9ca3af', fontFamily: 'Roboto Mono, monospace' }}>
            {isRecording ? '录制中...' : isPlaying ? '播放中...' : '空闲'}
          </span>
        </div>
        <div style={{ color: '#6b7280', fontFamily: 'Roboto Mono, monospace' }}>
          音符: <span style={{ color: '#00d4ff' }}>{noteCount}</span>
        </div>
        <div style={{ color: '#6b7280', fontFamily: 'Roboto Mono, monospace' }}>
          时长: <span style={{ color: '#00d4ff' }}>{durationSec}s</span>
        </div>
      </div>
    </div>
  );
};

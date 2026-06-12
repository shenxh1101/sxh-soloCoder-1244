import React from 'react';
import { Music, Minus, Plus } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
import { TIME_SIGNATURES, DEFAULT_BPM } from '@/utils/drumConfig';
import { useMetronome } from '@/hooks/useMetronome';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export const Metronome: React.FC = () => {
  const metronomeEnabled = useDrumStore(state => state.metronomeEnabled);
  const bpm = useDrumStore(state => state.metronomeBpm);
  const timeSignature = useDrumStore(state => state.metronomeTimeSignature);
  const currentBeat = useDrumStore(state => state.metronomeCurrentBeat);
  const setMetronomeEnabled = useDrumStore(state => state.setMetronomeEnabled);
  const setMetronomeBpm = useDrumStore(state => state.setMetronomeBpm);
  const setMetronomeTimeSignature = useDrumStore(state => state.setMetronomeTimeSignature);

  const { ensureAudioContext } = useAudioEngine();
  useMetronome();

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10);

  const handleToggle = () => {
    ensureAudioContext();
    setMetronomeEnabled(!metronomeEnabled);
  };

  const adjustBpm = (delta: number) => {
    setMetronomeBpm(Math.max(40, Math.min(240, bpm + delta)));
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #1c1c22 0%, #14141a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Music size={18} style={{ color: '#a855f7' }} />
        <h3
          className="text-sm font-bold tracking-wider"
          style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
        >
          节拍器
        </h3>
        <button
          onClick={handleToggle}
          className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
          style={{
            background: metronomeEnabled
              ? 'linear-gradient(145deg, #7c3aed, #6d28d9)'
              : 'linear-gradient(145deg, #2a2a32, #1a1a20)',
            color: metronomeEnabled ? '#fff' : '#a855f7',
            border: `1px solid ${metronomeEnabled ? '#a855f7' : 'rgba(168, 85, 247, 0.3)'}`,
            boxShadow: metronomeEnabled ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none',
          }}
        >
          {metronomeEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 节拍指示 */}
      <div className="flex justify-center gap-2 mb-5">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => {
          const beatNum = i + 1;
          const isActive = currentBeat === beatNum;
          const isStrong = beatNum === 1;
          return (
            <div
              key={i}
              className="w-6 h-6 rounded-full transition-all duration-100 flex items-center justify-center text-xs font-bold"
              style={{
                background: isActive
                  ? isStrong
                    ? 'radial-gradient(circle, #a855f7, #7c3aed)'
                    : 'radial-gradient(circle, #c084fc, #a855f7)'
                  : '#0a0a0d',
                border: isActive
                  ? '1px solid #c084fc'
                  : '1px solid #27272a',
                color: isActive ? '#fff' : '#52525b',
                boxShadow: isActive ? '0 0 12px rgba(168, 85, 247, 0.6)' : 'none',
                transform: isActive ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              {beatNum}
            </div>
          );
        })}
      </div>

      {/* BPM 控制 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs" style={{ color: '#6b7280' }}>BPM</span>
        <button
          onClick={() => adjustBpm(-5)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          style={{ background: '#0a0a0d', border: '1px solid #27272a', color: '#9ca3af' }}
        >
          <Minus size={14} />
        </button>
        <div
          className="flex-1 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: '#07070a',
            border: '1px solid #27272a',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="text-2xl font-bold tabular-nums"
            style={{
              color: '#a855f7',
              fontFamily: 'Orbitron, sans-serif',
              textShadow: '0 0 15px rgba(168, 85, 247, 0.5)',
            }}
          >
            {bpm.toString().padStart(3, '0')}
          </span>
        </div>
        <button
          onClick={() => adjustBpm(5)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          style={{ background: '#0a0a0d', border: '1px solid #27272a', color: '#9ca3af' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* BPM 滑块 */}
      <div className="relative h-2 rounded-full overflow-hidden mb-4" style={{ background: '#0a0a0d' }}>
        <div
          className="absolute h-full rounded-full transition-all duration-100"
          style={{
            width: `${((bpm - 40) / 200) * 100}%`,
            background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
          }}
        />
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setMetronomeBpm(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* 拍号选择 */}
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: '#6b7280' }}>拍号</span>
        <div className="flex gap-1.5">
          {TIME_SIGNATURES.map(ts => (
            <button
              key={ts}
              onClick={() => setMetronomeTimeSignature(ts)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={{
                background: timeSignature === ts
                  ? 'linear-gradient(145deg, #7c3aed, #6d28d9)'
                  : '#0a0a0d',
                color: timeSignature === ts ? '#fff' : '#6b7280',
                border: timeSignature === ts
                  ? '1px solid #a855f7'
                  : '1px solid #27272a',
                boxShadow: timeSignature === ts ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none',
                fontFamily: 'Roboto Mono, monospace',
              }}
            >
              {ts}
            </button>
          ))}
        </div>
      </div>

      {/* 预设BPM快捷按钮 */}
      <div className="flex gap-1.5 mt-4 flex-wrap">
        {[60, 80, 100, DEFAULT_BPM, 140, 180].map(v => (
          <button
            key={v}
            onClick={() => setMetronomeBpm(v)}
            className="px-2 py-1 rounded text-xs transition-all hover:bg-white/5"
            style={{
              background: bpm === v ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              color: bpm === v ? '#a855f7' : '#52525b',
              border: `1px solid ${bpm === v ? 'rgba(168, 85, 247, 0.5)' : '#27272a'}`,
              fontFamily: 'Roboto Mono, monospace',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

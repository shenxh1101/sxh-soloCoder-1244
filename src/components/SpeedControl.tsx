import React from 'react';
import { Gauge } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
import { MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED } from '@/utils/drumConfig';

export const SpeedControl: React.FC = () => {
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const setPlaybackSpeed = useDrumStore(state => state.setPlaybackSpeed);

  const percentage = ((playbackSpeed - MIN_PLAYBACK_SPEED) / (MAX_PLAYBACK_SPEED - MIN_PLAYBACK_SPEED)) * 100;

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
        <Gauge size={18} style={{ color: '#f97316' }} />
        <h3
          className="text-sm font-bold tracking-wider"
          style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
        >
          播放速度
        </h3>
        <span
          className="ml-auto text-xl font-bold tabular-nums"
          style={{
            color: '#f97316',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 12px rgba(249, 115, 22, 0.5)',
          }}
        >
          {(playbackSpeed * 100).toFixed(0)}%
        </span>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: '#0a0a0d' }}>
        {/* 刻度线 */}
        <div className="absolute inset-0 flex justify-between px-1 opacity-30">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-px h-full" style={{ background: '#374151' }} />
          ))}
        </div>
        {/* 填充 */}
        <div
          className="absolute h-full rounded-full transition-all duration-150"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #ea580c, #f97316, #fb923c)',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.5)',
          }}
        />
        <input
          type="range"
          min={MIN_PLAYBACK_SPEED}
          max={MAX_PLAYBACK_SPEED}
          step="0.05"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between mt-2 text-xs" style={{ color: '#4b5563', fontFamily: 'Roboto Mono, monospace' }}>
        <span>50%</span>
        <span>100%</span>
        <span>150%</span>
        <span>200%</span>
      </div>
    </div>
  );
};

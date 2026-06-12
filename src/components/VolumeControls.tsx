import React from 'react';
import { Volume2 } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
import { DRUM_CONFIGS } from '@/utils/drumConfig';

export const VolumeControls: React.FC = () => {
  const drumVolumes = useDrumStore(state => state.drumVolumes);
  const setDrumVolume = useDrumStore(state => state.setDrumVolume);

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
        <Volume2 size={18} style={{ color: '#00d4ff' }} />
        <h3
          className="text-sm font-bold tracking-wider"
          style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
        >
          音量调节
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {DRUM_CONFIGS.map(drum => (
          <div key={drum.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium truncate"
                style={{ color: '#9ca3af' }}
              >
                {drum.displayName}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: drum.glowColor }}
              >
                {Math.round(drumVolumes[drum.id] * 100)}%
              </span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden"
              style={{ background: '#0a0a0d' }}
            >
              <div
                className="absolute h-full rounded-full transition-all duration-100"
                style={{
                  width: `${drumVolumes[drum.id] * 100}%`,
                  background: `linear-gradient(90deg, ${drum.color}, ${drum.glowColor})`,
                  boxShadow: `0 0 8px ${drum.glowColor}60`,
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={drumVolumes[drum.id]}
                onChange={(e) => setDrumVolume(drum.id, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

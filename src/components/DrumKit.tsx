import React from 'react';
import { DrumPad } from './DrumPad';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export const DrumKit: React.FC = () => {
  const { playDrum, ensureAudioContext } = useAudioEngine();

  const handleTrigger = (drumId: string) => {
    ensureAudioContext();
    playDrum(drumId, 1);
  };

  return (
    <div className="relative w-full h-full">
      {/* 舞台地面 */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `
            radial-gradient(ellipse at center top, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at center bottom, rgba(255, 107, 53, 0.03) 0%, transparent 40%),
            linear-gradient(180deg, #1a1a20 0%, #0f0f13 100%)
          `,
          boxShadow: `
            inset 0 2px 20px rgba(0, 212, 255, 0.05),
            inset 0 -2px 20px rgba(0, 0, 0, 0.5),
            0 10px 40px rgba(0, 0, 0, 0.5)
          `,
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* 网格地板纹理 */}
        <div
          className="absolute inset-0 rounded-3xl opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* 鼓组件 */}
        <div className="absolute inset-0" style={{ minHeight: '500px' }}>
          {DRUM_CONFIGS.map(drum => (
            <DrumPad
              key={drum.id}
              drum={drum}
              onTrigger={() => handleTrigger(drum.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

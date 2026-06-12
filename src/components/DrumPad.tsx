import React from 'react';
import { DrumConfig } from '@/types';
import { useDrumStore } from '@/store/drumStore';

interface DrumPadProps {
  drum: DrumConfig;
  onTrigger: () => void;
}

export const DrumPad: React.FC<DrumPadProps> = ({ drum, onTrigger }) => {
  const isActive = useDrumStore(state => state.activePads.has(drum.id));

  const isCymbal = ['hihat-closed', 'hihat-open', 'crash', 'ride'].includes(drum.id);

  return (
    <div
      className="absolute cursor-pointer select-none transition-transform duration-75"
      style={{
        left: `${drum.position.x}%`,
        top: `${drum.position.y}%`,
        transform: `translate(-50%, -50%) scale(${isActive ? 0.95 : 1})`,
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onTrigger();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onTrigger();
      }}
    >
      <div
        className={`relative flex items-center justify-center transition-all duration-100 ${
          isActive ? 'scale-95' : ''
        }`}
        style={{
          width: drum.size,
          height: drum.size,
        }}
      >
        {/* 金属边框 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isCymbal
              ? 'radial-gradient(circle at 30% 30%, #fafafa, #d4d4d8 40%, #a1a1aa 70%, #71717a)'
              : 'linear-gradient(145deg, #4b5563, #1f2937, #111827)',
            boxShadow: isActive
              ? `0 0 40px 8px ${drum.glowColor}, inset 0 2px 10px rgba(0,0,0,0.5)`
              : `0 4px 15px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.1)`,
            padding: isCymbal ? '3px' : '8px',
          }}
        >
          {/* 鼓面/镲面 */}
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: isCymbal
                ? `radial-gradient(circle at 35% 35%, #ffffff, ${drum.color} 50%, #52525b)`
                : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2), transparent 50%), radial-gradient(circle, ${drum.color}, ${adjustColor(drum.color, -40)} 80%)`,
              boxShadow: isActive
                ? `inset 0 0 30px rgba(255,255,255,0.3)`
                : `inset 0 -4px 10px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.15)`,
            }}
          >
            {/* 鼓面同心圆装饰 */}
            {!isCymbal && (
              <>
                <div
                  className="absolute rounded-full border opacity-40"
                  style={{
                    width: '75%',
                    height: '75%',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                />
                <div
                  className="absolute rounded-full border opacity-20"
                  style={{
                    width: '55%',
                    height: '55%',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                />
              </>
            )}

            {/* 镲的纹路 */}
            {isCymbal && (
              <>
                <div
                  className="absolute rounded-full border opacity-30"
                  style={{
                    width: '80%',
                    height: '80%',
                    borderColor: '#52525b',
                  }}
                />
                <div
                  className="absolute rounded-full border opacity-20"
                  style={{
                    width: '60%',
                    height: '60%',
                    borderColor: '#71717a',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '15%',
                    height: '15%',
                    background: 'radial-gradient(circle, #fbbf24, #b45309)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                />
              </>
            )}

            {/* 鼓名称 */}
            <span
              className="font-bold text-xs uppercase tracking-wider relative z-10"
              style={{
                color: isCymbal ? '#3f3f46' : 'rgba(255,255,255,0.9)',
                textShadow: isCymbal ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {drum.name}
            </span>
          </div>
        </div>

        {/* 发光效果 */}
        {isActive && (
          <div
            className="absolute rounded-full pointer-events-none animate-ping"
            style={{
              width: drum.size,
              height: drum.size,
              background: `radial-gradient(circle, ${drum.glowColor}40, transparent 70%)`,
              animationDuration: '300ms',
            }}
          />
        )}

        {/* 按键标签 */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: drum.glowColor,
            border: `1px solid ${drum.glowColor}60`,
            fontFamily: 'Roboto Mono, monospace',
            textShadow: `0 0 6px ${drum.glowColor}`,
            boxShadow: `0 0 8px ${drum.glowColor}30`,
          }}
        >
          {drum.key.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

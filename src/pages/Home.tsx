import { useEffect, useCallback } from 'react';
import { DrumKit } from '@/components/DrumKit';
import { ControlPanel } from '@/components/ControlPanel';
import { VolumeControls } from '@/components/VolumeControls';
import { SpeedControl } from '@/components/SpeedControl';
import { Metronome } from '@/components/Metronome';
import { FileManager } from '@/components/FileManager';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { DRUM_CONFIGS } from '@/utils/drumConfig';
import { useDrumStore } from '@/store/drumStore';
import { Drumstick } from 'lucide-react';

export default function Home() {
  const { playDrum, ensureAudioContext } = useAudioEngine();
  const pressedKeys = useDrumStore(state => state.activePads);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const drum = DRUM_CONFIGS.find(d => d.keyCode === e.code);
    if (drum) {
      e.preventDefault();
      ensureAudioContext();
      playDrum(drum.id, 1);
    }
  }, [playDrum, ensureAudioContext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(0, 212, 255, 0.08) 0%, transparent 40%),
          radial-gradient(ellipse at 80% 100%, rgba(168, 85, 247, 0.06) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 50%, rgba(255, 107, 53, 0.03) 0%, transparent 60%),
          linear-gradient(180deg, #0a0a0d 0%, #050507 50%, #0a0a0d 100%)
        `,
      }}
    >
      {/* 噪点纹理 */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 标题栏 */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #0ea5e9, #0369a1)',
                boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)',
              }}
            >
              <Drumstick size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold tracking-wider"
                style={{
                  color: '#f3f4f6',
                  fontFamily: 'Orbitron, sans-serif',
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                }}
              >
                V-DRUM STUDIO
              </h1>
              <p className="text-xs" style={{ color: '#52525b' }}>
                网页电子鼓模拟器 · 录音 · 节拍器
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: '#52525b' }}>
            <span className="px-2 py-1 rounded" style={{ background: '#14141a', border: '1px solid #27272a', fontFamily: 'Roboto Mono, monospace' }}>
              5 DRUMS
            </span>
            <span className="px-2 py-1 rounded" style={{ background: '#14141a', border: '1px solid #27272a', fontFamily: 'Roboto Mono, monospace' }}>
              4 CYMBALS
            </span>
          </div>
        </header>

        {/* 主控制面板 */}
        <div className="mb-5">
          <ControlPanel />
        </div>

        {/* 主体布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* 鼓组区域 */}
          <div className="min-h-[560px] order-2 lg:order-1">
            <DrumKit />
          </div>

          {/* 右侧控制面板 */}
          <div className="flex flex-col gap-4 order-1 lg:order-2">
            <Metronome />
            <SpeedControl />
            <FileManager />
          </div>
        </div>

        {/* 音量控制 */}
        <div className="mt-5">
          <VolumeControls />
        </div>

        {/* 键盘提示 */}
        <div
          className="mt-5 rounded-2xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #14141a 0%, #0f0f13 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-xs mb-2" style={{ color: '#52525b' }}>
            ⌨️ 键盘映射
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DRUM_CONFIGS.map(drum => (
              <div
                key={drum.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${drum.color}40`,
                }}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    background: drum.color,
                    color: '#fff',
                    fontFamily: 'Roboto Mono, monospace',
                    boxShadow: `0 0 6px ${drum.glowColor}60`,
                  }}
                >
                  {drum.key.toUpperCase()}
                </span>
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  {drum.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 页脚 */}
        <footer className="mt-6 text-center text-xs" style={{ color: '#3f3f46' }}>
          <p>点击鼓垫或使用键盘按键演奏 · 支持触控设备 · 所有音频通过 Web Audio API 实时合成</p>
        </footer>
      </div>
    </div>
  );
}

import React, { useRef } from 'react';
import { Download, Upload, AlertTriangle, X } from 'lucide-react';
import { useDrumStore, validateRhythmData } from '@/store/drumStore';
import { RhythmData } from '@/types';
import { DRUM_CONFIGS } from '@/utils/drumConfig';

export const FileManager: React.FC = () => {
  const rhythm = useDrumStore(state => state.rhythm);
  const drumVolumes = useDrumStore(state => state.drumVolumes);
  const metronomeBpm = useDrumStore(state => state.metronomeBpm);
  const metronomeTimeSignature = useDrumStore(state => state.metronomeTimeSignature);
  const setRhythm = useDrumStore(state => state.setRhythm);
  const setAllDrumVolumes = useDrumStore(state => state.setAllDrumVolumes);
  const setMetronomeBpm = useDrumStore(state => state.setMetronomeBpm);
  const setMetronomeTimeSignature = useDrumStore(state => state.setMetronomeTimeSignature);
  const loadError = useDrumStore(state => state.loadError);
  const setLoadError = useDrumStore(state => state.setLoadError);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setLoadError(null);

    if (!rhythm || rhythm.notes.length === 0) {
      return;
    }

    const dataToExport: RhythmData = {
      id: rhythm.id,
      version: '1.0',
      name: rhythm.name || '我的节奏',
      createdAt: rhythm.createdAt || Date.now(),
      duration: rhythm.duration || 0,
      bpm: metronomeBpm,
      timeSignature: metronomeTimeSignature,
      notes: rhythm.notes,
      drumVolumes: drumVolumes,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataToExport.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      let data: unknown;

      try {
        data = JSON.parse(event.target?.result as string);
      } catch (parseErr) {
        setLoadError({
          type: 'invalid_json',
          message: 'JSON 解析失败: 文件不是有效的 JSON 格式，请检查文件内容',
        });
        return;
      }

      const validation = validateRhythmData(data);
      if (!validation.valid && validation.error) {
        setLoadError(validation.error);
        return;
      }

      const rhythmData = data as RhythmData;

      rhythmData.notes = rhythmData.notes.map((note, i) => ({
        ...note,
        id: note.id || `imported_${Date.now()}_${i}`,
      }));

      if (!rhythmData.id) {
        rhythmData.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } else {
        rhythmData.id = `${rhythmData.id}_loaded_${Date.now()}`;
      }

      const volumes: Record<string, number> = {};
      DRUM_CONFIGS.forEach(drum => {
        volumes[drum.id] = rhythmData.drumVolumes?.[drum.id] ?? drum.defaultVolume;
      });

      setAllDrumVolumes(volumes);
      if (rhythmData.bpm) setMetronomeBpm(rhythmData.bpm);
      if (rhythmData.timeSignature) setMetronomeTimeSignature(rhythmData.timeSignature);

      setRhythm({
        ...rhythmData,
        notes: rhythmData.notes,
        drumVolumes: volumes,
      });
    };

    reader.onerror = () => {
      setLoadError({
        type: 'invalid_file',
        message: '文件读取失败：无法读取选中的文件',
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const getErrorIcon = () => <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;

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
        <Download size={18} style={{ color: '#22d3ee' }} />
        <h3
          className="text-sm font-bold tracking-wider"
          style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
        >
          节奏管理
        </h3>
      </div>

      {/* 错误提示 */}
      {loadError && (
        <div
          className="mb-4 p-3 rounded-xl flex items-start gap-3"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          {getErrorIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-bold"
                style={{ color: '#f59e0b', fontFamily: 'Roboto Mono, monospace' }}
              >
                加载失败 · {loadError.type.toUpperCase().replace(/_/g, '-')}
              </span>
              <button
                onClick={() => setLoadError(null)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ color: '#9ca3af' }}
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#d1d5db' }}>
              {loadError.message}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={!rhythm || rhythm.notes.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(145deg, #0e7490, #155e75)',
            color: '#fff',
            border: '1px solid #22d3ee',
            boxShadow: '0 0 15px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <Download size={16} />
          导出 JSON
        </button>

        <button
          onClick={() => {
            setLoadError(null);
            fileInputRef.current?.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, #2a2a32, #1a1a20)',
            color: '#22d3ee',
            border: '1px solid rgba(34, 211, 238, 0.4)',
          }}
        >
          <Upload size={16} />
          导入 JSON
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* 成功提示 */}
      {rhythm && !loadError && rhythm.notes.length > 0 && (
        <div
          className="mt-3 px-3 py-2 rounded-lg text-xs flex items-center justify-between"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <span style={{ color: '#10b981' }}>
            ✓ 已加载节奏: <strong>{rhythm.name || '未命名'}</strong>
          </span>
          <span style={{ color: '#6b7280', fontFamily: 'Roboto Mono, monospace' }}>
            {rhythm.notes.length} 音符 · {(rhythm.duration / 1000).toFixed(1)}s · {rhythm.bpm} BPM
          </span>
        </div>
      )}

      <p className="text-xs mt-3 leading-relaxed" style={{ color: '#52525b' }}>
        导出的JSON文件包含所有音符、音量设置和节拍器参数，可随时导入继续编辑
      </p>
    </div>
  );
};

import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataToExport: RhythmData = {
      version: '1.0',
      name: rhythm?.name || '我的节奏',
      createdAt: rhythm?.createdAt || Date.now(),
      duration: rhythm?.duration || 0,
      bpm: metronomeBpm,
      timeSignature: metronomeTimeSignature,
      notes: rhythm?.notes || [],
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

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as RhythmData;
        
        if (!data || !Array.isArray(data.notes)) {
          alert('无效的节奏文件格式');
          return;
        }

        const validNotes = data.notes.filter(note =>
          note && typeof note.drumId === 'string' && typeof note.time === 'number'
        );

        const volumes: Record<string, number> = {};
        DRUM_CONFIGS.forEach(drum => {
          volumes[drum.id] = data.drumVolumes?.[drum.id] ?? drum.defaultVolume;
        });

        setAllDrumVolumes(volumes);
        if (data.bpm) setMetronomeBpm(data.bpm);
        if (data.timeSignature) setMetronomeTimeSignature(data.timeSignature);

        setRhythm({
          ...data,
          notes: validNotes,
          drumVolumes: volumes,
        });

        alert(`成功加载节奏: ${data.name || '未命名'}\n共 ${validNotes.length} 个音符`);
      } catch (err) {
        alert('解析JSON文件失败，请检查文件格式');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        <Download size={18} style={{ color: '#22d3ee' }} />
        <h3
          className="text-sm font-bold tracking-wider"
          style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
        >
          节奏管理
        </h3>
      </div>

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
          onClick={() => fileInputRef.current?.click()}
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

      <p className="text-xs mt-3 leading-relaxed" style={{ color: '#52525b' }}>
        导出的JSON文件包含所有音符、音量设置和节拍器参数，可随时导入继续编辑
      </p>
    </div>
  );
};

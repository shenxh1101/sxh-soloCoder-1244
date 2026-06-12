import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, ZoomIn, ZoomOut, Move, X } from 'lucide-react';
import { useDrumStore } from '@/store/drumStore';
import { Note } from '@/types';
import {
  DRUM_CONFIGS_BY_TRACK_ORDER,
  getBeatsPerMeasure,
  getMsPerBeat,
  getMsPerBar,
  timeToBeat,
} from '@/utils/drumConfig';

const TRACK_HEIGHT = 36;
const MIN_NOTE_WIDTH = 8;

export const TimelineEditor: React.FC = () => {
  const rhythm = useDrumStore(state => state.rhythm);
  const bpm = useDrumStore(state => state.metronomeBpm);
  const timeSignature = useDrumStore(state => state.metronomeTimeSignature);
  const playheadPosition = useDrumStore(state => state.playheadPosition);
  const playbackSpeed = useDrumStore(state => state.playbackSpeed);
  const timelineZoom = useDrumStore(state => state.timelineZoom);
  const setTimelineZoom = useDrumStore(state => state.setTimelineZoom);
  const selectedNoteId = useDrumStore(state => state.timelineSelection.noteId);
  const setSelectedNote = useDrumStore(state => state.setSelectedNote);
  const updateNote = useDrumStore(state => state.updateNote);
  const deleteNote = useDrumStore(state => state.deleteNote);
  const isPlaying = useDrumStore(state => state.isPlaying);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggingNote, setDraggingNote] = useState<{ noteId: string; startX: number; startTime: number } | null>(null);

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
  const msPerBeat = getMsPerBeat(bpm);
  const msPerBar = getMsPerBar(bpm, timeSignature);

  const totalDuration = rhythm
    ? Math.max(rhythm.duration, msPerBar * 2)
    : msPerBar * 4;

  const pixelsPerMs = (timelineZoom * 0.15) / playbackSpeed;
  const totalWidth = totalDuration * pixelsPerMs;

  const notesByDrum = useCallback(() => {
    const map: Record<string, Note[]> = {};
    DRUM_CONFIGS_BY_TRACK_ORDER.forEach(drum => {
      map[drum.id] = [];
    });
    if (rhythm) {
      rhythm.notes.forEach(note => {
        if (map[note.drumId]) {
          map[note.drumId].push(note);
        }
      });
    }
    return map;
  }, [rhythm]);

  const notes = notesByDrum();

  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setSelectedNote(note.id);
    setDraggingNote({
      noteId: note.id,
      startX: e.clientX,
      startTime: note.time,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingNote || !scrollContainerRef.current) return;

    const dx = e.clientX - draggingNote.startX;
    const dt = dx / pixelsPerMs;
    let newTime = Math.max(0, draggingNote.startTime + dt);

    const snapMs = msPerBeat / 4;
    newTime = Math.round(newTime / snapMs) * snapMs;

    updateNote(draggingNote.noteId, { time: newTime });
  }, [draggingNote, pixelsPerMs, msPerBeat, updateNote]);

  const handleMouseUp = useCallback(() => {
    setDraggingNote(null);
  }, []);

  useEffect(() => {
    if (draggingNote) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNote, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.timelineTrack) {
      setSelectedNote(null);
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(4, timelineZoom + delta));
    setTimelineZoom(newZoom);
  };

  const handleDeleteSelected = () => {
    if (selectedNoteId) {
      deleteNote(selectedNoteId);
    }
  };

  const selectedNote = rhythm?.notes.find(n => n.id === selectedNoteId);

  const getPlayheadPosition = () => {
    return playheadPosition * pixelsPerMs;
  };

  const renderRuler = () => {
    const bars = Math.ceil(totalDuration / msPerBar) + 1;
    const elements = [];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = bar * msPerBar;

      elements.push(
        <div
          key={`bar-${bar}`}
          className="absolute top-0 bottom-0 border-l border-dashed"
          style={{
            left: barStart * pixelsPerMs,
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <span
            className="absolute -top-0.5 text-[10px] font-bold px-1"
            style={{ color: '#6b7280', fontFamily: 'Roboto Mono, monospace' }}
          >
            {bar + 1}
          </span>
        </div>
      );

      for (let beat = 1; beat < beatsPerMeasure; beat++) {
        const beatPos = barStart + beat * msPerBeat;
        elements.push(
          <div
            key={`beat-${bar}-${beat}`}
            className="absolute top-0 bottom-0 border-l border-dashed"
            style={{
              left: beatPos * pixelsPerMs,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          />
        );
      }
    }

    return elements;
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1c1c22 0%, #14141a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* 工具栏 */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <Move size={16} style={{ color: '#06b6d4' }} />
          <h3
            className="text-sm font-bold tracking-wider"
            style={{ color: '#e5e7eb', fontFamily: 'Orbitron, sans-serif' }}
          >
            时间线编辑器
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(-0.5)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
              style={{ background: '#0a0a0d', border: '1px solid #27272a', color: '#9ca3af' }}
            >
              <ZoomOut size={14} />
            </button>
            <span
              className="w-12 text-center text-xs font-mono"
              style={{ color: '#6b7280' }}
            >
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.5)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
              style={{ background: '#0a0a0d', border: '1px solid #27272a', color: '#9ca3af' }}
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {selectedNoteId && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-red-500/10"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Trash2 size={12} />
              删除音符
            </button>
          )}
        </div>
      </div>

      {/* 选中音符信息 */}
      {selectedNote && (
        <div
          className="flex items-center gap-4 px-4 py-2 text-xs"
          style={{
            background: 'rgba(0, 212, 255, 0.05)',
            borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          }}
        >
          <span style={{ color: '#6b7280' }}>选中:</span>
          <span style={{ color: '#00d4ff', fontWeight: 600 }}>
            {DRUM_CONFIGS_BY_TRACK_ORDER.find(d => d.id === selectedNote.drumId)?.displayName || selectedNote.drumId}
          </span>
          <span style={{ color: '#6b7280' }}>位置:</span>
          <span style={{ color: '#00d4ff', fontFamily: 'Roboto Mono, monospace' }}>
            {(timeToBeat(selectedNote.time, bpm) + 1).toFixed(2)} 拍
          </span>
          <span style={{ color: '#6b7280' }}>力度:</span>
          <span style={{ color: '#00d4ff', fontFamily: 'Roboto Mono, monospace' }}>
            {Math.round(selectedNote.velocity * 100)}%
          </span>
          <button
            onClick={() => setSelectedNote(null)}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: '#6b7280' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 时间线主体 */}
      <div className="flex">
        {/* 轨道名称 */}
        <div
          className="flex-shrink-0"
          style={{
            width: 110,
            background: 'rgba(0,0,0,0.3)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ height: 28 }} />
          {DRUM_CONFIGS_BY_TRACK_ORDER.map(drum => (
            <div
              key={drum.id}
              className="flex items-center px-3 gap-2"
              style={{
                height: TRACK_HEIGHT,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: drum.color,
                  boxShadow: `0 0 6px ${drum.glowColor}60`,
                }}
              />
              <span
                className="text-xs font-medium truncate"
                style={{ color: '#9ca3af' }}
              >
                {drum.displayName}
              </span>
            </div>
          ))}
        </div>

        {/* 滚动区域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onClick={handleTimelineClick}
          style={{ maxHeight: DRUM_CONFIGS_BY_TRACK_ORDER.length * TRACK_HEIGHT + 28 + 20 }}
        >
          <div
            className="relative"
            style={{ width: totalWidth, minWidth: '100%' }}
          >
            {/* 标尺 */}
            <div className="relative" style={{ height: 28 }}>
              {renderRuler()}
            </div>

            {/* 播放头 */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
                style={{
                  left: getPlayheadPosition(),
                  background: 'linear-gradient(180deg, #ef4444, #dc2626)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                }}
              >
                <div
                  className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: '#ef4444',
                  }}
                />
              </div>
            )}

            {/* 轨道 */}
            {DRUM_CONFIGS_BY_TRACK_ORDER.map((drum, trackIndex) => (
              <div
                key={drum.id}
                data-timeline-track="true"
                className="relative"
                style={{
                  height: TRACK_HEIGHT,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: trackIndex % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'transparent',
                }}
              >
                {notes[drum.id]?.map(note => {
                  const isSelected = note.id === selectedNoteId;
                  const left = note.time * pixelsPerMs;
                  const width = Math.max(MIN_NOTE_WIDTH, 10 * timelineZoom);

                  return (
                    <div
                      key={note.id}
                      className={`absolute top-1/2 -translate-y-1/2 rounded-md cursor-pointer transition-all duration-75 ${
                        draggingNote?.noteId === note.id ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        left,
                        width,
                        height: TRACK_HEIGHT * 0.7,
                        background: isSelected
                          ? `linear-gradient(135deg, ${drum.glowColor}, ${drum.color})`
                          : `linear-gradient(135deg, ${drum.color}dd, ${drum.color})`,
                        border: `2px solid ${isSelected ? '#ffffff' : drum.glowColor}60`,
                        boxShadow: isSelected
                          ? `0 0 15px ${drum.glowColor}, 0 0 25px ${drum.glowColor}60`
                          : `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        zIndex: isSelected ? 10 : 1,
                      }}
                      onMouseDown={(e) => handleNoteMouseDown(e, note)}
                    >
                      {width > 30 && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                          style={{
                            color: 'rgba(255,255,255,0.9)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {drum.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div
        className="px-4 py-2 flex items-center justify-between text-[11px]"
        style={{
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: '#52525b',
        }}
      >
        <span>拖拽音符调整位置 · 点击选中后可删除 · 自动吸附到 1/4 拍</span>
        <span style={{ fontFamily: 'Roboto Mono, monospace' }}>
          共 {rhythm?.notes.length || 0} 个音符 · 总长 {(totalDuration / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  );
};

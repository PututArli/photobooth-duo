'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { CapturedPhoto, RoomState, RealtimeMessage } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';

interface DecoratePageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  selectedIndices: number[];
  roomState: RoomState;
  participantId: string;
  broadcast: (msg: RealtimeMessage) => void;
  onComplete: (dataUrl: string) => void;
  onBack: () => void;
}

interface Point { x: number; y: number }
interface Line { color: string; width: number; points: Point[] }
interface StickerItem { id: string; url: string; x: number; y: number; scale: number; rotation: number; isFlipped?: boolean }

const STICKERS = [
  '/stickers/blue-cloud.png',
  '/stickers/board.png',
  '/stickers/black-cloud.png',
  '/stickers/eat.png',
  '/stickers/flowers.png',
  '/stickers/fried-egg.png',
  '/stickers/meditation.png',
  '/stickers/pink-cloud.png',
  '/stickers/rose.png',
];

const COLORS = ['#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#20c997', '#51cf66', '#fcc419', '#ff922b', '#ffffff', '#000000'];
const WIDTHS = [4, 8, 12];

export default function DecoratePage({
  myPhotos,
  partnerPhotos,
  selectedIndices,
  roomState,
  participantId,
  broadcast,
  onComplete,
  onBack,
}: DecoratePageProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [baseImgUrl, setBaseImgUrl] = useState<string>('');
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<'stickers' | 'draw'>('stickers');

  // State for Drawings
  const [lines, setLines] = useState<Line[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(WIDTHS[1]);
  const isDrawing = useRef(false);
  const currentLine = useRef<Line | null>(null);

  // State for Stickers
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  // Interaction refs
  const dragRef = useRef<{ id: string; type: 'move' | 'rotate' | 'scale'; startX: number; startY: number; initX: number; initY: number; initScale: number; initRot: number } | null>(null);

  const lastBroadcast = useRef(0);

  // 1. Generate Base Image
  useEffect(() => {
    if (!offscreenCanvasRef.current) return;
    const orderedMyPhotos = selectedIndices.map(i => myPhotos[i]?.dataUrl || '');
    const orderedPartnerPhotos = selectedIndices.map(i => partnerPhotos[i]?.dataUrl || '');

    composeDuoPhoto({
      myPhotos: orderedMyPhotos,
      partnerPhotos: orderedPartnerPhotos,
      state: roomState,
      canvas: offscreenCanvasRef.current,
    }).then(() => {
      const url = offscreenCanvasRef.current!.toDataURL('image/png');
      setBaseImgUrl(url);
      setImgSize({ w: offscreenCanvasRef.current!.width, h: offscreenCanvasRef.current!.height });
    });
  }, [myPhotos, partnerPhotos, selectedIndices, roomState]);

  // 3. Drawing Logic
  const redrawCanvas = useCallback((linesToDraw: Line[]) => {
    const cvs = drawCanvasRef.current;
    if (!cvs || imgSize.w === 0) return;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    linesToDraw.forEach(line => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [imgSize]);

  // 2. Realtime Listener
  useEffect(() => {
    const handleSync = (e: CustomEvent) => {
      const data = e.detail;
      if (data.lines) {
        setLines(data.lines);
        redrawCanvas(data.lines);
      }
      if (data.stickers) setStickers(data.stickers);
    };
    window.addEventListener('sync_decorate', handleSync as EventListener);
    return () => window.removeEventListener('sync_decorate', handleSync as EventListener);
  }, [redrawCanvas]);

  // Listen for the complete trigger to generate local photo
  useEffect(() => {
    const handleTrigger = () => {
      handleNext(false);
    };
    window.addEventListener('trigger_complete_decorate', handleTrigger as EventListener);
    return () => window.removeEventListener('trigger_complete_decorate', handleTrigger as EventListener);
  }, [baseImgUrl, lines, stickers]);

  // Throttled Broadcast
  const syncState = useCallback((newLines?: Line[], newStickers?: StickerItem[], force = false) => {
    const now = Date.now();
    if (force || now - lastBroadcast.current > 250) {
      broadcast({
        type: 'sync_decorate',
        senderId: participantId,
        payload: {
          lines: newLines || lines,
          stickers: newStickers || stickers,
        }
      });
      lastBroadcast.current = now;
    }
  }, [broadcast, participantId, lines, stickers]);



  useEffect(() => {
    redrawCanvas(lines);
  }, [lines, redrawCanvas]);

  const getPos = (e: React.PointerEvent) => {
    const rect = drawCanvasRef.current!.getBoundingClientRect();
    const scaleX = imgSize.w / rect.width;
    const scaleY = imgSize.h / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'draw') return;
    isDrawing.current = true;
    const p = getPos(e);
    currentLine.current = { color, width: lineWidth, points: [p] };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'draw' && isDrawing.current && currentLine.current) {
      currentLine.current.points.push(getPos(e));
      redrawCanvas([...lines, currentLine.current]);
      syncState([...lines, currentLine.current], stickers);
    } else if (mode === 'stickers' && dragRef.current) {
      const { id, type, startX, startY, initX, initY, initScale, initRot } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setStickers(prev => {
        const next = prev.map(s => {
          if (s.id !== id) return s;
          if (type === 'move') {
            // Very rough scale estimation for movement.
            const rect = containerRef.current!.getBoundingClientRect();
            const scale = imgSize.w / rect.width;
            return { ...s, x: initX + dx * scale, y: initY + dy * scale };
          }
          if (type === 'scale') {
            const delta = (dx + dy) * 0.005;
            return { ...s, scale: Math.max(0.2, initScale + delta) };
          }
          if (type === 'rotate') {
            return { ...s, rotation: initRot + dx * 0.5 };
          }
          return s;
        });
        syncState(lines, next);
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    if (mode === 'draw' && isDrawing.current && currentLine.current) {
      isDrawing.current = false;
      const newLines = [...lines, currentLine.current];
      setLines(newLines);
      syncState(newLines, stickers, true);
      currentLine.current = null;
    }
    if (mode === 'stickers' && dragRef.current) {
      dragRef.current = null;
    }
  };

  // 4. Sticker Logic
  const addSticker = (url: string) => {
    const newSticker: StickerItem = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      x: imgSize.w / 2,
      y: imgSize.h / 2,
      scale: 1,
      rotation: 0
    };
    const newStickers = [...stickers, newSticker];
    setStickers(newStickers);
    setSelectedSticker(newSticker.id);
    setMode('stickers');
    syncState(lines, newStickers, true);
  };

  const removeSticker = (id: string) => {
    const next = stickers.filter(s => s.id !== id);
    setStickers(next);
    if (selectedSticker === id) setSelectedSticker(null);
    syncState(lines, next, true);
  };

  const undoDraw = () => {
    const next = lines.slice(0, -1);
    setLines(next);
    syncState(next, stickers, true);
  };

  const clearDraw = () => {
    setLines([]);
    syncState([], stickers, true);
  };

  // 5. Finalize Image
  const handleNext = async (andBroadcast = true) => {
    if (andBroadcast) {
      broadcast({ type: 'trigger_complete_decorate', senderId: participantId });
    }
    
    if (!offscreenCanvasRef.current || !baseImgUrl) return;
    const cvs = offscreenCanvasRef.current;
    const ctx = cvs.getContext('2d')!;

    // Draw base
    const baseImg = new Image();
    baseImg.src = baseImgUrl;
    await new Promise(r => { baseImg.onload = r; baseImg.onerror = r; });
    ctx.drawImage(baseImg, 0, 0);

    // Draw lines
    ctx.drawImage(drawCanvasRef.current!, 0, 0);

    // Draw stickers
    for (const s of stickers) {
      const sImg = new Image();
      sImg.src = s.url;
      await new Promise(r => { sImg.onload = r; sImg.onerror = r; });
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.scale, s.scale);
      // Assuming native size of sticker, draw centered
      ctx.drawImage(sImg, -sImg.width / 2, -sImg.height / 2);
      ctx.restore();
    }

    onComplete(cvs.toDataURL('image/png'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface)' }}
      onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', padding: 8 }}>
        {baseImgUrl && imgSize.w > 0 ? (
          <div 
            ref={containerRef}
            style={{ 
              position: 'relative',
              width: `min(100%, calc((100dvh - 200px) * ${imgSize.w / imgSize.h}))`,
              aspectRatio: `${imgSize.w}/${imgSize.h}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              touchAction: 'none'
            }}
            onPointerDown={() => setSelectedSticker(null)} // deselect on background click
          >
            {/* Base Image */}
            <img src={baseImgUrl} alt="base" style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none', objectFit: 'contain' }} />

            {/* Draw Canvas */}
            <canvas
              ref={drawCanvasRef}
              width={imgSize.w}
              height={imgSize.h}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: mode === 'draw' ? 'auto' : 'none',
                touchAction: 'none'
              }}
              onPointerDown={handlePointerDown}
            />

            {/* Stickers Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {stickers.map(s => {
              const isSelected = selectedSticker === s.id;
              // Translate coordinate system from original image size to current display size
              const scaleX = (containerRef.current?.clientWidth || imgSize.w) / imgSize.w;

              return (
                <div key={s.id}
                  style={{
                    position: 'absolute',
                    left: s.x * scaleX,
                    top: s.y * scaleX,
                    transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale * scaleX})`,
                    cursor: mode === 'stickers' ? 'grab' : 'default',
                    pointerEvents: mode === 'stickers' ? 'auto' : 'none',
                    border: isSelected ? '2px dashed var(--accent)' : 'none',
                    padding: isSelected ? 4 : 0,
                  }}
                  onPointerDown={(e) => {
                    if (mode !== 'stickers') return;
                    e.stopPropagation();
                    setSelectedSticker(s.id);
                    dragRef.current = { id: s.id, type: 'move', startX: e.clientX, startY: e.clientY, initX: s.x, initY: s.y, initScale: s.scale, initRot: s.rotation };
                  }}
                >
                  <img src={s.url} alt="sticker" style={{ display: 'block', pointerEvents: 'none', userSelect: 'none' }} />

                  {isSelected && (
                    <>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                        style={{ position: 'absolute', top: -15, left: -15, background: 'var(--danger)', color: 'var(--bg)', borderRadius: '50%', width: 26, height: 26, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}
                      >✕</button>

                      {/* Resize Handle */}
                      <div
                        style={{ position: 'absolute', bottom: -15, right: -15, background: 'var(--accent)', color: 'var(--bg)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nwse-resize', pointerEvents: 'auto' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragRef.current = { id: s.id, type: 'scale', startX: e.clientX, startY: e.clientY, initX: s.x, initY: s.y, initScale: s.scale, initRot: s.rotation };
                        }}
                      >⤡</div>

                      {/* Rotate Handle */}
                      <div
                        style={{ position: 'absolute', top: -15, right: -15, background: '#4dabf7', color: '#fff', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ew-resize', pointerEvents: 'auto' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragRef.current = { id: s.id, type: 'rotate', startX: e.clientX, startY: e.clientY, initX: s.x, initY: s.y, initScale: s.scale, initRot: s.rotation };
                        }}
                      >↻</div>
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        ) : (
          <div className="spinner" />
        )}
      </div>

      {/* Toolbar */}
      <div style={{ padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => setMode('stickers')}
            style={{ padding: '8px 20px', borderRadius: 100, border: '1px solid var(--border)', background: mode === 'stickers' ? 'var(--text)' : 'transparent', color: mode === 'stickers' ? 'var(--bg)' : 'var(--text)', fontWeight: 600, transition: 'all 0.2s', fontSize: 14 }}
          >✨ {t('decorate.stickers')}</button>
          <button
            onClick={() => { setMode('draw'); setSelectedSticker(null); }}
            style={{ padding: '8px 20px', borderRadius: 100, border: '1px solid var(--border)', background: mode === 'draw' ? 'var(--text)' : 'transparent', color: mode === 'draw' ? 'var(--bg)' : 'var(--text)', fontWeight: 600, transition: 'all 0.2s', fontSize: 14 }}
          >✏️ {t('decorate.draw')}</button>
        </div>

        {/* Tools Panel */}
        <div style={{ minHeight: 64, display: 'flex', alignItems: 'center', width: '100%' }}>
          {mode === 'stickers' ? (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: 8, padding: '4px', overflowX: 'auto', maxWidth: '100%' }}>
                {STICKERS.map(url => (
                  <div key={url} onClick={() => addSticker(url)} style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <img src={url} alt="sticker option" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              {/* Colors */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '100%', padding: '4px 0' }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text)' : '1px solid var(--border)', transform: color === c ? 'scale(1.1)' : 'none', transition: 'all 0.2s' }} />
                  ))}
                </div>
              </div>
              {/* Widths & Actions */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {WIDTHS.map(w => (
                    <button key={w} onClick={() => setLineWidth(w)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: lineWidth === w ? 'var(--surface3)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: w, height: w, borderRadius: '50%', background: 'var(--text)' }} />
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                <button onClick={undoDraw} disabled={lines.length === 0} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', opacity: lines.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩️</button>
                <button onClick={clearDraw} disabled={lines.length === 0} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', opacity: lines.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <button onClick={() => handleNext(true)} style={{ padding: '12px 24px', background: 'var(--text)', color: 'var(--bg)', borderRadius: 100, fontWeight: 700, fontSize: 16, width: '100%', maxWidth: 400 }}>{t('decorate.finish')} ▷</button>
        </div>
      </div>

      <canvas ref={offscreenCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

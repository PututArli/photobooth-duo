'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BringToFront, Brush, Copy, FlipHorizontal, Redo2, SendToBack, Sticker, Trash2, Type, Undo2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';
import { CapturedPhoto, RoomState, RealtimeMessage } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';

interface DecoratePageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  selectedIndices: number[];
  roomState: RoomState;
  participantId: string;
  broadcast: (msg: RealtimeMessage) => void;
  onComplete: (dataUrl: string, decorationsUrl?: string) => void;
  onBack: () => void;
}

interface Point { x: number; y: number }
interface Line { color: string; width: number; points: Point[] }
interface StickerItem { id: string; url: string; x: number; y: number; size: number; scale: number; rotation: number; z: number; isFlipped?: boolean }
interface TextItem { id: string; text: string; x: number; y: number; color: string; fontSize: number; fontFamily: string; scale: number; rotation: number; z: number }
interface Snapshot { lines: Line[]; stickers: StickerItem[]; textItems: TextItem[] }
type Mode = 'stickers' | 'text' | 'draw';
type SelectedItem = { type: 'sticker' | 'text'; id: string } | null;

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
const FONT_OPTIONS = ['Plus Jakarta Sans', 'Georgia', 'Arial', 'Courier New'];

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return {
    lines: snapshot.lines.map(line => ({
      ...line,
      points: line.points.map(point => ({ ...point })),
    })),
    stickers: snapshot.stickers.map(sticker => ({ ...sticker })),
    textItems: snapshot.textItems.map(item => ({ ...item })),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(image);
    image.src = src;
  });
}

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
  const stageRef = useRef<HTMLElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentLine = useRef<Line | null>(null);
  const lastBroadcast = useRef(0);
  const historyRef = useRef<Snapshot[]>([]);
  const redoRef = useRef<Snapshot[]>([]);
  const dragRef = useRef<{
    type: 'sticker' | 'text';
    id: string;
    action: 'move' | 'rotate' | 'scale';
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initScale: number;
    initRot: number;
  } | null>(null);

  const [baseImgUrl, setBaseImgUrl] = useState('');
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<Mode>('stickers');
  const [lines, setLines] = useState<Line[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(WIDTHS[1]);
  const [textDraft, setTextDraft] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(64);
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0]);
  const [historyCount, setHistoryCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  const activeText = selectedItem?.type === 'text'
    ? textItems.find(item => item.id === selectedItem.id)
    : null;

  const getSnapshot = useCallback((): Snapshot => cloneSnapshot({ lines, stickers, textItems }), [lines, stickers, textItems]);

  const refreshHistoryState = () => {
    setHistoryCount(historyRef.current.length);
    setRedoCount(redoRef.current.length);
  };

  const redrawCanvas = useCallback((linesToDraw: Line[]) => {
    const canvas = drawCanvasRef.current;
    if (!canvas || imgSize.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    linesToDraw.forEach(line => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i += 1) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [imgSize.w]);

  const syncState = useCallback((nextLines = lines, nextStickers = stickers, nextTextItems = textItems, force = false) => {
    const now = Date.now();
    if (!force && now - lastBroadcast.current <= 250) return;

    broadcast({
      type: 'sync_decorate',
      senderId: participantId,
      payload: {
        lines: nextLines,
        stickers: nextStickers,
        textItems: nextTextItems,
      },
    });
    lastBroadcast.current = now;
  }, [broadcast, participantId, lines, stickers, textItems]);

  const applySnapshot = useCallback((snapshot: Snapshot, shouldSync = true) => {
    const next = cloneSnapshot(snapshot);
    setLines(next.lines);
    setStickers(next.stickers);
    setTextItems(next.textItems);
    redrawCanvas(next.lines);
    if (shouldSync) syncState(next.lines, next.stickers, next.textItems, true);
  }, [redrawCanvas, syncState]);

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-39), getSnapshot()];
    redoRef.current = [];
    refreshHistoryState();
  }, [getSnapshot]);

  const getCanvasPoint = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || imgSize.w === 0 || imgSize.h === 0) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) * (imgSize.w / rect.width),
      y: (e.clientY - rect.top) * (imgSize.h / rect.height),
    };
  };

  const getDisplayScale = () => {
    const width = containerRef.current?.clientWidth || imgSize.w || 1;
    return width / (imgSize.w || 1);
  };

  const getNextZ = () => Math.max(0, ...stickers.map(item => item.z), ...textItems.map(item => item.z)) + 1;

  const handleUndo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    redoRef.current.push(getSnapshot());
    applySnapshot(previous);
    refreshHistoryState();
  };

  const handleRedo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(getSnapshot());
    applySnapshot(next);
    refreshHistoryState();
  };

  const addSticker = (url: string) => {
    pushHistory();
    const newSticker: StickerItem = {
      id: Math.random().toString(36).slice(2, 11),
      url,
      x: imgSize.w / 2,
      y: imgSize.h / 2,
      size: Math.max(90, Math.round(imgSize.w * 0.16)),
      scale: 1,
      rotation: 0,
      z: getNextZ(),
    };
    const next = [...stickers, newSticker];
    setStickers(next);
    setSelectedItem({ type: 'sticker', id: newSticker.id });
    setMode('stickers');
    syncState(lines, next, textItems, true);
  };

  const addOrUpdateText = () => {
    const trimmed = textDraft.trim();
    if (!trimmed) return;

    pushHistory();
    if (selectedItem?.type === 'text') {
      const next = textItems.map(item => item.id === selectedItem.id
        ? { ...item, text: trimmed, color: textColor, fontSize: textSize, fontFamily: textFont }
        : item);
      setTextItems(next);
      syncState(lines, stickers, next, true);
      return;
    }

    const newText: TextItem = {
      id: Math.random().toString(36).slice(2, 11),
      text: trimmed,
      x: imgSize.w / 2,
      y: imgSize.h / 2,
      color: textColor,
      fontSize: textSize,
      fontFamily: textFont,
      scale: 1,
      rotation: 0,
      z: getNextZ(),
    };
    const next = [...textItems, newText];
    setTextItems(next);
    setSelectedItem({ type: 'text', id: newText.id });
    syncState(lines, stickers, next, true);
  };

  const startNewText = () => {
    setSelectedItem(null);
    setTextDraft('');
    setTextColor('#ffffff');
    setTextSize(64);
    setTextFont(FONT_OPTIONS[0]);
  };

  const updateActiveText = (partial: Partial<TextItem>) => {
    if (selectedItem?.type !== 'text') return;
    const next = textItems.map(item => item.id === selectedItem.id ? { ...item, ...partial } : item);
    setTextItems(next);
    syncState(lines, stickers, next);
  };

  const duplicateSelected = () => {
    if (!selectedItem) return;
    pushHistory();

    if (selectedItem.type === 'sticker') {
      const source = stickers.find(item => item.id === selectedItem.id);
      if (!source) return;
      const copyItem = { ...source, id: Math.random().toString(36).slice(2, 11), x: source.x + 28, y: source.y + 28, z: getNextZ() };
      const next = [...stickers, copyItem];
      setStickers(next);
      setSelectedItem({ type: 'sticker', id: copyItem.id });
      syncState(lines, next, textItems, true);
      return;
    }

    const source = textItems.find(item => item.id === selectedItem.id);
    if (!source) return;
    const copyItem = { ...source, id: Math.random().toString(36).slice(2, 11), x: source.x + 28, y: source.y + 28, z: getNextZ() };
    const next = [...textItems, copyItem];
    setTextItems(next);
    setSelectedItem({ type: 'text', id: copyItem.id });
    syncState(lines, stickers, next, true);
  };

  const deleteSelected = () => {
    if (!selectedItem) return;
    pushHistory();

    if (selectedItem.type === 'sticker') {
      const next = stickers.filter(item => item.id !== selectedItem.id);
      setStickers(next);
      setSelectedItem(null);
      syncState(lines, next, textItems, true);
      return;
    }

    const next = textItems.filter(item => item.id !== selectedItem.id);
    setTextItems(next);
    setSelectedItem(null);
    syncState(lines, stickers, next, true);
  };

  const flipSelected = () => {
    if (selectedItem?.type !== 'sticker') return;
    pushHistory();
    const next = stickers.map(item => item.id === selectedItem.id ? { ...item, isFlipped: !item.isFlipped } : item);
    setStickers(next);
    syncState(lines, next, textItems, true);
  };

  const moveLayer = (direction: 'front' | 'back') => {
    if (!selectedItem) return;
    pushHistory();
    const minZ = Math.min(0, ...stickers.map(item => item.z), ...textItems.map(item => item.z));
    const z = direction === 'front' ? getNextZ() : minZ - 1;

    if (selectedItem.type === 'sticker') {
      const next = stickers.map(item => item.id === selectedItem.id ? { ...item, z } : item);
      setStickers(next);
      syncState(lines, next, textItems, true);
      return;
    }

    const next = textItems.map(item => item.id === selectedItem.id ? { ...item, z } : item);
    setTextItems(next);
    syncState(lines, stickers, next, true);
  };

  const clearDraw = () => {
    if (lines.length === 0) return;
    pushHistory();
    setLines([]);
    redrawCanvas([]);
    syncState([], stickers, textItems, true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    isDrawing.current = true;
    const point = getCanvasPoint(e);
    currentLine.current = { color, width: lineWidth, points: [point] };
  };

  const startDrag = (e: React.PointerEvent, type: 'sticker' | 'text', id: string, action: 'move' | 'rotate' | 'scale', item: StickerItem | TextItem) => {
    if (mode === 'draw') return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    setSelectedItem({ type, id });
    dragRef.current = {
      type,
      id,
      action,
      startX: e.clientX,
      startY: e.clientY,
      initX: item.x,
      initY: item.y,
      initScale: item.scale,
      initRot: item.rotation,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'draw' && isDrawing.current && currentLine.current) {
      e.preventDefault();
      currentLine.current.points.push(getCanvasPoint(e));
      redrawCanvas([...lines, currentLine.current]);
      syncState([...lines, currentLine.current], stickers, textItems);
      return;
    }

    if (!dragRef.current) return;
    e.preventDefault();

    const drag = dragRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const canvasDx = dx * (imgSize.w / rect.width);
    const canvasDy = dy * (imgSize.h / rect.height);
    const deltaScale = Math.max(0.2, drag.initScale + (dx + dy) * 0.005);
    const rotation = drag.initRot + dx * 0.45;

    if (drag.type === 'sticker') {
      setStickers(prev => {
        const next = prev.map(item => {
          if (item.id !== drag.id) return item;
          if (drag.action === 'move') return { ...item, x: drag.initX + canvasDx, y: drag.initY + canvasDy };
          if (drag.action === 'scale') return { ...item, scale: deltaScale };
          return { ...item, rotation };
        });
        syncState(lines, next, textItems);
        return next;
      });
      return;
    }

    setTextItems(prev => {
      const next = prev.map(item => {
        if (item.id !== drag.id) return item;
        if (drag.action === 'move') return { ...item, x: drag.initX + canvasDx, y: drag.initY + canvasDy };
        if (drag.action === 'scale') return { ...item, scale: deltaScale };
        return { ...item, rotation };
      });
      syncState(lines, stickers, next);
      return next;
    });
  };

  const handlePointerUp = () => {
    if (mode === 'draw' && isDrawing.current && currentLine.current) {
      const next = [...lines, currentLine.current];
      isDrawing.current = false;
      currentLine.current = null;
      setLines(next);
      syncState(next, stickers, textItems, true);
    }

    if (dragRef.current) {
      dragRef.current = null;
      syncState(lines, stickers, textItems, true);
    }
  };

  const drawItems = useCallback(async (ctx: CanvasRenderingContext2D) => {
    const items = [
      ...stickers.map(item => ({ kind: 'sticker' as const, z: item.z, item })),
      ...textItems.map(item => ({ kind: 'text' as const, z: item.z, item })),
    ].sort((a, b) => a.z - b.z);

    for (const entry of items) {
      if (entry.kind === 'sticker') {
        const stickerImage = await loadImage(entry.item.url);
        const ratio = stickerImage.width && stickerImage.height ? stickerImage.height / stickerImage.width : 1;
        const drawW = entry.item.size * entry.item.scale;
        const drawH = drawW * ratio;
        ctx.save();
        ctx.translate(entry.item.x, entry.item.y);
        ctx.rotate((entry.item.rotation * Math.PI) / 180);
        ctx.scale(entry.item.isFlipped ? -1 : 1, 1);
        ctx.drawImage(stickerImage, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(entry.item.x, entry.item.y);
        ctx.rotate((entry.item.rotation * Math.PI) / 180);
        ctx.font = `800 ${Math.max(12, entry.item.fontSize * entry.item.scale)}px "${entry.item.fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = Math.max(4, entry.item.fontSize * entry.item.scale * 0.08);
        ctx.strokeText(entry.item.text, 0, 0);
        ctx.fillStyle = entry.item.color;
        ctx.fillText(entry.item.text, 0, 0);
        ctx.restore();
      }
    }
  }, [stickers, textItems]);

  const handleNext = useCallback(async (andBroadcast = true) => {
    if (andBroadcast) {
      broadcast({ type: 'trigger_complete_decorate', senderId: participantId });
    }

    if (!offscreenCanvasRef.current || !baseImgUrl) return;
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = await loadImage(baseImgUrl);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);
    if (drawCanvasRef.current) {
      ctx.drawImage(drawCanvasRef.current, 0, 0);
    }
    await drawItems(ctx);
    const finalDataUrl = canvas.toDataURL('image/png');

    const decorationsCanvas = document.createElement('canvas');
    decorationsCanvas.width = canvas.width;
    decorationsCanvas.height = canvas.height;
    const decorationsCtx = decorationsCanvas.getContext('2d');
    if (decorationsCtx && drawCanvasRef.current) {
      decorationsCtx.drawImage(drawCanvasRef.current, 0, 0);
      await drawItems(decorationsCtx);
    }

    onComplete(finalDataUrl, decorationsCanvas.toDataURL('image/png'));
  }, [baseImgUrl, broadcast, drawItems, onComplete, participantId]);

  useEffect(() => {
    if (!offscreenCanvasRef.current) return;
    const orderedMyPhotos = selectedIndices.map(index => myPhotos[index]?.dataUrl || '');
    const orderedPartnerPhotos = selectedIndices.map(index => partnerPhotos[index]?.dataUrl || '');

    composeDuoPhoto({
      myPhotos: orderedMyPhotos,
      partnerPhotos: orderedPartnerPhotos,
      state: roomState,
      canvas: offscreenCanvasRef.current,
    }).then(() => {
      const canvas = offscreenCanvasRef.current;
      if (!canvas) return;
      setBaseImgUrl(canvas.toDataURL('image/png'));
      setImgSize({ w: canvas.width, h: canvas.height });
    });
  }, [myPhotos, partnerPhotos, selectedIndices, roomState]);

  useEffect(() => {
    redrawCanvas(lines);
  }, [lines, redrawCanvas]);

  useEffect(() => {
    const handleSync = (event: CustomEvent) => {
      const data = event.detail as Partial<Snapshot>;
      if (data.lines) {
        setLines(data.lines);
        redrawCanvas(data.lines);
      }
      if (data.stickers) setStickers(data.stickers);
      if (data.textItems) setTextItems(data.textItems);
    };

    window.addEventListener('sync_decorate', handleSync as EventListener);
    return () => window.removeEventListener('sync_decorate', handleSync as EventListener);
  }, [redrawCanvas]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver((entries) => {
      setStageSize({ w: entries[0].contentRect.width, h: entries[0].contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleTrigger = () => {
      handleNext(false);
    };

    window.addEventListener('trigger_complete_decorate', handleTrigger as EventListener);
    return () => window.removeEventListener('trigger_complete_decorate', handleTrigger as EventListener);
  }, [handleNext]);

  useEffect(() => {
    if (!activeText) return;
    setTextDraft(activeText.text);
    setTextColor(activeText.color);
    setTextSize(activeText.fontSize);
    setTextFont(activeText.fontFamily);
  }, [activeText]);

  const renderSelectedActions = () => (
    <div className="decorate-action-row">
      <button onClick={duplicateSelected} disabled={!selectedItem} title={t('decorate.duplicate')}>
        <Copy size={16} />
      </button>
      <button onClick={flipSelected} disabled={selectedItem?.type !== 'sticker'} title={t('decorate.flip')}>
        <FlipHorizontal size={16} />
      </button>
      <button onClick={() => moveLayer('front')} disabled={!selectedItem} title={t('decorate.front')}>
        <BringToFront size={16} />
      </button>
      <button onClick={() => moveLayer('back')} disabled={!selectedItem} title={t('decorate.backLayer')}>
        <SendToBack size={16} />
      </button>
      <button onClick={deleteSelected} disabled={!selectedItem} title={t('decorate.delete')}>
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div
      className="decorate-page"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        background: 'var(--glass-bg)',
        width: '100%',
        marginBottom: '24px'
      }}>
        <button
          onClick={onBack}
          style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('room.back')}
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('decorate.title')}
        </span>
        <div className="guide-header-action" style={{ justifySelf: 'end' }}>
          <SectionGuide
            title={t('guide.decorate.title')}
            steps={[
              t('guide.decorate.step1'),
              t('guide.decorate.step2'),
              t('guide.decorate.step3'),
              t('guide.decorate.step4'),
              t('guide.decorate.step5'),
            ]}
          />
        </div>
      </div>

      <main ref={stageRef} className="decorate-stage">
        {baseImgUrl && imgSize.w > 0 ? (
          <div
            ref={containerRef}
            className="decorate-canvas-wrap"
            style={{
              width: stageSize.h > 0 ? Math.min(stageSize.w, stageSize.h * (imgSize.w / imgSize.h)) : '100%',
              aspectRatio: `${imgSize.w}/${imgSize.h}`,
            }}
            onPointerDown={() => setSelectedItem(null)}
          >
            <img src={baseImgUrl} alt="base" />
            <canvas
              ref={drawCanvasRef}
              width={imgSize.w}
              height={imgSize.h}
              onPointerDown={handlePointerDown}
              className={mode === 'draw' ? 'active' : ''}
            />

            <div className="decorate-item-layer">
              {[...stickers].sort((a, b) => a.z - b.z).map(item => {
                const isSelected = selectedItem?.type === 'sticker' && selectedItem.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={isSelected ? 'decorate-sticker selected' : 'decorate-sticker'}
                    style={{
                      left: `${(item.x / imgSize.w) * 100}%`,
                      top: `${(item.y / imgSize.h) * 100}%`,
                      width: `${(item.size / imgSize.w) * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale}) scaleX(${item.isFlipped ? -1 : 1})`,
                      pointerEvents: mode === 'draw' ? 'none' : 'auto',
                    }}
                    onPointerDown={(event) => startDrag(event, 'sticker', item.id, 'move', item)}
                  >
                    <img src={item.url} alt="sticker" />
                    {isSelected && (
                      <>
                        <button className="decorate-handle delete" onPointerDown={(event) => { event.stopPropagation(); deleteSelected(); }}>
                          <Trash2 size={13} />
                        </button>
                        <button className="decorate-handle scale" onPointerDown={(event) => startDrag(event, 'sticker', item.id, 'scale', item)}>
                          ↕
                        </button>
                        <button className="decorate-handle rotate" onPointerDown={(event) => startDrag(event, 'sticker', item.id, 'rotate', item)}>
                          ↻
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              {[...textItems].sort((a, b) => a.z - b.z).map(item => {
                const isSelected = selectedItem?.type === 'text' && selectedItem.id === item.id;
                const fontSize = Math.max(12, item.fontSize * item.scale * getDisplayScale());
                return (
                  <div
                    key={item.id}
                    className={isSelected ? 'decorate-text selected' : 'decorate-text'}
                    style={{
                      left: `${(item.x / imgSize.w) * 100}%`,
                      top: `${(item.y / imgSize.h) * 100}%`,
                      color: item.color,
                      fontFamily: `"${item.fontFamily}", sans-serif`,
                      fontSize,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                      pointerEvents: mode === 'draw' ? 'none' : 'auto',
                    }}
                    onPointerDown={(event) => startDrag(event, 'text', item.id, 'move', item)}
                  >
                    {item.text}
                    {isSelected && (
                      <>
                        <button className="decorate-handle delete" onPointerDown={(event) => { event.stopPropagation(); deleteSelected(); }}>
                          <Trash2 size={13} />
                        </button>
                        <button className="decorate-handle scale" onPointerDown={(event) => startDrag(event, 'text', item.id, 'scale', item)}>
                          ↕
                        </button>
                        <button className="decorate-handle rotate" onPointerDown={(event) => startDrag(event, 'text', item.id, 'rotate', item)}>
                          ↻
                        </button>
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
      </main>

      <footer className="decorate-toolbar">
        <div className="decorate-mode-row">
          <button className={mode === 'stickers' ? 'active' : ''} onClick={() => setMode('stickers')}>
            <Sticker size={16} />
            {t('decorate.stickers')}
          </button>
          <button className={mode === 'text' ? 'active' : ''} onClick={() => { setMode('text'); setSelectedItem(selectedItem?.type === 'text' ? selectedItem : null); }}>
            <Type size={16} />
            {t('decorate.text')}
          </button>
          <button className={mode === 'draw' ? 'active' : ''} onClick={() => { setMode('draw'); setSelectedItem(null); }}>
            <Brush size={16} />
            {t('decorate.draw')}
          </button>
        </div>

        <div className="decorate-history-row">
          <button onClick={handleUndo} disabled={historyCount === 0} title={t('decorate.undo')}>
            <Undo2 size={16} />
          </button>
          <button onClick={handleRedo} disabled={redoCount === 0} title={t('decorate.redo')}>
            <Redo2 size={16} />
          </button>
        </div>

        <div className="decorate-tools">
          {mode === 'stickers' && (
            <div className="decorate-tool-stack">
              <div className="decorate-sticker-list">
                {STICKERS.map(url => (
                  <button key={url} onClick={() => addSticker(url)}>
                    <img src={url} alt="sticker option" />
                  </button>
                ))}
              </div>
              {renderSelectedActions()}
            </div>
          )}

          {mode === 'text' && (
            <div className="decorate-tool-stack">
              <div className="decorate-text-controls">
                <input
                  type="text"
                  value={textDraft}
                  placeholder={t('decorate.textPlaceholder')}
                  onChange={(event) => {
                    setTextDraft(event.target.value);
                    if (selectedItem?.type === 'text') updateActiveText({ text: event.target.value });
                  }}
                  maxLength={42}
                />
                <select
                  value={textFont}
                  onChange={(event) => {
                    setTextFont(event.target.value);
                    updateActiveText({ fontFamily: event.target.value });
                  }}
                >
                  {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
                <input
                  type="range"
                  min="32"
                  max="120"
                  value={textSize}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setTextSize(value);
                    updateActiveText({ fontSize: value });
                  }}
                />
              </div>
              <div className="decorate-color-row">
                {COLORS.map(item => (
                  <button
                    key={item}
                    className={textColor === item ? 'active' : ''}
                    style={{ background: item }}
                    onClick={() => {
                      setTextColor(item);
                      updateActiveText({ color: item });
                    }}
                  />
                ))}
              </div>
              <div className="decorate-text-actions">
                <button onClick={addOrUpdateText}>{selectedItem?.type === 'text' ? t('decorate.updateText') : t('decorate.addText')}</button>
                <button onClick={startNewText}>{t('decorate.newText')}</button>
              </div>
              {renderSelectedActions()}
            </div>
          )}

          {mode === 'draw' && (
            <div className="decorate-tool-stack">
              <div className="decorate-color-row">
                {COLORS.map(item => (
                  <button key={item} className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} />
                ))}
              </div>
              <div className="decorate-draw-row">
                {WIDTHS.map(width => (
                  <button key={width} className={lineWidth === width ? 'active' : ''} onClick={() => setLineWidth(width)}>
                    <span style={{ width, height: width }} />
                  </button>
                ))}
                <button onClick={clearDraw} disabled={lines.length === 0}>
                  <Trash2 size={16} />
                  {t('decorate.clear')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="decorate-bottom-row">
          <button className="decorate-finish-btn" onClick={() => handleNext(true)}>
            {t('decorate.finish')}
          </button>
        </div>
      </footer>

      <canvas ref={offscreenCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

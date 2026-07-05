'use client';

import { useState, useRef, useEffect } from 'react';
import { CapturedPhoto, RoomState, LAYOUTS, LayoutKey } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';
import { useTranslation } from '@/lib/i18n';

interface ResultPageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  selectedIndices: number[];
  roomState: RoomState;
  roomCode: string;
  decoratedImgUrl?: string | null;
  decorationsUrl?: string | null;
  onRetake: () => void;
  onBack: () => void;
}

export default function ResultPage({
  myPhotos,
  partnerPhotos,
  selectedIndices,
  roomState,
  roomCode,
  decoratedImgUrl,
  decorationsUrl,
  onRetake,
  onBack,
}: ResultPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  const [imgUrl, setImgUrl] = useState('');
  const [composed, setComposed] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifDone, setGifDone] = useState(false);

  useEffect(() => {
    if (decoratedImgUrl) {
      setImgUrl(decoratedImgUrl);
      setComposed(true);
      return;
    }

    if (!canvasRef.current) return;
    setComposed(false);
    
    // Map photos using selected indices
    const orderedMyPhotos = selectedIndices.map(i => myPhotos[i]?.dataUrl || '');
    const orderedPartnerPhotos = selectedIndices.map(i => partnerPhotos[i]?.dataUrl || '');

    composeDuoPhoto({
      myPhotos: orderedMyPhotos,
      partnerPhotos: orderedPartnerPhotos,
      state: roomState,
      canvas: canvasRef.current,
    }).then(() => {
      const url = canvasRef.current!.toDataURL('image/png');
      setImgUrl(url);
      setComposed(true);
    });
  }, [myPhotos, partnerPhotos, selectedIndices, roomState, decoratedImgUrl]);

  const handleDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `photoboothduo-${roomCode}-${Date.now()}.png`;
    a.click();
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
  };

  const handleDownloadGif = async () => {
    if (isGeneratingGif || !selectedIndices.length) return;
    setIsGeneratingGif(true);

    try {
      // @ts-ignore
      const GIF = require('gif.js');
      const gif = new (GIF.default || GIF)({
        workers: 2,
        quality: 10,
        workerScript: '/gif.worker.js'
      });

      // Calculate offsets if decorations exist
      let decImg: HTMLImageElement | null = null;
      if (decorationsUrl) {
        decImg = new Image();
        decImg.src = decorationsUrl;
        await new Promise(r => { decImg.onload = r; decImg.onerror = r; });
      }

      const layoutDef = LAYOUTS[roomState.layout as LayoutKey] || LAYOUTS.strip3;
      const cellW = 480;
      const cellH = 360;
      const margin = 16;
      const topPad = margin;

      for (let f = 0; f < selectedIndices.length; f++) {
        const tempCanvas = document.createElement('canvas');
        const i = selectedIndices[f];
        const myPhoto = myPhotos[i]?.dataUrl;
        const partnerPhoto = partnerPhotos[i]?.dataUrl;
        
        await composeDuoPhoto({
          myPhotos: [myPhoto || ''],
          partnerPhotos: [partnerPhoto || ''],
          state: { ...roomState, layout: 'single' },
          canvas: tempCanvas
        });

        if (decImg) {
          const col = f % layoutDef.cols;
          const row = Math.floor(f / layoutDef.cols);
          
          const tctx = tempCanvas.getContext('2d')!;

          // 1. Crop and draw the stickers that belong EXACTLY to this photo row
          const sx = col * (cellW * 2 + margin * 3);
          const sy = row * (cellH + margin);
          const sw = cellW * 2 + margin * 3;
          const sh = topPad + cellH + margin; // Covers from Y=0 to the bottom of the photo slot
          
          tctx.drawImage(decImg, sx, sy, sw, sh, 0, 0, sw, sh);

          // 2. Always draw the global footer stickers at the bottom!
          // Footer starts after all the rows in the original strip
          const footerSy = topPad + layoutDef.rows * (cellH + margin);
          const footerSh = 140; // FOOTER_H
          const footerDy = topPad + cellH + margin; // Where footer starts in 'single' layout
          
          // Draw the footer area from decorations
          tctx.drawImage(decImg, 0, footerSy, decImg.width, footerSh, 0, footerDy, decImg.width, footerSh);
        }
        
        gif.addFrame(tempCanvas, { copy: true, delay: 600 });
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photoboothduo-${roomCode}-${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
        
        setGifDone(true);
        setIsGeneratingGif(false);
        setTimeout(() => setGifDone(false), 2000);
      });

      gif.render();
    } catch (e) {
      console.error(e);
      setIsGeneratingGif(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Orb background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        background: 'var(--glass-bg)',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('room.back')}
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {t('result.title')}
        </span>
        <div style={{ width: 80 }} /> {/* spacer */}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexWrap: 'wrap',
        gap: 32, padding: '32px 28px',
        maxWidth: 1100, margin: '0 auto', width: '100%',
        alignItems: 'flex-start', justifyContent: 'center'
      }}>
        {/* Left: photos grid */}
        <div style={{ width: '100%', maxWidth: 280, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            {t('result.myPhotos')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {selectedIndices.map((photoIdx, i) => {
              const photo = myPhotos[photoIdx];
              return (
              <div key={i} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {photo?.dataUrl ? (
                  <img src={photo.dataUrl} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                )}
              </div>
            )})}
          </div>

          {/* Partner photos */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16, marginTop: 24 }}>
            {t('result.partnerPhotos')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {selectedIndices.map((photoIdx, i) => {
              const photo = partnerPhotos[photoIdx];
              return (
              <div key={i} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {photo?.dataUrl ? (
                  <img src={photo.dataUrl} alt={`Partner Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Right: strip result */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('result.myStrip')}
          </p>

          <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', minHeight: 400, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {composed && imgUrl ? (
              <img
                src={imgUrl}
                alt="Photobooth Strip"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                <div style={{ marginBottom: 8, fontSize: 24 }}>⏳</div>
                {t('result.composing')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                onClick={handleDownload}
                disabled={!composed}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 100,
                  fontSize: 14, fontWeight: 700,
                  border: 'none', background: 'var(--text)', color: 'var(--bg)',
                  cursor: composed ? 'pointer' : 'not-allowed',
                  opacity: composed ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: composed ? 'var(--accent-glow)' : 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloadDone ? t('result.saved') : t('result.downloadPng')}
              </button>

              <button
                onClick={handleDownloadGif}
                disabled={isGeneratingGif || !composed}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 100,
                  fontSize: 14, fontWeight: 700,
                  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)',
                  cursor: (isGeneratingGif || !composed) ? 'not-allowed' : 'pointer',
                  opacity: (isGeneratingGif || !composed) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {gifDone ? t('result.saved') : isGeneratingGif ? t('result.processing') : t('result.downloadGif')}
              </button>
            </div>

            <button
              onClick={onRetake}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 100,
                fontSize: 15, fontWeight: 600,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              {t('result.retake')}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for composition */}
      <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { CapturedPhoto, RoomState, LAYOUTS, LayoutKey } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';

interface ResultPageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  selectedIndices: number[];
  roomState: RoomState;
  roomCode: string;
  onRetake: () => void;
  onBack: () => void;
}

export default function ResultPage({
  myPhotos,
  partnerPhotos,
  selectedIndices,
  roomState,
  roomCode,
  onRetake,
  onBack,
}: ResultPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [composed, setComposed] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  useEffect(() => {
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
  }, [myPhotos, partnerPhotos, selectedIndices, roomState]);

  const handleDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `photoboothduo-${roomCode}-${Date.now()}.png`;
    a.click();
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
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
          Kembali
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          ALL DONE ♡
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
            Foto Kamu
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
            Foto Partner
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
            Strip Kamu
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
                Menyusun strip...
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <button
              onClick={handleDownload}
              disabled={!composed}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 100,
                fontSize: 15, fontWeight: 700,
                border: 'none', background: 'var(--text)', color: 'var(--bg)',
                cursor: composed ? 'pointer' : 'not-allowed',
                opacity: composed ? 1 : 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: composed ? 'var(--accent-glow)' : 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloadDone ? '✓ Tersimpan!' : 'Download PNG'}
            </button>

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
              Foto Ulang
            </button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for composition */}
      <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}

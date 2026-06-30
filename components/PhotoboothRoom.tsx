'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LAYOUTS, COLOR_FILTERS, FRAME_BG_PRESETS, BORDER_PRESETS, LayoutKey } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';

interface Props {
  roomId: string;
  roomCode: string;
}

export default function PhotoboothRoom({ roomId, roomCode }: Props) {
  const {
    roomState, phase, myPhotos, partnerPhotos,
    partnerInfo, countdown, photoIndex, role,
    startSession, onPhotoCaptured, updateState, setColor, handleReset,
  } = useRoom(roomId, roomCode);

  const { localStream, remoteStream, isConnected } = useWebRTC(roomCode, role === 'host');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'layout' | 'color' | 'frame' | 'border' | 'text'>('layout');
  const [showResult, setShowResult] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [resultComposed, setResultComposed] = useState(false);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-capture when phase is 'capturing'
  useEffect(() => {
    if (phase !== 'capturing') return;
    // Flash
    if (flashRef.current) {
      flashRef.current.classList.add('active');
      setTimeout(() => flashRef.current?.classList.remove('active'), 400);
    }
    // Capture from local video
    const video = localVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onPhotoCaptured(dataUrl, photoIndex);
  }, [phase, photoIndex, onPhotoCaptured]);

  // When all photos are done and we're customizing, compose result
  useEffect(() => {
    if (phase !== 'customizing') { setResultComposed(false); return; }
    composeResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myPhotos, partnerPhotos, roomState]);

  async function composeResult() {
    if (!resultCanvasRef.current) return;
    const layout = LAYOUTS[roomState.layout as LayoutKey];
    const count = layout.count;
    const myUrls = myPhotos.slice(0, count).map(p => p?.dataUrl || '');
    const partnerUrls = partnerPhotos.slice(0, count).map(p => p?.dataUrl || '');

    await composeDuoPhoto({
      myPhotos: myUrls,
      partnerPhotos: partnerUrls,
      state: roomState,
      canvas: resultCanvasRef.current,
    });
    setResultComposed(true);
  }

  // Re-compose when roomState changes (user changed filter/frame/etc)
  useEffect(() => {
    if (phase === 'customizing') composeResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState]);

  const handleDownload = useCallback(() => {
    if (!resultCanvasRef.current) return;
    const a = document.createElement('a');
    a.href = resultCanvasRef.current.toDataURL('image/jpeg', 0.92);
    a.download = `photoboothduo-${roomCode}-${Date.now()}.jpg`;
    a.click();
  }, [roomCode]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, [roomCode]);

  const partnerConnected = !!partnerInfo || isConnected;
  const totalCount = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;
  // partnerConnected && idle/done phase = can start

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="room-layout">
      {/* ── Video Area ─────────────────────────────────────── */}
      <div className="video-area">
        {/* Flash overlay */}
        <div className="flash-overlay" ref={flashRef} />

        {/* Dual video grid */}
        <div className="video-grid">
          {/* My camera */}
          <div className="video-cell local">
            <video
              id="local-video"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                filter: `brightness(${roomState.adj.b}%) contrast(${roomState.adj.c}%) saturate(${roomState.adj.s}%) sepia(${roomState.adj.w}%)${roomState.colorCSS !== 'none' ? ` ${roomState.colorCSS}` : ''}`,
              }}
            />
            <div className="video-cell-label">📷 Kamu ({role === 'host' ? 'Host' : 'Tamu'})</div>
          </div>

          {/* Partner camera */}
          <div className="video-cell">
            {remoteStream ? (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline muted={false} style={{ filter: `brightness(${roomState.adj.b}%) contrast(${roomState.adj.c}%) saturate(${roomState.adj.s}%) sepia(${roomState.adj.w}%)${roomState.colorCSS !== 'none' ? ` ${roomState.colorCSS}` : ''}` }} />
                <div className="video-cell-label">👤 Partner</div>
              </>
            ) : (
              <div className="video-cell-waiting">
                <div className="waiting-avatar">👤</div>
                <p className="waiting-text">
                  {partnerInfo
                    ? 'Partner terhubung, menunggu video...'
                    : 'Menunggu partner masuk...'}
                </p>
                {!partnerInfo && (
                  <p className="waiting-text" style={{ fontSize: 11, marginTop: 4 }}>
                    Share kode <strong style={{ color: 'var(--accent)' }}>{roomCode}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Countdown overlay */}
        {(phase === 'countdown' || phase === 'capturing') && countdown > 0 && (
          <div className="countdown-overlay">
            <div className="countdown-number" key={countdown}>{countdown}</div>
            <div className="countdown-label">
              FOTO {photoIndex + 1} dari {totalCount}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="video-bottom">
          {/* Photo strip thumbs */}
          <div className="photo-strip-preview">
            {Array.from({ length: totalCount }).map((_, i) => {
              const photo = myPhotos[i];
              return photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={photo.dataUrl} alt={`Foto ${i + 1}`} className="strip-thumb taken" />
              ) : (
                <div key={i} className="strip-thumb placeholder" />
              );
            })}
          </div>

          {/* Main capture / reset button */}
          {phase === 'customizing' ? (
            <>
              <button
                id="btn-show-result"
                className="capture-btn"
                onClick={() => setShowResult(true)}
              >
                🎉 Lihat Hasil
              </button>
              <button
                id="btn-reset"
                className="icon-btn"
                onClick={() => handleReset(true)}
                title="Ulangi sesi"
              >
                🔄
              </button>
            </>
          ) : (
            <button
              id="btn-start"
              className="capture-btn"
              onClick={startSession}
              disabled={['countdown', 'capturing', 'customizing'].includes(phase) || !partnerConnected}
            >
              {(['countdown', 'capturing'] as string[]).includes(phase)
                ? `📸 ${photoIndex + 1}/${totalCount}`
                : !partnerConnected
                  ? '⏳ Menunggu partner...'
                  : '📸 MULAI FOTO'}
            </button>
          )}
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="sidebar-logo" />
          <div>
            <div className="sidebar-title">PhotoBooth Duo</div>
            <div className="sidebar-subtitle">Room aktif</div>
          </div>
          <div className="room-code-badge">
            <span className="room-code-label">Kode</span>
            <span className="room-code-value">{roomCode}</span>
          </div>
        </div>

        {/* Partner status */}
        <div className="partner-status">
          <div className={`status-dot ${partnerConnected ? 'online' : 'waiting'}`} />
          <span className="partner-status-text">
            {partnerConnected
              ? <><strong>Partner terhubung</strong> ✅</>
              : <><strong>Menunggu partner</strong>...</>
            }
          </span>
        </div>

        {/* Share */}
        <div className="share-row">
          <input
            type="text"
            readOnly
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomCode}`}
            id="share-url"
          />
          <button id="btn-copy-link" className="share-copy-btn" onClick={copyLink}>
            {copyDone ? '✅ Disalin!' : '🔗 Salin'}
          </button>
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs" role="tablist">
          {[
            { id: 'layout', label: '⊞ Layout' },
            { id: 'color', label: '🎨 Filter' },
            { id: 'frame', label: '🖼 Frame' },
            { id: 'border', label: '✨ Border' },
            { id: 'text', label: '✏️ Teks' },
          ].map(t => (
            <button
              key={t.id}
              id={`sidebar-tab-${t.id}`}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`sidebar-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sidebar body */}
        <div className="sidebar-body">
          {/* Layout Panel */}
          <div className={`panel ${activeTab === 'layout' ? 'active' : ''}`} id="panel-layout">
            <span className="section-label">Layout Hasil</span>
            <div className="opt-grid cols-2">
              {(Object.keys(LAYOUTS) as LayoutKey[]).map(key => (
                <button
                  key={key}
                  id={`layout-${key}`}
                  className={`opt-btn ${roomState.layout === key ? 'active' : ''}`}
                  onClick={() => updateState({ layout: key })}
                >
                  {key === 'strip3' && '▬▬▬ Strip 3'}
                  {key === 'strip4' && '▬▬▬▬ Strip 4'}
                  {key === 'grid2x2' && '⊞ Grid 2×2'}
                  {key === 'single' && '▭ Single'}
                </button>
              ))}
            </div>

            <span className="section-label" style={{ marginTop: 20 }}>Timer per Foto</span>
            <div className="opt-grid cols-3">
              {[3, 5, 10].map(t => (
                <button
                  key={t}
                  id={`timer-${t}`}
                  className={`opt-btn ${roomState.timer === t ? 'active' : ''}`}
                  onClick={() => updateState({ timer: t })}
                >
                  {t}s
                </button>
              ))}
            </div>

            <span className="section-label" style={{ marginTop: 20 }}>Adjust Kamera</span>
            {[
              { key: 'b', label: 'Brightness', min: 50, max: 150, def: 100 },
              { key: 'c', label: 'Contrast', min: 50, max: 150, def: 100 },
              { key: 's', label: 'Saturation', min: 0, max: 200, def: 100 },
              { key: 'w', label: 'Warmth', min: 0, max: 100, def: 0 },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ].map(({ key, label, min, max, def: _def }) => (
              <div className="slider-group" key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{roomState.adj[key as keyof typeof roomState.adj]}</span>
                </div>
                <input
                  id={`adj-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  value={roomState.adj[key as keyof typeof roomState.adj]}
                  onChange={e => updateState({ adj: { ...roomState.adj, [key]: Number(e.target.value) } })}
                />
              </div>
            ))}
            <button
              id="btn-reset-adj"
              className="opt-btn"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => updateState({ adj: { b: 100, c: 100, s: 100, w: 0 } })}
            >
              🔄 Reset Adjust
            </button>
          </div>

          {/* Color Filter Panel */}
          <div className={`panel ${activeTab === 'color' ? 'active' : ''}`} id="panel-color">
            <span className="section-label">Efek Warna</span>
            <div className="color-grid">
              {COLOR_FILTERS.map(f => (
                <button
                  key={f.id}
                  id={`filter-${f.id}`}
                  className={`color-btn ${roomState.color === f.id ? 'active' : ''}`}
                  onClick={() => setColor(f.id)}
                >
                  <div
                    className="color-swatch"
                    style={{ filter: f.css !== 'none' ? f.css : undefined, background: '#88808c' }}
                  />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Background Panel */}
          <div className={`panel ${activeTab === 'frame' ? 'active' : ''}`} id="panel-frame">
            <span className="section-label">Latar Belakang Frame</span>
            <div className="swatch-row">
              {FRAME_BG_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  id={`frame-bg-${i}`}
                  className={`swatch ${roomState.frameBg.val === preset.val && roomState.frameBg.type === preset.type ? 'active' : ''}`}
                  style={preset.style}
                  onClick={() => updateState({ frameBg: { type: preset.type, val: preset.val } })}
                  title={preset.val}
                />
              ))}
              {/* Pattern swatches */}
              {[
                { type: 'pattern' as const, val: 'polka', style: { background: 'radial-gradient(#ff007f 15%, transparent 16%) 0 0, #fff', backgroundSize: '16px 16px' } },
                { type: 'pattern' as const, val: 'grid', style: { background: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '8px 8px', backgroundColor: '#fff' } },
                { type: 'pattern' as const, val: 'check', style: { background: 'repeating-conic-gradient(#fff 0% 25%, #f1f1f1 0% 50%)', backgroundSize: '16px 16px' } },
              ].map((preset, i) => (
                <button
                  key={`p-${i}`}
                  id={`frame-pattern-${preset.val}`}
                  className={`swatch ${roomState.frameBg.val === preset.val ? 'active' : ''}`}
                  style={preset.style as React.CSSProperties}
                  onClick={() => updateState({ frameBg: { type: preset.type, val: preset.val } })}
                  title={preset.val}
                />
              ))}
            </div>
          </div>

          {/* Border Style Panel */}
          <div className={`panel ${activeTab === 'border' ? 'active' : ''}`} id="panel-border">
            <span className="section-label">Gaya Bingkai</span>
            <div className="opt-grid cols-2">
              {BORDER_PRESETS.map(b => (
                <button
                  key={b.id}
                  id={`border-${b.id}`}
                  className={`opt-btn ${roomState.photoBorder === b.id ? 'active' : ''}`}
                  onClick={() => updateState({ photoBorder: b.id })}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Panel */}
          <div className={`panel ${activeTab === 'text' ? 'active' : ''}`} id="panel-text">
            <span className="section-label">Teks di Frame</span>
            <input
              id="custom-text-input"
              type="text"
              className="text-input"
              placeholder="Nama / Event / Tanggal..."
              maxLength={35}
              value={roomState.customText}
              onChange={e => updateState({ customText: e.target.value })}
            />
            <div className="toggle-row">
              <span className="toggle-label">Tampilkan tanggal</span>
              <label className="toggle" htmlFor="toggle-date">
                <input
                  id="toggle-date"
                  type="checkbox"
                  checked={roomState.showDate}
                  onChange={e => updateState({ showDate: e.target.checked })}
                />
                <span className="toggle-track" />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {phase === 'customizing' ? (
            <>
              <button id="btn-footer-result" className="capture-btn" onClick={() => setShowResult(true)}>
                🎉 Lihat & Unduh Hasil
              </button>
              <button id="btn-footer-reset" className="btn-secondary" style={{ width: '100%' }} onClick={() => handleReset(true)}>
                🔄 Ambil Foto Lagi
              </button>
            </>
          ) : (
            <button
              id="btn-footer-start"
              className="capture-btn"
              onClick={startSession}
              disabled={(['countdown', 'capturing', 'customizing'] as string[]).includes(phase) || !partnerConnected}
            >
              {!partnerConnected ? '⏳ Tunggu partner...' : '📸 MULAI SESI FOTO'}
            </button>
          )}
        </div>
      </aside>

      {/* ── Result Modal ─────────────────────────────────────── */}
      {showResult && (
        <div className="modal-backdrop" id="result-modal" onClick={e => { if (e.target === e.currentTarget) setShowResult(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">🎉 Hasil Foto Berdua!</h2>
              <button
                id="btn-close-result"
                className="modal-close"
                onClick={() => setShowResult(false)}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <div className="result-canvas-wrap">
              <canvas ref={resultCanvasRef} style={{ maxWidth: '100%' }} />
            </div>

            {!resultComposed && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
                <span className="spinner" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                Sedang menyusun foto...
              </p>
            )}

            <div className="modal-actions">
              <button
                id="btn-modal-reset"
                className="btn-outline"
                onClick={() => { setShowResult(false); handleReset(true); }}
              >
                🔄 Ambil Lagi
              </button>
              <button
                id="btn-modal-download"
                className="btn-filled"
                onClick={handleDownload}
                disabled={!resultComposed}
              >
                💾 Unduh Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for composition */}
      {!showResult && (
        <canvas ref={resultCanvasRef} style={{ display: 'none' }} />
      )}
    </div>
  );
}

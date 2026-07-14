'use client';

import { RefObject, useState, useEffect } from 'react';
import { RoomState, SessionPhase, ParticipantInfo, CapturedPhoto, CAMERA_FILTER_PRESETS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';
import DraggableWidget from '@/components/DraggableWidget';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  roomState: RoomState;
  role: 'host' | 'guest';
  partnerInfo: ParticipantInfo | null;
  isConnected: boolean;
  roomCode: string;
  phase: SessionPhase | 'error_full';
  countdown: number;
  photoIndex: number;
  totalCount: number;
  flashRef: RefObject<HTMLDivElement>;
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  startSession: (forceReset?: boolean) => void;
  partnerConnected: boolean;
  facingMode: 'user' | 'environment';
  isMirrored: boolean;
  partnerMirrored: boolean;
  isMicOn: boolean;
  cameraError?: boolean;
  retryCamera?: () => void;
  toggleCamera: () => void;
  toggleMirror: () => void;
  toggleMic: () => void;
  onBack?: () => void;
  onSkipToLayout?: () => void;
  updateState?: (state: Partial<RoomState>) => void;
}

export default function VideoGrid({
  localStream,
  remoteStream,
  roomState,
  role,
  partnerInfo,
  isConnected,
  roomCode,
  phase,
  countdown,
  photoIndex,
  totalCount,
  flashRef,
  localVideoRef,
  remoteVideoRef,
  myPhotos,
  partnerPhotos,
  startSession,
  partnerConnected,
  facingMode,
  isMirrored,
  partnerMirrored,
  isMicOn,
  cameraError,
  retryCamera,
  toggleCamera,
  toggleMirror,
  toggleMic,
  onBack,
  onSkipToLayout,
  updateState,
}: VideoGridProps) {
  const isCapturing = phase === 'countdown' || phase === 'capturing';
  const [showGrid, setShowGrid] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(e => console.error('Local video play error:', e));
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch(e => console.error('Remote video play error:', e));
    }
  }, [remoteStream, remoteVideoRef]);

  return (
    <div className="video-area">
      <div className="flash-overlay" ref={flashRef} />

      {phase === 'error_full' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
          <h2 style={{ color: '#ff4d4d', marginBottom: 12 }}>{t('video.full')}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t('video.fullDesc')}</p>
        </div>
      ) : (
        <>
          {/* Countdown overlay */}
          {isCapturing && countdown > 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50, display: 'flex', flexDirection: 'column',
              alignItems: 'center', pointerEvents: 'none',
            }}>
              <div key={countdown} style={{
                fontSize: 'clamp(140px, 35vw, 240px)', fontWeight: 900,
                color: '#fff', lineHeight: 1,
                textShadow: '0 0 60px rgba(255,255,255,0.4)',
                animation: 'countdownPop 0.3s ease-out',
              }}>
                {countdown}
              </div>
            </div>
          )}

          <div className="video-grid" style={{ padding: 0, gap: 4, background: '#000', borderRadius: 0, border: 'none', height: '100%' }}>

            {/* Section guide */}
            {!isCapturing && (
              <SectionGuide
                variant="floating"
                title={t('guide.camera.title')}
                steps={[
                  t('guide.camera.step1'),
                  t('guide.camera.step2'),
                  t('guide.camera.step3'),
                  t('guide.camera.step4'),
                  t('guide.camera.step5'),
                ]}
              />
            )}

            {/* Timer selector */}
            {!isCapturing && (
              <div className="timer-controls" style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', gap: 8, zIndex: 80 }}>
                {[3, 5, 10].map(t_val => (
                  <button
                    key={t_val}
                    onClick={() => updateState && updateState({ timer: t_val })}
                    style={{
                      padding: '8px 16px',
                      background: roomState.timer === t_val ? 'var(--text)' : 'rgba(255,255,255,0.2)',
                      color: roomState.timer === t_val ? 'var(--bg)' : '#fff',
                      border: '1px solid var(--border)', borderRadius: 100,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      backdropFilter: 'blur(10px)', display: 'flex',
                      alignItems: 'center', gap: 6, transition: 'all 0.2s',
                    }}
                  >
                    ⏱ {t_val}s
                  </button>
                ))}
              </div>
            )}

            {/* Left sidebar: Grid & Filter — draggable */}
            {!isCapturing && (
              <DraggableWidget storageKey="vg-sidebar" defaultX={8} defaultY={120}>
                {/* Tools panel */}
                <div
                  className="camera-tools-panel"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    background: 'rgba(20,20,30,0.65)', padding: '10px 8px',
                    borderRadius: 20, backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: showGrid ? 'var(--text)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }}
                    title={t('video.grid')}
                  >
                    <div style={{ fontSize: 20 }}>⊞</div>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{t('video.grid')}</span>
                  </button>

                  <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '2px 0' }} />

                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: roomState.videoFilter !== 'none' ? 'var(--text)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }}
                    title={t('video.filter')}
                  >
                    <div style={{ fontSize: 20 }}>🎨</div>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{t('video.filter')}</span>
                  </button>

                  <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '2px 0' }} />

                  <button
                    onClick={() => {
                      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                      else if (document.exitFullscreen) document.exitFullscreen();
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: isFullscreen ? 'var(--text)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }}
                    title={isFullscreen ? t('room.exitFullscreen') : t('room.enterFullscreen')}
                  >
                    <div style={{ fontSize: 20, display: 'flex' }}>
                      {isFullscreen ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{isFullscreen ? t('room.exitFullscreen') : t('room.enterFullscreen')}</span>
                  </button>
                </div>

                {/* Filter menu — inside widget so it follows when dragged */}
                {showFilterMenu && (
                  <div
                    className="filter-menu-panel"
                    style={{
                      position: 'absolute', top: 0, left: 'calc(100% + 8px)',
                      width: 230,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-lg)',
                      zIndex: 60, maxHeight: 'min(320px, calc(100vh - 32px))',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div className="filter-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{t('video.filter')}</span>
                      <button onClick={() => setShowFilterMenu(false)} style={{ color: 'var(--text-muted)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="filter-options-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 4 }}>
                      {CAMERA_FILTER_PRESETS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => updateState && updateState({ videoFilter: f.style })}
                          style={{
                            padding: '8px 12px', borderRadius: 8,
                            background: roomState.videoFilter === f.style ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: roomState.videoFilter === f.style ? 'var(--text)' : 'var(--text-muted)',
                            border: roomState.videoFilter === f.style ? '1px solid var(--border)' : '1px solid transparent',
                            display: 'grid', gridTemplateColumns: '34px 1fr',
                            alignItems: 'center', gap: 10, textAlign: 'left',
                            fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ 
                            width: 34, height: 24, borderRadius: 6, display: 'block', 
                            backgroundImage: 'url("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80")',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            filter: f.style, border: '1px solid var(--border)' 
                          }} />
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </DraggableWidget>
            )}

            {/* Local video */}
              <div className="video-cell local" style={{ position: 'relative', borderRadius: 0 }}>
              <video
                id="local-video"
                ref={localVideoRef}
                autoPlay playsInline muted
                style={{ transform: isMirrored ? 'scaleX(-1)' : 'none', width: '100%', height: '100%', objectFit: 'cover', filter: roomState.videoFilter }}
              />

              {showGrid && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                  <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}

              {/* Camera controls — draggable */}
              <DraggableWidget storageKey="vg-cam-controls" defaultX={9999} defaultY={9999}>
                <div className="camera-controls" style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleMic} style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} title={isMicOn ? t('video.micOff') : t('video.micOn')}>
                    {isMicOn ? '🎤' : '🔇'}
                  </button>
                  <button onClick={toggleMirror} style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} title={t('video.mirror')}>
                    🪞
                  </button>
                  <button onClick={toggleCamera} style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} title={t('video.switchCamera')}>
                    🔄
                  </button>
                </div>
              </DraggableWidget>

              {/* Camera error overlay */}
              {cameraError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 20, padding: 20, textAlign: 'center' }}>
                  <span style={{ fontSize: 32, marginBottom: 12 }}>📷</span>
                  <p style={{ color: '#fff', marginBottom: 16, fontSize: 14 }}>{t('video.cameraError')}</p>
                  <button onClick={retryCamera} style={{ padding: '8px 16px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('video.startCamera')}
                  </button>
                </div>
              )}
            </div>

            {/* Remote video */}
            <div className="video-cell" style={{ position: 'relative', borderRadius: 0 }}>
              {remoteStream ? (
                <>
                  <video
                    id="remote-video"
                    ref={remoteVideoRef}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: partnerMirrored ? 'scaleX(-1)' : 'none', filter: roomState.videoFilter }}
                  />

                  {showGrid && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                      <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  )}

                  {/* Disconnect overlay — stream alive but partner left presence */}
                  {!partnerInfo && (
                    <div style={{
                      position: 'absolute', inset: 0, zIndex: 20,
                      background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(12px)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center',
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'rgba(250,82,82,0.15)', border: '2px solid rgba(250,82,82,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, animation: 'pulse 1.8s ease-in-out infinite',
                      }}>
                        📡
                      </div>
                      <p style={{ color: '#fa5252', fontWeight: 700, fontSize: 14, margin: 0 }}>
                        {t('video.partnerDisconnected')}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                        {t('video.partnerReconnecting')}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="video-cell-waiting">
                  <div className="waiting-avatar">{!partnerInfo && partnerConnected ? '📡' : '👤'}</div>
                  <p className="waiting-text">
                    {!partnerInfo && partnerConnected
                      ? t('video.partnerReconnecting')
                      : isConnected
                        ? t('video.waitingVideo')
                        : partnerInfo
                          ? t('video.partnerWaitingVideo')
                          : t('video.waitingPartner')}
                  </p>
                  {!partnerInfo && !partnerConnected && (
                    <p className="waiting-text" style={{ fontSize: 11, marginTop: 4 }}>
                      {t('video.shareCode')} <strong style={{ color: 'var(--accent)' }}>{roomCode}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Captured Photos Preview Strip */}
          {(myPhotos.length > 0 || partnerPhotos.length > 0) && (
            <div className="capture-preview-strip" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap', padding: '0 16px' }}>
              {Array.from({ length: totalCount }).map((_, i) => {
                const p = myPhotos[i];
                const p2 = partnerPhotos[i];
                const hasPhoto = p?.dataUrl || p2?.dataUrl;
                return (
                  <div key={i} style={{ width: 64, height: 48, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', border: hasPhoto ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex' }}>
                    {hasPhoto ? (
                      <>
                        {p?.dataUrl ? <img src={p.dataUrl} alt={`${t('arrange.myTake')} ${i + 1}`} style={{ flex: 1, width: '50%', height: '100%', objectFit: 'cover' }} /> : <div style={{ flex: 1, width: '50%' }} />}
                        {p2?.dataUrl ? <img src={p2.dataUrl} alt={`${t('arrange.partnerTake')} ${i + 1}`} style={{ flex: 1, width: '50%', height: '100%', objectFit: 'cover' }} /> : <div style={{ flex: 1, width: '50%' }} />}
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{i + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="video-bottom" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            {!isCapturing && onBack && (
              <button
                className="video-secondary-action"
                onClick={onBack}
                style={{ padding: '16px 24px', fontSize: 16, borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              >
                ← {t('room.back')}
              </button>
            )}
            {/* If midway, show Ulangi dari Awal (Retake) as secondary option */}
            {!isCapturing && myPhotos.length > 0 && photoIndex < totalCount && (
              <button
                className="video-secondary-action"
                onClick={() => startSession(true)}
                style={{ padding: '16px 24px', fontSize: 16, borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              >
                🔄 {t('video.retakeCapture')}
              </button>
            )}
            
            {!isCapturing && myPhotos.length > 0 && onSkipToLayout && (
              <button
                className="video-secondary-action"
                onClick={onSkipToLayout}
                style={{ padding: '16px 24px', fontSize: 16, borderRadius: 100, border: '1px solid var(--accent)', background: 'rgba(255,255,255,0.1)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              >
                {t('video.skipToLayout')} ⏭
              </button>
            )}
            <button
              id="btn-start"
              className="video-primary-action"
              onClick={() => {
                if (myPhotos.length > 0 && photoIndex >= totalCount) {
                  startSession(true); // Force reset if all photos are already taken
                } else {
                  startSession(false); // Otherwise resume or start
                }
              }}
              disabled={isCapturing || (role === 'host' && !partnerConnected)}
              style={{ padding: '16px 40px', fontSize: 18, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 800, cursor: (isCapturing || (role === 'host' && !partnerConnected)) ? 'not-allowed' : 'pointer', opacity: (isCapturing || (role === 'host' && !partnerConnected)) ? 0.7 : 1, transition: 'all 0.2s', boxShadow: (isCapturing || (role === 'host' && !partnerConnected)) ? 'none' : 'var(--accent-glow)' }}
            >
              {isCapturing
                ? `📸 ${t('video.capturing')} ${photoIndex + 1}/${totalCount}...`
                : (role === 'host' && !partnerConnected) 
                  ? `⌛ ${t('room.waiting')}` 
                  : myPhotos.length > 0 
                    ? (photoIndex < totalCount ? `▶️ ${t('video.resumeCapture')}` : `🔄 ${t('video.retakeCapture')}`) 
                    : `📸 ${t('video.startCapture')}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

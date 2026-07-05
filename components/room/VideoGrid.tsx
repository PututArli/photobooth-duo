import { RefObject, useState } from 'react';
import { RoomState, SessionPhase, ParticipantInfo, CapturedPhoto } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface VideoGridProps {
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
  startSession: () => void;

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
  updateState?: (state: Partial<RoomState>) => void;
}

const VIDEO_FILTERS = [
  { id: 'none', label: 'Normal', style: 'none' },
  { id: 'grayscale', label: 'B&W', style: 'grayscale(100%)' },
  { id: 'sepia', label: 'Vintage', style: 'sepia(80%)' },
  { id: 'contrast', label: 'Contrast', style: 'contrast(150%)' },
  { id: 'cool', label: 'Cool', style: 'hue-rotate(180deg) saturate(1.5)' },
  { id: 'warm', label: 'Warm', style: 'sepia(50%) hue-rotate(-30deg) saturate(1.5)' }
];

// Removed CountdownBubble to replace with a centralized overlay

export default function VideoGrid({
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
  updateState,
}: VideoGridProps) {
  const isCapturing = phase === 'countdown' || phase === 'capturing';
  const [showGrid, setShowGrid] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { t } = useTranslation();

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
          {/* Global Countdown Overlay */}
          {isCapturing && countdown > 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <div key={countdown} style={{
                fontSize: 'clamp(140px, 35vw, 240px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                textShadow: '0 10px 40px rgba(0,0,0,0.6)',
                animation: 'countdownPop 0.3s ease-out'
              }}>
                {countdown}
              </div>
            </div>
          )}

          <div className="video-grid" style={{ padding: 0, gap: 4, background: '#000', borderRadius: 0, border: 'none', height: '100%' }}>
            
            {/* Timer controls at top left */}
            {!isCapturing && (
              <div className="timer-controls" style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
                {[3, 5, 10].map(t_val => (
                  <button
                    key={t_val}
                    onClick={() => updateState && updateState({ timer: t_val })}
                    style={{
                      padding: '8px 16px',
                      background: roomState.timer === t_val ? 'var(--text)' : 'rgba(255,255,255,0.2)',
                      color: roomState.timer === t_val ? 'var(--bg)' : '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 100,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    ⏱ {t_val}s
                  </button>
                ))}
              </div>
            )}

            {/* Left sidebar for Grid & Filter */}
            {!isCapturing && (
              <div style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50, background: 'rgba(255,255,255,0.1)', padding: '12px 8px', borderRadius: 24, backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: showGrid ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', padding: 8 }}
                  title={t('video.grid')}
                >
                  <div style={{ fontSize: 20 }}>⊞</div>
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{t('video.grid')}</span>
                </button>
                
                <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0' }} />
                
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: roomState.videoFilter !== 'none' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', padding: 8 }}
                    title={t('video.filter')}
                  >
                    <div style={{ fontSize: 20 }}>🎨</div>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{t('video.filter')}</span>
                  </button>

                  {showFilterMenu && (
                    <div style={{ position: 'absolute', top: 0, left: '100%', marginLeft: 16, width: 180, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-lg)', zIndex: 60 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{t('video.filter')}</span>
                        <button onClick={() => setShowFilterMenu(false)} style={{ color: 'var(--text-muted)', fontSize: 18, background: 'none', border: 'none' }}>×</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {VIDEO_FILTERS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => updateState && updateState({ videoFilter: f.style })}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: roomState.videoFilter === f.style ? 'rgba(255,255,255,0.1)' : 'transparent',
                              color: roomState.videoFilter === f.style ? 'var(--text)' : 'var(--text-muted)',
                              border: roomState.videoFilter === f.style ? '1px solid var(--border)' : '1px solid transparent',
                              textAlign: 'left',
                              fontSize: 14,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Local video */}
            <div className="video-cell local" style={{ position: 'relative', borderRadius: 0 }}>
              <video
                id="local-video"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: roomState.videoFilter
                }}
              />

              {showGrid && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                  <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}

              {/* Camera controls */}
              <div className="camera-controls" style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
                <button
                  onClick={toggleMic}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title={isMicOn ? t('video.micOff') : t('video.micOn')}
                >
                  {isMicOn ? '🎤' : '🔇'}
                </button>
                <button
                  onClick={toggleMirror}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title={t('video.mirror')}
                >
                  🪞
                </button>
                <button
                  onClick={toggleCamera}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title={t('video.switchCamera')}
                >
                  🔄
                </button>
              </div>

              {/* Camera Error State */}
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
                    autoPlay
                    playsInline
                    muted
                    style={{ 
                      width: '100%', height: '100%', objectFit: 'cover',
                      transform: partnerMirrored ? 'scaleX(-1)' : 'none',
                      filter: roomState.videoFilter
                    }}
                  />
                  
                  {showGrid && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                      <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: 1, background: 'rgba(255,255,255,0.3)' }} />
                    </div>
                  )}
                </>
              ) : (
                <div className="video-cell-waiting">
                  <div className="waiting-avatar">👤</div>
                  <p className="waiting-text">
                    {isConnected
                      ? 'Terhubung, menunggu video...'
                      : partnerInfo
                        ? 'Partner terhubung, menunggu video...'
                        : 'Menunggu partner masuk...'}
                  </p>
                  {!partnerInfo && !isConnected && (
                    <p className="waiting-text" style={{ fontSize: 11, marginTop: 4 }}>
                      Bagikan kode <strong style={{ color: 'var(--accent)' }}>{roomCode}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Captured Photos Preview Strip */}
          {(myPhotos.length > 0 || partnerPhotos.length > 0) && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap', padding: '0 16px' }}>
              {Array.from({ length: totalCount }).map((_, i) => {
                const p = myPhotos[i];
                const p2 = partnerPhotos[i];
                const hasPhoto = p?.dataUrl || p2?.dataUrl;
                return (
                  <div key={i} style={{ width: 64, height: 48, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', border: hasPhoto ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex' }}>
                    {hasPhoto ? (
                      <>
                        {p?.dataUrl ? <img src={p.dataUrl} alt={`Take ${i + 1}`} style={{ flex: 1, width: '50%', height: '100%', objectFit: 'cover' }} /> : <div style={{ flex: 1, width: '50%' }} />}
                        {p2?.dataUrl ? <img src={p2.dataUrl} alt={`Take ${i + 1} Partner`} style={{ flex: 1, width: '50%', height: '100%', objectFit: 'cover' }} /> : <div style={{ flex: 1, width: '50%' }} />}
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{i + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="video-bottom" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20 }}>
            {!isCapturing && onBack && (
              <button
                onClick={onBack}
                style={{ padding: '16px 24px', fontSize: 16, borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
              >
                ← back
              </button>
            )}
            <button
              id="btn-start"
              onClick={startSession}
              disabled={isCapturing}
              style={{ padding: '16px 40px', fontSize: 18, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 800, cursor: isCapturing ? 'not-allowed' : 'pointer', opacity: isCapturing ? 0.7 : 1, transition: 'all 0.2s', boxShadow: isCapturing ? 'none' : 'var(--accent-glow)' }}
            >
              {isCapturing
                ? `📸 Memotret ${photoIndex + 1}/${totalCount}...`
                : '📸 MULAI MEMOTRET'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

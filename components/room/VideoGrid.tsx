import { RefObject } from 'react';
import { RoomState, SessionPhase, ParticipantInfo, CapturedPhoto } from '@/lib/types';

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
  startSession: () => void;

  partnerConnected: boolean;
  facingMode: 'user' | 'environment';
  isMirrored: boolean;
  toggleCamera: () => void;
  toggleMirror: () => void;
  onBack?: () => void;
}

// Countdown bubble inside each video cell
function CountdownBubble({ countdown, photoIndex, totalCount }: { countdown: number; photoIndex: number; totalCount: number }) {
  if (countdown <= 0) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      pointerEvents: 'none',
    }}>
      <div
        key={countdown}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '3px solid rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 900,
          color: '#fff',
          animation: 'countdownPop 0.3s ease-out',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {countdown}
      </div>
      <span style={{
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.5,
        padding: '3px 10px',
        borderRadius: 100,
      }}>
        {photoIndex + 1}/{totalCount}
      </span>
    </div>
  );
}

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
  startSession,

  isMirrored,
  toggleCamera,
  toggleMirror,
  onBack,
}: VideoGridProps) {
  const isCapturing = phase === 'countdown' || phase === 'capturing';

  return (
    <div className="video-area">
      <div className="flash-overlay" ref={flashRef} />

      {phase === 'error_full' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
          <h2 style={{ color: '#ff4d4d', marginBottom: 12 }}>Ruangan Penuh</h2>
          <p style={{ color: 'var(--text-muted)' }}>Maksimal 2 orang yang diizinkan dalam satu sesi foto.</p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {/* Local video */}
            <div className="video-cell local" style={{ position: 'relative' }}>
              <video
                id="local-video"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
              />
              <div className="video-cell-label">
                📷 Kamu {role === 'host' ? '(Host)' : '(Tamu)'}
              </div>

              {/* Camera controls */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
                <button
                  onClick={toggleMirror}
                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: 16 }}
                  title="Mirror Video"
                  aria-label="Mirror video"
                >
                  🪞
                </button>
                <button
                  onClick={toggleCamera}
                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: 16 }}
                  title="Ganti Kamera"
                  aria-label="Switch camera"
                >
                  🔄
                </button>
              </div>

              {/* Countdown inside local video */}
              {isCapturing && (
                <CountdownBubble countdown={countdown} photoIndex={photoIndex} totalCount={totalCount} />
              )}
            </div>

            {/* Remote video */}
            <div className="video-cell" style={{ position: 'relative' }}>
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                  />
                  <div className="video-cell-label">👤 Partner</div>

                  {/* Countdown inside remote video */}
                  {isCapturing && (
                    <CountdownBubble countdown={countdown} photoIndex={photoIndex} totalCount={totalCount} />
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
          {myPhotos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap', padding: '0 16px' }}>
              {Array.from({ length: totalCount }).map((_, i) => {
                const p = myPhotos[i];
                return (
                  <div key={i} style={{ width: 64, height: 48, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', border: p ? '2px solid var(--accent)' : '1px dashed rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {p?.dataUrl ? (
                      <img src={p.dataUrl} alt={`Take ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

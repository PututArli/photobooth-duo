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
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMirror: () => void;
  toggleMic: () => void;
  onBack?: () => void;
}

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
  startSession,

  facingMode,
  isMirrored,
  isMicOn,
  toggleCamera,
  toggleMirror,
  toggleMic,
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
          {/* Global Photo Counter removed - redundant with button text and covers UI */}

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
                  width: '100%', height: '100%', objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute', bottom: 16, left: 16, background: '#ff6b6b', color: '#fff',
                padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 800,
                boxShadow: '0 2px 10px rgba(255,107,107,0.4)'
              }}>
                You ({role})
              </div>

              {/* Camera controls */}
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
                <button
                  onClick={toggleMic}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title={isMicOn ? "Matikan Mic" : "Nyalakan Mic"}
                >
                  {isMicOn ? '🎤' : '🔇'}
                </button>
                <button
                  onClick={toggleMirror}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title="Mirror Video"
                >
                  🪞
                </button>
                <button
                  onClick={toggleCamera}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', fontSize: 18 }}
                  title="Ganti Kamera"
                >
                  🔄
                </button>
              </div>
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 16, left: 16, background: 'var(--accent)', color: '#fff',
                    padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 800,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}>
                    Partner ({partnerInfo?.role || (role === 'host' ? 'guest' : 'host')})
                  </div>
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

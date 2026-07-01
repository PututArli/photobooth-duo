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
}: VideoGridProps) {
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
            </div>

            {/* Remote video */}
            <div className="video-cell">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                  />
                  <div className="video-cell-label">👤 Partner</div>
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

          {/* Countdown overlay */}
          {(phase === 'countdown' || phase === 'capturing') && countdown > 0 && (
            <div className="countdown-overlay">
              <div className="countdown-number" key={countdown}>{countdown}</div>
              <div className="countdown-label">
                FOTO {photoIndex + 1} dari {totalCount}
              </div>
            </div>
          )}

          <div className="video-bottom" style={{ justifyContent: 'center' }}>
            <button
              id="btn-start"
              className="capture-btn"
              onClick={startSession}
              disabled={(['countdown', 'capturing'] as string[]).includes(phase)}
              style={{ padding: '16px 40px', fontSize: 18 }}
            >
              {(['countdown', 'capturing'] as string[]).includes(phase)
                ? `📸 Memotret ${photoIndex + 1}/${totalCount}...`
                : '📸 MULAI MEMOTRET'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

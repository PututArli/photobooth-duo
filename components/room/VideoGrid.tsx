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
  handleReset: (val: boolean) => void;
  setShowResult: (val: boolean) => void;
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
  handleReset,
  setShowResult,
  partnerConnected,
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
            <div className="video-cell local" style={{ position: 'relative' }}>
              <video
                id="local-video"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  filter: `brightness(${roomState.adj.b}%) contrast(${roomState.adj.c}%) saturate(${roomState.adj.s}%) sepia(${roomState.adj.w}%)${roomState.colorCSS !== 'none' ? ` ${roomState.colorCSS}` : ''}`,
                }}
              />
              <div className="video-cell-label">📷 Kamu ({role === 'host' ? 'Host' : 'Tamu'})</div>

              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
                <button
                  onClick={toggleMirror}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                  title="Mirror Video"
                >
                  🪞
                </button>
                <button
                  onClick={toggleCamera}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                  title="Ganti Kamera"
                >
                  🔄
                </button>
              </div>
            </div>

            <div className="video-cell">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    style={{ filter: `brightness(${roomState.adj.b}%) contrast(${roomState.adj.c}%) saturate(${roomState.adj.s}%) sepia(${roomState.adj.w}%)${roomState.colorCSS !== 'none' ? ` ${roomState.colorCSS}` : ''}` }}
                  />
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

          {(phase === 'countdown' || phase === 'capturing') && countdown > 0 && (
            <div className="countdown-overlay">
              <div className="countdown-number" key={countdown}>{countdown}</div>
              <div className="countdown-label">
                FOTO {photoIndex + 1} dari {totalCount}
              </div>
            </div>
          )}

          <div className="video-bottom">
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
        </>
      )}
    </div>
  );
}

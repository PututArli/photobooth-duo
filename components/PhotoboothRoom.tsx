'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LAYOUTS, LayoutKey } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import VideoGrid from './room/VideoGrid';
import ResultPage from './room/ResultPage';
import DecoratePage from './room/DecoratePage';
import CaptureReviewPage from './room/CaptureReviewPage';
import { SetupLayout, SetupTheme } from './room/WizardScreens';
import { ArrangePage } from './room/ArrangePage';
import SectionGuide from './SectionGuide';

interface Props {
  roomId: string;
  roomCode: string;
  roomExpiresAt: string;
}

export default function PhotoboothRoom({ roomId, roomCode, roomExpiresAt }: Props) {
  const {
    roomState, phase, changePhase, setPhaseLocal, myPhotos, partnerPhotos,
    partnerInfo, countdown, photoIndex, role, isInitialized, roomIssue,
    captureRunId, startSession, retakePhoto, onPhotoCaptured, updateState, handleReset, broadcast, participantId, hostTimeOffset,
  } = useRoom(roomId, roomCode, roomExpiresAt);
  const { t, lang, setLang } = useTranslation();

  const [usePremiumTurn, setUsePremiumTurn] = useState(false);
  const [roomTimeLeft, setRoomTimeLeft] = useState(0);
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [showTailscaleWarning, setShowTailscaleWarning] = useState(false);
  const [flash, setFlash] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const getRemaining = () => {
      const expiresAt = new Date(roomExpiresAt).getTime();
      if (!Number.isFinite(expiresAt)) return 0;
      return Math.max(0, expiresAt - (Date.now() + hostTimeOffset));
    };
    setRoomTimeLeft(getRemaining());
    const interval = window.setInterval(() => {
      setRoomTimeLeft(getRemaining());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [roomExpiresAt, hostTimeOffset]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const premium = localStorage.getItem('use_premium_turn');
      if (premium === 'true') {
        setUsePremiumTurn(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const { localStream, remoteStream, streamTick, isConnected, facingMode, isMirrored, partnerMirrored, isMicOn, cameraError, retryCamera, toggleCamera, toggleMirror, toggleMic } = useWebRTC(roomCode, role === 'host', usePremiumTurn);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    // If the partner is joined (signaling works) but WebRTC hasn't connected for 12 seconds
    if (partnerInfo && !isConnected) {
      timeout = setTimeout(() => {
        setShowTailscaleWarning(true);
      }, 12000);
    } else {
      setShowTailscaleWarning(false);
    }
    return () => clearTimeout(timeout);
  }, [partnerInfo, isConnected]);

  useEffect(() => {
    if (phase === 'capturing') {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, captureRunId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [copyDone, setCopyDone] = useState(false);
  const [decoratedImgUrl, setDecoratedImgUrl] = useState<string | null>(null);
  const [decorationsUrl, setDecorationsUrl] = useState<string | null>(null);

  // Attach remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(e => console.error('Remote audio play error:', e));
      }
    }
  }, [remoteStream, streamTick]);

  // Capture photo when phase transitions to 'capturing'
  const lastCapturedRunRef = useRef(-1);
  useEffect(() => {
    if (phase !== 'capturing') {
      return;
    }
    if (lastCapturedRunRef.current === captureRunId) return;
    lastCapturedRunRef.current = captureRunId;

    // Flash effect
    if (flashRef.current) {
      flashRef.current.classList.add('active');
      setTimeout(() => flashRef.current?.classList.remove('active'), 400);
    }

    const captureVideo = (vid: HTMLVideoElement | null, mirrored: boolean) => {
      const targetWidth = 800;
      const targetHeight = 600;
      const targetRatio = targetWidth / targetHeight;
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      
      if (!vid || vid.readyState < 2 || !vid.videoWidth) {
        // No video ready — return a dark placeholder
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📷 ' + t('video.cameraUnavailable'), canvas.width/2, canvas.height/2);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
      
      const vWidth = vid.videoWidth;
      const vHeight = vid.videoHeight;
      const vRatio = vWidth / vHeight;
      
      let sourceWidth = vWidth;
      let sourceHeight = vHeight;
      let sourceX = 0;
      let sourceY = 0;
      
      // Crop center to match exactly 4:3 (mimicking object-fit: cover)
      if (vRatio > targetRatio) {
        sourceWidth = vHeight * targetRatio;
        sourceX = (vWidth - sourceWidth) / 2;
      } else {
        sourceHeight = vWidth / targetRatio;
        sourceY = (vHeight - sourceHeight) / 2;
      }
      
      ctx.save();
      if (roomState.videoFilter && roomState.videoFilter !== 'none') {
        ctx.filter = roomState.videoFilter;
      }
      if (mirrored) {
        ctx.scale(-1, 1);
        ctx.drawImage(vid, sourceX, sourceY, sourceWidth, sourceHeight, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(vid, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      
      return canvas.toDataURL('image/jpeg', 0.9);
    };

    const myDataUrl = captureVideo(localVideoRef.current, isMirrored);
    
    onPhotoCaptured(myDataUrl, photoIndex);
  }, [phase, photoIndex, captureRunId, roomState.videoFilter, isMirrored, onPhotoCaptured, t]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, [roomCode]);

  const partnerConnected = !!partnerInfo || isConnected;
  const layoutCount = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;
  const totalCount = Math.max(6, layoutCount + 2);
  const roomMinutes = Math.floor(roomTimeLeft / 60000);
  const roomSeconds = Math.floor((roomTimeLeft % 60000) / 1000);
  const roomTimeLabel = `${roomMinutes}:${roomSeconds.toString().padStart(2, '0')}`;
  const showRoomBadge = phase !== 'expired';
  const isCameraPhase = phase === 'ready_to_capture' || phase === 'countdown' || phase === 'capturing';
  const roomBadgeClass = [
    'room-expiry-badge',
    roomTimeLeft <= 60000 ? 'danger' : '',
    isCameraPhase ? 'camera' : '',
  ].filter(Boolean).join(' ');

  const renderPhase = () => {
    if (phase === 'waiting_partner') {
      return (
        <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
        <div className="landing-bg" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <SectionGuide
          variant="floating"
          title={t('guide.waiting.title')}
          steps={[
            t('guide.waiting.step1'),
            t('guide.waiting.step2'),
            t('guide.waiting.step3'),
            t('guide.waiting.step4'),
          ]}
        />

        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t('room.yourCode')}</p>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {roomCode.split('').map((char, i) => (
              <div key={i} style={{ width: 56, height: 72, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, backdropFilter: 'blur(10px)', border: '1px solid var(--border)', boxShadow: 'var(--accent-glow)' }}>
                {char}
              </div>
            ))}
          </div>

          <button onClick={copyLink} style={{ padding: '12px 24px', background: copyDone ? '#4ade80' : 'var(--text)', border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, color: copyDone ? '#000' : 'var(--bg)', display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer', transition: 'all 0.3s', boxShadow: 'var(--accent-glow)' }}>
            {copyDone ? t('room.copied') : t('room.copyLink')}
            {copyDone ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 40, padding: '0 20px', lineHeight: 1.5 }}
             dangerouslySetInnerHTML={{ __html: t('room.copyHelper') }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: partnerConnected ? '#4ade80' : 'var(--text-muted)', fontWeight: partnerConnected ? 700 : 500 }}>
            {partnerConnected ? (
              <span style={{ width: 10, height: 10, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80' }}></span>
            ) : (
              <span style={{ width: 10, height: 10, border: '2px solid var(--text-muted)', borderRadius: '50%', opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
                <style>{`@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }`}</style>
              </span>
            )}
            {partnerConnected ? t('room.connected') : t('room.waiting')}
          </div>

          <button 
            onClick={() => changePhase('setup_layout')}
            disabled={!partnerConnected}
            style={{ width: '100%', maxWidth: 280, padding: '16px 24px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: partnerConnected ? 1 : 0.5, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 700, fontSize: 16, cursor: partnerConnected ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: partnerConnected ? 'var(--accent-glow)' : 'none' }}
          >
            {t('room.chooseLayout')} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>

          <div style={{ marginTop: 40 }}>
            <a href="/" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>{t('room.back')}</a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup_layout') {
    return <SetupLayout roomState={roomState} updateState={updateState} nextStep={() => changePhase('setup_theme')} prevStep={() => changePhase('waiting_partner')} role={role} />;
  }

  if (phase === 'setup_theme') {
    return <SetupTheme roomState={roomState} updateState={updateState} nextStep={() => changePhase('ready_to_capture')} prevStep={() => changePhase('setup_layout')} role={role} />;
  }

  if (phase === 'expired') {
    return (
      <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
        <div className="landing-bg" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, textAlign: 'center', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>{t('room.expiredTitle')}</p>
          <h1 style={{ fontSize: 24, lineHeight: 1.25, marginBottom: 12 }}>{t('room.expiredHeading')}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{t('room.expiredDesc')}</p>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 20px', borderRadius: 999, background: 'var(--text)', color: 'var(--bg)', fontWeight: 800 }}>
            {t('room.back')}
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <CaptureReviewPage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        totalCount={totalCount}
        onRetake={retakePhoto}
        onContinue={() => changePhase('arrange')}
        onBack={() => changePhase('ready_to_capture')}
      />
    );
  }

  if (phase === 'arrange') {
    return (
      <ArrangePage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        layoutKey={roomState.layout}
        roomState={roomState}
        updateState={updateState}
        onComplete={() => {
          changePhase('decorate');
        }}
        onBack={() => changePhase('review')}
      />
    );
  }

  if (phase === 'decorate') {
    return (
      <DecoratePage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        selectedIndices={(roomState.arrangeIndices as number[]) || []}
        roomState={roomState}
        participantId={participantId}
        broadcast={broadcast}
        onComplete={(url, decUrl) => {
          setDecoratedImgUrl(url);
          if (decUrl) setDecorationsUrl(decUrl);
          changePhase('done');
        }}
        onBack={() => changePhase('arrange')}
      />
    );
  }

  if (phase === 'done') {
    return (
      <ResultPage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        selectedIndices={(roomState.arrangeIndices as number[]) || []}
        roomState={roomState}
        roomCode={roomCode}
        decoratedImgUrl={decoratedImgUrl}
        decorationsUrl={decorationsUrl}
        onRetake={() => handleReset(true)}
        onBack={() => setPhaseLocal('decorate')}
      />
    );
  }

    return (
      <div className="room-layout-clean">
        <VideoGrid
          localStream={localStream}
          remoteStream={remoteStream}
          roomState={roomState}
          role={role}
          partnerInfo={partnerInfo}
          isConnected={isConnected}
          roomCode={roomCode}
          phase={phase}
          countdown={countdown}
          photoIndex={photoIndex}
          totalCount={totalCount}
          flashRef={flashRef}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          myPhotos={myPhotos}
          partnerPhotos={partnerPhotos}
          startSession={startSession}
          updateState={updateState}
          partnerConnected={partnerConnected}
          facingMode={facingMode}
          isMirrored={isMirrored}
          partnerMirrored={partnerMirrored}
          isMicOn={isMicOn}
          toggleCamera={toggleCamera}
          toggleMirror={toggleMirror}
          toggleMic={toggleMic}
          onBack={() => changePhase('setup_theme')}
          onSkipToLayout={() => changePhase('arrange')}
        />
      </div>
    );
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }} />
      {showRoomBadge && roomTimeLeft < 31536000000 && (
        <div 
          className={roomBadgeClass}
          style={{ cursor: 'pointer', pointerEvents: 'auto', padding: isTimerExpanded ? '8px 12px' : '8px', minWidth: isTimerExpanded ? 'auto' : '38px', justifyContent: 'center' }}
          onClick={() => setIsTimerExpanded(!isTimerExpanded)}
          title={isTimerExpanded ? '' : `${t('room.timeLeft')} ${roomTimeLabel}`}
        >
          {isTimerExpanded ? (
            <>
              <span>{t('room.timeLeft')}</span>
              <strong>{roomTimeLabel}</strong>
            </>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 0, color: 'var(--text)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>

          )}
        </div>
      )}
      {roomIssue === 'connection' && phase !== 'expired' && (
        <div className="room-issue-toast">
          {t('room.connectionIssue')}
        </div>
      )}
      
      {showTailscaleWarning && (
        <div className="camera-error-modal" style={{ zIndex: 100 }}>
          <div className="camera-error-content" style={{ maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff7e5f" strokeWidth="2" style={{ marginBottom: 16 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <h3 style={{ color: '#ff7e5f', marginBottom: 12 }}>{t('room.webrtcFailedTitle')}</h3>
            <p style={{ lineHeight: 1.5 }}>{t('room.webrtcFailedDesc')}</p>
            
            <div style={{ marginTop: 24, textAlign: 'left', background: 'rgba(255,126,95,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,126,95,0.2)' }}>
              <h4 style={{ color: '#ff7e5f', marginBottom: 8, fontSize: 14 }}>{t('guide.tailscale.title')}</h4>
              <p style={{ fontSize: 13, marginBottom: 12 }}>{t('guide.tailscale.intro')}</p>
              <ol className="guide-list guide-list-compact" style={{ fontSize: 13 }}>
                <li>{t('guide.tailscale.step1')}</li>
                <li>{t('guide.tailscale.step2')}</li>
                <li>{t('guide.tailscale.step3')}</li>
                <li>{t('guide.tailscale.step4')}</li>
                <li>{t('guide.tailscale.step5')}</li>
                <li>{t('guide.tailscale.step6')}</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, width: '100%' }}>
              <button 
                onClick={() => window.open('https://tailscale.com/download', '_blank')} 
                style={{ padding: '12px 16px', borderRadius: 100, border: 'none', background: '#ff7e5f', color: 'var(--bg)', fontWeight: 700, cursor: 'pointer', flex: 1, fontSize: 13 }}
              >
                Download Tailscale
              </button>
              <button 
                onClick={() => setShowTailscaleWarning(false)} 
                style={{ padding: '12px 24px', borderRadius: 100, border: 'none', background: 'var(--surface-hover)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                {t('guide.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {cameraError && (
        <div className="camera-error-modal">
          <div className="camera-error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
            <h3>{t('camera.errorTitle')}</h3>
            <p>{t('camera.errorDesc')}</p>
            <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '24px' }}>{t('camera.errorInstructions')}</p>
            <button onClick={retryCamera}>{t('camera.errorBtn')}</button>
          </div>
        </div>
      )}
      
      {renderPhase()}
      
      {flash && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 9999, animation: 'flash-fade 0.5s ease-out forwards', pointerEvents: 'none' }}>
          <style>{`@keyframes flash-fade { from { opacity: 1; } to { opacity: 0; } }`}</style>
        </div>
      )}
    </>
  );
}

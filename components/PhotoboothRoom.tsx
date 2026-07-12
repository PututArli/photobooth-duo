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
  const { t } = useTranslation();

  const [usePremiumTurn, setUsePremiumTurn] = useState(false);
  const [roomTimeLeft, setRoomTimeLeft] = useState(0);
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);

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

  const { localStream, remoteStream, streamTick, isConnected, facingMode, isMirrored, partnerMirrored, isMicOn, cameraError, retryCamera, toggleCamera, toggleMirror, toggleMic } = useWebRTC(roomCode, role === 'host', usePremiumTurn);

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
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      if (!vid || vid.readyState < 2 || !vid.videoWidth) {
        // No video ready — return a dark placeholder
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📷 ' + t('video.cameraUnavailable'), 320, 240);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
      let width = vid.videoWidth;
      let height = vid.videoHeight;
      const MAX_WIDTH = 480;
      if (width > MAX_WIDTH) {
        height = Math.floor(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;

      ctx.save();
      if (roomState.videoFilter && roomState.videoFilter !== 'none') {
        ctx.filter = roomState.videoFilter;
      }
      if (mirrored) {
        ctx.scale(-1, 1);
        ctx.drawImage(vid, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      return canvas.toDataURL('image/jpeg', 0.8);
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

          <button onClick={copyLink} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            {copyDone ? t('room.copied') : t('room.copyLink')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, border: '2px solid var(--text-muted)', borderRadius: '50%' }}></span>
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
            <span style={{ fontSize: 16, margin: 0, padding: 0, lineHeight: 1 }}>⏳</span>
          )}
        </div>
      )}
      {roomIssue === 'connection' && phase !== 'expired' && (
        <div className="room-issue-toast">
          {t('room.connectionIssue')}
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
    </>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LAYOUTS, LayoutKey } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';
import VideoGrid from './room/VideoGrid';
import PreviewModal from './room/PreviewModal';
import { SetupLayout, SetupTheme } from './room/WizardScreens';

interface Props {
  roomId: string;
  roomCode: string;
}

export default function PhotoboothRoom({ roomId, roomCode }: Props) {
  const {
    roomState, phase, changePhase, myPhotos, partnerPhotos,
    partnerInfo, countdown, photoIndex, role,
    startSession, onPhotoCaptured, updateState, handleReset,
  } = useRoom(roomId, roomCode);

  const { localStream, remoteStream, isConnected, facingMode, isMirrored, toggleCamera, toggleMirror } = useWebRTC(roomCode, role === 'host');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [showResult, setShowResult] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [resultComposed, setResultComposed] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState<string>('');

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Capture photo when phase transitions to 'capturing'
  const capturedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'capturing') {
      capturedRef.current = false;
      return;
    }
    // Guard: only capture once per capture event
    if (capturedRef.current) return;
    capturedRef.current = true;

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
        ctx.fillText('📷 Tidak tersedia', 320, 240);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      ctx.save();
      if (mirrored) {
        ctx.scale(-1, 1);
        ctx.drawImage(vid, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      return canvas.toDataURL('image/jpeg', 0.92);
    };

    const myDataUrl = captureVideo(localVideoRef.current, isMirrored);
    const partnerDataUrl = captureVideo(remoteVideoRef.current, false);
    
    onPhotoCaptured(myDataUrl, partnerDataUrl, photoIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, photoIndex]);

  // Compose result canvas when entering customizing phase or state changes
  const composeResult = useCallback(async () => {
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
    setResultImgUrl(resultCanvasRef.current.toDataURL('image/png'));
    setResultComposed(true);
  }, [roomState, myPhotos, partnerPhotos]);

  useEffect(() => {
    if (phase !== 'done') {
      setResultComposed(false);
      return;
    }
    composeResult().then(() => {
      setShowResult(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myPhotos, partnerPhotos]);

  // Re-compose if customization changes while in done phase (if they edit after result is shown)
  useEffect(() => {
    if (phase === 'done') {
      composeResult();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState, phase]);

  const handleDownload = useCallback(() => {
    if (!resultImgUrl) return;
    const a = document.createElement('a');
    a.href = resultImgUrl;
    a.download = `photoboothduo-${roomCode}-${Date.now()}.png`;
    a.click();
  }, [roomCode, resultImgUrl]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, [roomCode]);

  const partnerConnected = !!partnerInfo || isConnected;
  const totalCount = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;

  if (phase === 'waiting_partner') {
    return (
      <div className="wizard-screen">
        <div className="wizard-container" style={{ textAlign: 'center' }}>
          <h2 className="wizard-title">Layar 1: Ruang Tunggu</h2>
          <p className="wizard-subtitle">Bagikan link ini ke pasangan/teman Anda agar mereka bisa bergabung.</p>
          
          <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 'var(--radius-sm)', margin: '24px 0', border: '1px solid var(--border)' }}>
            <code style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: 'var(--text)' }}>{roomCode}</code>
          </div>
          
          <div className="wizard-actions" style={{ justifyContent: 'center', gap: 12 }}>
            <button className="btn-secondary" onClick={copyLink}>
              {copyDone ? 'Tersalin! ✅' : 'Salin Tautan 🔗'}
            </button>
            {role === 'host' && (
              <button 
                className="btn-primary" 
                onClick={() => changePhase('setup_layout')}
                disabled={!partnerConnected}
              >
                {!partnerConnected ? '⏳ Menunggu Partner...' : 'Mulai ➔'}
              </button>
            )}
            {role === 'guest' && (
              <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
                {partnerConnected ? '✅ Terhubung! Menunggu Host memulai sesi.' : '⏳ Menghubungkan ke Room...'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup_layout') {
    return <SetupLayout roomState={roomState} updateState={updateState} nextStep={() => changePhase('setup_theme')} role={role} />;
  }

  if (phase === 'setup_theme') {
    return <SetupTheme roomState={roomState} updateState={updateState} nextStep={() => changePhase('ready_to_capture')} prevStep={() => changePhase('setup_layout')} role={role} />;
  }

  return (
    <div className="room-layout-clean">
      <VideoGrid
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
        startSession={startSession}
        partnerConnected={partnerConnected}
        facingMode={facingMode}
        isMirrored={isMirrored}
        toggleCamera={toggleCamera}
        toggleMirror={toggleMirror}
      />


      <canvas
        ref={resultCanvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <PreviewModal
        showResult={showResult}
        setShowResult={setShowResult}
        resultComposed={resultComposed}
        resultImgUrl={resultImgUrl}
        handleDownload={handleDownload}
        handleReset={handleReset}
      />
    </div>
  );
}

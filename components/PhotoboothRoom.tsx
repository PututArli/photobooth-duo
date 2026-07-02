'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LAYOUTS, LayoutKey } from '@/lib/types';
import VideoGrid from './room/VideoGrid';
import ResultPage from './room/ResultPage';
import { SetupLayout, SetupTheme } from './room/WizardScreens';
import { ArrangePage } from './room/ArrangePage';

interface Props {
  roomId: string;
  roomCode: string;
}

export default function PhotoboothRoom({ roomId, roomCode }: Props) {
  const {
    roomState, phase, changePhase, setPhaseLocal, myPhotos, partnerPhotos,
    partnerInfo, countdown, photoIndex, role,
    startSession, onPhotoCaptured, updateState, handleReset,
  } = useRoom(roomId, roomCode);

  const { localStream, remoteStream, isConnected, facingMode, isMirrored, toggleCamera, toggleMirror } = useWebRTC(roomCode, role === 'host');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [copyDone, setCopyDone] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, phase]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, phase]);

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
      let width = vid.videoWidth;
      let height = vid.videoHeight;
      const MAX_WIDTH = 800;
      if (width > MAX_WIDTH) {
        height = Math.floor(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;

      ctx.save();
      if (mirrored) {
        ctx.scale(-1, 1);
        ctx.drawImage(vid, -canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      return canvas.toDataURL('image/jpeg', 0.85); // Compress for broadcast
    };

    const myDataUrl = captureVideo(localVideoRef.current, isMirrored);
    
    onPhotoCaptured(myDataUrl, photoIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, photoIndex]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }, [roomCode]);

  const partnerConnected = !!partnerInfo || isConnected;
  const layoutCount = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;
  const totalCount = Math.max(6, layoutCount + 2);

  if (phase === 'waiting_partner') {
    return (
      <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
        <div className="landing-bg" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>


        <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, zIndex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>YOUR CODE</p>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {roomCode.split('').map((char, i) => (
              <div key={i} style={{ width: 56, height: 72, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, backdropFilter: 'blur(10px)', border: '1px solid var(--border)', boxShadow: 'var(--accent-glow)' }}>
                {char}
              </div>
            ))}
          </div>

          <button onClick={copyLink} style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            {copyDone ? 'copied!' : 'copy link'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, border: '2px solid var(--text-muted)', borderRadius: '50%' }}></span>
            {partnerConnected ? 'partner connected!' : 'waiting for partner...'}
          </div>

          <button 
            onClick={() => changePhase('setup_layout')}
            disabled={!partnerConnected}
            style={{ width: '100%', maxWidth: 280, padding: '16px 24px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: partnerConnected ? 1 : 0.5, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 700, fontSize: 16, cursor: partnerConnected ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: partnerConnected ? 'var(--accent-glow)' : 'none' }}
          >
            Pilih Layout & Tema <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>

          <div style={{ marginTop: 40 }}>
            <a href="/" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>← back</a>
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

  if (phase === 'arrange') {
    return (
      <ArrangePage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        layoutKey={roomState.layout}
        onSubmit={(indices) => {
          setSelectedIndices(indices);
          setPhaseLocal('done');
        }}
      />
    );
  }

  if (phase === 'done') {
    return (
      <ResultPage
        myPhotos={myPhotos}
        partnerPhotos={partnerPhotos}
        selectedIndices={selectedIndices}
        roomState={roomState}
        roomCode={roomCode}
        onRetake={() => handleReset(true)}
        onBack={() => setPhaseLocal('arrange')}
      />
    );
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
        onBack={() => changePhase('setup_theme')}
      />
    </div>
  );
}

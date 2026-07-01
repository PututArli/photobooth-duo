'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LAYOUTS, LayoutKey } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';
import VideoGrid from './room/VideoGrid';
import PreviewModal from './room/PreviewModal';
import CaptureControls from './room/CaptureControls';

interface Props {
  roomId: string;
  roomCode: string;
}

export default function PhotoboothRoom({ roomId, roomCode }: Props) {
  const {
    roomState, phase, myPhotos, partnerPhotos,
    partnerInfo, countdown, photoIndex, role,
    startSession, onPhotoCaptured, updateState, setColor, handleReset,
  } = useRoom(roomId, roomCode);

  const { localStream, remoteStream, isConnected, facingMode, isMirrored, toggleCamera, toggleMirror } = useWebRTC(roomCode, role === 'host');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'layout' | 'color' | 'frame' | 'border' | 'text'>('layout');
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

    const captureVideo = (vid: HTMLVideoElement, mirrored: boolean) => {
      if (!vid || vid.readyState < 2) return '';
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 640;
      canvas.height = vid.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;
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

    const myDataUrl = captureVideo(localVideoRef.current!, isMirrored);
    const partnerDataUrl = captureVideo(remoteVideoRef.current!, false);
    
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
    if (phase !== 'customizing') {
      setResultComposed(false);
      return;
    }
    composeResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myPhotos, partnerPhotos]);

  // Re-compose when customization options change
  useEffect(() => {
    if (phase === 'customizing') {
      composeResult();
    } else {
      setActiveTab('layout');
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

  return (
    <div className="room-layout">
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
        handleReset={handleReset}
        setShowResult={setShowResult}
        partnerConnected={partnerConnected}
        facingMode={facingMode}
        isMirrored={isMirrored}
        toggleCamera={toggleCamera}
        toggleMirror={toggleMirror}
      />

      <CaptureControls
        roomCode={roomCode}
        roomState={roomState}
        partnerConnected={partnerConnected}
        phase={phase}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        copyDone={copyDone}
        copyLink={copyLink}
        updateState={updateState}
        setColor={setColor}
        handleReset={handleReset}
        startSession={startSession}
        setShowResult={setShowResult}
      />

      {/* Canvas always rendered (hidden when modal is closed) */}
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

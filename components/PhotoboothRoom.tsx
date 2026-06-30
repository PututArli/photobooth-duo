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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (phase !== 'capturing') return;
    
    if (flashRef.current) {
      flashRef.current.classList.add('active');
      setTimeout(() => flashRef.current?.classList.remove('active'), 400);
    }
    
    const video = localVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    
    if (isMirrored) {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onPhotoCaptured(dataUrl, photoIndex);
  }, [phase, photoIndex, onPhotoCaptured, isMirrored]);

  useEffect(() => {
    if (phase !== 'customizing') { setResultComposed(false); return; }
    composeResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myPhotos, partnerPhotos, roomState]);

  async function composeResult() {
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
    setResultComposed(true);
  }

  useEffect(() => {
    if (phase === 'customizing') composeResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState]);

  const handleDownload = useCallback(() => {
    if (!resultCanvasRef.current) return;
    const a = document.createElement('a');
    a.href = resultCanvasRef.current.toDataURL('image/png');
    a.download = `photoboothduo-${roomCode}-${Date.now()}.png`;
    a.click();
  }, [roomCode]);

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

      <PreviewModal
        showResult={showResult}
        setShowResult={setShowResult}
        resultComposed={resultComposed}
        resultCanvasRef={resultCanvasRef}
        handleDownload={handleDownload}
        handleReset={handleReset}
      />

      {!showResult && (
        <canvas ref={resultCanvasRef} style={{ display: 'none' }} />
      )}
    </div>
  );
}

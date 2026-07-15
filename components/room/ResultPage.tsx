'use client';

import { useState, useRef, useEffect } from 'react';
import { CapturedPhoto, RoomState } from '@/lib/types';
import { composeDuoPhoto } from '@/lib/composition';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';
import { downloadDataUrl, downloadJpeg, downloadPoster, printImage } from '@/lib/exportUtils';
import { Download, FileImage, Film, Image as ImageIcon, Printer, RotateCcw, Share2 } from 'lucide-react';

interface ResultPageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  selectedIndices: number[];
  roomState: RoomState;
  roomCode: string;
  decoratedImgUrl?: string | null;
  decorationsUrl?: string | null;
  onRetake: () => void;
  onBack: () => void;
}

export default function ResultPage({
  myPhotos,
  partnerPhotos,
  selectedIndices,
  roomState,
  roomCode,
  decoratedImgUrl,
  decorationsUrl,
  onRetake,
  onBack,
}: ResultPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  const [imgUrl, setImgUrl] = useState('');
  const [composed, setComposed] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoDone, setVideoDone] = useState(false);

  const markSaved = () => {
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 2000);
  };

  const getFileBase = () => `photoboothduo-${roomCode}-${Date.now()}`;

  useEffect(() => {
    if (decoratedImgUrl) {
      setImgUrl(decoratedImgUrl);
      setComposed(true);
      return;
    }

    if (!canvasRef.current) return;
    setComposed(false);
    
    // Map photos using selected indices
    const orderedMyPhotos = selectedIndices.map(i => myPhotos[i]?.dataUrl || '');
    const orderedPartnerPhotos = selectedIndices.map(i => partnerPhotos[i]?.dataUrl || '');

    composeDuoPhoto({
      myPhotos: orderedMyPhotos,
      partnerPhotos: orderedPartnerPhotos,
      state: roomState,
      canvas: canvasRef.current,
    }).then(() => {
      const url = canvasRef.current!.toDataURL('image/png');
      setImgUrl(url);
      setComposed(true);
    });
  }, [myPhotos, partnerPhotos, selectedIndices, roomState, decoratedImgUrl]);

  const handleDownload = () => {
    if (!imgUrl) return;
    downloadDataUrl(imgUrl, `${getFileBase()}.png`);
    markSaved();
  };

  const handleDownloadJpg = async () => {
    if (!imgUrl) return;
    await downloadJpeg(imgUrl, `${getFileBase()}.jpg`);
    markSaved();
  };

  const handleDownloadStory = async () => {
    if (!imgUrl) return;
    await downloadPoster(imgUrl, `${getFileBase()}-story.png`, 1080, 1920, roomState.frameBg);
    markSaved();
  };

  const handleDownloadFeed = async () => {
    if (!imgUrl) return;
    await downloadPoster(imgUrl, `${getFileBase()}-feed.png`, 1080, 1350, roomState.frameBg);
    markSaved();
  };

  const handlePrintPdf = () => {
    if (!imgUrl) return;
    printImage(imgUrl, `photoboothduo-${roomCode}`);
  };

  const handleShare = async () => {
    const url = window.location.origin;
    const title = 'BoothKita - Virtual Photobooth';
    const text = t('result.shareMessage');
    
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert(t('result.shareCopied'));
    }
  };


  const handleDownloadVideo = async () => {
    if (isGeneratingVideo || !selectedIndices.length) return;
    setIsGeneratingVideo(true);

    try {
      // --- 1. Pre-render all frames to offscreen canvases ---
      const frames: HTMLCanvasElement[] = [];
      for (const idx of selectedIndices) {
        const fc = document.createElement('canvas');
        await composeDuoPhoto({
          myPhotos: [myPhotos[idx]?.dataUrl || ''],
          partnerPhotos: [partnerPhotos[idx]?.dataUrl || ''],
          state: { ...roomState, layout: 'single' },
          canvas: fc,
        });
        frames.push(fc);
      }

      if (frames.length === 0) {
        setIsGeneratingVideo(false);
        return;
      }

      // --- 2. Create recording canvas with matching size ---
      const recCanvas = document.createElement('canvas');
      recCanvas.width = frames[0].width;
      recCanvas.height = frames[0].height;
      const recCtx = recCanvas.getContext('2d')!;

      // --- 3. Pick best supported mimeType ---
      const candidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      const mimeType = candidates.find(m => {
        try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
      }) || '';

      if (!mimeType) {
        alert('Browser Anda tidak mendukung download video. Gunakan Chrome atau Firefox.');
        setIsGeneratingVideo(false);
        return;
      }

      // --- 4. Start recording ---
      // @ts-ignore
      const stream = recCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          a.download = `boothkita-${roomCode}-${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setVideoDone(true);
          setIsGeneratingVideo(false);
          setTimeout(() => setVideoDone(false), 2000);
          resolve();
        };
      });

      recorder.start(100); // collect data every 100ms

      // --- 5. Paint each frame onto recording canvas with delay ---
      const FRAME_DURATION_MS = 900;
      for (const frame of frames) {
        recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
        recCtx.drawImage(frame, 0, 0);
        // Use requestAnimationFrame to flush to stream, then wait
        await new Promise<void>(r => requestAnimationFrame(() => r()));
        await new Promise(r => setTimeout(r, FRAME_DURATION_MS));
      }

      // Hold last frame briefly before stopping
      await new Promise(r => setTimeout(r, 200));
      recorder.stop();
      await stopped;

    } catch (e) {
      console.error('Video error:', e);
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Orb background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        background: 'var(--glass-bg)',
      }}>
        <button
          onClick={onBack}
          style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('room.back')}
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('result.title')}
        </span>
        <div className="guide-header-action">
          <SectionGuide
            title={t('guide.result.title')}
            steps={[
              t('guide.result.step1'),
              t('guide.result.step2'),
              t('guide.result.step3'),
              t('guide.result.step4'),
            ]}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexWrap: 'wrap',
        gap: 32, padding: '32px 28px',
        maxWidth: 1100, margin: '0 auto', width: '100%',
        alignItems: 'flex-start', justifyContent: 'center'
      }}>
        {/* Left: photos grid */}
        <div style={{ width: '100%', maxWidth: 280, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            {t('result.myPhotos')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {selectedIndices.map((photoIdx, i) => {
              const photo = myPhotos[photoIdx];
              return (
              <div key={i} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {photo?.dataUrl ? (
                  <img src={photo.dataUrl} alt={`${t('arrange.myTake')} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                )}
              </div>
            )})}
          </div>

          {/* Partner photos */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16, marginTop: 24 }}>
            {t('result.partnerPhotos')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {selectedIndices.map((photoIdx, i) => {
              const photo = partnerPhotos[photoIdx];
              return (
              <div key={i} style={{ aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {photo?.dataUrl ? (
                  <img src={photo.dataUrl} alt={`${t('arrange.partnerTake')} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Right: strip result */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {t('result.myStrip')}
          </p>

          <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', minHeight: 400, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {composed && imgUrl ? (
              <img
                src={imgUrl}
                alt="Photobooth Strip"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                <div style={{ marginBottom: 8, fontSize: 24 }}>⏳</div>
                {t('result.composing')}
              </div>
            )}
          </div>

          <div className="result-export-panel">
            <div className="result-export-grid">
              <button
                onClick={handleDownload}
                disabled={!composed}
                className="result-export-btn"
              >
                <Download size={16} />
                {downloadDone ? t('result.saved') : t('result.downloadPng')}
              </button>

              <button
                onClick={handleDownloadJpg}
                disabled={!composed}
                className="result-export-btn"
              >
                <FileImage size={16} />
                {t('result.downloadJpg')}
              </button>

              <button
                onClick={handleDownloadVideo}
                disabled={isGeneratingVideo || !composed}
                className="result-export-btn"
              >
                <Film size={16} />
                {videoDone ? t('result.saved') : isGeneratingVideo ? t('result.processing') : t('result.downloadVideo')}
              </button>

              <button
                onClick={handleDownloadStory}
                disabled={!composed}
                className="result-export-btn"
              >
                <ImageIcon size={16} />
                {t('result.downloadStory')}
              </button>

              <button
                onClick={handleDownloadFeed}
                disabled={!composed}
                className="result-export-btn"
              >
                <ImageIcon size={16} />
                {t('result.downloadFeed')}
              </button>

              <button
                onClick={handlePrintPdf}
                disabled={!composed}
                className="result-export-btn"
              >
                <Printer size={16} />
                {t('result.downloadPdf')}
              </button>
            </div>

            <button
              onClick={onRetake}
              className="result-retake-btn"
              style={{ marginTop: 16 }}
            >
              <RotateCcw size={16} />
              {t('result.retake')}
            </button>
          </div>
        </div>
      </div>

      {/* Branding Footer */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', textAlign: 'center', padding: '32px 20px',
        borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto',
        fontSize: 12, color: 'var(--text-muted)'
      }}>
        <p style={{ marginBottom: 6 }}>
          Built with <span style={{ color: '#ff6b98' }}>❤️</span> by{' '}
          <a href="https://www.instagram.com/ar__lii?igsh=ZWhsZWZqZ21vcnEx" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, transition: 'opacity 0.2s' }}>
            @ar__lii
          </a>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.6 }}>
          <span>&copy; {new Date().getFullYear()} BoothKita. All rights reserved.</span>
          <span>•</span>
          <button 
            onClick={handleShare}
            style={{ 
              background: 'none', border: 'none', color: 'inherit', padding: 0, 
              fontSize: 'inherit', cursor: 'pointer', textDecoration: 'underline',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}
          >
            <Share2 size={12} />
            {t('result.share')}
          </button>
        </div>
      </div>

      {/* Hidden canvas for composition */}
      <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}

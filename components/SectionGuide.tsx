'use client';

import { ReactNode, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SectionGuideProps {
  title: string;
  steps: string[];
  children?: ReactNode;
  className?: string;
  variant?: 'inline' | 'floating';
  autoOpen?: boolean;
}

export default function SectionGuide({
  title,
  steps,
  children,
  className = '',
  variant = 'inline',
  autoOpen = false,
}: SectionGuideProps) {
  const { t, lang, setLang } = useTranslation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (autoOpen) {
      const hasSeenGuide = localStorage.getItem('boothkita_seen_guide');
      if (!hasSeenGuide) {
        setOpen(true);
        localStorage.setItem('boothkita_seen_guide', 'true');
      }
    }
  }, [autoOpen]);

  useEffect(() => {
    const handleOpenEvent = () => setOpen(true);
    window.addEventListener('open-boothkita-guide', handleOpenEvent);
    return () => window.removeEventListener('open-boothkita-guide', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const modal = open ? (
    <div className="guide-overlay" role="presentation" onClick={() => setOpen(false)}>
      <section
        className="guide-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="guide-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-hover)', padding: 4, borderRadius: 100, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => {
                  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                  else if (document.exitFullscreen) document.exitFullscreen();
                }} 
                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 100, background: isFullscreen ? 'var(--text)' : 'transparent', color: isFullscreen ? 'var(--bg)' : 'var(--text)', cursor: 'pointer', transition: 'all 0.2s' }}
                title={isFullscreen ? t('room.exitFullscreen') : t('room.enterFullscreen')}
              >
                {isFullscreen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                )}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-hover)', padding: 4, borderRadius: 100, border: '1px solid var(--border)' }}>
              <button onClick={() => setLang('id')} style={{ padding: '4px 10px', border: 'none', borderRadius: 100, background: lang === 'id' ? 'var(--text)' : 'transparent', color: lang === 'id' ? 'var(--bg)' : 'var(--text)', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>ID</button>
              <button onClick={() => setLang('en')} style={{ padding: '4px 10px', border: 'none', borderRadius: 100, background: lang === 'en' ? 'var(--text)' : 'transparent', color: lang === 'en' ? 'var(--bg)' : 'var(--text)', fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>EN</button>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('guide.close')}>
              <X size={18} />
            </button>
          </div>
        </div>
        {steps.length > 0 && (
          <ol className="guide-list">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {children}
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className={`guide-trigger guide-trigger-${variant} ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={title}
        title={title}
      >
        <CircleHelp size={18} />
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

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

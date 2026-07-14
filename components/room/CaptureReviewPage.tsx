'use client';

import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { CapturedPhoto } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';

interface CaptureReviewPageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  totalCount: number;
  onRetake: (index: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function CaptureReviewPage({
  myPhotos,
  partnerPhotos,
  totalCount,
  onRetake,
  onContinue,
  onBack,
}: CaptureReviewPageProps) {
  const { t } = useTranslation();
  const slots = Array.from({ length: totalCount });
  const isComplete = slots.every((_, index) => myPhotos[index]?.dataUrl && partnerPhotos[index]?.dataUrl);

  return (
    <div className="capture-review-page">
      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        background: 'var(--glass-bg)',
        width: '100%',
        marginBottom: '24px'
      }}>
        <button
          onClick={onBack}
          style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {t('room.back')}
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('review.title')}
        </span>
        <div className="guide-header-action" style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SectionGuide
            title={t('guide.review.title')}
            steps={[
              t('guide.review.step1'),
              t('guide.review.step2'),
              t('guide.review.step3'),
              t('guide.review.step4'),
            ]}
          />
          <button className="capture-review-primary-btn" onClick={onContinue} disabled={!isComplete} style={{ padding: '8px 16px', fontSize: 14, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 700, cursor: isComplete ? 'pointer' : 'not-allowed', opacity: isComplete ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('review.continue')}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <main className="capture-review-grid">
        {slots.map((_, index) => {
          const mine = myPhotos[index]?.dataUrl;
          const partner = partnerPhotos[index]?.dataUrl;
          const ready = Boolean(mine && partner);

          return (
            <article className="capture-review-card" key={index}>
              <div className="capture-review-card-top">
                <span>#{index + 1}</span>
                <span className={ready ? 'capture-review-status ready' : 'capture-review-status'}>
                  {ready ? <Check size={13} /> : null}
                  {ready ? t('review.ready') : t('review.missing')}
                </span>
              </div>

              <div className="capture-review-pair">
                <figure>
                  {mine ? <img src={mine} alt={`${t('review.myPhoto')} ${index + 1}`} /> : <div />}
                  <figcaption>{t('review.myPhoto')}</figcaption>
                </figure>
                <figure>
                  {partner ? <img src={partner} alt={`${t('review.partnerPhoto')} ${index + 1}`} /> : <div />}
                  <figcaption>{t('review.partnerPhoto')}</figcaption>
                </figure>
              </div>

              <button className="capture-review-retake" onClick={() => onRetake(index)}>
                <RotateCcw size={15} />
                {t('review.retake')}
              </button>
            </article>
          );
        })}
      </main>
    </div>
  );
}

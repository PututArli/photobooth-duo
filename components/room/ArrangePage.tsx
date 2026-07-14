import React, { useRef } from 'react';
import { CapturedPhoto, LayoutKey, LAYOUTS, RoomState } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';

interface ArrangePageProps {
  myPhotos: CapturedPhoto[];
  partnerPhotos: CapturedPhoto[];
  layoutKey: string;
  roomState: RoomState;
  updateState: (partial: Partial<RoomState>) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function ArrangePage({ myPhotos, partnerPhotos, layoutKey, roomState, updateState, onComplete, onBack }: ArrangePageProps) {
  const { t } = useTranslation();
  const layout = LAYOUTS[layoutKey as LayoutKey] || LAYOUTS.strip3;
  const count = layout.count;
  
  const selectedIndices = roomState.arrangeIndices || Array(count).fill(null);
  const activeSlot = roomState.arrangeActiveSlot || 0;
  
  const poolRef = useRef<HTMLDivElement>(null);

  const scrollPool = (dir: 'left' | 'right') => {
    if (poolRef.current) {
      const amount = 200;
      poolRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleSelectPhoto = (photoIndex: number) => {
    const next = [...selectedIndices];
    next[activeSlot] = photoIndex;
    
    // Auto-advance to next empty slot
    let nextSlot = activeSlot;
    const nextEmpty = next.findIndex((val, i) => i !== activeSlot && (i > activeSlot ? val === null : false));
    if (nextEmpty !== -1) {
      nextSlot = nextEmpty;
    } else {
      const firstEmpty = next.indexOf(null);
      if (firstEmpty !== -1 && firstEmpty !== activeSlot) {
        nextSlot = firstEmpty;
      } else {
        // Find next empty wrapping around
        const nextIdx = next.findIndex((val, i) => val === null && i !== activeSlot);
        if (nextIdx !== -1) nextSlot = nextIdx;
      }
    }

    updateState({ arrangeIndices: next, arrangeActiveSlot: nextSlot });
  };

  const handleSlotClick = (slotIndex: number) => {
    updateState({ arrangeActiveSlot: slotIndex });
  };

  const isComplete = selectedIndices.every((val: number | null) => val !== null);

  const handleSubmit = () => {
    if (isComplete) {
      onComplete();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      padding: '40px 20px',
    }}>
      <style>{`
        .arrange-container {
          display: flex;
          gap: 40px;
          width: 100%;
          max-width: 1000px;
          justify-content: center;
        }
        .arrange-pool {
          flex: 1 1 400px;
          max-width: 480px;
        }
        .arrange-preview {
          flex: 1 1 360px;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pool-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pool-scroll-nav {
          display: none;
        }
        .arrange-header {
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .arrange-header {
            grid-template-columns: 1fr;
            justify-items: stretch;
            gap: 12px;
          }
          .arrange-header h2 {
            order: -1;
          }
          .arrange-header button {
            width: 100%;
            justify-content: center;
          }
          .arrange-container {
            flex-direction: column-reverse;
            gap: 24px;
          }
          .arrange-pool {
            max-width: 100%;
            width: 100%;
          }
          .pool-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 10px;
            padding: 4px 2px 8px;
          }
          .pool-grid::-webkit-scrollbar {
            display: none;
          }
          .pool-grid > button {
            flex: 0 0 160px;
            scroll-snap-align: start;
          }
          .pool-scroll-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 8px;
          }
          .arrange-preview {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
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
          {t('arrange.title')}
        </span>
        <div className="guide-header-action" style={{ justifySelf: 'end' }}>
          <SectionGuide
            title={t('guide.arrange.title')}
            steps={[
              t('guide.arrange.step1'),
              t('guide.arrange.step2'),
              t('guide.arrange.step3'),
              t('guide.arrange.step4'),
            ]}
          />
        </div>
      </div>

      <div className="arrange-container">
        {/* Left: Pool of captured photos */}
        <div className="arrange-pool">
          <div className="pool-grid" ref={poolRef}>
            {myPhotos.map((p, i) => {
              const partnerP = partnerPhotos[i];
              const isUsed = selectedIndices.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleSelectPhoto(i)}
                  style={{
                    padding: 0, border: 'none', background: 'none', cursor: 'pointer',
                    borderRadius: 8, overflow: 'hidden', position: 'relative',
                    aspectRatio: '8/3', borderStyle: 'solid', borderWidth: 2,
                    borderColor: isUsed ? 'var(--accent)' : 'transparent',
                    opacity: isUsed ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                >
                  {p?.dataUrl || partnerP?.dataUrl ? (
                    <div style={{ display: 'flex', width: '100%', height: '100%', gap: 2 }}>
                      <img src={p?.dataUrl} alt={`${t('arrange.myTake')} ${i + 1}`} style={{ flex: 1, objectFit: 'cover', minWidth: 0 }} />
                      {partnerP?.dataUrl ? (
                        <img src={partnerP.dataUrl} alt={`${t('arrange.partnerTake')} ${i + 1}`} style={{ flex: 1, objectFit: 'cover', minWidth: 0 }} />
                      ) : (
                        <div style={{ flex: 1, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--accent-soft)' }} />
                  )}
                  {isUsed && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,107,152,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 32, height: 32, background: 'var(--accent)', color: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile-only scroll nav — sits below the grid in normal flow */}
          <div className="pool-scroll-nav">
            <button
              type="button"
              onClick={() => scrollPool('left')}
              aria-label="Scroll left"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 14px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              prev
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              swipe or tap arrows
            </span>
            <button
              type="button"
              onClick={() => scrollPool('right')}
              aria-label="Scroll right"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 14px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        {/* Right: Layout slots */}
        <div className="arrange-preview">
          <div style={{
            background: 'var(--surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: `repeat(${layout.cols}, 1fr)`, gap: 12,
            width: '100%',
          }}>
            {Array.from({ length: count }).map((_, i) => {
              const photoIdx = selectedIndices[i];
              const p = photoIdx !== null ? myPhotos[photoIdx] : null;
              const partnerP = photoIdx !== null ? partnerPhotos[photoIdx] : null;
              const isActive = activeSlot === i;

              return (
                <button
                  key={i}
                  onClick={() => handleSlotClick(i)}
                  style={{
                    aspectRatio: '8/3', borderRadius: 8, overflow: 'hidden',
                    background: 'var(--accent-soft)', cursor: 'pointer',
                    border: `2px ${isActive ? 'solid' : 'dashed'} ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    padding: 0, position: 'relative', transition: 'all 0.2s',
                  }}
                >
                  {p?.dataUrl || partnerP?.dataUrl ? (
                    <div style={{ display: 'flex', width: '100%', height: '100%', gap: 2 }}>
                      <img src={p?.dataUrl} alt={`${t('arrange.mySlot')} ${i + 1}`} style={{ flex: 1, objectFit: 'cover', minWidth: 0 }} />
                      {partnerP?.dataUrl ? (
                        <img src={partnerP.dataUrl} alt={`${t('arrange.partnerSlot')} ${i + 1}`} style={{ flex: 1, objectFit: 'cover', minWidth: 0 }} />
                      ) : (
                        <div style={{ flex: 1, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--accent)' : 'var(--text-muted)', fontSize: 24 }}>
                      +
                    </div>
                  )}
                  {isActive && !p && (
                    <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent)', borderRadius: 8, pointerEvents: 'none', animation: 'pulse 1.5s infinite' }} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            style={{
              marginTop: 32, padding: '16px 40px', fontSize: 16, fontWeight: 700,
              borderRadius: 100, border: 'none', cursor: isComplete ? 'pointer' : 'not-allowed',
              background: isComplete ? 'var(--text)' : 'var(--surface3)',
              color: isComplete ? 'var(--bg)' : 'var(--text-muted)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {t('arrange.next')} <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

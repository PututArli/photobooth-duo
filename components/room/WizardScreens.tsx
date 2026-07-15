import React, { useRef } from 'react';
import { LAYOUTS, LayoutKey, FRAME_BG_PRESETS, RoomState, THEME_PRESETS, BORDER_PRESETS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';

const MiniLayout = ({ type }: { type: LayoutKey }) => {
  if (type.startsWith('strip')) {
    const count = parseInt(type.replace('strip', ''));
    return (
      <div style={{
        width: 38, height: 120, background: '#fff', borderRadius: 2, padding: 3, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ flex: 1, background: 'var(--surface-light, #e2e8f0)', borderRadius: 1 }} />
        ))}
      </div>
    );
  }
  if (type.startsWith('horizontal')) {
    const count = parseInt(type.replace('horizontal', ''));
    return (
      <div style={{
        width: 120, height: 44, background: '#fff', borderRadius: 2, padding: 3, display: 'flex', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ flex: 1, background: 'var(--surface-light, #e2e8f0)', borderRadius: 1 }} />
        ))}
      </div>
    );
  }
  if (type === 'grid2x2') {
    return (
      <div style={{
        width: 80, height: 56, background: '#fff', borderRadius: 2, padding: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface-light, #e2e8f0)', borderRadius: 1 }} />
        ))}
      </div>
    );
  }
  if (type === 'grid3x2') {
    return (
      <div style={{
        width: 80, height: 80, background: '#fff', borderRadius: 2, padding: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface-light, #e2e8f0)', borderRadius: 1 }} />
        ))}
      </div>
    );
  }
  if (type === 'single') {
    return (
      <div style={{
        width: 80, height: 64, background: '#fff', borderRadius: 2, padding: 3, display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ flex: 1, background: 'var(--surface-light, #e2e8f0)', borderRadius: 1 }} />
      </div>
    );
  }
  return null;
};

interface WizardProps {
  roomState: RoomState;
  updateState: (partial: Partial<RoomState>) => void;
  nextStep: () => void;
  prevStep?: () => void;
  role: 'host' | 'guest';
}

export function SetupLayout({ roomState, updateState, nextStep, prevStep, role }: WizardProps) {
  const { t } = useTranslation();
  return (
    <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="wizard-container" style={{ textAlign: 'center', width: '100%', maxWidth: 700, zIndex: 1 }}>
        <div className="guide-title-row" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            {t('wizard.choose_layout')}
          </h2>
          <SectionGuide
            title={t('guide.layout.title')}
            steps={[
              t('guide.layout.step1'),
              t('guide.layout.step2'),
              t('guide.layout.step3'),
              t('guide.layout.step4'),
            ]}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {(Object.keys(LAYOUTS) as LayoutKey[]).map((key) => {
            const isActive = roomState.layout === key;
            return (
              <div
                key={key}
                onClick={() => updateState({ layout: key })}
                style={{
                  width: 160,
                  height: 220,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 16,
                  boxShadow: isActive ? 'var(--accent-glow)' : 'var(--shadow-sm)',
                  border: isActive ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 1,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MiniLayout type={key as LayoutKey} />
                </div>
                <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {key === 'strip2' ? t('layout.2_pics') : key === 'strip3' ? t('layout.3_pics') : key === 'strip4' ? t('layout.4_pics') : key === 'strip5' ? t('layout.5_pics') : key === 'grid2x2' ? t('layout.2x2_grid') : key === 'grid3x2' ? t('layout.3x2_grid') : key === 'horizontal3' ? 'Horizontal 3' : key === 'horizontal4' ? 'Horizontal 4' : t('layout.single')}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {prevStep && (
            <button 
              onClick={prevStep}
              style={{ padding: '14px 24px', borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', fontWeight: 600, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
            >
              ← {t('wizard.back')}
            </button>
          )}
          <button 
            onClick={nextStep}
            style={{ padding: '14px 32px', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 100, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--accent-glow)' }}
          >
            {t('wizard.next')} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SetupTheme({ roomState, updateState, nextStep, prevStep, role }: WizardProps) {
  const { t } = useTranslation();
  const stripRef = useRef<HTMLDivElement>(null);

  const scrollStrip = (dir: 'left' | 'right') => {
    if (stripRef.current) {
      const amount = 200;
      stripRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const applyThemePreset = (preset: (typeof THEME_PRESETS)[number]) => {
    updateState({
      frameBg: preset.frameBg,
      photoBorder: preset.photoBorder,
      customText: preset.customText,
      showDate: preset.showDate,
      videoFilter: preset.videoFilter,
    });
  };

  return (
    <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="wizard-container" style={{ textAlign: 'center', width: '100%', maxWidth: 700, zIndex: 1 }}>
        <div className="guide-title-row" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            {t('wizard.choose_theme')}
          </h2>
          <SectionGuide
            title={t('guide.theme.title')}
            steps={[
              t('guide.theme.step1'),
              t('guide.theme.step2'),
              t('guide.theme.step3'),
              t('guide.theme.step4'),
            ]}
          />
        </div>

        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t('wizard.ready_templates')}</h3>
          <div className="theme-preset-grid">
            {THEME_PRESETS.map((preset) => {
              const isActive = roomState.frameBg.type === preset.frameBg.type
                && roomState.frameBg.val === preset.frameBg.val
                && roomState.photoBorder === preset.photoBorder
                && roomState.customText === preset.customText;
              const previewBackground = preset.frameBg.type === 'gradient'
                ? `linear-gradient(135deg, ${preset.frameBg.val.split(',').join(', ')})`
                : preset.frameBg.val;

              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => applyThemePreset(preset)}
                  className={isActive ? 'theme-preset-card active' : 'theme-preset-card'}
                >
                  <span className="theme-preset-preview" style={{ background: previewBackground }}>
                    <span />
                    <span />
                  </span>
                  <span className="theme-preset-copy">
                    <strong>{preset.name}</strong>
                    <small>{preset.description}</small>
                  </span>
                  <span className="theme-preset-action">{t('wizard.use_template')}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div style={{ marginBottom: 40, position: 'relative' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t('wizard.pick_theme')}</h3>
          
          <button 
            type="button" 
            onClick={() => scrollStrip('left')}
            style={{ position: 'absolute', left: 0, top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <div 
            ref={stripRef}
            style={{ 
              display: 'flex', gap: 16, overflowX: 'auto', padding: '16px 20px', 
              margin: '0 auto', maxWidth: '100%', scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', position: 'relative'
            }}
            className="hide-scrollbar"
          >
            {FRAME_BG_PRESETS.map((preset, i) => {
              const isActive = roomState.frameBg.val === preset.val && roomState.frameBg.type === preset.type;
              return (
                <div
                  key={i}
                  onClick={() => updateState({ frameBg: { type: preset.type, val: preset.val } })}
                  style={{
                    flexShrink: 0,
                    width: 140,
                    scrollSnapAlign: 'center',
                    background: 'var(--surface)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    border: isActive ? '2px solid #ff7e5f' : '1px solid var(--border)',
                    boxShadow: isActive ? '0 4px 20px rgba(255, 126, 95, 0.2)' : 'none',
                    cursor: 'pointer',
                    opacity: 1,
                    transition: 'all 0.2s',
                    transform: isActive ? 'scale(1.02)' : 'none'
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '1/3',
                    ...preset.style as any,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ height: 12, background: 'rgba(0,0,0,0.4)', marginTop: 'auto' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {t(('theme.bg.' + preset.id) as any)}
                  </span>
                </div>
              );
            })} 
          </div>

          <button 
            type="button" 
            onClick={() => scrollStrip('right')}
            style={{ position: 'absolute', right: 0, top: '55%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t('wizard.custom_text')}</h3>
          <input
            type="text"
            style={{ width: '100%', maxWidth: 300, background: 'transparent', border: 'none', borderBottom: '2px solid var(--text)', borderRadius: 0, padding: '8px 0', fontSize: '18px', textAlign: 'center', outline: 'none', color: 'var(--text)', fontWeight: 600 }}
            placeholder={t('wizard.placeholder_text')}
            maxLength={35}
            value={roomState.customText}
            onChange={e => updateState({ customText: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button 
            onClick={prevStep}
            style={{ padding: '14px 24px', borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', fontWeight: 600, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
          >
            ← {t('wizard.back')}
          </button>
          <button 
            onClick={nextStep}
            style={{ padding: '14px 24px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'var(--text)', color: 'var(--bg)', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--accent-glow)' }}
          >
            {t('video.startCamera')} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

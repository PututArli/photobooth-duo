import React from 'react';
import { LAYOUTS, LayoutKey, FRAME_BG_PRESETS, RoomState } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

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
        <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 }}>
          {t('wizard.choose_layout')}
        </h2>
        
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
                  transition: 'all 0.2s',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {key === 'strip2' && (
                    <svg width="32" height="120" viewBox="0 0 32 120" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="28" height="116" />
                      <line x1="2" y1="60" x2="30" y2="60" />
                    </svg>
                  )}
                  {key === 'strip3' && (
                    <svg width="32" height="120" viewBox="0 0 32 120" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="28" height="116" />
                      <line x1="2" y1="40" x2="30" y2="40" />
                      <line x1="2" y1="80" x2="30" y2="80" />
                    </svg>
                  )}
                  {key === 'strip4' && (
                    <svg width="32" height="120" viewBox="0 0 32 120" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="28" height="116" />
                      <line x1="2" y1="31" x2="30" y2="31" />
                      <line x1="2" y1="60" x2="30" y2="60" />
                      <line x1="2" y1="89" x2="30" y2="89" />
                    </svg>
                  )}
                  {key === 'strip5' && (
                    <svg width="32" height="120" viewBox="0 0 32 120" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="28" height="116" />
                      <line x1="2" y1="25" x2="30" y2="25" />
                      <line x1="2" y1="49" x2="30" y2="49" />
                      <line x1="2" y1="73" x2="30" y2="73" />
                      <line x1="2" y1="97" x2="30" y2="97" />
                    </svg>
                  )}
                  {key === 'grid2x2' && (
                    <svg width="80" height="54" viewBox="0 0 80 54" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="76" height="50" />
                      <line x1="40" y1="2" x2="40" y2="52" />
                      <line x1="2" y1="27" x2="78" y2="27" />
                    </svg>
                  )}
                  {key === 'grid3x2' && (
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="76" height="76" />
                      <line x1="40" y1="2" x2="40" y2="78" />
                      <line x1="2" y1="28" x2="78" y2="28" />
                      <line x1="2" y1="54" x2="78" y2="54" />
                    </svg>
                  )}
                  {key === 'single' && (
                    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="var(--text)" strokeWidth="4">
                      <rect x="2" y="2" width="76" height="56" />
                    </svg>
                  )}
                </div>
                <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {key === 'strip2' ? t('layout.2_pics') : key === 'strip3' ? t('layout.3_pics') : key === 'strip4' ? t('layout.4_pics') : key === 'strip5' ? t('layout.5_pics') : key === 'grid2x2' ? t('layout.2x2_grid') : key === 'grid3x2' ? t('layout.3x2_grid') : t('layout.single')}
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
  return (
    <div className="landing-page" style={{ justifyContent: 'center', position: 'relative' }}>
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="wizard-container" style={{ textAlign: 'center', width: '100%', maxWidth: 700, zIndex: 1 }}>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 }}>
          {t('wizard.choose_theme')}
        </h2>
        
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t('wizard.pick_theme')}</h3>
          <div style={{ 
            display: 'flex', gap: 16, overflowX: 'auto', padding: '16px 20px', 
            margin: '0 auto', maxWidth: '100%', scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none'
          }}>
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
                    {preset.id}
                  </span>
                </div>
              );
            })}
          </div>
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
            start camera <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

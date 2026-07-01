import React from 'react';
import { LAYOUTS, LayoutKey, FRAME_BG_PRESETS, BORDER_PRESETS, RoomState } from '@/lib/types';

interface WizardProps {
  roomState: RoomState;
  updateState: (partial: Partial<RoomState>) => void;
  nextStep: () => void;
  prevStep?: () => void;
  role: 'host' | 'guest';
}

export function SetupLayout({ roomState, updateState, nextStep, role }: WizardProps) {
  return (
    <div className="wizard-screen">
      <div className="wizard-container">
        <h2 className="wizard-title">Layar 2: Pilih Format Foto</h2>
        <p className="wizard-subtitle">
          {role === 'host' ? 'Pilih tata letak kolase foto Anda.' : 'Menunggu Host memilih layout...'}
        </p>

        <div className="wizard-grid layout-grid">
          {(Object.keys(LAYOUTS) as LayoutKey[]).map((key) => (
            <button
              key={key}
              className={`wizard-card ${roomState.layout === key ? 'active' : ''}`}
              onClick={() => role === 'host' && updateState({ layout: key })}
              disabled={role === 'guest'}
            >
              <div className="layout-icon">
                {key === 'strip3' && '▬▬▬'}
                {key === 'strip4' && '▬▬▬▬'}
                {key === 'grid2x2' && '⊞'}
                {key === 'single' && '▭'}
              </div>
              <span className="layout-name">
                {key === 'strip3' && 'Strip 3'}
                {key === 'strip4' && 'Strip 4'}
                {key === 'grid2x2' && 'Grid 2×2'}
                {key === 'single' && 'Single'}
              </span>
            </button>
          ))}
        </div>

        {role === 'host' && (
          <div className="wizard-actions">
            <button className="btn-primary wizard-next-btn" onClick={nextStep}>
              Selanjutnya ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SetupTheme({ roomState, updateState, nextStep, prevStep, role }: WizardProps) {
  return (
    <div className="wizard-screen">
      <div className="wizard-container">
        <h2 className="wizard-title">Layar 3: Pilih Tema & Teks</h2>
        <p className="wizard-subtitle">
          {role === 'host' ? 'Sesuaikan bingkai dan tulisan di hasil akhir.' : 'Menunggu Host memilih tema...'}
        </p>

        <div className="wizard-section">
          <h3 className="wizard-section-title">Warna Latar</h3>
          <div className="swatch-row justify-center">
            {FRAME_BG_PRESETS.map((preset, i) => (
              <button
                key={i}
                className={`swatch ${roomState.frameBg.val === preset.val && roomState.frameBg.type === preset.type ? 'active' : ''}`}
                style={preset.style}
                onClick={() => role === 'host' && updateState({ frameBg: { type: preset.type, val: preset.val } })}
                title={preset.val}
                disabled={role === 'guest'}
              />
            ))}
            {[
              { type: 'pattern' as const, val: 'polka', style: { background: 'radial-gradient(#ff007f 15%, transparent 16%) 0 0, #fff', backgroundSize: '16px 16px' } },
              { type: 'pattern' as const, val: 'grid', style: { background: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '8px 8px', backgroundColor: '#fff' } },
              { type: 'pattern' as const, val: 'check', style: { background: 'repeating-conic-gradient(#fff 0% 25%, #f1f1f1 0% 50%)', backgroundSize: '16px 16px' } },
            ].map((preset, i) => (
              <button
                key={`p-${i}`}
                className={`swatch ${roomState.frameBg.val === preset.val ? 'active' : ''}`}
                style={preset.style as React.CSSProperties}
                onClick={() => role === 'host' && updateState({ frameBg: { type: preset.type, val: preset.val } })}
                title={preset.val}
                disabled={role === 'guest'}
              />
            ))}
          </div>
        </div>

        <div className="wizard-section">
          <h3 className="wizard-section-title">Teks Custom</h3>
          <input
            type="text"
            className="text-input"
            style={{ maxWidth: 400, margin: '0 auto', display: 'block', fontSize: 16, padding: '12px 16px' }}
            placeholder="Tulis kenanganmu..."
            maxLength={35}
            value={roomState.customText}
            onChange={e => updateState({ customText: e.target.value })}
            disabled={role === 'guest'}
          />
        </div>

        {role === 'host' && (
          <div className="wizard-actions">
            <button className="btn-secondary wizard-back-btn" onClick={prevStep}>
              ⬅ Kembali
            </button>
            <button className="btn-primary wizard-next-btn" onClick={nextStep}>
              Siap Memotret 📸
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

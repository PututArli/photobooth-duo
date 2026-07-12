'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import SectionGuide from '@/components/SectionGuide';

const tailscaleDownloads = [
  { label: 'Windows', href: 'https://tailscale.com/download/windows' },
  { label: 'macOS', href: 'https://tailscale.com/download/mac' },
  { label: 'iPhone / iPad', href: 'https://tailscale.com/download/ios' },
  { label: 'Android', href: 'https://tailscale.com/download/android' },
  { label: 'Linux', href: 'https://tailscale.com/download/linux' },
];

export default function HomePage() {
  const router = useRouter();
  const { lang, setLang, t } = useTranslation();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [recentRoom, setRecentRoom] = useState<string | null>(null);
  
  // promo code (hidden easter egg)
  const [titleClicks, setTitleClicks] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('recent_photobooth_room');
    if (saved) setRecentRoom(saved);
  }, []);

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    router.prefetch('/room/loading');
    try {
      const res = await fetch('/api/rooms', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode })
      });
      const data = await res.json();
      if (data.roomCode) {
        localStorage.setItem('recent_photobooth_room', data.roomCode);
        router.push(`/room/${data.roomCode}`);
      } else {
        setError(t('lobby.error.create'));
        setLoading(false);
      }
    } catch {
      setError(t('lobby.error.connection'));
      setLoading(false);
    }
  }

  async function handleJoin(codeStr?: string) {
    if (loading) return;
    const code = (codeStr || joinCode).trim().toUpperCase();
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        localStorage.setItem('recent_photobooth_room', code);
        router.push(`/room/${code}`);
      } else {
        setError(t('lobby.error.join'));
        setLoading(false);
      }
    } catch {
      setError(t('lobby.error.connection'));
      setLoading(false);
    }
  }

  return (
    <main className="landing-page">
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>


      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SectionGuide
          title={t('guide.lobby.title')}
          steps={[
            t('guide.lobby.step1'),
            t('guide.lobby.step2'),
            t('guide.lobby.step3'),
            t('guide.lobby.step4'),
          ]}
        >
          <div className="guide-extra">
            <div style={{ marginBottom: 24, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>{t('guide.lobby.intro1')}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('guide.lobby.intro2')}</p>
            </div>
            <h3>{t('tutor.downloadTitle')}</h3>
            <p>{t('tutor.downloadDesc')}</p>
            <div className="guide-link-grid">
              {tailscaleDownloads.map(item => (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="guide-subsection">
              <h3>{t('guide.tailscale.title')}</h3>
              <p>{t('guide.tailscale.intro')}</p>
              <ol className="guide-list guide-list-compact">
                <li>{t('guide.tailscale.step1')}</li>
                <li>{t('guide.tailscale.step2')}</li>
                <li>{t('guide.tailscale.step3')}</li>
                <li>{t('guide.tailscale.step4')}</li>
                <li>{t('guide.tailscale.step5')}</li>
                <li>{t('guide.tailscale.step6')}</li>
              </ol>
            </div>
          </div>
        </SectionGuide>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 100, backdropFilter: 'blur(10px)' }}>
          <button onClick={() => setLang('id')} style={{ padding: '4px 12px', border: 'none', borderRadius: 100, background: lang === 'id' ? 'var(--text)' : 'transparent', color: lang === 'id' ? 'var(--bg)' : 'var(--text)', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>ID</button>
          <button onClick={() => setLang('en')} style={{ padding: '4px 12px', border: 'none', borderRadius: 100, background: lang === 'en' ? 'var(--text)' : 'transparent', color: lang === 'en' ? 'var(--bg)' : 'var(--text)', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>EN</button>
        </div>
      </div>

      <div className="landing-hero">
        <div className="title-area">
          <h1 style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }} onClick={() => setTitleClicks(p => p + 1)}>
            <span style={{ background: 'linear-gradient(to right, #ff7e5f, #feb47b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.1em' }}>{t('lobby.title')}</span>
          </h1>
          {titleClicks >= 5 && (
            <input 
              type="text" 
              placeholder="Promo Code" 
              value={promoCode} 
              onChange={e => setPromoCode(e.target.value)} 
              style={{ marginTop: 8, padding: '4px 12px', borderRadius: 100, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.1)', color: 'var(--text)', textAlign: 'center', fontSize: 12 }}
            />
          )}
        </div>
      </div>

      <div className="landing-content">
        <div className="action-cards">
          <div
            className="action-card"
            onClick={!loading ? handleCreate : undefined}
            style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}
          >
            <h2>{loading ? t('lobby.creating') : t('lobby.create')}</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{t('lobby.createDesc')} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg></p>
          </div>

          <div className="action-card" onClick={() => setShowJoinInput(true)}>
            {!showJoinInput ? (
              <>
                <h2>{t('lobby.join')}</h2>
                <p>{t('lobby.joinDesc')}</p>
              </>
            ) : (
              <div className="form-group" style={{ margin: 0 }} onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--text)', borderRadius: 0, padding: '8px 0', fontSize: '24px', textAlign: 'left', letterSpacing: '4px', outline: 'none', color: 'var(--text)', fontWeight: 800 }}
                  placeholder={t('lobby.joinInputPlaceholder')}
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <button onClick={() => handleJoin()} style={{ textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {loading ? t('lobby.joiningBtn') : t('lobby.joinBtn')}
                    {!loading && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowJoinInput(false); }} 
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '4px 8px', borderRadius: 100, cursor: 'pointer' }}
                  >
                    {t('lobby.cancelBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p style={{ color: '#fa5252', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{error}</p>}

        {recentRoom && (
          <p className="start-session-link" onClick={() => handleJoin(recentRoom)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {t('lobby.rejoin')} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
          </p>
        )}


        <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300, margin: '32px auto 0' }}>
          {t('lobby.recommendation')}
        </p>
      </div>

      <footer style={{ 
        borderTop: '1px solid rgba(255,255,255,0.06)', 
        padding: '32px 24px 24px', 
        marginTop: 48,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 800, 
            background: 'linear-gradient(to right, #ff7e5f, #feb47b)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>BoothKita</span>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6 }}>
          {t('footer.privacy')}
        </p>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <a href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >{t('footer.privacyLink')}</a>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>
          <a href="/terms" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >{t('footer.termsLink')}</a>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>
          <a href="mailto:rafaelpututarli@gmail.com" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >{t('footer.contact')}</a>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>
          <a href="https://github.com/PututArli/boothkita" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          © {new Date().getFullYear()} BoothKita. {t('footer.copyright')}
        </p>
      </footer>
    </main>
  );
}

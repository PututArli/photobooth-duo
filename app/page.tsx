'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [recentRoom, setRecentRoom] = useState<string | null>(null);
  const [usePremium, setUsePremium] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recent_photobooth_room');
    if (saved) setRecentRoom(saved);
    const premiumSaved = localStorage.getItem('use_premium_turn');
    if (premiumSaved === 'true') setUsePremium(true);
  }, []);

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    // Optimistic: navigate immediately without waiting for server
    router.prefetch('/room/loading');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const data = await res.json();
      if (data.roomCode) {
        localStorage.setItem('recent_photobooth_room', data.roomCode);
        router.push(`/room/${data.roomCode}`);
      } else {
        setError('Failed to create room.');
        setLoading(false);
      }
    } catch {
      setError('Connection error.');
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
        setError('Room not found or expired.');
        setLoading(false);
      }
    } catch {
      setError('Connection error.');
      setLoading(false);
    }
  }

  return (
    <main className="landing-page">
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>


      <div className="landing-hero">
        <div className="title-area">
          <h1 style={{ whiteSpace: 'nowrap' }}>
            <span style={{ background: 'linear-gradient(to right, #ff7e5f, #feb47b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '0.1em' }}>boothkita</span>
          </h1>
        </div>
      </div>

      <div className="landing-content">
        <div className="action-cards">
          <div
            className="action-card"
            onClick={!loading ? handleCreate : undefined}
            style={{ cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}
          >
            <h2>{loading ? '⏳ Creating...' : 'Create'}</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>a room <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg></p>
          </div>

          <div className="action-card" onClick={() => setShowJoinInput(true)}>
            {!showJoinInput ? (
              <>
                <h2>Join</h2>
                <p>with a code</p>
              </>
            ) : (
              <div className="form-group" style={{ margin: 0 }} onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--text)', borderRadius: 0, padding: '8px 0', fontSize: '24px', textAlign: 'left', letterSpacing: '4px', outline: 'none', color: 'var(--text)', fontWeight: 800 }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <button onClick={() => handleJoin()} style={{ textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {loading ? 'Joining...' : 'Join Room'}
                    {!loading && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowJoinInput(false); }} 
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '4px 8px', borderRadius: 100, cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p style={{ color: '#fa5252', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{error}</p>}

        {recentRoom && (
          <p className="start-session-link" onClick={() => handleJoin(recentRoom)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            rejoin previous session <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
          </p>
        )}

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => {
          const newVal = !usePremium;
          setUsePremium(newVal);
          localStorage.setItem('use_premium_turn', newVal ? 'true' : 'false');
        }}>
          <div style={{ width: 40, height: 24, background: usePremium ? '#ff7e5f' : 'var(--surface2)', borderRadius: 100, position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ position: 'absolute', top: 2, left: usePremium ? 18 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.3s' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Beda Jaringan / Seluler</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nyalakan jika tidak menggunakan jaringan WiFi yang sama.</span>
          </div>
        </div>

        <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300, opacity: 0.8 }}>
          Disarankan menggunakan PC/Laptop untuk pengalaman photobooth terbaik yaa.
        </p>
      </div>
    </main>
  );
}

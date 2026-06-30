'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const data = await res.json();
      if (data.roomCode) {
        router.push(`/room/${data.roomCode}`);
      } else {
        setError('Gagal membuat room. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Kode room harus 6 karakter.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        router.push(`/room/${code}`);
      } else {
        setError('Room tidak ditemukan atau sudah kadaluarsa.');
      }
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet.');
    } finally {
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

      <div className="landing-content">
        {/* Hero */}
        <div className="landing-hero">
          <Image
            src="/logo.png"
            alt="PhotoBooth Duo Logo"
            width={72}
            height={72}
            className="landing-logo"
            priority
          />
          <h1 className="landing-title">PhotoBooth Duo</h1>
          <p className="landing-subtitle">
            Foto berdua secara <strong style={{ color: 'var(--accent)' }}>online real-time</strong> 📸
            <br />
            Buat room, share link, dan nikmati momen bersama!
          </p>
        </div>

        {/* Feature chips */}
        <div className="landing-features">
          {[
            { icon: '🎥', label: 'Live Video' },
            { icon: '📸', label: 'Countdown Sinkron' },
            { icon: '🎨', label: 'Frame & Filter' },
            { icon: '💾', label: 'Unduh Hasil' },
          ].map(f => (
            <div className="feature-chip" key={f.label}>
              <span className="icon">{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="landing-card">
          {/* Tabs */}
          <div className="card-tabs" role="tablist">
            <button
              id="tab-create"
              role="tab"
              aria-selected={tab === 'create'}
              className={`card-tab ${tab === 'create' ? 'active' : ''}`}
              onClick={() => { setTab('create'); setError(''); }}
            >
              ✨ Buat Room Baru
            </button>
            <button
              id="tab-join"
              role="tab"
              aria-selected={tab === 'join'}
              className={`card-tab ${tab === 'join' ? 'active' : ''}`}
              onClick={() => { setTab('join'); setError(''); }}
            >
              🔗 Gabung Room
            </button>
          </div>

          {tab === 'create' && (
            <div id="panel-create" role="tabpanel">
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Buat room baru dan dapatkan kode unik. Share kode tersebut ke pasangan/teman kamu untuk mulai foto bersama! 🎉
              </p>
              <button
                id="btn-create-room"
                className="btn-primary"
                onClick={handleCreate}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Membuat room...
                  </>
                ) : (
                  '✨ Buat Room Sekarang'
                )}
              </button>
            </div>
          )}

          {tab === 'join' && (
            <div id="panel-join" role="tabpanel">
              <div className="form-group">
                <label className="form-label" htmlFor="input-room-code">
                  Masukkan Kode Room
                </label>
                <input
                  id="input-room-code"
                  type="text"
                  className="form-input"
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={joinCode}
                  onChange={e => {
                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                id="btn-join-room"
                className="btn-primary"
                onClick={handleJoin}
                disabled={loading || joinCode.length < 6}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Menghubungkan...
                  </>
                ) : (
                  '🔗 Gabung Sekarang'
                )}
              </button>
            </div>
          )}

          {error && (
            <p
              role="alert"
              style={{
                marginTop: 12, color: 'var(--danger)', fontSize: 13, textAlign: 'center',
                padding: '8px 12px', background: 'rgba(248,113,113,0.1)',
                borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* How it works */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          <p>💡 Room aktif selama <strong style={{ color: 'var(--text)' }}>30 menit</strong> · Tanpa perlu login · Gratis!</p>
        </div>
      </div>
    </main>
  );
}

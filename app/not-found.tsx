'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <div className="waiting-icon">😔</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Room Tidak Ditemukan</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Room ini mungkin sudah kadaluarsa (30 menit), tidak ada, atau kode yang kamu masukkan salah.
        </p>
        <Link href="/" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

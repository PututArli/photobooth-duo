'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function PrivacyContent() {
  const { lang } = useTranslation();

  const isEN = lang === 'en';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body, sans-serif)', padding: '0 0 80px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, background: 'rgba(13,13,18,0.9)', zIndex: 10 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{isEN ? 'Back' : 'Kembali'}</span>
        </Link>
        <span style={{ fontSize: 15, fontWeight: 700, background: 'linear-gradient(to right, #ff7e5f, #feb47b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BoothKita</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{isEN ? 'Privacy Policy' : 'Kebijakan Privasi'}</h1>
        <p style={{ color: 'var(--text-muted, #8b8b9a)', fontSize: 14, marginBottom: 48 }}>
          {isEN ? 'Last updated: July 1, 2026' : 'Terakhir diperbarui: 1 Juli 2026'}
        </p>

        {isEN ? (
          <>
            <Section title="1. Introduction">
              <p>Welcome to <strong>BoothKita</strong>. We deeply respect your privacy and are committed to protecting it. This policy explains what information we collect (or do not collect) when you use BoothKita&apos;s services.</p>
            </Section>

            <Section title="2. Data We DO NOT Collect">
              <p>BoothKita is designed with <strong>privacy-by-design</strong> principles. We strictly <strong>DO NOT</strong> collect or store:</p>
              <ul>
                <li><strong>Biometric Data:</strong> Faces, fingerprints, irises, or any biometric data are <em>never</em> analyzed, stored, or sent to our servers.</li>
                <li><strong>Your Photos & Videos:</strong> All camera streams and captured photos during the session are sent directly between the two devices without going through our servers. This data <em>never passes through</em> or is stored on our servers.</li>
                <li><strong>Personal Data:</strong> We do not ask for, store, or process names, emails, phone numbers, or any identity. You do not need to register an account.</li>
                <li><strong>Session Recordings:</strong> We do not record your conversations or activities during the session.</li>
              </ul>
            </Section>

            <Section title="3. Data We Store Temporarily">
              <p>To run the service, we store the following minimal data in our database (<strong>Supabase</strong>):</p>
              <ul>
                <li><strong>Room Code:</strong> A random unique code (6 characters) generated when you create a session. This code is <em>not linked to any identity</em>.</li>
                <li><strong>Expiration Time:</strong> The timestamp when the room is considered inactive.</li>
              </ul>
              <p>This data is <strong>automatically deleted</strong> after the session ends or after a few minutes of inactivity. We never sell or share this data with third parties.</p>
            </Section>

            <Section title="4. Camera & Microphone Permissions">
              <p>BoothKita requires camera and microphone permissions from your browser to run the photo session feature. This permission:</p>
              <ul>
                <li>Is only active while you are on the photo session page.</li>
                <li>Is fully managed by your browser (Chrome, Safari, Firefox, etc).</li>
                <li>Can be revoked at any time through your browser settings.</li>
                <li>Is never used for facial recognition or any biometric analysis.</li>
              </ul>
            </Section>

            <Section title="5. Third Party Services">
              <p>BoothKita uses the following third-party services to operate:</p>
              <ul>
                <li><strong>Supabase</strong> (Database & Realtime): Stores temporary room data. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Supabase Privacy Policy →</a></li>
                <li><strong>Vercel</strong> (Hosting): Hosts this web application. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Vercel Privacy Policy →</a></li>
                <li>
                  <strong>Tailscale</strong> (VPN / Peer-to-Peer Network): <strong>Required</strong> for users on different internet networks (e.g. mobile data & WiFi). Tailscale creates an encrypted virtual private network between two devices so that the WebRTC video connection can work reliably across different networks.
                  <br /><br />
                  <strong>Important about Tailscale &amp; Privacy:</strong>
                  <ul style={{ marginTop: 8 }}>
                    <li>Tailscale is a <strong>separate, independent app</strong> developed by Tailscale Inc. and governed by their own <a href="https://tailscale.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Privacy Policy →</a></li>
                    <li>When using Tailscale, both users must log in to the <strong>same Tailscale account</strong>. This is managed entirely by you through Tailscale&apos;s own app — BoothKita has no access to your Tailscale account credentials or data.</li>
                    <li>Tailscale may log connection metadata (IP addresses, timestamps) according to their own policy. BoothKita does not receive this data.</li>
                    <li>Using Tailscale is <strong>optional</strong> for users on the same WiFi network. It is only needed when video fails to connect across different networks.</li>
                  </ul>
                </li>
              </ul>
            </Section>

            <Section title="6. Security">
              <p>Video communication between two users is end-to-end encrypted using the industry-standard <strong>WebRTC (DTLS/SRTP)</strong> protocol. No intermediaries can access your video or audio stream content.</p>
            </Section>

            <Section title="7. Policy Changes">
              <p>We may update this policy from time to time. Changes will be reflected in the &quot;Last updated&quot; date at the top of this page.</p>
            </Section>

            <Section title="8. Contact Us">
              <p>If you have any questions about this privacy policy, contact us at:</p>
              <p><a href="mailto:rafaelpututarli@gmail.com" style={{ color: '#ff7e5f', textDecoration: 'none', fontWeight: 600 }}>rafaelpututarli@gmail.com</a></p>
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Pendahuluan">
              <p>Selamat datang di <strong>BoothKita</strong>. Kami sangat menghargai privasi kamu dan berkomitmen untuk melindunginya. Kebijakan ini menjelaskan informasi apa yang kami kumpulkan (atau tidak kami kumpulkan) saat kamu menggunakan layanan BoothKita.</p>
            </Section>

            <Section title="2. Data yang TIDAK Kami Kumpulkan">
              <p>BoothKita dirancang dengan prinsip <strong>privasi sejak awal (privacy-by-design)</strong>. Kami secara tegas <strong>TIDAK</strong> mengumpulkan atau menyimpan:</p>
              <ul>
                <li><strong>Data Biometrik:</strong> Wajah, sidik jari, iris mata, atau data biometrik apapun <em>tidak pernah</em> dianalisis, disimpan, atau dikirim ke server kami.</li>
                <li><strong>Foto & Video Kamu:</strong> Semua aliran video kamera dan foto yang diambil selama sesi dikirim langsung dari perangkatmu ke perangkat partnermu. Data ini <em>sama sekali tidak pernah melewati</em> atau tersimpan di server kami.</li>
                <li><strong>Data Pribadi:</strong> Kami tidak meminta, menyimpan, atau memproses nama, email, nomor telepon, atau identitas apapun. Kamu tidak perlu mendaftar akun.</li>
                <li><strong>Rekaman Sesi:</strong> Kami tidak merekam percakapan atau aktivitas kamu selama sesi.</li>
              </ul>
            </Section>

            <Section title="3. Data yang Kami Simpan Sementara">
              <p>Untuk menjalankan layanan, kami menyimpan data minimal berikut di database kami (<strong>Supabase</strong>):</p>
              <ul>
                <li><strong>Kode Room:</strong> Sebuah kode unik acak (6 karakter) yang dibuat saat kamu membuat sesi. Kode ini <em>tidak terhubung ke identitas apapun</em>.</li>
                <li><strong>Waktu Kedaluwarsa:</strong> Stempel waktu kapan room tersebut dianggap tidak aktif.</li>
              </ul>
              <p>Data ini <strong>dihapus otomatis</strong> setelah sesi berakhir atau setelah beberapa menit tidak ada aktivitas. Kami tidak pernah menjual atau berbagi data ini kepada pihak ketiga.</p>
            </Section>

            <Section title="4. Izin Kamera & Mikrofon">
              <p>BoothKita memerlukan izin akses kamera dan mikrofon dari browser kamu untuk menjalankan fungsi foto bersama. Izin ini:</p>
              <ul>
                <li>Hanya aktif selama kamu berada di halaman sesi foto.</li>
                <li>Dikelola sepenuhnya oleh browser kamu (Chrome, Safari, Firefox, dll).</li>
                <li>Dapat dicabut kapan saja melalui pengaturan browser kamu.</li>
                <li>Tidak pernah digunakan untuk pengenalan wajah atau analisis biometrik apapun.</li>
              </ul>
            </Section>

            <Section title="5. Layanan Pihak Ketiga">
              <p>BoothKita menggunakan layanan pihak ketiga berikut untuk beroperasi:</p>
              <ul>
                <li><strong>Supabase</strong> (Database & Realtime): Menyimpan data room sementara. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Kebijakan Privasi Supabase →</a></li>
                <li><strong>Vercel</strong> (Hosting): Menghosting aplikasi web ini. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Kebijakan Privasi Vercel →</a></li>
                <li>
                  <strong>Tailscale</strong> (VPN / Jaringan Peer-to-Peer): <strong>Diperlukan</strong> bagi pengguna yang berada di jaringan internet berbeda (misalnya data seluler & WiFi). Tailscale membuat jaringan virtual terenkripsi antara dua perangkat agar koneksi video WebRTC dapat berfungsi dengan baik lintas jaringan.
                  <br /><br />
                  <strong>Catatan penting tentang Tailscale &amp; Privasi:</strong>
                  <ul style={{ marginTop: 8 }}>
                    <li>Tailscale adalah <strong>aplikasi terpisah dan independen</strong> yang dikembangkan oleh Tailscale Inc. dan tunduk pada <a href="https://tailscale.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff7e5f' }}>Kebijakan Privasi mereka sendiri →</a></li>
                    <li>Saat menggunakan Tailscale, kedua pengguna harus login ke <strong>akun Tailscale yang sama</strong>. Ini dikelola sepenuhnya olehmu melalui aplikasi Tailscale — BoothKita tidak memiliki akses ke kredensial atau data akun Tailscale kamu.</li>
                    <li>Tailscale mungkin mencatat metadata koneksi (alamat IP, stempel waktu) sesuai kebijakan mereka sendiri. BoothKita tidak menerima data ini.</li>
                    <li>Penggunaan Tailscale bersifat <strong>opsional</strong> bagi pengguna dalam jaringan WiFi yang sama. Hanya diperlukan ketika video gagal terhubung lintas jaringan berbeda.</li>
                  </ul>
                </li>
              </ul>
            </Section>

            <Section title="6. Keamanan">
              <p>Komunikasi video antara dua pengguna dienkripsi dari ujung ke ujung menggunakan protokol standar industri <strong>WebRTC (DTLS/SRTP)</strong>. Tidak ada perantara yang dapat mengakses konten aliran video atau audio kamu.</p>
            </Section>

            <Section title="7. Perubahan Kebijakan">
              <p>Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan akan tercermin pada tanggal &quot;Terakhir diperbarui&quot; di bagian atas halaman ini.</p>
            </Section>

            <Section title="8. Hubungi Kami">
              <p>Jika kamu memiliki pertanyaan mengenai kebijakan privasi ini, hubungi kami melalui:</p>
              <p><a href="mailto:rafaelpututarli@gmail.com" style={{ color: '#ff7e5f', textDecoration: 'none', fontWeight: 600 }}>rafaelpututarli@gmail.com</a></p>
            </Section>
          </>
        )}
      </div>

      <footer style={{ borderTop: '1px solid var(--border, rgba(255,255,255,0.08))', padding: '24px', textAlign: 'center', color: 'var(--text-muted, #8b8b9a)', fontSize: 13 }}>
        © {new Date().getFullYear()} BoothKita. All rights reserved.
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}>
        <style>{`
          .legal-section ul { padding-left: 20px; margin: 8px 0; }
          .legal-section li { margin-bottom: 8px; line-height: 1.7; }
          .legal-section ul ul { margin-top: 8px; }
          .legal-section p { margin: 0 0 12px; }
        `}</style>
        <div className="legal-section">{children}</div>
      </div>
    </section>
  );
}

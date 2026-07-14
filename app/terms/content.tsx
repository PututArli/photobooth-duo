'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function TermsContent() {
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
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{isEN ? 'Terms & Conditions' : 'Syarat & Ketentuan'}</h1>
        <p style={{ color: 'var(--text-muted, #8b8b9a)', fontSize: 14, marginBottom: 48 }}>
          {isEN ? 'Last updated: July 1, 2026' : 'Terakhir diperbarui: 1 Juli 2026'}
        </p>

        {isEN ? (
          <>
            <Section title="1. Acceptance of Terms">
              <p>By accessing or using the BoothKita service, you agree to be bound by these Terms and Conditions. If you do not agree, please stop using this service.</p>
            </Section>

            <Section title="2. Description of Service">
              <p><strong>BoothKita</strong> is an online photobooth platform that allows two people to take photos together in real-time over the internet. This service is free and does not require account creation.</p>
            </Section>

            <Section title="3. Permitted Use & Requirements">
              <p>You agree to use BoothKita only for lawful purposes and in accordance with the following terms:</p>
              <ul>
                <li>Personal, entertainment, and non-commercial use.</li>
                <li>Not using this service to create, share, or store content that is illegal, abusive, pornographic, or violates the rights of others.</li>
                <li>Not attempting to hack, disrupt, or interfere with the service infrastructure.</li>
                <li>Not using bots or automated tools to create rooms in large quantities.</li>
              </ul>
              <p style={{ marginTop: 16 }}><strong>Connection Requirement (Tailscale):</strong> Because BoothKita connects your device directly to your partner&apos;s device without going through a central server, users on different networks (e.g., mobile data vs WiFi) <strong>must</strong> use a third-party application called <strong>Tailscale</strong> to establish a connection. You agree to comply with Tailscale&apos;s own terms of service when using their application.</p>
            </Section>

            <Section title="4. Content & Copyright">
              <p>All photos you produce using BoothKita are entirely your property. We claim no ownership over the content you create.</p>
              <p>The design, code, and assets of BoothKita are protected by copyright © {new Date().getFullYear()} BoothKita. It is prohibited to copy, distribute, or modify without written permission from us.</p>
            </Section>

            <Section title="5. Limitation of Liability">
              <p>BoothKita is provided &quot;<em>as-is</em>&quot; without any warranties. We are not responsible for:</p>
              <ul>
                <li>Service interruptions or temporary downtime.</li>
                <li>Loss of session data due to unstable internet connections.</li>
                <li>Content created or shared by users.</li>
                <li>Indirect losses resulting from the use of this service.</li>
              </ul>
            </Section>

            <Section title="6. Privacy">
              <p>The use of your data is governed by our <Link href="/privacy" style={{ color: '#ff7e5f', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>, which is an integral part of these Terms & Conditions.</p>
            </Section>

            <Section title="7. Changes to Service">
              <p>We reserve the right to modify, suspend, or discontinue the service at any time without prior notice. We are not responsible for any disruptions resulting from such changes.</p>
            </Section>

            <Section title="8. Applicable Law">
              <p>These Terms & Conditions are governed by the laws in force in the Republic of Indonesia. Any disputes will be resolved through amicable discussion.</p>
            </Section>

            <Section title="9. Contact">
              <p>If you have any questions regarding these terms, please contact us at:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <a href="https://wa.me/6285764948010" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  WhatsApp
                </a>
                <a href="https://instagram.com/rafaelpututarli" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  Instagram
                </a>
                <a href="mailto:rafaelpututarli@gmail.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Email
                </a>
              </div>
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Penerimaan Ketentuan">
              <p>Dengan mengakses atau menggunakan layanan BoothKita, kamu menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika kamu tidak menyetujui, harap hentikan penggunaan layanan ini.</p>
            </Section>

            <Section title="2. Deskripsi Layanan">
              <p><strong>BoothKita</strong> adalah platform photobooth online yang memungkinkan dua orang untuk berfoto bersama secara real-time melalui internet. Layanan ini bersifat gratis dan tidak memerlukan pembuatan akun.</p>
            </Section>

            <Section title="3. Penggunaan yang Diperbolehkan & Persyaratan">
              <p>Kamu setuju untuk menggunakan BoothKita hanya untuk tujuan yang sah dan sesuai ketentuan berikut:</p>
              <ul>
                <li>Penggunaan pribadi, hiburan, dan non-komersial.</li>
                <li>Tidak menggunakan layanan ini untuk membuat, berbagi, atau menyimpan konten yang bersifat ilegal, kasar, pornografi, atau melanggar hak orang lain.</li>
                <li>Tidak mencoba meretas, merusak, atau mengganggu infrastruktur layanan.</li>
                <li>Tidak menggunakan bot atau alat otomatis untuk membuat room dalam jumlah besar.</li>
              </ul>
              <p style={{ marginTop: 16 }}><strong>Persyaratan Koneksi (Tailscale):</strong> Karena BoothKita menghubungkan perangkat kamu dan partnermu secara langsung tanpa melalui server kami, pengguna di jaringan yang berbeda (misal: data seluler vs WiFi) <strong>diwajibkan</strong> menggunakan aplikasi pihak ketiga bernama <strong>Tailscale</strong> agar koneksi dapat terjalin. Kamu setuju untuk mematuhi syarat dan ketentuan dari Tailscale saat menggunakan aplikasi mereka.</p>
            </Section>

            <Section title="4. Konten & Hak Cipta">
              <p>Semua foto yang kamu hasilkan menggunakan BoothKita adalah milik kamu sepenuhnya. Kami tidak mengklaim kepemilikan atas konten yang kamu buat.</p>
              <p>Desain, kode, dan aset BoothKita dilindungi oleh hak cipta © {new Date().getFullYear()} BoothKita. Dilarang menyalin, mendistribusikan, atau memodifikasi tanpa izin tertulis dari kami.</p>
            </Section>

            <Section title="5. Batasan Tanggung Jawab">
              <p>BoothKita disediakan &quot;<em>sebagaimana adanya</em>&quot; (<em>as-is</em>) tanpa jaminan apapun. Kami tidak bertanggung jawab atas:</p>
              <ul>
                <li>Gangguan layanan atau downtime sementara.</li>
                <li>Kehilangan data sesi akibat koneksi internet yang tidak stabil.</li>
                <li>Konten yang dibuat atau dibagikan oleh pengguna.</li>
                <li>Kerugian tidak langsung akibat penggunaan layanan ini.</li>
              </ul>
            </Section>

            <Section title="6. Privasi">
              <p>Penggunaan data kamu diatur oleh <Link href="/privacy" style={{ color: '#ff7e5f', textDecoration: 'none', fontWeight: 600 }}>Kebijakan Privasi</Link> kami, yang merupakan bagian tak terpisahkan dari Syarat & Ketentuan ini.</p>
            </Section>

            <Section title="7. Perubahan Layanan">
              <p>Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya. Kami tidak bertanggung jawab atas gangguan yang timbul akibat perubahan tersebut.</p>
            </Section>

            <Section title="8. Hukum yang Berlaku">
              <p>Syarat & Ketentuan ini diatur oleh hukum yang berlaku di Republik Indonesia. Segala sengketa akan diselesaikan melalui musyawarah mufakat.</p>
            </Section>

            <Section title="9. Hubungi Kami">
              <p>Jika kamu memiliki pertanyaan seputar syarat dan ketentuan ini, hubungi kami di:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <a href="https://wa.me/6285764948010" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  WhatsApp
                </a>
                <a href="https://instagram.com/rafaelpututarli" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  Instagram
                </a>
                <a href="mailto:rafaelpututarli@gmail.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff7e5f', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: 'rgba(255,126,95,0.1)', padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(255,126,95,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Email
                </a>
              </div>
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

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PhotoBooth Duo — Real-Time Couple Photobooth',
  description: 'Ambil foto berdua secara online real-time. Buat room, share link ke pasangan, dan nikmati sesi foto bersama dengan frame dan filter keren!',
  keywords: ['photobooth', 'couple', 'real-time', 'foto bersama', 'online photobooth'],
  openGraph: {
    title: 'PhotoBooth Duo — Real-Time Couple Photobooth',
    description: 'Foto berdua secara online real-time dengan berbagai frame dan filter.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#0d0d12" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

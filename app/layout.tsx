import type { Metadata } from 'next';
import { Playfair_Display, Caveat } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'BoothKita',
  description: 'Ambil foto berdua secara online. Buat room, share link ke pasangan, dan nikmati sesi foto bersama dengan frame dan filter keren!',
  keywords: ['photobooth', 'couple', 'foto bersama', 'online photobooth'],
  openGraph: {
    title: 'BoothKita',
    description: 'Foto berdua secara online dengan berbagai frame dan filter.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${caveat.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0d0d12" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

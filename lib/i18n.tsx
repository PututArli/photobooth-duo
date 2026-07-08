'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

const dictionary = {
  en: {
    // Lobby
    'lobby.title': 'boothkita',
    'lobby.create': 'Create',
    'lobby.creating': 'Creating...',
    'lobby.createDesc': 'a room',
    'lobby.join': 'Join',
    'lobby.joinDesc': 'with a code',
    'lobby.joinInputPlaceholder': 'XXXXXX',
    'lobby.joinBtn': 'Join Room',
    'lobby.joiningBtn': 'joining...',
    'lobby.cancelBtn': 'Cancel',
    'lobby.error.create': 'Failed to create room',
    'lobby.error.join': 'Invalid room code',
    'lobby.error.connection': 'Connection failed',
    'lobby.rejoin': 'rejoin last room',
    
    // Tailscale Tutor (EN)
    'tutor.button': '🌐 Connection Issues? Read This!',
    'tutor.title': 'How to Connect on Different Networks',
    'tutor.desc': 'If you and your partner are using different internet connections (e.g. Mobile Data and WiFi) and the video/audio fails to connect, follow these simple steps to create a virtual local network.',
    'tutor.downloadTitle': 'Download Tailscale first',
    'tutor.downloadDesc': 'Choose the device you use. Open the link, install Tailscale, then return to this tutorial.',
    'tutor.step1.title': '1. Download Tailscale',
    'tutor.step1.desc': 'Install the "Tailscale" app on both devices. If you use a phone, open the App Store or Play Store link. If you use a computer, use the Windows, macOS, or Linux link.',
    'tutor.step2.title': '2. Login with the Same Account',
    'tutor.step2.desc': 'Open Tailscale on both devices, tap Log in, then use the exact same account on both sides, for example the same Google account.',
    'tutor.step3.title': '3. Turn It On',
    'tutor.step3.desc': 'After login, turn on Tailscale on both devices until it says Connected. On mobile, allow the VPN permission when asked.',
    'tutor.step4.title': '4. Try Again!',
    'tutor.step4.desc': 'Return to this website, create a room on one device, copy the room link or code, then join from the second device.',
    'tutor.checkTitle': 'Before taking photos, check this',
    'tutor.check1': 'Both devices are logged in to the same Tailscale account.',
    'tutor.check2': 'Both devices show Connected or Active in Tailscale.',
    'tutor.check3': 'Keep Tailscale open or active in the background while using the photobooth.',
    'tutor.check4': 'If video is still missing, refresh the room page on both devices.',
    'tutor.help': 'Still confused? Contact me:',
    'tutor.close': 'Close Tutorial',
    'lobby.recommendation': 'Using a PC/Laptop is recommended for the best experience.',

    // Room
    'room.copied': 'copied!',
    'room.copyLink': 'copy link',
    'room.waiting': 'waiting for partner...',
    'room.connected': 'partner connected!',
    'room.chooseLayout': 'Choose Layout & Theme',
    'room.back': 'back',
    'room.yourCode': 'YOUR CODE',
    'room.unmutePartner': '🔊 Tap to Hear Partner!',
    'room.expiredTitle': 'ROOM EXPIRED',
    'room.expiredHeading': 'This room has ended',
    'room.expiredDesc': 'Photo rooms are active for 30 minutes to keep the server light.',
    'room.timeLeft': 'Room ends in',
    'room.connectionIssue': 'Connection to the room is unstable. Please check your internet or refresh if it does not reconnect.',
    
    // VideoGrid
    'video.full': 'Room is Full',
    'video.fullDesc': 'Maximum 2 people allowed in one photo session.',
    'video.grid': 'Grid',
    'video.filter': 'Filter',
    'video.micOff': 'Turn off Mic',
    'video.micOn': 'Turn on Mic',
    'video.mirror': 'Mirror Video',
    'video.switchCamera': 'Switch Camera',
    'video.cameraError': 'Failed to access camera. Please allow permission.',
    'video.cameraUnavailable': 'Camera unavailable',
    'video.startCamera': 'Start Camera',
    'video.waitingVideo': 'Connected, waiting for video...',
    'video.partnerWaitingVideo': 'Partner connected, waiting for video...',
    'video.waitingPartner': 'Waiting for partner to join...',
    'video.shareCode': 'Share code ',
    'video.capturing': 'Capturing ',
    'video.startCapture': 'START CAPTURE',
    'video.skipToLayout': 'Skip to Layout',
    'video.retakeCapture': 'Retake All',
    
    // Wizard
    'wizard.layoutTitle': 'Select Photo Layout',
    'wizard.themeTitle': 'Select Frame Theme',
    'wizard.next': 'Next',
    'wizard.prev': 'Back',
    'wizard.back': 'back',
    'wizard.waitingHost': 'Waiting for Host to choose...',
    'wizard.choose_layout': 'CHOOSE YOUR STRIP',
    'wizard.choose_theme': 'CHOOSE YOUR THEME',
    'wizard.pick_theme': 'PICK A THEME',
    'wizard.ready_templates': 'READY TEMPLATES',
    'wizard.frame_style': 'Frame Style',
    'wizard.use_template': 'Use',
    'wizard.custom_text': 'Custom Text',
    'wizard.placeholder_text': 'Write your text...',
    'layout.2_pics': '2 Pictures',
    'layout.3_pics': '3 Pictures',
    'layout.4_pics': '4 Pictures',
    'layout.5_pics': '5 Pictures',
    'layout.2x2_grid': '2x2 Grid',
    'layout.3x2_grid': '3x2 Grid',
    'layout.single': 'Single',

    // Arrange
    'arrange.title': 'MAKE YOUR STRIP',
    'arrange.myTake': 'My Take',
    'arrange.partnerTake': 'Partner Take',
    'arrange.mySlot': 'My Slot',
    'arrange.partnerSlot': 'Partner Slot',
    'arrange.drag': 'Drag a photo to an empty area',
    'arrange.next': 'next',
    'arrange.finish': 'Finish',
    'arrange.waitingHost': 'Waiting for Host to arrange photos...',

    'review.title': 'Review Session',
    'review.subtitle': 'Retake any shot before arranging the final strip.',
    'review.myPhoto': 'You',
    'review.partnerPhoto': 'Partner',
    'review.retake': 'Retake',
    'review.ready': 'Ready',
    'review.continue': 'Continue',
    'review.backCamera': 'Back to Camera',
    'review.missing': 'Waiting',

    // Decorate
    'decorate.title': 'Decorate Photo',
    'decorate.stickers': 'Stickers',
    'decorate.text': 'Text',
    'decorate.draw': 'Draw',
    'decorate.finish': 'Finish',
    'decorate.clear': 'Clear All',
    'decorate.addText': 'Add Text',
    'decorate.updateText': 'Update Text',
    'decorate.newText': 'New Text',
    'decorate.textPlaceholder': 'Write text...',
    'decorate.font': 'Font',
    'decorate.duplicate': 'Duplicate',
    'decorate.flip': 'Flip',
    'decorate.front': 'Front',
    'decorate.backLayer': 'Back',
    'decorate.undo': 'Undo',
    'decorate.redo': 'Redo',
    'decorate.delete': 'Delete',

    // Result
    'result.title': 'Final Result',
    'result.download': 'Download',
    'result.backHome': 'Back to Home',
    'result.myPhotos': 'My Photos',
    'result.partnerPhotos': 'Partner Photos',
    'result.myStrip': 'Your Strip',
    'result.composing': 'Composing strip...',
    'result.saved': '✓ Saved!',
    'result.downloadPng': 'Download PNG',
    'result.downloadJpg': 'Download JPG',
    'result.downloadPdf': 'Print / PDF',
    'result.downloadStory': 'Story PNG',
    'result.downloadFeed': 'Feed PNG',
    'result.processing': '⏳ Processing...',
    'result.downloadGif': 'Download GIF',
    'result.retake': 'Retake Photo',

    // Theme Backgrounds
    'theme.bg.white': 'White',
    'theme.bg.cream': 'Cream',
    'theme.bg.pink': 'Pink',
    'theme.bg.yellow': 'Yellow',
    'theme.bg.sage': 'Sage',
    'theme.bg.baby blue': 'Baby Blue',
    'theme.bg.black': 'Black',
    'theme.bg.pastel': 'Pastel',
    'theme.bg.lavender': 'Lavender',
    'theme.bg.mint': 'Mint',
    'theme.bg.peach': 'Peach',
    'theme.bg.sunset': 'Sunset',
    'theme.bg.ocean': 'Ocean',
    'theme.bg.night': 'Night',
    'theme.bg.y2k check': 'Y2K',
    'theme.bg.denim': 'Denim',
    'theme.bg.clouds': 'Clouds',
    'theme.bg.polka pink': 'Polka',
    'theme.bg.classic check': 'Check',

    // Theme Borders
    'theme.border.plain': 'Plain',
    'theme.border.polaroid': 'Polaroid',
    'theme.border.film': 'Film',
    'theme.border.neon': 'Neon Glow',
    'theme.border.romantic': 'Romantic',
    'theme.border.birthday': 'Birthday',
    'theme.border.sakura': 'Sakura',
    'theme.border.galaxy': 'Galaxy',
    'theme.border.summer': 'Summer',
    'theme.border.christmas': 'Christmas',

    // Camera error
    'camera.errorTitle': 'Camera / Mic Access Blocked',
    'camera.errorDesc': 'Photobooth cannot access your camera. If you previously denied permission, the browser will not prompt again automatically.',
    'camera.errorInstructions': 'How to fix: Click the 🔒 (lock/settings) icon at the top left of your browser URL bar, then allow Camera and Microphone. Then click the button below.',
    'camera.errorBtn': 'I Have Allowed Access',

    // Footer
    'footer.privacy': '🔒 We do not store your photos, videos, or biometric data. All sessions are peer-to-peer and encrypted.',
    'footer.privacyLink': 'Privacy Policy',
    'footer.termsLink': 'Terms & Conditions',
    'footer.contact': 'Contact',
    'footer.copyright': 'Made with ♥ by Rafael. All rights reserved.'
  },
  id: {
    // Lobby
    'lobby.title': 'boothkita',
    'lobby.create': 'Buat',
    'lobby.creating': 'Membuat...',
    'lobby.createDesc': 'ruangan baru',
    'lobby.join': 'Masuk',
    'lobby.joinDesc': 'dengan kode',
    'lobby.joinInputPlaceholder': 'XXXXXX',
    'lobby.joinBtn': 'Masuk Ruangan',
    'lobby.joiningBtn': 'bergabung...',
    'lobby.cancelBtn': 'Batal',
    'lobby.error.create': 'Gagal membuat ruang',
    'lobby.error.join': 'Kode ruangan tidak valid',
    'lobby.error.connection': 'Koneksi gagal',
    'lobby.rejoin': 'masuk kembali ke ruangan',
    
    // Tailscale Tutor (ID)
    'tutor.button': '🌐 Susah Konek Beda Jaringan? Baca Ini!',
    'tutor.title': 'Cara Koneksi Beda Jaringan',
    'tutor.desc': 'Jika kamu dan pasangan memakai koneksi berbeda (misal: Data Seluler & WiFi) dan video/suara tidak muncul, ikuti langkah mudah ini.',
    'tutor.downloadTitle': 'Download Tailscale dulu',
    'tutor.downloadDesc': 'Pilih sesuai perangkat yang dipakai. Buka link-nya, install Tailscale, lalu kembali ke tutorial ini.',
    'tutor.step1.title': '1. Download Aplikasi Tailscale',
    'tutor.step1.desc': 'Install aplikasi "Tailscale" di kedua perangkat. Kalau pakai HP, buka link App Store atau Play Store. Kalau pakai komputer, pilih Windows, macOS, atau Linux.',
    'tutor.step2.title': '2. Login Akun yang Sama',
    'tutor.step2.desc': 'Buka Tailscale di kedua perangkat, tekan Log in, lalu masuk memakai akun yang sama persis, misalnya akun Google yang sama.',
    'tutor.step3.title': '3. Aktifkan (Connect)',
    'tutor.step3.desc': 'Setelah login, aktifkan Tailscale di kedua perangkat sampai statusnya Connected atau Active. Di HP, izinkan VPN kalau diminta.',
    'tutor.step4.title': '4. Selesai!',
    'tutor.step4.desc': 'Buka lagi website ini, buat room di salah satu perangkat, salin link atau kode room, lalu masuk dari perangkat kedua.',
    'tutor.checkTitle': 'Sebelum mulai foto, cek ini',
    'tutor.check1': 'Dua perangkat sudah login ke akun Tailscale yang sama.',
    'tutor.check2': 'Dua perangkat sudah berstatus Connected atau Active di Tailscale.',
    'tutor.check3': 'Biarkan Tailscale tetap aktif di background saat memakai photobooth.',
    'tutor.check4': 'Kalau video masih belum muncul, refresh halaman room di kedua perangkat.',
    'tutor.help': 'Masih bingung? Hubungi saya:',
    'tutor.close': 'Tutup Tutorial',
    'lobby.recommendation': 'Disarankan menggunakan PC/Laptop untuk pengalaman photobooth terbaik yaa.',

    // Room
    'room.copied': 'tersalin!',
    'room.copyLink': 'salin tautan',
    'room.waiting': 'menunggu teman...',
    'room.connected': 'teman terhubung!',
    'room.chooseLayout': 'Pilih Layout & Tema',
    'room.back': 'kembali',
    'room.yourCode': 'KODE RUANGAN',
    'room.unmutePartner': '🔊 Nyalakan Suara Partner!',
    'room.expiredTitle': 'ROOM EXPIRED',
    'room.expiredHeading': 'Room ini sudah selesai',
    'room.expiredDesc': 'Room foto aktif selama 30 menit agar server tetap ringan.',
    'room.timeLeft': 'Room berakhir dalam',
    'room.connectionIssue': 'Koneksi ke room sedang tidak stabil. Cek internet kamu atau refresh kalau tidak tersambung lagi.',
    
    // VideoGrid
    'video.full': 'Ruangan Penuh',
    'video.fullDesc': 'Maksimal 2 orang yang diizinkan dalam satu sesi foto.',
    'video.grid': 'Kisi',
    'video.filter': 'Filter',
    'video.micOff': 'Matikan Mic',
    'video.micOn': 'Nyalakan Mic',
    'video.mirror': 'Mirror Video',
    'video.switchCamera': 'Ganti Kamera',
    'video.cameraError': 'Gagal mengakses kamera. Mohon izinkan akses.',
    'video.cameraUnavailable': 'Kamera tidak tersedia',
    'video.startCamera': 'Mulai Kamera',
    'video.waitingVideo': 'Terhubung, menunggu video...',
    'video.partnerWaitingVideo': 'Partner terhubung, menunggu video...',
    'video.waitingPartner': 'Menunggu partner masuk...',
    'video.shareCode': 'Bagikan kode ',
    'video.capturing': 'Memotret ',
    'video.startCapture': 'MULAI MEMOTRET',
    'video.skipToLayout': 'Lewati ke Layout',
    'video.retakeCapture': 'Foto Ulang',
    
    // Wizard
    'wizard.layoutTitle': 'Pilih Tata Letak Foto',
    'wizard.themeTitle': 'Pilih Tema Bingkai',
    'wizard.next': 'Lanjut',
    'wizard.prev': 'Kembali',
    'wizard.back': 'kembali',
    'wizard.waitingHost': 'Menunggu Host memilih...',
    'wizard.choose_layout': 'PILIH TATA LETAK',
    'wizard.choose_theme': 'PILIH TEMA BINGKAI',
    'wizard.pick_theme': 'PILIH TEMA',
    'wizard.ready_templates': 'TEMPLATE SIAP PAKAI',
    'wizard.frame_style': 'Gaya Bingkai',
    'wizard.use_template': 'Pakai',
    'wizard.custom_text': 'Teks Kustom',
    'wizard.placeholder_text': 'Tulis teks di sini...',
    'layout.2_pics': '2 Foto',
    'layout.3_pics': '3 Foto',
    'layout.4_pics': '4 Foto',
    'layout.5_pics': '5 Foto',
    'layout.2x2_grid': 'Grid 2x2',
    'layout.3x2_grid': 'Grid 3x2',
    'layout.single': 'Satu',

    // Arrange
    'arrange.title': 'BUAT STRIP MU',
    'arrange.myTake': 'Foto Saya',
    'arrange.partnerTake': 'Foto Pasangan',
    'arrange.mySlot': 'Slot Saya',
    'arrange.partnerSlot': 'Slot Pasangan',
    'arrange.drag': 'Tarik foto ke area yang kosong',
    'arrange.next': 'lanjut',
    'arrange.finish': 'Selesai',
    'arrange.waitingHost': 'Menunggu Host menyusun foto...',

    'review.title': 'Cek Hasil Foto',
    'review.subtitle': 'Ulangi foto yang kurang pas sebelum menyusun strip akhir.',
    'review.myPhoto': 'Kamu',
    'review.partnerPhoto': 'Partner',
    'review.retake': 'Ulang',
    'review.ready': 'Siap',
    'review.continue': 'Lanjut',
    'review.backCamera': 'Kembali Kamera',
    'review.missing': 'Menunggu',

    // Decorate
    'decorate.title': 'Hias Foto',
    'decorate.stickers': 'Stiker',
    'decorate.text': 'Teks',
    'decorate.draw': 'Gambar',
    'decorate.finish': 'Selesai',
    'decorate.clear': 'Hapus Semua',
    'decorate.addText': 'Tambah Teks',
    'decorate.updateText': 'Ubah Teks',
    'decorate.newText': 'Teks Baru',
    'decorate.textPlaceholder': 'Tulis teks...',
    'decorate.font': 'Font',
    'decorate.duplicate': 'Duplikat',
    'decorate.flip': 'Balik',
    'decorate.front': 'Depan',
    'decorate.backLayer': 'Belakang',
    'decorate.undo': 'Undo',
    'decorate.redo': 'Redo',
    'decorate.delete': 'Hapus',

    // Result
    'result.title': 'Hasil Akhir',
    'result.download': 'Unduh',
    'result.backHome': 'Kembali ke Beranda',
    'result.myPhotos': 'Foto Kamu',
    'result.partnerPhotos': 'Foto Partner',
    'result.myStrip': 'Strip Kamu',
    'result.composing': 'Menyusun strip...',
    'result.saved': '✓ Tersimpan!',
    'result.downloadPng': 'Unduh PNG',
    'result.downloadJpg': 'Unduh JPG',
    'result.downloadPdf': 'Print / PDF',
    'result.downloadStory': 'Story PNG',
    'result.downloadFeed': 'Feed PNG',
    'result.processing': '⏳ Memproses...',
    'result.downloadGif': 'Unduh GIF',
    'result.retake': 'Foto Ulang',

    // Theme Backgrounds
    'theme.bg.white': 'Putih',
    'theme.bg.cream': 'Krem',
    'theme.bg.pink': 'Merah Muda',
    'theme.bg.yellow': 'Kuning',
    'theme.bg.sage': 'Sage',
    'theme.bg.baby blue': 'Biru Muda',
    'theme.bg.black': 'Hitam',
    'theme.bg.pastel': 'Pastel',
    'theme.bg.lavender': 'Lavender',
    'theme.bg.mint': 'Mint',
    'theme.bg.peach': 'Persik',
    'theme.bg.sunset': 'Senja',
    'theme.bg.ocean': 'Samudra',
    'theme.bg.night': 'Malam',
    'theme.bg.y2k check': 'Y2K',
    'theme.bg.denim': 'Denim',
    'theme.bg.clouds': 'Awan',
    'theme.bg.polka pink': 'Polkadot',
    'theme.bg.classic check': 'Kotak',

    // Theme Borders
    'theme.border.plain': 'Polos',
    'theme.border.polaroid': 'Polaroid',
    'theme.border.film': 'Film',
    'theme.border.neon': 'Neon Glow',
    'theme.border.romantic': 'Romantis',
    'theme.border.birthday': 'Ulang Tahun',
    'theme.border.sakura': 'Sakura',
    'theme.border.galaxy': 'Galaksi',
    'theme.border.summer': 'Musim Panas',
    'theme.border.christmas': 'Natal',

    // Camera error
    'camera.errorTitle': 'Izin Kamera/Mic Diblokir',
    'camera.errorDesc': 'Photobooth tidak dapat mengakses kamera. Jika kamu sebelumnya menolak izin, browser tidak akan memunculkan pop-up izin lagi secara otomatis.',
    'camera.errorInstructions': 'Cara mengatasi: Klik ikon 🔒 (gembok/settings) di kiri atas (URL bar) browser-mu, lalu izinkan Kamera dan Mikrofon. Setelah itu, klik tombol di bawah.',
    'camera.errorBtn': 'Saya Sudah Mengizinkan',

    // Footer
    'footer.privacy': '🔒 Kami tidak menyimpan foto, video, atau data biometrik kamu. Semua sesi bersifat peer-to-peer dan terenkripsi.',
    'footer.privacyLink': 'Kebijakan Privasi',
    'footer.termsLink': 'Syarat & Ketentuan',
    'footer.contact': 'Kontak',
    'footer.copyright': 'Made with ♥ by Rafael. All rights reserved.'
  }
};

type DictionaryKey = keyof typeof dictionary.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('app_language');
    if (saved === 'en' || saved === 'id') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_language', newLang);
  };

  const t = (key: DictionaryKey): string => {
    return dictionary[lang][key] || key;
  };



  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

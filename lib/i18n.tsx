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
    'lobby.joiningBtn': 'Joining...',
    'lobby.cancelBtn': 'Cancel',
    'lobby.rejoin': 'rejoin previous session',
    'lobby.recommendation': 'Using a PC/Laptop is recommended for the best experience.',
    'lobby.error.create': 'Failed to create room.',
    'lobby.error.join': 'Room not found or expired.',
    'lobby.error.connection': 'Connection error.',
    'lobby.backupTitle': 'Use Backup Server',
    'lobby.backupDesc': 'Turn on if your partner\'s video or audio is missing.',

    // Room
    'room.copied': 'copied!',
    'room.copyLink': 'copy link',
    'room.waiting': 'waiting for partner...',
    'room.connected': 'partner connected!',
    'room.chooseLayout': 'Choose Layout & Theme',
    'room.back': '← back',
    
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
    'video.startCamera': 'Start Camera',
    
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

    // Decorate
    'decorate.title': 'Decorate Photo',
    'decorate.stickers': 'Stickers',
    'decorate.text': 'Text',
    'decorate.draw': 'Draw',
    'decorate.finish': 'Finish',
    'decorate.clear': 'Clear All',

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
    'result.processing': '⏳ Processing...',
    'result.downloadGif': 'Download GIF',
    'result.retake': 'Retake Photo'
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
    'lobby.joiningBtn': 'Memasuki...',
    'lobby.cancelBtn': 'Batal',
    'lobby.rejoin': 'masuk ke sesi sebelumnya',
    'lobby.recommendation': 'Disarankan menggunakan PC/Laptop untuk pengalaman photobooth terbaik yaa.',
    'lobby.error.create': 'Gagal membuat ruangan.',
    'lobby.error.join': 'Ruangan tidak ditemukan atau kadaluarsa.',
    'lobby.error.connection': 'Terjadi kesalahan koneksi.',
    'lobby.backupTitle': 'Gunakan Server Cadangan',
    'lobby.backupDesc': 'Nyalakan jika video atau suara pasanganmu tidak muncul.',

    // Room
    'room.copied': 'tersalin!',
    'room.copyLink': 'salin tautan',
    'room.waiting': 'menunggu teman...',
    'room.connected': 'teman terhubung!',
    'room.chooseLayout': 'Pilih Layout & Tema',
    'room.back': 'kembali',
    
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
    'video.startCamera': 'Mulai Kamera',
    
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

    // Decorate
    'decorate.title': 'Hias Foto',
    'decorate.stickers': 'Stiker',
    'decorate.text': 'Teks',
    'decorate.draw': 'Gambar',
    'decorate.finish': 'Selesai',
    'decorate.clear': 'Hapus Semua',

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
    'result.processing': '⏳ Memproses...',
    'result.downloadGif': 'Unduh GIF',
    'result.retake': 'Foto Ulang'
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

  if (!mounted) {
    // Avoid hydration mismatch by rendering default on server, 
    // but React context handles this fine if we just pass the default.
    // We'll just return it directly.
  }

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

export type LayoutKey = 'strip2' | 'strip3' | 'strip4' | 'strip5' | 'grid2x2' | 'grid3x2' | 'single';

export interface LayoutDef {
  count: number;
  cols: number;
  rows: number;
}

export interface RoomState {
  layout: LayoutKey;
  sessionCount: number;
  timer: number;
  frameBg: { type: 'solid' | 'gradient' | 'pattern'; val: string; textColor?: string };
  photoBorder: string;
  customText: string;
  showDate: boolean;
  videoFilter: string;
  arrangeIndices?: (number | null)[];
  arrangeActiveSlot?: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  frameBg: RoomState['frameBg'];
  photoBorder: string;
  customText: string;
  showDate: boolean;
  videoFilter: string;
}

export interface CameraFilterPreset {
  id: string;
  label: string;
  style: string;
}

export interface CapturedPhoto {
  dataUrl: string;
  participantId: string;
  index: number;
}

export interface RealtimeMessage {
  type:
    | 'session_start'
    | 'photo_start'
    | 'countdown_start'
    | 'countdown_tick'
    | 'photo_captured'
    | 'state_update'
    | 'phase_update'
    | 'session_reset'
    | 'participant_ready'
    | 'partner_joined'
    | 'retake_start'
    | 'ping'
    | 'pong'
    | 'sdp_offer'
    | 'sdp_answer'
    | 'ice_candidate'
    | 'sync_decorate'
    | 'sync_time'
    | 'trigger_complete_decorate'
    | 'sync_photos';
  senderId: string;
  payload?: unknown;
}

export interface ParticipantInfo {
  id: string;
  role: 'host' | 'guest';
  isReady: boolean;
}

export type RoomStatus = 'waiting' | 'active' | 'done';
export type SessionPhase =
  | 'waiting_partner'
  | 'setup_layout'
  | 'setup_theme'
  | 'ready_to_capture'
  | 'countdown'
  | 'capturing'
  | 'review'
  | 'arrange'
  | 'decorate'
  | 'error_full'
  | 'expired'
  | 'done';

export const LAYOUTS: Record<LayoutKey, LayoutDef> = {
  strip2: { count: 2, cols: 1, rows: 2 },
  strip3: { count: 3, cols: 1, rows: 3 },
  strip4: { count: 4, cols: 1, rows: 4 },
  strip5: { count: 5, cols: 1, rows: 5 },
  grid2x2: { count: 4, cols: 2, rows: 2 },
  grid3x2: { count: 6, cols: 2, rows: 3 },
  single: { count: 1, cols: 1, rows: 1 },
};

export const FRAME_BG_PRESETS = [
  { id: 'white', label: 'white', type: 'solid' as const, val: '#ffffff', textColor: '#111', style: { background: '#ffffff' } },
  { id: 'cream', label: 'cream', type: 'solid' as const, val: '#f5efdf', textColor: '#111', style: { background: '#f5efdf' } },
  { id: 'pink', label: 'pink', type: 'solid' as const, val: '#f8c8d8', textColor: '#111', style: { background: '#f8c8d8' } },
  { id: 'yellow', label: 'yellow', type: 'solid' as const, val: '#fdfd96', textColor: '#111', style: { background: '#fdfd96' } },
  { id: 'sage', label: 'sage', type: 'solid' as const, val: '#c1d7c3', textColor: '#111', style: { background: '#c1d7c3' } },
  { id: 'baby blue', label: 'baby blue', type: 'solid' as const, val: '#b0e0e6', textColor: '#111', style: { background: '#b0e0e6' } },
  { id: 'black', label: 'black', type: 'solid' as const, val: '#0a0a0a', textColor: '#fff', style: { background: '#0a0a0a' } },
  { id: 'pastel', label: 'pastel', type: 'gradient' as const, val: '#ff9a9e,#fecfef', textColor: '#111', style: { background: 'linear-gradient(135deg, #ff9a9e, #fecfef)' } },
  { id: 'lavender', label: 'lavender', type: 'gradient' as const, val: '#a18cd1,#fbc2eb', textColor: '#111', style: { background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' } },
  { id: 'mint', label: 'mint', type: 'gradient' as const, val: '#84fab0,#8fd3f4', textColor: '#111', style: { background: 'linear-gradient(135deg, #84fab0, #8fd3f4)' } },
  { id: 'peach', label: 'peach', type: 'gradient' as const, val: '#ffecd2,#fcb69f', textColor: '#111', style: { background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' } },
  { id: 'sunset', label: 'sunset', type: 'gradient' as const, val: '#f6d365,#fda085', textColor: '#111', style: { background: 'linear-gradient(135deg, #f6d365, #fda085)' } },
  { id: 'ocean', label: 'ocean', type: 'gradient' as const, val: '#4facfe,#00f2fe', textColor: '#fff', style: { background: 'linear-gradient(135deg, #4facfe, #00f2fe)' } },
  { id: 'night', label: 'night', type: 'gradient' as const, val: '#30cfd0,#330867', textColor: '#fff', style: { background: 'linear-gradient(135deg, #30cfd0, #330867)' } },
  { id: 'y2k check', label: 'y2k', type: 'pattern' as const, val: 'y2k_check', textColor: '#fff', style: { background: 'repeating-linear-gradient(45deg, #ff4757 0, #ff4757 10px, #2ed573 10px, #2ed573 20px)' } },
  { id: 'denim', label: 'denim', type: 'pattern' as const, val: 'denim', textColor: '#fff', style: { background: '#2c3e50', border: '1px dashed #fff' } },
  { id: 'clouds', label: 'clouds', type: 'pattern' as const, val: 'clouds', textColor: '#111', style: { background: 'linear-gradient(#a1c4fd, #c2e9fb)' } },
  { id: 'polka pink', label: 'polka', type: 'pattern' as const, val: 'polka', textColor: '#111', style: { background: 'radial-gradient(#ff007f 15%, transparent 16%) 0 0, radial-gradient(#ff007f 15%, transparent 16%) 8px 8px', backgroundSize: '16px 16px', backgroundColor: '#fff' } },
  { id: 'classic check', label: 'check', type: 'pattern' as const, val: 'check', textColor: '#fff', style: { background: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px)' } },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Putih bersih, lembut, dan elegan.',
    frameBg: { type: 'gradient', val: '#fff7ed,#f8fafc', textColor: '#111' },
    photoBorder: 'polaroid',
    customText: 'Our Moment',
    showDate: true,
    videoFilter: 'brightness(1.06) contrast(0.96) saturate(1.05)',
  },
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Ceria untuk pesta dan kejutan.',
    frameBg: { type: 'gradient', val: '#ff9a9e,#fad0c4', textColor: '#111' },
    photoBorder: 'birthday',
    customText: 'Happy Day',
    showDate: true,
    videoFilter: 'brightness(1.08) contrast(1.05) saturate(1.25)',
  },
  {
    id: 'couple',
    name: 'Couple',
    description: 'Romantis dengan warna hangat.',
    frameBg: { type: 'solid', val: '#f8c8d8', textColor: '#111' },
    photoBorder: 'romantic',
    customText: 'Together',
    showDate: true,
    videoFilter: 'sepia(18%) brightness(1.05) saturate(1.18)',
  },
  {
    id: 'graduation',
    name: 'Graduation',
    description: 'Rapi untuk momen kelulusan.',
    frameBg: { type: 'solid', val: '#0a0a0a', textColor: '#fff' },
    photoBorder: 'film',
    customText: 'We Made It',
    showDate: true,
    videoFilter: 'contrast(1.08) brightness(1.04) saturate(0.95)',
  },
  {
    id: 'retro',
    name: 'Retro Film',
    description: 'Nuansa analog dan nostalgia.',
    frameBg: { type: 'gradient', val: '#f6d365,#fda085', textColor: '#111' },
    photoBorder: 'film',
    customText: 'Good Times',
    showDate: true,
    videoFilter: 'sepia(38%) contrast(1.08) saturate(1.22)',
  },
  {
    id: 'studio',
    name: 'Studio Clean',
    description: 'Minimal, tajam, dan profesional.',
    frameBg: { type: 'solid', val: '#ffffff', textColor: '#111' },
    photoBorder: 'plain',
    customText: 'BoothKita',
    showDate: false,
    videoFilter: 'brightness(1.04) contrast(1.08) saturate(1.02)',
  },
];

export const CAMERA_FILTER_PRESETS: CameraFilterPreset[] = [
  { id: 'none', label: 'Normal', style: 'none' },
  { id: 'soft', label: 'Soft', style: 'brightness(1.08) contrast(0.94) saturate(1.08)' },
  { id: 'studio', label: 'Studio', style: 'brightness(1.05) contrast(1.12) saturate(1.02)' },
  { id: 'film', label: 'Film', style: 'sepia(35%) contrast(1.08) saturate(1.2)' },
  { id: 'warm', label: 'Warm Skin', style: 'sepia(20%) brightness(1.06) saturate(1.16)' },
  { id: 'cool', label: 'Cool Tone', style: 'hue-rotate(185deg) saturate(1.15) brightness(1.02)' },
  { id: 'classic', label: 'B&W Classic', style: 'grayscale(100%) contrast(1.18)' },
  { id: 'bright', label: 'Bright', style: 'brightness(1.16) contrast(1.02) saturate(1.06)' },
  { id: 'vivid', label: 'Vivid', style: 'contrast(1.14) saturate(1.35)' },
  { id: 'matte', label: 'Matte', style: 'contrast(0.9) brightness(1.06) saturate(0.9)' },
];

export const BORDER_PRESETS = [
  { id: 'plain', label: 'Polos' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'film', label: 'Film' },
  { id: 'neon', label: 'Neon Glow' },
  { id: 'romantic', label: 'Romantis', emoji: ['💖', '🌹', '💌', '💕'] },
  { id: 'birthday', label: 'Ulang Tahun', emoji: ['🎂', '🎈', '🎉', '🧁'] },
  { id: 'sakura', label: 'Sakura', emoji: ['🌸', '🍡', '🌸', '✨'] },
  { id: 'galaxy', label: 'Galaxy', emoji: ['🌌', '⭐', '🚀', '🪐'] },
  { id: 'summer', label: 'Summer', emoji: ['☀️', '🌴', '🏖️', '🍍'] },
  { id: 'christmas', label: 'Natal', emoji: ['❄️', '🎄', '🎁', '✨'] },
];

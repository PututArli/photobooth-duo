export interface RoomState {
  layout: LayoutKey;
  sessionCount: number;
  timer: number;
  color: string;
  colorCSS: string;
  frameBg: { type: 'solid' | 'gradient' | 'pattern'; val: string };
  photoBorder: string;
  customText: string;
  showDate: boolean;
  adj: { b: number; c: number; s: number; w: number };
}

export type LayoutKey = 'strip3' | 'strip4' | 'grid2x2' | 'single';

export interface LayoutDef {
  count: number;
  cols: number;
  rows: number;
}

export interface CapturedPhoto {
  dataUrl: string;
  participantId: string;
  index: number;
}

export interface RealtimeMessage {
  type:
    | 'countdown_start'
    | 'countdown_tick'
    | 'photo_captured'
    | 'state_update'
    | 'session_reset'
    | 'participant_ready'
    | 'partner_joined'
    | 'sdp_offer'
    | 'sdp_answer'
    | 'ice_candidate';
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
  | 'idle'
  | 'countdown'
  | 'capturing'
  | 'reviewing'
  | 'customizing'
  | 'done';

export const COLOR_FILTERS = [
  { id: 'none', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'B & W', css: 'grayscale(100%) contrast(110%)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(50%) contrast(120%) saturate(150%)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
  { id: 'warm', label: 'Warm', css: 'saturate(130%) hue-rotate(-20deg) brightness(105%)' },
  { id: 'cool', label: 'Cool', css: 'saturate(120%) hue-rotate(30deg) brightness(102%)' },
  { id: 'film', label: 'Retro', css: 'contrast(130%) saturate(110%) brightness(95%)' },
  { id: 'dramatic', label: 'Drama', css: 'contrast(150%) brightness(85%) saturate(120%)' },
] as const;

export const LAYOUTS: Record<LayoutKey, LayoutDef> = {
  strip3: { count: 3, cols: 1, rows: 3 },
  strip4: { count: 4, cols: 1, rows: 4 },
  grid2x2: { count: 4, cols: 2, rows: 2 },
  single: { count: 1, cols: 1, rows: 1 },
};

export const FRAME_BG_PRESETS = [
  { type: 'solid' as const, val: '#ffffff', style: { background: '#fff' } },
  { type: 'solid' as const, val: '#0a0a0a', style: { background: '#0a0a0a' } },
  { type: 'gradient' as const, val: '#ff9a9e,#fecfef', style: { background: 'linear-gradient(135deg, #ff9a9e, #fecfef)' } },
  { type: 'gradient' as const, val: '#a18cd1,#fbc2eb', style: { background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' } },
  { type: 'gradient' as const, val: '#84fab0,#8fd3f4', style: { background: 'linear-gradient(135deg, #84fab0, #8fd3f4)' } },
  { type: 'gradient' as const, val: '#ffecd2,#fcb69f', style: { background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' } },
  { type: 'gradient' as const, val: '#4facfe,#00f2fe', style: { background: 'linear-gradient(135deg, #4facfe, #00f2fe)' } },
  { type: 'gradient' as const, val: '#f6d365,#fda085', style: { background: 'linear-gradient(135deg, #f6d365, #fda085)' } },
  { type: 'gradient' as const, val: '#30cfd0,#330867', style: { background: 'linear-gradient(135deg, #30cfd0, #330867)' } },
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

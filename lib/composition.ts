import { RoomState, LAYOUTS, LayoutKey } from './types';

const BORDER_DEFS: Record<string, {
  frame: string; accent: string; accentSoft: string;
  symbol: string; symbol2: string; symbol3: string; symbol4: string;
}> = {
  christmas: { frame: '#c71f37', accent: '#ffd166', accentSoft: 'rgba(255,209,102,0.22)', symbol: '❄️', symbol2: '🎄', symbol3: '🎁', symbol4: '✨' },
  halloween: { frame: '#ff7b00', accent: '#f7b801', accentSoft: 'rgba(247,184,1,0.2)', symbol: '🎃', symbol2: '🕸️', symbol3: '🦇', symbol4: '👻' },
  newyear: { frame: '#00b4d8', accent: '#f8f9fa', accentSoft: 'rgba(255,255,255,0.18)', symbol: '✨', symbol2: '🎆', symbol3: '🎊', symbol4: '🎉' },
  birthday: { frame: '#ff6fa8', accent: '#ffffff', accentSoft: 'rgba(255,255,255,0.2)', symbol: '🎂', symbol2: '🎈', symbol3: '🎉', symbol4: '🧁' },
  romantic: { frame: '#ff5d8f', accent: '#ffffff', accentSoft: 'rgba(255,255,255,0.18)', symbol: '💖', symbol2: '🌹', symbol3: '💌', symbol4: '💕' },
  summer: { frame: '#00c2ff', accent: '#ffffff', accentSoft: 'rgba(255,255,255,0.16)', symbol: '☀️', symbol2: '🌴', symbol3: '🏖️', symbol4: '🍍' },
  sakura: { frame: '#ffb7b2', accent: '#ffffff', accentSoft: 'rgba(255,183,178,0.2)', symbol: '🌸', symbol2: '🍡', symbol3: '🌸', symbol4: '✨' },
  galaxy: { frame: '#8a2be2', accent: '#00ffff', accentSoft: 'rgba(138,43,226,0.2)', symbol: '🌌', symbol2: '⭐', symbol3: '🚀', symbol4: '🪐' },
  retro: { frame: '#ff006e', accent: '#ffbe0b', accentSoft: 'rgba(255,190,11,0.2)', symbol: '📼', symbol2: '🕹️', symbol3: '📟', symbol4: '💾' },
  nature: { frame: '#2d6a4f', accent: '#95d5b2', accentSoft: 'rgba(149,213,178,0.2)', symbol: '🌿', symbol2: '🌻', symbol3: '🦋', symbol4: '🌺' },
  magic: { frame: '#7b2d8b', accent: '#e040fb', accentSoft: 'rgba(224,64,251,0.2)', symbol: '🔮', symbol2: '⚡', symbol3: '🌙', symbol4: '🦄' },
};

function parseGradient(val: string): [string, string] {
  const parts = val.split(',');
  return [parts[0]?.trim() || '#ffffff', parts[1]?.trim() || '#ffffff'];
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgRatio = img.width / img.height;
  const slotRatio = w / h;
  let sWidth = img.width;
  let sHeight = img.height;
  let sx = 0;
  let sy = 0;

  if (imgRatio > slotRatio) {
    sWidth = img.height * slotRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / slotRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frameBg: RoomState['frameBg']
) {
  if (frameBg.type === 'solid') {
    ctx.fillStyle = frameBg.val;
    ctx.fillRect(0, 0, w, h);
  } else if (frameBg.type === 'gradient') {
    const [c1, c2] = parseGradient(frameBg.val);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (frameBg.type === 'pattern') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    if (frameBg.val === 'polka') {
      ctx.fillStyle = 'rgba(255, 0, 127, 0.3)';
      const dotR = 6, spacing = 24;
      for (let py = spacing / 2; py < h; py += spacing) {
        for (let px = spacing / 2; px < w; px += spacing) {
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (frameBg.val === 'grid') {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      const gs = 24;
      for (let gx = 0; gx < w; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    } else if (frameBg.val === 'check') {
      const cs = 20;
      for (let cy = 0; cy < h; cy += cs) {
        for (let cx = 0; cx < w; cx += cs) {
          ctx.fillStyle = ((Math.floor(cy / cs) + Math.floor(cx / cs)) % 2 === 0) ? '#ffffff' : '#f0f0f0';
          ctx.fillRect(cx, cy, cs, cs);
        }
      }
    }
  }
}

function drawPhotoSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number, y: number, w: number, h: number,
  border: string,
  filter: string
) {
  ctx.save();

  if (border === 'polaroid') {
    const padH = Math.round(w * 0.06);
    const padV = Math.round(w * 0.06);
    const botPad = Math.round(w * 0.22);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    drawRoundedRect(ctx, x - padH, y - padV, w + padH * 2, h + padV + botPad, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (img) {
      ctx.save();
      drawRoundedRect(ctx, x, y, w, h, 2);
      ctx.clip();
      ctx.filter = filter;
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
  } else if (border === 'film') {
    const sprW = Math.round(w * 0.075);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - sprW, y, sprW, h);
    ctx.fillRect(x + w, y, sprW, h);
    const hCount = Math.floor(h / 20);
    ctx.fillStyle = '#f5f0e8';
    for (let i = 0; i < hCount; i++) {
      const sy = y + (h / hCount) * i + 4;
      ctx.fillRect(x - sprW + 3, sy, sprW - 6, 10);
      ctx.fillRect(x + w + 3, sy, sprW - 6, 10);
    }
    if (img) {
      ctx.save();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.filter = filter;
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
  } else if (border === 'neon') {
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
    if (img) {
      ctx.save();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.filter = filter;
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
  } else {
    if (img) {
      ctx.save();
      ctx.filter = filter;
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, w, h);
    }
  }

  ctx.restore();
}

function drawSpecialBorder(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  border: string
) {
  const preset = BORDER_DEFS[border];
  if (!preset) return;

  ctx.save();

  const bw = Math.round(Math.min(w, h) * 0.03);
  ctx.strokeStyle = preset.frame;
  ctx.lineWidth = bw * 2;
  ctx.strokeRect(0, 0, w, h);

  const cr = bw * 2.5;
  const corners = [[cr, cr], [w - cr, cr], [cr, h - cr], [w - cr, h - cr]];
  ctx.fillStyle = preset.accent;
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  const emojis = [preset.symbol, preset.symbol2, preset.symbol3, preset.symbol4];
  ctx.font = `${bw * 2.5}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const count = Math.floor(w / (bw * 6));
  for (let i = 0; i < count; i++) {
    const ex = (w / (count + 1)) * (i + 1);
    const em = emojis[i % emojis.length];
    ctx.fillText(em, ex, bw);
    ctx.fillText(em, ex, h - bw);
  }

  ctx.restore();
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, showDate: boolean,
  frameBg: RoomState['frameBg']
) {
  const isLight = frameBg.type === 'solid' && (
    frameBg.val === '#ffffff' ||
    parseInt(frameBg.val.slice(1, 3), 16) > 180
  );
  ctx.fillStyle = isLight ? '#333' : '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const footerY = h - Math.round(h * 0.035);

  if (text) {
    ctx.font = `bold ${Math.round(h * 0.022)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(text, w / 2, footerY - (showDate ? Math.round(h * 0.015) : 0));
  }

  if (showDate) {
    ctx.font = `${Math.round(h * 0.016)}px Plus Jakarta Sans, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.fillText(
      new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      w / 2,
      footerY + (text ? Math.round(h * 0.015) : 0)
    );
    ctx.globalAlpha = 1;
  }
}

interface ComposeOptions {
  myPhotos: string[];
  partnerPhotos: string[];
  state: RoomState;
  canvas: HTMLCanvasElement;
}

export async function composeDuoPhoto(opts: ComposeOptions): Promise<void> {
  const { myPhotos, partnerPhotos, state, canvas } = opts;
  const layout = LAYOUTS[state.layout as LayoutKey] || LAYOUTS.strip3;
  const count = layout.count;

  const PHOTO_W = 480;
  const PHOTO_H = 360;
  const MARGIN = 16;
  const FOOTER_H = Math.round(PHOTO_H * 0.08);
  const TOP_PAD = MARGIN;

  const cols = layout.cols;
  const rows = layout.rows;

  const cellW = PHOTO_W;
  const cellH = PHOTO_H;
  const totalW = (cellW + MARGIN) * cols * 2 + MARGIN;
  const totalH = TOP_PAD + (cellH + MARGIN) * rows + FOOTER_H;

  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d')!;

  drawBackground(ctx, totalW, totalH, state.frameBg);

  const loadImg = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(new Image());
      img.src = url;
    });

  const myImgs = await Promise.all(myPhotos.slice(0, count).map(u => loadImg(u)));
  const partnerImgs = await Promise.all(partnerPhotos.slice(0, count).map(u => loadImg(u)));

  const filter = getCombinedFilter(state);

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const myX = MARGIN + col * (cellW * 2 + MARGIN * 2 + MARGIN);
    const partnerX = myX + cellW + MARGIN;
    const cellY = TOP_PAD + row * (cellH + MARGIN);

    drawPhotoSlot(ctx, myImgs[i] || null, myX, cellY, cellW, cellH, state.photoBorder, filter);
    drawPhotoSlot(ctx, partnerImgs[i] || null, partnerX, cellY, cellW, cellH, state.photoBorder, filter);
  }

  if (BORDER_DEFS[state.photoBorder]) {
    drawSpecialBorder(ctx, totalW, totalH, state.photoBorder);
  }

  drawFooter(ctx, totalW, totalH, state.customText, state.showDate, state.frameBg);
}

export async function composePreview(opts: ComposeOptions): Promise<void> {
  await composeDuoPhoto(opts);
}

export function getCombinedFilter(state: RoomState): string {
  const { b, c, s, w } = state.adj;
  const adjCSS = `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${w}%)`;
  if (!state.colorCSS || state.colorCSS === 'none') return adjCSS;
  return `${adjCSS} ${state.colorCSS}`;
}

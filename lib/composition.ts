import { RoomState, LAYOUTS, LayoutKey, FRAME_BG_PRESETS } from './types';

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


function normalizeHex(color: string): string | null {
  const value = color.trim();
  const short = value.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    return `#${short[1].split('').map(char => char + char).join('')}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toLowerCase();
  }
  return null;
}

function hexToRgb(color: string) {
  const hex = normalizeHex(color);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function mixColor(color: string, target: string, amount: number) {
  const from = hexToRgb(color) || hexToRgb('#ffffff')!;
  const to = hexToRgb(target) || hexToRgb('#ffffff')!;
  const mix = Math.max(0, Math.min(1, amount));
  const r = Math.round(from.r + (to.r - from.r) * mix);
  const g = Math.round(from.g + (to.g - from.g) * mix);
  const b = Math.round(from.b + (to.b - from.b) * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

function colorLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 1;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function getFrameColors(frameBg: RoomState['frameBg']): [string, string] {
  if (frameBg.type === 'gradient') {
    return parseGradient(frameBg.val);
  }
  if (frameBg.type === 'solid') {
    return [frameBg.val, frameBg.val];
  }
  if (frameBg.val === 'denim') return ['#1e3799', '#4a69bd'];
  if (frameBg.val === 'clouds') return ['#a1c4fd', '#c2e9fb'];
  if (frameBg.val === 'y2k_check') return ['#ff4757', '#2ed573'];
  if (frameBg.val === 'check') return ['#1a1a2e', '#f0f0f0'];
  if (frameBg.val === 'polka') return ['#ffffff', '#ff007f'];
  return ['#f8fafc', '#e5e7eb'];
}

function isBrightFrame(frameBg: RoomState['frameBg']) {
  const [start, end] = getFrameColors(frameBg);
  return colorLuminance(start) > 0.9 && colorLuminance(end) > 0.9;
}

function getFramePalette(frameBg: RoomState['frameBg'], border: string) {
  const borderDef = BORDER_DEFS[border];
  const [frameStart, frameEnd] = getFrameColors(frameBg);
  const base = borderDef?.frame || frameStart;
  const accent = borderDef?.accent || frameEnd;
  const neutralBase = isBrightFrame(frameBg) && !borderDef ? '#dbe4f0' : base;
  const neutralAccent = isBrightFrame(frameBg) && !borderDef ? '#f2c7d8' : accent;

  return {
    backgroundStart: mixColor(neutralBase, '#ffffff', borderDef ? 0.82 : 0.65),
    backgroundEnd: mixColor(neutralAccent, '#ffffff', borderDef ? 0.72 : 0.52),
    paper: mixColor(neutralBase, '#ffffff', 0.9),
    line: mixColor(neutralBase, '#111827', 0.18),
    slots: [
      mixColor(neutralBase, '#ffffff', 0.76),
      mixColor(neutralAccent, '#ffffff', 0.7),
      mixColor(neutralBase, '#f8fafc', 0.58),
      mixColor(neutralAccent, '#fff7ed', 0.62),
      mixColor(neutralBase, '#e0f2fe', 0.68),
      mixColor(neutralAccent, '#fce7f3', 0.68),
    ],
  };
}

function drawThemedBackground(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frameBg: RoomState['frameBg'],
  border: string
) {
  const borderDef = BORDER_DEFS[border];
  const palette = getFramePalette(frameBg, border);

  if (borderDef || isBrightFrame(frameBg)) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, palette.backgroundStart);
    grad.addColorStop(0.55, palette.paper);
    grad.addColorStop(1, palette.backgroundEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = borderDef ? 0.22 : 0.18;
    ctx.fillStyle = borderDef?.accentSoft || 'rgba(255,255,255,0.5)';
    const band = Math.max(80, Math.round(Math.min(w, h) * 0.08));
    for (let x = -h; x < w + h; x += band * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + band, 0);
      ctx.lineTo(x + h + band, h);
      ctx.lineTo(x + h, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return palette;
  }

  drawBackground(ctx, w, h, frameBg);
  return palette;
}

function getSlotFill(palette: ReturnType<typeof getFramePalette>, index: number) {
  return palette.slots[index % palette.slots.length];
}

function drawSlotBase(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string,
  stroke: string,
  radius = 8
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.14)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = fill;
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
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
      const cs = 40;
      for (let cy = 0; cy < h; cy += cs) {
        for (let cx = 0; cx < w; cx += cs) {
          ctx.fillStyle = ((Math.floor(cy / cs) + Math.floor(cx / cs)) % 2 === 0) ? '#1a1a2e' : '#f0f0f0';
          ctx.fillRect(cx, cy, cs, cs);
        }
      }
    } else if (frameBg.val === 'y2k_check') {
      const cs = 60;
      for (let cy = 0; cy < h; cy += cs) {
        for (let cx = 0; cx < w; cx += cs) {
          ctx.fillStyle = ((Math.floor(cy / cs) + Math.floor(cx / cs)) % 2 === 0) ? '#ff4757' : '#2ed573';
          ctx.fillRect(cx, cy, cs, cs);
        }
      }
    } else if (frameBg.val === 'denim') {
      ctx.fillStyle = '#1e3799';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 2000; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.setLineDash([]);
    } else if (frameBg.val === 'clouds') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#a1c4fd');
      grad.addColorStop(1, '#c2e9fb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const drawCloud = (cx: number, cy: number, scale: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 25 * scale, cy - 10 * scale, 35 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 50 * scale, cy, 25 * scale, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(100, 200, 1.5);
      drawCloud(400, 600, 2);
      drawCloud(150, 1000, 1.2);
      drawCloud(450, 1400, 1.8);
    }
  }
}

function drawPhotoSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number, y: number, w: number, h: number,
  border: string,
  fill: string,
  stroke: string,
  paper: string
) {
  ctx.save();

  if (border === 'polaroid') {
    const padH = Math.round(w * 0.06);
    const padV = Math.round(w * 0.06);
    const botPad = Math.round(w * 0.22);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = paper;
    drawRoundedRect(ctx, x - padH, y - padV, w + padH * 2, h + padV + botPad, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (img) {
      ctx.save();
      drawRoundedRect(ctx, x, y, w, h, 2);
      ctx.clip();
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
  } else if (border === 'film') {
    const sprW = Math.round(w * 0.075);
    drawSlotBase(ctx, x, y, w, h, fill, stroke, 8);
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
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
  } else if (border === 'neon') {
    drawSlotBase(ctx, x, y, w, h, fill, stroke, 8);
    if (img) {
      ctx.save();
      ctx.rect(x, y, w, h);
      ctx.clip();
      drawImageCover(ctx, img, x, y, w, h);
      ctx.restore();
    }
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
  } else {
    const pad = Math.max(8, Math.round(Math.min(w, h) * 0.025));
    drawSlotBase(ctx, x, y, w, h, fill, stroke, 8);
    if (img) {
      ctx.save();
      drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 5);
      ctx.clip();
      drawImageCover(ctx, img, x + pad, y + pad, w - pad * 2, h - pad * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 5);
      ctx.fill();
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

  const bw = Math.round(Math.min(w, h) * 0.015);
  ctx.strokeStyle = preset.frame;
  ctx.lineWidth = bw * 2;
  ctx.strokeRect(0, 0, w, h);

  const emojis = [preset.symbol, preset.symbol2, preset.symbol3, preset.symbol4];
  ctx.font = `${bw * 3}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const pad = bw * 2;
  const positions = [
    [pad, pad],
    [w - pad, pad],
    [pad, h - pad],
    [w - pad, h - pad]
  ];
  
  positions.forEach(([ex, ey], i) => {
    const em = emojis[i % emojis.length];
    ctx.fillText(em, ex, ey);
  });

  ctx.restore();
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, showDate: boolean,
  frameBg: RoomState['frameBg'],
  footerH: number
) {
  const preset = FRAME_BG_PRESETS.find(p => p.val === frameBg.val && p.type === frameBg.type);
  const textColor = preset?.textColor || frameBg.textColor || '#ffffff';
  
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = textColor === '#111' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;

  const footerCenterY = h - (footerH / 2) - Math.round(footerH * 0.08);

  if (text) {
    ctx.font = `italic ${Math.round(footerH * 0.35)}px 'Playfair Display', serif`;
    const textY = showDate ? footerCenterY - Math.round(footerH * 0.15) : footerCenterY;
    ctx.fillText(text, w / 2, textY);
  }

  if (showDate) {
    ctx.font = `600 ${Math.round(footerH * 0.18)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.globalAlpha = 0.5;
    ctx.fillText(
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      w / 2,
      footerCenterY + (text ? Math.round(footerH * 0.22) : 0)
    );
    ctx.globalAlpha = 1.0;
  }

  ctx.shadowBlur = 0;
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
  const FOOTER_H = 140;
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

  const palette = drawThemedBackground(ctx, totalW, totalH, state.frameBg, state.photoBorder);

  const loadImg = (url: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const myImgs = await Promise.all(myPhotos.slice(0, count).map(u => loadImg(u)));
  const partnerImgs = await Promise.all(partnerPhotos.slice(0, count).map(u => loadImg(u)));


  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const myX = MARGIN + col * (cellW * 2 + MARGIN * 2 + MARGIN);
    const partnerX = myX + cellW + MARGIN;
    const cellY = TOP_PAD + row * (cellH + MARGIN);

    drawPhotoSlot(ctx, myImgs[i] || null, myX, cellY, cellW, cellH, state.photoBorder, getSlotFill(palette, i * 2), palette.line, palette.paper);
    drawPhotoSlot(ctx, partnerImgs[i] || null, partnerX, cellY, cellW, cellH, state.photoBorder, getSlotFill(palette, i * 2 + 1), palette.line, palette.paper);
  }

  if (BORDER_DEFS[state.photoBorder]) {
    drawSpecialBorder(ctx, totalW, totalH, state.photoBorder);
  }

  drawFooter(ctx, totalW, totalH, state.customText, state.showDate, state.frameBg, FOOTER_H);
}

export async function composePreview(opts: ComposeOptions): Promise<void> {
  await composeDuoPhoto(opts);
}



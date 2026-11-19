// Solmar Cover Studio — the cover renderer. Draws a multi-panel GTA-style poster
// (all art original, no Rockstar assets) onto any canvas at any export size.
// Layouts, colour grades, lettering, halftone, ribbon badge, star heat meter,
// grain and vignette all live here; the editor in main.js only feeds it state.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#ff7a3d', '#ff2e63', '#7b2ff7'],
    tint: 'rgba(255, 94, 60, 0.28)',
    deep: 'rgba(90, 10, 90, 0.55)',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon Nights',
    sky: ['#00f5d4', '#ff2e9a', '#7b2ff7'],
    tint: 'rgba(0, 245, 212, 0.20)',
    deep: 'rgba(10, 10, 60, 0.55)',
    accent: '#00f5d4',
  },
  tealOrange: {
    label: 'Teal & Orange',
    sky: ['#ff9a3d', '#0f766e', '#123332'],
    tint: 'rgba(255, 140, 40, 0.22)',
    deep: 'rgba(6, 60, 64, 0.55)',
    accent: '#ffb703',
  },
  magentaDusk: {
    label: 'Magenta Dusk',
    sky: ['#ff5ea8', '#b5179e', '#3a0ca3'],
    tint: 'rgba(255, 60, 160, 0.26)',
    deep: 'rgba(58, 12, 163, 0.55)',
    accent: '#ff8fab',
  },
  goldenHour: {
    label: 'Golden Hour',
    sky: ['#ffd166', '#f4845f', '#8d0801'],
    tint: 'rgba(255, 190, 60, 0.26)',
    deep: 'rgba(120, 30, 0, 0.45)',
    accent: '#fff3b0',
  },
  palmNoir: {
    label: 'Palm Noir',
    sky: ['#e0fbfc', '#98c1d9', '#293241'],
    tint: 'rgba(160, 200, 220, 0.18)',
    deep: 'rgba(10, 20, 35, 0.60)',
    accent: '#e0fbfc',
  },
};

export const LAYOUTS = {
  grid9: { label: 'Nine Grid', panels: nineGrid },
  heroThree: { label: 'Hero + Three', panels: heroThree },
  fullBleed: { label: 'Full Bleed', panels: fullBleed },
  tilted: { label: 'Tilted Snapshots', panels: tilted },
  fourPanel: { label: 'Four Panel', panels: fourPanel },
};

function nineGrid(w, h) {
  const g = w * 0.012;
  const cw = (w - g * 4) / 3;
  const ch = (h - g * 4) / 3;
  const out = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
    }
  }
  return out;
}

function heroThree(w, h) {
  const g = w * 0.012;
  const heroW = w * 0.60 - g;
  const sideX = heroW + g * 2;
  const sideW = w - sideX - g;
  const ch = (h - g * 4) / 3;
  return [
    { x: g, y: g, w: heroW, h: h - g * 2, rot: 0 },
    { x: sideX, y: g, w: sideW, h: ch, rot: 0 },
    { x: sideX, y: g * 2 + ch, w: sideW, h: ch, rot: 0 },
    { x: sideX, y: g * 3 + ch * 2, w: sideW, h: ch, rot: 0 },
  ];
}

function fullBleed(w, h) {
  return [{ x: 0, y: 0, w, h, rot: 0 }];
}

function tilted(w, h) {
  const pw = w * 0.46;
  const ph = h * 0.56;
  return [
    { x: w * 0.05, y: h * 0.06, w: pw, h: ph, rot: -0.06 },
    { x: w * 0.49, y: h * 0.10, w: pw, h: ph, rot: 0.05 },
    { x: w * 0.27, y: h * 0.40, w: pw, h: ph, rot: -0.02 },
  ];
}

function fourPanel(w, h) {
  const g = w * 0.014;
  const cw = (w - g * 3) / 2;
  const ch = (h - g * 3) / 2;
  return [
    { x: g, y: g, w: cw, h: ch, rot: 0 },
    { x: g * 2 + cw, y: g, w: cw, h: ch, rot: 0 },
    { x: g, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
    { x: g * 2 + cw, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
  ];
}

// A small reusable noise tile for film grain, built once per page load.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const data = g.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 155);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  grainTile = c;
  return c;
}

function drawPanelPhoto(ctx, photo, rect, crop) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (crop?.zoom ?? 1);
  const pw = iw * scale;
  const ph = ih * scale;
  const cx = rect.x + rect.w / 2 + (crop?.dx ?? 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (crop?.dy ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function drawHalftoneStrip(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const r = Math.max(2, h * 0.16);
  const step = r * 2.6;
  for (let yy = y + r; yy < y + h; yy += step) {
    for (let xx = x + r; xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, r * (0.5 + 0.5 * Math.sin(xx * 0.05)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, x, y, r, filled, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? color : 'rgba(255,255,255,0.25)';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRibbon(ctx, w, h, grade, text) {
  const bw = w * 0.34;
  const bh = h * 0.055;
  ctx.save();
  // Band runs diagonally across the top-right corner: it meets the top edge
  // at x = w - bw/2 and the right edge at y = bw/2, centred between them.
  ctx.translate(w - bw / 4, bw / 4);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = '#14061f';
  ctx.font = `900 ${Math.round(bh * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, bh * 0.06);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** Draws the whole cover. `state` carries layout, grade, title, subtitle, heat,
 *  photos (Image list), crops (per-panel {photo, zoom, dx, dy}) and badge text. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.heroThree;

  // Backdrop: sunset sky gradient so gaps and tilted layouts read as poster, not void.
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rects = layout.panels(w, h);
  const photos = state.photos ?? [];
  rects.forEach((rect, i) => {
    const crop = state.crops?.[i] ?? { photo: i % Math.max(1, photos.length), zoom: 1, dx: 0, dy: 0 };
    const photo = photos[crop.photo] ?? photos[0] ?? null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      rect = { x: 0, y: 0, w: rect.w, h: rect.h };
    }
    // White poster border + drop shadow per panel.
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = w * 0.02;
    ctx.shadowOffsetY = w * 0.008;
    ctx.fillStyle = '#ffffff';
    const bw = Math.max(3, w * 0.006);
    ctx.fillRect(rect.x - bw, rect.y - bw, rect.w + bw * 2, rect.h + bw * 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    if (photo) drawPanelPhoto(ctx, photo, rect, crop);
    else {
      ctx.fillStyle = grade.deep;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // Per-panel grade wash so every photo shares one colour world.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // Unifying deep wash + vignette over the whole poster.
  const wash = ctx.createLinearGradient(0, h * 0.25, 0, h);
  wash.addColorStop(0, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.deep);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Film grain.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Halftone title block across the foot.
  const blockH = h * (state.layout === 'fullBleed' ? 0.30 : 0.20);
  const blockY = h - blockH;
  ctx.fillStyle = 'rgba(12, 4, 22, 0.88)';
  ctx.fillRect(0, blockY, w, blockH);
  drawHalftoneStrip(ctx, 0, blockY - h * 0.012, w, h * 0.012, grade.accent);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, blockY, w, Math.max(3, h * 0.006));

  // Title in Anton, subtitle in Pacifico script.
  const title = (state.title ?? '').trim().toUpperCase() || 'SOLMAR BAY';
  const pad = w * 0.045;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleSize = fitFont(ctx, title, w - pad * 2, Math.round(blockH * 0.52), 'Anton, sans-serif');
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.shadowOffsetY = titleSize * 0.05;
  ctx.fillText(title, pad, blockY + blockH * 0.58);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const sub = (state.subtitle ?? '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, w - pad * 2, Math.round(blockH * 0.30), 'Pacifico, cursive');
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, pad, blockY + blockH * 0.90);
  }

  // Star heat meter, bottom-right of the title block.
  const heat = Math.max(0, Math.min(5, state.heat ?? 4));
  const starR = Math.max(7, h * 0.016);
  const gap = starR * 2.4;
  const totalW = gap * 4 + starR * 2;
  const startX = w - pad - totalW + starR;
  const starY = blockY + blockH * 0.24;
  ctx.font = `700 ${Math.round(starR * 1.1)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'right';
  ctx.fillText('HEAT', w - pad, blockY + blockH * 0.16);
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, startX + i * gap, starY + starR * 1.6, starR, i < heat, grade.accent);
  }

  // Ribbon badge, top-right corner.
  if (state.badge) drawRibbon(ctx, w, h, grade, state.badge);
}

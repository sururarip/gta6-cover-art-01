// Solmar Cover Studio — wires the editor: photo uploads, sample photos, layout and
// grade pickers, per-panel crop (drag + zoom), caption editing, undo/redo, live
// preview and PNG export. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js).
import { drawCover, GRADES, LAYOUTS } from './cover.js';
import { createHistory, defaultState, loadFonts, loadImage, SIZES } from './state.js';
import { runShot } from './shots.js';

const state = defaultState();
const history = createHistory(state);
const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelList = document.getElementById('panels');
let selectedPanel = 0;
let fontsReady = false;

function resizeCanvasToSize() {
  const size = SIZES[state.size] ?? SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  resizeCanvasToSize();
  drawCover(canvas, state);
  syncPanelList();
  document.getElementById('undo').disabled = !history.canUndo;
  document.getElementById('redo').disabled = !history.canRedo;
}

function commitAndRedraw() {
  history.commit();
  redraw();
}

function setStatus(text) {
  status.textContent = text;
}

/** Rebuilds the per-panel strip: each panel shows its photo and crop controls.
 *  Rebuilt only when the panel set changes, so dragging a slider never loses it. */
let panelSig = '';
function syncPanelList() {
  const sig = state.layout + '|' + state.photos.map((p) => p.name).join(',') + '|' + selectedPanel + '|' + (state.crops ?? []).map((c) => c.photo).join(',');
  if (sig === panelSig) return;
  panelSig = sig;
  const rects = (LAYOUTS[state.layout] ?? LAYOUTS.heroThree).panels(100, 100);
  panelList.innerHTML = '';
  rects.forEach((_, i) => {
    const crop = state.crops[i] ?? { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const item = document.createElement('div');
    item.className = 'panel-item' + (i === selectedPanel ? ' selected' : '');
    const photoName = state.photos[crop.photo]?.name ?? '—';
    item.innerHTML =
      `<button type="button" class="panel-pick" data-panel="${i}">Panel ${i + 1} · ${photoName}</button>` +
      `<label>Photo <select data-field="photo" data-panel="${i}">${state.photos
        .map((p, pi) => `<option value="${pi}"${pi === crop.photo ? ' selected' : ''}>${p.name}</option>`)
        .join('')}</select></label>` +
      `<label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${crop.zoom}" data-field="zoom" data-panel="${i}"></label>` +
      `<label>Left–right <input type="range" min="-0.4" max="0.4" step="0.02" value="${crop.dx}" data-field="dx" data-panel="${i}"></label>` +
      `<label>Up–down <input type="range" min="-0.4" max="0.4" step="0.02" value="${crop.dy}" data-field="dy" data-panel="${i}"></label>`;
    panelList.appendChild(item);
  });
}

panelList.addEventListener('click', (e) => {
  const pick = e.target.closest('.panel-pick');
  if (!pick) return;
  selectedPanel = Number(pick.dataset.panel);
  redraw();
});

panelList.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  const i = Number(e.target.dataset.panel);
  const crop = (state.crops[i] ??= { photo: 0, zoom: 1, dx: 0, dy: 0 });
  crop[field] = field === 'photo' ? Number(e.target.value) : Number(e.target.value);
  redraw();
});
panelList.addEventListener('change', commitAndRedraw);

// Drag on the preview moves the selected panel's photo; wheel zooms it.
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  dragging = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const crop = (state.crops[selectedPanel] ??= { photo: 0, zoom: 1, dx: 0, dy: 0 });
  crop.dx = Math.max(-0.4, Math.min(0.4, crop.dx + ((e.clientX - dragging.x) / rect.width) * 0.6));
  crop.dy = Math.max(-0.4, Math.min(0.4, crop.dy + ((e.clientY - dragging.y) / rect.height) * 0.6));
  dragging = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging) {
    dragging = null;
    commitAndRedraw();
  }
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const crop = (state.crops[selectedPanel] ??= { photo: 0, zoom: 1, dx: 0, dy: 0 });
  crop.zoom = Math.max(1, Math.min(2.5, crop.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  redraw();
  commitAndRedraw();
}, { passive: false });

// Layout, grade and size pickers.
function buildPicker(id, entries, current, onPick) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  Object.entries(entries).forEach(([key, value]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = value.label;
    b.dataset.key = key;
    b.className = key === current ? 'picked' : '';
    b.addEventListener('click', () => {
      onPick(key);
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('picked', x.dataset.key === key));
    });
    el.appendChild(b);
  });
}
buildPicker('layouts', LAYOUTS, state.layout, (key) => {
  state.layout = key;
  selectedPanel = 0;
  commitAndRedraw();
});
buildPicker('grades', GRADES, state.grade, (key) => {
  state.grade = key;
  commitAndRedraw();
});
buildPicker('sizes', SIZES, state.size, (key) => {
  state.size = key;
  commitAndRedraw();
});

// Caption, badge, heat.
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
const heatInput = document.getElementById('heat');
titleInput.addEventListener('input', () => {
  state.title = titleInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});
badgeInput.addEventListener('input', () => {
  state.badge = badgeInput.value;
  redraw();
});
heatInput.addEventListener('input', () => {
  state.heat = Number(heatInput.value);
  redraw();
});
[titleInput, subtitleInput, badgeInput, heatInput].forEach((el) => el.addEventListener('change', commitAndRedraw));

// Undo / redo.
document.getElementById('undo').addEventListener('click', () => {
  if (history.undo()) {
    syncInputs();
    redraw();
  }
});
document.getElementById('redo').addEventListener('click', () => {
  if (history.redo()) {
    syncInputs();
    redraw();
  }
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (history.undo()) {
      syncInputs();
      redraw();
    }
  }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault();
    if (history.redo()) {
      syncInputs();
      redraw();
    }
  }
});

function syncInputs() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  badgeInput.value = state.badge;
  heatInput.value = String(state.heat);
}

// Photo uploads (many at once) and sample photos.
async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  img.name = file.name.replace(/\.[^.]+$/, '');
  state.photos.push(img);
  return img;
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const file of files) await addPhotoFile(file);
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — pick a panel to place each one.`);
  commitAndRedraw();
});

document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', async () => {
    const img = await loadImage(`samples/${button.dataset.sample}.jpg`);
    img.name = button.dataset.sample;
    state.photos.push(img);
    setStatus(`Sample “${button.dataset.sample}” loaded.`);
    commitAndRedraw();
  });
});

// Export the cover at the chosen size.
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size] ?? SIZES.square;
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `solmar-cover-${size.w}x${size.h}.png`;
    a.click();
    setStatus(`Saved solmar-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
});

// Fill from one photo, or spread many photos across the panels.
document.getElementById('fill-one').addEventListener('click', () => {
  const rects = (LAYOUTS[state.layout] ?? LAYOUTS.heroThree).panels(100, 100);
  state.crops = rects.map(() => ({ photo: 0, zoom: 1, dx: 0, dy: 0 }));
  commitAndRedraw();
  setStatus('One photo fills every panel.');
});
document.getElementById('fill-many').addEventListener('click', () => {
  const rects = (LAYOUTS[state.layout] ?? LAYOUTS.heroThree).panels(100, 100);
  const n = Math.max(1, state.photos.length);
  state.crops = rects.map((_, i) => ({ photo: i % n, zoom: 1, dx: 0, dy: 0 }));
  commitAndRedraw();
  setStatus('Photos spread across the panels.');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  loadFonts().then(() => {
    fontsReady = true;
    runShot(shot, new URLSearchParams(location.search), state, redraw, loadImage);
  });
} else {
  loadFonts().then(() => {
    fontsReady = true;
    redraw();
  });
  redraw();
}

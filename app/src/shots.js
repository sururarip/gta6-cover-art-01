// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, filling the viewport. `photos` is a
// comma list of sample names, `layout`, `grade`, `size`, `title`, `subtitle`,
// `heat` and `badge` set the cover. window.__shotReady is set once painted.
export async function runShot(shot, query, state, redraw, loadImage) {
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const names = (query.get('photos') ?? query.get('photo') ?? 'pier').split(',').map((s) => s.trim()).filter(Boolean);
  state.photos = [];
  for (const name of names) {
    const img = await loadImage(`samples/${name}.jpg`);
    img.name = name;
    state.photos.push(img);
  }

  state.layout = query.get('layout') ?? 'heroThree';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? 'wide';
  state.title = query.get('title') ?? query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'a Solmar Bay story';
  state.heat = Number(query.get('heat') ?? 4);
  state.badge = query.get('badge') ?? 'Solmar Bay';

  const n = Math.max(1, state.photos.length);
  const panelCount = { grid9: 9, heroThree: 4, fullBleed: 1, tilted: 3, fourPanel: 4 }[state.layout] ?? 4;
  state.crops = Array.from({ length: panelCount }, (_, i) => ({ photo: i % n, zoom: 1, dx: 0, dy: 0 }));

  redraw();
  await document.fonts.ready.catch(() => {});
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

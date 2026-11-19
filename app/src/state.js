// Solmar Cover Studio — editor state: the cover's serialisable settings plus the
// loaded photos (Images, kept out of history snapshots) and undo/redo history.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export function defaultState() {
  return {
    layout: 'heroThree',
    grade: 'sunset',
    size: 'wide',
    title: 'Sunset Heist',
    subtitle: 'a Solmar Bay story',
    heat: 4,
    badge: 'Solmar Bay',
    photos: [],
    crops: [],
  };
}

function snapshotOf(state) {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    title: state.title,
    subtitle: state.subtitle,
    heat: state.heat,
    badge: state.badge,
    crops: state.crops,
    photoNames: state.photos.map((p) => p.name ?? ''),
  });
}

function applySnapshot(state, snap) {
  const s = JSON.parse(snap);
  state.layout = s.layout;
  state.grade = s.grade;
  state.size = s.size;
  state.title = s.title;
  state.subtitle = s.subtitle;
  state.heat = s.heat;
  state.badge = s.badge;
  state.crops = s.crops;
}

/** Undo/redo over serialisable snapshots. Photos are never reloaded by undo. */
export function createHistory(state) {
  const past = [];
  const future = [];
  let last = snapshotOf(state);
  return {
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    commit() {
      const snap = snapshotOf(state);
      if (snap === last) return;
      past.push(last);
      if (past.length > 60) past.shift();
      future.length = 0;
      last = snap;
    },
    undo() {
      if (!past.length) return false;
      future.push(last);
      last = past.pop();
      applySnapshot(state, last);
      return true;
    },
    redo() {
      if (!future.length) return false;
      past.push(last);
      last = future.pop();
      applySnapshot(state, last);
      return true;
    },
  };
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the bundled fonts (OFL, shipped under app/fonts/) before first paint. */
export async function loadFonts() {
  const faces = [
    new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)', { weight: '400' }),
    new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.ttf)', { weight: '400' }),
  ];
  await Promise.all(
    faces.map(async (f) => {
      try {
        await f.load();
        document.fonts.add(f);
      } catch {
        // Fall back to system fonts; the cover still draws.
      }
    }),
  );
  await document.fonts.ready.catch(() => {});
}

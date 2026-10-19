import { useEffect, useState } from 'react';

// Built-in stickers. Every one is a small SVG drawn for this project (viewBox 0 0 100 100): original artwork,
// no third-party images and no existing characters. They stay sharp at any size, including in the
// full-resolution export.

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 100">${body}</svg>`;

// ---------- anime / manga style: generic manga effects and chibi faces ----------
const INK = '#4A2C3A';

const polygon = (points) => points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');

// Spiky "impact" burst.
const burst = polygon(
  Array.from({ length: 32 }, (_, i) => {
    const a = (i * Math.PI) / 16 - Math.PI / 2;
    const r = i % 2 === 0 ? 47 : 30;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
  }),
);

// Radial speed lines around an empty centre.
const speedLines = Array.from({ length: 28 }, (_, i) => {
  const a = (i * Math.PI * 2) / 28;
  const inner = 24 + (i % 3) * 5;
  const p = (r) => `${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
  return `M${p(inner)}L${p(47)}`;
}).join('');

// Four-point "kira" sparkle centred on (cx, cy).
const kira = (cx, cy, r, fill) =>
  `<path d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z" fill="${fill}" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>`;

const HEART_PATH = 'M50 90C15 62 4 44 4 30C4 16 15 6 28 6C38 6 46 12 50 20C54 12 62 6 72 6C85 6 96 16 96 30C96 44 85 62 50 90Z';
const HAIR = `<path d="M8 54C2 4 98 4 92 54C88 42 80 34 72 42C66 30 54 28 48 40C42 28 28 32 24 42C18 34 10 42 8 54Z" fill="#5B21B6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
const FACE = `<circle cx="50" cy="56" r="38" fill="#FDE2CF" stroke="${INK}" stroke-width="3"/>`;
const CHEEKS = '<ellipse cx="26" cy="66" rx="8" ry="5" fill="#FDA4AF" opacity=".8"/><ellipse cx="74" cy="66" rx="8" ry="5" fill="#FDA4AF" opacity=".8"/>';

const ANIME_STICKERS = [
  {
    id: 'sweat',
    label: 'Sweat',
    group: 'anime',
    svg: svg('<path d="M50 8C50 8 22 44 22 64a28 28 0 0 0 56 0C78 44 50 8 50 8Z" fill="#7DD3FC" stroke="#0EA5E9" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="40" cy="66" rx="5" ry="9" fill="#FFFFFF" opacity=".85" transform="rotate(20 40 66)"/>'),
  },
  {
    id: 'anger',
    label: 'Anger',
    group: 'anime',
    svg: svg('<g fill="none" stroke="#EF4444" stroke-width="9" stroke-linecap="round"><path d="M10 36Q36 36 36 10"/><path d="M90 36Q64 36 64 10"/><path d="M10 64Q36 64 36 90"/><path d="M90 64Q64 64 64 90"/></g>'),
  },
  {
    id: 'blush',
    label: 'Blush',
    group: 'anime',
    svg: svg('<ellipse cx="27" cy="50" rx="21" ry="14" fill="#FDA4AF" opacity=".75"/><ellipse cx="73" cy="50" rx="21" ry="14" fill="#FDA4AF" opacity=".75"/><g stroke="#FB7185" stroke-width="3.5" stroke-linecap="round"><path d="M17 56L23 44M26 57L32 45M35 56L41 44"/><path d="M59 56L65 44M68 57L74 45M77 56L83 44"/></g>'),
  },
  {
    id: 'star-eyes',
    label: 'Star eyes',
    group: 'anime',
    svg: svg(
      `<ellipse cx="28" cy="52" rx="17" ry="24" fill="#4C1D95" stroke="${INK}" stroke-width="3"/><ellipse cx="72" cy="52" rx="17" ry="24" fill="#4C1D95" stroke="${INK}" stroke-width="3"/><circle cx="22" cy="40" r="7" fill="#fff"/><circle cx="66" cy="40" r="7" fill="#fff"/><circle cx="34" cy="62" r="3.5" fill="#fff"/><circle cx="78" cy="62" r="3.5" fill="#fff"/>${kira(50, 14, 9, '#FDE047')}${kira(90, 20, 6, '#FDE047')}`,
    ),
  },
  {
    id: 'heart-eyes',
    label: 'Heart eyes',
    group: 'anime',
    svg: svg(
      `<path transform="translate(6 24) scale(.4)" d="${HEART_PATH}" fill="#F43F5E" stroke="#BE123C" stroke-width="6" stroke-linejoin="round"/><path transform="translate(54 24) scale(.4)" d="${HEART_PATH}" fill="#F43F5E" stroke="#BE123C" stroke-width="6" stroke-linejoin="round"/>`,
    ),
  },
  {
    id: 'chibi-happy',
    label: 'Happy',
    group: 'anime',
    svg: svg(
      `${FACE}${HAIR}${CHEEKS}<path d="M28 56q8-11 16 0M56 56q8-11 16 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M42 68q8 9 16 0" fill="#FB7185" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`,
    ),
  },
  {
    id: 'chibi-shock',
    label: 'Surprised',
    group: 'anime',
    svg: svg(
      `${FACE}${HAIR}${CHEEKS}<ellipse cx="34" cy="56" rx="8" ry="10" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="66" cy="56" rx="8" ry="10" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="34" cy="57" r="3.5" fill="${INK}"/><circle cx="66" cy="57" r="3.5" fill="${INK}"/><ellipse cx="50" cy="75" rx="5" ry="7" fill="#FB7185" stroke="${INK}" stroke-width="3"/><path d="M86 22Q92 36 86 42" fill="none" stroke="#7DD3FC" stroke-width="5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: 'neko',
    label: 'Neko ears',
    group: 'anime',
    svg: svg(
      '<path d="M18 74Q50 40 82 74" fill="none" stroke="#1F2937" stroke-width="7" stroke-linecap="round"/><path d="M16 64L20 22L46 50Z" fill="#1F2937" stroke="#1F2937" stroke-width="3" stroke-linejoin="round"/><path d="M84 64L80 22L54 50Z" fill="#1F2937" stroke="#1F2937" stroke-width="3" stroke-linejoin="round"/><path d="M24 54L26 34L40 50Z" fill="#F9A8D4"/><path d="M76 54L74 34L60 50Z" fill="#F9A8D4"/>',
    ),
  },
  {
    id: 'shock-bubble',
    label: 'Shock!',
    group: 'anime',
    svg: svg(
      `<path d="M50 8C22 8 6 24 6 42c0 12 7 22 18 28l-6 22 26-16c2 .4 4 .5 6 .5 28 0 44-16 44-34S78 8 50 8Z" fill="#FFFFFF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="44" y="20" width="12" height="28" rx="6" fill="#EF4444"/><circle cx="50" cy="60" r="7" fill="#EF4444"/>`,
    ),
  },
  {
    id: 'impact',
    label: 'Impact',
    group: 'anime',
    svg: svg(`<path d="M${burst}Z" fill="#FDE047" stroke="#EF4444" stroke-width="4" stroke-linejoin="round"/>`),
  },
  {
    id: 'speed',
    label: 'Speed lines',
    group: 'anime',
    svg: svg(`<path d="${speedLines}" fill="none" stroke="#374151" stroke-width="3.5" stroke-linecap="round"/>`),
  },
  {
    id: 'kira',
    label: 'Kira',
    group: 'anime',
    svg: svg(`${kira(40, 58, 34, '#FEF08A')}${kira(76, 24, 18, '#FFFFFF')}${kira(78, 74, 12, '#FDE047')}`),
  },
  {
    id: 'sakura',
    label: 'Sakura',
    group: 'anime',
    svg: svg(
      `<g fill="#FBCFE8" stroke="#F472B6" stroke-width="2.5" stroke-linejoin="round">${[0, 72, 144, 216, 288]
        .map((r) => `<path d="M50 52C32 40 34 8 46 10L50 16L54 10C66 8 68 40 50 52Z" transform="rotate(${r} 50 50)"/>`)
        .join('')}</g><circle cx="50" cy="50" r="6" fill="#F9A8D4" stroke="#EC4899" stroke-width="2"/>`,
    ),
  },
  {
    id: 'onigiri',
    label: 'Onigiri',
    group: 'anime',
    svg: svg(
      `<path d="M50 10C58 10 90 62 88 76C86 86 76 90 64 90H36C24 90 14 86 12 76C10 62 42 10 50 10Z" fill="#FFFFFF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M29 89L33 66H67L71 89Z" fill="#1F2937"/><circle cx="40" cy="48" r="3.5" fill="${INK}"/><circle cx="60" cy="48" r="3.5" fill="${INK}"/><ellipse cx="32" cy="55" rx="5" ry="3" fill="#FDA4AF"/><ellipse cx="68" cy="55" rx="5" ry="3" fill="#FDA4AF"/><path d="M45 55q5 5 10 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: 'ribbon',
    label: 'Ribbon',
    group: 'anime',
    svg: svg(
      '<path d="M50 50C32 22 8 28 12 50C8 72 32 78 50 50Z" fill="#F472B6" stroke="#BE185D" stroke-width="3" stroke-linejoin="round"/><path d="M50 50C68 22 92 28 88 50C92 72 68 78 50 50Z" fill="#F472B6" stroke="#BE185D" stroke-width="3" stroke-linejoin="round"/><path d="M46 56L36 90L50 80L56 92L56 58Z" fill="#EC4899" stroke="#BE185D" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="9" fill="#EC4899" stroke="#BE185D" stroke-width="3"/>',
    ),
  },
];

export const STICKERS = ANIME_STICKERS;

const STICKER_BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export const stickerLabel = (id) => STICKER_BY_ID.get(id)?.label || 'Sticker';
export const stickerUrl = (id) => {
  const s = STICKER_BY_ID.get(id);
  return s ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.svg)}` : '';
};

const cache = new Map(); // id -> Promise<HTMLImageElement>

export function loadSticker(id) {
  if (!cache.has(id)) {
    cache.set(
      id,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Sticker "${id}" could not be loaded.`));
        img.src = stickerUrl(id);
      }),
    );
  }
  return cache.get(id);
}

/** The decoded image for a sticker id (null until it is ready). */
export function useStickerImage(id) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    let live = true;
    loadSticker(id)
      .then((loaded) => live && setImg(loaded))
      .catch(() => live && setImg(null));
    return () => {
      live = false;
    };
  }, [id]);
  return img;
}

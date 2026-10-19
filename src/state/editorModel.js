// Editor data model. All coordinates and sizes are in ORIGINAL template pixels, never preview pixels.
// Defaults are derived from the uploaded template's dimensions, so nothing is tied to one template.
// Elements are free-form: the user adds as many text boxes, shapes and stickers as they like.

import { stickerLabel } from '../lib/stickers.js';

let idCounter = 0;
export function createId(prefix = 'el') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const unit = (poster) => Math.min(poster.width, poster.height);

export function createTextElement(poster, overrides = {}) {
  const fontSize = Math.max(12, Math.round(unit(poster) * 0.06));
  const width = Math.round(poster.width * 0.6);
  return {
    id: createId('text'),
    type: 'text',
    text: 'ข้อความของคุณ',
    x: Math.round((poster.width - width) / 2),
    y: Math.round(poster.height * 0.45),
    width,
    rotation: 0,
    opacity: 1,
    hidden: false,
    fontSize,
    fontFamily: 'Kanit',
    bold: true,
    italic: false,
    fill: '#ffffff',
    stroke: '#3b0a2a',
    strokeWidth: Math.max(1, Math.round(fontSize * 0.08)),
    align: 'center',
    lineHeight: 1.15,
    letterSpacing: 0,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: Math.round(fontSize * 0.25),
    ...overrides,
  };
}

// `color` is the icon's colour and the default fill / line colour of a new shape; `edge` is its default border.
export const SHAPES = [
  { kind: 'rect', label: 'Rectangle', icon: '▭', color: '#3b82f6', edge: '#1d4ed8' },
  { kind: 'ellipse', label: 'Ellipse', icon: '◯', color: '#ef4444', edge: '#b91c1c' },
  { kind: 'line', label: 'Line', icon: '╱', color: '#111827' },
  { kind: 'arrow', label: 'Arrow', icon: '➜', color: '#22c55e' },
  { kind: 'triangle', label: 'Triangle', icon: '△', color: '#f97316', edge: '#c2410c' },
  { kind: 'star', label: 'Star', icon: '☆', color: '#facc15', edge: '#a16207' },
  { kind: 'heart', label: 'Heart', icon: '♡', color: '#ef4444', edge: '#b91c1c' },
  { kind: 'cross', label: 'Cross', icon: '✕', color: '#ef4444' },
  { kind: 'check', label: 'Check', icon: '✓', color: '#22c55e' },
];

// Drawn with a stroke only (no fill): the panel offers Color / Thickness instead of Fill / Border.
const LINE_KINDS = new Set(['line', 'arrow', 'cross', 'check']);
export const isLineShape = (kind) => LINE_KINDS.has(kind);
const FLAT_KINDS = new Set(['line', 'arrow']); // long and thin; cross and check are drawn in a square box

export function createShapeElement(poster, kind) {
  const u = unit(poster);
  const line = isLineShape(kind);
  const flat = FLAT_KINDS.has(kind);
  const mark = kind === 'cross' || kind === 'check';
  const def = SHAPES.find((sh) => sh.kind === kind);
  const width = Math.round(flat ? u * 0.3 : mark ? u * 0.16 : u * 0.2);
  const strokeWidth = Math.max(2, Math.round(u * (mark ? 0.02 : line ? 0.01 : 0.005)));
  const height = Math.round(flat ? Math.max(24, strokeWidth * 5) : width);
  return {
    id: createId('shape'),
    type: 'shape',
    kind,
    x: Math.round((poster.width - width) / 2),
    y: Math.round((poster.height - height) / 2),
    width,
    height,
    rotation: 0,
    opacity: 1,
    hidden: false,
    fillEnabled: !line,
    fill: def.color,
    stroke: line ? def.color : def.edge,
    strokeWidth,
    cornerRadius: kind === 'rect' ? Math.round(u * 0.015) : 0,
  };
}

export function createStickerElement(poster, stickerId) {
  const size = Math.round(unit(poster) * 0.18);
  return {
    id: createId('sticker'),
    type: 'sticker',
    stickerId,
    x: Math.round((poster.width - size) / 2),
    y: Math.round((poster.height - size) / 2),
    width: size,
    height: size,
    rotation: 0,
    opacity: 1,
    hidden: false,
    flipX: false,
  };
}

/** A free image (from the Image or Sticker menu), fitted inside about 40% of the template. `origin` picks the menu it belongs to. */
export function createImageElement(poster, { assetId, width, height, name }, origin = 'image') {
  const s = Math.min((poster.width * 0.4) / width, (poster.height * 0.4) / height);
  const w = Math.max(10, Math.round(width * s));
  const h = Math.max(10, Math.round(height * s));
  return {
    id: createId('img'),
    type: 'image',
    main: false,
    origin,
    name: name || 'Image',
    assetId,
    naturalWidth: width,
    naturalHeight: height,
    x: Math.round((poster.width - w) / 2),
    y: Math.round((poster.height - h) / 2),
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    hidden: false,
    flipX: false,
  };
}

/** The main image: sits under the template and shows through its blank (transparent) zone. */
export function createMainImageElement(zone, { assetId, width, height, name }) {
  return {
    id: createId('main'),
    type: 'image',
    main: true,
    name: name || 'Main image',
    assetId,
    naturalWidth: width,
    naturalHeight: height,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    opacity: 1,
    hidden: false,
    zoom: 1, // >= 1: the image always covers the whole zone
    panX: 0, // -1..1: slides the visible part of the image
    panY: 0,
    rotate: 0, // degrees, turns the image inside the zone
    flipX: false,
  };
}

/** Moves an element in the stacking order. Later in the array = drawn on top. */
export function moveElement(elements, id, direction) {
  const index = elements.findIndex((el) => el.id === id);
  if (index < 0) return elements;
  const next = elements.slice();
  const [item] = next.splice(index, 1);
  let target = index;
  if (direction === 'up') target = Math.min(next.length, index + 1);
  if (direction === 'down') target = Math.max(0, index - 1);
  if (direction === 'top') target = next.length;
  if (direction === 'bottom') target = 0;
  next.splice(target, 0, item);
  return next;
}

export function elementLabel(el) {
  if (el.type === 'text') return el.text?.trim() ? el.text.trim().slice(0, 28) : '(empty text)';
  if (el.type === 'shape') return SHAPES.find((s) => s.kind === el.kind)?.label || 'Shape';
  if (el.type === 'sticker') return stickerLabel(el.stickerId);
  if (el.type === 'image') return el.main ? 'Main image' : el.name || 'Image';
  return el.type;
}

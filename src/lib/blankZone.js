// Finds the blank (transparent) zone of a PNG template: the biggest connected area of transparent pixels.
// The user's main image is placed under the template, so it shows through exactly that zone.

const MAX_SIDE = 1000; // analysis resolution; bigger templates are scanned downscaled
const ALPHA_BLANK = 16; // alpha below this counts as transparent
const MIN_AREA = 0.01; // a zone must cover at least 1% of the template

/**
 * Core on raw RGBA pixels (no DOM, so it can be tested in Node).
 * Returns { x, y, width, height } in the pixel space of `data`, or null when there is no transparent zone.
 */
export function findBlankZoneInPixels({ data, width, height }) {
  const mask = new Uint8Array(width * height);
  for (let p = 0; p < mask.length; p += 1) mask[p] = data[p * 4 + 3] < ALPHA_BLANK ? 1 : 0;

  const seen = new Uint8Array(mask.length);
  const stack = new Int32Array(mask.length);
  let best = null;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue;
    let sp = 0;
    stack[sp++] = start;
    seen[start] = 1;
    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    while (sp) {
      const p = stack[--sp];
      const x = p % width;
      const y = (p - x) / width;
      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
      if (x < width - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - width] && !seen[p - width]) { seen[p - width] = 1; stack[sp++] = p - width; }
      if (y < height - 1 && mask[p + width] && !seen[p + width]) { seen[p + width] = 1; stack[sp++] = p + width; }
    }
    if (!best || area > best.area) best = { area, minX, maxX, minY, maxY };
  }
  if (!best || best.area < width * height * MIN_AREA) return null;
  return { x: best.minX, y: best.minY, width: best.maxX - best.minX + 1, height: best.maxY - best.minY + 1 };
}

/** The blank zone of a loaded PNG image, in the image's own pixels (or null). */
export function findBlankZone(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const f = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * f));
  canvas.height = Math.max(1, Math.round(h * f));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const zone = findBlankZoneInPixels(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (!zone) return null;

  // Back to full resolution; grow by one analysis pixel so the image reaches the zone's very edge.
  const k = 1 / f;
  const x = Math.max(0, Math.floor((zone.x - 1) * k));
  const y = Math.max(0, Math.floor((zone.y - 1) * k));
  return {
    x,
    y,
    width: Math.min(w, Math.ceil((zone.x + zone.width + 1) * k)) - x,
    height: Math.min(h, Math.ceil((zone.y + zone.height + 1) * k)) - y,
  };
}

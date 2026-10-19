// Geometry of the main image inside the template's blank zone: it always covers the whole zone
// (like CSS object-fit: cover), then zoom, pan and rotation are applied on top.

/** Extra scale so an image rotated by `deg` inside a w x h frame still covers the whole frame. */
export function rotationCover(w, h, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return Math.max((w * c + h * s) / w, (w * s + h * c) / h);
}

/**
 * Visible part of the source image for the zone (el.width x el.height): its size (vw x vh), how many
 * frame px one source px takes (`scale`), and how far the crop can slide on each axis (`rangeX/rangeY`).
 */
export function getCoverView(el, iw, ih) {
  const w = Math.max(1, el.width);
  const h = Math.max(1, el.height);
  const scale = Math.max(w / iw, h / ih) * Math.max(1, el.zoom || 1);
  const vw = w / scale;
  const vh = h / scale;
  return { scale, vw, vh, rangeX: (iw - vw) / 2, rangeY: (ih - vh) / 2 };
}

/** Source crop rectangle for the current zoom and pan (panX / panY in -1..1). */
export function getCoverCrop(el, iw, ih) {
  const view = getCoverView(el, iw, ih);
  const px = Math.max(-1, Math.min(1, el.panX || 0));
  const py = Math.max(-1, Math.min(1, el.panY || 0));
  return { x: view.rangeX * (1 + px), y: view.rangeY * (1 + py), width: view.vw, height: view.vh };
}

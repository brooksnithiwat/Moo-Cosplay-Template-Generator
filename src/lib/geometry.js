// Pure geometry helpers: keeping nodes inside the template.

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Moves a Konva node so its bounding box stays within [0, width] x [0, height] of its parent.
 * Nodes larger than the template are kept covering it instead.
 */
export function clampNodeToBounds(node, width, height) {
  const parent = node.getParent();
  if (!parent) return;
  const r = node.getClientRect({ relativeTo: parent, skipShadow: true });
  const dx = clampDelta(r.x, r.width, width);
  const dy = clampDelta(r.y, r.height, height);
  if (dx || dy) node.position({ x: node.x() + dx, y: node.y() + dy });
}

function clampDelta(start, size, limit) {
  if (size >= limit) {
    if (start > 0) return -start;
    if (start + size < limit) return limit - (start + size);
    return 0;
  }
  if (start < 0) return -start;
  if (start + size > limit) return limit - (start + size);
  return 0;
}

import { useRef } from 'react';
import { Group, Image as KImage, Rect } from 'react-konva';
import { getCoverCrop, getCoverView, rotationCover } from '../../lib/mainImage.js';

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

/**
 * The user's main image, drawn UNDER the template so it shows through the template's blank zone.
 * The zone (el.x/y/width/height) never moves: dragging pans the image inside it; zoom, rotation and
 * flip come from the sidebar.
 */
export default function MainImageNode({ el, asset, onSelect, onChange }) {
  const img = asset?.img || null;
  const iw = img?.naturalWidth || 1;
  const ih = img?.naturalHeight || 1;
  const rotate = el.rotate || 0;
  const cover = rotationCover(el.width, el.height, rotate);
  const drag = useRef(null);

  const handleDragStart = (e) => {
    const p = e.target.getStage().getPointerPosition();
    drag.current = { px: p.x, py: p.y, panX: el.panX || 0, panY: el.panY || 0 };
  };

  const handleDragMove = (e) => {
    const node = e.target;
    const start = drag.current;
    if (!start || !img) return;
    const p = node.getStage().getPointerPosition();
    const view = getCoverView(el, iw, ih);
    // Pointer movement in zone px, then into the (rotated, enlarged) image's own axes, then source px.
    const abs = node.getAbsoluteScale().x;
    const fx = (p.x - start.px) / abs;
    const fy = (p.y - start.py) / abs;
    const a = (-rotate * Math.PI) / 180;
    const ix = (fx * Math.cos(a) - fy * Math.sin(a)) / cover;
    const iy = (fx * Math.sin(a) + fy * Math.cos(a)) / cover;
    const dx = (ix / view.scale) * (el.flipX ? -1 : 1);
    const dy = iy / view.scale;
    // Dragging right shows more of the left side of the image, hence the minus.
    onChange(
      el.id,
      {
        panX: view.rangeX > 0 ? clamp1(start.panX - dx / view.rangeX) : 0,
        panY: view.rangeY > 0 ? clamp1(start.panY - dy / view.rangeY) : 0,
      },
      `${el.id}:pan`,
    );
  };

  return (
    <Group
      x={el.x}
      y={el.y}
      opacity={el.opacity}
      visible={!el.hidden}
      clipX={0}
      clipY={0}
      clipWidth={el.width}
      clipHeight={el.height}
      draggable={Boolean(img)}
      dragBoundFunc={function lockPosition() {
        return this.absolutePosition(); // the zone stays put; only the image moves inside it
      }}
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
    >
      <Rect width={el.width} height={el.height} fill="transparent" />
      {img && (
        <Group x={el.width / 2} y={el.height / 2} rotation={rotate} scaleX={cover * (el.flipX ? -1 : 1)} scaleY={cover}>
          <KImage image={img} crop={getCoverCrop(el, iw, ih)} x={-el.width / 2} y={-el.height / 2} width={el.width} height={el.height} />
        </Group>
      )}
    </Group>
  );
}

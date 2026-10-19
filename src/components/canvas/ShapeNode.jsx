import { Arrow, Ellipse, Group, Line, Rect } from 'react-konva';

/** Polygon points of a shape drawn inside a w x h box (flat [x1, y1, x2, y2, ...]). */
function polygonPoints(kind, w, h) {
  if (kind === 'triangle') return [w / 2, 0, w, h, 0, h];
  if (kind === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 1 : 0.4;
      pts.push(0.5 + 0.5 * r * Math.cos(a), 0.5 + 0.5 * r * Math.sin(a));
    }
    // Stretch the star to fill the whole box (its tips do not reach every edge).
    const xs = pts.filter((_, i) => i % 2 === 0);
    const ys = pts.filter((_, i) => i % 2 === 1);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    return pts.map((v, i) => (i % 2 === 0 ? ((v - minX) / (maxX - minX)) * w : ((v - minY) / (maxY - minY)) * h));
  }
  // heart: classic parametric curve, normalised to the box
  const raw = [];
  for (let i = 0; i < 72; i += 1) {
    const t = (i / 72) * Math.PI * 2;
    raw.push([16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]);
  }
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return raw.flatMap(([x, y]) => [((x - minX) / (maxX - minX)) * w, (1 - (y - minY) / (maxY - minY)) * h]);
}

export default function ShapeNode({ el, onSelect, onChange, registerNode, onDragMove }) {
  const { kind, width: w, height: h } = el;

  const handleTransformEnd = (e) => {
    const node = e.target;
    const sx = Math.abs(node.scaleX());
    const sy = Math.abs(node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    onChange(el.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(5, w * sx),
      height: Math.max(5, h * sy),
    });
  };

  const paint = {
    fill: el.fillEnabled ? el.fill : undefined,
    stroke: el.strokeWidth > 0 ? el.stroke : undefined,
    strokeWidth: el.strokeWidth,
    lineJoin: 'round',
    lineCap: 'round',
  };

  let shape;
  if (kind === 'rect') {
    shape = <Rect width={w} height={h} cornerRadius={Math.min(el.cornerRadius || 0, w / 2, h / 2)} {...paint} />;
  } else if (kind === 'ellipse') {
    shape = <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...paint} />;
  } else if (kind === 'line') {
    shape = <Line points={[el.strokeWidth / 2, h / 2, w - el.strokeWidth / 2, h / 2]} stroke={el.stroke} strokeWidth={el.strokeWidth} lineCap="round" />;
  } else if (kind === 'cross') {
    const pad = el.strokeWidth / 2;
    shape = (
      <>
        <Line points={[pad, pad, w - pad, h - pad]} stroke={el.stroke} strokeWidth={el.strokeWidth} lineCap="round" />
        <Line points={[w - pad, pad, pad, h - pad]} stroke={el.stroke} strokeWidth={el.strokeWidth} lineCap="round" />
      </>
    );
  } else if (kind === 'check') {
    shape = (
      <Line
        points={[w * 0.1, h * 0.55, w * 0.38, h * 0.85, w * 0.9, h * 0.18]}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
    );
  } else if (kind === 'arrow') {
    const head = Math.max(12, el.strokeWidth * 3);
    shape = (
      <Arrow
        points={[el.strokeWidth / 2, h / 2, w - el.strokeWidth / 2, h / 2]}
        stroke={el.stroke}
        fill={el.stroke}
        strokeWidth={el.strokeWidth}
        pointerLength={head}
        pointerWidth={head}
        lineCap="round"
      />
    );
  } else {
    shape = <Line points={polygonPoints(kind, w, h)} closed {...paint} />;
  }

  return (
    <Group
      ref={(node) => registerNode(el.id, node)}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={!el.hidden}
      draggable
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragMove={onDragMove}
      onDragEnd={(e) => onChange(el.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={handleTransformEnd}
    >
      {/* Invisible frame: makes the whole box grabbable (thin lines included) and defines the selection box. */}
      <Rect width={w} height={h} fill="transparent" />
      {shape}
    </Group>
  );
}

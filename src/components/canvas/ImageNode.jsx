import { Group, Image as KImage, Rect } from 'react-konva';

/** A free image (uploaded from the Image or Sticker menu): move, resize, rotate and flip it like a sticker. */
export default function ImageNode({ el, asset, onSelect, onChange, registerNode, onDragMove }) {
  const img = asset?.img || null;

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
      width: Math.max(5, el.width * sx),
      height: Math.max(5, el.height * sy),
    });
  };

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
      <Rect width={el.width} height={el.height} fill="transparent" />
      {img && (
        <KImage image={img} x={el.flipX ? el.width : 0} y={0} width={el.width} height={el.height} scaleX={el.flipX ? -1 : 1} />
      )}
    </Group>
  );
}

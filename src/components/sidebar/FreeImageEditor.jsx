import { RangeField, Toggle } from '../ui/Controls.jsx';

/** Controls for a free image (one added from the Image or Sticker menu). */
export default function FreeImageEditor({ el, asset, poster, onUpdate, onRemove }) {
  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  // Size changes keep the image's own proportions.
  const setSize = (width) => onUpdate(el.id, { width, height: (width * el.height) / el.width }, `${el.id}:size`);
  return (
    <div className="editor-card">
      <div className="editor-card-head">
        <strong>แก้ไขรูป</strong>
        <button type="button" className="link danger" onClick={() => onRemove(el.id)}>Remove</button>
      </div>
      {asset && (
        <div className="poster-info">
          <img src={asset.url} alt="" className="poster-thumb" />
          <div>
            <strong title={el.name}>{el.name}</strong>
            <span>{el.naturalWidth} × {el.naturalHeight}px</span>
          </div>
        </div>
      )}
      <RangeField label="Size" value={el.width} min={10} max={Math.max(poster.width, poster.height) * 2} onChange={setSize} suffix="px" />
      <RangeField label="Rotation" value={el.rotation} min={-180} max={180} onChange={set('rotation')} suffix="°" />
      <RangeField label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={set('opacity')} />
      <Toggle label="Flip" checked={el.flipX} onChange={set('flipX')} />
      <p className="hint">ลากเพื่อย้าย ลากมุมเพื่อย่อ/ขยาย และลากจุดด้านบนเพื่อหมุนบนรูปได้เลย</p>
    </div>
  );
}

import { ColorField, ColorSwatches, RangeField, Toggle } from '../ui/Controls.jsx';
import { SHAPES, isLineShape } from '../../state/editorModel.js';

function ShapeEditor({ el, poster, onUpdate, onRemove }) {
  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  const line = isLineShape(el.kind);
  const max = Math.max(poster.width, poster.height) * 2;
  return (
    <div className="editor-card">
      <div className="editor-card-head">
        <strong>แก้ไข {SHAPES.find((s) => s.kind === el.kind)?.label}</strong>
        <button type="button" className="link danger" onClick={() => onRemove(el.id)}>Remove</button>
      </div>
      {!line && <Toggle label="Fill" checked={el.fillEnabled} onChange={set('fillEnabled')} />}
      {!line && el.fillEnabled && (
        <>
          <ColorField label="Fill color" value={el.fill} onChange={set('fill')} />
          <ColorSwatches value={el.fill} onChange={set('fill')} />
        </>
      )}
      <ColorField label={line ? 'Color' : 'Border color'} value={el.stroke} onChange={set('stroke')} />
      <ColorSwatches value={el.stroke} onChange={set('stroke')} />
      <RangeField label={line ? 'Thickness' : 'Border width'} value={el.strokeWidth} min={0} max={80} step={0.5} onChange={set('strokeWidth')} suffix="px" />
      {el.kind === 'rect' && (
        <RangeField label="Corner radius" value={el.cornerRadius} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={set('cornerRadius')} suffix="px" />
      )}
      <div className="grid-2">
        <RangeField label="Width" value={el.width} min={5} max={max} onChange={set('width')} suffix="px" />
        <RangeField label="Height" value={el.height} min={5} max={max} onChange={set('height')} suffix="px" />
      </div>
      <RangeField label="Rotation" value={el.rotation} min={-180} max={180} onChange={set('rotation')} suffix="°" />
      <RangeField label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={set('opacity')} />
    </div>
  );
}

export default function ShapePanel({ selectedEl, poster, onAdd, onUpdate, onRemove }) {
  return (
    <div className="panel-body">
      <div className="pick-grid">
        {SHAPES.map((s) => (
          <button key={s.kind} type="button" className="pick" onClick={() => onAdd(s.kind)} title={`เพิ่ม ${s.label}`}>
            <span className="pick-icon" style={{ color: s.color }} aria-hidden="true">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      {selectedEl?.type === 'shape' ? (
        <ShapeEditor el={selectedEl} poster={poster} onUpdate={onUpdate} onRemove={onRemove} />
      ) : (
        <p className="hint">เลือกรูปทรงเพื่อวางบนรูป แล้วปรับสี ขนาด และการหมุนได้</p>
      )}
    </div>
  );
}

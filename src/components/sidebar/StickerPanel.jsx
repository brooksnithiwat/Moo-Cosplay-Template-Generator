import { FileButton, RangeField, Toggle } from '../ui/Controls.jsx';
import FreeImageEditor from './FreeImageEditor.jsx';
import { STICKERS, stickerLabel, stickerUrl } from '../../lib/stickers.js';

const ACCEPT = 'image/png,image/jpeg,image/webp';

function StickerEditor({ el, poster, onUpdate, onRemove }) {
  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  // Keep the sticker's shape: size changes scale both sides together.
  const setSize = (width) => onUpdate(el.id, { width, height: (width * el.height) / el.width }, `${el.id}:size`);
  return (
    <div className="editor-card">
      <div className="editor-card-head">
        <strong>แก้ไข {stickerLabel(el.stickerId)}</strong>
        <button type="button" className="link danger" onClick={() => onRemove(el.id)}>Remove</button>
      </div>
      <RangeField label="Size" value={el.width} min={10} max={Math.max(poster.width, poster.height)} onChange={setSize} suffix="px" />
      <RangeField label="Rotation" value={el.rotation} min={-180} max={180} onChange={set('rotation')} suffix="°" />
      <RangeField label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={set('opacity')} />
      <Toggle label="Flip" checked={el.flipX} onChange={set('flipX')} />
    </div>
  );
}

function StickerGrid({ list, onAdd }) {
  return (
    <div className="pick-grid">
      {list.map((s) => (
        <button key={s.id} type="button" className="pick" onClick={() => onAdd(s.id)} title={`เพิ่ม ${s.label}`}>
          <img src={stickerUrl(s.id)} alt="" width="40" height="40" />
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function StickerPanel({ selectedEl, poster, getAsset, myStickers, onAdd, onUpload, onAddMine, onUpdate, onRemove }) {
  const ownImage = selectedEl?.type === 'image' && !selectedEl.main ? selectedEl : null;
  return (
    <div className="panel-body">
      <FileButton accept={ACCEPT} onFile={onUpload} className="btn primary">+ อัปโหลดสติกเกอร์ของคุณ</FileButton>
      <p className="hint">รองรับไฟล์ PNG, JPG, WebP (PNG พื้นโปร่งใสจะดูเป็นสติกเกอร์ที่สุด) สติกเกอร์ที่อัปโหลดจะเก็บไว้ด้านล่างให้กดวางซ้ำได้</p>
      {myStickers.length > 0 && (
        <>
          <strong>My stickers</strong>
          <div className="pick-grid">
            {myStickers.map((m) => (
              <button key={m.assetId} type="button" className="pick" onClick={() => onAddMine(m.assetId)} title={`เพิ่ม ${m.name}`}>
                <img src={m.url} alt="" width="40" height="40" style={{ objectFit: 'contain' }} />
                <span className="pick-name">{m.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <strong>Emoji</strong>
      <StickerGrid list={STICKERS} onAdd={onAdd} />

      {selectedEl?.type === 'sticker' && <StickerEditor el={selectedEl} poster={poster} onUpdate={onUpdate} onRemove={onRemove} />}
      {ownImage && <FreeImageEditor el={ownImage} asset={getAsset(ownImage.assetId)} poster={poster} onUpdate={onUpdate} onRemove={onRemove} />}
      {!selectedEl && <p className="hint">คลิกสติกเกอร์เพื่อวางบนรูป แล้วลากย้าย ลากมุมย่อ/ขยาย หรือหมุนได้</p>}
    </div>
  );
}

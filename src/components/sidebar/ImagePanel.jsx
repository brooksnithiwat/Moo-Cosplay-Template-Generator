import { FileButton, RangeField, Toggle } from '../ui/Controls.jsx';
import FreeImageEditor from './FreeImageEditor.jsx';

const ACCEPT = 'image/png,image/jpeg,image/webp';

// Keeps an angle inside the slider's -180..180 range.
const wrap180 = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

function MainImageEditor({ el, asset, onUpdate, onRemove }) {
  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  return (
    <div className="editor-card">
      <div className="editor-card-head">
        <strong>Main image</strong>
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
      <RangeField label="Zoom" value={el.zoom} min={1} max={4} step={0.01} onChange={set('zoom')} suffix="×" />
      <div className="grid-2">
        <RangeField label="Move X" value={el.panX} min={-1} max={1} step={0.01} onChange={set('panX')} />
        <RangeField label="Move Y" value={el.panY} min={-1} max={1} step={0.01} onChange={set('panY')} />
      </div>
      <RangeField label="Rotate" value={el.rotate} min={-180} max={180} onChange={set('rotate')} suffix="°" />
      <div className="row wrap">
        <button type="button" className="btn small" onClick={() => onUpdate(el.id, { rotate: wrap180(el.rotate - 90) })}>↺ 90°</button>
        <button type="button" className="btn small" onClick={() => onUpdate(el.id, { rotate: wrap180(el.rotate + 90) })}>↻ 90°</button>
        <Toggle label="Flip" checked={el.flipX} onChange={set('flipX')} />
      </div>
      <RangeField label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={set('opacity')} />
      <button type="button" className="btn small" onClick={() => onUpdate(el.id, { zoom: 1, panX: 0, panY: 0, rotate: 0, flipX: false })}>Reset framing</button>
      <p className="hint">ลากรูปบนโปสเตอร์เพื่อเลื่อนตำแหน่งในช่อง</p>
    </div>
  );
}

export default function ImagePanel({ poster, selectedEl, mainImage, getAsset, busy, onAddImage, onUploadMain, onUpdate, onRemove }) {
  const freeImage = selectedEl?.type === 'image' && !selectedEl.main ? selectedEl : null;
  return (
    <div className="panel-body">
      <FileButton accept={ACCEPT} onFile={onAddImage} className="btn primary" disabled={busy}>+ เพิ่มรูปภาพ</FileButton>
      <p className="hint">รองรับไฟล์ PNG, JPG, WebP เพิ่มได้หลายรูป แล้วย้าย ย่อ/ขยาย หมุนได้ (วางรูปจาก clipboard ด้วย Ctrl+V ก็ได้)</p>
      {freeImage && (
        <FreeImageEditor el={freeImage} asset={getAsset(freeImage.assetId)} poster={poster} onUpdate={onUpdate} onRemove={onRemove} />
      )}

      <hr className="divider" />
      <strong>Main image</strong>
      {poster.zone ? (
        <>
          <p className="hint">พบช่องว่างโปร่งใสบน template ({Math.round(poster.zone.width)} × {Math.round(poster.zone.height)}px) รูปที่เลือกจะถูกใส่ในช่องนี้</p>
          <FileButton accept={ACCEPT} onFile={onUploadMain} className="btn" disabled={busy}>
            {mainImage ? 'เปลี่ยน Main image' : 'เลือก Main image'}
          </FileButton>
          {mainImage && <MainImageEditor el={mainImage} asset={getAsset(mainImage.assetId)} onUpdate={onUpdate} onRemove={onRemove} />}
        </>
      ) : (
        <p className="hint note-red">
          <b>หมายเหตุ :</b> Main image ใช้ได้กับ template ที่เป็น <b>PNG เจาะช่องโปร่งใส</b> เท่านั้น (template นี้ไม่มีช่องโปร่งใส) อัปโหลด template ใหม่ได้จากปุ่ม + New template
        </p>
      )}
    </div>
  );
}

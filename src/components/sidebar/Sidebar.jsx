import { Segmented } from '../ui/Controls.jsx';
import TextPanel from './TextPanel.jsx';
import ShapePanel from './ShapePanel.jsx';
import StickerPanel from './StickerPanel.jsx';
import ImagePanel from './ImagePanel.jsx';
import LayersPanel from './LayersPanel.jsx';

const TABS = [
  { value: 'text', label: 'Text' },
  { value: 'shape', label: 'Shape' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'image', label: 'Image' },
];

export default function Sidebar({ poster, elements, selectedEl, selectedIds, tab, onTab, fonts, actions, getAsset, busy, myStickers }) {
  const mainImage = elements.find((el) => el.type === 'image' && el.main) || null;
  return (
    <aside className="sidebar">
      <div className="tabs">
        <Segmented value={tab} onChange={onTab} options={TABS} label="เพิ่มองค์ประกอบ" />
      </div>
      {tab === 'text' && (
        <TextPanel selectedEl={selectedEl} fonts={fonts} onAdd={actions.addText} onUpdate={actions.update} onRemove={actions.remove} />
      )}
      {tab === 'shape' && (
        <ShapePanel selectedEl={selectedEl} poster={poster} onAdd={actions.addShape} onUpdate={actions.update} onRemove={actions.remove} />
      )}
      {tab === 'sticker' && (
        <StickerPanel
          selectedEl={selectedEl}
          poster={poster}
          getAsset={getAsset}
          myStickers={myStickers}
          onAdd={actions.addSticker}
          onUpload={actions.uploadSticker}
          onAddMine={actions.addMySticker}
          onUpdate={actions.update}
          onRemove={actions.remove}
        />
      )}
      {tab === 'image' && (
        <ImagePanel
          poster={poster}
          selectedEl={selectedEl}
          mainImage={mainImage}
          getAsset={getAsset}
          busy={busy}
          onAddImage={actions.addImage}
          onUploadMain={actions.setMainImage}
          onUpdate={actions.update}
          onRemove={actions.remove}
        />
      )}
      {selectedIds.length > 1 && (
        <div className="panel-body selection-note">
          <strong>เลือกอยู่ {selectedIds.length} รายการ</strong>
          <p className="hint">ลากเพื่อย้ายพร้อมกัน ลากมุมกรอบเพื่อย่อ/ขยายหรือหมุนทั้งกลุ่ม · Delete ลบ · Ctrl+C / Ctrl+V คัดลอก/วาง · กด Shift ค้างแล้วคลิกเพื่อเพิ่ม/เอาออก</p>
        </div>
      )}
      <LayersPanel
        elements={elements}
        selectedIds={selectedIds}
        onSelect={actions.select}
        onMove={actions.move}
        onUpdate={actions.update}
        onRemove={actions.remove}
      />
      <footer className="credit">
        <div>จัดทำโดย Sinbad Thethird</div>
        <small>© {new Date().getFullYear()} Sinbad Thethird. All rights reserved.</small>
      </footer>
    </aside>
  );
}

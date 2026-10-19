export default function Toolbar({ canUndo, canRedo, onUndo, onRedo, onReset, onDownload, onNewTemplate, onCopy, onPaste, canCopy, canPaste, hasPoster, hasTemplate, exporting }) {
  return (
    <header className="toolbar">
      <div className="brand">
        <img className="brand-mark" src={`${import.meta.env.BASE_URL}brand-mark.png`} alt="" aria-hidden="true" />
        <div className="brand-text">
          <span>Moo Cosplay Template Generator</span>
          <small>สร้างโปสเตอร์จาก template ของคุณ</small>
        </div>
      </div>
      {hasTemplate && (
        <div className="toolbar-actions">
          <button type="button" className="btn primary" onClick={onNewTemplate} title="Start over with another template">+ New template</button>
          <button type="button" className="btn ghost" onClick={onCopy} disabled={!canCopy} title="Copy the selected element (Ctrl+C)">⧉ Copy</button>
          <button type="button" className="btn ghost" onClick={onPaste} disabled={!canPaste} title="Paste (Ctrl+V)">⎘ Paste</button>
          <button type="button" className="btn ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button type="button" className="btn ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↷ Redo</button>
          <button type="button" className="btn ghost" onClick={onReset} disabled={!hasPoster} title="Clear customizations, keep the template">Reset</button>
          <button type="button" className="btn bg-green-600" onClick={onDownload} disabled={!hasPoster || exporting}>
            {exporting ? 'Exporting…' : '⬇ ดาวน์โหลดรูป'}
          </button>
        </div>
      )}
    </header>
  );
}

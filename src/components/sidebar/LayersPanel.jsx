import { Section } from '../ui/Controls.jsx';
import { elementLabel } from '../../state/editorModel.js';

const TYPE_ICON = { text: 'T', shape: '◆', sticker: '★', image: '▣' };

// Eye icons drawn as SVG so they stay crisp and clearly readable at small size (open = visible, slashed = hidden).
function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

// Trash can, drawn like the eye icon so both buttons have the same size and weight.
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export default function LayersPanel({ elements, selectedIds, onSelect, onMove, onUpdate, onRemove }) {
  // Show top-most first, like most design tools.
  const ordered = elements.slice().reverse();
  return (
    <Section title="Layers" badge={elements.length || null}>
      {!elements.length && <p className="hint">ยังไม่มีองค์ประกอบ เพิ่ม Text, Shape หรือ Sticker จากเมนูด้านบน</p>}
      <ul className="layer-list">
        {ordered.map((el, i) => (
          <li key={el.id} className={selectedIds.includes(el.id) ? 'active' : ''}>
            <button type="button" className="layer-name" onClick={() => onSelect(el.id)}>
              <span className="layer-icon">{TYPE_ICON[el.type]}</span>
              <span className={el.hidden ? 'muted' : ''}>{elementLabel(el)}</span>
            </button>
            <div className="layer-actions">
              {/* The main image always stays under the template, so it has no stacking buttons. */}
              {!el.main && (
                <>
                  <button type="button" className="icon-btn small" title="Bring forward" disabled={i === 0} onClick={() => onMove(el.id, 'up')}>↑</button>
                  <button type="button" className="icon-btn small" title="Send backward" disabled={i === ordered.length - 1} onClick={() => onMove(el.id, 'down')}>↓</button>
                </>
              )}
              <button
                type="button"
                className={`icon-btn small eye ${el.hidden ? 'off' : 'on'}`}
                title={el.hidden ? 'Show' : 'Hide'}
                aria-label={el.hidden ? 'Show layer' : 'Hide layer'}
                aria-pressed={el.hidden}
                onClick={() => onUpdate(el.id, { hidden: !el.hidden })}
              >
                <EyeIcon off={el.hidden} />
              </button>
              <button
                type="button"
                className="icon-btn small danger"
                title="Delete"
                aria-label="Delete layer"
                onClick={() => onRemove(el.id)}
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

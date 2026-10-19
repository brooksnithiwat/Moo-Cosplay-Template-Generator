import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * In-place text editing: an HTML textarea laid over the text on the template, styled to look like it.
 * (Konva draws to a canvas, so real text editing needs a real input on top.) Esc or clicking elsewhere finishes.
 */
export default function TextEditorOverlay({ el, scale, onChange, onClose }) {
  const ref = useRef(null);

  // Focus with everything selected, so typing replaces the placeholder text straight away.
  useEffect(() => {
    const node = ref.current;
    node?.focus();
    node?.select();
  }, []);

  // Grow with the content, like the text on the template does.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [el.text, el.fontSize, el.width, scale]);

  const outline = el.strokeWidth > 0 ? (el.strokeWidth * scale) / 2 : 0;
  const shadows = outline
    ? [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([x, y]) => `${x * outline}px ${y * outline}px 0 ${el.stroke}`).join(', ')
    : 'none';

  return (
    <textarea
      ref={ref}
      className="text-overlay"
      value={el.text}
      spellCheck={false}
      onChange={(e) => onChange(el.id, { text: e.target.value }, `${el.id}:text`)}
      onBlur={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        e.stopPropagation(); // typing must never trigger poster shortcuts (Delete, arrows…)
      }}
      style={{
        left: el.x * scale,
        top: el.y * scale,
        width: el.width * scale,
        minHeight: el.fontSize * el.lineHeight * scale,
        transform: `rotate(${el.rotation}deg)`,
        fontFamily: `'${el.fontFamily}', sans-serif`,
        fontSize: el.fontSize * scale,
        fontWeight: el.bold ? 700 : 400,
        fontStyle: el.italic ? 'italic' : 'normal',
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing * scale,
        textAlign: el.align,
        color: el.fill,
        textShadow: shadows,
        opacity: el.opacity,
      }}
    />
  );
}

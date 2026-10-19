import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import TextNode from './TextNode.jsx';
import ShapeNode from './ShapeNode.jsx';
import StickerNode from './StickerNode.jsx';
import MainImageNode from './MainImageNode.jsx';
import ImageNode from './ImageNode.jsx';
import TextEditorOverlay from './TextEditorOverlay.jsx';
import ZoomControls from './ZoomControls.jsx';
import { clamp, clampNodeToBounds } from '../../lib/geometry.js';
import { exportPosterPNG } from '../../lib/exportPoster.js';

const PADDING = 32;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
const MIN_MARQUEE = 4; // px: a smaller drag on empty space is just a click (it clears the selection)

const ALL_ANCHORS = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const NO_HANDLES = { resizeEnabled: false, rotateEnabled: false, keepRatio: true, enabledAnchors: [] };

/** Handles for the current selection: several elements share one box (corners only, ratio kept). */
function transformerConfig(selected) {
  if (selected.length === 0) return NO_HANDLES;
  if (selected.length > 1) return { resizeEnabled: true, rotateEnabled: true, keepRatio: true, enabledAnchors: CORNERS };
  const el = selected[0];
  if (el.main) return NO_HANDLES; // the main image is framed by the template, not by handles
  if (el.type === 'text') return { resizeEnabled: true, rotateEnabled: true, keepRatio: true, enabledAnchors: [...CORNERS, 'middle-left', 'middle-right'] };
  if (el.type === 'image' || el.type === 'sticker') return { resizeEnabled: true, rotateEnabled: true, keepRatio: true, enabledAnchors: CORNERS };
  return { resizeEnabled: true, rotateEnabled: true, keepRatio: false, enabledAnchors: ALL_ANCHORS }; // shapes
}

const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const PosterCanvas = forwardRef(function PosterCanvas(
  { poster, elements, getAsset, selectedIds, onSelect, onToggle, onSelectMany, onChange, keepInside, onToggleKeepInside },
  ref,
) {
  const workspaceRef = useRef(null);
  const contentRef = useRef(null);
  const trRef = useRef(null);
  const nodesRef = useRef(new Map());
  const additiveRef = useRef(false); // Shift / Ctrl / ⌘ held at the last mouse press: add to the selection instead of replacing it
  const marqueeRef = useRef(null); // { x, y, base }: where a drag-select started and what was selected before it
  const groupDragRef = useRef(null); // { id, origin, starts }: a drag that moves every selected element together
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState('fit'); // 'fit' or an absolute scale
  const [editingId, setEditingId] = useState(null); // text being edited in place
  const [marquee, setMarquee] = useState(null); // the drag-select rectangle, in stage px

  useLayoutEffect(() => {
    const node = workspaceRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitScale = box.width
    ? clamp(Math.min((box.width - PADDING * 2) / poster.width, (box.height - PADDING * 2) / poster.height), MIN_ZOOM, 2)
    : 0.2;
  const scale = zoom === 'fit' ? fitScale : zoom;

  const setZoomClamped = useCallback((value) => setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM)), []);

  // Ctrl/⌘ + wheel zoom (native listener so preventDefault works).
  useEffect(() => {
    const node = workspaceRef.current;
    if (!node) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp((z === 'fit' ? fitScale : z) * (e.deltaY < 0 ? 1.1 : 1 / 1.1), MIN_ZOOM, MAX_ZOOM));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [fitScale]);

  // Remember whether a modifier key is down at each mouse press (capture phase: runs before Konva's own handlers).
  useEffect(() => {
    const onDown = (e) => {
      additiveRef.current = e.shiftKey || e.ctrlKey || e.metaKey;
    };
    window.addEventListener('mousedown', onDown, true);
    return () => window.removeEventListener('mousedown', onDown, true);
  }, []);

  const registerNode = useCallback((key, node) => {
    if (node) nodesRef.current.set(key, node);
    else nodesRef.current.delete(key);
  }, []);

  const selectedEls = elements.filter((el) => selectedIds.includes(el.id));
  const editingEl = elements.find((el) => el.id === editingId && el.type === 'text') || null;
  const trConfig = transformerConfig(selectedEls);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const nodes = selectedIds.map((id) => nodesRef.current.get(id)).filter((node) => node && node.getStage() && node.isVisible());
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  });

  useImperativeHandle(ref, () => ({
    exportPNG: () => exportPosterPNG(contentRef.current, poster.width, poster.height),
  }), [poster.width, poster.height]);

  const handleDragMove = useCallback(
    (e) => {
      if (keepInside) clampNodeToBounds(e.target, poster.width, poster.height);
    },
    [keepInside, poster.width, poster.height],
  );

  // Edits made while several elements are selected share one undo step (same key, merged by the history).
  const changeEl = useCallback(
    (id, patch, key) => onChange(id, patch, key ?? (selectedIds.length > 1 && selectedIds.includes(id) ? 'multi' : undefined)),
    [onChange, selectedIds],
  );

  // Pressing an element: select it alone; with a modifier key toggle it in/out of the selection;
  // pressing one that is already part of a group keeps the group (so the whole group can be dragged).
  const handleNodeSelect = useCallback(
    (id) => {
      if (additiveRef.current) onToggle(id);
      else if (selectedIds.length > 1 && selectedIds.includes(id)) return;
      else onSelect(id);
    },
    [onSelect, onToggle, selectedIds],
  );

  // ----- drag-select (marquee) -----
  const handleStageDown = (e) => {
    // Konva cancels the browser's default on mousedown, so a field in the sidebar would keep keyboard focus
    // after clicking the template, and Ctrl+C / Ctrl+V would go to that field instead of the selected element.
    const active = document.activeElement;
    if (active && active !== document.body) active.blur();
    const stage = e.target.getStage();
    if (e.target !== stage) return; // pressed on an element, a handle or the main image
    const p = stage.getPointerPosition();
    if (!p) return;
    marqueeRef.current = { x: p.x, y: p.y, base: additiveRef.current ? selectedIds : [] };
    if (!additiveRef.current) onSelect(null);
    setMarquee({ x: p.x, y: p.y, width: 0, height: 0 });
  };

  const handleStageMove = (e) => {
    const start = marqueeRef.current;
    if (!start) return;
    const p = e.target.getStage().getPointerPosition();
    if (!p) return;
    setMarquee({ x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y) });
  };

  const finishMarquee = () => {
    const start = marqueeRef.current;
    marqueeRef.current = null;
    if (!start || !marquee) {
      setMarquee(null);
      return;
    }
    if (marquee.width >= MIN_MARQUEE || marquee.height >= MIN_MARQUEE) {
      const hits = elements
        .filter((el) => !el.main && !el.hidden)
        .filter((el) => {
          const node = nodesRef.current.get(el.id);
          return node && node.isVisible() && overlaps(marquee, node.getClientRect());
        })
        .map((el) => el.id);
      const ids = [...new Set([...start.base, ...hits])];
      if (ids.length === 1 && !start.base.length) onSelect(ids[0]); // a single hit also opens its menu
      else if (ids.length || start.base.length) onSelectMany(ids);
    }
    setMarquee(null);
  };

  // ----- dragging one of several selected elements moves them all -----
  const idOfNode = (node) => {
    for (const [id, n] of nodesRef.current) if (n === node) return id;
    return null;
  };

  const handleGroupDragStart = (e) => {
    const id = idOfNode(e.target);
    if (!id || selectedIds.length < 2 || !selectedIds.includes(id)) {
      groupDragRef.current = null;
      return;
    }
    groupDragRef.current = {
      id,
      origin: e.target.position(),
      starts: new Map(selectedIds.filter((x) => x !== id && nodesRef.current.has(x)).map((x) => [x, nodesRef.current.get(x).position()])),
    };
  };

  const handleGroupDragMove = (e) => {
    const g = groupDragRef.current;
    if (!g || idOfNode(e.target) !== g.id) return;
    const dx = e.target.x() - g.origin.x;
    const dy = e.target.y() - g.origin.y;
    g.starts.forEach((pos, id) => nodesRef.current.get(id)?.position({ x: pos.x + dx, y: pos.y + dy }));
  };

  const handleGroupDragEnd = (e) => {
    const g = groupDragRef.current;
    if (!g || idOfNode(e.target) !== g.id) return;
    g.starts.forEach((_, id) => {
      const node = nodesRef.current.get(id);
      if (node) onChange(id, { x: node.x(), y: node.y() }, 'multi');
    });
    groupDragRef.current = null;
  };

  const commonProps = { onSelect: handleNodeSelect, onChange: changeEl, registerNode, onDragMove: handleDragMove };
  const startEditing = useCallback((id) => {
    onSelect(id);
    setEditingId(id);
  }, [onSelect]);

  return (
    <div className="canvas-area">
      <div className="workspace" ref={workspaceRef}>
        <div className="stage-scroller">
          <div className="stage-frame" style={{ width: poster.width * scale, height: poster.height * scale }}>
            <Stage
              width={poster.width * scale}
              height={poster.height * scale}
              onMouseDown={handleStageDown}
              onMouseMove={handleStageMove}
              onMouseUp={finishMarquee}
              onMouseLeave={finishMarquee}
              onTouchStart={(e) => e.target === e.target.getStage() && onSelect(null)}
              onDragStart={handleGroupDragStart}
              onDragMove={handleGroupDragMove}
              onDragEnd={handleGroupDragEnd}
            >
              <Layer>
                <Group
                  ref={contentRef}
                  scaleX={scale}
                  scaleY={scale}
                  clipX={0}
                  clipY={0}
                  clipWidth={poster.width}
                  clipHeight={poster.height}
                >
                  {/* The main image goes UNDER the template, so it shows through the template's blank zone. */}
                  {elements.map((el) => (el.type === 'image' && el.main ? <MainImageNode key={el.id} el={el} asset={getAsset(el.assetId)} onSelect={onSelect} onChange={onChange} /> : null))}
                  <KImage name="poster-bg" image={poster.img} x={0} y={0} width={poster.width} height={poster.height} listening={false} />
                  {elements.map((el) => {
                    if (el.type === 'text') return <TextNode key={el.id} el={el} editing={el.id === editingEl?.id} onEdit={startEditing} {...commonProps} getActiveAnchor={() => trRef.current?.getActiveAnchor()} />;
                    if (el.type === 'shape') return <ShapeNode key={el.id} el={el} {...commonProps} />;
                    if (el.type === 'sticker') return <StickerNode key={el.id} el={el} {...commonProps} />;
                    if (el.type === 'image' && !el.main) return <ImageNode key={el.id} el={el} asset={getAsset(el.assetId)} {...commonProps} />;
                    return null;
                  })}
                </Group>
              </Layer>
              <Layer>
                <Transformer
                  ref={trRef}
                  {...trConfig}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  rotationSnapTolerance={4}
                  anchorSize={11}
                  anchorCornerRadius={3}
                  anchorStroke="#db2777"
                  anchorFill="#ffffff"
                  borderStroke="#db2777"
                  borderStrokeWidth={1.5}
                  padding={trConfig.resizeEnabled ? 0 : 4}
                  ignoreStroke
                  flipEnabled={false}
                  boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox)}
                />
                {marquee && (
                  <Rect
                    x={marquee.x}
                    y={marquee.y}
                    width={marquee.width}
                    height={marquee.height}
                    fill="rgba(219, 39, 119, 0.12)"
                    stroke="#db2777"
                    strokeWidth={1}
                    dash={[5, 3]}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
            {editingEl && <TextEditorOverlay el={editingEl} scale={scale} onChange={onChange} onClose={() => setEditingId(null)} />}
          </div>
        </div>
      </div>
      <ZoomControls
        scale={scale}
        isFit={zoom === 'fit'}
        onZoomIn={() => setZoomClamped(scale * 1.25)}
        onZoomOut={() => setZoomClamped(scale / 1.25)}
        onFit={() => setZoom('fit')}
        onActual={() => setZoom(1)}
        keepInside={keepInside}
        onToggleKeepInside={onToggleKeepInside}
        posterSize={`${poster.width} × ${poster.height}px`}
      />
    </div>
  );
});

export default PosterCanvas;

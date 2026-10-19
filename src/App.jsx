import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Sidebar from './components/sidebar/Sidebar.jsx';
import PosterCanvas from './components/canvas/PosterCanvas.jsx';
import LandingScreen from './components/LandingScreen.jsx';
import Toast from './components/Toast.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import { useHistory } from './state/useHistory.js';
import { collectAssetIds, useAssets } from './state/useAssets.js';
import { createId, createImageElement, createMainImageElement, createShapeElement, createStickerElement, createTextElement, moveElement } from './state/editorModel.js';
import { findBlankZone } from './lib/blankZone.js';
import { IMAGE_TYPES, getFileType, loadImageFile } from './lib/imageLoader.js';
import { downloadBlob, exportFileName } from './lib/exportPoster.js';
import { SYSTEM_FONTS } from './lib/fonts.js';

const EDIT_PATH = '/edit'; // the editor lives here; the landing (upload) screen is '/'

const isTypingTarget = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

export default function App() {
  const [poster, setPoster] = useState(null); // the uploaded template image: { id, img, url, width, height, name }; null until one is uploaded
  const { history, present: elements, canUndo, canRedo, commit, undo, redo, resetHistory } = useHistory([]);
  const { addAsset, getAsset, pruneAssets } = useAssets();
  const [selectedIds, setSelectedIds] = useState([]); // one or several selected elements (drag a box on the template to select many)
  const [tab, setTab] = useState('text'); // sidebar menu: 'text' | 'shape' | 'sticker' | 'image'
  const [keepInside, setKeepInside] = useState(false);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [askNewTemplate, setAskNewTemplate] = useState(false); // confirmation before discarding the current template
  const [hasClip, setHasClip] = useState(false); // something is waiting to be pasted (enables the Paste button)
  const [myStickers, setMyStickers] = useState([]); // images uploaded from the Sticker menu: [{ assetId, name, url }]
  const canvasRef = useRef(null);
  const clipboardRef = useRef(null); // { els, text, pastes }: the copied elements and how many times they were pasted

  const fonts = useMemo(() => SYSTEM_FONTS, []);
  const notify = useCallback((message, kind = 'info') => setToast({ message, kind, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // ---------- template ----------
  // Release an uploaded template's object URL once it is replaced.
  useEffect(() => () => poster?.url.startsWith('blob:') && URL.revokeObjectURL(poster.url), [poster]);

  const uploadTemplate = useCallback(
    async (file) => {
      setBusy(true);
      try {
        const loaded = await loadImageFile(file, IMAGE_TYPES);
        // A PNG can have a transparent zone: that is where the main image goes (under the template).
        const zone = getFileType(file) === 'image/png' ? findBlankZone(loaded.img) : null;
        setPoster({ ...loaded, id: Date.now(), zone });
        setMyStickers([]);
        resetHistory([]);
        setSelectedIds([]);
        setTab('text');
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        setBusy(false);
      }
    },
    [resetHistory, notify],
  );

  // Back to the upload screen (everything on the current template is discarded).
  const newTemplate = useCallback(() => {
    setPoster(null);
    setSelectedIds([]);
    setMyStickers([]);
    clipboardRef.current = null;
    setHasClip(false);
    resetHistory([]);
  }, [resetHistory]);

  // ---------- route ----------
  // '/' is the upload screen and '/edit' the editor. The template only exists in memory, so opening /edit
  // directly (a refresh, a bookmark) goes back to '/'. The Back button from /edit asks before discarding the work.
  useEffect(() => {
    const onEditPath = window.location.pathname === EDIT_PATH;
    if (poster && !onEditPath) window.history.pushState(null, '', EDIT_PATH);
    if (!poster && onEditPath) window.history.replaceState(null, '', '/');
  }, [poster]);

  useEffect(() => {
    const onPop = () => {
      const onEditPath = window.location.pathname === EDIT_PATH;
      if (poster && !onEditPath) {
        window.history.pushState(null, '', EDIT_PATH); // stay in the editor and ask first
        setAskNewTemplate(true);
      } else if (!poster && onEditPath) {
        window.history.replaceState(null, '', '/');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [poster]);

  // Free images no longer referenced by any undo/redo state.
  useEffect(() => {
    const keep = collectAssetIds(history);
    myStickers.forEach((m) => keep.add(m.assetId));
    pruneAssets(keep);
  }, [history, myStickers, pruneAssets]);

  // ---------- selection ----------
  const selectedEls = useMemo(() => elements.filter((el) => selectedIds.includes(el.id)), [elements, selectedIds]);
  const selectedEl = selectedEls.length === 1 ? selectedEls[0] : null; // the sidebar editors work on exactly one element
  const copyable = useMemo(() => selectedEls.filter((el) => !el.main), [selectedEls]); // the main image belongs to the template zone

  // Drop selected ids whose element disappeared (undo, delete…).
  useEffect(() => {
    if (selectedEls.length !== selectedIds.length) setSelectedIds(selectedEls.map((el) => el.id));
  }, [selectedEls, selectedIds]);

  // Selecting one element also opens its menu; a free image opens the menu it came from, the main image always Image.
  const select = useCallback(
    (id) => {
      setSelectedIds(id ? [id] : []);
      const el = elements.find((e) => e.id === id);
      if (el) setTab(el.type === 'image' && !el.main && el.origin === 'sticker' ? 'sticker' : el.type);
    },
    [elements],
  );
  const selectMany = useCallback((ids) => setSelectedIds(ids), []);
  const toggleSelect = useCallback(
    (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    [],
  );

  // ---------- element actions ----------
  const update = useCallback(
    (id, patch, key) =>
      commit(
        (els) => els.map((el) => (el.id === id ? { ...el, ...(typeof patch === 'function' ? patch(el) : patch) } : el)),
        { key },
      ),
    [commit],
  );

  const remove = useCallback(
    (id) => {
      commit((els) => els.filter((el) => el.id !== id));
      setSelectedIds((ids) => ids.filter((x) => x !== id));
    },
    [commit],
  );

  const removeSelected = useCallback(() => {
    const ids = new Set(selectedIds);
    commit((els) => els.filter((el) => !ids.has(el.id)));
    setSelectedIds([]);
  }, [selectedIds, commit]);

  const move = useCallback((id, dir) => commit((els) => moveElement(els, id, dir)), [commit]);

  const addMany = useCallback(
    (list) => {
      commit((els) => [...els, ...list]);
      setSelectedIds(list.map((el) => el.id));
    },
    [commit],
  );
  const add = useCallback((el) => addMany([el]), [addMany]);

  // ---------- clipboard ----------
  // Pastes copies of the copied elements a little down-right of the originals so they are visible; repeated
  // pastes keep stepping. The pasted copies become the selection.
  const pasteElement = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || !poster) return;
    clip.pastes += 1;
    const offset = Math.round(Math.min(poster.width, poster.height) * 0.02) * clip.pastes;
    addMany(clip.els.map((el) => ({ ...el, id: createId(el.type), x: el.x + offset, y: el.y + offset, hidden: false })));
  }, [poster, addMany]);

  const rememberCopy = useCallback((els) => {
    // `text` mirrors what goes to the system clipboard, to tell "paste my elements" from "paste text copied elsewhere".
    const text = els.length === 1 && els[0].type === 'text' ? els[0].text : '';
    clipboardRef.current = { els: JSON.parse(JSON.stringify(els)), text, pastes: 0 };
    setHasClip(true);
    return text;
  }, []);

  // The main image: one per template, replaced (not stacked) when a new file is chosen.
  const setMainImage = useCallback(
    async (file) => {
      if (!poster?.zone) return;
      setBusy(true);
      try {
        const loaded = await loadImageFile(file, IMAGE_TYPES);
        const assetId = addAsset(loaded);
        const next = createMainImageElement(poster.zone, { assetId, width: loaded.width, height: loaded.height, name: loaded.name });
        commit((els) => {
          const existing = els.find((el) => el.type === 'image' && el.main);
          if (!existing) return [next, ...els];
          return els.map((el) => (el === existing ? { ...next, id: existing.id, rotate: existing.rotate, flipX: existing.flipX } : el));
        });
        setSelectedIds([next.id]);
        setTab('image');
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        setBusy(false);
      }
    },
    [poster, addAsset, commit, notify],
  );

  // Free images: any PNG / JPG / WebP added from the Image menu, or uploaded as a sticker (kept in "My stickers").
  const addImage = useCallback(
    async (file, origin = 'image') => {
      if (!poster) return;
      setBusy(true);
      try {
        const loaded = await loadImageFile(file, IMAGE_TYPES);
        const assetId = addAsset(loaded);
        add(createImageElement(poster, { assetId, width: loaded.width, height: loaded.height, name: loaded.name }, origin));
        if (origin === 'sticker') setMyStickers((list) => [...list, { assetId, name: loaded.name, url: loaded.url }]);
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        setBusy(false);
      }
    },
    [poster, addAsset, add, notify],
  );
  const uploadSticker = useCallback((file) => addImage(file, 'sticker'), [addImage]);

  const addMySticker = useCallback(
    (assetId) => {
      const asset = getAsset(assetId);
      if (!poster || !asset) return;
      add(createImageElement(poster, { assetId, width: asset.width, height: asset.height, name: asset.name }, 'sticker'));
    },
    [poster, getAsset, add],
  );

  const addText = useCallback(() => poster && add(createTextElement(poster)), [poster, add]);
  const addShape = useCallback((kind) => poster && add(createShapeElement(poster, kind)), [poster, add]);
  const addSticker = useCallback((stickerId) => poster && add(createStickerElement(poster, stickerId)), [poster, add]);

  // ---------- toolbar ----------
  const reset = useCallback(() => {
    if (!poster) return;
    commit([]);
    setSelectedIds([]);
    notify('Cleared everything on the template. Use Undo to bring it back.');
  }, [poster, commit, notify]);

  const download = useCallback(async () => {
    if (!poster || !canvasRef.current) return;
    setExporting(true);
    try {
      const blob = await canvasRef.current.exportPNG();
      downloadBlob(blob, exportFileName(poster.name));
      notify(`Exported ${poster.width} × ${poster.height}px PNG.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [poster, notify]);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      // Physical key (KeyZ…) so shortcuts also work with a Thai keyboard layout, where e.key is a Thai letter.
      const key = e.code?.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
      if (mod && key === 'z' && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y' && !isTypingTarget(e.target)) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'a' && poster && !isTypingTarget(e.target)) {
        e.preventDefault(); // select every element on the template
        setSelectedIds(elements.filter((el) => !el.main).map((el) => el.id));
        return;
      }
      if (mod && key === 'd' && copyable.length && !isTypingTarget(e.target)) {
        e.preventDefault(); // browsers bookmark the page on Ctrl+D
        rememberCopy(copyable);
        pasteElement();
        return;
      }
      if (isTypingTarget(e.target) || !selectedEls.length) return;
      if (e.key === 'Escape') setSelectedIds([]);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelected();
      }
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key] && copyable.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = arrows[e.key];
        const ids = new Set(copyable.map((el) => el.id));
        commit((els) => els.map((el) => (ids.has(el.id) ? { ...el, x: el.x + dx * step, y: el.y + dy * step } : el)), {
          key: `nudge:${[...ids].join(',')}`,
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, poster, elements, selectedEls, copyable, commit, removeSelected, rememberCopy, pasteElement]);

  // Copy / cut / paste go through the browser's clipboard events: they work with any keyboard layout and the
  // Edit menu, and leave typing fields alone. Pasting text copied elsewhere makes a new text box.
  useEffect(() => {
    const onCopy = (e, cut = false) => {
      if (isTypingTarget(e.target) || !copyable.length) return;
      e.clipboardData.setData('text/plain', rememberCopy(copyable));
      e.preventDefault();
      if (cut) removeSelected();
    };
    const onCut = (e) => onCopy(e, true);
    const onPaste = (e) => {
      if (isTypingTarget(e.target) || !poster) return;
      const picture = Array.from(e.clipboardData.files || []).find((f) => IMAGE_TYPES.includes(f.type));
      if (picture) {
        e.preventDefault();
        addImage(picture);
        return;
      }
      const text = e.clipboardData.getData('text/plain');
      const clip = clipboardRef.current;
      e.preventDefault();
      if (clip && text === clip.text) pasteElement(); // our own elements
      else if (text.trim()) add(createTextElement(poster, { text: text.slice(0, 1000) })); // text from elsewhere
      else if (clip) pasteElement();
    };
    window.addEventListener('copy', onCopy);
    window.addEventListener('cut', onCut);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('cut', onCut);
      window.removeEventListener('paste', onPaste);
    };
  }, [poster, copyable, removeSelected, add, addImage, rememberCopy, pasteElement]);

  const actions = { addText, addShape, addSticker, addImage, uploadSticker, addMySticker, setMainImage, select, update, remove, move };

  return (
    <div className="app">
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        onDownload={download}
        onNewTemplate={() => setAskNewTemplate(true)}
        onCopy={() => copyable.length && rememberCopy(copyable)}
        onPaste={pasteElement}
        canCopy={copyable.length > 0}
        canPaste={hasClip}
        hasTemplate={Boolean(poster)}
        hasPoster={Boolean(poster)}
        exporting={exporting}
      />
      {poster ? (
        <div className="editor">
          <Sidebar
            poster={poster}
            elements={elements}
            selectedEl={selectedEl}
            selectedIds={selectedIds}
            tab={tab}
            onTab={setTab}
            fonts={fonts}
            actions={actions}
            getAsset={getAsset}
            busy={busy}
            myStickers={myStickers}
          />
          <main className="main">
            <PosterCanvas
              key={poster.id}
              ref={canvasRef}
              poster={poster}
              elements={elements}
              getAsset={getAsset}
              selectedIds={selectedIds}
              onSelect={select}
              onToggle={toggleSelect}
              onSelectMany={selectMany}
              onChange={update}
              keepInside={keepInside}
              onToggleKeepInside={setKeepInside}
            />
          </main>
        </div>
      ) : (
        <LandingScreen onFile={uploadTemplate} busy={busy} stage="กำลังโหลดรูป template…" />
      )}
      <ConfirmDialog
        open={askNewTemplate}
        title="เริ่มใหม่ด้วย template อื่น?"
        message="ข้อความ รูปทรง สติกเกอร์ และรูปทั้งหมดที่เพิ่มไว้บน template นี้จะหายไป และย้อนกลับด้วย Undo ไม่ได้"
        confirmLabel="เริ่มใหม่"
        cancelLabel="ยกเลิก"
        danger
        onConfirm={() => {
          setAskNewTemplate(false);
          newTemplate();
        }}
        onCancel={() => setAskNewTemplate(false)}
      />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

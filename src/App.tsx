import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ColorEditPopover from './components/ColorEditPopover';
import ColourPicker from './components/ColourPicker';
import ColourPalette from './components/ColourPalette';
import HotkeysModal from './components/HotkeysModal';
import { useHistory } from './hooks/useHistory';
import type { Shape, Tool } from './types';
import './App.css';

const DEFAULT_COLOR = '#4f8ef7';
const DEFAULT_BG_COLOR = '#ffffff';

const TOOL_SHORTCUTS: Record<string, Tool> = {
  a: 'select',  '1': 'select',
  r: 'rectangle', '2': 'rectangle',
  c: 'circle',    '3': 'circle',
  p: 'pen',       '4': 'pen',
};

const DOUBLE_SPACE_MS = 400;

interface EditingPopover {
  shapeId: string;
  clientX: number;
  clientY: number;
}

interface DocumentState {
  shapes: Shape[];
  bgColor: string;
}

function App() {
  const history = useHistory<DocumentState>({ shapes: [], bgColor: DEFAULT_BG_COLOR });
  const [tool, setTool] = useState<Tool>('rectangle');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [bgDraft, setBgDraft] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPopover, setEditingPopover] = useState<EditingPopover | null>(null);
  const [colorDraft, setColorDraft] = useState<{ shapeId: string; color: string } | null>(null);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const lastSpaceRef = useRef(0);

  const handleRecolor = useCallback(
    (oldColor: string, newColor: string) => {
      if (oldColor === newColor) return;
      const next = history.present.shapes.map((s) =>
        s.color === oldColor ? { ...s, color: newColor } : s,
      );
      history.set({ ...history.present, shapes: next });
      setColor(newColor);
    },
    [history],
  );

  // Applies a whole batch of colour swaps (e.g. from "Randomize Palette") as a
  // single history entry, so undo/redo reverts/reapplies the entire shuffle
  // in one step rather than one step per swatch.
  const handleRandomizePalette = useCallback(
    (mapping: { from: string; to: string }[]) => {
      const changeMap = new Map<string, string>();
      for (const { from, to } of mapping) {
        if (from !== to) changeMap.set(from.toLowerCase(), to);
      }
      if (changeMap.size === 0) return;

      const next = history.present.shapes.map((s) => {
        const replacement = changeMap.get(s.color.toLowerCase());
        return replacement ? { ...s, color: replacement } : s;
      });
      history.set({ ...history.present, shapes: next });

      const currentReplacement = changeMap.get(color.toLowerCase());
      if (currentReplacement) setColor(currentReplacement);
    },
    [history, color],
  );

  // Shapes with any in-progress (uncommitted) color edit applied, for live preview.
  const displayShapes = useMemo(() => {
    if (!colorDraft) return history.present.shapes;
    return history.present.shapes.map((s) =>
      s.id === colorDraft.shapeId ? { ...s, color: colorDraft.color } : s,
    );
  }, [history.present, colorDraft]);

  const displayBgColor = bgDraft ?? history.present.bgColor;

  const editingShape = useMemo(() => {
    if (!editingPopover) return null;
    return displayShapes.find((s) => s.id === editingPopover.shapeId) ?? null;
  }, [editingPopover, displayShapes]);

  const handleCommit = useCallback(
    (next: Shape[]) => {
      history.set({ ...history.present, shapes: next });
    },
    [history],
  );

  const handleSelect = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const handleDoubleClickShape = useCallback((shape: Shape, clientX: number, clientY: number) => {
    setEditingPopover({ shapeId: shape.id, clientX, clientY });
  }, []);

  const handleColorDraftChange = useCallback(
    (newColor: string) => {
      if (!editingPopover) return;
      setColorDraft({ shapeId: editingPopover.shapeId, color: newColor });
    },
    [editingPopover],
  );

  const commitColorDraft = useCallback(() => {
    if (colorDraft) {
      const next = history.present.shapes.map((s) =>
        s.id === colorDraft.shapeId ? { ...s, color: colorDraft.color } : s,
      );
      history.set({ ...history.present, shapes: next });
      setColor(colorDraft.color);
      setColorDraft(null);
    }
  }, [colorDraft, history]);

  const handleClosePopover = useCallback(() => {
    commitColorDraft();
    setEditingPopover(null);
  }, [commitColorDraft]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    history.set({ ...history.present, shapes: history.present.shapes.filter((s) => !ids.has(s.id)) });
    setSelectedIds([]);
  }, [selectedIds, history]);

  const handleClearCanvas = useCallback(() => {
    if (history.present.shapes.length === 0) return;
    history.set({ shapes: [], bgColor: DEFAULT_BG_COLOR });
    setSelectedIds([]);
  }, [history]);

  const commitBgDraft = useCallback(() => {
    if (bgDraft !== null && bgDraft !== history.present.bgColor) {
      history.set({ ...history.present, bgColor: bgDraft });
    }
    setBgDraft(null);
  }, [bgDraft, history]);

  const handleBgPickerClose = useCallback(() => {
    commitBgDraft();
    setBgPickerOpen(false);
  }, [commitBgDraft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        return;
      }
      if (isMod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        history.redo();
        return;
      }
      if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      if (!isTyping && e.key === ' ' && !isMod) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastSpaceRef.current < DOUBLE_SPACE_MS) {
          lastSpaceRef.current = 0;
          setColorPickerOpen(false);
          setPaletteOpen(true);
        } else {
          lastSpaceRef.current = now;
          setPaletteOpen(false);
          setColorPickerOpen((v) => !v);
        }
        return;
      }

      if (!isTyping && e.key === 'Tab' && !isMod) {
        e.preventDefault();
        setBgPickerOpen((v) => {
          if (v) commitBgDraft();
          return !v;
        });
        return;
      }

      if (!isTyping && !isMod && !e.altKey) {
        const toolKey = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (toolKey) {
          e.preventDefault();
          setTool(toolKey);
          setSelectedIds([]);
          setEditingPopover(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, selectedIds, deleteSelected, commitBgDraft]);

  const handleToolChange = useCallback((next: Tool) => {
    setTool(next);
    setSelectedIds([]);
    setEditingPopover(null);
  }, []);

    const paletteColors = useMemo(() => {
    const source = selectedIds.length > 0
      ? displayShapes.filter((s) => selectedIds.includes(s.id))
      : displayShapes;
    return source.map((s) => s.color);
  }, [displayShapes, selectedIds]);

  return (
    <div className="app">
      <Canvas
        shapes={displayShapes}
        onCommit={handleCommit}
        tool={tool}
        color={color}
        bgColor={displayBgColor}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onDoubleClickShape={handleDoubleClickShape}
      />

      <Toolbar
        tool={tool}
        color={color}
        colorPickerOpen={colorPickerOpen}
        onToolChange={handleToolChange}
        onColorChange={setColor}
        onColorPickerToggle={() => setColorPickerOpen((v) => !v)}
        onColorPickerClose={() => setColorPickerOpen(false)}
        onPaletteOpen={() => setPaletteOpen(true)}
        onHotkeysOpen={() => setHotkeysOpen(true)}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onClearCanvas={handleClearCanvas}
        canClear={history.present.shapes.length > 0}
      />

      {editingShape && editingPopover && (
        <ColorEditPopover
          color={editingShape.color}
          clientX={editingPopover.clientX}
          clientY={editingPopover.clientY}
          onChange={handleColorDraftChange}
          onClose={handleClosePopover}
        />
      )}

      <div className="bg-color-picker">
        <button
          type="button"
          className="bg-color-swatch"
          style={{ background: displayBgColor }}
          onClick={() => setBgPickerOpen((v) => !v)}
          title="Background colour (Tab)"
          aria-label="Background colour"
        />
        {bgPickerOpen && (
          <div className="bg-color-popover">
            <ColourPicker
              color={displayBgColor}
              onChange={setBgDraft}
              onClose={handleBgPickerClose}
            />
          </div>
        )}
      </div>

      {paletteOpen && (
        <ColourPalette
          colors={paletteColors}
          onClose={() => setPaletteOpen(false)}
          onSelectColor={setColor}
          onRecolor={handleRecolor}
          onRandomizePalette={handleRandomizePalette}
        />
      )}

      {hotkeysOpen && (
        <HotkeysModal onClose={() => setHotkeysOpen(false)} />
      )}
    </div>
  );
}

export default App;

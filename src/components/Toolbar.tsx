import { useRef } from 'react';
import type { Tool } from '../types';
import ColourPicker from './ColourPicker';

interface ToolbarProps {
  tool: Tool;
  color: string;
  colorPickerOpen: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onColorPickerToggle: () => void;
  onColorPickerClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onPaletteOpen: () => void;
  onHotkeysOpen: () => void;
  onClearCanvas: () => void;
  canClear: boolean;
}

interface ToolDef {
  id: Tool;
  label: string;
  shortcut: string;
  isShape: boolean;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'A/1', isShape: false },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R/2', isShape: true },
  { id: 'circle', label: 'Circle', shortcut: 'C/3', isShape: true },
  { id: 'pen', label: 'Pen', shortcut: 'P/4', isShape: true },
];

function ToolIcon({ t, color, active }: { t: ToolDef; color: string; active: boolean }) {
  if (!t.isShape) {
    // Filled mouse-pointer/cursor icon for the Select tool.
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M4.5 2.8 L4.5 16.4 L7.9 13.1 L10.3 18.3 L12.6 17.2 L10.2 12 L14.6 11.6 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const iconColor = active ? '#fff' : color;

  if (t.id === 'rectangle') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="2" fill={iconColor} />
      </svg>
    );
  }

  if (t.id === 'circle') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7" fill={iconColor} />
      </svg>
    );
  }

  // Pen: a small stroke line
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 15 Q8 5 15 7"
        fill="none"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Toolbar({ tool, color, colorPickerOpen, onToolChange, onColorChange, onColorPickerToggle, onColorPickerClose, onUndo, onRedo, canUndo, canRedo, onPaletteOpen, onHotkeysOpen, onClearCanvas, canClear }: ToolbarProps) {
  const swatchRef = useRef<HTMLButtonElement>(null);

  const popoverStyle: React.CSSProperties | undefined = colorPickerOpen && swatchRef.current
    ? (() => {
        const r = swatchRef.current.getBoundingClientRect();
        return { position: 'fixed' as const, left: r.left + r.width / 2, bottom: window.innerHeight - r.top + 8 };
      })()
    : undefined;

  return (
    <>
      <div className="toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`toolbar-btn${tool === t.id ? ' active' : ''}`}
            title={`${t.label} (${t.shortcut})`}
            aria-label={t.label}
            aria-pressed={tool === t.id}
            onClick={() => onToolChange(t.id)}
          >
            <ToolIcon t={t} color={color} active={tool === t.id} />
          </button>
        ))}
        <div className="toolbar-divider" />

        <button
          type="button"
          className="toolbar-btn"
          title="Colour palette (Space ×2)"
          aria-label="Colour palette"
          onClick={onPaletteOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="6" cy="6" r="3.5" fill="#4F8EF7" />
            <circle cx="13" cy="7" r="3" fill="#FF5733" />
            <circle cx="9" cy="13" r="3.5" fill="#33A852" />
          </svg>
        </button>

        <button
          ref={swatchRef}
          type="button"
          className="toolbar-color-swatch"
          style={{ background: color }}
          title="Change colour (Space)"
          aria-label="Change colour"
          onClick={onColorPickerToggle}
        />

        <div className="toolbar-divider" />

        <button
          type="button"
          className="toolbar-btn"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <span aria-hidden="true">&#8634;</span>
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Redo (Ctrl+Y/Ctrl+Shift+Z)"
          aria-label="Redo"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <span aria-hidden="true">&#8635;</span>
        </button>

        <button
          type="button"
          className="toolbar-btn"
          title="Clear canvas"
          aria-label="Clear canvas"
          onClick={onClearCanvas}
          disabled={!canClear}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          type="button"
          className="toolbar-btn"
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
          onClick={onHotkeysOpen}
        >
          <span aria-hidden="true" style={{ fontSize: '18px', fontWeight: 600 }}>?</span>
        </button>
      </div>

      {colorPickerOpen && popoverStyle && (
        <div className="color-popover toolbar-color-popover" style={popoverStyle}>
          <ColourPicker
            color={color}
            onChange={(c) => { onColorChange(c); }}
            onClose={onColorPickerClose}
          />
        </div>
      )}
    </>
  );
}

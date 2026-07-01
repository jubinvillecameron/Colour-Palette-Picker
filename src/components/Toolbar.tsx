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
    return <span aria-hidden="true">{'\u2196'}</span>;
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

export default function Toolbar({ tool, color, colorPickerOpen, onToolChange, onColorChange, onColorPickerToggle, onColorPickerClose, onUndo, onRedo, canUndo, canRedo, onPaletteOpen, onHotkeysOpen }: ToolbarProps) {
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

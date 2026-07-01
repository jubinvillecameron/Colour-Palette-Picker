import { useEffect, useRef } from 'react';

interface HotkeysModalProps {
  onClose: () => void;
}

type HotkeyEntry =
  | { keys: string; action: string; type: 'single' }
  | { keys: string; action: string; type: 'dual' }
  | { keys: string; action: string; type: 'toggle' };

const hotkeys: { section: string; entries: HotkeyEntry[] }[] = [
  {
    section: 'Tools',
    entries: [
      { keys: 'A / 1', action: 'Select tool', type: 'single' },
      { keys: 'R / 2', action: 'Rectangle tool', type: 'single' },
      { keys: 'C / 3', action: 'Circle tool', type: 'single' },
      { keys: 'P / 4', action: 'Pen tool', type: 'single' },
    ],
  },
  {
    section: 'Canvas',
    entries: [
      { keys: 'Ctrl/Cmd + click', action: 'Multi-select toggle', type: 'dual' },
      { keys: 'Drag on empty space', action: 'Marquee select', type: 'single' },
      { keys: 'Double-click shape', action: 'Edit shape colour', type: 'single' },
      { keys: 'Delete / Backspace', action: 'Delete selected shapes', type: 'single' },
    ],
  },
  {
    section: 'Panels',
    entries: [
      { keys: 'Space', action: 'Toggle colour picker', type: 'toggle' },
      { keys: 'Space ×2', action: 'Open colour palette', type: 'dual' },
      { keys: 'Tab', action: 'Toggle background colour', type: 'toggle' },
    ],
  },
  {
    section: 'History',
    entries: [
      { keys: 'Ctrl/Cmd + Z', action: 'Undo', type: 'dual' },
      { keys: 'Ctrl/Cmd + Y', action: 'Redo', type: 'dual' },
      { keys: 'Ctrl/Cmd + Shift + Z', action: 'Redo', type: 'dual' },
    ],
  },
];

export default function HotkeysModal({ onClose }: HotkeysModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="hotkeys-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="hotkeys-modal">
        <div className="hotkeys-header">
          <h2 className="hotkeys-title">Keyboard Shortcuts</h2>
          <button type="button" className="hotkeys-close" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>
        <div className="hotkeys-body">
          {hotkeys.map((group) => (
            <div key={group.section} className="hotkeys-group">
              <h3 className="hotkeys-section">{group.section}</h3>
              {group.entries.map((entry, i) => (
                <div key={i} className="hotkeys-row">
                  <span className="hotkeys-key">{entry.keys}</span>
                  <span className="hotkeys-action">{entry.action}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
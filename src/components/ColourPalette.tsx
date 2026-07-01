import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard, hexToRgba, colorLuminance, generateRandomPalette } from '../utils/color';
import ColourPicker from './ColourPicker';

interface ColourPaletteProps {
  colors: string[];
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onRecolor: (oldColor: string, newColor: string) => void;
  onRandomizePalette: (mapping: { from: string; to: string }[]) => void;
}

function dedupeAndSort(colors: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of colors) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  unique.sort((a, b) => colorLuminance(b) - colorLuminance(a));
  return unique;
}

const PALETTE_MARGIN = 16;

export default function ColourPalette({ colors, onClose, onSelectColor, onRecolor, onRandomizePalette }: ColourPaletteProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: PALETTE_MARGIN, y: PALETTE_MARGIN });
  const [dragging, setDragging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recoloring, setRecoloring] = useState<{
    oldColor: string;
    color: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const sorted = dedupeAndSort(colors);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!recoloring) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, recoloring]);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.palette-close')) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const width = panelRef.current?.offsetWidth ?? 340;
    const height = panelRef.current?.offsetHeight ?? 400;
    const maxX = Math.max(PALETTE_MARGIN, window.innerWidth - width - PALETTE_MARGIN);
    const maxY = Math.max(PALETTE_MARGIN, window.innerHeight - height - PALETTE_MARGIN);
    const nextX = Math.min(Math.max(PALETTE_MARGIN, e.clientX - dragRef.current.offsetX), maxX);
    const nextY = Math.min(Math.max(PALETTE_MARGIN, e.clientY - dragRef.current.offsetY), maxY);
    setPos({ x: nextX, y: nextY });
  }, []);

  const handleHeaderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const copy = useCallback(async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1000);
    }
  }, []);

  const handleSelect = useCallback(
    (hex: string) => {
      onSelectColor(hex);
    },
    [onSelectColor],
  );

  const handleSwatchClick = useCallback(
    (hex: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setRecoloring({ oldColor: hex, color: hex, clientX: e.clientX, clientY: e.clientY });
    },
    [],
  );

  const handleRecolorChange = useCallback(
    (newColor: string) => {
      setRecoloring((prev) => prev ? { ...prev, color: newColor } : null);
    },
    [],
  );

  const handleRecolorClose = useCallback(() => {
    if (recoloring) {
      onRecolor(recoloring.oldColor, recoloring.color);
    }
    setRecoloring(null);
  }, [recoloring, onRecolor]);

  const handleRandomize = useCallback(() => {
    if (sorted.length === 0) return;
    setRecoloring(null);
    const next = generateRandomPalette(sorted);
    onRandomizePalette(sorted.map((from, i) => ({ from, to: next[i] })));
  }, [sorted, onRandomizePalette]);

  return (
    <>
      <div
        className="palette-panel"
        ref={panelRef}
        style={{ left: pos.x, top: pos.y }}
      >
        <div
          className={`palette-header${dragging ? ' dragging' : ''}`}
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerUp}
        >
          <h2 className="palette-title">Colour Palette</h2>
          <button
            type="button"
            className="palette-close"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        {sorted.length > 0 && (
          <div className="palette-toolbar">
            <button
              type="button"
              className="palette-randomize-btn"
              onClick={handleRandomize}
              title="Generate a new random colour for each swatch, keeping brightness similar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="16 3 21 3 21 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <polyline points="21 16 21 21 16 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="4" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Randomize
            </button>
          </div>
        )}

        {sorted.length === 0 ? (
          <p className="palette-empty">No colours to show.</p>
        ) : (
          <div className="palette-list">
            {sorted.map((hex) => {
              const rgba = hexToRgba(hex);
              const hexKey = hex + '-hex';
              const rgbaKey = hex + '-rgba';
              const isRecoloring = recoloring?.oldColor === hex;
              const displayHex = isRecoloring ? recoloring.color : hex;
              const displayRgba = isRecoloring ? hexToRgba(recoloring.color) : rgba;

              return (
                <div key={hex} className="palette-row">
                  <button
                    type="button"
                    className="palette-row-select"
                    onClick={() => handleSelect(displayHex)}
                    title="Set as current colour"
                  >
                    <span
                      className="palette-row-swatch"
                      style={{ background: displayHex }}
                      onClick={(e) => handleSwatchClick(hex, e)}
                      title="Recolour all shapes of this colour"
                    />
                    <span className="palette-row-hex">{displayHex.toUpperCase()}</span>
                    <span className="palette-row-rgba">{displayRgba}</span>
                  </button>
                  <div className="palette-row-actions">
                    <button
                      type="button"
                      className="palette-row-copy-btn"
                      onClick={(e) => { e.stopPropagation(); copy(hexKey, displayHex.toUpperCase()); }}
                    >
                      {copiedKey === hexKey ? 'Copied' : 'Hex'}
                    </button>
                    <button
                      type="button"
                      className="palette-row-copy-btn"
                      onClick={(e) => { e.stopPropagation(); copy(rgbaKey, displayRgba); }}
                    >
                      {copiedKey === rgbaKey ? 'Copied' : 'RGBA'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recoloring && (
        <div
          className="color-popover"
          style={{
            position: 'fixed',
            zIndex: 35,
            left: Math.min(recoloring.clientX, window.innerWidth - 220),
            top: Math.min(recoloring.clientY, window.innerHeight - 200),
            padding: '12px',
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ColourPicker
            color={recoloring.color}
            onChange={handleRecolorChange}
            onClose={handleRecolorClose}
          />
        </div>
      )}
    </>
  );
}
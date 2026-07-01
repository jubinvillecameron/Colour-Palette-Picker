import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard, hexToRgba, colorLuminance } from '../utils/color';
import ColourPicker from './ColourPicker';

interface ColourPaletteProps {
  colors: string[];
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onRecolor: (oldColor: string, newColor: string) => void;
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

export default function ColourPalette({ colors, onClose, onSelectColor, onRecolor }: ColourPaletteProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
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

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  }, [onClose]);

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

  return (
    <div className="palette-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="palette-modal">
        <div className="palette-header">
          <h2 className="palette-title">Colour Palette</h2>
          <button type="button" className="palette-close" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>

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
    </div>
  );
}
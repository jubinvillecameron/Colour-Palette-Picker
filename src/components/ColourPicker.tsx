import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard, hexToRgba, normaliseHex } from '../utils/color';

interface ColourPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export default function ColourPicker({ color, onChange, onClose }: ColourPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  useEffect(() => {
    setHexInput(color.toUpperCase());
  }, [color]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleHexBlur = useCallback(() => {
    const norm = normaliseHex(hexInput);
    if (norm) {
      onChange(norm);
    } else {
      setHexInput(color.toUpperCase());
    }
  }, [hexInput, color, onChange]);

  const handleHexKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const norm = normaliseHex(hexInput);
        if (norm) {
          onChange(norm);
        } else {
          setHexInput(color.toUpperCase());
        }
      }
    },
    [hexInput, color, onChange],
  );

  const copy = useCallback(async (label: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 1000);
    }
  }, []);

  const upHex = color.toUpperCase();
  const rgba = hexToRgba(color);
  const copyHex = useCallback(() => copy('hex', upHex), [copy, upHex]);
  const copyRgba = useCallback(() => copy('rgba', rgba), [copy, rgba]);

  return (
    <div className="colour-picker" ref={panelRef}>
      <div className="colour-picker-top">
        <input
          type="color"
          className="colour-picker-swatch"
          value={color}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="colour-picker-hex-input"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={handleHexKeyDown}
          spellCheck={false}
          aria-label="Hex colour"
        />
      </div>

      <div className="colour-picker-rows">
        <button
          type="button"
          className="colour-picker-row"
          onClick={copyHex}
        >
          <span className="colour-picker-row-value">{upHex}</span>
          <span className="colour-picker-row-action">
            {copiedLabel === 'hex' ? 'Copied' : 'Copy'}
          </span>
        </button>

        <button
          type="button"
          className="colour-picker-row"
          onClick={copyRgba}
        >
          <span className="colour-picker-row-value">{rgba}</span>
          <span className="colour-picker-row-action">
            {copiedLabel === 'rgba' ? 'Copied' : 'Copy'}
          </span>
        </button>
      </div>
    </div>
  );
}

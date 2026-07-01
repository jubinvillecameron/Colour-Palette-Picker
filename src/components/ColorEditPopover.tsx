import ColourPicker from './ColourPicker';

interface ColorEditPopoverProps {
  color: string;
  clientX: number;
  clientY: number;
  onChange: (color: string) => void;
  onClose: () => void;
}

export default function ColorEditPopover({ color, clientX, clientY, onChange, onClose }: ColorEditPopoverProps) {
  const style: React.CSSProperties = {
    left: Math.min(clientX, window.innerWidth - 220),
    top: Math.min(clientY, window.innerHeight - 200),
  };

  return (
    <div className="color-popover" style={style}>
      <ColourPicker color={color} onChange={onChange} onClose={onClose} />
    </div>
  );
}

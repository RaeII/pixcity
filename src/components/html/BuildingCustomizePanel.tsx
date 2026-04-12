import { useState } from "react";
import { PanelSection } from "./controls/PanelSection";
import { ColorField } from "./controls/ColorField";

type BuildingCustomizePanelProps = {
  donationId: number;
  initialColor: string;
  onColorChange: (donationId: number, color: string) => void;
  onClose: () => void;
};

export function BuildingCustomizePanel({
  donationId,
  initialColor,
  onColorChange,
  onClose,
}: BuildingCustomizePanelProps) {
  const [color, setColor] = useState(initialColor);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onColorChange(donationId, newColor);
  };

  return (
    <div className="absolute right-4 top-4 z-30 flex w-72 flex-col rounded-2xl border border-white/10 bg-black/70 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-medium">Personalizar Edifício</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1L13 13M1 13L13 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <PanelSection title="Aparência">
          <ColorField
            label="Cor do edifício"
            value={color}
            onChange={handleColorChange}
          />
        </PanelSection>
      </div>
    </div>
  );
}

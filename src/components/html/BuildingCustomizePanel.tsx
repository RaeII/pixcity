import { useState } from "react";
import { PanelSection } from "./controls/PanelSection";
import { ColorField } from "./controls/ColorField";
import { RangeField } from "./controls/RangeField";
import type { EdgeLightType, RooftopType } from "../../scene/types";

const ROOFTOP_OPTIONS: { value: RooftopType; label: string }[] = [
  { value: "none", label: "Nenhuma" },
  { value: "spotlights", label: "Holofotes" },
  { value: "helipad", label: "Heliponto" },
];

const EDGE_LIGHT_OPTIONS: { value: EdgeLightType; label: string }[] = [
  { value: "none", label: "Desligado" },
  { value: "led", label: "LED" },
];

const SIDE_OPTIONS = [
  { value: 1, label: "1 lado" },
  { value: 2, label: "2 lados" },
  { value: 3, label: "3 lados" },
  { value: 4, label: "4 lados" },
];

type BuildingCustomizePanelProps = {
  donationId: number;
  initialColor: string;
  initialRooftopType: RooftopType;
  initialSignText: string;
  initialSignSides: number;
  initialEdgeLightType: EdgeLightType;
  initialEdgeLightColor: string;
  initialEdgeLightIntensity: number;
  initialEdgeLightDistance: number;
  onColorChange: (donationId: number, color: string) => void;
  onRooftopChange: (donationId: number, rooftopType: RooftopType) => void;
  onSignTextChange: (donationId: number, signText: string) => void;
  onSignSidesChange: (donationId: number, signSides: number) => void;
  onEdgeLightTypeChange: (donationId: number, edgeLightType: EdgeLightType) => void;
  onEdgeLightColorChange: (donationId: number, edgeLightColor: string) => void;
  onEdgeLightIntensityChange: (donationId: number, edgeLightIntensity: number) => void;
  onEdgeLightDistanceChange: (donationId: number, edgeLightDistance: number) => void;
  onClose: () => void;
};

export function BuildingCustomizePanel({
  donationId,
  initialColor,
  initialRooftopType,
  initialSignText,
  initialSignSides,
  initialEdgeLightType,
  initialEdgeLightColor,
  initialEdgeLightIntensity,
  initialEdgeLightDistance,
  onColorChange,
  onRooftopChange,
  onSignTextChange,
  onSignSidesChange,
  onEdgeLightTypeChange,
  onEdgeLightColorChange,
  onEdgeLightIntensityChange,
  onEdgeLightDistanceChange,
  onClose,
}: BuildingCustomizePanelProps) {
  const [color, setColor] = useState(initialColor);
  const [rooftopType, setRooftopType] = useState<RooftopType>(initialRooftopType);
  const [signText, setSignText] = useState(initialSignText);
  const [signSides, setSignSides] = useState(initialSignSides);
  const [edgeLightType, setEdgeLightType] = useState<EdgeLightType>(initialEdgeLightType);
  const [edgeLightColor, setEdgeLightColor] = useState(initialEdgeLightColor);
  const [edgeLightIntensity, setEdgeLightIntensity] = useState(initialEdgeLightIntensity);
  const [edgeLightDistance, setEdgeLightDistance] = useState(initialEdgeLightDistance);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onColorChange(donationId, newColor);
  };

  const handleRooftopChange = (newType: RooftopType) => {
    setRooftopType(newType);
    onRooftopChange(donationId, newType);
  };

  const handleSignTextChange = (text: string) => {
    setSignText(text);
    onSignTextChange(donationId, text);
  };

  const handleSignSidesChange = (sides: number) => {
    setSignSides(sides);
    onSignSidesChange(donationId, sides);
  };

  const handleEdgeLightTypeChange = (newType: EdgeLightType) => {
    setEdgeLightType(newType);
    onEdgeLightTypeChange(donationId, newType);
  };

  const handleEdgeLightColorChange = (newColor: string) => {
    setEdgeLightColor(newColor);
    onEdgeLightColorChange(donationId, newColor);
  };

  const handleEdgeLightIntensityChange = (newIntensity: number) => {
    setEdgeLightIntensity(newIntensity);
    onEdgeLightIntensityChange(donationId, newIntensity);
  };

  const handleEdgeLightDistanceChange = (newDistance: number) => {
    setEdgeLightDistance(newDistance);
    onEdgeLightDistanceChange(donationId, newDistance);
  };

  return (
    <div className="absolute right-4 top-4 z-30 flex max-h-[calc(100vh-2rem)] w-72 flex-col rounded-2xl border border-white/10 bg-black/70 text-white shadow-2xl backdrop-blur-md">
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
      <div className="space-y-4 overflow-y-auto p-4">
        <PanelSection title="Aparência">
          <ColorField
            label="Cor do edifício"
            value={color}
            onChange={handleColorChange}
          />
        </PanelSection>
        <PanelSection title="Letreiro">
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Marca ou empresa</span>
            <input
              type="text"
              value={signText}
              onChange={(e) => handleSignTextChange(e.target.value)}
              placeholder="Ex: Acme Corp"
              maxLength={30}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
            />
          </label>
          {signText.trim() && (
            <div className="mt-3">
              <span className="mb-2 block text-sm text-white/75">Lados visíveis</span>
              <div className="flex gap-2">
                {SIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSignSidesChange(option.value)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                      signSides === option.value
                        ? "border-white/40 bg-white/15 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </PanelSection>
        <PanelSection title="Topo">
          <div className="grid grid-cols-2 gap-2">
            {ROOFTOP_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRooftopChange(option.value)}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  rooftopType === option.value
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </PanelSection>
        <PanelSection title="LED de arestas">
          <div className="grid grid-cols-2 gap-2">
            {EDGE_LIGHT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleEdgeLightTypeChange(option.value)}
                className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                  edgeLightType === option.value
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {edgeLightType !== "none" && (
            <div className="mt-3">
              <ColorField
                label="Cor do LED"
                value={edgeLightColor}
                onChange={handleEdgeLightColorChange}
              />
              <div className="mt-4 border-t border-white/10 pt-4">
                <RangeField
                  label="Intensidade"
                  value={edgeLightIntensity}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={handleEdgeLightIntensityChange}
                  valueLabel={edgeLightIntensity.toFixed(1)}
                />
                <RangeField
                  label="Distância da Luz"
                  value={edgeLightDistance}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  onChange={handleEdgeLightDistanceChange}
                  valueLabel={edgeLightDistance.toFixed(2)}
                />
              </div>
            </div>
          )}
        </PanelSection>
      </div>
    </div>
  );
}

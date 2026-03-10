import type { GroundMaterialType, GroundSettings } from "../../scene/types";
import { ColorField } from "./controls/ColorField";
import { PanelSection } from "./controls/PanelSection";

type GroundControlsProps = {
  value: GroundSettings;
  onChange: (settings: GroundSettings) => void;
};

export function GroundControls({ value, onChange }: GroundControlsProps) {
  return (
    <PanelSection title="Chão" description="Altere a cor do chão e o acabamento do material.">
      <ColorField
        label="Cor do chão"
        value={value.color}
        onChange={(color) => onChange({ ...value, color })}
        placeholder="#0d1016"
      />

      <label className="mt-4 block">
        <span className="mb-2 block text-sm text-white/75">Material do chão</span>
        <select
          value={value.materialType}
          onChange={(event) =>
            onChange({ ...value, materialType: event.target.value as GroundMaterialType })
          }
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
        >
          <option value="standard" className="bg-[#0b0d11] text-white">
            Standard
          </option>
          <option value="matte" className="bg-[#0b0d11] text-white">
            Fosco
          </option>
          <option value="soft-metal" className="bg-[#0b0d11] text-white">
            Metal suave
          </option>
          <option value="polished" className="bg-[#0b0d11] text-white">
            Polido
          </option>
        </select>
      </label>
    </PanelSection>
  );
}

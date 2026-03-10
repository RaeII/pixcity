import type { RenderDirectionSettings } from "../../scene/types";
import { PanelSection } from "./controls/PanelSection";
import { RangeField } from "./controls/RangeField";

type RenderDirectionControlsProps = {
  value: RenderDirectionSettings;
  onChange: (settings: RenderDirectionSettings) => void;
};

export function RenderDirectionControls({
  value,
  onChange,
}: RenderDirectionControlsProps) {
  return (
    <PanelSection
      title="Direção de renderização"
      description="Chunks à frente permanecem mais tempo carregados. Laterais e trás usam distância menor."
    >
      <RangeField
        label="Frente da câmera"
        value={value.forwardDistance}
        min={1}
        max={14}
        step={0.5}
        valueLabel={value.forwardDistance.toFixed(1)}
        onChange={(forwardDistance) => onChange({ ...value, forwardDistance })}
      />

      <RangeField
        label="Laterais"
        value={value.sideDistance}
        min={1}
        max={12}
        step={0.5}
        valueLabel={value.sideDistance.toFixed(1)}
        onChange={(sideDistance) => onChange({ ...value, sideDistance })}
      />

      <RangeField
        label="Trás da câmera"
        value={value.backwardDistance}
        min={0}
        max={10}
        step={0.5}
        valueLabel={value.backwardDistance.toFixed(1)}
        onChange={(backwardDistance) => onChange({ ...value, backwardDistance })}
      />
    </PanelSection>
  );
}

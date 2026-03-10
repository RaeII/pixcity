import type { ShadowSettings } from "../../scene/types";
import { CheckboxField } from "./controls/CheckboxField";
import { NumberField } from "./controls/NumberField";
import { PanelSection } from "./controls/PanelSection";
import { RangeField } from "./controls/RangeField";

type ShadowControlsProps = {
  value: ShadowSettings;
  onChange: (settings: ShadowSettings) => void;
};

export function ShadowControls({ value, onChange }: ShadowControlsProps) {
  return (
    <PanelSection
      title="Sombras"
      description="Apenas os prédios mais próximos entram no passe de sombra para manter a performance."
    >
      <CheckboxField
        label="Ativar sombras"
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />

      <RangeField
        label="Quantidade de edifícios com sombra"
        value={value.buildingCountWithShadow}
        min={0}
        max={500}
        step={1}
        valueLabel={value.buildingCountWithShadow.toString()}
        onChange={(buildingCountWithShadow) => onChange({ ...value, buildingCountWithShadow })}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField
          label="Camera near"
          value={value.cameraNear}
          onChange={(cameraNear) => onChange({ ...value, cameraNear })}
        />
        <NumberField
          label="Camera far"
          value={value.cameraFar}
          onChange={(cameraFar) => onChange({ ...value, cameraFar })}
        />
        <NumberField
          label="Camera left"
          value={value.cameraLeft}
          onChange={(cameraLeft) => onChange({ ...value, cameraLeft })}
        />
        <NumberField
          label="Camera right"
          value={value.cameraRight}
          onChange={(cameraRight) => onChange({ ...value, cameraRight })}
        />
      </div>
    </PanelSection>
  );
}

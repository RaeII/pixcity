import type { LightSettings } from "../../scene/types";
import { ColorField } from "./controls/ColorField";
import { PanelSection } from "./controls/PanelSection";

type SceneLightControlsProps = {
  value: LightSettings;
  metrics: {
    ambientDynamic: number;
    ambientTotal: number;
  };
  onChange: (settings: LightSettings) => void;
};

export function SceneLightControls({
  value,
  metrics,
  onChange,
}: SceneLightControlsProps) {
  return (
    <PanelSection
      title="Luzes da cena"
      description="Ambient total = ambient dinâmico + ambient extra da cena."
    >
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/65">
        <div>Ambient dinâmico: {metrics.ambientDynamic.toFixed(2)}</div>
        <div>Ambient extra: {value.ambientExtraIntensity.toFixed(2)}</div>
        <div>Ambient total aplicado: {metrics.ambientTotal.toFixed(2)}</div>
      </div>

      <ColorField
        label="Cor do ambient"
        value={value.ambientColor}
        onChange={(ambientColor) => onChange({ ...value, ambientColor })}
      />

      <label className="mt-4 block">
        <span className="mb-2 block text-sm text-white/75">Ambient extra da cena</span>
        <input
          type="number"
          step="0.1"
          value={value.ambientExtraIntensity}
          onChange={(event) =>
            onChange({ ...value, ambientExtraIntensity: Number(event.target.value) })
          }
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
        />
      </label>
    </PanelSection>
  );
}

import type { LightSettings } from "../../scene/types";
import { ColorField } from "./controls/ColorField";
import { NumberField } from "./controls/NumberField";
import { PanelSection } from "./controls/PanelSection";

type SceneLightControlsProps = {
  value: LightSettings;
  metrics: {
    ambientDynamic: number;
    ambientTotal: number;
    solarIntensity: number;
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
      description="Luz solar: max(0, sin(elevação) * 20). Ambient dinâmico: 4 * (1 + intensidadeSolar / 20). Ambient extra da cena: 0.4."
    >
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/65">
        <div>Ambient dinâmico: {metrics.ambientDynamic.toFixed(2)}</div>
        <div>Ambient extra: {value.ambientExtraIntensity.toFixed(2)}</div>
        <div>Ambient total aplicado: {metrics.ambientTotal.toFixed(2)}</div>
        <div>Intensidade solar: {metrics.solarIntensity.toFixed(2)}</div>
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

      <ColorField
        label="Cor da luz solar"
        value={value.directionalColor}
        onChange={(directionalColor) => onChange({ ...value, directionalColor })}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField
          label="Distância solar"
          value={value.directionalDistance}
          onChange={(directionalDistance) => onChange({ ...value, directionalDistance })}
        />
        <NumberField
          label="Elevação solar"
          value={value.directionalElevation}
          onChange={(directionalElevation) => onChange({ ...value, directionalElevation })}
        />
        <NumberField
          label="Azimute solar"
          value={value.directionalAzimuth}
          onChange={(directionalAzimuth) => onChange({ ...value, directionalAzimuth })}
        />
        <NumberField
          label="Intensidade solar"
          value={metrics.solarIntensity.toFixed(2)}
          readOnly
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <NumberField
          label="Alvo X"
          value={value.directionalTargetX}
          onChange={(directionalTargetX) => onChange({ ...value, directionalTargetX })}
        />
        <NumberField
          label="Alvo Y"
          value={value.directionalTargetY}
          onChange={(directionalTargetY) => onChange({ ...value, directionalTargetY })}
        />
        <NumberField
          label="Alvo Z"
          value={value.directionalTargetZ}
          onChange={(directionalTargetZ) => onChange({ ...value, directionalTargetZ })}
        />
      </div>
    </PanelSection>
  );
}

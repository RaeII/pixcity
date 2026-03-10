import type { PointLightConfig } from "../../../scene/types";
import { NumberField } from "./NumberField";

type PointLightCardProps = {
  index: number;
  pointLight: PointLightConfig;
  defaultPointLight?: PointLightConfig;
  onChange: (pointLight: PointLightConfig) => void;
};

export function PointLightCard({
  index,
  pointLight,
  defaultPointLight,
  onChange,
}: PointLightCardProps) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 text-sm text-white/80">Point light {index + 1}</div>
      <div className="mb-3 text-xs text-white/45">
        Posição padrão: ({defaultPointLight?.x}, {defaultPointLight?.y}, {defaultPointLight?.z}) |
        intensidade padrão: {defaultPointLight?.intensity}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Posição X"
          value={pointLight.x}
          onChange={(x) => onChange({ ...pointLight, x })}
        />
        <NumberField
          label="Posição Y"
          value={pointLight.y}
          onChange={(y) => onChange({ ...pointLight, y })}
        />
        <NumberField
          label="Posição Z"
          value={pointLight.z}
          onChange={(z) => onChange({ ...pointLight, z })}
        />
        <NumberField
          label="Intensidade"
          value={pointLight.intensity}
          onChange={(intensity) => onChange({ ...pointLight, intensity })}
        />
      </div>
    </div>
  );
}

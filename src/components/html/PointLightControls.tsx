import { DEFAULT_POINT_LIGHTS } from "../../scene/config/lightConfig";
import type { PointLightConfig } from "../../scene/types";
import { ColorField } from "./controls/ColorField";
import { PanelSection } from "./controls/PanelSection";
import { PointLightCard } from "./controls/PointLightCard";

type PointLightControlsProps = {
  pointLightColor: string;
  pointLights: PointLightConfig[];
  onPointLightColorChange: (color: string) => void;
  onPointLightChange: (index: number, pointLight: PointLightConfig) => void;
};

export function PointLightControls({
  pointLightColor,
  pointLights,
  onPointLightColorChange,
  onPointLightChange,
}: PointLightControlsProps) {
  return (
    <PanelSection
      title="Luzes internas"
      description="São 4 point lights internas por padrão, com intensidade 1625 e posições iniciais em (-15, 25, 10), (15, 25, 10), (-15, 25, -10) e (15, 25, -10)."
    >
      <ColorField
        label="Cor das point lights"
        value={pointLightColor}
        onChange={onPointLightColorChange}
      />

      {pointLights.map((pointLight, index) => (
        <PointLightCard
          key={index}
          index={index}
          pointLight={pointLight}
          defaultPointLight={DEFAULT_POINT_LIGHTS[index]}
          onChange={(nextPointLight) => onPointLightChange(index, nextPointLight)}
        />
      ))}
    </PanelSection>
  );
}

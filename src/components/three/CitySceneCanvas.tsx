import { useRef } from "react";
import { useCityScene } from "../../scene/hooks/useCityScene";
import type {
  BuildingSettings,
  EnvironmentSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
} from "../../scene/types";

export type CitySceneCanvasProps = {
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  environmentSettings: EnvironmentSettings;
  onStatsChange: (stats: SceneStats) => void;
};

export function CitySceneCanvas({
  buildingSettings,
  textureSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  environmentSettings,
  onStatsChange,
}: CitySceneCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useCityScene({
    mountRef,
    buildingSettings,
    textureSettings,
    groundSettings,
    lightSettings,
    shadowSettings,
    renderDirectionSettings,
    environmentSettings,
    onStatsChange,
  });

  return <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />;
}

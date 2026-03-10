import { useRef } from "react";
import { useCityScene } from "../../scene/hooks/useCityScene";
import type {
  BuildingSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
} from "../../scene/types";

export type CitySceneCanvasProps = {
  buildingSettings: BuildingSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  onStatsChange: (stats: SceneStats) => void;
};

export function CitySceneCanvas({
  buildingSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  onStatsChange,
}: CitySceneCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useCityScene({
    mountRef,
    buildingSettings,
    groundSettings,
    lightSettings,
    shadowSettings,
    renderDirectionSettings,
    onStatsChange,
  });

  return <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />;
}

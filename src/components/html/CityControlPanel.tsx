import type {
  BuildingSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
} from "../../scene/types";
import { BuildingControls } from "./BuildingControls";
import { GroundControls } from "./GroundControls";
import { PanelIntro } from "./PanelIntro";
import { PointLightControls } from "./PointLightControls";
import { RenderDirectionControls } from "./RenderDirectionControls";
import { SceneLightControls } from "./SceneLightControls";
import { ShadowControls } from "./ShadowControls";

export type CityControlPanelProps = {
  buildingSettings: BuildingSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  sceneStats: SceneStats;
  lightMetrics: {
    ambientDynamic: number;
    ambientTotal: number;
    solarIntensity: number;
  };
  onBuildingSettingsChange: (settings: BuildingSettings) => void;
  onGroundSettingsChange: (settings: GroundSettings) => void;
  onLightSettingsChange: (settings: LightSettings) => void;
  onShadowSettingsChange: (settings: ShadowSettings) => void;
  onRenderDirectionSettingsChange: (settings: RenderDirectionSettings) => void;
};

export function CityControlPanel({
  buildingSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  sceneStats,
  lightMetrics,
  onBuildingSettingsChange,
  onGroundSettingsChange,
  onLightSettingsChange,
  onShadowSettingsChange,
  onRenderDirectionSettingsChange,
}: CityControlPanelProps) {
  return (
    <div className="absolute right-0 top-0 z-20 h-screen w-full max-w-[360px] overflow-y-auto border-l border-white/10 bg-black/55 p-4 text-white shadow-2xl backdrop-blur-md">
      <div className="space-y-6 pb-8 pt-2">
        <PanelIntro sceneStats={sceneStats} solarIntensity={lightMetrics.solarIntensity} />
        <BuildingControls value={buildingSettings} onChange={onBuildingSettingsChange} />
        <ShadowControls value={shadowSettings} onChange={onShadowSettingsChange} />
        <RenderDirectionControls
          value={renderDirectionSettings}
          onChange={onRenderDirectionSettingsChange}
        />
        <GroundControls value={groundSettings} onChange={onGroundSettingsChange} />
        <SceneLightControls
          value={lightSettings}
          metrics={lightMetrics}
          onChange={onLightSettingsChange}
        />
        <PointLightControls
          pointLightColor={lightSettings.pointLightColor}
          pointLights={lightSettings.pointLights}
          onPointLightColorChange={(pointLightColor) =>
            onLightSettingsChange({ ...lightSettings, pointLightColor })
          }
          onPointLightChange={(index, pointLight) =>
            onLightSettingsChange({
              ...lightSettings,
              pointLights: lightSettings.pointLights.map((item, itemIndex) =>
                itemIndex === index ? pointLight : item,
              ),
            })
          }
        />
      </div>
    </div>
  );
}

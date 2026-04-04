import { useRef, useState } from "react";
import { CitySceneCanvas, type CitySceneCanvasHandle } from "./three/CitySceneCanvas";
import { BuildingHeightInput } from "./html/BuildingHeightInput";
import { CityControlPanel } from "./html/CityControlPanel";
import { DEFAULT_SCENE_STATS } from "../scene/config/citySceneConfig";
import { createDefaultBuildingSettings } from "../scene/config/buildingConfig";
import { createDefaultEnvironmentSettings } from "../scene/config/environmentConfig";
import { createDefaultGroundSettings } from "../scene/config/groundConfig";
import { createDefaultLightSettings } from "../scene/config/lightConfig";
import { createDefaultRenderDirectionSettings } from "../scene/config/renderDirectionConfig";
import { createDefaultShadowSettings } from "../scene/config/shadowConfig";
import { createDefaultTextureSettings } from "../scene/config/textureConfig";
import type { SceneStats } from "../scene/types";
import { getLightMetrics } from "../scene/utils/lighting";

export function CitySceneEditor() {
  const canvasRef = useRef<CitySceneCanvasHandle>(null);

  const [buildingSettings, setBuildingSettings] = useState(createDefaultBuildingSettings);
  const [textureSettings, setTextureSettings] = useState(createDefaultTextureSettings);
  const [groundSettings, setGroundSettings] = useState(createDefaultGroundSettings);
  const [lightSettings, setLightSettings] = useState(createDefaultLightSettings);
  const [shadowSettings, setShadowSettings] = useState(createDefaultShadowSettings);
  const [renderDirectionSettings, setRenderDirectionSettings] = useState(
    createDefaultRenderDirectionSettings,
  );
  const [environmentSettings, setEnvironmentSettings] = useState(createDefaultEnvironmentSettings);
  const [sceneStats, setSceneStats] = useState<SceneStats>({ ...DEFAULT_SCENE_STATS });

  const lightMetrics = getLightMetrics(lightSettings);

  const handleDonation = (value: number) => {
    canvasRef.current?.addDonation(value);
  };

  const handleBulkDonation = (values: number[]) => {
    canvasRef.current?.addDonations(values);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#05070a]">
      <CitySceneCanvas
        ref={canvasRef}
        buildingSettings={buildingSettings}
        textureSettings={textureSettings}
        groundSettings={groundSettings}
        lightSettings={lightSettings}
        shadowSettings={shadowSettings}
        renderDirectionSettings={renderDirectionSettings}
        environmentSettings={environmentSettings}
        onStatsChange={setSceneStats}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to from-black/35 to-transparent" />
      <BuildingHeightInput onSubmit={handleDonation} onBulkSubmit={handleBulkDonation} />
      <CityControlPanel
        buildingSettings={buildingSettings}
        textureSettings={textureSettings}
        groundSettings={groundSettings}
        lightSettings={lightSettings}
        shadowSettings={shadowSettings}
        renderDirectionSettings={renderDirectionSettings}
        sceneStats={sceneStats}
        lightMetrics={lightMetrics}
        onBuildingSettingsChange={setBuildingSettings}
        onTextureSettingsChange={setTextureSettings}
        onGroundSettingsChange={setGroundSettings}
        onLightSettingsChange={setLightSettings}
        onShadowSettingsChange={setShadowSettings}
        onRenderDirectionSettingsChange={setRenderDirectionSettings}
        environmentSettings={environmentSettings}
        onEnvironmentSettingsChange={setEnvironmentSettings}
      />
    </div>
  );
}

import { useState } from "react";
import { CitySceneCanvas } from "./three/CitySceneCanvas";
import { CityControlPanel } from "./html/CityControlPanel";
import { DEFAULT_SCENE_STATS } from "../scene/config/citySceneConfig";
import { createDefaultBuildingSettings } from "../scene/config/buildingConfig";
import { createDefaultGroundSettings } from "../scene/config/groundConfig";
import { createDefaultLightSettings } from "../scene/config/lightConfig";
import { createDefaultRenderDirectionSettings } from "../scene/config/renderDirectionConfig";
import { createDefaultShadowSettings } from "../scene/config/shadowConfig";
import type { SceneStats } from "../scene/types";
import { getLightMetrics } from "../scene/utils/lighting";

export function CitySceneEditor() {
  const [buildingSettings, setBuildingSettings] = useState(createDefaultBuildingSettings);
  const [groundSettings, setGroundSettings] = useState(createDefaultGroundSettings);
  const [lightSettings, setLightSettings] = useState(createDefaultLightSettings);
  const [shadowSettings, setShadowSettings] = useState(createDefaultShadowSettings);
  const [renderDirectionSettings, setRenderDirectionSettings] = useState(
    createDefaultRenderDirectionSettings,
  );
  const [sceneStats, setSceneStats] = useState<SceneStats>({ ...DEFAULT_SCENE_STATS });

  const lightMetrics = getLightMetrics(lightSettings);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#05070a]">
      <CitySceneCanvas
        buildingSettings={buildingSettings}
        groundSettings={groundSettings}
        lightSettings={lightSettings}
        shadowSettings={shadowSettings}
        renderDirectionSettings={renderDirectionSettings}
        onStatsChange={setSceneStats}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />
      <CityControlPanel
        buildingSettings={buildingSettings}
        groundSettings={groundSettings}
        lightSettings={lightSettings}
        shadowSettings={shadowSettings}
        renderDirectionSettings={renderDirectionSettings}
        sceneStats={sceneStats}
        lightMetrics={lightMetrics}
        onBuildingSettingsChange={setBuildingSettings}
        onGroundSettingsChange={setGroundSettings}
        onLightSettingsChange={setLightSettings}
        onShadowSettingsChange={setShadowSettings}
        onRenderDirectionSettingsChange={setRenderDirectionSettings}
      />
    </div>
  );
}

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";
import { createCitySceneRuntime, type CitySceneRuntime } from "../runtime/createCitySceneRuntime";
import type {
  BuildingSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
} from "../types";

type UseCitySceneOptions = {
  mountRef: RefObject<HTMLDivElement | null>;
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  onStatsChange: (stats: SceneStats) => void;
};

export function useCityScene({
  mountRef,
  buildingSettings,
  textureSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  onStatsChange,
}: UseCitySceneOptions) {
  const runtimeRef = useRef<CitySceneRuntime | null>(null);
  const initialSettingsRef = useRef<Omit<UseCitySceneOptions, "mountRef" | "onStatsChange">>({
    buildingSettings,
    textureSettings,
    groundSettings,
    lightSettings,
    shadowSettings,
    renderDirectionSettings,
  });

  const handleStatsChange = useEffectEvent((stats: SceneStats) => {
    onStatsChange(stats);
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const runtime = createCitySceneRuntime({
      mount,
      ...initialSettingsRef.current,
      onStatsChange: (stats) => handleStatsChange(stats),
    });
    runtimeRef.current = runtime;

    return () => {
      runtimeRef.current = null;
      runtime.dispose();
    };
  }, [mountRef]);

  useEffect(() => {
    runtimeRef.current?.updateBuildingSettings(buildingSettings);
  }, [buildingSettings]);

  useEffect(() => {
    runtimeRef.current?.updateTextureSettings(textureSettings);
  }, [textureSettings]);

  useEffect(() => {
    runtimeRef.current?.updateGroundSettings(groundSettings);
  }, [groundSettings]);

  useEffect(() => {
    runtimeRef.current?.updateLightSettings(lightSettings);
  }, [lightSettings]);

  useEffect(() => {
    runtimeRef.current?.updateShadowSettings(shadowSettings);
  }, [shadowSettings]);

  useEffect(() => {
    runtimeRef.current?.updateRenderDirectionSettings(renderDirectionSettings, true);
  }, [renderDirectionSettings]);
}

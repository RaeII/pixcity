import { useCallback, useEffect, useEffectEvent, useRef, type RefObject } from "react";
import { createCitySceneRuntime, type CitySceneRuntime } from "../runtime/createCitySceneRuntime";
import type {
  BuildingSettings,
  EnvironmentSettings,
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
  environmentSettings: EnvironmentSettings;
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
  environmentSettings,
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
    environmentSettings,
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

  useEffect(() => {
    runtimeRef.current?.updateEnvironmentSettings(environmentSettings);
  }, [environmentSettings]);

  // Referência estável: delega ao runtime atual sem recriar a função
  const addDonation = useCallback((value: number) => {
    runtimeRef.current?.addDonation(value);
  }, []);

  const addDonations = useCallback((values: number[]) => {
    runtimeRef.current?.addDonations(values);
  }, []);

  return { addDonation, addDonations };
}

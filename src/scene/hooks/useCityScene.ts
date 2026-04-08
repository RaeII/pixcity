import { useCallback, useEffect, useEffectEvent, useRef, type RefObject } from "react";
import { createCitySceneRuntime, type CitySceneRuntime } from "../runtime/createCitySceneRuntime";
import type {
  BlockLayoutSettings,
  BuildingSettings,
  EnvironmentSettings,
  GroundSettings,
  HorizonSettings,
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
  horizonSettings: HorizonSettings;
  blockLayoutSettings: BlockLayoutSettings;
  onStatsChange: (stats: SceneStats) => void;
  onHoverChange?: (value: number | null, x: number, y: number) => void;
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
  horizonSettings,
  blockLayoutSettings,
  onStatsChange,
  onHoverChange,
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
    horizonSettings,
    blockLayoutSettings,
  });

  const handleStatsChange = useEffectEvent((stats: SceneStats) => {
    onStatsChange(stats);
  });

  const handleHoverChange = useEffectEvent(
    (value: number | null, x: number, y: number) => {
      onHoverChange?.(value, x, y);
    },
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const runtime = createCitySceneRuntime({
      mount,
      ...initialSettingsRef.current,
      onStatsChange: (stats) => handleStatsChange(stats),
      onHoverChange: (value, x, y) => handleHoverChange(value, x, y),
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

  useEffect(() => {
    runtimeRef.current?.updateHorizonSettings(horizonSettings);
  }, [horizonSettings]);

  useEffect(() => {
    runtimeRef.current?.updateBlockLayout(blockLayoutSettings);
  }, [blockLayoutSettings]);

  // Referência estável: delega ao runtime atual sem recriar a função
  const addDonation = useCallback((value: number) => {
    runtimeRef.current?.addDonation(value);
  }, []);

  const addDonations = useCallback((values: number[]) => {
    runtimeRef.current?.addDonations(values);
  }, []);

  return { addDonation, addDonations };
}

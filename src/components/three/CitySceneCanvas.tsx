import { forwardRef, useImperativeHandle, useRef } from "react";
import { useCityScene } from "../../scene/hooks/useCityScene";
import type {
  BlockLayoutSettings,
  BuildingSettings,
  EnvironmentSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
  HorizonSettings,
} from "../../scene/types";

export type CitySceneCanvasHandle = {
  addDonation: (value: number) => void;
  addDonations: (values: number[]) => void;
};

export type CitySceneCanvasProps = {
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  horizonSettings: HorizonSettings;
  environmentSettings: EnvironmentSettings;
  blockLayoutSettings: BlockLayoutSettings;
  onStatsChange: (stats: SceneStats) => void;
  onHoverChange?: (value: number | null, x: number, y: number) => void;
};

export const CitySceneCanvas = forwardRef<CitySceneCanvasHandle, CitySceneCanvasProps>(
  function CitySceneCanvas(
    {
      buildingSettings,
      textureSettings,
      groundSettings,
      lightSettings,
      shadowSettings,
      renderDirectionSettings,
      horizonSettings,
      environmentSettings,
      blockLayoutSettings,
      onStatsChange,
      onHoverChange,
    },
    ref,
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    const { addDonation, addDonations } = useCityScene({
      mountRef,
      buildingSettings,
      textureSettings,
      groundSettings,
      lightSettings,
      shadowSettings,
      renderDirectionSettings,
      horizonSettings,
      environmentSettings,
      blockLayoutSettings,
      onStatsChange,
      onHoverChange,
    });

    useImperativeHandle(ref, () => ({ addDonation, addDonations }), [addDonation, addDonations]);

    return <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />;
  },
);

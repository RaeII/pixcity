import { useState } from "react";
import type {
  BuildingSettings,
  EnvironmentSettings,
  GroundSettings,
  HorizonSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
} from "../../scene/types";
import { BuildingControls } from "./BuildingControls";
import { EnvironmentControls } from "./EnvironmentControls";
import { GroundControls } from "./GroundControls";
import { HorizonControls } from "./HorizonControls";
import { PanelIntro } from "./PanelIntro";
import { RenderDirectionControls } from "./RenderDirectionControls";
import { SceneLightControls } from "./SceneLightControls";
import { ShadowControls } from "./ShadowControls";
import { TextureControls } from "./TextureControls";

type Tab = "geral" | "texturas" | "luz" | "horizonte";

export type CityControlPanelProps = {
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  environmentSettings: EnvironmentSettings;
  sceneStats: SceneStats;
  lightMetrics: {
    ambientDynamic: number;
    ambientTotal: number;
    solarIntensity: number;
  };
  onBuildingSettingsChange: (settings: BuildingSettings) => void;
  onTextureSettingsChange: (settings: TextureSettings) => void;
  onGroundSettingsChange: (settings: GroundSettings) => void;
  onLightSettingsChange: (settings: LightSettings) => void;
  onShadowSettingsChange: (settings: ShadowSettings) => void;
  onRenderDirectionSettingsChange: (settings: RenderDirectionSettings) => void;
  onEnvironmentSettingsChange: (settings: EnvironmentSettings) => void;
  horizonSettings: HorizonSettings;
  onHorizonSettingsChange: (settings: HorizonSettings) => void;
};

export function CityControlPanel({
  buildingSettings,
  textureSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  environmentSettings,
  sceneStats,
  lightMetrics,
  onBuildingSettingsChange,
  onTextureSettingsChange,
  onGroundSettingsChange,
  onLightSettingsChange,
  onShadowSettingsChange,
  onRenderDirectionSettingsChange,
  onEnvironmentSettingsChange,
  horizonSettings,
  onHorizonSettingsChange,
}: CityControlPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("geral");

  return (
    <div className="absolute right-0 top-0 z-20 flex h-screen w-full max-w-[360px] flex-col border-l border-white/10 bg-black/55 text-white shadow-2xl backdrop-blur-md">
      <div className="flex border-b border-white/10">
        {(["geral", "texturas", "luz", "horizonte"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize tracking-wide transition-colors ${
              activeTab === tab
                ? "border-b-2 border-white text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "geral" && (
          <div className="space-y-6 pb-8 pt-2">
            <PanelIntro sceneStats={sceneStats} solarIntensity={lightMetrics.solarIntensity} />
            <BuildingControls value={buildingSettings} onChange={onBuildingSettingsChange} />
            <ShadowControls value={shadowSettings} onChange={onShadowSettingsChange} />
            <RenderDirectionControls
              value={renderDirectionSettings}
              onChange={onRenderDirectionSettingsChange}
            />
            <GroundControls value={groundSettings} onChange={onGroundSettingsChange} />
            <EnvironmentControls value={environmentSettings} onChange={onEnvironmentSettingsChange} />
          </div>
        )}

        {activeTab === "texturas" && (
          <div className="space-y-6 pb-8 pt-2">
            <TextureControls value={textureSettings} onChange={onTextureSettingsChange} />
          </div>
        )}

        {activeTab === "luz" && (
          <div className="space-y-6 pb-8 pt-2">
            <SceneLightControls
              value={lightSettings}
              metrics={lightMetrics}
              onChange={onLightSettingsChange}
            />
          </div>
        )}

        {activeTab === "horizonte" && (
          <div className="space-y-6 pb-8 pt-2">
            <HorizonControls value={horizonSettings} onChange={onHorizonSettingsChange} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useRef, useState } from "react";
import { CitySceneCanvas, type CitySceneCanvasHandle } from "./three/CitySceneCanvas";
import { BuildingHeightInput } from "./html/BuildingHeightInput";
import { BuildingCustomizePanel } from "./html/BuildingCustomizePanel";
import { CityControlPanel } from "./html/CityControlPanel";
import { DEFAULT_SCENE_STATS } from "../scene/config/citySceneConfig";
import { createDefaultBlockLayoutSettings } from "../scene/config/blockLayoutConfig";
import { createDefaultBuildingSettings } from "../scene/config/buildingConfig";
import { createDefaultEnvironmentSettings } from "../scene/config/environmentConfig";
import { createDefaultGroundSettings } from "../scene/config/groundConfig";
import { createDefaultLightSettings } from "../scene/config/lightConfig";
import { createDefaultRenderDirectionSettings } from "../scene/config/renderDirectionConfig";
import { createDefaultShadowSettings } from "../scene/config/shadowConfig";
import { createDefaultTextureSettings } from "../scene/config/textureConfig";
import { createDefaultHorizonSettings } from "../scene/config/horizonConfig";
import type { BuildingCustomization, RooftopType, SceneStats } from "../scene/types";
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
  const [horizonSettings, setHorizonSettings] = useState(createDefaultHorizonSettings);
  const [blockLayoutSettings, setBlockLayoutSettings] = useState(createDefaultBlockLayoutSettings);
  const [sceneStats, setSceneStats] = useState<SceneStats>({ ...DEFAULT_SCENE_STATS });
  const [hoverInfo, setHoverInfo] = useState<{ value: number; x: number; y: number } | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [buildingCustomizations, setBuildingCustomizations] = useState<Map<number, BuildingCustomization>>(new Map());

  const lightMetrics = getLightMetrics(lightSettings);

  const handleDonation = (value: number) => {
    canvasRef.current?.addDonation(value);
  };

  const handleBulkDonation = (values: number[]) => {
    canvasRef.current?.addDonations(values);
  };

  const handleHoverChange = useCallback(
    (value: number | null, x: number, y: number) => {
      setHoverInfo(value !== null ? { value, x, y } : null);
    },
    [],
  );

  const handleBuildingClick = useCallback(
    (donationId: number | null) => {
      if (donationId !== null) {
        canvasRef.current?.focusOnDonation(donationId);
      } else {
        canvasRef.current?.clearFocus();
      }
      setSelectedBuildingId(donationId);
    },
    [],
  );

  const handleCloseCustomizePanel = useCallback(() => {
    canvasRef.current?.clearFocus();
    setSelectedBuildingId(null);
  }, []);

  const getExistingCustomization = useCallback(
    (donationId: number) => {
      const existing = buildingCustomizations.get(donationId);
      return {
        color: existing?.color ?? buildingSettings.color,
        rooftopType: existing?.rooftopType ?? "none" as const,
        signText: existing?.signText ?? "",
        signSides: existing?.signSides ?? 1,
      };
    },
    [buildingCustomizations, buildingSettings.color],
  );

  const updateCustomization = useCallback(
    (donationId: number, patch: Partial<BuildingCustomization>) => {
      setBuildingCustomizations((prev) => {
        const next = new Map(prev);
        const existing = next.get(donationId);
        const updated: BuildingCustomization = {
          color: existing?.color ?? buildingSettings.color,
          rooftopType: existing?.rooftopType ?? "none",
          signText: existing?.signText ?? "",
          signSides: existing?.signSides ?? 1,
          ...patch,
        };
        next.set(donationId, updated);
        canvasRef.current?.updateDonationCustomization(donationId, updated);
        return next;
      });
    },
    [buildingSettings.color],
  );

  const handleBuildingColorChange = useCallback(
    (donationId: number, color: string) => updateCustomization(donationId, { color }),
    [updateCustomization],
  );

  const handleRooftopChange = useCallback(
    (donationId: number, rooftopType: RooftopType) => updateCustomization(donationId, { rooftopType }),
    [updateCustomization],
  );

  const handleSignTextChange = useCallback(
    (donationId: number, signText: string) => updateCustomization(donationId, { signText }),
    [updateCustomization],
  );

  const handleSignSidesChange = useCallback(
    (donationId: number, signSides: number) => updateCustomization(donationId, { signSides }),
    [updateCustomization],
  );

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
        horizonSettings={horizonSettings}
        blockLayoutSettings={blockLayoutSettings}
        onStatsChange={setSceneStats}
        onHoverChange={handleHoverChange}
        onBuildingClick={handleBuildingClick}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to from-black/35 to-transparent" />
      {hoverInfo && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
          style={{ left: hoverInfo.x + 14, top: hoverInfo.y - 14 }}
        >
          {hoverInfo.value.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}
      <BuildingHeightInput
        onSubmit={handleDonation}
        onBulkSubmit={handleBulkDonation}
        blockLayoutSettings={blockLayoutSettings}
        onBlockLayoutChange={setBlockLayoutSettings}
      />
      {selectedBuildingId !== null && (() => {
        const c = getExistingCustomization(selectedBuildingId);
        return (
          <BuildingCustomizePanel
            key={selectedBuildingId}
            donationId={selectedBuildingId}
            initialColor={c.color}
            initialRooftopType={c.rooftopType}
            initialSignText={c.signText}
            initialSignSides={c.signSides}
            onColorChange={handleBuildingColorChange}
            onRooftopChange={handleRooftopChange}
            onSignTextChange={handleSignTextChange}
            onSignSidesChange={handleSignSidesChange}
            onClose={handleCloseCustomizePanel}
          />
        );
      })()}
      {showControlPanel && (
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
          horizonSettings={horizonSettings}
          onEnvironmentSettingsChange={setEnvironmentSettings}
          onHorizonSettingsChange={setHorizonSettings}
        />
      )}
      <button
        onClick={() => setShowControlPanel((prev) => !prev)}
        className="absolute bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white/70 shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        title={showControlPanel ? "Fechar painel" : "Configurações da cena"}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M8.325 2.317a1.75 1.75 0 0 1 3.35 0l.21.726a1.75 1.75 0 0 0 2.282 1.09l.67-.28a1.75 1.75 0 0 1 2.37 1.674l-.037.716a1.75 1.75 0 0 0 1.463 1.81l.71.107a1.75 1.75 0 0 1 .98 3.044l-.553.46a1.75 1.75 0 0 0-.345 2.26l.396.604a1.75 1.75 0 0 1-1.104 2.685l-.706.13a1.75 1.75 0 0 0-1.37 1.616l-.05.715a1.75 1.75 0 0 1-2.553 1.387l-.615-.343a1.75 1.75 0 0 0-2.15.34l-.46.555a1.75 1.75 0 0 1-2.83-.572l-.266-.68a1.75 1.75 0 0 0-1.973-1.07l-.713.1a1.75 1.75 0 0 1-1.908-2.333l.236-.684a1.75 1.75 0 0 0-.812-2.116l-.625-.363A1.75 1.75 0 0 1 1.39 9.63l.474-.54a1.75 1.75 0 0 0 .094-2.29l-.44-.575a1.75 1.75 0 0 1 1.439-2.78l.717.013a1.75 1.75 0 0 0 1.697-1.316l.17-.71a1.75 1.75 0 0 1 .784-1.115Z"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
          />
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      </button>
    </div>
  );
}

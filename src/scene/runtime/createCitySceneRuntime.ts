import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createGridHelper } from "../builders/createGridHelper";
import { createGroundPlane } from "../builders/createGroundPlane";
import { createHorizonSilhouette } from "../builders/createHorizonSilhouette";
import { createLightingRig } from "../builders/createLightingRig";
import { loadEnvironment } from "../builders/loadEnvironment";
import { CITY_SCENE_CONFIG, DEFAULT_SCENE_STATS } from "../config/citySceneConfig";
import { createDonationManager } from "../managers/createDonationManager";
import type {
  BlockLayoutSettings,
  BuildingSettings,
  EnvironmentSettings,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  HorizonSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
} from "../types";
import { runDevAssertionsOnce } from "../utils/devAssertions";

type CitySceneRuntimeOptions = {
  mount: HTMLDivElement;
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

export type CitySceneRuntime = {
  updateBuildingSettings: (settings: BuildingSettings) => void;
  updateTextureSettings: (settings: TextureSettings) => void;
  updateGroundSettings: (settings: GroundSettings) => void;
  updateLightSettings: (settings: LightSettings) => void;
  updateShadowSettings: (settings: ShadowSettings) => void;
  updateRenderDirectionSettings: (settings: RenderDirectionSettings, forceRefresh?: boolean) => void;
  updateHorizonSettings: (settings: HorizonSettings) => void;
  updateEnvironmentSettings: (settings: EnvironmentSettings) => void;
  updateBlockLayout: (settings: BlockLayoutSettings) => void;
  addDonation: (value: number) => void;
  addDonations: (values: number[]) => void;
  dispose: () => void;
};

export function createCitySceneRuntime({
  mount,
  buildingSettings,
  textureSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  horizonSettings,
  environmentSettings,
  blockLayoutSettings,
  onStatsChange,
  onHoverChange,
}: CitySceneRuntimeOptions): CitySceneRuntime {
  runDevAssertionsOnce();

  let currentStats: SceneStats = { ...DEFAULT_SCENE_STATS };
  const emitStatsPatch = (patch: Partial<SceneStats>) => {
    currentStats = { ...currentStats, ...patch };
    onStatsChange(currentStats);
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CITY_SCENE_CONFIG.sceneBackground);
  scene.fog = new THREE.FogExp2(
    horizonSettings.fogColor,
    horizonSettings.fogDensity,
  );

  const camera = new THREE.PerspectiveCamera(
    CITY_SCENE_CONFIG.cameraFov,
    mount.clientWidth / mount.clientHeight,
    CITY_SCENE_CONFIG.cameraNear,
    CITY_SCENE_CONFIG.far,
  );
  camera.position.set(
    CITY_SCENE_CONFIG.initialCameraPosition.x,
    CITY_SCENE_CONFIG.initialCameraPosition.y,
    CITY_SCENE_CONFIG.initialCameraPosition.z,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = shadowSettings.enabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  let renderScale = 1;
  const getPixelRatio = () =>
    Math.min(window.devicePixelRatio || 1, CITY_SCENE_CONFIG.dprCap) * renderScale;

  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CITY_SCENE_CONFIG.controls.dampingFactor;
  controls.rotateSpeed = CITY_SCENE_CONFIG.controls.rotateSpeed;
  controls.zoomSpeed = CITY_SCENE_CONFIG.controls.zoomSpeed;
  controls.panSpeed = CITY_SCENE_CONFIG.controls.panSpeed;
  controls.minDistance = CITY_SCENE_CONFIG.controls.minDistance;
  controls.maxDistance = CITY_SCENE_CONFIG.controls.maxDistance;
  controls.maxPolarAngle = CITY_SCENE_CONFIG.controls.maxPolarAngle;
  controls.target.set(
    CITY_SCENE_CONFIG.controlTarget.x,
    CITY_SCENE_CONFIG.controlTarget.y,
    CITY_SCENE_CONFIG.controlTarget.z,
  );
  controls.update();

  let loadedEnvMap: THREE.Texture | null = null;
  let loadedBgTexture: THREE.Texture | null = null;
  let isDisposed = false;

  const environmentUpdater = loadEnvironment(
    scene,
    renderer,
    environmentSettings,
    (envMap, bgTexture) => {
      loadedEnvMap = envMap;
      loadedBgTexture = bgTexture;
    },
    () => isDisposed,
  );

  const lightingRig = createLightingRig(scene, lightSettings);
  const groundPlane = createGroundPlane(scene, groundSettings, shadowSettings.enabled);
  const gridHelper = createGridHelper(scene);
  const horizonSilhouette = createHorizonSilhouette(scene, horizonSettings);

  const buildingCubeTarget = new THREE.WebGLCubeRenderTarget(256, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const buildingCubeCamera = new THREE.CubeCamera(0.1, CITY_SCENE_CONFIG.far, buildingCubeTarget);
  scene.add(buildingCubeCamera);

  const donationManager = createDonationManager({
    scene,
    renderer,
    buildingSettings,
    textureSettings,
    blockLayoutSettings,
  });
  donationManager.setEnvMap(buildingCubeTarget.texture);
  donationManager.setShadowEnabled(shadowSettings.enabled);

  // Hover: raycast com throttle por RAF para não impactar o loop de animação
  let pendingHoverEvent: MouseEvent | null = null;
  let hoverRafId: number | null = null;
  const handleMouseMove = onHoverChange
    ? (event: MouseEvent) => {
        pendingHoverEvent = event;
        if (hoverRafId === null) {
          hoverRafId = requestAnimationFrame(() => {
            if (pendingHoverEvent) {
              const value = donationManager.getHoveredValue(
                pendingHoverEvent,
                camera,
                renderer.domElement,
              );
              onHoverChange(value, pendingHoverEvent.clientX, pendingHoverEvent.clientY);
              pendingHoverEvent = null;
            }
            hoverRafId = null;
          });
        }
      }
    : null;
  if (handleMouseMove) renderer.domElement.addEventListener("mousemove", handleMouseMove);

  let animationId = 0;
  let lastTime = performance.now();
  let fpsAccumulator = 0;
  let frames = 0;
  let smoothedFps = 60;
  let cubeFrameCounter = 0;

  const updateDynamicResolution = (fps: number) => {
    const previousScale = renderScale;
    if (fps < CITY_SCENE_CONFIG.targetFps - 8) {
      renderScale = Math.max(CITY_SCENE_CONFIG.minRenderScale, renderScale - 0.05);
    } else if (fps > CITY_SCENE_CONFIG.targetFps + 5) {
      renderScale = Math.min(CITY_SCENE_CONFIG.maxRenderScale, renderScale + 0.025);
    }
    if (previousScale !== renderScale) {
      renderer.setPixelRatio(getPixelRatio());
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    }
  };

  const animate = (time: number) => {
    animationId = requestAnimationFrame(animate);
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    controls.update();

    groundPlane.setPosition(camera.position.x, camera.position.z);
    gridHelper.setPosition(camera.position.x, camera.position.z);
    horizonSilhouette.update(camera);
    environmentUpdater.updatePosition(camera.position.x, camera.position.y, camera.position.z);

    fpsAccumulator += delta;
    frames += 1;
    if (fpsAccumulator >= 0.5) {
      const currentFps = frames / fpsAccumulator;
      smoothedFps = smoothedFps * 0.72 + currentFps * 0.28;
      updateDynamicResolution(smoothedFps);
      emitStatsPatch({ buildings: donationManager.getDonationCount() });
      fpsAccumulator = 0;
      frames = 0;
    }

    cubeFrameCounter = (cubeFrameCounter + 1) % 4;
    if (cubeFrameCounter === 0) {
      buildingCubeCamera.position.copy(camera.position);
      donationManager.beginEnvCapture();
      buildingCubeCamera.update(renderer, scene);
      donationManager.endEnvCapture();
    }

    renderer.render(scene, camera);
  };

  animate(performance.now());

  const handleResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPixelRatio());
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };

  window.addEventListener("resize", handleResize);

  return {
    updateBuildingSettings(settings) {
      donationManager.updateBuildingSettings(settings);
    },
    updateTextureSettings(settings) {
      donationManager.updateTextureSettings(settings);
    },
    updateGroundSettings(settings) {
      groundPlane.update(settings);
    },
    updateLightSettings(settings) {
      lightingRig.update(settings);
    },
    updateShadowSettings(settings) {
      renderer.shadowMap.enabled = settings.enabled;
      groundPlane.setShadowEnabled(settings.enabled);
      donationManager.setShadowEnabled(settings.enabled);
    },
    // Sem chunks direcionais — mantido na API para compatibilidade com hook/canvas
    updateRenderDirectionSettings() {},
    updateHorizonSettings(settings) {
      horizonSilhouette.updateSettings(settings);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set(settings.fogColor);
        scene.fog.density = settings.fogDensity;
      }
    },
    updateBlockLayout(settings) {
      donationManager.updateBlockLayout(settings);
    },
    updateEnvironmentSettings(settings) {
      environmentUpdater.updateSettings(settings);
    },

    addDonation(value) {
      donationManager.addDonation(value);
      emitStatsPatch({ buildings: donationManager.getDonationCount() });
    },
    addDonations(values) {
      donationManager.addDonations(values);
      emitStatsPatch({ buildings: donationManager.getDonationCount() });
    },
    dispose() {
      if (handleMouseMove) renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      if (hoverRafId !== null) cancelAnimationFrame(hoverRafId);
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      donationManager.dispose();
      groundPlane.dispose();
      gridHelper.dispose();
      horizonSilhouette.dispose();
      lightingRig.dispose();
      isDisposed = true;
      environmentUpdater.dispose();
      loadedEnvMap?.dispose();
      loadedBgTexture?.dispose();
      scene.remove(buildingCubeCamera);
      buildingCubeTarget.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    },
  };
}

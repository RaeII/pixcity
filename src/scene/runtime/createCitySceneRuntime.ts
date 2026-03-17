import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createGridHelper } from "../builders/createGridHelper";
import { createGroundPlane } from "../builders/createGroundPlane";
import { createLightingRig } from "../builders/createLightingRig";
import { CITY_SCENE_CONFIG, DEFAULT_SCENE_STATS } from "../config/citySceneConfig";
import { createChunkManager } from "../managers/createChunkManager";
import { createShadowManager } from "../managers/createShadowManager";
import type {
  BuildingSettings,
  CameraVisibilityState,
  GroundSettings,
  LightSettings,
  RenderDirectionSettings,
  SceneStats,
  ShadowSettings,
  TextureSettings,
} from "../types";
import { runDevAssertionsOnce } from "../utils/devAssertions";
import { clamp } from "../utils/math";

type CitySceneRuntimeOptions = {
  mount: HTMLDivElement;
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  groundSettings: GroundSettings;
  lightSettings: LightSettings;
  shadowSettings: ShadowSettings;
  renderDirectionSettings: RenderDirectionSettings;
  onStatsChange: (stats: SceneStats) => void;
};

export type CitySceneRuntime = {
  updateBuildingSettings: (settings: BuildingSettings) => void;
  updateTextureSettings: (settings: TextureSettings) => void;
  updateGroundSettings: (settings: GroundSettings) => void;
  updateLightSettings: (settings: LightSettings) => void;
  updateShadowSettings: (settings: ShadowSettings) => void;
  updateRenderDirectionSettings: (
    settings: RenderDirectionSettings,
    forceRefresh?: boolean,
  ) => void;
  dispose: () => void;
};

export function createCitySceneRuntime({
  mount,
  buildingSettings,
  textureSettings,
  groundSettings,
  lightSettings,
  shadowSettings,
  renderDirectionSettings,
  onStatsChange,
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
    CITY_SCENE_CONFIG.sceneFogColor,
    CITY_SCENE_CONFIG.sceneFogDensity,
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

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
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

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSkyGeo = new THREE.SphereGeometry(10, 16, 12);
  const skyColor = new THREE.Color(lightSettings.hemisphereSkyColor);
  const groundColor = new THREE.Color(CITY_SCENE_CONFIG.sceneBackground);
  const envPositions = envSkyGeo.attributes.position as THREE.BufferAttribute;
  const envColorData = new Float32Array(envPositions.count * 3);
  const envTempColor = new THREE.Color();
  for (let i = 0; i < envPositions.count; i++) {
    const t = Math.max(0, Math.min(1, (envPositions.getY(i) / 10 + 1) / 2));
    envTempColor.lerpColors(groundColor, skyColor, t);
    envColorData[i * 3] = envTempColor.r;
    envColorData[i * 3 + 1] = envTempColor.g;
    envColorData[i * 3 + 2] = envTempColor.b;
  }
  envSkyGeo.setAttribute("color", new THREE.BufferAttribute(envColorData, 3));
  const envSkyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
  envScene.add(new THREE.Mesh(envSkyGeo, envSkyMat));
  const envRT = pmremGenerator.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  pmremGenerator.dispose();
  envSkyGeo.dispose();
  envSkyMat.dispose();

  const lightingRig = createLightingRig(scene, lightSettings);
  const groundPlane = createGroundPlane(scene, groundSettings, shadowSettings.enabled);
  const gridHelper = createGridHelper(scene);
  const buildingCubeTarget = new THREE.WebGLCubeRenderTarget(256, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const buildingCubeCamera = new THREE.CubeCamera(0.1, CITY_SCENE_CONFIG.far, buildingCubeTarget);
  scene.add(buildingCubeCamera);

  const chunkManager = createChunkManager({
    scene,
    camera,
    buildingSettings,
    textureSettings,
    renderDirectionSettings,
    onStatsChange: (stats) => emitStatsPatch(stats),
  });
  chunkManager.setEnvMap(buildingCubeTarget.texture);
  const shadowManager = createShadowManager({
    scene,
    camera,
    shadowSettings,
    getChunks: () => chunkManager.getChunks(),
    onBuildingsWithShadowChange: (buildingsWithShadow) =>
      emitStatsPatch({ buildingsWithShadow }),
  });

  const tempCameraForwardForVisibility = new THREE.Vector3();
  let lastVisibilityState: CameraVisibilityState = {
    x: Number.NaN,
    z: Number.NaN,
    forwardX: 0,
    forwardZ: -1,
  };
  let lastChunkX = Number.NaN;
  let lastChunkZ = Number.NaN;
  let animationId = 0;
  let lastTime = performance.now();
  let fpsAccumulator = 0;
  let frames = 0;
  let smoothedFps = 60;
  let lastShadowSyncTime = 0;
  let cubeFrameCounter = 0;

  const syncWorld = (forceRefresh = false) => {
    chunkManager.sync(forceRefresh);
    shadowManager.sync(lightingRig.directional);
  };

  const applyShadowSettings = (settings: ShadowSettings, shouldSync = true) => {
    renderer.shadowMap.enabled = settings.enabled;
    lightingRig.directional.castShadow = settings.enabled;
    lightingRig.directional.shadow.bias = settings.bias;
    lightingRig.directional.shadow.normalBias = settings.normalBias;
    lightingRig.directional.shadow.radius = settings.radius;
    lightingRig.directional.shadow.blurSamples = Math.round(clamp(settings.blurSamples, 1, 16));

    const mapSize = Math.round(clamp(settings.mapSize, 256, 4096));
    if (
      lightingRig.directional.shadow.mapSize.x !== mapSize ||
      lightingRig.directional.shadow.mapSize.y !== mapSize
    ) {
      lightingRig.directional.shadow.mapSize.set(mapSize, mapSize);
      lightingRig.directional.shadow.dispose();
    }

    lightingRig.directional.shadow.camera.near = clamp(settings.cameraNear, 0.1, 50);
    lightingRig.directional.shadow.camera.far = clamp(settings.cameraFar, 10, 300);
    lightingRig.directional.shadow.camera.left = settings.cameraLeft;
    lightingRig.directional.shadow.camera.right = settings.cameraRight;
    lightingRig.directional.shadow.camera.top = settings.cameraTop;
    lightingRig.directional.shadow.camera.bottom = settings.cameraBottom;
    lightingRig.directional.shadow.camera.updateProjectionMatrix();
    lightingRig.directional.shadow.needsUpdate = true;

    groundPlane.setShadowEnabled(settings.enabled);
    shadowManager.updateSettings(settings);

    if (shouldSync) {
      shadowManager.sync(lightingRig.directional);
    }
  };

  applyShadowSettings(shadowSettings, false);
  syncWorld(true);

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

    const currentChunkX = Math.floor(
      (camera.position.x + CITY_SCENE_CONFIG.chunkSize * 0.5) / CITY_SCENE_CONFIG.chunkSize,
    );
    const currentChunkZ = Math.floor(
      (camera.position.z + CITY_SCENE_CONFIG.chunkSize * 0.5) / CITY_SCENE_CONFIG.chunkSize,
    );

    camera.getWorldDirection(tempCameraForwardForVisibility);
    tempCameraForwardForVisibility.y = 0;
    if (tempCameraForwardForVisibility.lengthSq() === 0) {
      tempCameraForwardForVisibility.set(0, 0, -1);
    } else {
      tempCameraForwardForVisibility.normalize();
    }

    const rotationDot =
      tempCameraForwardForVisibility.x * lastVisibilityState.forwardX +
      tempCameraForwardForVisibility.z * lastVisibilityState.forwardZ;
    const rotatedEnough = Number.isNaN(lastVisibilityState.x) || rotationDot < 0.985;
    const movedEnough = currentChunkX !== lastChunkX || currentChunkZ !== lastChunkZ;

    if (movedEnough || rotatedEnough) {
      syncWorld(false);
      lastChunkX = currentChunkX;
      lastChunkZ = currentChunkZ;
      lastVisibilityState = {
        x: camera.position.x,
        z: camera.position.z,
        forwardX: tempCameraForwardForVisibility.x,
        forwardZ: tempCameraForwardForVisibility.z,
      };
    }

    if (time - lastShadowSyncTime > 180) {
      shadowManager.sync(lightingRig.directional);
      lastShadowSyncTime = time;
    }

    groundPlane.setPosition(camera.position.x, camera.position.z);
    gridHelper.setPosition(camera.position.x, camera.position.z);

    fpsAccumulator += delta;
    frames += 1;
    if (fpsAccumulator >= 0.5) {
      const currentFps = frames / fpsAccumulator;
      smoothedFps = smoothedFps * 0.72 + currentFps * 0.28;
      updateDynamicResolution(smoothedFps);
      fpsAccumulator = 0;
      frames = 0;
    }

    cubeFrameCounter = (cubeFrameCounter + 1) % 4;
    if (cubeFrameCounter === 0) {
      buildingCubeCamera.position.copy(camera.position);
      buildingCubeCamera.update(renderer, scene);
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
      chunkManager.updateBuildingSettings(settings);
    },
    updateTextureSettings(settings) {
      chunkManager.updateTextureSettings(settings);
    },
    updateGroundSettings(settings) {
      groundPlane.update(settings);
    },
    updateLightSettings(settings) {
      lightingRig.update(settings);
      lightingRig.directional.shadow.needsUpdate = true;
    },
    updateShadowSettings(settings) {
      applyShadowSettings(settings, true);
    },
    updateRenderDirectionSettings(settings, forceRefresh = true) {
      chunkManager.updateRenderDirectionSettings(settings);
      syncWorld(forceRefresh);
    },
    dispose() {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      shadowManager.dispose();
      chunkManager.dispose();
      groundPlane.dispose();
      gridHelper.dispose();
      lightingRig.dispose();
      envRT.dispose();
      scene.remove(buildingCubeCamera);
      buildingCubeTarget.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    },
  };
}

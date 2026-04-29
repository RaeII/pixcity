import * as THREE from "three";

export type RooftopType =
  | "none"
  | "spotlights"
  | "helipad";

export type EdgeLightType =
  | "none"
  | "led";

export type BuildingShape =
  | "default"
  | "twisted"
  | "octagonal"
  | "setback"
  | "tapered"
  | "chrysler"
  | "hearst";

export type BuildingCustomization = {
  color: string;
  rooftopType: RooftopType;
  signText: string;
  signSides: number; // 1–4 lados com letreiro
  edgeLightType: EdgeLightType;
  buildingShape: BuildingShape;
  tilingScale: number; // multiplicador da textura por edifício (1.0 = sem alteração)
};

export type DonationEntry = {
  id: number;
  value: number;
  customization?: BuildingCustomization;
};

export type ChunkData = {
  key: string;
  mesh: THREE.InstancedMesh;
  count: number;
  centers: Float32Array;
  heights: Float32Array;
  scales: Float32Array;
};

export type HorizonSettings = {
  color: string;
  distance: number;
  fogDensity: number;
  fogColor: string;
};

export type RenderDirectionSettings = {
  forwardDistance: number;
  sideDistance: number;
  backwardDistance: number;
};

export type GroundMaterialType = "standard" | "matte" | "soft-metal" | "polished";

export type ShadowSettings = {
  enabled: boolean;
  intensity: number;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  mapSize: number;
  cameraNear: number;
  cameraFar: number;
  cameraLeft: number;
  cameraRight: number;
  cameraTop: number;
  cameraBottom: number;
  buildingCountWithShadow: number;
};

export type TopTextureSettings = {
  normalScale: number;
  displacementScale: number;
  tilingScale: number;
  roughnessIntensity: number;
  metalnessIntensity: number;
  envMapIntensity: number;
};

export type TextureSettings = {
  enabled: boolean;
  normalScale: number;
  displacementScale: number;
  tilingScale: number;
  roughnessIntensity: number;
  metalnessIntensity: number;
  envMapIntensity: number;
  emissiveIntensity: number;
  clayRender: boolean;
  top: TopTextureSettings;
};

export type BuildingSettings = {
  color: string;
  roughness: number;
  metalness: number;
  targetMaxHeight: number;
};

export type GroundSettings = {
  color: string;
  roughness: number;
  metalness: number;
  materialType: GroundMaterialType;
};

export type LightSettings = {
  ambientColor: string;
  ambientExtraIntensity: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  directionalColor: string;
  directionalDistance: number;
  directionalElevation: number;
  directionalAzimuth: number;
  directionalTargetX: number;
  directionalTargetY: number;
  directionalTargetZ: number;
};

export type PointLightConfig = {
  x: number;
  y: number;
  z: number;
  intensity: number;
};

export type EnvironmentSettings = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
};

export type BlockLayoutSettings = {
  blockSize: number;
  streetWidth: number;
  towerRatio: number;     // fração de doações tratadas como torres (0–1)
  towersPerBlock: number; // quantas torres por quadra (ocupa os N slots mais centrais)
  baseHeightCap: number;  // teto de altura da base urbana como fração de maxSceneHeight (0–1)
};

export type SceneStats = {
  buildings: number;
  fpsMode: string;
  chunks: number;
  buildingsWithShadow: number;
};

export type CameraDebugInfo = {
  position: {
    x: number;
    y: number;
    z: number;
  };
  target: {
    x: number;
    y: number;
    z: number;
  };
};

export type CameraVisibilityState = {
  x: number;
  z: number;
  forwardX: number;
  forwardZ: number;
};

export type CitySceneConfig = {
  chunkSize: number;
  chunkRadius: number;
  blockSize: number;
  roadWidth: number;
  minHeight: number;
  maxHeight: number;
  maxBuildingsPerChunk: number;
  dprCap: number;
  targetFps: number;
  minRenderScale: number;
  maxRenderScale: number;
  far: number;
  shadowBuildingCap: number;
  maxSolarIntensity: number;
  minAmbientDynamic: number;
  maxAmbientDynamic: number;
  sceneBackground: string;
  sceneFogColor: string;
  sceneFogDensity: number;
  groundSize: number;
  gridDivisions: number;
  gridPrimaryColor: string;
  gridSecondaryColor: string;
  cameraFov: number;
  cameraNear: number;
  initialCameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  controlTarget: {
    x: number;
    y: number;
    z: number;
  };
  controls: {
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
  };
  cubeUpdateIntervalMoving: number;
  cubeUpdateIntervalStatic: number;
  envMapNearDistance: number;
};

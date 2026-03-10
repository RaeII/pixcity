import type { LightSettings, PointLightConfig } from "../types";

export const DEFAULT_POINT_LIGHTS: PointLightConfig[] = [
  { x: -15, y: 25, z: 10, intensity: 1625 },
  { x: 15, y: 25, z: 10, intensity: 1625 },
  { x: -15, y: 25, z: -10, intensity: 1625 },
  { x: 15, y: 25, z: -10, intensity: 1625 },
];

export const DEFAULT_LIGHT_SETTINGS: LightSettings = {
  ambientColor: "#fffaf2",
  ambientExtraIntensity: 0.4,
  hemisphereSkyColor: "#b9c7d9",
  hemisphereGroundColor: "#0b0e14",
  hemisphereIntensity: 0.35,
  directionalColor: "#fffefb",
  directionalDistance: 10,
  directionalElevation: 45,
  directionalAzimuth: 35,
  directionalTargetX: 0,
  directionalTargetY: 0,
  directionalTargetZ: 0,
  pointLightColor: "#fffaf2",
  pointLights: DEFAULT_POINT_LIGHTS.map((pointLight) => ({ ...pointLight })),
};

export function createDefaultLightSettings(): LightSettings {
  return {
    ...DEFAULT_LIGHT_SETTINGS,
    pointLights: DEFAULT_LIGHT_SETTINGS.pointLights.map((pointLight) => ({ ...pointLight })),
  };
}

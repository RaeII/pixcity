import type { ShadowSettings } from "../types";

export const DEFAULT_SHADOW_SETTINGS: ShadowSettings = {
  enabled: true,
  intensity: 1,
  bias: -0.0008,
  normalBias: 0.45,
  radius: 3,
  blurSamples: 8,
  mapSize: 1024,
  cameraNear: 1,
  cameraFar: 90,
  cameraLeft: -32,
  cameraRight: 32,
  cameraTop: 32,
  cameraBottom: -32,
  buildingCountWithShadow: 140,
};

export function createDefaultShadowSettings(): ShadowSettings {
  return { ...DEFAULT_SHADOW_SETTINGS };
}

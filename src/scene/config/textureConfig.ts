import type { TextureSettings } from "../types";

export const DEFAULT_TEXTURE_SETTINGS: TextureSettings = {
  enabled: true,
  normalScale: 1.0,
  displacementScale: 0.0,
  bumpScale: 0.0,
  tilingScale: 1.0,
  roughnessIntensity: 1.0,
  metalnessIntensity: 2.0,
  clayRender: false,
};

export function createDefaultTextureSettings(): TextureSettings {
  return { ...DEFAULT_TEXTURE_SETTINGS };
}

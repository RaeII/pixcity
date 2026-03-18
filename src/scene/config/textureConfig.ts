import type { TextureSettings } from "../types";

export const DEFAULT_TEXTURE_SETTINGS: TextureSettings = {
  enabled: true,
  normalScale: 20,
  displacementScale: 0.0,
  tilingScale: 0.9,
  roughnessIntensity: 0,  
  metalnessIntensity: 1.44,
  envMapIntensity: 3.5,
  emissiveIntensity: 0,
  clayRender: false,
};

export function createDefaultTextureSettings(): TextureSettings {
  return { ...DEFAULT_TEXTURE_SETTINGS };
}

import { CITY_SCENE_CONFIG } from "./citySceneConfig";
import type { HorizonSettings } from "../types";

export function createDefaultHorizonSettings(): HorizonSettings {
  return {
    distance: 261.3,
    color: "#5c5c5c",
    fogDensity: CITY_SCENE_CONFIG.sceneFogDensity,
    fogColor: CITY_SCENE_CONFIG.sceneFogColor,
  };
}

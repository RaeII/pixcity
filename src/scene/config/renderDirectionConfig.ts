import type { RenderDirectionSettings } from "../types";

export const DEFAULT_RENDER_DIRECTION_SETTINGS: RenderDirectionSettings = {
  forwardDistance: 3,
  sideDistance: 2,
  backwardDistance: 1,
};

export function createDefaultRenderDirectionSettings(): RenderDirectionSettings {
  return { ...DEFAULT_RENDER_DIRECTION_SETTINGS };
}

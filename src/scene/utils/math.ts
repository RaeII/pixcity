import type { RenderDirectionSettings } from "../types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getSearchRadius(baseRadius: number, settings: RenderDirectionSettings) {
  return Math.max(
    baseRadius,
    Math.ceil(settings.forwardDistance),
    Math.ceil(settings.sideDistance),
    Math.ceil(settings.backwardDistance),
  );
}

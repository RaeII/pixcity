import type { HorizonSegment, HorizonSettings } from "../types";

const defaultSegment = (): HorizonSegment => ({
  enabled: true,
  radius: 215,
  curvature: -17,
  offsetX: 35,
  offsetZ: -8,
  baseY: 0,
  slots: 180,
});

export function createDefaultHorizonSettings(): HorizonSettings {
  return {
    minHeight: 4,
    maxHeight: 20.5,
    minWidth: 5.5,
    maxWidth: 10,
    gapChance: 0,
    segments: [defaultSegment(), defaultSegment(), defaultSegment(), defaultSegment()],
  };
}

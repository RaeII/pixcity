import type { BlockLayoutSettings } from "../types";

export function createDefaultBlockLayoutSettings(): BlockLayoutSettings {
  return {
    blockSize: 3,
    streetWidth: 6.0,
    towerRatio: 0.12,
    towersPerBlock: 1,
    baseHeightCap: 0.30,
  };
}

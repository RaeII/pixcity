import type { BlockLayoutSettings } from "../types";

export function createDefaultBlockLayoutSettings(): BlockLayoutSettings {
  return {
    blockSize: 3,
    streetWidth: 6.0,
  };
}

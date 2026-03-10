import type { GroundMaterialType } from "../types";
import { clamp } from "./math";

export function getGroundMaterialValues(
  roughness: number,
  metalness: number,
  materialType: GroundMaterialType,
) {
  const base = {
    roughness: clamp(roughness, 0, 1),
    metalness: clamp(metalness, 0, 1),
  };

  if (materialType === "matte") {
    return { roughness: 1, metalness: 0 };
  }

  if (materialType === "soft-metal") {
    return {
      roughness: clamp(Math.max(0.18, base.roughness), 0, 1),
      metalness: clamp(Math.max(0.35, base.metalness), 0, 1),
    };
  }

  if (materialType === "polished") {
    return {
      roughness: clamp(Math.min(0.22, base.roughness), 0, 1),
      metalness: clamp(Math.max(0.08, base.metalness), 0, 1),
    };
  }

  return base;
}

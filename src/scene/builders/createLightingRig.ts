import * as THREE from "three";
import { getLightMetrics } from "../utils/lighting";
import type { LightSettings } from "../types";

export type LightingRig = {
  ambient: THREE.AmbientLight;
  update: (lightSettings: LightSettings) => ReturnType<typeof getLightMetrics>;
  dispose: () => void;
};

export function createLightingRig(scene: THREE.Scene, lightSettings: LightSettings): LightingRig {
  const metrics = getLightMetrics(lightSettings);
  const ambient = new THREE.AmbientLight(
    lightSettings.ambientColor,
    metrics.ambientTotal,
  );
  scene.add(ambient);

  const update = (settings: LightSettings) => {
    const nextMetrics = getLightMetrics(settings);

    ambient.color.set(settings.ambientColor);
    ambient.intensity = nextMetrics.ambientTotal;

    return nextMetrics;
  };

  update(lightSettings);

  return {
    ambient,
    update,
    dispose() {
      scene.remove(ambient);
    },
  };
}

import * as THREE from "three";
import { clamp } from "../utils/math";
import { getDirectionalPositionFromAngles, getLightMetrics } from "../utils/lighting";
import type { LightSettings } from "../types";

export type LightingRig = {
  ambient: THREE.AmbientLight;
  hemisphere: THREE.HemisphereLight;
  directional: THREE.DirectionalLight;
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

  const hemisphere = new THREE.HemisphereLight(
    lightSettings.hemisphereSkyColor,
    lightSettings.hemisphereGroundColor,
    lightSettings.hemisphereIntensity,
  );
  hemisphere.position.set(0, 50, 0);
  scene.add(hemisphere);

  const directional = new THREE.DirectionalLight(lightSettings.directionalColor, metrics.solarIntensity);
  scene.add(directional);
  scene.add(directional.target);

  const directionalHelper = new THREE.DirectionalLightHelper(directional, 8);
  scene.add(directionalHelper);

  const update = (settings: LightSettings) => {
    const nextMetrics = getLightMetrics(settings);
    const directionalPosition = getDirectionalPositionFromAngles(
      settings.directionalDistance,
      settings.directionalElevation,
      settings.directionalAzimuth,
    );

    ambient.color.set(settings.ambientColor);
    ambient.intensity = nextMetrics.ambientTotal;

    hemisphere.color.set(settings.hemisphereSkyColor);
    hemisphere.groundColor.set(settings.hemisphereGroundColor);
    hemisphere.intensity = clamp(settings.hemisphereIntensity, 0, 6);
    hemisphere.position.set(0, 50, 0);
    hemisphere.updateMatrixWorld(true);

    directional.color.set(settings.directionalColor);
    directional.intensity = nextMetrics.solarIntensity;
    directional.position.set(
      directionalPosition.x,
      directionalPosition.y,
      directionalPosition.z,
    );
    directional.target.position.set(
      settings.directionalTargetX,
      settings.directionalTargetY,
      settings.directionalTargetZ,
    );
    directional.target.updateMatrixWorld();
    directionalHelper.update();

    return nextMetrics;
  };

  update(lightSettings);

  return {
    ambient,
    hemisphere,
    directional,
    update,
    dispose() {
      scene.remove(ambient);
      scene.remove(hemisphere);
      scene.remove(directionalHelper);
      directionalHelper.dispose();
      scene.remove(directional);
      scene.remove(directional.target);
    },
  };
}

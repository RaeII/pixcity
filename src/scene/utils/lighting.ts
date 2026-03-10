import * as THREE from "three";
import { CITY_SCENE_CONFIG } from "../config/citySceneConfig";
import type { LightSettings } from "../types";
import { clamp } from "./math";

export function getDirectionalPositionFromAngles(distance: number, elevation: number, azimuth: number) {
  const safeDistance = Math.max(0.001, distance);
  const elevationRad = THREE.MathUtils.degToRad(elevation);
  const azimuthRad = THREE.MathUtils.degToRad(azimuth);
  const planarDistance = Math.cos(elevationRad) * safeDistance;

  return {
    x: Math.cos(azimuthRad) * planarDistance,
    y: Math.sin(elevationRad) * safeDistance,
    z: Math.sin(azimuthRad) * planarDistance,
  };
}

export function getSolarIntensityFromElevation(elevation: number, maxSolarIntensity: number) {
  const solarIntensity = Math.max(
    0,
    Math.sin(THREE.MathUtils.degToRad(elevation)) * maxSolarIntensity,
  );

  return clamp(solarIntensity, 0, maxSolarIntensity);
}

export function getDynamicAmbientIntensity(
  solarIntensity: number,
  maxSolarIntensity: number,
  minAmbientDynamic: number,
  maxAmbientDynamic: number,
) {
  const value = 4 * (1 + solarIntensity / maxSolarIntensity);
  return clamp(value, minAmbientDynamic, maxAmbientDynamic);
}

export function getLightMetrics(lightSettings: LightSettings) {
  const solarIntensity = getSolarIntensityFromElevation(
    lightSettings.directionalElevation,
    CITY_SCENE_CONFIG.maxSolarIntensity,
  );
  const ambientDynamic = getDynamicAmbientIntensity(
    solarIntensity,
    CITY_SCENE_CONFIG.maxSolarIntensity,
    CITY_SCENE_CONFIG.minAmbientDynamic,
    CITY_SCENE_CONFIG.maxAmbientDynamic,
  );

  return {
    solarIntensity,
    ambientDynamic,
    ambientTotal: ambientDynamic + lightSettings.ambientExtraIntensity,
  };
}

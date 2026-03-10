import * as THREE from "three";
import { CITY_SCENE_CONFIG } from "../config/citySceneConfig";
import type { ChunkData, ShadowSettings } from "../types";
import { clamp } from "../utils/math";

type ShadowManagerOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  shadowSettings: ShadowSettings;
  getChunks: () => IterableIterator<ChunkData>;
  onBuildingsWithShadowChange: (count: number) => void;
};

export type ShadowManager = {
  sync: (directionalLight: THREE.DirectionalLight) => void;
  updateSettings: (settings: ShadowSettings) => void;
  dispose: () => void;
};

export function createShadowManager({
  scene,
  camera,
  shadowSettings,
  getChunks,
  onBuildingsWithShadowChange,
}: ShadowManagerOptions): ShadowManager {
  const group = new THREE.Group();
  scene.add(group);

  const shadowBox = new THREE.BoxGeometry(1, 1, 1);
  const shadowCasterMaterial = new THREE.MeshBasicMaterial({ color: "#000000" });
  shadowCasterMaterial.colorWrite = false;
  shadowCasterMaterial.depthWrite = false;
  shadowCasterMaterial.transparent = false;
  shadowCasterMaterial.toneMapped = false;

  const tempChunkCenter = new THREE.Vector3();
  const cameraWorldPosition = new THREE.Vector3();
  let currentShadowSettings = { ...shadowSettings };

  const clear = () => {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
  };

  return {
    sync(directionalLight) {
      clear();

      if (!currentShadowSettings.enabled) {
        onBuildingsWithShadowChange(0);
        directionalLight.shadow.needsUpdate = true;
        return;
      }

      camera.getWorldPosition(cameraWorldPosition);
      const candidates: Array<{
        distance: number;
        x: number;
        y: number;
        z: number;
        width: number;
        height: number;
        depth: number;
      }> = [];

      for (const chunk of getChunks()) {
        const [chunkX, chunkZ] = chunk.key.split(":").map(Number);
        tempChunkCenter.set(chunkX * CITY_SCENE_CONFIG.chunkSize, 0, chunkZ * CITY_SCENE_CONFIG.chunkSize);
        if (tempChunkCenter.distanceTo(cameraWorldPosition) > CITY_SCENE_CONFIG.chunkSize * 7.5) {
          continue;
        }

        for (let index = 0; index < chunk.count; index += 1) {
          const x = chunk.centers[index * 3];
          const y = chunk.centers[index * 3 + 1];
          const z = chunk.centers[index * 3 + 2];
          const dx = x - cameraWorldPosition.x;
          const dy = y - cameraWorldPosition.y;
          const dz = z - cameraWorldPosition.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          candidates.push({
            distance,
            x,
            y,
            z,
            width: chunk.scales[index * 2],
            height: chunk.heights[index],
            depth: chunk.scales[index * 2 + 1],
          });
        }
      }

      candidates.sort((a, b) => a.distance - b.distance);
      const limit = Math.min(
        clamp(currentShadowSettings.buildingCountWithShadow, 0, CITY_SCENE_CONFIG.shadowBuildingCap),
        candidates.length,
      );

      for (let index = 0; index < limit; index += 1) {
        const building = candidates[index];
        const shadowMesh = new THREE.Mesh(shadowBox, shadowCasterMaterial);
        shadowMesh.position.set(building.x, building.y, building.z);
        shadowMesh.scale.set(building.width, building.height, building.depth);
        shadowMesh.castShadow = true;
        shadowMesh.receiveShadow = false;
        shadowMesh.frustumCulled = false;
        shadowMesh.renderOrder = -1;
        group.add(shadowMesh);
      }

      onBuildingsWithShadowChange(limit);
      directionalLight.shadow.needsUpdate = true;
    },
    updateSettings(settings) {
      currentShadowSettings = { ...settings };
      group.visible = settings.enabled;
    },
    dispose() {
      clear();
      scene.remove(group);
      shadowBox.dispose();
      shadowCasterMaterial.dispose();
    },
  };
}

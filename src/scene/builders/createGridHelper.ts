import * as THREE from "three";
import { CITY_SCENE_CONFIG } from "../config/citySceneConfig";

export type GridHelperRig = {
  grid: THREE.GridHelper;
  setPosition: (x: number, z: number) => void;
  dispose: () => void;
};

export function createGridHelper(scene: THREE.Scene): GridHelperRig {
  const grid = new THREE.GridHelper(
    CITY_SCENE_CONFIG.groundSize,
    CITY_SCENE_CONFIG.gridDivisions,
    CITY_SCENE_CONFIG.gridPrimaryColor,
    CITY_SCENE_CONFIG.gridSecondaryColor,
  );
  grid.position.y = 0.01;

  const gridMaterial = Array.isArray(grid.material) ? grid.material[0] : grid.material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.18;
  scene.add(grid);

  return {
    grid,
    setPosition(x, z) {
      grid.position.x = Math.round(x / 5) * 5;
      grid.position.z = Math.round(z / 5) * 5;
    },
    dispose() {
      scene.remove(grid);
      grid.geometry.dispose();
      if (Array.isArray(grid.material)) {
        grid.material.forEach((material) => material.dispose());
        return;
      }
      grid.material.dispose();
    },
  };
}

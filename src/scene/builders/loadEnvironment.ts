import * as THREE from "three";

import envUrl from "../../assets/environment/DaySkyHDRI040B_2K/DaySkyHDRI040B_2K_TONEMAPPED.jpg";
import type { EnvironmentSettings } from "../types";

export type EnvironmentUpdater = {
  updateSettings: (settings: EnvironmentSettings) => void;
  updatePosition: (x: number, y: number, z: number) => void;
  dispose: () => void;
};

function applySettings(
  skyMesh: THREE.Mesh,
  texture: THREE.Texture,
  settings: EnvironmentSettings,
) {
  // Rotação horizontal via mesh: uniforme em todas as direções
  skyMesh.rotation.y = settings.offsetX;
  // Deslocamento vertical via UV offset: move o horizonte uniformemente em todos os lados
  texture.offset.y = settings.offsetY;
  // Roll (inclinação diagonal)
  skyMesh.rotation.z = settings.offsetZ;
  texture.needsUpdate = true;
}

export function loadEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  settings: EnvironmentSettings,
  onLoaded?: (envMap: THREE.Texture, bgTexture: THREE.Texture) => void,
  isCancelled?: () => boolean,
): EnvironmentUpdater {
  let skyMesh: THREE.Mesh | null = null;
  let skyGeometry: THREE.SphereGeometry | null = null;
  let skyMaterial: THREE.MeshBasicMaterial | null = null;

  const loader = new THREE.TextureLoader();

  loader.load(envUrl, (texture) => {
    if (isCancelled?.()) return;

    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapT = THREE.RepeatWrapping;

    // Esfera invertida como background — permite offset UV uniforme em todas as direções
    skyGeometry = new THREE.SphereGeometry(200, 64, 40);
    skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    skyMesh.renderOrder = -1000;
    applySettings(skyMesh, texture, settings);
    scene.add(skyMesh);

    // scene.environment para iluminação PBR dos edifícios
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    onLoaded?.(envMap, texture);
  });

  return {
    updateSettings(newSettings: EnvironmentSettings) {
      if (skyMesh && skyMaterial?.map) {
        applySettings(skyMesh, skyMaterial.map, newSettings);
      }
    },
    updatePosition(x: number, y: number, z: number) {
      skyMesh?.position.set(x, y, z);
    },
    dispose() {
      if (skyMesh) scene.remove(skyMesh);
      skyGeometry?.dispose();
      skyMaterial?.dispose();
    },
  };
}

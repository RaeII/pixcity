import * as THREE from "three";

import envUrl from "../../assets/environment/DaySkyHDRI040B_2K/DaySkyHDRI040B_2K_TONEMAPPED.jpg";

export function loadEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  onLoaded?: (envMap: THREE.Texture, bgTexture: THREE.Texture) => void,
  isCancelled?: () => boolean,
): void {
  const loader = new THREE.TextureLoader();

  loader.load(envUrl, (texture) => {
    if (isCancelled?.()) return;

    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = texture;

    pmremGenerator.dispose();

    onLoaded?.(envMap, texture);
  });
}

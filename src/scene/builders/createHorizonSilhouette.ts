import * as THREE from "three";
import type { HorizonSettings } from "../types";
import { seeded } from "../utils/random";

export type HorizonSilhouette = {
  updateSettings: (settings: HorizonSettings) => void;
  setPosition: (x: number, z: number) => void;
  dispose: () => void;
};

type MeshBundle = {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshBasicMaterial;
};

type BuildingDescriptor = {
  angle: number;
  radialJitter: number;
  width: number;
  depth: number;
  height: number;
  yawJitter: number;
};

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const scale = new THREE.Vector3();

const GROUND_Y = -0.03;

function createDescriptors(settings: HorizonSettings) {
  const descriptors: BuildingDescriptor[] = [];

  for (let index = 0; index < settings.slots; index++) {
    if (seeded(index, 100, 9) < settings.gapChance) {
      continue;
    }

    const angleJitter = (seeded(index, 100, 8) - 0.5) * ((Math.PI * 2) / settings.slots) * 0.4;
    const width =
      settings.minWidth + seeded(index, 100, 0) * (settings.maxWidth - settings.minWidth);
    const depth = 1.2 + seeded(index, 100, 1) * 2.2;
    const heightT = seeded(index, 100, 2);
    const height = settings.minHeight + heightT * heightT * (settings.maxHeight - settings.minHeight);

    descriptors.push({
      angle: (index / settings.slots) * Math.PI * 2 + angleJitter,
      radialJitter: (seeded(index, 100, 7) - 0.5) * 8,
      width,
      depth,
      height,
      yawJitter: (seeded(index, 100, 6) - 0.5) * 0.12,
    });
  }

  return descriptors;
}

function buildMesh(
  scene: THREE.Scene,
  settings: HorizonSettings,
  descriptors: BuildingDescriptor[],
): MeshBundle {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000, fog: true });
  const mesh = new THREE.InstancedMesh(geometry, material, descriptors.length);
  mesh.frustumCulled = false;

  for (let index = 0; index < descriptors.length; index++) {
    const descriptor = descriptors[index];
    const radiusX = Math.max(1, settings.radiusX + descriptor.radialJitter);
    const radiusZ = Math.max(1, settings.radiusZ + descriptor.radialJitter);
    const x = Math.cos(descriptor.angle) * radiusX;
    const z = Math.sin(descriptor.angle) * radiusZ;

    position.set(x, settings.baseY + descriptor.height / 2, z);
    euler.set(0, descriptor.angle + Math.PI / 2 + descriptor.yawJitter, 0);
    quaternion.setFromEuler(euler);
    scale.set(descriptor.width, descriptor.height, descriptor.depth);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.position.y = GROUND_Y;
  scene.add(mesh);

  return { mesh, geometry, material };
}

export function createHorizonSilhouette(
  scene: THREE.Scene,
  initialSettings: HorizonSettings,
): HorizonSilhouette {
  let settings = initialSettings;
  let descriptors = createDescriptors(settings);
  let bundle = buildMesh(scene, settings, descriptors);
  let positionX = 0;
  let positionZ = 0;

  return {
    updateSettings(newSettings) {
      settings = newSettings;
      descriptors = createDescriptors(settings);

      scene.remove(bundle.mesh);
      bundle.geometry.dispose();
      bundle.material.dispose();
      bundle = buildMesh(scene, settings, descriptors);
      bundle.mesh.position.set(positionX, GROUND_Y, positionZ);
    },
    setPosition(x, z) {
      positionX = x;
      positionZ = z;
      bundle.mesh.position.x = x;
      bundle.mesh.position.z = z;
    },
    dispose() {
      scene.remove(bundle.mesh);
      bundle.geometry.dispose();
      bundle.material.dispose();
    },
  };
}

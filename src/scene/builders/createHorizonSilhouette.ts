import * as THREE from "three";
import type { HorizonSegment, HorizonSettings } from "../types";
import { seeded } from "../utils/random";

export type HorizonSilhouette = {
  updateSettings: (settings: HorizonSettings) => void;
  setPosition: (x: number, z: number) => void;
  dispose: () => void;
};

type SegmentBundle = {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshBasicMaterial;
};

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const scale = new THREE.Vector3();

const GROUND_Y = -0.03;
// Each segment covers 90° + small overlap so arcs close seamlessly
const ARC_SPAN = Math.PI / 2 + 0.15;

function buildSegment(
  scene: THREE.Scene,
  seg: HorizonSegment,
  segIndex: number,
  s: HorizonSettings,
): SegmentBundle {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000, fog: true });

  const salt = (segIndex + 1) * 100;
  const startAngle = segIndex * (Math.PI / 2) - ARC_SPAN / 2;

  let count = 0;
  for (let i = 0; i < seg.slots; i++) {
    if (seeded(i, salt, 9) >= s.gapChance) count++;
  }

  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(count, 1));
  mesh.frustumCulled = false;
  mesh.visible = seg.enabled && count > 0;
  mesh.position.y = GROUND_Y;

  let idx = 0;
  for (let i = 0; i < seg.slots; i++) {
    if (seeded(i, salt, 9) < s.gapChance) continue;

    const angleJitter = (seeded(i, salt, 8) - 0.5) * (ARC_SPAN / seg.slots) * 0.4;
    const angle = startAngle + (i / seg.slots) * ARC_SPAN + angleJitter;
    const radialJitter = (seeded(i, salt, 7) - 0.5) * 6;
    // curvature: sin peak at arc midpoint — positive = convex outward, negative = concave
    const curvatureOffset = seg.curvature * Math.sin((i / Math.max(seg.slots - 1, 1)) * Math.PI);
    const r = Math.max(1, seg.radius + radialJitter + curvatureOffset);

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const heightT = seeded(i, salt, 2);
    const height = s.minHeight + heightT * heightT * (s.maxHeight - s.minHeight);
    const width = s.minWidth + seeded(i, salt, 0) * (s.maxWidth - s.minWidth);
    const depth = 1.2 + seeded(i, salt, 1) * 2.2;

    position.set(x, seg.baseY + height / 2, z);
    euler.set(0, angle + Math.PI / 2 + (seeded(i, salt, 6) - 0.5) * 0.12, 0);
    quaternion.setFromEuler(euler);
    scale.set(width, height, depth);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(idx, matrix);
    idx++;
  }

  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  return { mesh, geometry, material };
}

function disposeBundle(scene: THREE.Scene, bundle: SegmentBundle) {
  scene.remove(bundle.mesh);
  bundle.geometry.dispose();
  bundle.material.dispose();
}

export function createHorizonSilhouette(
  scene: THREE.Scene,
  initialSettings: HorizonSettings,
): HorizonSilhouette {
  let settings = initialSettings;
  let bundles: [SegmentBundle, SegmentBundle, SegmentBundle, SegmentBundle] = [
    buildSegment(scene, settings.segments[0], 0, settings),
    buildSegment(scene, settings.segments[1], 1, settings),
    buildSegment(scene, settings.segments[2], 2, settings),
    buildSegment(scene, settings.segments[3], 3, settings),
  ];
  let camX = 0;
  let camZ = 0;

  function applyPosition() {
    for (let i = 0; i < 4; i++) {
      bundles[i].mesh.position.x = camX + settings.segments[i].offsetX;
      bundles[i].mesh.position.z = camZ + settings.segments[i].offsetZ;
    }
  }

  return {
    updateSettings(newSettings) {
      const oldBundles = bundles;
      settings = newSettings;
      bundles = [
        buildSegment(scene, settings.segments[0], 0, settings),
        buildSegment(scene, settings.segments[1], 1, settings),
        buildSegment(scene, settings.segments[2], 2, settings),
        buildSegment(scene, settings.segments[3], 3, settings),
      ];
      applyPosition();
      for (const b of oldBundles) disposeBundle(scene, b);
    },
    setPosition(x, z) {
      camX = x;
      camZ = z;
      applyPosition();
    },
    dispose() {
      for (const b of bundles) disposeBundle(scene, b);
    },
  };
}

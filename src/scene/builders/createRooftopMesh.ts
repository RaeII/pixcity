import * as THREE from "three";
import type { RooftopType } from "../types";

const SPOTLIGHT_SCALE = 0.75;
const SPOTLIGHT_LENS_RADIUS = 0.04 * SPOTLIGHT_SCALE;
const SPOTLIGHT_BEAM_HEIGHT = 10.0;

const SPOTLIGHT_HOUSING_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.4,
  metalness: 0.6,
});

const SPOTLIGHT_LENS_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffcc,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 2.5,
  roughness: 0.1,
  metalness: 0.0,
});

const SPOTLIGHT_BEAM_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffdd,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 1.25,
  transparent: true,
  vertexColors: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const SPOTLIGHT_BASE_GEOMETRY = new THREE.CylinderGeometry(
  0.06 * SPOTLIGHT_SCALE,
  0.08 * SPOTLIGHT_SCALE,
  0.05 * SPOTLIGHT_SCALE,
  8,
);
const SPOTLIGHT_HOUSING_GEOMETRY = new THREE.CylinderGeometry(
  0.04 * SPOTLIGHT_SCALE,
  0.07 * SPOTLIGHT_SCALE,
  0.12 * SPOTLIGHT_SCALE,
  8,
);
const SPOTLIGHT_LENS_GEOMETRY = new THREE.CircleGeometry(SPOTLIGHT_LENS_RADIUS, 12);

/** Cria um feixe com alpha gradiente via vertex colors (opaco na fonte, transparente no topo). */
function createBeamGeometry(
  sourceRadius: number,
  endRadius: number,
  height: number,
  segments: number,
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(
    sourceRadius,
    endRadius,
    height,
    segments,
    4,
    true,
  );
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 4);

  // Após rotation.x = PI, Y mais alto fica embaixo (fonte) e Y mais baixo fica em cima.
  const halfH = height / 2;
  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    const t = (y + halfH) / height;
    const alpha = t * t * 0.18;
    colors[i * 4] = 1;
    colors[i * 4 + 1] = 1;
    colors[i * 4 + 2] = 0.9;
    colors[i * 4 + 3] = alpha;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geo;
}

const SPOTLIGHT_BEAM_GEOMETRY = createBeamGeometry(
  SPOTLIGHT_LENS_RADIUS,
  0.22,
  SPOTLIGHT_BEAM_HEIGHT,
  16,
);

const SHARED_ROOFTOP_GEOMETRIES: THREE.BufferGeometry[] = [
  SPOTLIGHT_BASE_GEOMETRY,
  SPOTLIGHT_HOUSING_GEOMETRY,
  SPOTLIGHT_LENS_GEOMETRY,
  SPOTLIGHT_BEAM_GEOMETRY,
];

const SHARED_ROOFTOP_MATERIALS: THREE.Material[] = [
  SPOTLIGHT_HOUSING_MATERIAL,
  SPOTLIGHT_LENS_MATERIAL,
  SPOTLIGHT_BEAM_MATERIAL,
];

function setShadowRole(
  mesh: THREE.Mesh,
  castsShadow: boolean,
  receivesShadow: boolean,
): void {
  mesh.userData.rooftopCastsShadow = castsShadow;
  mesh.userData.rooftopReceivesShadow = receivesShadow;
}

function createSpotlights(): THREE.Group {
  const group = new THREE.Group();

  // 4 holofotes, um em cada canto do edifício
  const corners: [number, number][] = [
    [-0.35, -0.35],
    [0.35, -0.35],
    [-0.35, 0.35],
    [0.35, 0.35],
  ];

  for (const [cx, cz] of corners) {
    const spot = new THREE.Group();

    // Base cilíndrica
    const base = new THREE.Mesh(
      SPOTLIGHT_BASE_GEOMETRY,
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    base.position.y = 0.025 * SPOTLIGHT_SCALE;
    setShadowRole(base, true, true);
    spot.add(base);

    // Corpo do holofote (cilindro cônico apontando para cima)
    const housing = new THREE.Mesh(
      SPOTLIGHT_HOUSING_GEOMETRY,
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    housing.position.y = 0.11 * SPOTLIGHT_SCALE;
    setShadowRole(housing, true, true);
    spot.add(housing);

    // Lente emissiva no topo do holofote
    const lens = new THREE.Mesh(
      SPOTLIGHT_LENS_GEOMETRY,
      SPOTLIGHT_LENS_MATERIAL,
    );
    lens.rotation.x = -Math.PI / 2;
    lens.position.y = 0.17 * SPOTLIGHT_SCALE;
    setShadowRole(lens, false, false);
    spot.add(lens);

    // Feixe de luz com fade gradual (opaco na fonte, transparente no topo)
    const beam = new THREE.Mesh(SPOTLIGHT_BEAM_GEOMETRY, SPOTLIGHT_BEAM_MATERIAL);
    beam.rotation.x = Math.PI;
    beam.position.y = lens.position.y + SPOTLIGHT_BEAM_HEIGHT / 2;
    setShadowRole(beam, false, false);
    spot.add(beam);

    spot.position.set(cx, 0, cz);
    group.add(spot);
  }

  return group;
}

const FACTORIES: Record<Exclude<RooftopType, "none">, () => THREE.Group> = {
  spotlights: createSpotlights,
};

/**
 * Cria um Group Three.js para os holofotes de topo do edifício.
 * Retorna null se o tipo for "none".
 * O grupo é posicionado com Y=0 na base (topo do edifício).
 */
export function createRooftopMesh(type: RooftopType): THREE.Group | null {
  if (type === "none") return null;
  const factory = FACTORIES[type];
  const group = factory();
  group.userData.rooftopType = type;

  setRooftopMeshShadowEnabled(group, true);

  return group;
}

/**
 * Liga/desliga sombras do acessório respeitando o papel de cada mesh.
 * Partes emissivas/transparentes não projetam sombra para reduzir custo e evitar artefatos.
 */
export function setRooftopMeshShadowEnabled(group: THREE.Group, enabled: boolean): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = enabled && child.userData.rooftopCastsShadow === true;
      child.receiveShadow = enabled && child.userData.rooftopReceivesShadow === true;
    }
  });
}

/** Libera referências do grupo. Geometrias e materiais são compartilhados no módulo. */
export function disposeRooftopMesh(group: THREE.Group): void {
  group.clear();
}

/** Descarta todos os recursos compartilhados. Chamar apenas no dispose final do manager. */
export function disposeRooftopSharedResources(): void {
  for (const geometry of SHARED_ROOFTOP_GEOMETRIES) {
    geometry.dispose();
  }
  for (const material of SHARED_ROOFTOP_MATERIALS) {
    material.dispose();
  }
}

/** @deprecated Use disposeRooftopSharedResources. Mantido para compatibilidade. */
export function disposeRooftopMaterials(): void {
  disposeRooftopSharedResources();
}

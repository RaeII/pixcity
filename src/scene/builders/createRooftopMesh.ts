import * as THREE from "three";
import type { RooftopType } from "../types";

type RooftopFootprint = {
  width: number;
  depth: number;
};

type RooftopFactory = (footprint?: RooftopFootprint) => THREE.Group;

const SPOTLIGHT_SCALE = 0.75;
const SPOTLIGHT_LENS_RADIUS = 0.04 * SPOTLIGHT_SCALE;
const SPOTLIGHT_BEAM_HEIGHT = 10.0;

const HELIPAD_DECK_HEIGHT = 0.035;
const HELIPAD_ROOF_CLEARANCE = 0.006;
const HELIPAD_PAINT_THICKNESS = 0.004;

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

const HELIPAD_DECK_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x2f3436,
  roughness: 0.88,
  metalness: 0.04,
});

const HELIPAD_RIM_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x3f4548,
  roughness: 0.62,
  metalness: 0.42,
});

const HELIPAD_PAINT_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xe8edf1,
  roughness: 0.78,
  metalness: 0.0,
});

const HELIPAD_LIGHT_BASE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x151719,
  roughness: 0.42,
  metalness: 0.65,
});

const HELIPAD_GREEN_LENS_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xbfffee,
  emissive: new THREE.Color(0x36ffc6),
  emissiveIntensity: 1.6,
  roughness: 0.18,
  metalness: 0.0,
});

const HELIPAD_UTILITY_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x596166,
  roughness: 0.72,
  metalness: 0.38,
});

const HELIPAD_DECK_GEOMETRY = new THREE.CylinderGeometry(
  1,
  1,
  HELIPAD_DECK_HEIGHT,
  96,
  1,
  false,
);
const HELIPAD_RIM_GEOMETRY = new THREE.TorusGeometry(1, 0.016, 8, 96);
const HELIPAD_OUTER_RING_GEOMETRY = new THREE.RingGeometry(0.78, 0.9, 96);
const HELIPAD_INNER_RING_GEOMETRY = new THREE.RingGeometry(0.29, 0.33, 80);
const HELIPAD_STRIP_GEOMETRY = new THREE.BoxGeometry(1, HELIPAD_PAINT_THICKNESS, 1);
const HELIPAD_LIGHT_BASE_GEOMETRY = new THREE.CylinderGeometry(1, 1, 0.018, 12);
const HELIPAD_LIGHT_LENS_GEOMETRY = new THREE.CylinderGeometry(1, 1, 0.012, 12);
const HELIPAD_UTILITY_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

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
  HELIPAD_DECK_GEOMETRY,
  HELIPAD_RIM_GEOMETRY,
  HELIPAD_OUTER_RING_GEOMETRY,
  HELIPAD_INNER_RING_GEOMETRY,
  HELIPAD_STRIP_GEOMETRY,
  HELIPAD_LIGHT_BASE_GEOMETRY,
  HELIPAD_LIGHT_LENS_GEOMETRY,
  HELIPAD_UTILITY_GEOMETRY,
];

const SHARED_ROOFTOP_MATERIALS: THREE.Material[] = [
  SPOTLIGHT_HOUSING_MATERIAL,
  SPOTLIGHT_LENS_MATERIAL,
  SPOTLIGHT_BEAM_MATERIAL,
  HELIPAD_DECK_MATERIAL,
  HELIPAD_RIM_MATERIAL,
  HELIPAD_PAINT_MATERIAL,
  HELIPAD_LIGHT_BASE_MATERIAL,
  HELIPAD_GREEN_LENS_MATERIAL,
  HELIPAD_UTILITY_MATERIAL,
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

function createHelipad(footprint?: RooftopFootprint): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(1, footprint?.width ?? 1);
  const depth = Math.max(1, footprint?.depth ?? 1);
  const radius = THREE.MathUtils.clamp(Math.min(width, depth) * 0.34, 0.34, 0.88);
  const deckTopY = HELIPAD_ROOF_CLEARANCE + HELIPAD_DECK_HEIGHT;
  const paintY = deckTopY + HELIPAD_PAINT_THICKNESS / 2 + 0.001;

  const deck = new THREE.Mesh(HELIPAD_DECK_GEOMETRY, HELIPAD_DECK_MATERIAL);
  deck.scale.set(radius, 1, radius);
  deck.position.y = HELIPAD_ROOF_CLEARANCE + HELIPAD_DECK_HEIGHT / 2;
  setShadowRole(deck, true, true);
  group.add(deck);

  const rim = new THREE.Mesh(HELIPAD_RIM_GEOMETRY, HELIPAD_RIM_MATERIAL);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(radius, radius, radius);
  rim.position.y = deckTopY + 0.006;
  setShadowRole(rim, true, true);
  group.add(rim);

  const outerRing = new THREE.Mesh(HELIPAD_OUTER_RING_GEOMETRY, HELIPAD_PAINT_MATERIAL);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.scale.set(radius, radius, 1);
  outerRing.position.y = paintY;
  setShadowRole(outerRing, false, true);
  group.add(outerRing);

  const innerRing = new THREE.Mesh(HELIPAD_INNER_RING_GEOMETRY, HELIPAD_PAINT_MATERIAL);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.scale.set(radius, radius, 1);
  innerRing.position.y = paintY + 0.001;
  setShadowRole(innerRing, false, true);
  group.add(innerRing);

  const addPaintStrip = (
    widthScale: number,
    depthScale: number,
    x: number,
    z: number,
  ) => {
    const strip = new THREE.Mesh(HELIPAD_STRIP_GEOMETRY, HELIPAD_PAINT_MATERIAL);
    strip.scale.set(widthScale, 1, depthScale);
    strip.position.set(x, paintY + 0.002, z);
    setShadowRole(strip, false, true);
    group.add(strip);
  };

  const hBarWidth = radius * 0.16;
  const hBarLength = radius * 0.92;
  const hBarOffset = radius * 0.24;
  addPaintStrip(hBarWidth, hBarLength, -hBarOffset, 0);
  addPaintStrip(hBarWidth, hBarLength, hBarOffset, 0);
  addPaintStrip(hBarOffset * 2 + hBarWidth, hBarWidth, 0, 0);

  const lightCount = 12;
  const lightBaseRadius = THREE.MathUtils.clamp(radius * 0.035, 0.012, 0.026);
  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.97;
    const z = Math.sin(angle) * radius * 0.97;

    const base = new THREE.Mesh(HELIPAD_LIGHT_BASE_GEOMETRY, HELIPAD_LIGHT_BASE_MATERIAL);
    base.scale.set(lightBaseRadius, 1, lightBaseRadius);
    base.position.set(x, deckTopY + 0.009, z);
    setShadowRole(base, true, true);
    group.add(base);

    const lens = new THREE.Mesh(HELIPAD_LIGHT_LENS_GEOMETRY, HELIPAD_GREEN_LENS_MATERIAL);
    lens.scale.set(lightBaseRadius * 0.72, 1, lightBaseRadius * 0.72);
    lens.position.set(x, deckTopY + 0.024, z);
    setShadowRole(lens, false, false);
    group.add(lens);
  }

  const hatchHeight = 0.035;
  const hatch = new THREE.Mesh(HELIPAD_UTILITY_GEOMETRY, HELIPAD_UTILITY_MATERIAL);
  hatch.scale.set(radius * 0.34, hatchHeight, radius * 0.2);
  hatch.position.set(-radius * 0.42, HELIPAD_ROOF_CLEARANCE + hatchHeight / 2, radius * 1.18);
  setShadowRole(hatch, true, true);
  group.add(hatch);

  group.userData.helipadRadius = radius;
  return group;
}

const FACTORIES: Record<Exclude<RooftopType, "none">, RooftopFactory> = {
  spotlights: createSpotlights,
  helipad: createHelipad,
};

/**
 * Cria um Group Three.js para o acessório de topo do edifício.
 * Retorna null se o tipo for "none".
 * O grupo é posicionado com Y=0 na base (topo do edifício).
 */
export function createRooftopMesh(
  type: RooftopType,
  footprint?: RooftopFootprint,
): THREE.Group | null {
  if (type === "none") return null;
  const factory = FACTORIES[type];
  const group = factory(footprint);
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

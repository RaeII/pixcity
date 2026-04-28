import * as THREE from "three";

type PagodaTier = {
  bottom: number;
  top: number;
  footprintScale: number;
};

export type PagodaTierFootprint = {
  bottomY: number;
  topY: number;
  width: number;
  depth: number;
};

// Inspirado na silhueta da Jin Mao Tower (Shanghai):
// corpo alto com recuos progressivos suaves + coroa piramidal + pináculo.
const PAGODA_BODY_TIERS: PagodaTier[] = [
  { bottom: 0.0, top: 0.16, footprintScale: 1.0 },
  { bottom: 0.16, top: 0.32, footprintScale: 0.93 },
  { bottom: 0.32, top: 0.47, footprintScale: 0.87 },
  { bottom: 0.47, top: 0.61, footprintScale: 0.81 },
  { bottom: 0.61, top: 0.73, footprintScale: 0.75 },
  { bottom: 0.73, top: 0.83, footprintScale: 0.69 },
  { bottom: 0.83, top: 0.9, footprintScale: 0.63 },
];

const CROWN_LOWER_BOTTOM = 0.9;
const CROWN_LOWER_TOP = 0.96;
const CROWN_UPPER_TOP = 1.0;
const CROWN_LOWER_BOTTOM_SCALE = 0.63;
const CROWN_LOWER_TOP_SCALE = 0.34;
const CROWN_UPPER_TOP_SCALE = 0.12;
const EAVE_OVERHANG = 0.028;

let sharedPagodaGeometry: THREE.BufferGeometry | null = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sampleCrownScale(heightRatio: number): number {
  const t = clamp01((heightRatio - CROWN_LOWER_BOTTOM) / (CROWN_UPPER_TOP - CROWN_LOWER_BOTTOM));
  // Queda mais agressiva perto do topo para uma coroa pontuda.
  return THREE.MathUtils.lerp(CROWN_LOWER_BOTTOM_SCALE, CROWN_UPPER_TOP_SCALE, Math.pow(t, 1.35));
}

export function getPagodaFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = clamp01(heightRatio);

  const bodyTier =
    PAGODA_BODY_TIERS.find(({ bottom, top }) => clamped >= bottom && clamped <= top) ?? null;

  if (bodyTier) return bodyTier.footprintScale;

  return sampleCrownScale(clamped);
}

export function getPagodaTierFootprints(
  width = 1,
  depth = 1,
  height = 1,
): PagodaTierFootprint[] {
  const body = PAGODA_BODY_TIERS.map((tier) => ({
    bottomY: tier.bottom * height,
    topY: tier.top * height,
    width: width * tier.footprintScale,
    depth: depth * tier.footprintScale,
  }));

  const crownLower: PagodaTierFootprint = {
    bottomY: CROWN_LOWER_BOTTOM * height,
    topY: CROWN_LOWER_TOP * height,
    width: width * CROWN_LOWER_BOTTOM_SCALE,
    depth: depth * CROWN_LOWER_BOTTOM_SCALE,
  };

  const crownUpper: PagodaTierFootprint = {
    bottomY: CROWN_LOWER_TOP * height,
    topY: CROWN_UPPER_TOP * height,
    width: width * CROWN_LOWER_TOP_SCALE,
    depth: depth * CROWN_LOWER_TOP_SCALE,
  };

  return [...body, crownLower, crownUpper];
}

function pushVertex(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  x: number,
  y: number,
  z: number,
  normal: THREE.Vector3,
): void {
  positions.push(x, y, z);
  normals.push(normal.x, normal.y, normal.z);
  projectionPositions.push(x, y, z);
  projectionNormals.push(normal.x, normal.y, normal.z);
}

function pushQuad(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  corners: Array<[number, number, number]>,
  normal: THREE.Vector3,
): void {
  const order = [0, 1, 2, 0, 2, 3];
  for (const index of order) {
    const [x, y, z] = corners[index];
    pushVertex(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      x,
      y,
      z,
      normal,
    );
  }
}

function addVerticalTierFaces(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  tier: PagodaTier,
): void {
  const halfW = tier.footprintScale / 2;
  const halfD = tier.footprintScale / 2;
  const y0 = tier.bottom - 0.5;
  const y1 = tier.top - 0.5;

  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-halfW, y0, halfD],
      [halfW, y0, halfD],
      [halfW, y1, halfD],
      [-halfW, y1, halfD],
    ],
    new THREE.Vector3(0, 0, 1),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [halfW, y0, -halfD],
      [-halfW, y0, -halfD],
      [-halfW, y1, -halfD],
      [halfW, y1, -halfD],
    ],
    new THREE.Vector3(0, 0, -1),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [halfW, y0, halfD],
      [halfW, y0, -halfD],
      [halfW, y1, -halfD],
      [halfW, y1, halfD],
    ],
    new THREE.Vector3(1, 0, 0),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-halfW, y0, -halfD],
      [-halfW, y0, halfD],
      [-halfW, y1, halfD],
      [-halfW, y1, -halfD],
    ],
    new THREE.Vector3(-1, 0, 0),
  );
}

function addTopRing(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  outerScale: number,
  innerScale: number,
  y: number,
): void {
  const outerW = (outerScale + EAVE_OVERHANG) / 2;
  const outerD = (outerScale + EAVE_OVERHANG) / 2;
  const innerW = innerScale / 2;
  const innerD = innerScale / 2;
  const topNormal = new THREE.Vector3(0, 1, 0);

  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-outerW, y, innerD],
      [-outerW, y, outerD],
      [outerW, y, outerD],
      [outerW, y, innerD],
    ],
    topNormal,
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-outerW, y, -outerD],
      [-outerW, y, -innerD],
      [outerW, y, -innerD],
      [outerW, y, -outerD],
    ],
    topNormal,
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [innerW, y, -innerD],
      [innerW, y, innerD],
      [outerW, y, innerD],
      [outerW, y, -innerD],
    ],
    topNormal,
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-outerW, y, -innerD],
      [-outerW, y, innerD],
      [-innerW, y, innerD],
      [-innerW, y, -innerD],
    ],
    topNormal,
  );
}

function addCrownFrustum(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  yBottom: number,
  yTop: number,
  bottomScale: number,
  topScale: number,
): void {
  const hbW = bottomScale / 2;
  const hbD = bottomScale / 2;
  const htW = topScale / 2;
  const htD = topScale / 2;

  const y0 = yBottom - 0.5;
  const y1 = yTop - 0.5;

  // Frente
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-hbW, y0, hbD],
      [hbW, y0, hbD],
      [htW, y1, htD],
      [-htW, y1, htD],
    ],
    new THREE.Vector3(0, 0.32, 1).normalize(),
  );
  // Trás
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [hbW, y0, -hbD],
      [-hbW, y0, -hbD],
      [-htW, y1, -htD],
      [htW, y1, -htD],
    ],
    new THREE.Vector3(0, 0.32, -1).normalize(),
  );
  // Direita
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [hbW, y0, hbD],
      [hbW, y0, -hbD],
      [htW, y1, -htD],
      [htW, y1, htD],
    ],
    new THREE.Vector3(1, 0.32, 0).normalize(),
  );
  // Esquerda
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-hbW, y0, -hbD],
      [-hbW, y0, hbD],
      [-htW, y1, htD],
      [-htW, y1, -htD],
    ],
    new THREE.Vector3(-1, 0.32, 0).normalize(),
  );
}

function addTopRect(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  halfW: number,
  halfD: number,
  y: number,
): void {
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-halfW, y, -halfD],
      [-halfW, y, halfD],
      [halfW, y, halfD],
      [halfW, y, -halfD],
    ],
    new THREE.Vector3(0, 1, 0),
  );
}

function addSpire(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
): void {
  const spireHalf = 0.015;
  const y0 = 0.5;
  const y1 = 0.68;

  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-spireHalf, y0, spireHalf],
      [spireHalf, y0, spireHalf],
      [spireHalf, y1, spireHalf],
      [-spireHalf, y1, spireHalf],
    ],
    new THREE.Vector3(0, 0, 1),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [spireHalf, y0, -spireHalf],
      [-spireHalf, y0, -spireHalf],
      [-spireHalf, y1, -spireHalf],
      [spireHalf, y1, -spireHalf],
    ],
    new THREE.Vector3(0, 0, -1),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [spireHalf, y0, spireHalf],
      [spireHalf, y0, -spireHalf],
      [spireHalf, y1, -spireHalf],
      [spireHalf, y1, spireHalf],
    ],
    new THREE.Vector3(1, 0, 0),
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-spireHalf, y0, -spireHalf],
      [-spireHalf, y0, spireHalf],
      [-spireHalf, y1, spireHalf],
      [-spireHalf, y1, -spireHalf],
    ],
    new THREE.Vector3(-1, 0, 0),
  );

  addTopRect(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    spireHalf,
    spireHalf,
    y1,
  );
}

function buildPagodaGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const projectionPositions: number[] = [];
  const projectionNormals: number[] = [];

  const sideStart = 0;
  for (const tier of PAGODA_BODY_TIERS) {
    addVerticalTierFaces(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      tier,
    );
  }
  const sideCount = positions.length / 3 - sideStart;

  const topStart = positions.length / 3;
  for (let i = 0; i < PAGODA_BODY_TIERS.length - 1; i++) {
    const current = PAGODA_BODY_TIERS[i];
    const next = PAGODA_BODY_TIERS[i + 1];
    addTopRing(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      current.footprintScale,
      next.footprintScale,
      current.top - 0.5,
    );
  }

  addCrownFrustum(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    CROWN_LOWER_BOTTOM,
    CROWN_LOWER_TOP,
    CROWN_LOWER_BOTTOM_SCALE,
    CROWN_LOWER_TOP_SCALE,
  );
  addCrownFrustum(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    CROWN_LOWER_TOP,
    CROWN_UPPER_TOP,
    CROWN_LOWER_TOP_SCALE,
    CROWN_UPPER_TOP_SCALE,
  );
  addTopRect(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    CROWN_UPPER_TOP_SCALE / 2,
    CROWN_UPPER_TOP_SCALE / 2,
    0.5,
  );
  addSpire(positions, normals, projectionPositions, projectionNormals);
  const topCount = positions.length / 3 - topStart;

  const bottomStart = positions.length / 3;
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-0.5, -0.5, 0.5],
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
    ],
    new THREE.Vector3(0, -1, 0),
  );
  const bottomCount = positions.length / 3 - bottomStart;

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), 3),
  );
  geometry.setAttribute(
    "aProjPosition",
    new THREE.BufferAttribute(new Float32Array(projectionPositions), 3),
  );
  geometry.setAttribute(
    "aProjNormal",
    new THREE.BufferAttribute(new Float32Array(projectionNormals), 3),
  );

  geometry.addGroup(sideStart, sideCount, 0);
  geometry.addGroup(topStart, topCount, 1);
  geometry.addGroup(bottomStart, bottomCount, 0);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function getPagodaGeometry(): THREE.BufferGeometry {
  if (!sharedPagodaGeometry) {
    sharedPagodaGeometry = buildPagodaGeometry();
  }
  return sharedPagodaGeometry;
}

export function createPagodaBuildingMesh(
  facadeMaterial: THREE.Material,
  topMaterial: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(getPagodaGeometry(), [facadeMaterial, topMaterial]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function disposePagodaBuildingSharedResources(): void {
  if (sharedPagodaGeometry) {
    sharedPagodaGeometry.dispose();
    sharedPagodaGeometry = null;
  }
}

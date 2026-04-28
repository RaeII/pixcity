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

const PAGODA_TIERS: PagodaTier[] = [
  { bottom: 0.0, top: 0.2, footprintScale: 1.0 },
  { bottom: 0.2, top: 0.4, footprintScale: 0.84 },
  { bottom: 0.4, top: 0.6, footprintScale: 0.69 },
  { bottom: 0.6, top: 0.8, footprintScale: 0.55 },
  { bottom: 0.8, top: 1.0, footprintScale: 0.42 },
];

const EAVE_OVERHANG = 0.08;

let sharedPagodaGeometry: THREE.BufferGeometry | null = null;

export function getPagodaFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = Math.max(0, Math.min(1, heightRatio));
  const tier =
    PAGODA_TIERS.find(({ bottom, top }) => clamped >= bottom && clamped <= top) ??
    PAGODA_TIERS[PAGODA_TIERS.length - 1];
  return tier.footprintScale;
}

export function getPagodaTierFootprints(
  width = 1,
  depth = 1,
  height = 1,
): PagodaTierFootprint[] {
  return PAGODA_TIERS.map((tier) => ({
    bottomY: tier.bottom * height,
    topY: tier.top * height,
    width: width * tier.footprintScale,
    depth: depth * tier.footprintScale,
  }));
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

function addTierVerticalFaces(
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

function addPagodaEaveRing(
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
  const downNormal = new THREE.Vector3(0, -1, 0);

  // Laje superior do "beiral"
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

  // Ligeiro intradorso para dar leitura de "telhado em degrau" na silhueta.
  const soffitY = y - 0.01;
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-outerW, soffitY, outerD],
      [-outerW, soffitY, innerD],
      [outerW, soffitY, innerD],
      [outerW, soffitY, outerD],
    ],
    downNormal,
  );
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-outerW, soffitY, -innerD],
      [-outerW, soffitY, -outerD],
      [outerW, soffitY, -outerD],
      [outerW, soffitY, -innerD],
    ],
    downNormal,
  );
}

function buildPagodaGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const projectionPositions: number[] = [];
  const projectionNormals: number[] = [];

  const sideStart = 0;
  for (const tier of PAGODA_TIERS) {
    addTierVerticalFaces(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      tier,
    );
  }
  const sideCount = positions.length / 3 - sideStart;

  const topStart = positions.length / 3;
  for (let i = 0; i < PAGODA_TIERS.length - 1; i++) {
    const current = PAGODA_TIERS[i];
    const next = PAGODA_TIERS[i + 1];
    addPagodaEaveRing(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      current.footprintScale,
      next.footprintScale,
      current.top - 0.5,
    );
  }

  const topTier = PAGODA_TIERS[PAGODA_TIERS.length - 1];
  addTopRect(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    topTier.footprintScale / 2,
    topTier.footprintScale / 2,
    0.5,
  );
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

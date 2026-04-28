import * as THREE from "three";

type PagodaTier = {
  bottom: number;
  top: number;
  bodyScale: number;
  roofScale: number;
};

export type PagodaTierFootprint = {
  bottomY: number;
  topY: number;
  bodyWidth: number;
  bodyDepth: number;
  roofWidth: number;
  roofDepth: number;
};

const PAGODA_EAVE_THICKNESS = 0.018;

const PAGODA_TIERS: PagodaTier[] = [
  { bottom: 0.0, top: 0.18, bodyScale: 1.0, roofScale: 1.14 },
  { bottom: 0.18, top: 0.36, bodyScale: 0.84, roofScale: 0.98 },
  { bottom: 0.36, top: 0.54, bodyScale: 0.7, roofScale: 0.84 },
  { bottom: 0.54, top: 0.7, bodyScale: 0.58, roofScale: 0.72 },
  { bottom: 0.7, top: 0.84, bodyScale: 0.48, roofScale: 0.62 },
  { bottom: 0.84, top: 1.0, bodyScale: 0.38, roofScale: 0.5 },
];

let sharedPagodaGeometry: THREE.BufferGeometry | null = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getPagodaFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = clamp01(heightRatio);
  const tier =
    PAGODA_TIERS.find(({ bottom, top }) => clamped >= bottom && clamped <= top) ??
    PAGODA_TIERS[PAGODA_TIERS.length - 1];
  return tier.bodyScale;
}

export function getPagodaTierFootprints(
  width = 1,
  depth = 1,
  height = 1,
): PagodaTierFootprint[] {
  return PAGODA_TIERS.map((tier) => ({
    bottomY: tier.bottom * height,
    topY: tier.top * height,
    bodyWidth: width * tier.bodyScale,
    bodyDepth: depth * tier.bodyScale,
    roofWidth: width * tier.roofScale,
    roofDepth: depth * tier.roofScale,
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

function addVerticalFaces(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  halfW: number,
  halfD: number,
  y0: number,
  y1: number,
): void {
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

function addRing(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  outerScale: number,
  innerScale: number,
  y: number,
  normalY: number,
): void {
  const outerW = outerScale / 2;
  const outerD = outerScale / 2;
  const innerW = innerScale / 2;
  const innerD = innerScale / 2;
  const normal = new THREE.Vector3(0, normalY, 0);

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
    normal,
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
    normal,
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
    normal,
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
    normal,
  );
}

function addTopRect(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  scale: number,
  y: number,
): void {
  const half = scale / 2;
  pushQuad(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    [
      [-half, y, -half],
      [-half, y, half],
      [half, y, half],
      [half, y, -half],
    ],
    new THREE.Vector3(0, 1, 0),
  );
}

function buildPagodaGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const sidePositions: number[] = [];
  const sideNormals: number[] = [];
  const sideProjectionPositions: number[] = [];
  const sideProjectionNormals: number[] = [];

  const topPositions: number[] = [];
  const topNormals: number[] = [];
  const topProjectionPositions: number[] = [];
  const topProjectionNormals: number[] = [];

  for (let i = 0; i < PAGODA_TIERS.length; i++) {
    const tier = PAGODA_TIERS[i];
    const bodyHalf = tier.bodyScale / 2;
    const roofHalf = tier.roofScale / 2;
    const yBottom = tier.bottom - 0.5;
    const yTop = tier.top - 0.5;
    const eaveBottomY = Math.max(yBottom, yTop - PAGODA_EAVE_THICKNESS);

    addVerticalFaces(
      sidePositions,
      sideNormals,
      sideProjectionPositions,
      sideProjectionNormals,
      bodyHalf,
      bodyHalf,
      yBottom,
      eaveBottomY,
    );

    addVerticalFaces(
      sidePositions,
      sideNormals,
      sideProjectionPositions,
      sideProjectionNormals,
      roofHalf,
      roofHalf,
      eaveBottomY,
      yTop,
    );

    addRing(
      sidePositions,
      sideNormals,
      sideProjectionPositions,
      sideProjectionNormals,
      tier.roofScale,
      tier.bodyScale,
      eaveBottomY,
      -1,
    );

    const nextBodyScale = PAGODA_TIERS[i + 1]?.bodyScale;
    if (nextBodyScale !== undefined) {
      addRing(
        topPositions,
        topNormals,
        topProjectionPositions,
        topProjectionNormals,
        tier.roofScale,
        nextBodyScale,
        yTop,
        1,
      );
    } else {
      addTopRect(
        topPositions,
        topNormals,
        topProjectionPositions,
        topProjectionNormals,
        tier.roofScale,
        yTop,
      );
    }
  }

  // Base inferior
  pushQuad(
    sidePositions,
    sideNormals,
    sideProjectionPositions,
    sideProjectionNormals,
    [
      [-0.5, -0.5, 0.5],
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
    ],
    new THREE.Vector3(0, -1, 0),
  );

  const positions = new Float32Array([...sidePositions, ...topPositions]);
  const normals = new Float32Array([...sideNormals, ...topNormals]);
  const projectionPositions = new Float32Array([
    ...sideProjectionPositions,
    ...topProjectionPositions,
  ]);
  const projectionNormals = new Float32Array([
    ...sideProjectionNormals,
    ...topProjectionNormals,
  ]);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aProjPosition", new THREE.BufferAttribute(projectionPositions, 3));
  geometry.setAttribute("aProjNormal", new THREE.BufferAttribute(projectionNormals, 3));

  const sideCount = sidePositions.length / 3;
  const topCount = topPositions.length / 3;
  geometry.clearGroups();
  geometry.addGroup(0, sideCount, 0);
  geometry.addGroup(sideCount, topCount, 1);

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

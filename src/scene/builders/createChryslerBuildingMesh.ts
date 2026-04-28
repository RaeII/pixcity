import * as THREE from "three";

export type ChryslerTierFootprint = {
  bottomY: number;
  topY: number;
  width: number;
  depth: number;
};

type ChryslerTier = {
  bottom: number;
  top: number;
  footprintScale: number;
  role: "shaft" | "crown" | "spire";
};

// Perfil inspirado no Chrysler Building:
// - corpo alto em setbacks art déco
// - coroa metálica recuada em múltiplos níveis
// - pináculo estreito no topo
const CHRYSLER_TIERS: ChryslerTier[] = [
  { bottom: 0.0, top: 0.36, footprintScale: 1.0, role: "shaft" },
  { bottom: 0.36, top: 0.52, footprintScale: 0.86, role: "shaft" },
  { bottom: 0.52, top: 0.64, footprintScale: 0.74, role: "shaft" },
  { bottom: 0.64, top: 0.74, footprintScale: 0.62, role: "shaft" },
  { bottom: 0.74, top: 0.82, footprintScale: 0.52, role: "crown" },
  { bottom: 0.82, top: 0.88, footprintScale: 0.43, role: "crown" },
  { bottom: 0.88, top: 0.93, footprintScale: 0.34, role: "crown" },
  { bottom: 0.93, top: 0.97, footprintScale: 0.25, role: "crown" },
  { bottom: 0.97, top: 1.0, footprintScale: 0.1, role: "spire" },
];

let sharedChryslerGeometry: THREE.BufferGeometry | null = null;

export function getChryslerFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = Math.max(0, Math.min(1, heightRatio));
  const tier =
    CHRYSLER_TIERS.find(({ bottom, top }) => clamped >= bottom && clamped <= top) ??
    CHRYSLER_TIERS[CHRYSLER_TIERS.length - 1];
  return tier.footprintScale;
}

export function getChryslerTierFootprints(
  width = 1,
  depth = 1,
  height = 1,
): ChryslerTierFootprint[] {
  return CHRYSLER_TIERS.map((tier) => ({
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
  projectionNormal: THREE.Vector3,
): void {
  positions.push(x, y, z);
  normals.push(normal.x, normal.y, normal.z);
  projectionPositions.push(x, y, z);
  projectionNormals.push(projectionNormal.x, projectionNormal.y, projectionNormal.z);
}

function pushQuad(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  corners: Array<[number, number, number]>,
  normal: THREE.Vector3,
  projectionNormal: THREE.Vector3,
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
      projectionNormal,
    );
  }
}

function addVerticalTierFaces(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  tier: ChryslerTier,
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
  const outerW = outerScale / 2;
  const outerD = outerScale / 2;
  const innerW = innerScale / 2;
  const innerD = innerScale / 2;
  const up = new THREE.Vector3(0, 1, 0);

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
    up,
    up,
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
    up,
    up,
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
    up,
    up,
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
    up,
    up,
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
  const up = new THREE.Vector3(0, 1, 0);
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
    up,
    up,
  );
}

function buildChryslerGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const projectionPositions: number[] = [];
  const projectionNormals: number[] = [];

  const sideStart = 0;
  for (const tier of CHRYSLER_TIERS) {
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
  for (let i = 0; i < CHRYSLER_TIERS.length - 1; i++) {
    const current = CHRYSLER_TIERS[i];
    const next = CHRYSLER_TIERS[i + 1];
    addTopRing(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      current.footprintScale,
      next.footprintScale,
      current.top - 0.5,
    );

    // Degraus metálicos extras na coroa para aproximar o visual art-déco.
    if (current.role === "crown") {
      const bevelScale = Math.max(next.footprintScale * 0.92, 0.04);
      const bevelY = current.top - 0.5 + 0.006;
      addTopRing(
        positions,
        normals,
        projectionPositions,
        projectionNormals,
        next.footprintScale,
        bevelScale,
        bevelY,
      );
    }
  }

  addTopRect(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    CHRYSLER_TIERS[CHRYSLER_TIERS.length - 1].footprintScale,
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

function getChryslerGeometry(): THREE.BufferGeometry {
  if (!sharedChryslerGeometry) {
    sharedChryslerGeometry = buildChryslerGeometry();
  }
  return sharedChryslerGeometry;
}

export function createChryslerBuildingMesh(
  facadeMaterial: THREE.Material,
  topMaterial: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(getChryslerGeometry(), [facadeMaterial, topMaterial]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function disposeChryslerBuildingSharedResources(): void {
  if (sharedChryslerGeometry) {
    sharedChryslerGeometry.dispose();
    sharedChryslerGeometry = null;
  }
}

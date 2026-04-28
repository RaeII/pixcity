import * as THREE from "three";
import { getOctagonalFootprintPoints } from "./createOctagonalBuildingMesh";

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

// Inspirado em torres pagoda contemporâneas (ex: Jin Mao Tower):
// - fuste principal longo e esguio
// - sequência de setbacks mais curtos no terço superior
// - coroa metálica afunilada + pináculo
const PAGODA_TIERS: PagodaTier[] = [
  { bottom: 0.0, top: 0.72, footprintScale: 1.0 },
  { bottom: 0.72, top: 0.8, footprintScale: 0.92 },
  { bottom: 0.8, top: 0.86, footprintScale: 0.84 },
  { bottom: 0.86, top: 0.91, footprintScale: 0.74 },
  { bottom: 0.91, top: 0.945, footprintScale: 0.62 },
  { bottom: 0.945, top: 0.968, footprintScale: 0.5 },
  { bottom: 0.968, top: 0.985, footprintScale: 0.38 },
];

const CROWN_NECK_RATIO = 0.993;
const CROWN_NECK_SCALE = 0.25;
const SPIRE_BASE_RATIO = 0.997;
const SPIRE_BASE_SCALE = 0.13;

let sharedPagodaGeometry: THREE.BufferGeometry | null = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getPagodaFootprintScaleAtHeightRatio(heightRatio: number): number {
  const y = clamp01(heightRatio);

  if (y >= SPIRE_BASE_RATIO) {
    const t = (y - SPIRE_BASE_RATIO) / (1 - SPIRE_BASE_RATIO);
    return THREE.MathUtils.lerp(SPIRE_BASE_SCALE, 0.02, t);
  }

  if (y >= CROWN_NECK_RATIO) {
    const t = (y - CROWN_NECK_RATIO) / (SPIRE_BASE_RATIO - CROWN_NECK_RATIO);
    return THREE.MathUtils.lerp(CROWN_NECK_SCALE, SPIRE_BASE_SCALE, t);
  }

  const tier =
    PAGODA_TIERS.find(({ bottom, top }) => y >= bottom && y <= top) ??
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
  projectionNormal: THREE.Vector3,
): void {
  positions.push(x, y, z);
  normals.push(normal.x, normal.y, normal.z);
  projectionPositions.push(x, y, z);
  projectionNormals.push(projectionNormal.x, projectionNormal.y, projectionNormal.z);
}

function pushTriangle(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
  projectionNormal: THREE.Vector3,
): void {
  pushVertex(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    a.x,
    a.y,
    a.z,
    normal,
    projectionNormal,
  );
  pushVertex(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    b.x,
    b.y,
    b.z,
    normal,
    projectionNormal,
  );
  pushVertex(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    c.x,
    c.y,
    c.z,
    normal,
    projectionNormal,
  );
}

function addVerticalFrustum(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  lower: Array<{ x: number; z: number }>,
  upper: Array<{ x: number; z: number }>,
  y0: number,
  y1: number,
): void {
  for (let i = 0; i < lower.length; i++) {
    const j = (i + 1) % lower.length;

    const a = new THREE.Vector3(lower[i].x, y0, lower[i].z);
    const b = new THREE.Vector3(lower[j].x, y0, lower[j].z);
    const c = new THREE.Vector3(upper[j].x, y1, upper[j].z);
    const d = new THREE.Vector3(upper[i].x, y1, upper[i].z);

    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
    const projectionNormal =
      Math.abs(normal.x) >= Math.abs(normal.z)
        ? new THREE.Vector3(Math.sign(normal.x) || 1, 0, 0)
        : new THREE.Vector3(0, 0, Math.sign(normal.z) || 1);

    pushTriangle(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      a,
      b,
      c,
      normal,
      projectionNormal,
    );
    pushTriangle(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      a,
      c,
      d,
      normal,
      projectionNormal,
    );
  }
}

function addTopRing(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  outer: Array<{ x: number; z: number }>,
  inner: Array<{ x: number; z: number }>,
  y: number,
): void {
  const normal = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;

    const a = new THREE.Vector3(outer[i].x, y, outer[i].z);
    const b = new THREE.Vector3(outer[j].x, y, outer[j].z);
    const c = new THREE.Vector3(inner[j].x, y, inner[j].z);
    const d = new THREE.Vector3(inner[i].x, y, inner[i].z);

    pushTriangle(positions, normals, projectionPositions, projectionNormals, a, b, c, normal, normal);
    pushTriangle(positions, normals, projectionPositions, projectionNormals, a, c, d, normal, normal);
  }
}

function addTopCap(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  points: Array<{ x: number; z: number }>,
  y: number,
  up = true,
): void {
  const center = new THREE.Vector3(0, y, 0);
  const normal = new THREE.Vector3(0, up ? 1 : -1, 0);

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const a = new THREE.Vector3(points[i].x, y, points[i].z);
    const b = new THREE.Vector3(points[j].x, y, points[j].z);

    if (up) {
      pushTriangle(positions, normals, projectionPositions, projectionNormals, center, b, a, normal, normal);
    } else {
      pushTriangle(positions, normals, projectionPositions, projectionNormals, center, a, b, normal, normal);
    }
  }
}

function addSpire(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
): void {
  const baseY = SPIRE_BASE_RATIO - 0.5;
  const apex = new THREE.Vector3(0, 0.5, 0);
  const base = getOctagonalFootprintPoints(SPIRE_BASE_SCALE, SPIRE_BASE_SCALE);

  for (let i = 0; i < base.length; i++) {
    const j = (i + 1) % base.length;
    const a = new THREE.Vector3(base[i].x, baseY, base[i].z);
    const b = new THREE.Vector3(base[j].x, baseY, base[j].z);

    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(apex, a)).normalize();
    const projectionNormal =
      Math.abs(normal.x) >= Math.abs(normal.z)
        ? new THREE.Vector3(Math.sign(normal.x) || 1, 1, 0)
        : new THREE.Vector3(0, 1, Math.sign(normal.z) || 1);

    pushTriangle(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      a,
      b,
      apex,
      normal,
      projectionNormal.normalize(),
    );
  }
}

function buildPagodaGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const projectionPositions: number[] = [];
  const projectionNormals: number[] = [];

  const sideStart = 0;
  for (const tier of PAGODA_TIERS) {
    const lower = getOctagonalFootprintPoints(tier.footprintScale, tier.footprintScale);
    const upper = getOctagonalFootprintPoints(tier.footprintScale, tier.footprintScale);
    addVerticalFrustum(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      lower,
      upper,
      tier.bottom - 0.5,
      tier.top - 0.5,
    );
  }

  const lastTier = PAGODA_TIERS[PAGODA_TIERS.length - 1];
  const crownNeck = {
    bottom: lastTier.top,
    top: CROWN_NECK_RATIO,
    footprintScale: CROWN_NECK_SCALE,
  };
  addVerticalFrustum(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    getOctagonalFootprintPoints(lastTier.footprintScale, lastTier.footprintScale),
    getOctagonalFootprintPoints(crownNeck.footprintScale, crownNeck.footprintScale),
    crownNeck.bottom - 0.5,
    crownNeck.top - 0.5,
  );
  const sideCount = positions.length / 3 - sideStart;

  const topStart = positions.length / 3;
  for (let i = 0; i < PAGODA_TIERS.length - 1; i++) {
    const current = PAGODA_TIERS[i];
    const next = PAGODA_TIERS[i + 1];

    addTopRing(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      getOctagonalFootprintPoints(current.footprintScale, current.footprintScale),
      getOctagonalFootprintPoints(next.footprintScale, next.footprintScale),
      current.top - 0.5,
    );
  }

  addTopRing(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    getOctagonalFootprintPoints(lastTier.footprintScale, lastTier.footprintScale),
    getOctagonalFootprintPoints(crownNeck.footprintScale, crownNeck.footprintScale),
    lastTier.top - 0.5,
  );

  const spireBase = {
    bottom: CROWN_NECK_RATIO,
    top: SPIRE_BASE_RATIO,
    footprintScale: SPIRE_BASE_SCALE,
  };

  addVerticalFrustum(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    getOctagonalFootprintPoints(crownNeck.footprintScale, crownNeck.footprintScale),
    getOctagonalFootprintPoints(spireBase.footprintScale, spireBase.footprintScale),
    spireBase.bottom - 0.5,
    spireBase.top - 0.5,
  );

  addTopCap(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    getOctagonalFootprintPoints(spireBase.footprintScale, spireBase.footprintScale),
    spireBase.top - 0.5,
  );

  addSpire(positions, normals, projectionPositions, projectionNormals);
  const topCount = positions.length / 3 - topStart;

  const bottomStart = positions.length / 3;
  addTopCap(
    positions,
    normals,
    projectionPositions,
    projectionNormals,
    getOctagonalFootprintPoints(1, 1),
    -0.5,
    false,
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

import * as THREE from "three";

type FootprintPoint = { x: number; z: number };

export type ChryslerTierFootprint = {
  bottomY: number;
  topY: number;
  width: number;
  depth: number;
};

type ChryslerLevel = {
  heightRatio: number;
  footprintScale: number;
  chamferRatio: number;
  crownAccent?: boolean;
};

const CHRYSLER_LEVELS: ChryslerLevel[] = [
  { heightRatio: 0, footprintScale: 1, chamferRatio: 0.02 },
  { heightRatio: 0.58, footprintScale: 0.82, chamferRatio: 0.08 },
  { heightRatio: 0.72, footprintScale: 0.64, chamferRatio: 0.12 },
  { heightRatio: 0.82, footprintScale: 0.5, chamferRatio: 0.18, crownAccent: true },
  { heightRatio: 0.88, footprintScale: 0.44, chamferRatio: 0.24, crownAccent: true },
  { heightRatio: 0.92, footprintScale: 0.36, chamferRatio: 0.3, crownAccent: true },
  { heightRatio: 0.955, footprintScale: 0.26, chamferRatio: 0.36, crownAccent: true },
  { heightRatio: 0.98, footprintScale: 0.16, chamferRatio: 0.42, crownAccent: true },
  { heightRatio: 1, footprintScale: 0.03, chamferRatio: 0, crownAccent: true },
];

let sharedChryslerGeometry: THREE.BufferGeometry | null = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getProjectionNormal(normal: THREE.Vector3): THREE.Vector3 {
  const ax = Math.abs(normal.x);
  const ay = Math.abs(normal.y);
  const az = Math.abs(normal.z);

  if (ay >= ax && ay >= az) {
    return new THREE.Vector3(0, Math.sign(normal.y) || 1, 0);
  }

  if (ax >= az) {
    return new THREE.Vector3(Math.sign(normal.x) || 1, 0, 0);
  }

  return new THREE.Vector3(0, 0, Math.sign(normal.z) || 1);
}

function getChryslerFootprintPoints(
  footprintScale: number,
  chamferRatio: number,
): FootprintPoint[] {
  const half = footprintScale / 2;
  const chamfer = half * clamp01(chamferRatio);
  const inner = Math.max(half - chamfer, 0);

  return [
    { x: -inner, z: -half },
    { x: inner, z: -half },
    { x: half, z: -inner },
    { x: half, z: inner },
    { x: inner, z: half },
    { x: -inner, z: half },
    { x: -half, z: inner },
    { x: -half, z: -inner },
  ];
}

export function getChryslerFootprintScaleAtHeightRatio(heightRatio: number): number {
  const t = clamp01(heightRatio);

  for (let i = 0; i < CHRYSLER_LEVELS.length - 1; i++) {
    const a = CHRYSLER_LEVELS[i];
    const b = CHRYSLER_LEVELS[i + 1];
    if (t >= a.heightRatio && t <= b.heightRatio) {
      const span = Math.max(b.heightRatio - a.heightRatio, 1e-6);
      const local = (t - a.heightRatio) / span;
      return THREE.MathUtils.lerp(a.footprintScale, b.footprintScale, local);
    }
  }

  return CHRYSLER_LEVELS[CHRYSLER_LEVELS.length - 1].footprintScale;
}

export function getChryslerTierFootprints(
  width = 1,
  depth = 1,
  height = 1,
): ChryslerTierFootprint[] {
  const tiers: ChryslerTierFootprint[] = [];
  for (let i = 0; i < CHRYSLER_LEVELS.length - 1; i++) {
    const a = CHRYSLER_LEVELS[i];
    const b = CHRYSLER_LEVELS[i + 1];
    tiers.push({
      bottomY: a.heightRatio * height,
      topY: b.heightRatio * height,
      width: width * a.footprintScale,
      depth: depth * a.footprintScale,
    });
  }
  return tiers;
}

function pushTriangle(
  target: {
    positions: number[];
    normals: number[];
    projectionPositions: number[];
    projectionNormals: number[];
  },
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
  projectionNormal?: THREE.Vector3,
): void {
  const proj = projectionNormal ?? getProjectionNormal(normal);
  const vertices = [a, b, c];

  for (const v of vertices) {
    target.positions.push(v.x, v.y, v.z);
    target.normals.push(normal.x, normal.y, normal.z);
    target.projectionPositions.push(v.x, v.y, v.z);
    target.projectionNormals.push(proj.x, proj.y, proj.z);
  }
}

function pushQuad(
  target: {
    positions: number[];
    normals: number[];
    projectionPositions: number[];
    projectionNormals: number[];
  },
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  normal: THREE.Vector3,
  projectionNormal?: THREE.Vector3,
): void {
  pushTriangle(target, a, b, c, normal, projectionNormal);
  pushTriangle(target, a, c, d, normal, projectionNormal);
}

function pushTopCap(
  target: {
    positions: number[];
    normals: number[];
    projectionPositions: number[];
    projectionNormals: number[];
  },
  points: FootprintPoint[],
  y: number,
): void {
  const center = new THREE.Vector3(0, y, 0);
  const normal = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    pushTriangle(
      target,
      center,
      new THREE.Vector3(next.x, y, next.z),
      new THREE.Vector3(current.x, y, current.z),
      normal,
      normal,
    );
  }
}

function buildChryslerGeometry(): THREE.BufferGeometry {
  const facade = {
    positions: [] as number[],
    normals: [] as number[],
    projectionPositions: [] as number[],
    projectionNormals: [] as number[],
  };
  const top = {
    positions: [] as number[],
    normals: [] as number[],
    projectionPositions: [] as number[],
    projectionNormals: [] as number[],
  };

  const levelData = CHRYSLER_LEVELS.map((level) => {
    const y = level.heightRatio - 0.5;
    return {
      ...level,
      y,
      points: getChryslerFootprintPoints(level.footprintScale, level.chamferRatio),
    };
  });

  for (let i = 0; i < levelData.length - 1; i++) {
    const lower = levelData[i];
    const upper = levelData[i + 1];
    const target = upper.crownAccent ? top : facade;

    for (let p = 0; p < lower.points.length; p++) {
      const p0 = lower.points[p];
      const p1 = lower.points[(p + 1) % lower.points.length];
      const p2 = upper.points[(p + 1) % upper.points.length];
      const p3 = upper.points[p];

      const a = new THREE.Vector3(p0.x, lower.y, p0.z);
      const b = new THREE.Vector3(p1.x, lower.y, p1.z);
      const c = new THREE.Vector3(p2.x, upper.y, p2.z);
      const d = new THREE.Vector3(p3.x, upper.y, p3.z);

      const edge = new THREE.Vector3().subVectors(b, a);
      const rise = new THREE.Vector3().subVectors(d, a);
      const normal = new THREE.Vector3().crossVectors(edge, rise).normalize();

      pushQuad(target, a, b, c, d, normal);
    }

    const setbackDelta = lower.footprintScale - upper.footprintScale;
    if (setbackDelta > 0.001) {
      const up = new THREE.Vector3(0, 1, 0);
      for (let p = 0; p < lower.points.length; p++) {
        const o0 = lower.points[p];
        const o1 = lower.points[(p + 1) % lower.points.length];
        const i1 = upper.points[(p + 1) % upper.points.length];
        const i0 = upper.points[p];
        pushQuad(
          top,
          new THREE.Vector3(o0.x, upper.y, o0.z),
          new THREE.Vector3(o1.x, upper.y, o1.z),
          new THREE.Vector3(i1.x, upper.y, i1.z),
          new THREE.Vector3(i0.x, upper.y, i0.z),
          up,
          up,
        );
      }
    }
  }

  const topLevel = levelData[levelData.length - 1];
  pushTopCap(top, topLevel.points, topLevel.y);

  const positions = new Float32Array([...facade.positions, ...top.positions]);
  const normals = new Float32Array([...facade.normals, ...top.normals]);
  const projectionPositions = new Float32Array([
    ...facade.projectionPositions,
    ...top.projectionPositions,
  ]);
  const projectionNormals = new Float32Array([
    ...facade.projectionNormals,
    ...top.projectionNormals,
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aProjPosition", new THREE.BufferAttribute(projectionPositions, 3));
  geometry.setAttribute("aProjNormal", new THREE.BufferAttribute(projectionNormals, 3));

  const facadeCount = facade.positions.length / 3;
  const topCount = top.positions.length / 3;
  geometry.addGroup(0, facadeCount, 0);
  geometry.addGroup(facadeCount, topCount, 1);

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

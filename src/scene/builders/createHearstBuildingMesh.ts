import * as THREE from "three";

type FootprintPoint = { x: number; z: number };

type HearstTier = {
  bottom: number;
  top: number;
  footprintScale: number;
};

const HEARST_CORNER_CUT_RATIO = 0.2;
export const HEARST_FLAT_SIDE_RATIO = 1 - HEARST_CORNER_CUT_RATIO * 2;

const HEARST_TIERS: HearstTier[] = [
  // Podium (historic base reading)
  { bottom: 0.0, top: 0.18, footprintScale: 1.08 },
  // Main diagrid shaft (constante)
  { bottom: 0.18, top: 0.9, footprintScale: 1.0 },
  // Crown (inclined roof)
  { bottom: 0.9, top: 0.96, footprintScale: 0.82 },
  { bottom: 0.96, top: 1.0, footprintScale: 0.6 },
];

let sharedHearstGeometry: THREE.BufferGeometry | null = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getHearstFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = clamp01(heightRatio);
  const tier =
    HEARST_TIERS.find(({ bottom, top }) => clamped >= bottom && clamped <= top) ??
    HEARST_TIERS[HEARST_TIERS.length - 1];
  return tier.footprintScale;
}

export function getHearstFootprintPoints(
  width = 1,
  depth = 1,
  heightRatio = 0.5,
): FootprintPoint[] {
  const footprintScale = getHearstFootprintScaleAtHeightRatio(heightRatio);
  const halfW = (width * footprintScale) / 2;
  const halfD = (depth * footprintScale) / 2;

  const cutW = halfW * HEARST_CORNER_CUT_RATIO;
  const cutD = halfD * HEARST_CORNER_CUT_RATIO;

  return [
    { x: -halfW + cutW, z: -halfD },
    { x: halfW - cutW, z: -halfD },
    { x: halfW, z: -halfD + cutD },
    { x: halfW, z: halfD - cutD },
    { x: halfW - cutW, z: halfD },
    { x: -halfW + cutW, z: halfD },
    { x: -halfW, z: halfD - cutD },
    { x: -halfW, z: -halfD + cutD },
  ];
}

function pushFace(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  vertices: Array<{ point: FootprintPoint; y: number }>,
  normal: THREE.Vector3,
): void {
  const projNormal = getProjectionNormal(normal);

  for (const vertex of vertices) {
    positions.push(vertex.point.x, vertex.y, vertex.point.z);
    normals.push(normal.x, normal.y, normal.z);
    projectionPositions.push(vertex.point.x, vertex.y, vertex.point.z);
    projectionNormals.push(projNormal.x, projNormal.y, projNormal.z);
  }
}

function getProjectionNormal(normal: THREE.Vector3): THREE.Vector3 {
  const ax = Math.abs(normal.x);
  const ay = Math.abs(normal.y);
  const az = Math.abs(normal.z);

  if (ay >= ax && ay >= az) return new THREE.Vector3(0, Math.sign(normal.y) || 1, 0);
  if (ax >= az) return new THREE.Vector3(Math.sign(normal.x) || 1, 0, 0);
  return new THREE.Vector3(0, 0, Math.sign(normal.z) || 1);
}

function addBeltBand(
  positions: number[],
  normals: number[],
  projectionPositions: number[],
  projectionNormals: number[],
  points: FootprintPoint[],
  y: number,
  thickness: number,
): void {
  const y0 = y - thickness;
  const y1 = y;

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const edgeX = next.x - current.x;
    const edgeZ = next.z - current.z;
    const normal = new THREE.Vector3(edgeZ, 0, -edgeX).normalize();

    pushFace(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      [
        { point: current, y: y0 },
        { point: next, y: y1 },
        { point: next, y: y0 },
        { point: current, y: y0 },
        { point: current, y: y1 },
        { point: next, y: y1 },
      ],
      normal,
    );
  }
}

function buildHearstGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const projectionPositions: number[] = [];
  const projectionNormals: number[] = [];

  const geometry = new THREE.BufferGeometry();

  const sideStart = positions.length / 3;
  for (let tierIndex = 0; tierIndex < HEARST_TIERS.length; tierIndex++) {
    const tier = HEARST_TIERS[tierIndex];
    const currentPoints = getHearstFootprintPoints(1, 1, tier.bottom);
    const nextPoints = getHearstFootprintPoints(1, 1, tier.top);
    const y0 = tier.bottom - 0.5;
    const y1 = tier.top - 0.5;

    for (let i = 0; i < currentPoints.length; i++) {
      const currentBottom = currentPoints[i];
      const nextBottom = currentPoints[(i + 1) % currentPoints.length];
      const currentTop = nextPoints[i];
      const nextTop = nextPoints[(i + 1) % nextPoints.length];

      const edgeX = nextBottom.x - currentBottom.x;
      const edgeZ = nextBottom.z - currentBottom.z;
      const verticalSlopeX = currentTop.x - currentBottom.x;
      const verticalSlopeZ = currentTop.z - currentBottom.z;

      const edgeVector = new THREE.Vector3(edgeX, 0, edgeZ);
      const verticalVector = new THREE.Vector3(verticalSlopeX, y1 - y0, verticalSlopeZ);
      const normal = edgeVector.clone().cross(verticalVector).normalize();

      pushFace(
        positions,
        normals,
        projectionPositions,
        projectionNormals,
        [
          { point: currentBottom, y: y0 },
          { point: nextTop, y: y1 },
          { point: nextBottom, y: y0 },
          { point: currentBottom, y: y0 },
          { point: currentTop, y: y1 },
          { point: nextTop, y: y1 },
        ],
        normal,
      );
    }

    // Cintas horizontais para reforçar leitura da arquitetura real.
    if (tierIndex === 0 || tierIndex === 1) {
      addBeltBand(
        positions,
        normals,
        projectionPositions,
        projectionNormals,
        nextPoints,
        y1,
        0.01,
      );
    }
  }
  const sideCount = positions.length / 3 - sideStart;

  const topStart = positions.length / 3;
  const topPoints = getHearstFootprintPoints(1, 1, 1);
  const topCenter = { x: 0, z: 0 };
  const topNormal = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < topPoints.length; i++) {
    const current = topPoints[i];
    const next = topPoints[(i + 1) % topPoints.length];
    pushFace(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      [
        { point: topCenter, y: 0.5 },
        { point: next, y: 0.5 },
        { point: current, y: 0.5 },
      ],
      topNormal,
    );
  }
  const topCount = positions.length / 3 - topStart;

  const bottomStart = positions.length / 3;
  const bottomPoints = getHearstFootprintPoints(1, 1, 0);
  const bottomNormal = new THREE.Vector3(0, -1, 0);
  for (let i = 0; i < bottomPoints.length; i++) {
    const current = bottomPoints[i];
    const next = bottomPoints[(i + 1) % bottomPoints.length];
    pushFace(
      positions,
      normals,
      projectionPositions,
      projectionNormals,
      [
        { point: topCenter, y: -0.5 },
        { point: current, y: -0.5 },
        { point: next, y: -0.5 },
      ],
      bottomNormal,
    );
  }
  const bottomCount = positions.length / 3 - bottomStart;

  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
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

function getHearstGeometry(): THREE.BufferGeometry {
  if (!sharedHearstGeometry) {
    sharedHearstGeometry = buildHearstGeometry();
  }
  return sharedHearstGeometry;
}

export function createHearstBuildingMesh(
  facadeMaterial: THREE.Material,
  topMaterial: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(getHearstGeometry(), [facadeMaterial, topMaterial]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function disposeHearstBuildingSharedResources(): void {
  if (sharedHearstGeometry) {
    sharedHearstGeometry.dispose();
    sharedHearstGeometry = null;
  }
}

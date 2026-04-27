import * as THREE from "three";

const TAPER_HEIGHT_SEGMENTS = 24;
const TAPER_TOP_SCALE = 0.34;

let sharedTaperedGeometry: THREE.BufferGeometry | null = null;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

export function getTaperedFootprintScaleAtHeightRatio(heightRatio: number): number {
  const clamped = clamp01(heightRatio);
  const baseTaper = THREE.MathUtils.lerp(1, TAPER_TOP_SCALE, smoothstep(clamped));

  // Shoulder adicional no terço superior para leitura de "supertall" mais marcante.
  // Mantém continuidade C1 por usar smoothstep também nesta faixa.
  const upperBand = clamp01((clamped - 0.66) / 0.34);
  const upperShoulder = THREE.MathUtils.lerp(1, 0.9, smoothstep(upperBand));

  return baseTaper * upperShoulder;
}

function buildTaperedGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(
    1,
    1,
    1,
    1,
    TAPER_HEIGHT_SEGMENTS,
    1,
  );

  // Snapshot axis-aligned para projeção triplanar estável (mesmo padrão do twisted).
  const projPositions = new Float32Array(geometry.attributes.position.array);
  const projNormals = new Float32Array(geometry.attributes.normal.array);
  geometry.setAttribute("aProjPosition", new THREE.BufferAttribute(projPositions, 3));
  geometry.setAttribute("aProjNormal", new THREE.BufferAttribute(projNormals, 3));

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const heightRatio = y + 0.5;
    const scale = getTaperedFootprintScaleAtHeightRatio(heightRatio);
    pos.setX(i, pos.getX(i) * scale);
    pos.setZ(i, pos.getZ(i) * scale);
  }
  pos.needsUpdate = true;

  for (const group of geometry.groups) {
    group.materialIndex = group.materialIndex === 2 ? 1 : 0;
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function getTaperedGeometry(): THREE.BufferGeometry {
  if (!sharedTaperedGeometry) {
    sharedTaperedGeometry = buildTaperedGeometry();
  }
  return sharedTaperedGeometry;
}

export function createTaperedBuildingMesh(
  facadeMaterial: THREE.Material,
  topMaterial: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(getTaperedGeometry(), [facadeMaterial, topMaterial]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function disposeTaperedBuildingSharedResources(): void {
  if (sharedTaperedGeometry) {
    sharedTaperedGeometry.dispose();
    sharedTaperedGeometry = null;
  }
}

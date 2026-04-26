import * as THREE from "three";
import type { EdgeLightType } from "../types";

type EdgeLightFootprint = {
  width: number;
  depth: number;
  height: number;
};

export const DEFAULT_EDGE_LIGHT_COLOR = "#ffca57";
export const DEFAULT_EDGE_LIGHT_INTENSITY = 10;
export const DEFAULT_EDGE_LIGHT_DISTANCE = 0.04;
export const DEFAULT_EDGE_LIGHT_THICKNESS = 0.05;

type EdgeLightFactory = (
  footprint: EdgeLightFootprint,
) => THREE.Group;

const TOP_LIFT = 0.05;
const HALO_OPACITY = 0.55;
const HALO_OUTER_OPACITY = 0.22;

// Geometria sólida para o core (sem gradiente).
const EDGE_CORE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

/**
 * Cria BoxGeometry(1×1×1) com vertex colors RGBA cujo alpha faz gradiente radial
 * suave nas duas axes perpendiculares ao eixo principal da aresta.
 * alpha = 1.0 no centro (dist=0), alpha = 0.0 na borda (dist=0.5 em coords locais).
 * Usado pelos halos para que a luz se dissipe sem borda visível.
 */
function createGradientHaloGeometry(
  fade1: "x" | "y" | "z",
  fade2: "x" | "y" | "z",
): THREE.BoxGeometry {
  const SEG = 10; // subdivisões nas axes de fade para suavidade
  const wx = fade1 === "x" || fade2 === "x" ? SEG : 1;
  const hy = fade1 === "y" || fade2 === "y" ? SEG : 1;
  const dz = fade1 === "z" || fade2 === "z" ? SEG : 1;

  const geo = new THREE.BoxGeometry(1, 1, 1, wx, hy, dz);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const count = pos.count;
  const colors = new Float32Array(count * 4);

  const getComp: Record<"x" | "y" | "z", (i: number) => number> = {
    x: (i) => pos.getX(i),
    y: (i) => pos.getY(i),
    z: (i) => pos.getZ(i),
  };

  for (let i = 0; i < count; i++) {
    // Distância normalizada [0,1] do centro nas axes de fade
    // Coord local está em [-0.5, 0.5], portanto ×2 → [0, 1]
    const d1 = Math.abs(getComp[fade1](i)) * 2;
    const d2 = Math.abs(getComp[fade2](i)) * 2;
    // Math.min garante que as faces laterais (onde uma das distâncias é 1) 
    // calculem o gradiente a partir do centro da face. (Math.max as tornava invisíveis)
    const dist = Math.min(d1, d2);
    
    const t = Math.min(1, dist);
    // Queda exponencial (pow) cria um efeito de dissipação de luz muito mais 
    // realista do que o smoothstep, que criava um núcleo "sólido" demais.
    const alpha = Math.pow(1 - t, 2.0);

    colors[i * 4] = 1;
    colors[i * 4 + 1] = 1;
    colors[i * 4 + 2] = 1;
    colors[i * 4 + 3] = alpha;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geo;
}

// Geometrias de halo com gradiente — uma por combinação de axes perpendiculares.
// "fade_AB" significa que o gradiente dissolve ao longo das axes A e B,
// enquanto o eixo dominante da aresta é o complementar.
const HALO_GEO_XZ = createGradientHaloGeometry("x", "z"); // para arestas Y (cantos verticais)
const HALO_GEO_YZ = createGradientHaloGeometry("y", "z"); // para arestas X (topo frente/trás)
const HALO_GEO_XY = createGradientHaloGeometry("x", "y"); // para arestas Z (topo esq/dir)

const HALO_GEOMETRY_FOR_AXIS: Record<"x" | "y" | "z", THREE.BufferGeometry> = {
  y: HALO_GEO_XZ,
  x: HALO_GEO_YZ,
  z: HALO_GEO_XY,
};

const SHARED_EDGE_LIGHT_GEOMETRIES: THREE.BufferGeometry[] = [
  EDGE_CORE_GEOMETRY,
  HALO_GEO_XZ,
  HALO_GEO_YZ,
  HALO_GEO_XY,
];

type EdgeMaterials = {
  core: THREE.MeshStandardMaterial;
  halo: THREE.MeshBasicMaterial;
  haloOuter: THREE.MeshBasicMaterial;
};

function createEdgeMaterials(color: string, intensity: number): EdgeMaterials {
  const colorObj = new THREE.Color(color);
  const haloColorObj = colorObj.clone().multiplyScalar(intensity / 4.0);

  const core = new THREE.MeshStandardMaterial({
    color: colorObj.clone(),
    emissive: colorObj.clone(),
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.0,
    toneMapped: true,
  });

  // vertexColors: true → o alpha dos vertex colors controla a dissolução do halo
  const halo = new THREE.MeshBasicMaterial({
    color: haloColorObj.clone(),
    transparent: true,
    opacity: HALO_OPACITY,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  const haloOuter = new THREE.MeshBasicMaterial({
    color: haloColorObj.clone(),
    transparent: true,
    opacity: HALO_OUTER_OPACITY,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  return { core, halo, haloOuter };
}

function setShadowRole(
  mesh: THREE.Mesh,
  castsShadow: boolean,
  receivesShadow: boolean,
): void {
  mesh.userData.edgeLightCastsShadow = castsShadow;
  mesh.userData.edgeLightReceivesShadow = receivesShadow;
}

/**
 * Adiciona uma aresta ao grupo: core sólido emissivo + dois halos com gradiente
 * de alpha que dissipa a luz sem borda visível.
 */
function addEdgeSegment(
  group: THREE.Group,
  materials: EdgeMaterials,
  position: THREE.Vector3,
  axis: "x" | "y" | "z",
  length: number,
  distance: number,
  thickness: number,
): void {
  const buildScale = (t: number): THREE.Vector3 => {
    if (axis === "x") return new THREE.Vector3(length, t, t);
    if (axis === "z") return new THREE.Vector3(t, t, length);
    return new THREE.Vector3(t, length, t);
  };

  const haloGeo = HALO_GEOMETRY_FOR_AXIS[axis];

  const core = new THREE.Mesh(EDGE_CORE_GEOMETRY, materials.core);
  core.scale.copy(buildScale(thickness));
  core.position.copy(position);
  setShadowRole(core, false, false);
  group.add(core);

  const halo = new THREE.Mesh(haloGeo, materials.halo);
  halo.scale.copy(buildScale(distance));
  halo.position.copy(position);
  halo.renderOrder = 1;
  setShadowRole(halo, false, false);
  group.add(halo);

  const haloOuter = new THREE.Mesh(haloGeo, materials.haloOuter);
  haloOuter.scale.copy(buildScale(distance * 3.4));
  haloOuter.position.copy(position);
  haloOuter.renderOrder = 2;
  setShadowRole(haloOuter, false, false);
  group.add(haloOuter);
}

function createLed(
  footprint: EdgeLightFootprint,
): THREE.Group {
  const group = new THREE.Group();
  const { width, depth, height } = footprint;
  const halfW = width / 2;
  const halfD = depth / 2;

  const materials = createEdgeMaterials(DEFAULT_EDGE_LIGHT_COLOR, DEFAULT_EDGE_LIGHT_INTENSITY);
  group.userData.edgeLightMaterials = materials;

  // 4 arestas verticais (cantos), do chão ao topo
  const corners: Array<[number, number]> = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [-halfW, halfD],
    [halfW, halfD],
  ];
  for (const [x, z] of corners) {
    addEdgeSegment(
      group,
      materials,
      new THREE.Vector3(x, height / 2, z),
      "y",
      height,
      DEFAULT_EDGE_LIGHT_DISTANCE,
      DEFAULT_EDGE_LIGHT_THICKNESS,
    );
  }

  // 4 arestas no topo (retângulo). Lift leve para não colidir com helipad/holofotes.
  const topY = height + TOP_LIFT;

  for (const z of [-halfD, halfD]) {
    addEdgeSegment(group, materials, new THREE.Vector3(0, topY, z), "x", width, DEFAULT_EDGE_LIGHT_DISTANCE, DEFAULT_EDGE_LIGHT_THICKNESS);
  }
  for (const x of [-halfW, halfW]) {
    addEdgeSegment(group, materials, new THREE.Vector3(x, topY, 0), "z", depth, DEFAULT_EDGE_LIGHT_DISTANCE, DEFAULT_EDGE_LIGHT_THICKNESS);
  }

  return group;
}

const FACTORIES: Record<Exclude<EdgeLightType, "none">, EdgeLightFactory> = {
  led: createLed,
};

/**
 * Cria um Group Three.js para o efeito de LED nas arestas do edifício.
 * O grupo deve ser posicionado na BASE do edifício (não no topo); local Y=0
 * corresponde ao chão, local Y=height ao topo.
 */
export function createEdgeLightMesh(
  type: EdgeLightType,
  footprint: EdgeLightFootprint,
): THREE.Group | null {
  if (type === "none") return null;
  const factory = FACTORIES[type];
  const group = factory(footprint);
  group.userData.edgeLightType = type;
  setEdgeLightMeshShadowEnabled(group, true);
  return group;
}



export function setEdgeLightMeshShadowEnabled(
  group: THREE.Group,
  enabled: boolean,
): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = enabled && child.userData.edgeLightCastsShadow === true;
      child.receiveShadow = enabled && child.userData.edgeLightReceivesShadow === true;
    }
  });
}

/**
 * Libera materiais clonados deste grupo. Geometrias são compartilhadas no módulo.
 */
export function disposeEdgeLightMesh(group: THREE.Group): void {
  const materials = group.userData.edgeLightMaterials as EdgeMaterials | undefined;
  if (materials) {
    materials.core.dispose();
    materials.halo.dispose();
    materials.haloOuter.dispose();
  }
  group.clear();
}

/** Descarta recursos compartilhados. Chamar apenas no dispose final do manager. */
export function disposeEdgeLightSharedResources(): void {
  for (const geometry of SHARED_EDGE_LIGHT_GEOMETRIES) {
    geometry.dispose();
  }
}

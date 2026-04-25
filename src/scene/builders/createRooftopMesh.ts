import * as THREE from "three";
import type { RooftopType } from "../types";

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

function createSpotlights(): THREE.Group {
  const group = new THREE.Group();
  const spotlightScale = 0.75;
  const lensRadius = 0.04 * spotlightScale;
  const beamHeight = 10.0;

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
      new THREE.CylinderGeometry(
        0.06 * spotlightScale,
        0.08 * spotlightScale,
        0.05 * spotlightScale,
        8,
      ),
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    base.position.y = 0.025 * spotlightScale;
    spot.add(base);

    // Corpo do holofote (cilindro cônico apontando para cima)
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.04 * spotlightScale,
        0.07 * spotlightScale,
        0.12 * spotlightScale,
        8,
      ),
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    housing.position.y = 0.11 * spotlightScale;
    spot.add(housing);

    // Lente emissiva no topo do holofote
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(lensRadius, 12),
      SPOTLIGHT_LENS_MATERIAL,
    );
    lens.rotation.x = -Math.PI / 2;
    lens.position.y = 0.17 * spotlightScale;
    spot.add(lens);

    // Feixe de luz com fade gradual (opaco na fonte, transparente no topo)
    const beamGeo = createBeamGeometry(lensRadius, 0.22, beamHeight, 16);
    const beam = new THREE.Mesh(beamGeo, SPOTLIGHT_BEAM_MATERIAL);
    beam.rotation.x = Math.PI;
    beam.position.y = lens.position.y + beamHeight / 2;
    spot.add(beam);

    spot.position.set(cx, 0, cz);
    group.add(spot);
  }

  return group;
}

const FACTORIES: Record<Exclude<RooftopType, "none">, () => THREE.Group> = {
  spotlights: createSpotlights,
};

/**
 * Cria um Group Three.js para os holofotes de topo do edifício.
 * Retorna null se o tipo for "none".
 * O grupo é posicionado com Y=0 na base (topo do edifício).
 */
export function createRooftopMesh(type: RooftopType): THREE.Group | null {
  if (type === "none") return null;
  const factory = FACTORIES[type];
  const group = factory();
  group.userData.rooftopType = type;

  // Habilitar sombra em todos os meshes do grupo
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

/** Descarta geometrias de um grupo de holofotes. Materiais são compartilhados e não devem ser descartados aqui. */
export function disposeRooftopMesh(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
    }
  });
}

/** Descarta todos os materiais compartilhados. Chamar apenas no dispose final do manager. */
export function disposeRooftopMaterials(): void {
  SPOTLIGHT_HOUSING_MATERIAL.dispose();
  SPOTLIGHT_LENS_MATERIAL.dispose();
  SPOTLIGHT_BEAM_MATERIAL.dispose();
}

import * as THREE from "three";
import type { RooftopType } from "../types";

const ROOFTOP_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x888888,
  roughness: 0.6,
  metalness: 0.4,
});

const RED_LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xff2200,
  emissive: new THREE.Color(0xff2200),
  emissiveIntensity: 2.0,
  roughness: 0.3,
  metalness: 0.0,
});

const PANEL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x1a2a4a,
  roughness: 0.2,
  metalness: 0.8,
});

const PANEL_FRAME_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x555555,
  roughness: 0.5,
  metalness: 0.6,
});

const WHITE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xeeeeee,
  roughness: 0.5,
  metalness: 0.1,
});

const DISH_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.3,
  metalness: 0.7,
  side: THREE.DoubleSide,
});

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
  emissiveIntensity: 0.8,
  transparent: true,
  vertexColors: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

/** Cria um ConeGeometry com alpha gradiente via vertex colors (opaco na base/fonte, transparente na ponta/topo). */
function createBeamGeometry(radius: number, height: number, segments: number): THREE.ConeGeometry {
  const geo = new THREE.ConeGeometry(radius, height, segments, 4, true);
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 4);

  // ConeGeometry: tip (ponta) está em +Y, base (anel) em -Y.
  // Após rotation.x = PI, ponta fica embaixo (na fonte) e base fica em cima.
  // Queremos: ponta (fonte) = opaco, base (topo) = transparente.
  // No espaço local (antes da rotação): Y mais alto = ponta = opaco, Y mais baixo = base = transparente.
  const halfH = height / 2;
  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    // Normalizar: -halfH (base) → 0, +halfH (ponta) → 1
    const t = (y + halfH) / height;
    // Curva suave: mais opaco perto da fonte, desvanece para o final
    const alpha = t * t * 0.14;
    colors[i * 4] = 1;
    colors[i * 4 + 1] = 1;
    colors[i * 4 + 2] = 0.9;
    colors[i * 4 + 3] = alpha;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geo;
}

function createAntenna(): THREE.Group {
  const group = new THREE.Group();

  // Mastro principal
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 1.8, 6),
    ROOFTOP_MATERIAL,
  );
  pole.position.y = 0.9;
  group.add(pole);

  // Luz de sinalização no topo
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    RED_LIGHT_MATERIAL,
  );
  light.position.y = 1.82;
  group.add(light);

  // Barras laterais (suportes)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const support = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4),
      ROOFTOP_MATERIAL,
    );
    support.position.set(Math.cos(angle) * 0.12, 0.3, Math.sin(angle) * 0.12);
    support.rotation.z = (Math.cos(angle) > 0 ? -1 : 1) * 0.3;
    group.add(support);
  }

  return group;
}

function createWaterTank(): THREE.Group {
  const group = new THREE.Group();

  // Pernas de suporte
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4);
  const offsets = [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ];
  for (const [ox, oz] of offsets) {
    const leg = new THREE.Mesh(legGeo, ROOFTOP_MATERIAL);
    leg.position.set(ox, 0.2, oz);
    group.add(leg);
  }

  // Tanque cilíndrico
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.45, 12),
    ROOFTOP_MATERIAL,
  );
  tank.position.y = 0.62;
  group.add(tank);

  // Tampa do tanque
  const lid = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.15, 12),
    ROOFTOP_MATERIAL,
  );
  lid.position.y = 0.92;
  group.add(lid);

  return group;
}

function createHelipad(): THREE.Group {
  const group = new THREE.Group();

  // Plataforma circular
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.04, 24),
    ROOFTOP_MATERIAL,
  );
  pad.position.y = 0.02;
  group.add(pad);

  // Anel externo
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.55, 24),
    WHITE_MATERIAL,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  // Letra H (duas barras verticais + barra horizontal)
  const barGeo = new THREE.BoxGeometry(0.06, 0.005, 0.3);
  const leftBar = new THREE.Mesh(barGeo, WHITE_MATERIAL);
  leftBar.position.set(-0.1, 0.05, 0);
  group.add(leftBar);

  const rightBar = new THREE.Mesh(barGeo, WHITE_MATERIAL);
  rightBar.position.set(0.1, 0.05, 0);
  group.add(rightBar);

  const crossBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.005, 0.06),
    WHITE_MATERIAL,
  );
  crossBar.position.set(0, 0.05, 0);
  group.add(crossBar);

  return group;
}

function createSolarPanels(): THREE.Group {
  const group = new THREE.Group();

  const rows = 2;
  const cols = 3;
  const panelW = 0.25;
  const panelH = 0.35;
  const gap = 0.06;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * (panelW + gap);
      const z = (r - (rows - 1) / 2) * (panelH + gap);

      // Moldura
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(panelW + 0.02, 0.02, panelH + 0.02),
        PANEL_FRAME_MATERIAL,
      );
      frame.position.set(x, 0.18, z);
      frame.rotation.x = -0.4;
      group.add(frame);

      // Painel
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelW, 0.01, panelH),
        PANEL_MATERIAL,
      );
      panel.position.set(x, 0.19, z);
      panel.rotation.x = -0.4;
      group.add(panel);
    }
  }

  // Suportes
  const supportGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 4);
  for (const xOff of [-0.3, 0.3]) {
    const support = new THREE.Mesh(supportGeo, ROOFTOP_MATERIAL);
    support.position.set(xOff, 0.075, 0);
    group.add(support);
  }

  return group;
}

function createBillboard(): THREE.Group {
  const group = new THREE.Group();

  // Postes
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6);
  const leftPole = new THREE.Mesh(poleGeo, ROOFTOP_MATERIAL);
  leftPole.position.set(-0.35, 0.5, 0);
  group.add(leftPole);

  const rightPole = new THREE.Mesh(poleGeo, ROOFTOP_MATERIAL);
  rightPole.position.set(0.35, 0.5, 0);
  group.add(rightPole);

  // Placa
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.04),
    WHITE_MATERIAL,
  );
  board.position.set(0, 1.1, 0);
  group.add(board);

  // Moldura da placa
  const frameGeo = new THREE.BoxGeometry(0.95, 0.55, 0.02);
  const frame = new THREE.Mesh(frameGeo, ROOFTOP_MATERIAL);
  frame.position.set(0, 1.1, -0.025);
  group.add(frame);

  return group;
}

function createSatelliteDish(): THREE.Group {
  const group = new THREE.Group();

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.08, 8),
    ROOFTOP_MATERIAL,
  );
  base.position.y = 0.04;
  group.add(base);

  // Haste
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6),
    ROOFTOP_MATERIAL,
  );
  arm.position.set(0, 0.22, 0);
  arm.rotation.z = 0.3;
  group.add(arm);

  // Prato (meia esfera achatada)
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.5),
    DISH_MATERIAL,
  );
  dish.position.set(0.08, 0.38, 0);
  dish.rotation.x = -0.6;
  dish.rotation.z = 0.3;
  group.add(dish);

  // Receptor (pequeno cilindro apontando para o centro do prato)
  const receiver = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4),
    ROOFTOP_MATERIAL,
  );
  receiver.position.set(0.08, 0.5, 0.12);
  receiver.rotation.x = 0.5;
  group.add(receiver);

  return group;
}

function createSpotlights(): THREE.Group {
  const group = new THREE.Group();

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
      new THREE.CylinderGeometry(0.06, 0.08, 0.05, 8),
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    base.position.y = 0.025;
    spot.add(base);

    // Corpo do holofote (cilindro cônico apontando para cima)
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.07, 0.12, 8),
      SPOTLIGHT_HOUSING_MATERIAL,
    );
    housing.position.y = 0.11;
    spot.add(housing);

    // Lente emissiva no topo do holofote
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 12),
      SPOTLIGHT_LENS_MATERIAL,
    );
    lens.rotation.x = -Math.PI / 2;
    lens.position.y = 0.17;
    spot.add(lens);

    // Feixe de luz com fade gradual (opaco na fonte, transparente no topo)
    const beamGeo = createBeamGeometry(0.22, 2.0, 16);
    const beam = new THREE.Mesh(beamGeo, SPOTLIGHT_BEAM_MATERIAL);
    beam.rotation.x = Math.PI;
    beam.position.y = 1.17;
    spot.add(beam);

    spot.position.set(cx, 0, cz);
    group.add(spot);
  }

  return group;
}

const FACTORIES: Record<Exclude<RooftopType, "none">, () => THREE.Group> = {
  "antenna": createAntenna,
  "water-tank": createWaterTank,
  "helipad": createHelipad,
  "solar-panels": createSolarPanels,
  "billboard": createBillboard,
  "satellite-dish": createSatelliteDish,
  "spotlights": createSpotlights,
};

/**
 * Cria um Group Three.js para a estrutura de topo do edifício.
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

/** Descarta geometrias de um grupo de rooftop. Materiais são compartilhados e não devem ser descartados aqui. */
export function disposeRooftopMesh(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
    }
  });
}

/** Descarta todos os materiais compartilhados. Chamar apenas no dispose final do manager. */
export function disposeRooftopMaterials(): void {
  ROOFTOP_MATERIAL.dispose();
  RED_LIGHT_MATERIAL.dispose();
  PANEL_MATERIAL.dispose();
  PANEL_FRAME_MATERIAL.dispose();
  WHITE_MATERIAL.dispose();
  DISH_MATERIAL.dispose();
  SPOTLIGHT_HOUSING_MATERIAL.dispose();
  SPOTLIGHT_LENS_MATERIAL.dispose();
  SPOTLIGHT_BEAM_MATERIAL.dispose();
}

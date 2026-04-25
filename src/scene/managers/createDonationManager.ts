import * as THREE from "three";
import type {
  BlockLayoutSettings,
  BuildingCustomization,
  BuildingSettings,
  DonationEntry,
  RooftopType,
  TextureSettings,
} from "../types";
import {
  createRooftopMesh,
  disposeRooftopMesh,
  disposeRooftopSharedResources,
  setRooftopMeshShadowEnabled,
} from "../builders/createRooftopMesh";
import {
  createSignMesh,
  disposeSignMesh,
  setSignMeshShadowEnabled,
} from "../builders/createSignMesh";
import { seeded } from "../utils/random";

import colorTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Color.png";
import normalTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_NormalGL.png";
import roughnessTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Roughness.png";
import metalnessTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Metalness.png";
import displacementTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Displacement.png";
import emissiveTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Color.png";
import concreteColorSrc from "../../assets/texture/Concrete024_1K-JPG/Concrete024_1K-JPG_Color.jpg";
import concreteNormalSrc from "../../assets/texture/Concrete024_1K-JPG/Concrete024_1K-JPG_NormalGL.jpg";
import concreteRoughnessSrc from "../../assets/texture/Concrete024_1K-JPG/Concrete024_1K-JPG_Roughness.jpg";
import concreteDisplacementSrc from "../../assets/texture/Concrete024_1K-JPG/Concrete024_1K-JPG_Displacement.jpg";

// Configuração de layout do visualizador de doações
export const DONATION_LAYOUT = {
  maxSceneHeight: 16,     // Altura máxima visual na cena
  minBuildingHeight: 0.5, // Mínimo visual para qualquer doação
  buildingWidth: 2.0,
  buildingDepth: 2.0,
  slotSize: 3.2,          // Distância entre centros de cada prédio
} as const;

// Precomputa posições em espiral quadrada a partir do centro.
// Índice 0 = centro (doação mais alta), depois cresce em anéis.
// Cada anel adiciona 8*(ring) posições a distância crescente do centro.
function generateSpiralPositions(count: number): ReadonlyArray<[number, number]> {
  const positions: Array<[number, number]> = [[0, 0]];
  let ring = 1;
  while (positions.length < count) {
    for (let x = -ring; x < ring && positions.length < count; x++) {
      positions.push([x, -ring]);
    }
    for (let z = -ring; z < ring && positions.length < count; z++) {
      positions.push([ring, z]);
    }
    for (let x = ring; x > -ring && positions.length < count; x--) {
      positions.push([x, ring]);
    }
    for (let z = ring; z > -ring && positions.length < count; z--) {
      positions.push([-ring, z]);
    }
    ring++;
  }
  return positions;
}

let spiralPositions = generateSpiralPositions(512);

// Retorna os offsets de slot dentro de um bloco, ordenados do centro para fora.
// O índice 0 é sempre o slot mais próximo do centro do bloco (para o prédio mais alto).
function getBlockSlotOffsets(blockSize: number): ReadonlyArray<[number, number]> {
  const offsets: Array<[number, number]> = [];
  const half = (blockSize - 1) / 2;
  for (let row = 0; row < blockSize; row++) {
    for (let col = 0; col < blockSize; col++) {
      offsets.push([
        (col - half) * DONATION_LAYOUT.slotSize,
        (row - half) * DONATION_LAYOUT.slotSize,
      ]);
    }
  }
  offsets.sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2));
  return offsets;
}

// Fisher-Yates determinístico usando seeded random com blockIndex como semente.
function shuffleBlockSlots(
  slots: ReadonlyArray<[number, number]>,
  blockIndex: number,
): Array<[number, number]> {
  const result: Array<[number, number]> = slots.map((s) => [s[0], s[1]]);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(blockIndex, i) * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

type DonationManagerOptions = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  blockLayoutSettings: BlockLayoutSettings;
};

export type DonationManager = {
  addDonation: (value: number) => void;
  addDonations: (values: number[]) => void;
  updateBuildingSettings: (settings: BuildingSettings) => void;
  updateTextureSettings: (settings: TextureSettings) => void;
  updateBlockLayout: (settings: BlockLayoutSettings) => void;
  setShadowEnabled: (enabled: boolean) => void;
  setEnvMap: (envMap: THREE.Texture | null) => void;
  beginEnvCapture: () => void;
  endEnvCapture: () => void;
  getDonationCount: () => number;
  getHoveredValue: (event: MouseEvent, camera: THREE.Camera, domElement: HTMLElement) => number | null;
  getClickedDonationId: (event: MouseEvent, camera: THREE.Camera, domElement: HTMLElement) => number | null;
  getDonationWorldPosition: (donationId: number) => THREE.Vector3 | null;
  setFocusedDonation: (donationId: number | null) => void;
  updateDonationCustomization: (donationId: number, customization: BuildingCustomization) => void;
  dispose: () => void;
};

function loadTexture(src: string): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function loadDataTexture(src: string): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(src);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createDonationManager({
  scene,
  renderer,
  buildingSettings,
  textureSettings,
  blockLayoutSettings,
}: DonationManagerOptions): DonationManager {
  const colorMap = loadTexture(colorTextureSrc);
  const normalMap = loadDataTexture(normalTextureSrc);
  const roughnessMap = loadDataTexture(roughnessTextureSrc);
  const metalnessMap = loadDataTexture(metalnessTextureSrc);
  const displacementMap = loadDataTexture(displacementTextureSrc);
  const emissiveMap = loadTexture(emissiveTextureSrc);

  const concreteColorMap = loadTexture(concreteColorSrc);
  const concreteNormalMap = loadDataTexture(concreteNormalSrc);
  const concreteRoughnessMap = loadDataTexture(concreteRoughnessSrc);
  const concreteDisplacementMap = loadDataTexture(concreteDisplacementSrc);

  const allTextures = [
    colorMap, normalMap, roughnessMap, metalnessMap, displacementMap, emissiveMap,
    concreteColorMap, concreteNormalMap, concreteRoughnessMap, concreteDisplacementMap,
  ];

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  for (const tex of allTextures) {
    tex.anisotropy = maxAniso;
  }

  const tilingUniform = { value: textureSettings.tilingScale };
  const topTilingUniform = { value: textureSettings.top.tilingScale };

  // Geometria 1×1×1 — escala via instanceMatrix
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  for (const group of buildingGeometry.groups) {
    group.materialIndex = group.materialIndex === 2 ? 1 : 0;
  }

  // Shader triplanar: aplica textura usando coordenadas de mundo, não UV locais.
  // Necessário para instanced mesh onde cada prédio tem escala/posição diferente.
  const applyTriplanarShader = (
    material: THREE.MeshPhysicalMaterial,
    cacheKey: string,
    tiling: { value: number },
  ) => {
    material.customProgramCacheKey = () => cacheKey;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTiling = tiling;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        uniform float uTiling;
        varying vec3 vTriplanarWorldPos;
        varying vec3 vTriplanarObjNormal;`,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>
        #ifdef USE_INSTANCING
          vec4 triWp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #else
          vec4 triWp = modelMatrix * vec4(transformed, 1.0);
        #endif
        vTriplanarWorldPos = triWp.xyz;
        vTriplanarObjNormal = objectNormal;
        vec3 triAbsN = abs(objectNormal);
        vec2 triUV;
        if (triAbsN.y >= triAbsN.x && triAbsN.y >= triAbsN.z) {
          triUV = triWp.xz;
        } else if (triAbsN.x >= triAbsN.z) {
          triUV = triWp.zy;
        } else {
          triUV = triWp.xy;
        }
        triUV *= uTiling;
        #ifdef USE_MAP
          vMapUv = triUV;
        #endif
        #ifdef USE_NORMALMAP
          vNormalMapUv = triUV;
        #endif
        #ifdef USE_ROUGHNESSMAP
          vRoughnessMapUv = triUV;
        #endif
        #ifdef USE_METALNESSMAP
          vMetalnessMapUv = triUV;
        #endif
        #ifdef USE_BUMPMAP
          vBumpMapUv = triUV;
        #endif
        #ifdef USE_DISPLACEMENTMAP
          vDisplacementMapUv = triUV;
        #endif
        #ifdef USE_EMISSIVEMAP
          vEmissiveMapUv = triUV;
        #endif`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
        varying vec3 vTriplanarWorldPos;
        varying vec3 vTriplanarObjNormal;`,
      );
    };
  };

  const facadeMaterial = new THREE.MeshPhysicalMaterial({
    color: buildingSettings.color,
    roughness: buildingSettings.roughness,
    metalness: buildingSettings.metalness,
    bumpMap: displacementMap,
    displacementMap: displacementMap,
    displacementScale: 0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.8,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  applyTriplanarShader(facadeMaterial, "donation-facade-triplanar", tilingUniform);

  const topMaterial = new THREE.MeshPhysicalMaterial({
    color: buildingSettings.color,
    roughness: buildingSettings.roughness,
    metalness: buildingSettings.metalness,
    bumpMap: concreteDisplacementMap,
    displacementMap: concreteDisplacementMap,
    displacementScale: 0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.8,
  });
  applyTriplanarShader(topMaterial, "donation-top-triplanar", topTilingUniform);

  // Materiais clonados para o edifício em destaque (opacidade total, independente do instanced)
  const focusFacadeMaterial = facadeMaterial.clone();
  const focusTopMaterial = topMaterial.clone();
  applyTriplanarShader(focusFacadeMaterial, "focus-facade-triplanar", tilingUniform);
  applyTriplanarShader(focusTopMaterial, "focus-top-triplanar", topTilingUniform);

  let capacity = 512;
  let mesh = new THREE.InstancedMesh(
    buildingGeometry,
    [facadeMaterial, topMaterial],
    capacity,
  );
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  let shadowEnabled = true;

  // --- Rede de estradas (asfalto entre blocos) ---
  const asphaltMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x18191c),
    roughness: 0.92,
    metalness: 0.01,
  });

  // Shader de linhas pontilhadas centrais (divisória de pistas)
  const dashVS = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const dashFS = /* glsl */`
    varying vec2 vUv;
    uniform float dashRepeat; // ciclos de tracejado ao longo da via
    uniform float dashAlong;  // 1.0 = traceja em UV.y (longitudinal), 0.0 = UV.x (transversal)

    void main() {
      float dashCoord  = mix(vUv.x, vUv.y, dashAlong);
      float stripCoord = mix(vUv.y, vUv.x, dashAlong);

      // Faixa central estreita (10% da largura da pista)
      if (abs(stripCoord - 0.5) > 0.01) discard;

      // Padrão de tracejado: 15% cheio, 85% vazio
      if (fract(dashCoord * dashRepeat) > 0.15) discard;

      gl_FragColor = vec4(0.92, 0.88, 0.55, 0.7); // amarelo-creme
    }
  `;

  const roadMeshes: THREE.Mesh[] = [];
  let lastRoadR = -1;
  let lastRoadBlockSpacing = 0;
  let lastRoadStreetWidth = 0;

  const rebuildRoads = (r: number, blockSpacing: number, streetWidth: number) => {
    if (
      r === lastRoadR &&
      blockSpacing === lastRoadBlockSpacing &&
      streetWidth === lastRoadStreetWidth
    ) return;
    lastRoadR = r;
    lastRoadBlockSpacing = blockSpacing;
    lastRoadStreetWidth = streetWidth;

    for (const m of roadMeshes) {
      scene.remove(m);
      m.geometry.dispose();
      if (m.material !== asphaltMaterial) (m.material as THREE.Material).dispose();
    }
    roadMeshes.length = 0;

    if (r === 0) return; // bloco único, sem estradas entre blocos

    // Largura da pista: streetWidth menos o avanço máximo dos prédios de borda.
    // Prédio de borda tem centro em streetWidth/2 da pista e largura de até 2.6u,
    // portanto retiramos 3.0u de cada lado do total => roadWidth = streetWidth - 3.0.
    const roadWidth = Math.max(1.0, streetWidth - 3.0);

    // Comprimento: da primeira à última interseção transversal, com um pequeno stub
    // de streetWidth em cada ponta para indicar que a via pode continuar.
    // (2r-1)*blockSpacing cobre de (-r+0.5) até (r-0.5) entre blocos; +2*streetWidth = stubs.
    const totalLen = (2 * r - 1) * blockSpacing + 2 * streetWidth;
    const roadY = -0.015;
    const dashY = roadY + 0.005;
    const dashSpacing = 1.0; // espaçamento físico (unidades) de cada ciclo traço+vão

    const addRoad = (w: number, h: number, x: number, z: number, dashAlong: number) => {
      // Plano de asfalto
      const geo = new THREE.PlaneGeometry(w, h);
      const m = new THREE.Mesh(geo, asphaltMaterial);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, roadY, z);
      m.receiveShadow = shadowEnabled;
      scene.add(m);
      roadMeshes.push(m);

      // Plano de tracejado central
      const roadLen = dashAlong === 1.0 ? h : w;
      const dashGeo = new THREE.PlaneGeometry(w, h);
      const dashMat = new THREE.ShaderMaterial({
        vertexShader: dashVS,
        fragmentShader: dashFS,
        uniforms: {
          dashRepeat: { value: roadLen / dashSpacing },
          dashAlong:  { value: dashAlong },
        },
        transparent: true,
        depthWrite: false,
      });
      const dashMesh = new THREE.Mesh(dashGeo, dashMat);
      dashMesh.rotation.x = -Math.PI / 2;
      dashMesh.position.set(x, dashY, z);
      scene.add(dashMesh);
      roadMeshes.push(dashMesh);
    };

    // Faixas longitudinais (direção Z), entre colunas de blocos (separação em X)
    for (let bx = -r; bx < r; bx++) {
      addRoad(roadWidth, totalLen, (bx + 0.5) * blockSpacing, 0, 1.0);
    }

    // Faixas transversais (direção X), entre linhas de blocos (separação em Z)
    for (let bz = -r; bz < r; bz++) {
      addRoad(totalLen, roadWidth, 0, (bz + 0.5) * blockSpacing, 0.0);
    }
  };

  const donations: DonationEntry[] = [];
  let nextId = 0;
  let currentTextureSettings = { ...textureSettings };
  let currentBlockLayout = { ...blockLayoutSettings };
  const dummy = new THREE.Object3D();
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  const instanceToValue: number[] = [];
  const instanceToDonationId: number[] = [];
  const donationIdToInstanceIndex = new Map<number, number>();
  const currentBuildingColor = new THREE.Color(buildingSettings.color);
  const tmpTransformMatrix = new THREE.Matrix4();
  const tmpTransformPosition = new THREE.Vector3();
  const tmpTransformQuaternion = new THREE.Quaternion();
  const tmpTransformScale = new THREE.Vector3();

  const setInstanceMetadata = (
    instanceIndex: number,
    donationId: number,
    value: number,
  ) => {
    instanceToValue[instanceIndex] = value;
    instanceToDonationId[instanceIndex] = donationId;
    donationIdToInstanceIndex.set(donationId, instanceIndex);
  };

  const readDonationTransform = (donationId: number) => {
    const instanceIndex = donationIdToInstanceIndex.get(donationId);
    if (instanceIndex === undefined) return false;
    mesh.getMatrixAt(instanceIndex, tmpTransformMatrix);
    tmpTransformMatrix.decompose(
      tmpTransformPosition,
      tmpTransformQuaternion,
      tmpTransformScale,
    );
    return true;
  };

  const applyTextureToFacade = (settings: TextureSettings) => {
    const targets = [facadeMaterial, focusFacadeMaterial];
    for (const mat of targets) {
      if (settings.enabled) {
        mat.map = colorMap;
        mat.normalMap = normalMap;
        mat.normalScale.set(settings.normalScale, settings.normalScale);
        mat.roughnessMap = roughnessMap;
        mat.metalnessMap = metalnessMap;
        mat.roughness = settings.roughnessIntensity;
        mat.metalness = settings.metalnessIntensity;
        mat.bumpMap = displacementMap;
        mat.displacementMap = displacementMap;
        mat.displacementScale = settings.displacementScale;
        mat.emissiveMap = emissiveMap;
      } else {
        mat.map = null;
        mat.normalMap = null;
        mat.roughnessMap = null;
        mat.metalnessMap = null;
        mat.bumpMap = displacementMap;
        mat.displacementMap = displacementMap;
        mat.displacementScale = 0;
        mat.emissiveMap = null;
      }
      mat.emissiveIntensity = settings.emissiveIntensity;
      mat.envMapIntensity = settings.envMapIntensity;
      mat.needsUpdate = true;
    }
  };

  const applyTextureToTop = (settings: TextureSettings) => {
    const top = settings.top;
    const targets = [topMaterial, focusTopMaterial];
    for (const mat of targets) {
      if (settings.enabled) {
        mat.map = concreteColorMap;
        mat.normalMap = concreteNormalMap;
        mat.normalScale.set(top.normalScale, top.normalScale);
        mat.roughnessMap = concreteRoughnessMap;
        mat.roughness = top.roughnessIntensity;
        mat.metalness = top.metalnessIntensity;
        mat.bumpMap = concreteDisplacementMap;
        mat.displacementMap = concreteDisplacementMap;
        mat.displacementScale = top.displacementScale;
      } else {
        mat.map = null;
        mat.normalMap = null;
        mat.roughnessMap = null;
        mat.bumpMap = concreteDisplacementMap;
        mat.displacementMap = concreteDisplacementMap;
        mat.displacementScale = 0;
      }
      mat.envMapIntensity = top.envMapIntensity;
      mat.needsUpdate = true;
    }
  };

  applyTextureToFacade(textureSettings);
  applyTextureToTop(textureSettings);

  // Expande o InstancedMesh e as posições de espiral quando o total excede a capacidade atual.
  const growIfNeeded = (needed: number) => {
    if (needed <= capacity) return;
    while (capacity < needed) capacity = Math.ceil(capacity * 1.5);
    if (spiralPositions.length < capacity) {
      spiralPositions = generateSpiralPositions(capacity);
    }
    scene.remove(mesh);
    mesh.dispose();
    mesh = new THREE.InstancedMesh(buildingGeometry, [facadeMaterial, topMaterial], capacity);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = shadowEnabled;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };

  // Sistema de 2 camadas: torres + base urbana.
  //
  // Torres (top towerRatio%) usam o range completo de altura e ocupam os N slots
  // mais centrais de cada quadra (towersPerBlock por quadra), em espiral.
  //
  // Base urbana (restante) usa teto de altura reduzido (baseHeightCap × maxSceneHeight)
  // e é embaralhada deterministicamente nos slots restantes de todas as quadras.
  const rebuildInstances = () => {
    if (donations.length === 0) {
      mesh.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      instanceToValue.length = 0;
      instanceToDonationId.length = 0;
      donationIdToInstanceIndex.clear();
      return;
    }

    const { blockSize, streetWidth, towerRatio, towersPerBlock, baseHeightCap } = currentBlockLayout;
    const tpb = Math.max(1, Math.min(towersPerBlock, blockSize * blockSize));
    const buildingsPerBlock = blockSize * blockSize;
    const blockFootprint = (blockSize - 1) * DONATION_LAYOUT.slotSize;
    const blockSpacing = blockFootprint + streetWidth;
    const slotOffsets = getBlockSlotOffsets(blockSize);

    const maxValue = donations[0].value;
    const towerCount = Math.max(1, Math.round(donations.length * towerRatio));
    const baseMaxHeight = DONATION_LAYOUT.maxSceneHeight * baseHeightCap;

    // Mínimo de quadras necessárias para acomodar torres e base
    const towerBlockCount = Math.ceil(towerCount / tpb);
    const baseSlotsPerBlock = buildingsPerBlock - tpb;
    const baseCount = donations.length - towerCount;
    const baseBlocksNeeded = baseSlotsPerBlock > 0 ? Math.ceil(baseCount / baseSlotsPerBlock) : 0;
    const totalBlocksMin = Math.max(towerBlockCount, baseBlocksNeeded);

    // Expandir para o próximo anel completo: (2R+1)² garante formato quadrado.
    // Sem isso, blocos parcialmente preenchidos no anel externo criam assimetria visual.
    let r = 0;
    while ((2 * r + 1) ** 2 < totalBlocksMin) r++;
    const expandedBlocks = (2 * r + 1) ** 2;
    const innerBlocks = r === 0 ? 0 : (2 * (r - 1) + 1) ** 2;
    const outerRingSize = expandedBlocks - innerBlocks; // 8R posições no anel externo

    // Garantir que spiralPositions cobre todos os blocos expandidos
    if (spiralPositions.length < expandedBlocks) {
      spiralPositions = generateSpiralPositions(expandedBlocks + 64);
    }

    // Ordenar posições do anel externo por distância Manhattan decrescente da origem.
    // Cantos têm |bx|+|bz| = 2R, meios das arestas têm |bx|+|bz| = R.
    // Assim, ao preencher parcialmente o anel, os cantos ficam preenchidos primeiro,
    // evitando o padrão [8,8,8]/[8,8,0] onde um canto fica vazio.
    // Cantos têm |bx|+|bz| = 2R (maior Manhattan), meios das arestas têm |bx|+|bz| = R.
    // Ordem decrescente → cantos preenchidos primeiro ao preencher o anel parcialmente.
    const outerRingOrder = Array.from({ length: outerRingSize }, (_, i) => innerBlocks + i).sort(
      (a, b) => {
        const [ax, az] = spiralPositions[a];
        const [bx, bz] = spiralPositions[b];
        return (Math.abs(bx) + Math.abs(bz)) - (Math.abs(ax) + Math.abs(az));
      },
    ).reverse();

    const blocks: Array<{ towers: number[]; base: number[] }> = Array.from(
      { length: expandedBlocks },
      () => ({ towers: [], base: [] }),
    );

    // Distribuir torres: tpb por quadra; anel interno em ordem espiral, externo por outerRingOrder
    for (let t = 0; t < towerCount; t++) {
      const linearBlock = Math.floor(t / tpb);
      const b = linearBlock < innerBlocks
        ? linearBlock
        : outerRingOrder[linearBlock - innerBlocks];
      if (b !== undefined) blocks[b].towers.push(t);
    }

    // Shuffle determinístico da base (Fisher-Yates com seeded random)
    const baseIndices: number[] = [];
    for (let i = towerCount; i < donations.length; i++) baseIndices.push(i);
    for (let i = baseIndices.length - 1; i > 0; i--) {
      const j = Math.floor(seeded(i, baseIndices.length, 42) * (i + 1));
      const tmp = baseIndices[i]; baseIndices[i] = baseIndices[j]; baseIndices[j] = tmp;
    }

    // Etapa A: preencher anel interno até a capacidade normal
    let basePtr = 0;
    for (let b = 0; b < innerBlocks && basePtr < baseIndices.length; b++) {
      const slotsAvailable = buildingsPerBlock - blocks[b].towers.length;
      for (let s = 0; s < slotsAvailable && basePtr < baseIndices.length; s++) {
        blocks[b].base.push(baseIndices[basePtr++]);
      }
    }

    // Etapa B: distribuir base restante uniformemente pelo anel externo.
    // Cada posição do anel recebe floor(remaining/outerRingSize) prédios,
    // com o restante (remainder) distribuído às primeiras posições (+1 cada).
    const baseForOuter = baseIndices.length - basePtr;
    if (outerRingSize > 0 && baseForOuter > 0) {
      const perBlock = Math.floor(baseForOuter / outerRingSize);
      const remainder = baseForOuter % outerRingSize;
      for (let i = 0; i < outerRingOrder.length && basePtr < baseIndices.length; i++) {
        const b = outerRingOrder[i];
        const count = perBlock + (i < remainder ? 1 : 0);
        for (let s = 0; s < count && basePtr < baseIndices.length; s++) {
          blocks[b].base.push(baseIndices[basePtr++]);
        }
      }
    }

    // --- Posicionar instâncias ---
    instanceToValue.length = 0;
    instanceToDonationId.length = 0;
    donationIdToInstanceIndex.clear();
    let instanceIdx = 0;
    const maxBaseValue = donations[towerCount]?.value ?? maxValue;

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const [bx, bz] = spiralPositions[b];
      const blockCenterX = bx * blockSpacing;
      const blockCenterZ = bz * blockSpacing;

      const isComplete = block.towers.length + block.base.length === buildingsPerBlock;

      // Bloco completo: slots aleatórios (embaralhados).
      // Bloco incompleto: torres no slot mais próximo ao centro da cena para evitar
      // prédios isolados flutuando longe dos vizinhos.
      let towerSlots: Array<[number, number]>;
      let shuffledBaseSlots: Array<[number, number]>;

      if (isComplete) {
        const allSlots = shuffleBlockSlots(slotOffsets, b);
        towerSlots = allSlots.slice(0, block.towers.length);
        shuffledBaseSlots = allSlots.slice(block.towers.length);
      } else {
        const slotsByOriginDist = [...slotOffsets].sort(
          (a, bSlot) =>
            (blockCenterX + a[0]) ** 2 + (blockCenterZ + a[1]) ** 2 -
            ((blockCenterX + bSlot[0]) ** 2 + (blockCenterZ + bSlot[1]) ** 2),
        );
        towerSlots = slotsByOriginDist.slice(0, block.towers.length);
        shuffledBaseSlots = slotsByOriginDist.slice(block.towers.length);
      }

      // Torres nos slots mais próximos da origem da cena
      for (let t = 0; t < block.towers.length; t++) {
        const donIdx = block.towers[t];
        const [ox, oz] = towerSlots[t];
        const height =
          DONATION_LAYOUT.minBuildingHeight +
          (donations[donIdx].value / maxValue) *
            (DONATION_LAYOUT.maxSceneHeight - DONATION_LAYOUT.minBuildingHeight);
        const id = donations[donIdx].id;
        dummy.position.set(blockCenterX + ox, height / 2, blockCenterZ + oz);
        dummy.scale.set(1.0 + seeded(id, 1) * 1.6, height, 1.0 + seeded(id, 2) * 1.6);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceIdx, dummy.matrix);
        setInstanceMetadata(instanceIdx, id, donations[donIdx].value);
        instanceIdx++;
      }

      // Base urbana nos slots restantes
      for (let s = 0; s < block.base.length; s++) {
        const donIdx = block.base[s];
        const [ox, oz] = shuffledBaseSlots[s];
        const ratio = maxBaseValue > 0 ? donations[donIdx].value / maxBaseValue : 0;
        const height =
          DONATION_LAYOUT.minBuildingHeight +
          Math.min(ratio, 1) * (baseMaxHeight - DONATION_LAYOUT.minBuildingHeight);
        const id = donations[donIdx].id;
        dummy.position.set(blockCenterX + ox, height / 2, blockCenterZ + oz);
        dummy.scale.set(1.0 + seeded(id, 1) * 1.6, height, 1.0 + seeded(id, 2) * 1.6);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceIdx, dummy.matrix);
        setInstanceMetadata(instanceIdx, id, donations[donIdx].value);
        instanceIdx++;
      }
    }

    mesh.count = instanceIdx;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = null; // força recomputação na próxima chamada de raycast

    // Aplicar cores individuais (customização) por instância
    applyInstanceColors();

    // Reposicionar holofotes e letreiros
    syncRooftops();
    syncSigns();

    rebuildRoads(r, blockSpacing, streetWidth);
  };

  const tmpColor = new THREE.Color();
  let focusedDonationId: number | null = null;
  let focusHighlightMesh: THREE.Mesh | null = null;

  const removeFocusHighlight = () => {
    if (focusHighlightMesh) {
      scene.remove(focusHighlightMesh);
      focusHighlightMesh = null;
    }
  };

  const applyInstanceColors = () => {
    if (mesh.count === 0) return;

    // Verificar se alguma doação tem customização
    const hasAnyCustom = donations.some((d) => d.customization);
    if (!hasAnyCustom) {
      // Sem customizações: remover instanceColor para usar cor do material
      mesh.instanceColor = null;
      return;
    }

    // Criar ou redimensionar o buffer de cores
    const colors = new Float32Array(capacity * 3);
    const donationById = new Map<number, DonationEntry>();
    for (const d of donations) donationById.set(d.id, d);

    for (let i = 0; i < mesh.count; i++) {
      const donId = instanceToDonationId[i];
      const donation = donationById.get(donId);
      if (donation?.customization) {
        tmpColor.set(donation.customization.color);
      } else {
        tmpColor.copy(currentBuildingColor);
      }
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceColor.needsUpdate = true;
  };

  // --- Holofotes de topo ---
  // Mapa: donationId → { group, type }
  const rooftopMeshes = new Map<number, { group: THREE.Group; type: RooftopType }>();

  const syncRooftops = () => {
    // Reposicionar todos os holofotes existentes com base nas posições atuais dos edifícios
    for (const [donId, entry] of rooftopMeshes) {
      if (!readDonationTransform(donId)) {
        // Edifício não está visível — esconder
        entry.group.visible = false;
        continue;
      }
      // Posicionar no topo do edifício
      entry.group.position.set(
        tmpTransformPosition.x,
        tmpTransformPosition.y + tmpTransformScale.y / 2,
        tmpTransformPosition.z,
      );
      entry.group.visible = true;
    }
  };

  const setRooftop = (donationId: number, type: RooftopType) => {
    // Remover holofotes anteriores se existirem
    const existing = rooftopMeshes.get(donationId);
    if (existing) {
      scene.remove(existing.group);
      disposeRooftopMesh(existing.group);
      rooftopMeshes.delete(donationId);
    }

    if (type === "none") return;

    const group = createRooftopMesh(type);
    if (!group) return;

    rooftopMeshes.set(donationId, { group, type });
    setRooftopMeshShadowEnabled(group, shadowEnabled);
    scene.add(group);

    // Posicionar imediatamente
    if (readDonationTransform(donationId)) {
      group.position.set(
        tmpTransformPosition.x,
        tmpTransformPosition.y + tmpTransformScale.y / 2,
        tmpTransformPosition.z,
      );
    }
  };

  // --- Letreiros (signs) ---
  // Mapa: donationId → { group, text }
  const signMeshes = new Map<number, { group: THREE.Group; text: string }>();

  const getBuildingScale = (donationId: number): THREE.Vector3 | null => {
    if (!readDonationTransform(donationId)) return null;
    return tmpTransformScale.clone();
  };

  const syncSigns = () => {
    for (const [donId, entry] of signMeshes) {
      if (!readDonationTransform(donId)) {
        entry.group.visible = false;
        continue;
      }
      entry.group.position.copy(tmpTransformPosition);
      entry.group.visible = true;
    }
  };

  const setSign = (donationId: number, text: string, sides: number) => {
    // Remover sign anterior
    const existing = signMeshes.get(donationId);
    if (existing) {
      scene.remove(existing.group);
      disposeSignMesh(existing.group);
      signMeshes.delete(donationId);
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const scale = getBuildingScale(donationId);
    if (!scale) return;

    const group = createSignMesh(trimmed, scale.x, scale.z, scale.y, sides);
    if (!group) return;

    signMeshes.set(donationId, { group, text: trimmed });
    setSignMeshShadowEnabled(group, shadowEnabled);
    scene.add(group);

    // Posicionar imediatamente no centro do edifício
    if (readDonationTransform(donationId)) {
      group.position.copy(tmpTransformPosition);
    }
  };

  return {
    addDonation(value) {
      donations.push({ id: nextId++, value });
      donations.sort((a, b) => b.value - a.value);
      growIfNeeded(donations.length);
      rebuildInstances();
    },
    addDonations(values) {
      for (const value of values) {
        donations.push({ id: nextId++, value });
      }
      // Ordena uma vez e reconstrói uma vez para todo o lote
      donations.sort((a, b) => b.value - a.value);
      growIfNeeded(donations.length);
      rebuildInstances();
    },
    updateBuildingSettings(settings) {
      currentBuildingColor.set(settings.color); // manter em sync para instanceColor fallback
      facadeMaterial.color.set(settings.color);
      topMaterial.color.set(settings.color);
      if (!currentTextureSettings.enabled) {
        facadeMaterial.roughness = settings.roughness;
        facadeMaterial.metalness = settings.metalness;
        topMaterial.roughness = settings.roughness;
        topMaterial.metalness = settings.metalness;
      }
      facadeMaterial.needsUpdate = true;
      topMaterial.needsUpdate = true;
      applyInstanceColors();
    },
    updateTextureSettings(settings) {
      currentTextureSettings = { ...settings };
      tilingUniform.value = settings.tilingScale;
      topTilingUniform.value = settings.top.tilingScale;
      applyTextureToFacade(settings);
      applyTextureToTop(settings);
    },
    updateBlockLayout(settings) {
      currentBlockLayout = { ...settings };
      rebuildInstances();
    },
    setShadowEnabled(enabled) {
      shadowEnabled = enabled;
      mesh.castShadow = enabled;
      for (const m of roadMeshes) {
        m.receiveShadow = enabled;
      }
      for (const [, entry] of rooftopMeshes) {
        setRooftopMeshShadowEnabled(entry.group, enabled);
      }
      for (const [, entry] of signMeshes) {
        setSignMeshShadowEnabled(entry.group, enabled);
      }
      if (focusHighlightMesh) {
        focusHighlightMesh.castShadow = enabled;
        focusHighlightMesh.receiveShadow = enabled;
      }
    },
    setEnvMap(envMap) {
      facadeMaterial.envMap = envMap;
      facadeMaterial.needsUpdate = true;
      focusFacadeMaterial.envMap = envMap;
      focusFacadeMaterial.needsUpdate = true;
    },
    beginEnvCapture() {
      facadeMaterial.envMapIntensity = 0;
      topMaterial.envMapIntensity = 0;
    },
    endEnvCapture() {
      facadeMaterial.envMapIntensity = currentTextureSettings.envMapIntensity;
      topMaterial.envMapIntensity = currentTextureSettings.top.envMapIntensity;
    },
    getDonationCount() {
      return donations.length;
    },
    getHoveredValue(event: MouseEvent, camera: THREE.Camera, domElement: HTMLElement) {
      const rect = domElement.getBoundingClientRect();
      mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObject(mesh);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        return instanceToValue[hits[0].instanceId] ?? null;
      }
      return null;
    },
    getClickedDonationId(event: MouseEvent, camera: THREE.Camera, domElement: HTMLElement) {
      const rect = domElement.getBoundingClientRect();
      mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObject(mesh);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        return instanceToDonationId[hits[0].instanceId] ?? null;
      }
      return null;
    },
    getDonationWorldPosition(donationId: number) {
      if (!readDonationTransform(donationId)) return null;
      const pos = tmpTransformPosition.clone();
      // Retornar o topo do prédio (pos.y é o centro, scale.y é a altura)
      pos.y += tmpTransformScale.y / 2;
      return pos;
    },
    setFocusedDonation(donationId: number | null) {
      focusedDonationId = donationId;
      removeFocusHighlight();

      if (donationId === null) {
        // Restaurar opacidade total
        facadeMaterial.transparent = false;
        facadeMaterial.opacity = 1;
        topMaterial.transparent = false;
        topMaterial.opacity = 1;
        facadeMaterial.needsUpdate = true;
        topMaterial.needsUpdate = true;
        applyInstanceColors();
        return;
      }

      // Instanced mesh fica semitransparente
      facadeMaterial.transparent = true;
      facadeMaterial.opacity = 0.15;
      topMaterial.transparent = true;
      topMaterial.opacity = 0.15;
      facadeMaterial.needsUpdate = true;
      topMaterial.needsUpdate = true;
      // Limpar instanceColor do instanced mesh para usar a opacidade uniforme
      mesh.instanceColor = null;

      // Criar mesh isolado para o edifício selecionado (opacidade total)
      if (!readDonationTransform(donationId)) return;

      // Aplicar cor customizada ao material de foco
      const donation = donations.find((d) => d.id === donationId);
      if (donation?.customization) {
        focusFacadeMaterial.color.set(donation.customization.color);
        focusTopMaterial.color.set(donation.customization.color);
      } else {
        focusFacadeMaterial.color.copy(currentBuildingColor);
        focusTopMaterial.color.copy(currentBuildingColor);
      }
      focusFacadeMaterial.needsUpdate = true;
      focusTopMaterial.needsUpdate = true;

      focusHighlightMesh = new THREE.Mesh(buildingGeometry, [focusFacadeMaterial, focusTopMaterial]);
      focusHighlightMesh.applyMatrix4(tmpTransformMatrix);
      focusHighlightMesh.castShadow = shadowEnabled;
      focusHighlightMesh.receiveShadow = shadowEnabled;
      scene.add(focusHighlightMesh);
    },
    updateDonationCustomization(donationId: number, customization: BuildingCustomization) {
      const donation = donations.find((d) => d.id === donationId);
      if (!donation) return;

      const prevRooftop = donation.customization?.rooftopType ?? "none";
      const prevSignText = donation.customization?.signText ?? "";
      const prevSignSides = donation.customization?.signSides ?? 1;
      donation.customization = customization;

      if (focusedDonationId === donationId && focusHighlightMesh) {
        // Atualizar cor do mesh de destaque em tempo real
        focusFacadeMaterial.color.set(customization.color);
        focusTopMaterial.color.set(customization.color);
        focusFacadeMaterial.needsUpdate = true;
        focusTopMaterial.needsUpdate = true;
      } else if (focusedDonationId === null) {
        applyInstanceColors();
      }

      // Atualizar holofotes se o tipo mudou
      if (customization.rooftopType !== prevRooftop) {
        setRooftop(donationId, customization.rooftopType);
      }

      // Atualizar letreiro se o texto ou número de lados mudou
      if (customization.signText !== prevSignText || customization.signSides !== prevSignSides) {
        setSign(donationId, customization.signText, customization.signSides);
      }
    },
    dispose() {
      removeFocusHighlight();
      // Limpar holofotes
      for (const [, entry] of rooftopMeshes) {
        scene.remove(entry.group);
        disposeRooftopMesh(entry.group);
      }
      rooftopMeshes.clear();
      disposeRooftopSharedResources();
      // Limpar letreiros
      for (const [, entry] of signMeshes) {
        scene.remove(entry.group);
        disposeSignMesh(entry.group);
      }
      signMeshes.clear();
      focusFacadeMaterial.dispose();
      focusTopMaterial.dispose();
      scene.remove(mesh);
      mesh.dispose();
      buildingGeometry.dispose();
      facadeMaterial.dispose();
      topMaterial.dispose();
      for (const tex of allTextures) {
        tex.dispose();
      }
      for (const m of roadMeshes) {
        scene.remove(m);
        m.geometry.dispose();
        if (m.material !== asphaltMaterial) (m.material as THREE.Material).dispose();
      }
      roadMeshes.length = 0;
      asphaltMaterial.dispose();
    },
  };
}

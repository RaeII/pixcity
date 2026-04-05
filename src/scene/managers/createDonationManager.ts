import * as THREE from "three";
import type { BlockLayoutSettings, BuildingSettings, DonationEntry, TextureSettings } from "../types";
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
  const donations: DonationEntry[] = [];
  let nextId = 0;
  let currentTextureSettings = { ...textureSettings };
  let currentBlockLayout = { ...blockLayoutSettings };
  const dummy = new THREE.Object3D();
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  const instanceToValue: number[] = [];

  const applyTextureToFacade = (settings: TextureSettings) => {
    if (settings.enabled) {
      facadeMaterial.map = colorMap;
      facadeMaterial.normalMap = normalMap;
      facadeMaterial.normalScale.set(settings.normalScale, settings.normalScale);
      facadeMaterial.roughnessMap = roughnessMap;
      facadeMaterial.metalnessMap = metalnessMap;
      facadeMaterial.roughness = settings.roughnessIntensity;
      facadeMaterial.metalness = settings.metalnessIntensity;
      facadeMaterial.bumpMap = displacementMap;
      facadeMaterial.displacementMap = displacementMap;
      facadeMaterial.displacementScale = settings.displacementScale;
      facadeMaterial.emissiveMap = emissiveMap;
    } else {
      facadeMaterial.map = null;
      facadeMaterial.normalMap = null;
      facadeMaterial.roughnessMap = null;
      facadeMaterial.metalnessMap = null;
      facadeMaterial.bumpMap = displacementMap;
      facadeMaterial.displacementMap = displacementMap;
      facadeMaterial.displacementScale = 0;
      facadeMaterial.emissiveMap = null;
    }
    facadeMaterial.emissiveIntensity = settings.emissiveIntensity;
    facadeMaterial.envMapIntensity = settings.envMapIntensity;
    facadeMaterial.needsUpdate = true;
  };

  const applyTextureToTop = (settings: TextureSettings) => {
    const top = settings.top;
    if (settings.enabled) {
      topMaterial.map = concreteColorMap;
      topMaterial.normalMap = concreteNormalMap;
      topMaterial.normalScale.set(top.normalScale, top.normalScale);
      topMaterial.roughnessMap = concreteRoughnessMap;
      topMaterial.roughness = top.roughnessIntensity;
      topMaterial.metalness = top.metalnessIntensity;
      topMaterial.bumpMap = concreteDisplacementMap;
      topMaterial.displacementMap = concreteDisplacementMap;
      topMaterial.displacementScale = top.displacementScale;
    } else {
      topMaterial.map = null;
      topMaterial.normalMap = null;
      topMaterial.roughnessMap = null;
      topMaterial.bumpMap = concreteDisplacementMap;
      topMaterial.displacementMap = concreteDisplacementMap;
      topMaterial.displacementScale = 0;
    }
    topMaterial.envMapIntensity = top.envMapIntensity;
    topMaterial.needsUpdate = true;
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
        instanceToValue[instanceIdx] = donations[donIdx].value;
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
        instanceToValue[instanceIdx] = donations[donIdx].value;
        instanceIdx++;
      }
    }

    mesh.count = instanceIdx;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.boundingSphere = null; // força recomputação na próxima chamada de raycast
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
    },
    setEnvMap(envMap) {
      facadeMaterial.envMap = envMap;
      facadeMaterial.needsUpdate = true;
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
    dispose() {
      scene.remove(mesh);
      mesh.dispose();
      buildingGeometry.dispose();
      facadeMaterial.dispose();
      topMaterial.dispose();
      for (const tex of allTextures) {
        tex.dispose();
      }
    },
  };
}

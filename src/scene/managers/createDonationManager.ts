import * as THREE from "three";
import type { BuildingSettings, DonationEntry, TextureSettings } from "../types";

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

type DonationManagerOptions = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
};

export type DonationManager = {
  addDonation: (value: number) => void;
  addDonations: (values: number[]) => void;
  updateBuildingSettings: (settings: BuildingSettings) => void;
  updateTextureSettings: (settings: TextureSettings) => void;
  setShadowEnabled: (enabled: boolean) => void;
  setEnvMap: (envMap: THREE.Texture | null) => void;
  beginEnvCapture: () => void;
  endEnvCapture: () => void;
  getDonationCount: () => number;
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
  const dummy = new THREE.Object3D();

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

  // Reconstrói todas as instâncias com base no array de doações ordenado.
  // Doação no índice 0 (maior valor) → posição central; as demais vão para
  // anéis externos em ordem decrescente de valor.
  const rebuildInstances = () => {
    if (donations.length === 0) {
      mesh.count = 0;
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    const maxValue = donations[0].value; // array ordenado descendente

    for (let i = 0; i < donations.length; i++) {
      const [slotX, slotZ] = spiralPositions[i];
      const x = slotX * DONATION_LAYOUT.slotSize;
      const z = slotZ * DONATION_LAYOUT.slotSize;
      const height =
        DONATION_LAYOUT.minBuildingHeight +
        (donations[i].value / maxValue) *
          (DONATION_LAYOUT.maxSceneHeight - DONATION_LAYOUT.minBuildingHeight);

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(DONATION_LAYOUT.buildingWidth, height, DONATION_LAYOUT.buildingDepth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = donations.length;
    mesh.instanceMatrix.needsUpdate = true;
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

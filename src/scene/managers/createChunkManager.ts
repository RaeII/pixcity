import * as THREE from "three";
import { CITY_SCENE_CONFIG } from "../config/citySceneConfig";
import type {
  BuildingSettings,
  ChunkData,
  RenderDirectionSettings,
  SceneStats,
  TextureSettings,
} from "../types";
import { clamp, getSearchRadius } from "../utils/math";
import { seeded } from "../utils/random";

import colorTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Color.png";
import normalTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_NormalGL.png";
import roughnessTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Roughness.png";
import metalnessTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Metalness.png";
import displacementTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Displacement.png";
import emissiveTextureSrc from "../../assets/texture/Facade006_1K-mirrored-PNG/Facade006_1K-PNG_Color.png";

type ChunkManagerOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  buildingSettings: BuildingSettings;
  textureSettings: TextureSettings;
  renderDirectionSettings: RenderDirectionSettings;
  onStatsChange: (stats: Pick<SceneStats, "buildings" | "chunks" | "fpsMode">) => void;
};

export type ChunkManager = {
  getChunks: () => IterableIterator<ChunkData>;
  sync: (forceRefresh?: boolean) => void;
  updateBuildingSettings: (settings: BuildingSettings) => void;
  updateTextureSettings: (settings: TextureSettings) => void;
  updateRenderDirectionSettings: (settings: RenderDirectionSettings) => void;
  setEnvMap: (envMap: THREE.Texture | null) => void;
  setCityVisible: (visible: boolean) => void;
  beginEnvCapture: () => void;
  endEnvCapture: () => void;
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

export function createChunkManager({
  scene,
  camera,
  renderer,
  buildingSettings,
  textureSettings,
  renderDirectionSettings,
  onStatsChange,
}: ChunkManagerOptions): ChunkManager {
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  const colorMap = loadTexture(colorTextureSrc);
  const normalMap = loadDataTexture(normalTextureSrc);
  const roughnessMap = loadDataTexture(roughnessTextureSrc);
  const metalnessMap = loadDataTexture(metalnessTextureSrc);
  const displacementMap = loadDataTexture(displacementTextureSrc);
  const emissiveMap = loadTexture(emissiveTextureSrc);

  const allTextures = [colorMap, normalMap, roughnessMap, metalnessMap, displacementMap, emissiveMap];

  // Filtragem anisotrópica: preserva nitidez das texturas de fachada em ângulos
  // oblíquos e à distância — crítico numa cena de cidade vista de cima/longe.
  // O valor máximo suportado pela GPU é consultado diretamente nas capabilities.
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  for (const tex of allTextures) {
    tex.anisotropy = maxAniso;
  }

  const tilingUniform = { value: textureSettings.tilingScale };

  // 1×1×1 segmentos: 12 triângulos por instância.
  // A cena instancia potencialmente milhares de prédios — subdivivisões extras
  // multiplicam diretamente o custo de vertex shader. Com displacementScale: 0
  // padrão e prédios vistos à distância, segmentos adicionais não trazem
  // ganho visual. Aumente apenas se usar displacementScale alto e de perto.
  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  const buildingMaterial = new THREE.MeshPhysicalMaterial({
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

  buildingMaterial.customProgramCacheKey = () => "building-triplanar-uv";
  buildingMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTiling = tilingUniform;

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

  let currentTextureSettings = { ...textureSettings };

  const applyTextureToMaterial = (settings: TextureSettings) => {
    if (settings.enabled) {
      buildingMaterial.map = colorMap;
      buildingMaterial.normalMap = normalMap;
      buildingMaterial.normalScale.set(settings.normalScale, settings.normalScale);
      buildingMaterial.roughnessMap = roughnessMap;
      buildingMaterial.metalnessMap = metalnessMap;
      buildingMaterial.roughness = settings.roughnessIntensity;
      buildingMaterial.metalness = settings.metalnessIntensity;
      buildingMaterial.bumpMap = displacementMap;
      buildingMaterial.displacementMap = displacementMap;
      buildingMaterial.displacementScale = settings.displacementScale;
      buildingMaterial.emissiveMap = emissiveMap;
    } else {
      buildingMaterial.map = null;
      buildingMaterial.normalMap = null;
      buildingMaterial.roughnessMap = null;
      buildingMaterial.metalnessMap = null;
      buildingMaterial.bumpMap = displacementMap;
      buildingMaterial.displacementMap = displacementMap;
      buildingMaterial.displacementScale = 0;
      buildingMaterial.emissiveMap = null;
    }
    buildingMaterial.emissiveIntensity = settings.emissiveIntensity;
    buildingMaterial.envMapIntensity = settings.envMapIntensity;
    buildingMaterial.needsUpdate = true;
  };

  applyTextureToMaterial(textureSettings);

  let cachedEnvMap: THREE.Texture | null = null;

  const chunkMap = new Map<string, ChunkData>();
  const dummy = new THREE.Object3D();
  const tempForward = new THREE.Vector3();
  const tempDirectionToChunk = new THREE.Vector3();
  let currentRenderDirectionSettings = { ...renderDirectionSettings };

  const createChunk = (chunkX: number, chunkZ: number) => {
    const key = `${chunkX}:${chunkZ}`;
    if (chunkMap.has(key)) {
      return;
    }

    const mesh = new THREE.InstancedMesh(
      buildingGeometry,
      buildingMaterial,
      CITY_SCENE_CONFIG.maxBuildingsPerChunk,
    );
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.frustumCulled = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);

    let placed = 0;
    const centers = new Float32Array(CITY_SCENE_CONFIG.maxBuildingsPerChunk * 3);
    const heights = new Float32Array(CITY_SCENE_CONFIG.maxBuildingsPerChunk);
    const scales = new Float32Array(CITY_SCENE_CONFIG.maxBuildingsPerChunk * 2);
    const startX = chunkX * CITY_SCENE_CONFIG.chunkSize;
    const startZ = chunkZ * CITY_SCENE_CONFIG.chunkSize;
    const centerX = startX + CITY_SCENE_CONFIG.chunkSize * 0.5;
    const centerZ = startZ + CITY_SCENE_CONFIG.chunkSize * 0.5;

    for (let localX = 0; localX < CITY_SCENE_CONFIG.chunkSize; localX += CITY_SCENE_CONFIG.blockSize) {
      for (let localZ = 0; localZ < CITY_SCENE_CONFIG.chunkSize; localZ += CITY_SCENE_CONFIG.blockSize) {
        if (placed >= CITY_SCENE_CONFIG.maxBuildingsPerChunk) {
          break;
        }

        const roadX =
          Math.abs((localX % (CITY_SCENE_CONFIG.blockSize * 3)) - CITY_SCENE_CONFIG.blockSize * 1.5) <
          CITY_SCENE_CONFIG.roadWidth;
        const roadZ =
          Math.abs((localZ % (CITY_SCENE_CONFIG.blockSize * 3)) - CITY_SCENE_CONFIG.blockSize * 1.5) <
          CITY_SCENE_CONFIG.roadWidth;
        if (roadX || roadZ) {
          continue;
        }

        const worldX = startX + localX - CITY_SCENE_CONFIG.chunkSize * 0.5;
        const worldZ = startZ + localZ - CITY_SCENE_CONFIG.chunkSize * 0.5;
        const densityNoise = seeded(worldX, worldZ, 1);
        if (densityNoise < 0.16) {
          continue;
        }

        const cityDistance = Math.sqrt(centerX * centerX + centerZ * centerZ) * 0.018;
        const heightNoise = seeded(worldX, worldZ, 2);
        const shapeNoise = seeded(worldX, worldZ, 3);
        const offsetX = (seeded(worldX, worldZ, 5) - 0.5) * 0.18;
        const offsetZ = (seeded(worldX, worldZ, 6) - 0.5) * 0.18;
        const skylineBias = 1.2 / (1 + cityDistance);
        const height =
          CITY_SCENE_CONFIG.minHeight +
          (0.35 + skylineBias) * (2 + heightNoise * CITY_SCENE_CONFIG.maxHeight);

        const width = 0.85 + shapeNoise * 0.9;
        const depth = 0.85 + seeded(worldX, worldZ, 7) * 0.9;
        const finalX = worldX + offsetX;
        const finalZ = worldZ + offsetZ;

        dummy.position.set(finalX, height / 2, finalZ);
        dummy.scale.set(width, height, depth);
        dummy.updateMatrix();
        mesh.setMatrixAt(placed, dummy.matrix);

        centers[placed * 3] = finalX;
        centers[placed * 3 + 1] = height / 2;
        centers[placed * 3 + 2] = finalZ;
        heights[placed] = height;
        scales[placed * 2] = width;
        scales[placed * 2 + 1] = depth;
        placed += 1;
      }
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    chunkMap.set(key, { key, mesh, count: placed, centers, heights, scales });
  };

  const removeChunk = (key: string, chunk: ChunkData) => {
    cityGroup.remove(chunk.mesh);
    chunk.mesh.dispose();
    chunkMap.delete(key);
  };

  const clear = () => {
    for (const [key, chunk] of chunkMap.entries()) {
      removeChunk(key, chunk);
    }
  };

  const removeFarChunks = (cameraChunkX: number, cameraChunkZ: number) => {
    const cleanupRadius = getSearchRadius(
      CITY_SCENE_CONFIG.chunkRadius,
      currentRenderDirectionSettings,
    );

    for (const [key, chunk] of chunkMap.entries()) {
      const [x, z] = key.split(":").map(Number);
      if (
        Math.abs(x - cameraChunkX) > cleanupRadius + 1 ||
        Math.abs(z - cameraChunkZ) > cleanupRadius + 1
      ) {
        removeChunk(key, chunk);
      }
    }
  };

  return {
    getChunks() {
      return chunkMap.values();
    },
    sync(forceRefresh = false) {
      const cameraChunkX = Math.floor(
        (camera.position.x + CITY_SCENE_CONFIG.chunkSize * 0.5) / CITY_SCENE_CONFIG.chunkSize,
      );
      const cameraChunkZ = Math.floor(
        (camera.position.z + CITY_SCENE_CONFIG.chunkSize * 0.5) / CITY_SCENE_CONFIG.chunkSize,
      );

      if (forceRefresh) {
        clear();
      }

      const searchRadius = getSearchRadius(
        CITY_SCENE_CONFIG.chunkRadius,
        currentRenderDirectionSettings,
      );

      camera.getWorldDirection(tempForward);
      tempForward.y = 0;
      if (tempForward.lengthSq() === 0) {
        tempForward.set(0, 0, -1);
      } else {
        tempForward.normalize();
      }

      for (let x = cameraChunkX - searchRadius; x <= cameraChunkX + searchRadius; x += 1) {
        for (let z = cameraChunkZ - searchRadius; z <= cameraChunkZ + searchRadius; z += 1) {
          const offsetX = x - cameraChunkX;
          const offsetZ = z - cameraChunkZ;
          const distance = Math.sqrt(offsetX * offsetX + offsetZ * offsetZ);
          if (distance > searchRadius + 0.35) {
            continue;
          }

          tempDirectionToChunk.set(offsetX, 0, offsetZ);
          if (tempDirectionToChunk.lengthSq() === 0) {
            createChunk(x, z);
            continue;
          }

          tempDirectionToChunk.normalize();
          const dot = tempForward.dot(tempDirectionToChunk);
          const sideFactor = Math.sqrt(Math.max(0, 1 - dot * dot));
          const isFront = dot >= 0.18;
          const isSide = dot > -0.08 && dot < 0.18;
          const isBack = dot <= -0.08;

          if (isFront) {
            if (distance > currentRenderDirectionSettings.forwardDistance + sideFactor * 0.5) {
              continue;
            }
            createChunk(x, z);
            continue;
          }

          if (isSide) {
            if (distance > currentRenderDirectionSettings.sideDistance) {
              continue;
            }
            createChunk(x, z);
            continue;
          }

          if (distance > currentRenderDirectionSettings.backwardDistance) {
            const key = `${x}:${z}`;
            const existingChunk = chunkMap.get(key);
            if (existingChunk) {
              removeChunk(key, existingChunk);
            }
            continue;
          }

          if (isBack) {
            createChunk(x, z);
          }
        }
      }

      removeFarChunks(cameraChunkX, cameraChunkZ);

      let totalBuildings = 0;
      chunkMap.forEach((chunk) => {
        totalBuildings += chunk.count;
      });

      onStatsChange({
        buildings: totalBuildings,
        chunks: chunkMap.size,
        fpsMode: "dynamic",
      });
    },
    updateBuildingSettings(settings) {
      buildingMaterial.color.set(settings.color);
      if (!currentTextureSettings.enabled) {
        buildingMaterial.roughness = clamp(settings.roughness, 0, 1);
        buildingMaterial.metalness = clamp(settings.metalness, 0, 1);
      }
      buildingMaterial.needsUpdate = true;
    },
    updateTextureSettings(settings) {
      currentTextureSettings = { ...settings };
      tilingUniform.value = settings.tilingScale;
      applyTextureToMaterial(settings);
    },
    updateRenderDirectionSettings(settings) {
      currentRenderDirectionSettings = { ...settings };
    },
    setEnvMap(envMap) {
      cachedEnvMap = envMap;
      buildingMaterial.envMap = envMap;
      buildingMaterial.needsUpdate = true;
    },
    setCityVisible(visible) {
      cityGroup.visible = visible;
    },
    beginEnvCapture() {
      buildingMaterial.envMap = null;
      buildingMaterial.clearcoat = 0;
      buildingMaterial.needsUpdate = true;
    },
    endEnvCapture() {
      buildingMaterial.envMap = cachedEnvMap;
      buildingMaterial.clearcoat = 1.0;
      buildingMaterial.needsUpdate = true;
    },
    dispose() {
      clear();
      scene.remove(cityGroup);
      buildingGeometry.dispose();
      buildingMaterial.dispose();
      for (const tex of allTextures) {
        tex.dispose();
      }
    },
  };
}

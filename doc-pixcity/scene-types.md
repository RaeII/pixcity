---
title: Scene Types
tags:
  - pixcity
  - typescript
  - tipos
  - contratos
aliases:
  - Tipos
  - Interfaces
  - Contratos
---

# Scene Types

Contratos TypeScript centralizados em `src/scene/types.ts`.

> [!abstract] Objetivo
> Centralizar os tipos usados entre as camadas. Evita duplicação e garante que o TypeScript proteja a comunicação entre React, hook, runtime, builders, managers e configs.

## Tipos de Configuração (Settings)

### `BlockLayoutSettings`

Configurações de layout das quadras de prédios:

```typescript
type BlockLayoutSettings = {
  blockSize: number;   // prédios por lado da quadra (ex: 3 → 3×3 = 9 slots)
  streetWidth: number; // espaço entre quadras em unidades world (ex: 6.0)
}
```

Editável em tempo real via inputs no overlay superior. Padrões em `blockLayoutConfig.ts`.

---

### `BuildingSettings`

Configurações visuais dos prédios:

```typescript
type BuildingSettings = {
  color: string;
  roughness: number;
  metalness: number;
  targetMaxHeight: number; // altura alvo do prédio mais alto
}
```

---

### `TextureSettings`

Configurações PBR das texturas de fachada:

```typescript
type TextureSettings = {
  enabled: boolean;
  normalScale: number;
  displacementScale: number;  // relevo visual via displacement map
  tilingScale: number;        // UV repeat
  roughnessIntensity: number;
  metalnessIntensity: number;
  envMapIntensity: number;    // intensidade dos reflexos
  emissiveIntensity: number;  // brilho/glow usando colorMap como emissiveMap
  clayRender: boolean;        // espelhamento nas superfícies
  top: TopTextureSettings;    // configurações específicas do topo
}
```

---

### `TopTextureSettings`

Sub-configurações de textura para o topo dos prédios:

```typescript
type TopTextureSettings = {
  normalScale: number;
  displacementScale: number;
  tilingScale: number;
  roughnessIntensity: number;
  metalnessIntensity: number;
  envMapIntensity: number;
}
```

---

### `GroundSettings`

Configurações do chão:

```typescript
type GroundSettings = {
  color: string;
  roughness: number;
  metalness: number;
  materialType: GroundMaterialType;
}
```

---

### `GroundMaterialType`

Tipos possíveis de material do chão:

```typescript
type GroundMaterialType = "standard" | "matte" | "soft-metal" | "polished"
```

| Tipo | Comportamento |
|---|---|
| `standard` | Material padrão |
| `matte` | Chão fosco (roughness alto) |
| `soft-metal` | Metal suave |
| `polished` | Chão polido (roughness baixo) |

---

### `LightSettings`

Configurações das luzes da cena:

```typescript
type LightSettings = {
  ambientColor: string;
  ambientExtraIntensity: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  directionalColor: string;
  directionalDistance: number;
  directionalElevation: number;  // ângulo esférico
  directionalAzimuth: number;    // ângulo esférico
  directionalTargetX: number;
  directionalTargetY: number;
  directionalTargetZ: number;
}
```

---

### `ShadowSettings`

Configurações de sombra:

```typescript
type ShadowSettings = {
  enabled: boolean;
  intensity: number;
  bias: number;
  normalBias: number;
  radius: number;
  blurSamples: number;
  mapSize: number;
  cameraNear: number;
  cameraFar: number;
  cameraLeft: number;
  cameraRight: number;
  cameraTop: number;
  cameraBottom: number;
  buildingCountWithShadow: number;
}
```

---

### `RenderDirectionSettings`

Limites de carregamento de chunks por direção da câmera:

```typescript
type RenderDirectionSettings = {
  forwardDistance: number;
  sideDistance: number;
  backwardDistance: number;
}
```

---

### `EnvironmentSettings`

Configurações do ambiente HDRI/skybox:

```typescript
type EnvironmentSettings = {
  offsetX: number;  // rotação horizontal do skybox
  offsetY: number;  // deslocamento vertical (UV offset do horizonte)
  offsetZ: number;  // roll diagonal
}
```

## Tipos de Métricas

### `SceneStats`

Métricas enviadas de volta para o React para exibição no painel:

```typescript
type SceneStats = {
  buildings: number;         // prédios ativos na cena
  fpsMode: string;           // modo FPS atual
  chunks: number;            // chunks carregados
  buildingsWithShadow: number;
}
```

## Tipos de Dados da Cena

### `DonationEntry`

Representa uma doação individual:

```typescript
type DonationEntry = {
  id: number;
  value: number;
}
```

---

### `ChunkData`

Representa um chunk já criado na cidade (usado no [[scene-managers|ChunkManager]]):

```typescript
type ChunkData = {
  key: string;
  mesh: THREE.InstancedMesh;
  count: number;
  centers: Float32Array;
  heights: Float32Array;
  scales: Float32Array;
}
```

---

### `CameraVisibilityState`

Estado usado para detectar se a câmera mudou o suficiente para exigir nova sincronização de chunks:

```typescript
type CameraVisibilityState = {
  x: number;
  z: number;
  forwardX: number;
  forwardZ: number;
}
```

## Tipo de Infraestrutura

### `CitySceneConfig`

Descreve a estrutura esperada para a config global da cena. Garante consistência de `citySceneConfig.ts`.

Ver campos completos em [[scene-config#citySceneConfig.ts ⭐]].

## Regra Prática

> [!tip]
> Sempre que um dado precisar viajar entre mais de uma camada, ele deve virar um tipo centralizado aqui.

Quando criar um novo tipo:
- Nova seção do painel que sincroniza com o runtime → `types.ts`
- Novo manager que precisa receber nova configuração → `types.ts`
- Novo campo na config global → `types.ts` + `citySceneConfig.ts`

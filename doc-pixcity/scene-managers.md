---
title: Scene Managers
tags:
  - pixcity
  - managers
  - threejs
  - procedural
  - doação
aliases:
  - Managers
  - DonationManager
  - ChunkManager
---

# Scene Managers

Coordenadores de partes da cena com estado interno em `src/scene/managers/`.

## Objetivo da Pasta

Managers cuidam de partes da cena que têm **estado interno** e **comportamento contínuo**. Em vez de colocar toda a lógica procedural dentro do [[scene-runtime|runtime]], o projeto separa as áreas mais complexas aqui.

## Arquivos

### `createDonationManager.ts` ⭐ (Manager Principal)

Manager principal da cena atual. Gerencia os prédios como representações visuais de doações.

**Responsabilidades:**
- Manter a lista de doações (`DonationEntry[]`) ordenada por valor decrescente
- Criar e atualizar um único `InstancedMesh` com capacidade para até 500 prédios
- Posicionar prédios em **espiral quadrada** a partir do centro
- Calcular altura proporcional ao valor máximo
- Carregar e aplicar texturas PBR (cor, normal, roughness, metalness, displacement, emissive)
- Atualizar materiais em tempo real
- Gerenciar envMap dinâmico via cube camera

#### Layout dos Prédios — Sistema de 2 Camadas

Os prédios são separados em **torres** e **base urbana**:

| Camada | Seleção | Range de altura | Posição |
|---|---|---|---|
| **Torres** | Top `towerRatio`% das doações | `minBuildingHeight` → `maxSceneHeight` (range completo) | Slot central de cada quadra, 1 torre por quadra, quadras em espiral |
| **Base urbana** | Restante das doações | `minBuildingHeight` → `baseHeightCap × maxSceneHeight` (teto reduzido) | Shuffle determinístico nos slots restantes de todas as quadras |

Essa separação cria **contraste abrupto** entre torres e vizinhos — o efeito visual de skyline de cidade real, não pirâmide.

**Geometria de uma quadra (blockSize=3):**

```
[ ▪ ][ ▪ ][ ▪ ]
[ ▪ ][ █ ][ ▪ ]   █ = torre (range completo, proporcional ao valor)
[ ▪ ][ ▪ ][ ▪ ]   ▪ = base urbana (teto reduzido, shuffle aleatório)
```

**Cálculo de espaçamento:**
```
blockFootprint = (blockSize - 1) × slotSize
blockSpacing   = blockFootprint + streetWidth
```

**Configurado por [[scene-types#BlockLayoutSettings]] (editável em tempo real):**
- `blockSize` — prédios por lado (padrão: 3 → 9 slots/quadra)
- `streetWidth` — espaço entre quadras (padrão: 6.0)
- `towerRatio` — fração de torres (padrão: 0.12 = 12%)
- `baseHeightCap` — teto da base como fração de maxSceneHeight (padrão: 0.30 = 30%)

A cada nova doação ou mudança de layout, a lista é reordenada e **todas as instâncias são reconstruídas**.

#### Fórmula de Altura

```
height = minBuildingHeight + (valor / maxValor) × (maxSceneHeight - minBuildingHeight)
```

| Constante | Valor | Descrição |
|---|---|---|
| `minBuildingHeight` | `0.5` | Mínimo visual para qualquer doação |
| `maxSceneHeight` | `16` | Cap visual; maior doação sempre alcança esse valor |

> [!tip] Para ajustar os limites
> Edite `DONATION_LAYOUT` em `createDonationManager.ts`.

#### Materiais

O manager usa um único par de materiais para prédios e um material de asfalto para as ruas:

| Material | Tipo | Descrição |
|---|---|---|
| `facadeMaterial` | `MeshPhysicalMaterial` | Textura de fachada com shader triplanar + cube envMap dinâmico |
| `topMaterial` | `MeshPhysicalMaterial` | Textura de concreto para o topo dos prédios |
| `asphaltMaterial` | `MeshStandardMaterial` | Cor escura (#18191c), roughness 0.92 — usado nas faixas de asfalto entre quadras |

#### Rede de Estradas (Asfalto)

Quando há mais de um bloco (`r > 0`), `rebuildRoads(r, blockSpacing, streetWidth)` cria faixas de `Mesh` planas que preenchem o espaço entre as quadras:

- **Faixas longitudinais** (correm na direção Z): posicionadas em `x = (bx + 0.5) × blockSpacing` para cada gap entre colunas de blocos
- **Faixas transversais** (correm na direção X): posicionadas em `z = (bz + 0.5) × blockSpacing` para cada gap entre linhas de blocos
- Largura de cada faixa = `streetWidth`; comprimento = `(2r+1) × blockSpacing + streetWidth`
- Y = -0.015 (acima do ground plane em -0.03, abaixo dos prédios em 0)
- Cache: se `r`, `blockSpacing` e `streetWidth` não mudaram, `rebuildRoads` retorna imediatamente
- As faixas são recriadas toda vez que `rebuildInstances` muda o anel `r` ou os parâmetros de layout

> [!note] Por que shader triplanar?
> Prédios dentro do mesmo `InstancedMesh` têm alturas diferentes. O shader triplanar garante que a textura de fachada seja aplicada corretamente sem distorção, independente da escala de cada instância.

#### Métodos Públicos

```typescript
addDonation(value: number): void
addDonations(values: number[]): void
getDonationCount(): number
setEnvMap(texture: THREE.Texture): void
setShadowEnabled(enabled: boolean): void
beginEnvCapture(): void  // oculta prédios durante captura do CubeCamera
endEnvCapture(): void    // reexibe prédios após captura
updateBuildingSettings(settings: BuildingSettings): void
updateTextureSettings(settings: TextureSettings): void
updateBlockLayout(settings: BlockLayoutSettings): void  // recalcula posições de todas as quadras
getHoveredValue(event, camera, domElement): number | null  // raycast hover
getClickedDonationId(event, camera, domElement): number | null  // raycast clique → donation ID
updateDonationCustomization(donationId: number, customization: BuildingCustomization): void  // aplica cor individual
dispose(): void
```

#### Cores Individuais por Edifício

Quando um edifício recebe uma customização via `updateDonationCustomization`, a cor é armazenada em `DonationEntry.customization` e aplicada via `InstancedBufferAttribute` (instanceColor). Edifícios sem customização usam a cor global do material. O sistema é reativado a cada `rebuildInstances` ou mudança de `BuildingSettings`.

---

### `createChunkManager.ts` _(referência arquitetural)_

> [!warning] Não usado pelo runtime principal
> Mantido no repositório como referência da arquitetura de cidade procedural infinita.

**Responsabilidades originais:**
- Criar `InstancedMesh` por chunk
- Gerar prédios proceduralmente com [[scene-utils#random.ts|seeded random]]
- Decidir quais chunks devem existir perto da câmera
- Remover chunks distantes
- Alternar materiais near/far por chunk com base em `envMapNearDistance`

---

### `createShadowManager.ts` _(referência arquitetural)_

> [!warning] Não usado pelo runtime principal
> Mantido no repositório como referência para seleção de candidatos de sombra.

**Responsabilidade original:** escolher os prédios mais próximos da câmera para gerar sombra, limitando o custo do shadow map.

## Quando Mexer em Managers

Mexa aqui quando o problema for **comportamental**:

| Objetivo | Onde mexer |
|---|---|
| Mudar layout dos prédios de doação | `createDonationManager.ts` → `DONATION_LAYOUT` |
| Alterar fórmula de altura proporcional | `createDonationManager.ts` |
| Aumentar limite máximo de doações | `createDonationManager.ts` → `DONATION_LAYOUT` |
| Alterar cor/material do asfalto | `createDonationManager.ts` → `asphaltMaterial` |
| Problema de valores padrão (altura máx, tamanho) | [[scene-config]] |
| Fórmula matemática pequena | [[scene-utils]] |

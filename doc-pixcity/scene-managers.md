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
| `focusFacadeMaterial` | `MeshPhysicalMaterial` | Clone do facadeMaterial para o edifício em destaque (opacidade total quando o instanced mesh fica semitransparente) |
| `focusTopMaterial` | `MeshPhysicalMaterial` | Clone do topMaterial para o edifício em destaque |
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
// Doações
addDonation(value: number): void
addDonations(values: number[]): void
getDonationCount(): number

// Configurações globais
updateBuildingSettings(settings: BuildingSettings): void
updateTextureSettings(settings: TextureSettings): void
updateBlockLayout(settings: BlockLayoutSettings): void

// EnvMap e sombras
setEnvMap(texture: THREE.Texture): void
setShadowEnabled(enabled: boolean): void
beginEnvCapture(): void   // oculta prédios durante captura do CubeCamera
endEnvCapture(): void     // reexibe prédios após captura

// Interação
getHoveredValue(event, camera, domElement): number | null       // raycast hover → valor da doação
getClickedDonationId(event, camera, domElement): number | null  // raycast clique → donation ID
getDonationWorldPosition(donationId: number): THREE.Vector3 | null  // posição do topo do edifício

// Foco e personalização
setFocusedDonation(donationId: number | null): void  // destaque visual (semitransparência + mesh isolado)
updateDonationCustomization(donationId: number, customization: BuildingCustomization): void

// Cleanup
dispose(): void
```

#### Foco em Edifício (Destaque Visual)

Quando o usuário clica em um edifício, `setFocusedDonation(donationId)` cria um destaque visual:

1. **Instanced mesh** fica semitransparente (`opacity: 0.15`) — toda a cidade some sutilmente
2. **Mesh isolado** (`focusHighlightMesh`) é criado com os materiais de foco (`focusFacadeMaterial` / `focusTopMaterial`) na posição exata do edifício, com opacidade total
3. Se o edifício tem **cor customizada**, os materiais de foco recebem essa cor
4. O `instanceColor` do instanced mesh é limpo durante o foco para usar a opacidade uniforme

Ao chamar `setFocusedDonation(null)`, a opacidade é restaurada a 1.0, o mesh isolado é removido e o `instanceColor` é reaplicado.

---

#### Cores Individuais por Edifício

Quando um edifício recebe uma customização via `updateDonationCustomization`, a cor é armazenada em `DonationEntry.customization` e aplicada via `InstancedBufferAttribute` (instanceColor). Edifícios sem customização usam a cor global do material. O sistema é reativado a cada `rebuildInstances` ou mudança de `BuildingSettings`.

#### Acessórios de Topo

Cada edifício pode ter um acessório 3D no topo, como holofotes ou heliponto, gerenciado pelo campo `rooftopType` em `BuildingCustomization`. O manager mantém um `Map<donationId, { group, type }>` com os `THREE.Group` criados por [[scene-builders#createRooftopMesh.ts|createRooftopMesh]].

- **Posicionamento:** após cada `rebuildInstances`, `syncRooftops()` reposiciona todos os grupos no topo dos edifícios correspondentes.
- **Criação/remoção:** `setRooftop(donationId, type)` remove o grupo anterior e cria um novo se `type !== "none"`.
- **Performance:** o lookup do edifício usa `donationIdToInstanceIndex` em vez de `indexOf`, e os transforms temporários são reutilizados nos syncs.
- **Sombras:** `setRooftopMeshShadowEnabled()` respeita apenas meshes sólidos; lentes emissivas e feixes transparentes não entram no shadow map.
- **Cleanup:** no `dispose()`, todos os grupos são removidos e `disposeRooftopSharedResources()` limpa geometrias e materiais compartilhados.

#### Letreiros (Signs)

Cada edifício pode ter um letreiro na fachada com o texto da marca/empresa do doador, gerenciado pelo campo `signText` em `BuildingCustomization`. O manager mantém um `Map<donationId, { group, text }>` com os `THREE.Group` criados por [[scene-builders#createSignMesh.ts|createSignMesh]].

- **Dimensionamento:** o letreiro usa as dimensões reais do edifício (`getBuildingScale`) — largura adaptada a cada fachada, altura consistente em todos os lados.
- **Lados:** `signSides` (1–4) controla em quantas fachadas o letreiro aparece. Cada mudança de texto ou de lados recria o sign completo via `setSign(donationId, text, sides)`.
- **Posicionamento:** `syncSigns()` reposiciona todos os letreiros no centro do edifício após cada `rebuildInstances`.
- **Sombras:** a placa emissiva não projeta sombra; apenas o backing metálico mantém presença física no shadow map.
- **Detecção de mudança:** `updateDonationCustomization` compara `signText` e `signSides` anteriores com os novos valores — recria só se houve mudança.
- **Cleanup:** no `dispose()`, todos os sign meshes são removidos com `disposeSignMesh()`.

#### LED de Arestas

Cada edifício pode ter um efeito de **LED nas arestas** (4 arestas verticais nos cantos + 4 arestas no topo formando retângulo), gerenciado pelos campos `edgeLightType` e `edgeLightColor` em `BuildingCustomization`. O manager mantém um `Map<donationId, { group, type, color }>` com os `THREE.Group` criados por [[scene-builders#createEdgeLightMesh.ts|createEdgeLightMesh]].

- **Posicionamento:** o grupo é colocado na **base** do edifício (`donationY − scale.y/2`); meshes internos cobrem de `y=0` (chão) até `y=height` (topo) com lift de `0.05` no topo para evitar conflito com `helipad`/`spotlights`.
- **Reconstrução em rebuild:** ao contrário de rooftop/sign, `syncEdgeLights()` **reconstrói** todos os grupos existentes a cada `rebuildInstances`. Isso é necessário porque novas doações alteram a altura dos edifícios — a geometria do LED depende de `width`, `depth` **e** `height`.
- **Mudança de cor sem rebuild:** quando apenas a cor muda (drag do color picker), `setEdgeLightColor(donationId, color)` chama `updateEdgeLightMeshColor` que mexe diretamente nos materiais clonados — sem destruir nada. Mudança de `type` (none ↔ led) sim reconstrói tudo via `setEdgeLight`.
- **Sombras:** LEDs nunca projetam nem recebem sombra (são emissivos/aditivos). `setEdgeLightMeshShadowEnabled` é chamada por consistência, mas todas as `userData` de sombra ficam `false`.
- **Cleanup:** no `dispose()`, todos os edge light meshes são removidos com `disposeEdgeLightMesh()` (libera materiais clonados) e `disposeEdgeLightSharedResources()` libera a `BoxGeometry` compartilhada do módulo.

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

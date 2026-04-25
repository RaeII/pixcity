---
title: Scene Builders
tags:
  - pixcity
  - builders
  - threejs
  - factory
aliases:
  - Builders
  - Construtores de Cena
---

# Scene Builders

Factory functions que criam partes isoladas da cena 3D em `src/scene/builders/`.

## Objetivo da Pasta

Builders criam peças específicas da cena. O [[scene-runtime|runtime]] não precisa saber todos os detalhes de criação — cada builder monta, atualiza e destrói sua peça.

**Padrão de retorno:** cada builder retorna um objeto com métodos `update`, `dispose` e métodos específicos como `setPosition`.

> [!important] Dispose obrigatório
> Todo builder deve expor `dispose()` e limpar geometria, material e recursos Three.js para evitar memory leaks.

## Arquivos

### `createGroundPlane.ts`

Cria o chão da cidade.

**Responsabilidades:**
- Criar geometria e material do chão
- Aplicar valores derivados do tipo de material via [[scene-utils#materials.ts|getGroundMaterialValues]]
- Habilitar/desabilitar recebimento de sombra
- Mover o chão junto com a câmera (no loop de animação)
- Limpar geometria e material no `dispose`

**Quando mexer aqui:**
- Trocar o tipo de `Mesh` do chão
- Mudar como o chão atualiza material
- Mudar como o chão acompanha a câmera

---

### `createGridHelper.ts`

Cria o grid visual da cena.

**Responsabilidades:**
- Criar o `GridHelper` com cores e transparência
- Reposicionar o grid conforme a câmera anda
- Limpar recursos no `dispose`

**Quando mexer aqui:**
- Trocar cor do grid dinamicamente
- Esconder ou alterar a malha visual

---

### `createLightingRig.ts`

Cria e atualiza as luzes da cena.

**Responsabilidades:**
- Criar `AmbientLight`
- Criar `HemisphereLight`
- Criar `DirectionalLight`
- Criar `DirectionalLightHelper` (visualiza a direção da luz solar na cena)
- Atualizar posição, cor e intensidade das luzes
- Atualizar o helper sempre que a luz muda
- Destruir luzes e helper no `dispose`

**Retorna:** objeto `LightingRig` com referências e método `update(lightSettings)`.

**Usa:**
- [[scene-utils#lighting.ts|getDirectionalPositionFromAngles]] — converte ângulos esféricos em posição 3D

**Quando mexer aqui:**
- Adicionar novo tipo de luz
- Alterar como a directional light recebe posição e alvo
- Ajustar tamanho ou aparência do helper visual

---

### `loadEnvironment.ts`

Carrega e configura o ambiente HDRI/skybox.

**Responsabilidades:**
- Carregar textura HDRI de `src/assets/environment/DaySkyHDRI040B_2K/`
- Criar esfera invertida como background (permite offset UV uniforme em todas as direções)
- Gerar `PMREMGenerator` para `scene.environment` (iluminação PBR dos prédios)
- Expor `updateSettings` para rotacionar/deslocar o skybox
- Expor `updatePosition` para seguir a câmera
- Limpar meshes, geometria e material no `dispose`

**Retorna:** objeto `EnvironmentUpdater` com métodos `updateSettings`, `updatePosition` e `dispose`.

> [!note] Técnica da esfera invertida
> Usar `THREE.BackSide` em uma `SphereGeometry` grande permite deslocar o horizonte via `texture.offset.y` de forma uniforme em todas as direções — ao contrário de `scene.background` com equirectangular direta.

**Quando mexer aqui:**
- Trocar o arquivo HDRI
- Alterar como o skybox responde ao offset de ambiente
- Mudar a geração do `scene.environment`

### `createRooftopMesh.ts`

Factory para os holofotes de topo dos edifícios. Chamado pelo [[scene-managers|DonationManager]] quando o usuário personaliza um edifício via [[html-components#BuildingCustomizePanel.tsx|BuildingCustomizePanel]].

**Opção disponível:**

| Tipo | Geometria | Materiais | Descrição |
|---|---|---|---|
| `spotlights` | `CylinderGeometry` × 8 + `CircleGeometry` × 4 + `ConeGeometry` × 4 | `SPOTLIGHT_HOUSING_MATERIAL` + `SPOTLIGHT_LENS_MATERIAL` + `SPOTLIGHT_BEAM_MATERIAL` | 4 holofotes nos cantos (±0.35, ±0.35) — base (0.08r) + corpo cônico (0.04–0.07r, 0.12h) + lente emissiva amarela + feixe cônico (0.22r, 2.0h) com vertex alpha gradiente (opaco na fonte, desvanece no topo via curva quadrática) |

**Materiais compartilhados (estáticos de módulo):**

| Material | Cor | Roughness | Metalness | Extra |
|---|---|---|---|---|
| `SPOTLIGHT_HOUSING_MATERIAL` | `#222222` | 0.4 | 0.6 | Corpo escuro do holofote |
| `SPOTLIGHT_LENS_MATERIAL` | `#ffffcc` | 0.1 | 0.0 | `emissive: #ffffaa`, `emissiveIntensity: 2.5` — lente amarela brilhante |
| `SPOTLIGHT_BEAM_MATERIAL` | `#ffffdd` | — | — | `emissive: #ffffaa`, `emissiveIntensity: 1.25`, `vertexColors: true`, `transparent`, `DoubleSide`, `depthWrite: false` — feixe com alpha gradiente via vertex colors (curva quadrática: fonte opaca → topo transparente) |

**API:**
```typescript
createRooftopMesh(type: RooftopType): THREE.Group | null  // null se "none"
disposeRooftopMesh(group: THREE.Group): void               // limpa geometrias (não materiais)
disposeRooftopMaterials(): void                             // limpa materiais compartilhados (só no dispose final)
```

> [!note] Sombras
> Todos os meshes dentro do grupo têm `castShadow = true` e `receiveShadow = true`, habilitados automaticamente via `group.traverse()`.

---

### `createSignMesh.ts`

Factory para letreiros de fachada nos edifícios. Renderiza texto via `CanvasTexture` em um plano fino com material emissivo (estilo LED corporativo). Chamado pelo [[scene-managers|DonationManager]] quando o usuário digita um texto no [[html-components#BuildingCustomizePanel.tsx|BuildingCustomizePanel]].

**Características visuais:**

| Elemento | Descrição |
|---|---|
| **Fundo** | Painel escuro `rgba(8,10,16,0.88)` com cantos arredondados (8px) e borda fina `rgba(255,255,255,0.08)` |
| **Texto** | Fonte `600` (semi-bold), família Inter/Segoe UI/Helvetica, cor `#e8ecf4` |
| **Glow LED** | `shadowBlur: 12`, cor `rgba(200,220,255,0.6)` — simula sinalização LED retroiluminada |
| **Material da placa** | `MeshStandardMaterial` com `emissiveIntensity: 0.4`, `roughness: 0.35`, `metalness: 0.6` |
| **Backing plate** | `BoxGeometry` metálico escuro `#1a1c22` (`roughness: 0.7`, `metalness: 0.5`) |
| **Posição Y** | `buildingH * 0.45` acima do centro = ~95% da altura do edifício (bem perto do topo) |

**Lados (parâmetro `sides` 1–4):**

| Valor | Fachadas | Rotação da normal do plano |
|---|---|---|
| 1 | Frente (+Z) | `rotY = 0` |
| 2 | +Trás (−Z) | `rotY = π` |
| 3 | +Direita (+X) | `rotY = +π/2` |
| 4 | +Esquerda (−X) | `rotY = −π/2` |

Cada lado cria seu próprio canvas, textura e material independentes. A largura do letreiro se adapta à largura da fachada correspondente (`buildingW` para frente/trás, `buildingD` para laterais). A altura é consistente em todos os lados: `max(buildingW, buildingD) * 0.22`.

> [!note] Ajuste automático de fonte
> O fontSize começa em 52% da altura do canvas e é reduzido pixel a pixel até o texto caber com 12% de padding lateral. Limite máximo: 30 caracteres (imposto pelo UI).

**API:**
```typescript
createSignMesh(text: string, buildingW: number, buildingD: number, buildingH: number, sides: number): THREE.Group | null
disposeSignMesh(group: THREE.Group): void  // limpa texturas, materiais e geometrias de todos os lados
```

---

## O que Builders NÃO Fazem

Builders não decidem:
- Quando a animação roda → [[scene-runtime]]
- Quando os chunks são sincronizados → [[scene-managers]]
- Quando a câmera disparou refresh → [[scene-runtime]]

Essas decisões ficam no runtime e nos managers.

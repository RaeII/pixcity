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

Factory para acessórios de topo dos edifícios. Chamado pelo [[scene-managers|DonationManager]] quando o usuário personaliza um edifício via [[html-components#BuildingCustomizePanel.tsx|BuildingCustomizePanel]].

**Opção disponível:**

| Tipo | Geometria | Materiais | Descrição |
|---|---|---|---|
| `spotlights` | `CylinderGeometry` × 3 + `CircleGeometry` × 1 compartilhadas pelo módulo | `SPOTLIGHT_HOUSING_MATERIAL` + `SPOTLIGHT_LENS_MATERIAL` + `SPOTLIGHT_BEAM_MATERIAL` compartilhados | 4 holofotes nos cantos (±0.35, ±0.35) — base (0.08r) + corpo cônico (0.04–0.07r, 0.12h) + lente emissiva amarela + feixe cônico (0.22r, 10.0h) com vertex alpha gradiente (opaco na fonte, desvanece no topo via curva quadrática). Não cria luzes reais por edifício. |
| `helipad` | `CylinderGeometry`, `TorusGeometry`, `RingGeometry`, `BoxGeometry` e pequenos cilindros compartilhados | Materiais de concreto escuro, aro metálico, pintura branca e lentes verdes emissivas | Heliponto proporcional ao topo do edifício, com base circular baixa, aro metálico, anel externo pintado, “H” central limpo, 12 luzes verdes de perímetro e escotilha técnica discreta. Não cria luzes reais por edifício. |

**Recursos compartilhados (estáticos de módulo):**

| Material | Cor | Roughness | Metalness | Extra |
|---|---|---|---|---|
| `SPOTLIGHT_HOUSING_MATERIAL` | `#222222` | 0.4 | 0.6 | Corpo escuro do holofote |
| `SPOTLIGHT_LENS_MATERIAL` | `#ffffcc` | 0.1 | 0.0 | `emissive: #ffffaa`, `emissiveIntensity: 2.5` — lente amarela brilhante |
| `SPOTLIGHT_BEAM_MATERIAL` | `#ffffdd` | — | — | `emissive: #ffffaa`, `emissiveIntensity: 1.25`, `vertexColors: true`, `transparent`, `DoubleSide`, `depthWrite: false` — feixe com alpha gradiente via vertex colors (curva quadrática: fonte opaca → topo transparente) |
| `HELIPAD_DECK_MATERIAL` | `#2f3436` | 0.88 | 0.04 | Base circular escura e fosca |
| `HELIPAD_RIM_MATERIAL` | `#3f4548` | 0.62 | 0.42 | Aro metálico baixo |
| `HELIPAD_PAINT_MATERIAL` | `#e8edf1` | 0.78 | 0.0 | Pintura branca dos anéis e do “H” |
| `HELIPAD_GREEN_LENS_MATERIAL` | `#bfffee` | 0.18 | 0.0 | Lentes verdes emissivas de perímetro |

As geometrias de base, corpo, lente e feixe também são compartilhadas. `disposeRooftopMesh()` apenas libera as referências do grupo; o descarte de GPU dos recursos compartilhados acontece no dispose final.

**API:**
```typescript
createRooftopMesh(type: RooftopType, footprint?: { width: number; depth: number }): THREE.Group | null  // null se "none"
setRooftopMeshShadowEnabled(group: THREE.Group, enabled: boolean): void
disposeRooftopMesh(group: THREE.Group): void               // limpa referências do grupo
disposeRooftopSharedResources(): void                       // limpa geometrias e materiais compartilhados
```

> [!note] Sombras
> Apenas as partes sólidas projetam/recebem sombra. Lentes emissivas, feixes transparentes e pinturas finas não participam do shadow map para evitar custo desnecessário e artefatos.

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

> [!note] Sombras
> A placa emissiva do letreiro não projeta sombra. Apenas o backing metálico usa `castShadow`/`receiveShadow`, controlado por `setSignMeshShadowEnabled()`.

> [!note] Ajuste automático de fonte
> O fontSize começa em 52% da altura do canvas e é reduzido pixel a pixel até o texto caber com 12% de padding lateral. Limite máximo: 30 caracteres (imposto pelo UI).

**API:**
```typescript
createSignMesh(text: string, buildingW: number, buildingD: number, buildingH: number, sides: number): THREE.Group | null
setSignMeshShadowEnabled(group: THREE.Group, enabled: boolean): void
disposeSignMesh(group: THREE.Group): void  // limpa texturas, materiais e geometrias de todos os lados
```

---

### `createEdgeLightMesh.ts`

Factory para o efeito de **LED nas arestas** do edifício — 4 arestas verticais nos cantos (chão → topo) + 4 arestas no topo formando um retângulo. Chamado pelo [[scene-managers|DonationManager]] quando o usuário escolhe a opção LED no [[html-components#BuildingCustomizePanel.tsx|BuildingCustomizePanel]].

**Estrutura por aresta (3 meshes empilhados):**

| Camada | Espessura | Material | Função visual |
|---|---|---|---|
| **Core** | 0.04 | `MeshStandardMaterial` com `emissive` e `emissiveIntensity: 4.0` | Linha sólida emissiva — o "filamento" do LED |
| **Halo** | 0.16 (4× core) | `MeshBasicMaterial`, `transparent`, `AdditiveBlending`, `opacity: 0.35`, `depthWrite: false` | Brilho próximo |
| **Halo externo** | 0.32 (8× core) | mesmo material do halo, `opacity: 0.12` | Glow difuso simulando bloom sem pós-processamento |

`depthWrite: false` evita que halos se cancelem entre si; `depthTest` permanece ativo para que o brilho seja oclusionado pelo edifício (não atravessa a fachada).

**Layout (relativo à base do edifício, local Y=0 = chão):**

| Posição | Quantidade | Eixo |
|---|---|---|
| Cantos `(±W/2, Y=0..H, ±D/2)` | 4 | Y (vertical) |
| Topo frente/trás `(0, H+0.05, ±D/2)` | 2 | X |
| Topo laterais `(±W/2, H+0.05, 0)` | 2 | Z |

O lift de `0.05` no topo evita z-fighting com `helipad` e holofotes existentes.

**Materiais clonados por edifício:** ao contrário do `createRooftopMesh`, cada `Group` cria seus próprios `core`/`halo`/`haloOuter` materials. Isso permite atualizar a cor em tempo real (drag do `<input type="color">`) via `updateEdgeLightMeshColor` **sem reconstruir geometria**. A geometria `BoxGeometry(1,1,1)` é compartilhada no módulo (via `mesh.scale`).

**Posicionamento no DonationManager:** o grupo é colocado em `(donationX, donationY − scale.y/2, donationZ)` — ou seja, na **base** do edifício, não no topo. Quando uma nova doação rebalanceia alturas, o `syncEdgeLights` reconstrói os grupos existentes (preservando type/color) com as novas dimensões.

> [!note] Sombras
> LEDs nunca projetam nem recebem sombras. `setEdgeLightMeshShadowEnabled` mantém a API consistente mas todas as `userData.edgeLightCastsShadow`/`Receives` são `false`.

> [!warning] Sem PointLight por aresta
> O efeito é puramente material/emissivo. Adicionar luzes reais por aresta seria O(N × 12) e estouraria limites de uniforms da GPU rapidamente.

**API:**
```typescript
createEdgeLightMesh(type: EdgeLightType, footprint: { width: number; depth: number; height: number }, color: string): THREE.Group | null
updateEdgeLightMeshColor(group: THREE.Group, color: string): void   // mutação direta — sem rebuild
setEdgeLightMeshShadowEnabled(group: THREE.Group, enabled: boolean): void
disposeEdgeLightMesh(group: THREE.Group): void                      // libera materiais clonados
disposeEdgeLightSharedResources(): void                             // libera BoxGeometry compartilhada
```

---

## O que Builders NÃO Fazem

Builders não decidem:
- Quando a animação roda → [[scene-runtime]]
- Quando os chunks são sincronizados → [[scene-managers]]
- Quando a câmera disparou refresh → [[scene-runtime]]

Essas decisões ficam no runtime e nos managers.

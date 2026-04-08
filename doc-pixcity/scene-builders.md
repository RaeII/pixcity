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

### `createHorizonSilhouette.ts`

Cria dois anéis de edifícios-silhueta pretos no horizonte da cena.

**Responsabilidades:**
- Construir dois `InstancedMesh` com `BoxGeometry(1,1,1)` e `MeshBasicMaterial` preto
- Distribuir prédios em anel circular com raios diferentes (100 e 145 unidades)
- Gerar alturas, larguras e lacunas determinísticas via `seeded()` por slot
- Seguir a câmera via `setPosition(x, z)` (como chão e grid)
- Limpar geometrias, materiais e meshes no `dispose`

**Efeito visual:**
- Um único anel no raio 130, prédios variando de 1.5 a 13 unidades de altura
- A névoa (`FogExp2`) funde os prédios pretos com o fundo escuro da cena, eliminando a linha visível entre chão e céu

**Retorna:** `HorizonSilhouette` com métodos `setPosition(x, z)` e `dispose`.

**Quando mexer aqui:**
- Ajustar raio, densidade ou altura máxima dos anéis (constante `RINGS`)
- Adicionar um terceiro anel para mais profundidade
- Trocar a cor da silhueta

---

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

## O que Builders NÃO Fazem

Builders não decidem:
- Quando a animação roda → [[scene-runtime]]
- Quando os chunks são sincronizados → [[scene-managers]]
- Quando a câmera disparou refresh → [[scene-runtime]]

Essas decisões ficam no runtime e nos managers.

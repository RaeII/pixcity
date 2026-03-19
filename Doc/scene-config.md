# Scene Config

Esta documentação explica os arquivos da pasta `src/scene/config`.

## Objetivo da pasta

Essa pasta guarda valores padrão e configurações base do projeto.

Ela existe para evitar "números soltos" espalhados pela aplicação.

Se você quiser descobrir onde a cidade define seu comportamento padrão, normalmente começa aqui.

## Arquivos

### `src/scene/config/buildingConfig.ts`

Guarda os valores padrão dos prédios:

- cor inicial
- roughness inicial
- metalness inicial

Funções importantes:

- `DEFAULT_BUILDING_SETTINGS`
- `createDefaultBuildingSettings()`

Use `createDefaultBuildingSettings()` quando quiser criar um novo estado inicial sem compartilhar a mesma referência de objeto.

### `src/scene/config/textureConfig.ts`

Guarda os valores padrão das texturas PBR dos edifícios:

- textura ativada por padrão
- normal scale
- displacement scale
- tiling scale
- roughness intensity
- metalness intensity
- emissive intensity (padrão: 0)
- clay render desativado

Funções importantes:

- `DEFAULT_TEXTURE_SETTINGS`
- `createDefaultTextureSettings()`

### `src/scene/config/groundConfig.ts`

Guarda os valores padrão do chão:

- cor inicial
- roughness
- metalness
- tipo de material

Funções importantes:

- `DEFAULT_GROUND_SETTINGS`
- `createDefaultGroundSettings()`

### `src/scene/config/lightConfig.ts`

Guarda os valores padrão das luzes:

- ambient
- hemisphere
- directional (distância, elevação, azimute, alvo)

Funções importantes:

- `DEFAULT_LIGHT_SETTINGS`
- `createDefaultLightSettings()`

### `src/scene/config/shadowConfig.ts`

Guarda os valores padrão de sombra:

- se a sombra começa ligada
- bias
- normalBias
- radius
- blurSamples
- mapSize
- área da câmera de sombra
- quantidade de edifícios com sombra

### `src/scene/config/renderDirectionConfig.ts`

Guarda os valores padrão usados para decidir quais chunks devem permanecer carregados:

- distância à frente da câmera
- distância nas laterais
- distância atrás da câmera

Essa configuração é usada pelo `ChunkManager`.

### `src/scene/config/citySceneConfig.ts`

Esse é o arquivo de configuração mais global da cena.

Ele guarda informações como:

- tamanho do chunk
- tamanho dos blocos
- largura da rua
- altura mínima e máxima dos prédios
- limite de prédios por chunk
- distância do plano da câmera
- limite de resolução dinâmica
- valores máximos de luz solar
- tamanho do chão
- grid
- posição inicial da câmera
- target inicial do OrbitControls

Também define:

- `DEFAULT_SCENE_STATS`
- `envMapNearDistance` — raio em unidades world dentro do qual os chunks usam o cube envMap dinâmico dos prédios. Chunks além desse raio usam apenas o HDRI do `scene.environment`. Padrão: 78 (≈ 3 chunks). Veja `createChunkManager` para o comportamento de troca.

## Diferença entre configs por domínio e config global

Use os arquivos menores quando a configuração pertencer a um domínio específico:

- prédio
- chão
- luz
- sombra
- renderização por direção

Use `citySceneConfig.ts` quando a configuração for estrutural da cena inteira.

## Regra prática

Se você quer mudar comportamento inicial sem alterar lógica, comece por `config`.

Exemplos:

- "quero que os prédios nasçam mais escuros"
- "quero que a câmera comece mais longe"
- "quero mais chunks carregados"
- "quero sombras com mapa maior"

Esses casos normalmente são resolvidos sem tocar em `runtime`, `builders` ou `managers`.

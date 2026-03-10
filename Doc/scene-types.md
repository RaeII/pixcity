# Scene Types

Esta documentação explica os tipos da cena definidos em `src/scene/types.ts`.

## Objetivo do arquivo

O arquivo `types.ts` centraliza os contratos usados entre as camadas do projeto.

Isso evita duplicação e ajuda o TypeScript a proteger a comunicação entre:

- componentes React
- hook
- runtime
- builders
- managers
- configs

## Tipos principais

### `BuildingSettings`

Representa as configurações dos prédios:

- `color`
- `roughness`
- `metalness`

### `GroundSettings`

Representa as configurações do chão:

- `color`
- `roughness`
- `metalness`
- `materialType`

### `GroundMaterialType`

Define os tipos possíveis do material do chão:

- `standard`
- `matte`
- `soft-metal`
- `polished`

### `LightSettings`

Representa as configurações das luzes da cena:

- ambient
- hemisphere
- directional
- point lights

### `PointLightConfig`

Representa uma point light individual:

- `x`
- `y`
- `z`
- `intensity`

### `ShadowSettings`

Representa as configurações de sombra.

É usado para configurar:

- habilitação da sombra
- qualidade da sombra
- câmera da sombra
- limite de prédios com sombra

### `RenderDirectionSettings`

Representa os limites de carregamento com base na direção da câmera:

- `forwardDistance`
- `sideDistance`
- `backwardDistance`

### `SceneStats`

Representa métricas da cena enviadas de volta para o React:

- `buildings`
- `fpsMode`
- `chunks`
- `buildingsWithShadow`

Esses dados são usados pelo painel lateral.

## Tipos internos de infraestrutura

### `ChunkData`

Representa um chunk já criado na cidade.

Ele guarda:

- a chave do chunk
- o `InstancedMesh`
- contagem de prédios
- centros
- alturas
- escalas

Esse tipo é importante para os managers.

### `CameraVisibilityState`

Guarda o estado usado para saber se a câmera mudou o suficiente para exigir nova sincronização dos chunks.

### `CitySceneConfig`

Descreve a estrutura esperada para a config global da cena.

Esse tipo ajuda a manter `citySceneConfig.ts` consistente.

## Regra prática

Sempre que um dado precisar viajar entre mais de uma camada, ele deve virar um tipo centralizado aqui.

Exemplos:

- se uma nova seção do painel precisar sincronizar com o runtime
- se um manager precisar receber uma nova configuração
- se a config global ganhar um novo campo

Se isso acontecer, o primeiro lugar a revisar deve ser `src/scene/types.ts`.

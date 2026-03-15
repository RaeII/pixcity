# HTML Components

Este arquivo documenta os componentes React DOM do projeto.

Importante: aqui "HTML" significa componentes React que renderizam tags como `div`, `section`, `input`, `select` e `label`. Não significa arquivos HTML estáticos.

## Objetivo dessa camada

A pasta `src/components/html` existe para organizar todo o painel lateral sem misturar interface com lógica de Three.js.

Esses componentes:

- mostram os controles para o usuário
- recebem dados por `props`
- chamam callbacks quando o usuário muda algum valor
- não criam objetos do Three.js
- não conhecem a `scene`, a `camera` ou o `renderer`

## Arquivos principais

### `src/components/html/CityControlPanel.tsx`

É o componente que monta o painel completo.

Responsabilidades:

- receber todos os estados do editor
- organizar as seções em abas
- repassar callbacks para cada seção

O painel tem três abas:

- **Geral**: intro, prédios, sombras, direção de renderização e chão
- **Texturas**: configurações PBR das texturas dos edifícios
- **Luz**: luzes da cena (ambient, hemisphere, directional)

Pense nele como um "compositor" do painel.

### `src/components/html/PanelIntro.tsx`

Mostra o cabeçalho do painel com:

- título
- resumo dos prédios ativos
- chunks carregados
- quantidade de prédios gerando sombra
- intensidade solar atual

### `src/components/html/BuildingControls.tsx`

Cuida das configurações dos prédios:

- cor
- roughness
- metalness

Se quiser alterar a interface de personalização dos prédios, comece por aqui.

### `src/components/html/ShadowControls.tsx`

Cuida das configurações de sombra:

- ligar ou desligar sombras
- quantidade de prédios que geram sombra
- parte dos valores da câmera de sombra

### `src/components/html/RenderDirectionControls.tsx`

Cuida das distâncias de renderização em relação à direção da câmera:

- frente
- laterais
- trás

Esse componente não calcula nada sozinho. Ele só altera o estado que depois será usado pelo `ChunkManager`.

### `src/components/html/GroundControls.tsx`

Cuida das configurações do chão:

- cor
- tipo de material

### `src/components/html/TextureControls.tsx`

Cuida das configurações de textura PBR dos edifícios:

- ativar ou desativar texturas
- clay render (desativa texturas para testar só geometria)
- normal scale
- displacement scale
- tiling scale (repetição da textura)
- roughness intensity (intensidade do mapa de roughness)
- metalness intensity (intensidade do mapa de metalness)

As texturas são carregadas da pasta `src/assets/texture/Facade006_1K-mirrored-PNG/` e incluem mapas de cor, normal, roughness, metalness e displacement.

### `src/components/html/SceneLightControls.tsx`

Cuida das luzes gerais da cena:

- ambient
- directional light
- alvo da directional light
- leitura das métricas derivadas, como intensidade solar

## Componentes reutilizáveis de formulário

A pasta `src/components/html/controls` guarda componentes pequenos e reaproveitáveis.

### `PanelSection.tsx`

Cria o bloco visual padrão de cada seção do painel.

Use quando quiser criar uma nova seção mantendo o mesmo visual.

### `ColorField.tsx`

Campo para cor com:

- `input type="color"`
- `input type="text"`

Bom para casos em que o usuário quer usar seletor visual ou digitar um hex manualmente.

### `RangeField.tsx`

Campo para sliders.

Use quando o valor for numérico e fizer sentido arrastar.

### `NumberField.tsx`

Campo para números simples.

Use quando o valor precisa ser digitado diretamente.

### `CheckboxField.tsx`

Campo booleano simples.

## Como essa camada conversa com o resto do projeto

O fluxo é este:

1. o usuário mexe em um input
2. o componente HTML chama um callback
3. `CitySceneEditor` atualiza o estado React
4. `CitySceneCanvas` recebe o novo estado
5. `useCityScene` sincroniza isso com o runtime Three.js

Ou seja:

- componentes HTML mudam estado
- hook sincroniza estado
- runtime aplica mudança na cena

## Regra prática

Se o problema for visual ou de formulário, procure primeiro em `src/components/html`.

Se o problema for "a cena não reagiu ao valor novo", o arquivo provavelmente não está aqui. Nesse caso, siga para:

- `src/scene/hooks/useCityScene.ts`
- `src/scene/runtime/createCitySceneRuntime.ts`

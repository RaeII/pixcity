# Documentação da Estrutura do Projeto

Este projeto é uma cena 3D de cidade feita com `React`, `Three.js`, `TypeScript` e `Tailwind CSS`.

O objetivo desta documentação é ajudar um dev junior a entender:

- por onde a aplicação começa
- onde cada responsabilidade fica
- em qual arquivo mexer quando quiser alterar um comportamento
- como os dados saem do React e chegam na cena 3D

## Visão geral rápida

Hoje o projeto está dividido em 3 grandes partes:

1. `src/components`
   Responsável pela interface React.
   Aqui ficam o editor principal, o painel lateral e o canvas onde o Three.js é montado.

2. `src/scene`
   Responsável pela lógica da cena 3D.
   Aqui ficam tipos, configs, utilitários, builders, managers, hooks e o runtime principal.

3. `Doc`
   Responsável pela documentação da estrutura.

## Estrutura principal

```text
src/
  App.tsx
  main.tsx
  index.css
  components/
    CitySceneEditor.tsx
    html/
    three/
  scene/
    config/
    builders/
    managers/
    runtime/
    hooks/
    utils/
    types.ts
Doc/
  index.md
  html-components.md
  three-components.md
  scene-config.md
  scene-types.md
  scene-utils.md
  scene-builders.md
  scene-managers.md
  scene-runtime.md
  scene-hooks.md
```

## Fluxo da aplicação

### 1. Entrada da aplicação

- `src/main.tsx` renderiza o React no elemento `#root`.
- `src/App.tsx` é o ponto de entrada do app.
- `src/App.tsx` apenas renderiza `CitySceneEditor`.

### 2. Container principal

- `src/components/CitySceneEditor.tsx` é o componente mais importante do lado React.
- Ele guarda os estados principais:
  - `buildingSettings`
  - `groundSettings`
  - `lightSettings`
  - `shadowSettings`
  - `renderDirectionSettings`
  - `sceneStats`
- Ele entrega esses estados para:
  - `CitySceneCanvas`, que monta a cena 3D
  - `CityControlPanel`, que mostra os controles na interface

### 3. Canvas 3D

- `src/components/three/CitySceneCanvas.tsx` tem apenas um `div`.
- Esse `div` recebe um `ref`.
- O hook `useCityScene` usa esse `ref` para montar o renderer do Three.js dentro dele.

### 4. Painel lateral

- `src/components/html/CityControlPanel.tsx` organiza os componentes React DOM do painel.
- Cada seção do painel edita apenas uma parte do estado.
- O painel não conhece Three.js diretamente.
- Ele só atualiza estado React.

### 5. Hook da cena

- `src/scene/hooks/useCityScene.ts` conecta o mundo React com o mundo Three.js.
- Ele cria o runtime da cena uma vez.
- Depois sincroniza mudanças de estado usando métodos como:
  - `updateBuildingSettings`
  - `updateGroundSettings`
  - `updateLightSettings`
  - `updateShadowSettings`
  - `updateRenderDirectionSettings`

### 6. Runtime da cena

- `src/scene/runtime/createCitySceneRuntime.ts` é o cérebro do Three.js.
- Ele cria:
  - `scene`
  - `camera`
  - `renderer`
  - `OrbitControls`
  - luzes
  - chão
  - grid
  - chunks da cidade
  - sombras
- Também controla:
  - animação
  - resize
  - atualização dinâmica de resolução
  - limpeza de memória no `dispose`

## Regra prática: onde mexer?

Se você quiser...

- alterar valor padrão dos prédios: veja [scene-config.md](/var/www/pixcity/Doc/scene-config.md)
- alterar a UI do painel: veja [html-components.md](/var/www/pixcity/Doc/html-components.md)
- alterar o canvas ou a ligação com o hook: veja [three-components.md](/var/www/pixcity/Doc/three-components.md)
- alterar fórmulas de luz, clamp ou material: veja [scene-utils.md](/var/www/pixcity/Doc/scene-utils.md)
- alterar criação do chão, grid ou luzes: veja [scene-builders.md](/var/www/pixcity/Doc/scene-builders.md)
- alterar geração procedural da cidade: veja [scene-managers.md](/var/www/pixcity/Doc/scene-managers.md)
- alterar o ciclo completo da cena: veja [scene-runtime.md](/var/www/pixcity/Doc/scene-runtime.md)
- entender o contrato dos dados: veja [scene-types.md](/var/www/pixcity/Doc/scene-types.md)
- entender como React sincroniza com Three.js: veja [scene-hooks.md](/var/www/pixcity/Doc/scene-hooks.md)

## Ordem recomendada de leitura

Para entender o projeto pela primeira vez, a melhor ordem é:

1. `src/App.tsx`
2. `src/components/CitySceneEditor.tsx`
3. `src/components/html/CityControlPanel.tsx`
4. `src/components/three/CitySceneCanvas.tsx`
5. `src/scene/hooks/useCityScene.ts`
6. `src/scene/runtime/createCitySceneRuntime.ts`
7. `src/scene/managers/*`
8. `src/scene/builders/*`
9. `src/scene/config/*`
10. `src/scene/utils/*`

## Ideia central da arquitetura

A arquitetura foi organizada para separar bem as responsabilidades:

- React cuida de estado e interface
- Three.js cuida de renderização 3D
- `config` guarda valores padrão
- `types` define contratos
- `utils` guarda funções puras
- `builders` criam peças isoladas da cena
- `managers` cuidam de partes complexas com estado interno
- `runtime` orquestra tudo
- `hooks` fazem a ponte entre React e runtime

Essa separação evita colocar tudo dentro de `App.tsx` e torna o projeto mais fácil de manter.

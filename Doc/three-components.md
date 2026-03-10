# Three Components

Este arquivo documenta os componentes React que existem apenas para montar a cena 3D.

## Objetivo dessa camada

A pasta `src/components/three` existe para isolar o ponto de montagem da cena.

Isso é importante porque:

- o React cuida da árvore de componentes
- o Three.js cuida do conteúdo dentro do canvas
- a cena não deve ser construída diretamente dentro do painel HTML

## Arquivo principal

### `src/components/three/CitySceneCanvas.tsx`

Esse componente é pequeno de propósito.

Ele faz 3 coisas:

1. cria um `ref` para um `div`
2. chama o hook `useCityScene`
3. renderiza o `div` onde o `renderer.domElement` será anexado

## O que ele recebe por props

`CitySceneCanvas` recebe:

- `buildingSettings`
- `groundSettings`
- `lightSettings`
- `shadowSettings`
- `renderDirectionSettings`
- `onStatsChange`

Ou seja, ele não guarda estado próprio da cena.
Ele só recebe estado do `CitySceneEditor` e entrega isso ao hook.

## O que ele não faz

Esse componente não:

- cria luz manualmente
- cria `scene`
- cria `camera`
- gera chunks
- calcula sombras

Tudo isso fica no runtime em `src/scene/runtime/createCitySceneRuntime.ts`.

## Por que isso é útil

Se um dia você quiser trocar a forma como o canvas é montado, você muda um componente pequeno.

Exemplos:

- adicionar um overlay acima do canvas
- trocar a classe de layout do container
- adicionar algum comportamento visual no wrapper do canvas

Sem essa separação, qualquer mudança simples no container obrigaria você a mexer no código 3D pesado.

## Relação com o hook

O `CitySceneCanvas` é só a porta de entrada.

Quem realmente cria e sincroniza a cena é:

- `src/scene/hooks/useCityScene.ts`

Então a leitura natural é:

1. `CitySceneCanvas.tsx`
2. `useCityScene.ts`
3. `createCitySceneRuntime.ts`

# Scene Hooks

Esta documentação explica `src/scene/hooks/useCityScene.ts`.

## Objetivo do hook

Esse hook é a ponte entre React e Three.js.

Ele existe para que os componentes React não precisem conhecer diretamente a implementação do runtime.

## Responsabilidades

`useCityScene` faz duas coisas principais:

1. cria o runtime uma única vez
2. sincroniza mudanças de estado React com o runtime

## Como ele funciona

### Criação

Quando o componente do canvas monta:

- o hook lê o `mountRef`
- cria o runtime com os valores iniciais
- salva a referência desse runtime em `runtimeRef`

### Sincronização

Depois disso, cada `useEffect` é responsável por uma área:

- prédio
- texturas
- chão
- luz
- sombra
- direção de renderização

Isso é importante porque evita um efeito gigante tentando fazer tudo.

## Por que usar um hook

O hook ajuda a manter a camada React organizada:

- o componente do canvas continua simples
- o runtime não fica acoplado diretamente ao componente
- o ciclo de vida fica claro

## `useEffectEvent`

O hook usa `useEffectEvent` para o callback de estatísticas.

Na prática, isso ajuda a repassar `onStatsChange` sem recriar o runtime toda vez que o React renderiza.

## Cleanup

Quando o componente desmonta:

- o hook chama `runtime.dispose()`
- a referência do runtime é limpa

Isso evita vazamentos de:

- renderer
- listeners
- animation frame
- objetos da cena

## Quando mexer nesse arquivo

Mexa em `useCityScene.ts` quando o problema for de sincronização entre React e runtime.

Exemplos:

- uma mudança de estado React não está chegando na cena
- um método novo do runtime precisa ser chamado
- o lifecycle de montagem/desmontagem precisa mudar

Se o problema for comportamento interno da cena, normalmente o arquivo certo será `createCitySceneRuntime.ts`.

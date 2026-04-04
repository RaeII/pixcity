---
title: Scene Hooks
tags:
  - pixcity
  - react
  - hooks
  - bridge
aliases:
  - Hooks
  - useCityScene
  - Bridge React-Three
---

# Scene Hooks

A ponte entre React e Three.js: `src/scene/hooks/useCityScene.ts`.

## Objetivo do Hook

Esse hook existe para que os componentes React **não precisem conhecer diretamente** a implementação do runtime.

**Duas responsabilidades principais:**
1. Criar o [[scene-runtime|runtime]] uma única vez
2. Sincronizar mudanças de estado React com o runtime

## Como Funciona

### Criação

Quando [[three-components|CitySceneCanvas]] monta:

1. O hook lê o `mountRef` (o `div` do canvas)
2. Cria o runtime com os valores iniciais (via `initialSettingsRef`)
3. Salva a referência do runtime em `runtimeRef`

> [!note] initialSettingsRef
> As settings iniciais são capturadas numa ref para evitar que o `useEffect` de criação rode novamente quando as settings mudarem. O runtime recebe os valores corretos na criação; as atualizações subsequentes são feitas pelos efeitos de sincronização.

### Sincronização

Cada `useEffect` é responsável por uma área:

```typescript
useEffect(() => {
  runtimeRef.current?.updateBuildingSettings(buildingSettings);
}, [buildingSettings]);

useEffect(() => {
  runtimeRef.current?.updateTextureSettings(textureSettings);
}, [textureSettings]);

useEffect(() => {
  runtimeRef.current?.updateGroundSettings(groundSettings);
}, [groundSettings]);

useEffect(() => {
  runtimeRef.current?.updateLightSettings(lightSettings);
}, [lightSettings]);

useEffect(() => {
  runtimeRef.current?.updateShadowSettings(shadowSettings);
}, [shadowSettings]);

useEffect(() => {
  runtimeRef.current?.updateRenderDirectionSettings(renderDirectionSettings, true);
}, [renderDirectionSettings]);

useEffect(() => {
  runtimeRef.current?.updateEnvironmentSettings(environmentSettings);
}, [environmentSettings]);
```

Isso é importante para evitar um efeito gigante tentando fazer tudo.

### Retorno

O hook retorna um objeto com:

```typescript
{ addDonation: (value: number) => void }
```

`addDonation` é uma referência estável (via `useCallback`) que delega ao runtime atual sem recriar a função.

## `useEffectEvent`

O hook usa `useEffectEvent` para o callback de estatísticas.

```typescript
const handleStatsChange = useEffectEvent((stats: SceneStats) => {
  onStatsChange(stats);
});
```

Isso repassa `onStatsChange` para o runtime sem recriar o runtime toda vez que o React renderiza — o callback sempre vê o valor mais recente sem precisar ser listado como dependência.

## Cleanup

Quando o canvas desmonta:

```typescript
return () => {
  runtimeRef.current = null;
  runtime.dispose();
};
```

Evita vazamentos de:
- renderer e WebGL context
- event listeners (`resize`)
- animation frame (`requestAnimationFrame`)
- objetos da cena (geometrias, materiais, texturas)

## Por que Usar um Hook

- O [[three-components|componente do canvas]] continua simples
- O [[scene-runtime|runtime]] não fica acoplado diretamente ao componente
- O ciclo de vida fica explícito e testável isoladamente

## Quando Mexer Aqui

Mexa em `useCityScene.ts` quando o problema for de **sincronização entre React e runtime**:

| Problema | Ação |
|---|---|
| Mudança de estado não chega na cena | Verifique os `useEffect` de sync |
| Novo método do runtime precisa ser chamado | Adicione `useEffect` correspondente |
| Lifecycle de montagem/desmontagem precisa mudar | Edite o `useEffect` principal |

> [!tip]
> Se o problema for comportamento interno da cena, o arquivo certo provavelmente é [[scene-runtime|createCitySceneRuntime.ts]].

## Relações

- Usado por: [[three-components|CitySceneCanvas]]
- Cria: [[scene-runtime|createCitySceneRuntime]]
- Tipos de opções: [[scene-types]]

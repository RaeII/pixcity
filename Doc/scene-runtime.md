# Scene Runtime

Esta documentação explica `src/scene/runtime/createCitySceneRuntime.ts`.

## O que é o runtime

O runtime é a camada que orquestra toda a cena 3D.

Se o projeto fosse uma orquestra:

- `config` seria a partitura com valores
- `builders` seriam os instrumentos montados
- `managers` seriam os grupos especializados
- `runtime` seria o maestro

## Responsabilidades do runtime

O runtime:

- cria a `scene`
- cria a `camera`
- cria o `renderer`
- cria o `OrbitControls`
- chama os builders
- chama os managers
- roda o loop de animação
- escuta `resize`
- faz `dispose` completo no final

## Fluxo interno resumido

### 1. Inicialização

Ao ser criado, o runtime:

- roda assertions de desenvolvimento
- cria `scene`, `camera` e `renderer`
- anexa o `renderer.domElement` no `mount`
- configura `OrbitControls`
- cria:
  - `lightingRig`
  - `groundPlane`
  - `gridHelper`
  - `chunkManager`
  - `shadowManager`

### 2. Primeira sincronização

Depois da criação, o runtime:

- aplica as configurações de sombra
- sincroniza a cidade
- sincroniza as sombras

### 3. Loop de animação

No `animate`:

- atualiza os controls
- detecta mudança de posição ou direção da câmera
- sincroniza chunks quando necessário
- sincroniza sombras periodicamente
- move chão e grid
- ajusta resolução dinâmica
- renderiza a cena

### 4. Atualizações vindas do React

O runtime expõe métodos públicos:

- `updateBuildingSettings`
- `updateGroundSettings`
- `updateLightSettings`
- `updateShadowSettings`
- `updateRenderDirectionSettings`
- `dispose`

Esses métodos são chamados pelo hook `useCityScene`.

## Por que essa camada é importante

Sem esse runtime, a lógica do projeto ficaria espalhada em vários componentes React.

Isso seria ruim porque:

- o código ficaria difícil de ler
- o cleanup seria mais arriscado
- a cena dependeria demais do ciclo de render do React

Com o runtime:

- o Three.js fica centralizado
- o React só envia estado
- a manutenção fica mais previsível

## Quando mexer no runtime

Mexa aqui quando a mudança envolver coordenação entre várias partes da cena.

Exemplos:

- mudar o comportamento do loop principal
- alterar a regra de refresh da câmera
- mudar a ordem de criação da cena
- alterar a estratégia de `dispose`
- adicionar uma nova peça que precisa ser sincronizada junto com o resto

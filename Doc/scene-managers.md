# Scene Managers

Esta documentação explica os arquivos de `src/scene/managers`.

## Objetivo da pasta

`managers` cuidam de partes da cena que têm estado interno e comportamento contínuo.

Em vez de colocar toda a lógica procedural dentro do runtime, o projeto separa as áreas mais complexas aqui.

## Arquivos

### `src/scene/managers/createChunkManager.ts`

Esse manager controla a cidade procedural.

É uma das partes mais importantes do projeto.

Responsabilidades:

- criar `InstancedMesh` por chunk
- gerar prédios proceduralmente
- decidir quais chunks devem existir perto da câmera
- remover chunks distantes
- atualizar estatísticas de prédios e chunks
- atualizar o material dos prédios quando o estado muda

## Como os chunks funcionam

O fluxo básico é:

1. descobrir em qual chunk a câmera está
2. calcular o raio de busca com base em `RenderDirectionSettings`
3. descobrir direção atual da câmera
4. priorizar frente, depois lateral, depois trás
5. criar ou remover chunks conforme necessário

## Como os prédios são gerados

Cada chunk:

- percorre uma grade local
- pula áreas de rua
- usa ruído pseudoaleatório com `seeded`
- calcula altura, largura, profundidade e offsets
- escreve isso em um `InstancedMesh`

Isso permite desenhar muitos prédios com boa performance.

### `src/scene/managers/createShadowManager.ts`

Esse manager controla os objetos usados no passe de sombra.

Responsabilidades:

- escolher quais prédios mais próximos vão gerar sombra
- criar meshes auxiliares invisíveis para `castShadow`
- limpar e recriar esse grupo quando necessário
- atualizar a contagem de prédios com sombra

## Ideia importante sobre sombras

Nem todos os prédios da cidade geram sombra ao mesmo tempo.

Isso é uma decisão de performance.

O `ShadowManager` pega os candidatos mais próximos da câmera e limita a quantidade usando:

- `buildingCountWithShadow`
- `shadowBuildingCap`

## Quando mexer em managers

Mexa em `managers` quando o problema for comportamental.

Exemplos:

- "os chunks carregam cedo demais"
- "a câmera deveria enxergar mais para frente"
- "quero outra regra de geração de prédios"
- "a seleção de prédios com sombra precisa mudar"

Se o problema for só valor padrão, veja `config`.
Se for fórmula pequena, veja `utils`.

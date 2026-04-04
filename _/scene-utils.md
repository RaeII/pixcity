# Scene Utils

Esta documentação explica os utilitários puros da pasta `src/scene/utils`.

## Objetivo da pasta

`utils` guarda funções pequenas e reutilizáveis que não dependem diretamente da árvore React.

Em geral, um utilitário:

- recebe dados
- calcula algo
- devolve um resultado

Sem criar UI e sem controlar ciclo de vida da cena.

## Arquivos

### `src/scene/utils/math.ts`

Guarda funções matemáticas simples:

- `clamp`
- `getSearchRadius`

Use esse arquivo quando a lógica for matemática e genérica.

### `src/scene/utils/materials.ts`

Guarda a função:

- `getGroundMaterialValues`

Ela transforma o tipo de material do chão em valores reais de:

- `roughness`
- `metalness`

Exemplo:

- `matte` força chão fosco
- `polished` deixa o chão mais polido

### `src/scene/utils/lighting.ts`

Guarda funções relacionadas a luz:

- `getDirectionalPositionFromAngles`
- `getSolarIntensityFromElevation`
- `getDynamicAmbientIntensity`
- `getLightMetrics`

Esse é o lugar certo para alterar fórmulas de luz.

### `src/scene/utils/random.ts`

Guarda utilitários usados na geração procedural:

- `fract`
- `seeded`

O `ChunkManager` usa essas funções para definir:

- densidade
- altura
- forma
- offsets dos prédios

### `src/scene/utils/devAssertions.ts`

Guarda pequenas verificações de desenvolvimento com `console.assert`.

A função principal é:

- `runDevAssertionsOnce`

Ela roda uma vez quando o runtime é criado.

Isso ajuda a detectar regressões em utilitários básicos.

## Como saber se algo deve ir para utils

Uma boa regra é:

Se a função puder ser entendida sem saber onde ela será renderizada, provavelmente ela é candidata para `utils`.

Exemplos bons para `utils`:

- fórmula de intensidade solar
- cálculo do raio de busca
- mapeamento de material

Exemplos ruins para `utils`:

- montar um `Mesh`
- ligar eventos de resize
- controlar cleanup do renderer

Esses casos pertencem a outras pastas.

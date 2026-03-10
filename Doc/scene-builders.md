# Scene Builders

Esta documentação explica os arquivos de `src/scene/builders`.

## Objetivo da pasta

`builders` cria partes isoladas da cena.

A ideia é simples:

- o runtime não precisa saber todos os detalhes de criação
- cada builder monta uma peça específica
- cada builder também sabe atualizar e destruir essa peça

Isso reduz o tamanho do runtime e melhora a leitura.

## Arquivos

### `src/scene/builders/createGroundPlane.ts`

Cria o chão da cidade.

Responsabilidades:

- criar a geometria do chão
- criar o material do chão
- aplicar os valores derivados do tipo de material
- habilitar ou desabilitar recebimento de sombra
- mover o chão junto com a câmera
- limpar geometria e material no `dispose`

Quando mexer aqui:

- se quiser trocar o tipo de `Mesh` do chão
- se quiser mudar a forma como o chão atualiza material
- se quiser mudar como o chão acompanha a câmera

### `src/scene/builders/createGridHelper.ts`

Cria o grid visual da cena.

Responsabilidades:

- criar o `GridHelper`
- configurar transparência
- reposicionar o grid conforme a câmera anda
- limpar recursos no `dispose`

Quando mexer aqui:

- se quiser trocar cor do grid dinamicamente
- se quiser esconder ou alterar a malha visual

### `src/scene/builders/createLightingRig.ts`

Cria e atualiza as luzes da cena.

Responsabilidades:

- criar `AmbientLight`
- criar `HemisphereLight`
- criar `DirectionalLight`
- criar e sincronizar `PointLight[]`
- atualizar posição, cor e intensidade das luzes
- destruir luzes ao final

Esse builder devolve um `LightingRig`, que é um objeto com referências e métodos de atualização.

Quando mexer aqui:

- se quiser adicionar um novo tipo de luz
- se quiser mudar como as point lights são criadas
- se quiser alterar a forma como a directional light recebe posição e alvo

## O que builders não fazem

Builders não devem controlar o fluxo completo da aplicação.

Eles não decidem:

- quando a animação roda
- quando os chunks são sincronizados
- quando a câmera disparou refresh

Essas decisões ficam no runtime e nos managers.

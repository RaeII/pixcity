# Scene Managers

Esta documentação explica os arquivos de `src/scene/managers`.

## Objetivo da pasta

`managers` cuidam de partes da cena que têm estado interno e comportamento contínuo.

Em vez de colocar toda a lógica procedural dentro do runtime, o projeto separa as áreas mais complexas aqui.

## Arquivos

### `src/scene/managers/createDonationManager.ts`

Esse é o manager principal da cena. Ele gerencia os prédios como representações visuais de doações.

Responsabilidades:

- manter a lista de doações (`DonationEntry[]`) ordenada por valor decrescente
- criar e atualizar um único `InstancedMesh` com capacidade para até 500 prédios
- posicionar prédios em espiral quadrada a partir do centro — doação de maior valor ocupa o centro
- calcular altura de cada prédio proporcionalmente ao valor máximo atual
- carregar e aplicar texturas PBR (cor, normal, roughness, metalness, displacement, emissive)
- atualizar materiais em tempo real quando configurações mudam
- gerenciar envMap dinâmico do cube camera

### Layout dos prédios

Os prédios são posicionados em espiral quadrada a partir da origem:

- **Índice 0** (maior doação): posição `(0, 0)` — centro da cena
- **Índice 1–8**: primeiro anel externo
- **Índice 9–24**: segundo anel externo
- E assim por diante...

A cada nova doação, a lista é reordenada e todas as instâncias são reconstruídas. Isso garante que o maior valor sempre ocupe o centro, mesmo que uma nova doação maior chegue depois.

### Fórmula de altura

A altura de cada prédio é proporcional ao maior valor da lista:

```
height = minBuildingHeight + (valor / maxValor) * (maxSceneHeight - minBuildingHeight)
```

- `minBuildingHeight = 0.5` — mínimo visual para qualquer doação
- `maxSceneHeight = 16` — cap visual; o prédio com maior doação sempre alcança esse valor
- Todos os outros prédios são proporcionalmente menores

Para ajustar esses limites, edite `DONATION_LAYOUT` em `createDonationManager.ts`.

### Materiais

O manager usa um único par de materiais (sem distinção near/far, pois todos os prédios ficam perto da câmera):

- **facadeMaterial** (`MeshPhysicalMaterial`): textura de fachada com shader triplanar, cube envMap dinâmico
- **topMaterial** (`MeshPhysicalMaterial`): textura de concreto para o topo dos prédios

O shader triplanar é necessário para que a textura de fachada seja aplicada corretamente em prédios com alturas diferentes dentro do mesmo `InstancedMesh`.

---

### `src/scene/managers/createChunkManager.ts`

Manager da cidade procedural infinita. **Não é mais usado pelo runtime principal** — mantido no repositório para referência arquitetural.

Responsabilidades originais:

- criar `InstancedMesh` por chunk
- gerar prédios proceduralmente com `seeded` random
- decidir quais chunks devem existir perto da câmera
- remover chunks distantes
- alternar materiais near/far por chunk com base em `envMapNearDistance`

### `src/scene/managers/createShadowManager.ts`

Manager de sombras por seleção de candidatos. **Não é mais usado pelo runtime principal** — mantido no repositório para referência.

Responsabilidade original: escolher os prédios mais próximos da câmera para gerar sombra, limitando o custo do shadow map.

## Quando mexer em managers

Mexa em `managers` quando o problema for comportamental.

Exemplos:

- "quero mudar o layout dos prédios de doação"
- "quero alterar a fórmula de altura proporcional"
- "quero aumentar o limite máximo de doações"

Se o problema for só valor padrão (altura máxima, tamanho do slot), edite `DONATION_LAYOUT` em `createDonationManager.ts`.
Se for fórmula matemática pequena, veja `utils`.

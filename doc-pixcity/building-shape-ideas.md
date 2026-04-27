---
title: Ideias de Novos Building Shapes (Baseados em edifícios reais)
tags:
  - pixcity
  - arquitetura
  - building-shapes
---

# Ideias de Novos Building Shapes

Referência de formatos para expandir `BuildingShape` além de `default`, `twisted`, `octagonal` e `setback`.

## 1) Tapered / Supertall afunilado
- **Referências reais:** Burj Khalifa (Dubai), Shanghai Tower (Xangai, no aspecto de redução de massa em altura).
- **Característica:** planta/fachada vão reduzindo gradualmente do térreo ao topo.
- **Como modelar:** escalar `width/depth` por `heightRatio` com curva suave (`easeOutCubic`).
- **Nome sugerido:** `tapered`.

## 2) Stepped Pyramid / Zigurate moderno
- **Referências reais:** 120 Wall Street (NY), 30 Rockefeller Plaza (setbacks Art Déco mais agressivos).
- **Característica:** vários recuos discretos (mais de 3), com lajes de transição visíveis.
- **Como modelar:** generalizar a lógica de setback para `N` tiers configuráveis.
- **Nome sugerido:** `stepped`.

## 3) Triangular Prism / Torre triangular
- **Referências reais:** Flatiron Building (NY, leitura triangular), Torre Reforma (CDMX, seção triangular).
- **Característica:** footprint triangular com 3 fachadas principais.
- **Como modelar:** `BufferGeometry` manual (semelhante ao octogonal), com topo triangular.
- **Nome sugerido:** `triangular`.

## 4) Cylindrical / Torre cilíndrica
- **Referências reais:** Westin Peachtree Plaza (Atlanta), Marina City (Chicago).
- **Característica:** seção circular e leitura "lisa" no skyline.
- **Como modelar:** `CylinderGeometry` com segmentos moderados (12–20) e topo dedicado.
- **Nome sugerido:** `cylindrical`.

## 5) Elliptical / Planta elíptica
- **Referências reais:** 30 St Mary Axe (Londres) no caráter aerodinâmico, Torre Agbar (Barcelona) em volume oval.
- **Característica:** footprint oval, mais orgânico que o cilindro.
- **Como modelar:** extrusão procedural com pontos elípticos (ou `CylinderGeometry` escalado não-uniforme).
- **Nome sugerido:** `elliptical`.

## 6) Leaning / Torre inclinada
- **Referências reais:** Capital Gate (Abu Dhabi), Gate of Europe (Madri).
- **Característica:** eixo principal inclinado com centro de massa deslocado.
- **Como modelar:** deslocamento progressivo do centro em X/Z por altura (`offset = k * heightRatio`).
- **Nome sugerido:** `leaning`.

## 7) Diagrid / Exoesqueleto aparente
- **Referências reais:** The Gherkin (Londres), Hearst Tower (NY).
- **Característica:** malha diagonal visível na fachada.
- **Como modelar:** manter shape base simples e adicionar acessório/fachada secundária com tirantes diagonais.
- **Nome sugerido:** `diagrid`.

## 8) Terraced Garden / Terraços vegetados
- **Referências reais:** Bosco Verticale (Milão), The Spiral (NY).
- **Característica:** recuos com “bandejas”/sacadas recorrentes para vegetação.
- **Como modelar:** variação de setback com lajes salientes periódicas + instâncias leves de jardineiras.
- **Nome sugerido:** `terraced`.

## 9) Crowned Top / Coroa arquitetônica
- **Referências reais:** Chrysler Building (NY), Jin Mao Tower (Xangai).
- **Característica:** corpo principal regular + topo/coroa muito marcante.
- **Como modelar:** shape padrão + builder de "crown" no topo (pode nascer como `RooftopType`).
- **Nome sugerido:** `crowned`.

## 10) Split Twin / Torre com rasgo central
- **Referências reais:** Kingdom Centre (Riad), CCTV Headquarters (Pequim, no conceito de vazio).
- **Característica:** volume com vazado/rasgo no terço superior.
- **Como modelar:** CSG simplificada ou composição de 2 prismas com vão central.
- **Nome sugerido:** `split`.

## Priorização recomendada (melhor custo/benefício)
1. `tapered`
2. `triangular`
3. `cylindrical`
4. `leaning`
5. `stepped` (generalização do setback atual)

## Checklist técnico para cada novo shape
1. Adicionar valor em `BuildingShape` (`src/scene/types.ts`).
2. Criar builder `create<Shape>BuildingMesh.ts` em `src/scene/builders/`.
3. Integrar no `DonationManager` (troca de mesh por shape customizado).
4. Ajustar `createSignMesh` e `createEdgeLightMesh` para footprint/normal do novo shape.
5. Garantir descarte de recursos compartilhados (`dispose*SharedResources`).
6. Expor opção no `BuildingCustomizePanel`.

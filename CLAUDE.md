# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixCity is a procedural 3D city scene editor built with React 19, Three.js, TypeScript, and Vite. It generates an infinite-feeling city with instanced buildings, configurable lighting, PBR textures, and shadow systems — all controllable via a real-time UI panel.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript compile + Vite production build
- `npm run lint` — ESLint (flat config with TypeScript + React rules)
- `npm run preview` — Preview production build

No test framework is configured.

## Architecture

Three-tier separation between React UI, Three.js rendering, and a bridge layer:

### Data Flow

```
User controls → CitySceneEditor (React state) → useCityScene hook → createCitySceneRuntime → Three.js scene
                                                                   ↑ stats feedback ↑
```

`CitySceneEditor` is the single state holder. All settings (building, texture, ground, light, shadow, render direction) flow down as props. No external state management — React hooks only.

### Key Layers

- **`src/components/html/`** — Control panel UI. Purely presentational, no Three.js imports. Each control group (BuildingControls, LightControls, etc.) maps to a settings type.
- **`src/components/three/CitySceneCanvas.tsx`** — Mounts the Three.js renderer to a DOM ref via `useCityScene`.
- **`src/scene/hooks/useCityScene.ts`** — Bridge layer. React effects detect settings changes and call runtime update methods.
- **`src/scene/runtime/createCitySceneRuntime.ts`** — Orchestrator. Creates scene, camera, renderer, OrbitControls, and coordinates all managers/builders. Owns the animation loop (chunk loading, shadow sync, dynamic resolution scaling targeting 55 FPS).
- **`src/scene/managers/`** — Stateful coordinators: `createChunkManager` (procedural city chunks with LOD via render direction distances), `createShadowManager` (shadow-casting building selection).
- **`src/scene/builders/`** — Factory functions returning Three.js objects: lighting rig, ground plane, grid helper.
- **`src/scene/config/`** — All defaults and magic numbers live here. Each config file has a `createDefault*Settings()` factory.
- **`src/scene/types.ts`** — Central type definitions for all settings interfaces.
- **`src/scene/utils/`** — Pure functions (seeded random, math helpers, lighting calculations, material helpers).

### Patterns

- **Factory functions everywhere** — builders, managers, and runtime all use `create*()` functions returning objects with methods, not classes.
- **Explicit disposal** — All Three.js objects are cleaned up via `dispose()` methods. Always add cleanup when creating new Three.js resources.
- **Instanced meshes** — Buildings use `THREE.InstancedMesh` for performance. The chunk manager handles instance matrix updates.
- **Seeded random** — Building placement is deterministic per chunk position via `src/scene/utils/random.ts`.

## Documentation

Architecture docs in Portuguese are in `Doc/`. **The documentation must always be kept up to date.** Whenever you change code — add a module, rename a file, change behavior, or modify architecture — update the corresponding doc files.

- `Doc/index.md` — Project overview, application flow, and directory structure. Update this when adding new modules or changing the overall architecture.
- Other files (`Doc/scene-config.md`, `Doc/scene-managers.md`, `Doc/html-components.md`, etc.) — Module-specific docs. Update the relevant file when changing that module.

## TypeScript

Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`. Target ES2022.

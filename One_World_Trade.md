    import React, { useEffect, useRef } from "react";
    import * as THREE from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

    export default function OneWorldTradeCenterPureThreeScene() {
      const mountRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf6f8fb);

        const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 2200);
        camera.position.set(118, 172, 360);
        camera.lookAt(0, 210, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 214, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.055;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minDistance = 145;
        controls.maxDistance = 760;
        controls.maxPolarAngle = Math.PI * 0.93;

        scene.add(new THREE.HemisphereLight(0xdcefff, 0x31404a, 2.05));

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.35);
        keyLight.position.set(-110, 270, 150);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 10;
        keyLight.shadow.camera.far = 780;
        keyLight.shadow.camera.left = -170;
        keyLight.shadow.camera.right = 170;
        keyLight.shadow.camera.top = 560;
        keyLight.shadow.camera.bottom = -80;
        scene.add(keyLight);

        const warmReflectionLight = new THREE.DirectionalLight(0xffe0a8, 1.7);
        warmReflectionLight.position.set(180, 120, 250);
        scene.add(warmReflectionLight);

        const rimLight = new THREE.DirectionalLight(0xb7e2ff, 1.15);
        rimLight.position.set(160, 300, -220);
        scene.add(rimLight);

        const building = new THREE.Group();
        building.name = "Procedural One World Trade Center building only";
        scene.add(building);

        const allGeometries: THREE.BufferGeometry[] = [];
        const allMaterials: THREE.Material[] = [];

        const trackGeometry = <T extends THREE.BufferGeometry>(geometry: T) => {
          allGeometries.push(geometry);
          return geometry;
        };

        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x7db7c9,
          metalness: 0.26,
          roughness: 0.19,
          transmission: 0.08,
          transparent: true,
          opacity: 0.86,
          clearcoat: 0.9,
          clearcoatRoughness: 0.12,
          reflectivity: 0.9,
        });

        const brightGlassMat = new THREE.MeshPhysicalMaterial({
          color: 0xddeef0,
          metalness: 0.18,
          roughness: 0.13,
          transmission: 0.1,
          transparent: true,
          opacity: 0.78,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          reflectivity: 1,
        });

        const darkGlassMat = new THREE.MeshPhysicalMaterial({
          color: 0x12364c,
          metalness: 0.34,
          roughness: 0.25,
          transmission: 0.02,
          transparent: true,
          opacity: 0.88,
          clearcoat: 0.78,
          clearcoatRoughness: 0.18,
          reflectivity: 0.8,
        });

        const coolFacetMat = new THREE.MeshPhysicalMaterial({
          color: 0x4d91a9,
          metalness: 0.28,
          roughness: 0.2,
          transmission: 0.04,
          transparent: true,
          opacity: 0.84,
          clearcoat: 0.86,
          clearcoatRoughness: 0.13,
          reflectivity: 0.88,
        });

        const baseGlassMat = new THREE.MeshPhysicalMaterial({
          color: 0x4d8392,
          metalness: 0.32,
          roughness: 0.32,
          transparent: true,
          opacity: 0.9,
          clearcoat: 0.65,
          clearcoatRoughness: 0.28,
        });

        const steelMat = new THREE.MeshStandardMaterial({
          color: 0xc9d5dc,
          metalness: 0.82,
          roughness: 0.24,
        });

        const darkSteelMat = new THREE.MeshStandardMaterial({
          color: 0x283946,
          metalness: 0.86,
          roughness: 0.28,
        });

        const mullionMat = new THREE.MeshStandardMaterial({
          color: 0x9fb7c4,
          metalness: 0.68,
          roughness: 0.34,
        });

        const blackMat = new THREE.MeshStandardMaterial({
          color: 0x071017,
          metalness: 0.25,
          roughness: 0.5,
        });

        const beaconMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xbfe8ff,
          emissiveIntensity: 2.35,
          metalness: 0.2,
          roughness: 0.14,
        });

        const gridMat = new THREE.LineBasicMaterial({
          color: 0xd9eef7,
          transparent: true,
          opacity: 0.42,
        });

        const edgeMat = new THREE.LineBasicMaterial({
          color: 0xf4fbff,
          transparent: true,
          opacity: 0.62,
        });

        const cableMat = new THREE.LineBasicMaterial({
          color: 0xdce8ee,
          transparent: true,
          opacity: 0.75,
        });

        allMaterials.push(
          glassMat,
          brightGlassMat,
          darkGlassMat,
          coolFacetMat,
          baseGlassMat,
          steelMat,
          darkSteelMat,
          mullionMat,
          blackMat,
          beaconMat,
          gridMat,
          edgeMat,
          cableMat,
        );

        function smoothstep(t: number) {
          const clamped = THREE.MathUtils.clamp(t, 0, 1);
          return clamped * clamped * (3 - 2 * clamped);
        }

        function footprintFromChamferHalf(half: number, cutRatio: number) {
          const c = half * THREE.MathUtils.clamp(cutRatio, 0.015, 0.985);
          return [
            new THREE.Vector3(-half + c, 0, half),
            new THREE.Vector3(half - c, 0, half),
            new THREE.Vector3(half, 0, half - c),
            new THREE.Vector3(half, 0, -half + c),
            new THREE.Vector3(half - c, 0, -half),
            new THREE.Vector3(-half + c, 0, -half),
            new THREE.Vector3(-half, 0, -half + c),
            new THREE.Vector3(-half, 0, half - c),
          ];
        }

        function oneWTCCrossSection(t: number) {
          const eased = smoothstep(t);
          const half = THREE.MathUtils.lerp(43.0, 35.6, t);
          const cutRatio = THREE.MathUtils.lerp(0.035, 0.975, eased);
          return footprintFromChamferHalf(half, cutRatio);
        }

        function pushQuad(
          positions: number[],
          indices: number[],
          a: THREE.Vector3,
          b: THREE.Vector3,
          c: THREE.Vector3,
          d: THREE.Vector3,
        ) {
          const start = positions.length / 3;
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
          indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
        }

        function pushFan(positions: number[], indices: number[], points: THREE.Vector3[], reverse = false) {
          const center = points.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / points.length);
          const centerIndex = positions.length / 3;
          positions.push(center.x, center.y, center.z);
          const firstIndex = positions.length / 3;
          points.forEach((p) => positions.push(p.x, p.y, p.z));

          for (let i = 0; i < points.length; i += 1) {
            const a = firstIndex + i;
            const b = firstIndex + ((i + 1) % points.length);
            if (reverse) indices.push(centerIndex, b, a);
            else indices.push(centerIndex, a, b);
          }
        }

        function addMesh(
          geometry: THREE.BufferGeometry,
          material: THREE.Material,
          position: THREE.Vector3 | [number, number, number],
          parent: THREE.Group = building,
          castShadow = true,
          receiveShadow = true,
        ) {
          const mesh = new THREE.Mesh(geometry, material);
          if (Array.isArray(position)) mesh.position.set(position[0], position[1], position[2]);
          else mesh.position.copy(position);
          mesh.castShadow = castShadow;
          mesh.receiveShadow = receiveShadow;
          parent.add(mesh);
          return mesh;
        }

        const boxCache = new Map<string, THREE.BoxGeometry>();
        function boxGeometry(width: number, height: number, depth: number) {
          const key = `${width.toFixed(3)}_${height.toFixed(3)}_${depth.toFixed(3)}`;
          const cached = boxCache.get(key);
          if (cached) return cached;
          const geometry = trackGeometry(new THREE.BoxGeometry(width, height, depth));
          boxCache.set(key, geometry);
          return geometry;
        }

        function addBox(
          width: number,
          height: number,
          depth: number,
          x: number,
          y: number,
          z: number,
          material: THREE.Material,
          parent: THREE.Group = building,
        ) {
          return addMesh(boxGeometry(width, height, depth), material, [x, y, z], parent);
        }

        const cylinderCache = new Map<string, THREE.CylinderGeometry>();
        function cylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radialSegments = 32) {
          const key = `${radiusTop.toFixed(3)}_${radiusBottom.toFixed(3)}_${height.toFixed(3)}_${radialSegments}`;
          const cached = cylinderCache.get(key);
          if (cached) return cached;
          const geometry = trackGeometry(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
          cylinderCache.set(key, geometry);
          return geometry;
        }

        function prismFromFootprints(bottom: THREE.Vector3[], top: THREE.Vector3[], height: number) {
          const positions: number[] = [];
          const indices: number[] = [];
          const y0 = -height / 2;
          const y1 = height / 2;
          const b = bottom.map((p) => p.clone().setY(y0));
          const t = top.map((p) => p.clone().setY(y1));

          for (let i = 0; i < b.length; i += 1) {
            const next = (i + 1) % b.length;
            pushQuad(positions, indices, b[i], b[next], t[next], t[i]);
          }
          pushFan(positions, indices, t, false);
          pushFan(positions, indices, b, true);

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          return trackGeometry(geometry);
        }

        function buildTowerFaceGeometry(faceIndex: number, baseY: number, height: number, segments = 56) {
          const positions: number[] = [];
          const indices: number[] = [];

          for (let s = 0; s < segments; s += 1) {
            const t0 = s / segments;
            const t1 = (s + 1) / segments;
            const section0 = oneWTCCrossSection(t0).map((p) => p.setY(baseY + t0 * height));
            const section1 = oneWTCCrossSection(t1).map((p) => p.setY(baseY + t1 * height));
            const next = (faceIndex + 1) % 8;
            pushQuad(positions, indices, section0[faceIndex], section0[next], section1[next], section1[faceIndex]);
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          return trackGeometry(geometry);
        }

        function pointOnTowerFace(faceIndex: number, t: number, u: number, baseY: number, height: number, offset = 0) {
          const section = oneWTCCrossSection(t);
          const a = section[faceIndex];
          const b = section[(faceIndex + 1) % 8];
          const p = a.clone().lerp(b, u);
          p.y = baseY + t * height;
          const outward = p.clone().setY(0).normalize();
          return p.addScaledVector(outward, offset);
        }

        function addTowerSkin(baseY: number, height: number) {
          const faceMaterials = [
            brightGlassMat,
            glassMat,
            darkGlassMat,
            coolFacetMat,
            glassMat,
            brightGlassMat,
            darkGlassMat,
            coolFacetMat,
          ];

          for (let i = 0; i < 8; i += 1) {
            const face = addMesh(buildTowerFaceGeometry(i, baseY, height), faceMaterials[i], [0, 0, 0]);
            face.name = `One WTC crystalline triangular facade face ${i + 1}`;
          }
        }

        function addFacadeGrid(baseY: number, height: number) {
          const vertices: number[] = [];
          const pushSegment = (a: THREE.Vector3, b: THREE.Vector3) => {
            vertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
          };

          for (let face = 0; face < 8; face += 1) {
            for (let row = 1; row < 92; row += 1) {
              const t = row / 92;
              pushSegment(
                pointOnTowerFace(face, t, 0.035, baseY, height, 0.16),
                pointOnTowerFace(face, t, 0.965, baseY, height, 0.16),
              );
            }

            for (let column = 1; column < 12; column += 1) {
              const u = column / 12;
              pushSegment(
                pointOnTowerFace(face, 0.02, u, baseY, height, 0.19),
                pointOnTowerFace(face, 0.985, u, baseY, height, 0.19),
              );
            }
          }

          const geometry = trackGeometry(new THREE.BufferGeometry());
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
          const lines = new THREE.LineSegments(geometry, gridMat);
          lines.name = "One WTC fine curtain-wall grid";
          building.add(lines);
        }

        function addTowerFacetEdges(baseY: number, height: number) {
          const vertices: number[] = [];
          const pushSegment = (a: THREE.Vector3, b: THREE.Vector3) => {
            vertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
          };

          for (let vertexIndex = 0; vertexIndex < 8; vertexIndex += 1) {
            for (let s = 0; s < 42; s += 1) {
              const t0 = s / 42;
              const t1 = (s + 1) / 42;
              const p0 = oneWTCCrossSection(t0)[vertexIndex].setY(baseY + t0 * height);
              const p1 = oneWTCCrossSection(t1)[vertexIndex].setY(baseY + t1 * height);
              const outward = p0.clone().setY(0).normalize();
              pushSegment(p0.addScaledVector(outward, 0.28), p1.addScaledVector(outward, 0.28));
            }
          }

          const geometry = trackGeometry(new THREE.BufferGeometry());
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
          const edges = new THREE.LineSegments(geometry, edgeMat);
          edges.name = "One WTC eight main facet arrises";
          building.add(edges);
        }

        function addBaseVerticalFins(half = 45, height = 52) {
          const finSpacing = 2.45;
          for (let x = -half + 2; x <= half - 2; x += finSpacing) {
            addBox(0.18, height * 0.88, 0.52, x, height * 0.52, half + 0.46, mullionMat);
            addBox(0.18, height * 0.88, 0.52, x, height * 0.52, -half - 0.46, mullionMat);
          }

          for (let z = -half + 2; z <= half - 2; z += finSpacing) {
            addBox(0.52, height * 0.88, 0.18, half + 0.46, height * 0.52, z, mullionMat);
            addBox(0.52, height * 0.88, 0.18, -half - 0.46, height * 0.52, z, mullionMat);
          }

          for (let y = 5.4; y <= height - 3.5; y += 3.6) {
            addBox(half * 2 + 1.2, 0.18, 0.44, 0, y, half + 0.62, steelMat);
            addBox(half * 2 + 1.2, 0.18, 0.44, 0, y, -half - 0.62, steelMat);
            addBox(0.44, 0.18, half * 2 + 1.2, half + 0.62, y, 0, steelMat);
            addBox(0.44, 0.18, half * 2 + 1.2, -half - 0.62, y, 0, steelMat);
          }
        }

        function addBase() {
          const baseHeight = 52;
          const half = 45;
          const bottom = footprintFromChamferHalf(half, 0.02);
          const top = footprintFromChamferHalf(half, 0.02);
          addMesh(prismFromFootprints(bottom, top, baseHeight), baseGlassMat, [0, baseHeight / 2, 0]);

          addBaseVerticalFins(half, baseHeight);

          const entranceY = 7.5;
          addBox(8.8, 14.5, 0.64, -15.5, entranceY, half + 0.78, blackMat);
          addBox(8.8, 14.5, 0.64, 15.5, entranceY, half + 0.78, blackMat);
          addBox(0.64, 14.5, 8.8, half + 0.78, entranceY, -15.5, blackMat);
          addBox(0.64, 14.5, 8.8, -half - 0.78, entranceY, 15.5, blackMat);

          addBox(half * 2 + 5.8, 1.3, half * 2 + 5.8, 0, 0.65, 0, darkSteelMat);
          addBox(half * 2 + 3.4, 1.05, 3.0, 0, baseHeight + 1.0, half + 1.3, steelMat);
          addBox(half * 2 + 3.4, 1.05, 3.0, 0, baseHeight + 1.0, -half - 1.3, steelMat);
          addBox(3.0, 1.05, half * 2 + 3.4, half + 1.3, baseHeight + 1.0, 0, steelMat);
          addBox(3.0, 1.05, half * 2 + 3.4, -half - 1.3, baseHeight + 1.0, 0, steelMat);
        }

        function addTopParapetAndSpire(topY: number) {
          const parapetHalf = 35.9;
          const parapetFootprint = footprintFromChamferHalf(parapetHalf, 0.975);
          const parapet = addMesh(prismFromFootprints(parapetFootprint, parapetFootprint, 8.2), steelMat, [0, topY + 4.1, 0]);
          parapet.name = "Rotated square glass parapet at the top of One WTC";

          const mechanicalFootprint = footprintFromChamferHalf(20.2, 0.82);
          addMesh(prismFromFootprints(mechanicalFootprint, mechanicalFootprint, 8.5), darkSteelMat, [0, topY + 11.2, 0]);

          const ring = new THREE.Mesh(trackGeometry(new THREE.TorusGeometry(14.4, 0.6, 12, 84)), darkSteelMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(0, topY + 17.1, 0);
          ring.castShadow = true;
          building.add(ring);

          const lowerMast = addMesh(cylinderGeometry(2.35, 3.1, 13.2, 36), steelMat, [0, topY + 25.5, 0]);
          lowerMast.name = "One WTC mast base";

          const mast = addMesh(cylinderGeometry(0.72, 1.1, 99, 32), steelMat, [0, topY + 80.4, 0]);
          mast.name = "One WTC slender spire mast";

          for (let i = 0; i < 12; i += 1) {
            const y = topY + 37 + i * 7.2;
            const radius = Math.max(0.55, 1.38 - i * 0.052);
            addMesh(cylinderGeometry(radius + 0.2, radius + 0.2, 0.48, 28), darkSteelMat, [0, y, 0]);
          }

          addMesh(cylinderGeometry(0.26, 0.48, 20, 24), steelMat, [0, topY + 141.5, 0]);
          addMesh(trackGeometry(new THREE.SphereGeometry(1.15, 24, 16)), beaconMat, [0, topY + 152.1, 0]);

          const cableVertices: number[] = [];
          for (let i = 0; i < 16; i += 1) {
            const angle = (i / 16) * Math.PI * 2;
            const x = Math.cos(angle) * 14.1;
            const z = Math.sin(angle) * 14.1;
            cableVertices.push(x, topY + 17.2, z, 0, topY + 66.5, 0);
          }
          const cableGeometry = trackGeometry(new THREE.BufferGeometry());
          cableGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cableVertices, 3));
          const cables = new THREE.LineSegments(cableGeometry, cableMat);
          cables.name = "Cable-stayed support lines around the spire";
          building.add(cables);

          const beacon = new THREE.PointLight(0xe7f5ff, 2.4, 125, 2);
          beacon.position.set(0, topY + 152.1, 0);
          building.add(beacon);
        }

        addBase();

        const towerBaseY = 52;
        const towerHeight = 292;
        addTowerSkin(towerBaseY, towerHeight);
        addFacadeGrid(towerBaseY, towerHeight);
        addTowerFacetEdges(towerBaseY, towerHeight);
        addTopParapetAndSpire(towerBaseY + towerHeight);

        building.position.y = -14;

        function resize() {
          const { clientWidth, clientHeight } = mount;
          const width = Math.max(clientWidth, 1);
          const height = Math.max(clientHeight, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();

        let frameId = 0;
        const render = () => {
          controls.update();
          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(render);
        };
        render();

        return () => {
          window.cancelAnimationFrame(frameId);
          resizeObserver.disconnect();
          controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          allGeometries.forEach((geometry) => geometry.dispose());
          allMaterials.forEach((material) => material.dispose());
        };
      }, []);

      return <div ref={mountRef} className="h-screen w-full overflow-hidden bg-slate-50" />;
    }

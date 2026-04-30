import React, { useEffect, useRef } from "react";
import \* as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Taipei101PureThreeScene() {
const mountRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
const mount = mountRef.current;
if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x091116);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000);
    camera.position.set(110, 190, 360);
    camera.lookAt(0, 205, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 205, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 120;
    controls.maxDistance = 720;
    controls.maxPolarAngle = Math.PI * 0.92;

    scene.add(new THREE.HemisphereLight(0xaedaff, 0x182025, 2.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(120, 260, 160);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 20;
    keyLight.shadow.camera.far = 720;
    keyLight.shadow.camera.left = -160;
    keyLight.shadow.camera.right = 160;
    keyLight.shadow.camera.top = 460;
    keyLight.shadow.camera.bottom = -60;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9ee7ff, 1.35);
    rimLight.position.set(-160, 190, -160);
    scene.add(rimLight);

    const building = new THREE.Group();
    building.name = "Procedural Taipei 101 building only";
    scene.add(building);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x4fa9a2,
      metalness: 0.18,
      roughness: 0.34,
      transmission: 0.05,
      transparent: true,
      opacity: 0.92,
      clearcoat: 0.75,
      clearcoatRoughness: 0.2,
      reflectivity: 0.68,
    });

    const darkerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x173f43,
      metalness: 0.22,
      roughness: 0.42,
      transparent: true,
      opacity: 0.94,
      clearcoat: 0.55,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xc9e6df,
      metalness: 0.78,
      roughness: 0.3,
    });

    const darkFrameMat = new THREE.MeshStandardMaterial({
      color: 0x113136,
      metalness: 0.72,
      roughness: 0.38,
    });

    const ledgeMat = new THREE.MeshStandardMaterial({
      color: 0x8ccfc3,
      metalness: 0.58,
      roughness: 0.32,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xe3f5e8,
      metalness: 0.42,
      roughness: 0.36,
    });

    const warmLightMat = new THREE.MeshStandardMaterial({
      color: 0xfff5bd,
      emissive: 0xffd66b,
      emissiveIntensity: 1.35,
      roughness: 0.4,
    });

    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x6cc9b7,
      metalness: 0.55,
      roughness: 0.28,
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x14373d,
      metalness: 0.7,
      roughness: 0.31,
    });

    const allGeometries: THREE.BufferGeometry[] = [];
    const allMaterials: THREE.Material[] = [
      glassMat,
      darkerGlassMat,
      frameMat,
      darkFrameMat,
      ledgeMat,
      accentMat,
      warmLightMat,
      crownMat,
      roofMat,
    ];

    const trackGeometry = (geometry: THREE.BufferGeometry) => {
      allGeometries.push(geometry);
      return geometry;
    };

    function widthAt(bottomWidth: number, topWidth: number, t: number) {
      // Interpolacao linear: a parede fica reta e inclinada, sem curvatura ao longo da altura.
      const clamped = THREE.MathUtils.clamp(t, 0, 1);
      return bottomWidth + (topWidth - bottomWidth) * clamped;
    }

    function chamferedFootprint(width: number, depth: number, cutRatio = 0.105) {
      const cut = Math.min(width, depth) * cutRatio;
      const hw = width / 2;
      const hd = depth / 2;

      return [
        new THREE.Vector3(-hw + cut, 0, hd),
        new THREE.Vector3(hw - cut, 0, hd),
        new THREE.Vector3(hw, 0, hd - cut),
        new THREE.Vector3(hw, 0, -hd + cut),
        new THREE.Vector3(hw - cut, 0, -hd),
        new THREE.Vector3(-hw + cut, 0, -hd),
        new THREE.Vector3(-hw, 0, -hd + cut),
        new THREE.Vector3(-hw, 0, hd - cut),
      ];
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

    function pushFan(
      positions: number[],
      indices: number[],
      points: THREE.Vector3[],
      reverse = false,
    ) {
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

    function taperedBoxGeometry(
      bottomWidth: number,
      bottomDepth: number,
      topWidth: number,
      topDepth: number,
      height: number,
      cornerCutRatio = 0.105,
    ) {
      const y0 = -height / 2;
      const y1 = height / 2;
      const bottom = chamferedFootprint(bottomWidth, bottomDepth, cornerCutRatio).map((p) => p.setY(y0));
      const top = chamferedFootprint(topWidth, topDepth, cornerCutRatio).map((p) => p.setY(y1));

      const positions: number[] = [];
      const indices: number[] = [];

      // O footprint agora tem oito lados. As quatro quinas sao chanfradas, como no Taipei 101 real.
      // Cada segmento continua abrindo para fora no topo, mas as paredes de canto deixam de ser um canto reto de 90 graus.
      for (let i = 0; i < bottom.length; i += 1) {
        const next = (i + 1) % bottom.length;
        pushQuad(positions, indices, bottom[i], bottom[next], top[next], top[i]);
      }

      pushFan(positions, indices, top, false);
      pushFan(positions, indices, bottom, true);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return trackGeometry(geometry);
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
      boxCache.set(key, geometry as THREE.BoxGeometry);
      return geometry as THREE.BoxGeometry;
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

    function addHorizontalBelt(
      y: number,
      width: number,
      depth: number,
      thickness = 0.42,
      projection = 0.62,
      material: THREE.Material = darkFrameMat,
    ) {
      addBox(width + 1.3, thickness, 0.5, 0, y, depth / 2 + projection, material);
      addBox(width + 1.3, thickness, 0.5, 0, y, -depth / 2 - projection, material);
      addBox(0.5, thickness, depth + 1.3, width / 2 + projection, y, 0, material);
      addBox(0.5, thickness, depth + 1.3, -width / 2 - projection, y, 0, material);
    }

    function addEave(y: number, width: number, depth: number, scale = 1) {
      addBox(width + 5.8 * scale, 1.05 * scale, 1.8 * scale, 0, y, depth / 2 + 1.05 * scale, ledgeMat);
      addBox(width + 5.8 * scale, 1.05 * scale, 1.8 * scale, 0, y, -depth / 2 - 1.05 * scale, ledgeMat);
      addBox(1.8 * scale, 1.05 * scale, depth + 5.8 * scale, width / 2 + 1.05 * scale, y, 0, ledgeMat);
      addBox(1.8 * scale, 1.05 * scale, depth + 5.8 * scale, -width / 2 - 1.05 * scale, y, 0, ledgeMat);

      addBox(width + 3.8 * scale, 0.48 * scale, 0.8 * scale, 0, y + 1.05 * scale, depth / 2 + 1.85 * scale, accentMat);
      addBox(width + 3.8 * scale, 0.48 * scale, 0.8 * scale, 0, y + 1.05 * scale, -depth / 2 - 1.85 * scale, accentMat);
      addBox(0.8 * scale, 0.48 * scale, depth + 3.8 * scale, width / 2 + 1.85 * scale, y + 1.05 * scale, 0, accentMat);
      addBox(0.8 * scale, 0.48 * scale, depth + 3.8 * scale, -width / 2 - 1.85 * scale, y + 1.05 * scale, 0, accentMat);

      // Placas diagonais nas quinas da borda. Elas acompanham o chanfro da massa principal
      // e deixam a transicao entre as faces mais parecida com o detalhe real do Taipei 101.
      const cornerOffsetX = width / 2 + 1.42 * scale;
      const cornerOffsetZ = depth / 2 + 1.42 * scale;
      const rotations = [
        { sx: 1, sz: 1, r: Math.PI / 4 },
        { sx: -1, sz: 1, r: -Math.PI / 4 },
        { sx: 1, sz: -1, r: -Math.PI / 4 },
        { sx: -1, sz: -1, r: Math.PI / 4 },
      ];

      rotations.forEach(({ sx, sz, r }) => {
        const plate = addBox(3.0 * scale, 1.12 * scale, 0.66 * scale, sx * cornerOffsetX, y + 0.12 * scale, sz * cornerOffsetZ, ledgeMat);
        plate.rotation.y = r;

        const brightCap = addBox(2.0 * scale, 0.46 * scale, 0.34 * scale, sx * (cornerOffsetX + 0.08 * scale), y + 1.03 * scale, sz * (cornerOffsetZ + 0.08 * scale), accentMat);
        brightCap.rotation.y = r;
      });
    }

    function cornerChamferSegment(width: number, depth: number, sx: number, sz: number, cutRatio = 0.11) {
      const cut = Math.min(width, depth) * cutRatio;
      const hw = width / 2;
      const hd = depth / 2;

      // Segmento diagonal exato do chanfro daquele andar.
      // Ele usa o mesmo footprint da parede principal, por isso acompanha a inclinacao real da face.
      return {
        a: new THREE.Vector3(sx * (hw - cut), 0, sz * hd),
        b: new THREE.Vector3(sx * hw, 0, sz * (hd - cut)),
      };
    }

    function offsetAlongCornerNormal(point: THREE.Vector3, sx: number, sz: number, amount: number) {
      const normal = new THREE.Vector3(sx, 0, sz).normalize();
      return point.clone().addScaledVector(normal, amount);
    }

    function addSlopedCornerPlate(
      baseY: number,
      height: number,
      bottomWidth: number,
      bottomDepth: number,
      topWidth: number,
      topDepth: number,
      sx: number,
      sz: number,
      material: THREE.Material,
      insetFactor = 0.5,
      outwardOffset = 0.18,
      cornerCutRatio = 0.11,
    ) {
      const bottom = cornerChamferSegment(bottomWidth, bottomDepth, sx, sz, cornerCutRatio);
      const top = cornerChamferSegment(topWidth, topDepth, sx, sz, cornerCutRatio);
      const outward = new THREE.Vector3(sx, 0, sz).normalize();
      const safeOffset = Math.abs(outwardOffset);

      const makeInsetPair = (segment: { a: THREE.Vector3; b: THREE.Vector3 }, y: number) => {
        const center = segment.a.clone().lerp(segment.b, 0.5);
        const tangent = segment.b.clone().sub(segment.a).normalize();
        const half = segment.a.distanceTo(segment.b) * insetFactor * 0.5;

        return {
          p0: center.clone().addScaledVector(tangent, -half).setY(y).addScaledVector(outward, safeOffset),
          p1: center.clone().addScaledVector(tangent, half).setY(y).addScaledVector(outward, safeOffset),
        };
      };

      const bottomPair = makeInsetPair(bottom, baseY);
      const topPair = makeInsetPair(top, baseY + height);

      let b0 = bottomPair.p0;
      let b1 = bottomPair.p1;
      let t0 = topPair.p0;
      let t1 = topPair.p1;

      // Garante que a face visivel esteja sempre para fora em todas as quatro quinas.
      // Antes, duas quinas ficavam com a ordem invertida e pareciam entrar no volume.
      const faceNormal = new THREE.Vector3()
        .crossVectors(b1.clone().sub(b0), t1.clone().sub(b0))
        .normalize();

      if (faceNormal.dot(outward) < 0) {
        [b0, b1] = [b1, b0];
        [t0, t1] = [t1, t0];
      }

      const positions: number[] = [];
      const indices: number[] = [];
      pushQuad(positions, indices, b0, b1, t1, t0);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      return addMesh(trackGeometry(geometry), material, [0, 0, 0]);
    }

    function addCornerWallDetails(
      baseY: number,
      height: number,
      bottomWidth: number,
      bottomDepth: number,
      topWidth: number,
      topDepth: number,
      scale = 1,
      cornerCutRatio = 0.11,
    ) {
      const detailBaseY = baseY + height * 0.08;
      const detailHeight = height * 0.84;
      const corners = [
        { sx: 1, sz: 1 },
        { sx: -1, sz: 1 },
        { sx: 1, sz: -1 },
        { sx: -1, sz: -1 },
      ];

      corners.forEach(({ sx, sz }) => {
        // Faixa escura larga: inclinada junto com a propria quina chanfrada da parede.
        addSlopedCornerPlate(
          detailBaseY,
          detailHeight,
          widthAt(bottomWidth, topWidth, 0.08),
          widthAt(bottomDepth, topDepth, 0.08),
          widthAt(bottomWidth, topWidth, 0.92),
          widthAt(bottomDepth, topDepth, 0.92),
          sx,
          sz,
          darkFrameMat,
          0.82,
          0.19 * scale,
          cornerCutRatio,
        );

        // Nervura clara central: tambem inclinada, sem ficar vertical/flutuando fora da face.
        addSlopedCornerPlate(
          detailBaseY + detailHeight * 0.04,
          detailHeight * 0.92,
          widthAt(bottomWidth, topWidth, 0.115),
          widthAt(bottomDepth, topDepth, 0.115),
          widthAt(bottomWidth, topWidth, 0.885),
          widthAt(bottomDepth, topDepth, 0.885),
          sx,
          sz,
          frameMat,
          0.24,
          0.26 * scale,
          cornerCutRatio,
        );
      });
    }

    function addCornerClasp(y: number, width: number, depth: number, scale = 1) {
      const corners = [
        { sx: 1, sz: 1 },
        { sx: -1, sz: 1 },
        { sx: 1, sz: -1 },
        { sx: -1, sz: -1 },
      ];

      corners.forEach(({ sx, sz }) => {
        const x = sx * (width / 2 + 1.55 * scale);
        const z = sz * (depth / 2 + 1.55 * scale);

        const boss = addMesh(trackGeometry(new THREE.SphereGeometry(0.58 * scale, 16, 10)), accentMat, [x, y, z]);
        boss.scale.set(1.0, 0.62, 1.0);

        addBox(1.5 * scale, 0.28 * scale, 0.22 * scale, x - sx * 0.55 * scale, y, z, accentMat);
        addBox(0.22 * scale, 0.28 * scale, 1.5 * scale, x, y, z - sz * 0.55 * scale, accentMat);
        addBox(0.26 * scale, 1.35 * scale, 0.26 * scale, x, y - 0.82 * scale, z, accentMat);
      });
    }

    function addMullions(
      baseY: number,
      height: number,
      bottomWidth: number,
      bottomDepth: number,
      topWidth: number,
      topDepth: number,
      count: number,
    ) {
      const midWidth = (bottomWidth + topWidth) * 0.5;
      const midDepth = (bottomDepth + topDepth) * 0.5;
      const y = baseY + height * 0.52;
      const h = height * 0.82;

      for (let i = 1; i < count; i += 1) {
        const f = i / count - 0.5;
        const x = f * midWidth * 0.92;
        addBox(0.18, h, 0.22, x, y, midDepth / 2 + 0.35, frameMat);
        addBox(0.18, h, 0.22, x, y, -midDepth / 2 - 0.35, frameMat);
      }

      for (let i = 1; i < count - 1; i += 1) {
        const f = i / count - 0.5;
        const z = f * midDepth * 0.88;
        addBox(0.22, h, 0.18, midWidth / 2 + 0.35, y, z, frameMat);
        addBox(0.22, h, 0.18, -midWidth / 2 - 0.35, y, z, frameMat);
      }
    }

    function addAncientCoinMotif(y: number, width: number, depth: number, size = 1) {
      const torusGeometry = trackGeometry(new THREE.TorusGeometry(2.45 * size, 0.22 * size, 10, 36));
      const squareGeometry = boxGeometry(1.6 * size, 1.6 * size, 0.18 * size);

      const front = new THREE.Mesh(torusGeometry, accentMat);
      front.position.set(0, y, depth / 2 + 0.94 * size);
      front.castShadow = true;
      building.add(front);

      const back = front.clone();
      back.position.z = -depth / 2 - 0.94 * size;
      back.rotation.y = Math.PI;
      building.add(back);

      const right = new THREE.Mesh(torusGeometry, accentMat);
      right.rotation.y = Math.PI / 2;
      right.position.set(width / 2 + 0.94 * size, y, 0);
      right.castShadow = true;
      building.add(right);

      const left = right.clone();
      left.position.x = -width / 2 - 0.94 * size;
      left.rotation.y = -Math.PI / 2;
      building.add(left);

      addMesh(squareGeometry, darkFrameMat, [0, y, depth / 2 + 1.02 * size]);
      addMesh(squareGeometry, darkFrameMat, [0, y, -depth / 2 - 1.02 * size]);

      const rSquare = addMesh(squareGeometry, darkFrameMat, [width / 2 + 1.02 * size, y, 0]);
      rSquare.rotation.y = Math.PI / 2;
      const lSquare = addMesh(squareGeometry, darkFrameMat, [-width / 2 - 1.02 * size, y, 0]);
      lSquare.rotation.y = Math.PI / 2;
    }

    function addLayeredModule(
      index: number,
      baseY: number,
      height: number,
      bottomWidth: number,
      bottomDepth: number,
      topWidth: number,
      topDepth: number,
    ) {
      const module = addMesh(
        taperedBoxGeometry(bottomWidth, bottomDepth, topWidth, topDepth, height, 0.11),
        glassMat,
        [0, baseY + height / 2, 0],
      );
      module.name = `Taipei 101 bamboo/pagoda segment ${index + 1}`;

      // Quinas reais do Taipei 101: canto chanfrado + nervura vertical + pequeno conjunto metalico na divisao dos modulos.
      // O detalhe fica integrado na parede, nao como um pilar quadrado separado.
      addCornerWallDetails(baseY, height, bottomWidth, bottomDepth, topWidth, topDepth, 1);
      addCornerClasp(baseY + height - 1.35, topWidth, topDepth, 0.95);

      // Parede limpa: mantemos apenas o volume inclinado, a quina chanfrada e a borda estrutural entre os módulos.
      // A borda fica exatamente no encontro entre um modulo e o proximo.
      addEave(baseY + height, topWidth, topDepth, 1);
    }

    function addFacadeWindowGrid() {
      const paneGeometry = trackGeometry(new THREE.BoxGeometry(0.42, 0.18, 0.08));
      const paneMat = new THREE.MeshStandardMaterial({
        color: 0xbef7ee,
        emissive: 0x4fbfb4,
        emissiveIntensity: 0.5,
        metalness: 0.15,
        roughness: 0.32,
      });
      allMaterials.push(paneMat);

      const instances: THREE.Matrix4[] = [];
      const matrix = new THREE.Matrix4();
      const quatFront = new THREE.Quaternion();
      const quatBack = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
      const quatRight = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
      const quatLeft = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      const scale = new THREE.Vector3(1, 1, 1);

      const pushPane = (x: number, y: number, z: number, q: THREE.Quaternion) => {
        matrix.compose(new THREE.Vector3(x, y, z), q, scale);
        instances.push(matrix.clone());
      };

      modules.forEach((m, moduleIndex) => {
        for (let floor = 0; floor < 8; floor += 1) {
          const y = m.baseY + 3.2 + floor * (m.height / 8) + 1.1;
          const t = (y - m.baseY) / m.height;
          const w = widthAt(m.bottomWidth, m.topWidth, t);
          const d = widthAt(m.bottomDepth, m.topDepth, t);
          for (let column = -4; column <= 4; column += 1) {
            if ((column + floor + moduleIndex) % 3 !== 0) continue;
            const x = (column / 4.8) * (w * 0.39);
            pushPane(x, y, d / 2 + 0.74, quatFront);
            pushPane(x, y, -d / 2 - 0.74, quatBack);
          }
          for (let column = -3; column <= 3; column += 1) {
            if ((column * 2 + floor + moduleIndex) % 4 !== 0) continue;
            const z = (column / 4.2) * (d * 0.42);
            pushPane(w / 2 + 0.74, y, z, quatRight);
            pushPane(-w / 2 - 0.74, y, z, quatLeft);
          }
        }
      });

      const instanced = new THREE.InstancedMesh(paneGeometry, paneMat, instances.length);
      instances.forEach((m, i) => instanced.setMatrixAt(i, m));
      instanced.instanceMatrix.needsUpdate = true;
      instanced.castShadow = false;
      instanced.receiveShadow = false;
      building.add(instanced);
    }

    // Base and podium: a compact version of the lower Taipei 101 retail/office plinth.
    addBox(78, 6, 58, 0, 3, 0, darkFrameMat);
    addBox(70, 13, 50, 0, 12.5, 0, darkerGlassMat);
    addBox(58, 9, 42, 0, 23.5, 0, glassMat);
    addBox(36, 10, 12, 0, 12.8, 25.9, roofMat);
    addBox(13, 7, 9, -22, 13.2, 27.5, ledgeMat);
    addBox(13, 7, 9, 22, 13.2, 27.5, ledgeMat);

    addEave(29.8, 62, 45, 1.15);

    // Sloping transition between the plinth and the bamboo-stack tower.
    // This lower block narrows upward, while the main eight tiers above flare outward individually.
    addMesh(taperedBoxGeometry(58, 44, 43, 34, 38, 0.095), glassMat, [0, 49, 0]);
    addCornerWallDetails(30, 38, 58, 44, 43, 34, 1.05);
    addCornerClasp(67.6, 43, 34, 0.9);
    addEave(69, 43, 34, 1.05);

    const moduleHeight = 30.6;
    const firstModuleBaseY = 69.2;
    const moduleOverlap = 0.18;
    const moduleStep = moduleHeight - moduleOverlap;

    const modules = Array.from({ length: 8 }, (_, index) => {
      const baseY = firstModuleBaseY + index * moduleStep;
      // Cada modulo começa mais estreito embaixo e abre para fora com faces retas inclinadas.
      // A torre inteira ainda afina conforme sobe, mantendo a silhueta do Taipei 101.
      const bottomWidth = 38.6 - index * 1.78;
      const bottomDepth = 30.9 - index * 1.42;
      const topWidth = bottomWidth + 8.2;
      const topDepth = bottomDepth + 6.25;
      return { baseY, height: moduleHeight, bottomWidth, bottomDepth, topWidth, topDepth };
    });

    modules.forEach((module, index) => addLayeredModule(index, module.baseY, module.height, module.bottomWidth, module.bottomDepth, module.topWidth, module.topDepth));

    const lastModule = modules[modules.length - 1];
    const crownBaseY = lastModule.baseY + lastModule.height - 0.1;

    // Upper crown, observation tiers and narrowing pagoda cap.
    // Os blocos da coroa tambem ficam encostados, sem espacos verticais.
    addMesh(taperedBoxGeometry(31, 25, 26, 21, 16, 0.12), crownMat, [0, crownBaseY + 8, 0]);
    addCornerWallDetails(crownBaseY, 16, 31, 25, 26, 21, 0.72);
    addCornerClasp(crownBaseY + 15.1, 26, 21, 0.64);
    addEave(crownBaseY + 16, 26, 21, 0.82);

    addMesh(taperedBoxGeometry(25, 20, 20, 16, 13, 0.12), glassMat, [0, crownBaseY + 22.5, 0]);
    addCornerWallDetails(crownBaseY + 16, 13, 25, 20, 20, 16, 0.58);
    addEave(crownBaseY + 29, 20, 16, 0.62);

    addMesh(taperedBoxGeometry(17, 13.5, 13, 10, 12, 0.13), darkerGlassMat, [0, crownBaseY + 35, 0]);
    addCornerWallDetails(crownBaseY + 29, 12, 17, 13.5, 13, 10, 0.46);
    addEave(crownBaseY + 41, 13, 10, 0.5);

    addMesh(taperedBoxGeometry(11.5, 9, 8, 6.5, 10, 0.14), crownMat, [0, crownBaseY + 46, 0]);
    addCornerWallDetails(crownBaseY + 41, 10, 11.5, 9, 8, 6.5, 0.34);
    addEave(crownBaseY + 51, 8, 6.5, 0.4);

    const cylinderCache = new Map<string, THREE.CylinderGeometry>();
    function cylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radialSegments = 32) {
      const key = `${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
      const cached = cylinderCache.get(key);
      if (cached) return cached;
      const geometry = trackGeometry(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
      cylinderCache.set(key, geometry as THREE.CylinderGeometry);
      return geometry as THREE.CylinderGeometry;
    }

    addMesh(cylinderGeometry(4.2, 5.6, 5.8, 32), roofMat, [0, crownBaseY + 54, 0]);
    addMesh(cylinderGeometry(2.7, 3.5, 7.5, 32), crownMat, [0, crownBaseY + 60.65, 0]);
    addMesh(cylinderGeometry(1.15, 2.0, 26, 24), frameMat, [0, crownBaseY + 77.4, 0]);
    addMesh(cylinderGeometry(0.45, 0.8, 31, 20), accentMat, [0, crownBaseY + 105.9, 0]);
    addMesh(trackGeometry(new THREE.SphereGeometry(1.35, 24, 16)), warmLightMat, [0, crownBaseY + 122.75, 0]);

    // Slender antenna rings and beacon details.
    for (let i = 0; i < 5; i += 1) {
      addMesh(cylinderGeometry(1.45 - i * 0.15, 1.45 - i * 0.15, 0.45, 24), ledgeMat, [0, crownBaseY + 67 + i * 7.2, 0]);
    }

    const topBeacon = new THREE.PointLight(0xffe7a5, 2.2, 85, 2.0);
    topBeacon.position.set(0, crownBaseY + 122.75, 0);
    building.add(topBeacon);

    // Add crisp architectural outlines to the primary massing without turning the scene into wireframe.
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xbfece6, transparent: true, opacity: 0.24 });
    allMaterials.push(edgeMat);
    building.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const geometry = child.geometry;
      if (!geometry || geometry instanceof THREE.TorusGeometry) return;
      const edgeGeometry = trackGeometry(new THREE.EdgesGeometry(geometry, 32));
      const edges = new THREE.LineSegments(edgeGeometry, edgeMat);
      edges.position.copy(child.position);
      edges.rotation.copy(child.rotation);
      edges.scale.copy(child.scale);
      building.add(edges);
    });

    // Center building vertically and horizontally in the scene; no surrounding city, landscape or animated camera.
    building.position.y = -18;

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

return <div ref={mountRef} className="h-screen w-full overflow-hidden bg-slate-950" />;
}

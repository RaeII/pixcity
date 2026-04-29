import React, { useEffect, useRef } from "react";
import \* as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function EmpireStateBuildingScene() {
const mountRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
const mount = mountRef.current;
if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f1ed);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      520
    );
    camera.position.set(62, 64, 112);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 58, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.minDistance = 48;
    controls.maxDistance = 190;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    const building = new THREE.Group();
    scene.add(building);

    const limestone = new THREE.MeshStandardMaterial({
      color: 0xcdbf9e,
      roughness: 0.82,
      metalness: 0.02,
    });

    const limestoneLight = new THREE.MeshStandardMaterial({
      color: 0xe2d5b6,
      roughness: 0.78,
      metalness: 0.02,
    });

    const limestoneDark = new THREE.MeshStandardMaterial({
      color: 0x9d9178,
      roughness: 0.86,
      metalness: 0.01,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x17222a,
      roughness: 0.38,
      metalness: 0.28,
    });

    const darkWindowMat = new THREE.MeshStandardMaterial({
      color: 0x0c1217,
      roughness: 0.42,
      metalness: 0.22,
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x3d2418,
      roughness: 0.72,
      metalness: 0.04,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x73797d,
      roughness: 0.32,
      metalness: 0.72,
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x2b343b,
      roughness: 0.42,
      metalness: 0.62,
    });

    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });

    const addBox = (
      group: THREE.Group,
      size: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
      castShadow = true,
      receiveShadow = true
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      group.add(mesh);
      return mesh;
    };

    const addVolume = (
      group: THREE.Group,
      width: number,
      depth: number,
      height: number,
      y: number,
      material: THREE.Material
    ) => addBox(group, [width, height, depth], [0, y + height / 2, 0], material);

    const addCylinder = (
      group: THREE.Group,
      radiusTop: number,
      radiusBottom: number,
      height: number,
      position: [number, number, number],
      material: THREE.Material,
      segments = 32
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, false),
        material
      );
      mesh.position.set(position[0], position[1], position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    const addCone = (
      group: THREE.Group,
      radius: number,
      height: number,
      position: [number, number, number],
      material: THREE.Material,
      segments = 32
    ) => {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, segments), material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    const addFacadeWindows = ({
      face,
      width,
      depth,
      yStart,
      yEnd,
      columns,
      rows,
      bayWidth,
      bayHeight,
      inset = 0.09,
      xOffset = 0,
      zOffset = 0,
      material = windowMat,
    }: {
      face: "front" | "back" | "left" | "right";
      width: number;
      depth: number;
      yStart: number;
      yEnd: number;
      columns: number;
      rows: number;
      bayWidth: number;
      bayHeight: number;
      inset?: number;
      xOffset?: number;
      zOffset?: number;
      material?: THREE.Material;
    }) => {
      const faceGroup = new THREE.Group();
      building.add(faceGroup);

      const horizontalSpan = face === "front" || face === "back" ? width : depth;
      const verticalSpan = yEnd - yStart;
      const columnPitch = horizontalSpan / columns;
      const rowPitch = verticalSpan / rows;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const u = -horizontalSpan / 2 + columnPitch * (col + 0.5);
          const y = yStart + rowPitch * (row + 0.5);

          let size: [number, number, number];
          let position: [number, number, number];

          if (face === "front") {
            size = [bayWidth, bayHeight, 0.055];
            position = [u + xOffset, y, depth / 2 + inset + zOffset];
          } else if (face === "back") {
            size = [bayWidth, bayHeight, 0.055];
            position = [u + xOffset, y, -depth / 2 - inset + zOffset];
          } else if (face === "right") {
            size = [0.055, bayHeight, bayWidth];
            position = [width / 2 + inset + xOffset, y, u + zOffset];
          } else {
            size = [0.055, bayHeight, bayWidth];
            position = [-width / 2 - inset + xOffset, y, u + zOffset];
          }

          addBox(faceGroup, size, position, material, false, true);
        }
      }

      return faceGroup;
    };

    const addVerticalPierSet = ({
      face,
      width,
      depth,
      yStart,
      yEnd,
      count,
      pierWidth,
      offset = 0.18,
      material = limestoneLight,
    }: {
      face: "front" | "back" | "left" | "right";
      width: number;
      depth: number;
      yStart: number;
      yEnd: number;
      count: number;
      pierWidth: number;
      offset?: number;
      material?: THREE.Material;
    }) => {
      const span = face === "front" || face === "back" ? width : depth;
      const pitch = span / count;
      for (let i = 0; i <= count; i++) {
        const u = -span / 2 + i * pitch;
        const h = yEnd - yStart;
        if (face === "front") {
          addBox(building, [pierWidth, h, 0.28], [u, yStart + h / 2, depth / 2 + offset], material);
        } else if (face === "back") {
          addBox(building, [pierWidth, h, 0.28], [u, yStart + h / 2, -depth / 2 - offset], material);
        } else if (face === "right") {
          addBox(building, [0.28, h, pierWidth], [width / 2 + offset, yStart + h / 2, u], material);
        } else {
          addBox(building, [0.28, h, pierWidth], [-width / 2 - offset, yStart + h / 2, u], material);
        }
      }
    };

    const addHorizontalBand = (
      width: number,
      depth: number,
      y: number,
      thickness: number,
      overhang: number,
      material: THREE.Material
    ) => {
      addBox(building, [width + overhang, thickness, depth + overhang], [0, y, 0], material);
    };

    const addWindowBaysOnVolume = (
      width: number,
      depth: number,
      yStart: number,
      yEnd: number,
      colsFront: number,
      colsSide: number,
      rows: number
    ) => {
      addFacadeWindows({ face: "front", width, depth, yStart, yEnd, columns: colsFront, rows, bayWidth: 0.54, bayHeight: 0.86 });
      addFacadeWindows({ face: "back", width, depth, yStart, yEnd, columns: colsFront, rows, bayWidth: 0.54, bayHeight: 0.86 });
      addFacadeWindows({ face: "right", width, depth, yStart, yEnd, columns: colsSide, rows, bayWidth: 0.54, bayHeight: 0.86 });
      addFacadeWindows({ face: "left", width, depth, yStart, yEnd, columns: colsSide, rows, bayWidth: 0.54, bayHeight: 0.86 });

      addVerticalPierSet({ face: "front", width, depth, yStart, yEnd, count: colsFront, pierWidth: 0.12 });
      addVerticalPierSet({ face: "back", width, depth, yStart, yEnd, count: colsFront, pierWidth: 0.12 });
      addVerticalPierSet({ face: "right", width, depth, yStart, yEnd, count: colsSide, pierWidth: 0.12 });
      addVerticalPierSet({ face: "left", width, depth, yStart, yEnd, count: colsSide, pierWidth: 0.12 });
    };

    // Main Art Deco massing. The proportions are stylized for a Three.js model, but the
    // key Empire State Building language is preserved: wide base, vertical shaft,
    // stepped setbacks, observation crown, mooring mast and thin antenna.
    addVolume(building, 42, 28, 8, 0, limestone);
    addVolume(building, 34, 24, 10, 8, limestone);
    addVolume(building, 28, 21, 10, 18, limestone);
    addVolume(building, 23, 18, 62, 28, limestone);
    addVolume(building, 18.8, 15.4, 10, 90, limestoneLight);
    addVolume(building, 14.4, 11.6, 8, 100, limestone);
    addVolume(building, 10.6, 8.4, 5.8, 108, limestoneLight);
    addVolume(building, 7.3, 6.0, 4.8, 113.8, limestone);

    // Dark setback roofs and Art Deco horizontal ledges.
    addHorizontalBand(42, 28, 8.08, 0.34, 0.7, roofMat);
    addHorizontalBand(34, 24, 18.08, 0.32, 0.6, roofMat);
    addHorizontalBand(28, 21, 28.08, 0.32, 0.55, roofMat);
    addHorizontalBand(23, 18, 90.08, 0.38, 0.5, limestoneDark);
    addHorizontalBand(18.8, 15.4, 100.08, 0.32, 0.45, limestoneDark);
    addHorizontalBand(14.4, 11.6, 108.08, 0.28, 0.38, limestoneDark);
    addHorizontalBand(10.6, 8.4, 113.88, 0.28, 0.34, limestoneDark);

    // Windows and strong vertical limestone ribs.
    addWindowBaysOnVolume(42, 28, 1.2, 7.2, 16, 10, 4);
    addWindowBaysOnVolume(34, 24, 9.4, 17.2, 13, 9, 5);
    addWindowBaysOnVolume(28, 21, 19.2, 27.1, 11, 8, 5);
    addWindowBaysOnVolume(23, 18, 30, 88.8, 9, 7, 36);
    addWindowBaysOnVolume(18.8, 15.4, 91.3, 98.8, 7, 5, 5);
    addWindowBaysOnVolume(14.4, 11.6, 101.2, 106.8, 5, 4, 4);

    // Central recessed dark window shafts on the four main faces.
    addBox(building, [3.2, 59.2, 0.11], [0, 59.2, 18 / 2 + 0.34], darkWindowMat, false, true);
    addBox(building, [3.2, 59.2, 0.11], [0, 59.2, -18 / 2 - 0.34], darkWindowMat, false, true);
    addBox(building, [0.11, 59.2, 2.7], [23 / 2 + 0.34, 59.2, 0], darkWindowMat, false, true);
    addBox(building, [0.11, 59.2, 2.7], [-23 / 2 - 0.34, 59.2, 0], darkWindowMat, false, true);

    // Slightly projecting center pilasters and side pilasters for the long shaft.
    for (const x of [-10.2, -7.7, -4.9, 4.9, 7.7, 10.2]) {
      addBox(building, [0.34, 62.2, 0.42], [x, 59.1, 18 / 2 + 0.44], limestoneLight);
      addBox(building, [0.34, 62.2, 0.42], [x, 59.1, -18 / 2 - 0.44], limestoneLight);
    }

    for (const z of [-8.0, -5.2, 5.2, 8.0]) {
      addBox(building, [0.42, 62.2, 0.34], [23 / 2 + 0.44, 59.1, z], limestoneLight);
      addBox(building, [0.42, 62.2, 0.34], [-23 / 2 - 0.44, 59.1, z], limestoneLight);
    }

    // Lower base entrances with Art Deco portals.
    const addPortal = (x: number, z: number, rotationY = 0) => {
      const portal = new THREE.Group();
      portal.rotation.y = rotationY;
      portal.position.set(x, 0, z);
      building.add(portal);

      addBox(portal, [2.05, 5.6, 0.42], [0, 2.9, 0], limestoneLight);
      addBox(portal, [1.26, 4.5, 0.47], [0, 2.45, 0.05], darkWindowMat, false, true);
      addBox(portal, [1.85, 0.45, 0.5], [0, 5.35, 0.08], limestoneDark);
      addBox(portal, [0.18, 4.6, 0.58], [-0.82, 2.72, 0.1], limestoneDark);
      addBox(portal, [0.18, 4.6, 0.58], [0.82, 2.72, 0.1], limestoneDark);
    };

    addPortal(-8.0, 28 / 2 + 0.24, 0);
    addPortal(8.0, 28 / 2 + 0.24, 0);
    addPortal(0, 28 / 2 + 0.28, 0);

    // Decorative dark roof slabs on the lower setbacks.
    addBox(building, [41.2, 0.18, 27.2], [0, 8.42, 0], roofMat, false, true);
    addBox(building, [33.2, 0.18, 23.2], [0, 18.42, 0], roofMat, false, true);
    addBox(building, [27.2, 0.18, 20.2], [0, 28.42, 0], roofMat, false, true);

    // Crown: stepped observation zone, fluted metal mast base and antenna.
    addCylinder(building, 4.5, 4.9, 3.0, [0, 120.1, 0], limestoneDark, 48);
    addCylinder(building, 3.8, 4.2, 4.2, [0, 123.7, 0], metalMat, 48);
    addCylinder(building, 2.75, 3.15, 8.0, [0, 129.8, 0], darkMetalMat, 48);
    addCylinder(building, 1.65, 2.15, 5.0, [0, 136.3, 0], metalMat, 48);
    addCone(building, 1.6, 5.2, [0, 141.4, 0], darkMetalMat, 48);
    addCylinder(building, 0.28, 0.34, 14.0, [0, 151.0, 0], darkMetalMat, 24);
    addCylinder(building, 0.12, 0.16, 8.0, [0, 162.0, 0], darkMetalMat, 16);

    // Flutes around the mast, like the vertical ribs of the observation/mooring section.
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * 3.15;
      const z = Math.sin(angle) * 3.15;
      const rib = addBox(building, [0.18, 8.8, 0.18], [x, 129.7, z], limestoneLight);
      rib.rotation.y = -angle;
    }

    // Narrow decorative vertical fins on upper stone crown.
    for (const x of [-6.4, -3.2, 3.2, 6.4]) {
      addBox(building, [0.3, 10.8, 0.38], [x, 95.2, 15.4 / 2 + 0.32], limestoneLight);
      addBox(building, [0.3, 10.8, 0.38], [x, 95.2, -15.4 / 2 - 0.32], limestoneLight);
    }

    for (const z of [-5.2, -2.4, 2.4, 5.2]) {
      addBox(building, [0.38, 10.8, 0.3], [18.8 / 2 + 0.32, 95.2, z], limestoneLight);
      addBox(building, [0.38, 10.8, 0.3], [-18.8 / 2 - 0.32, 95.2, z], limestoneLight);
    }

    // Small Art Deco cap blocks and setbacks around the crown.
    addBox(building, [16.4, 0.7, 13.0], [0, 111.6, 0], limestoneDark);
    addBox(building, [12.4, 0.65, 9.8], [0, 116.6, 0], limestoneDark);
    addBox(building, [8.6, 0.55, 7.0], [0, 119.0, 0], limestoneDark);

    // Minimal ground receiver, visually unobtrusive. The building remains the only modeled subject.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), shadowMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    floor.receiveShadow = true;
    scene.add(floor);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xc0b197, 1.45);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(38, 120, 52);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 230;
    key.shadow.camera.left = -72;
    key.shadow.camera.right = 72;
    key.shadow.camera.top = 170;
    key.shadow.camera.bottom = -24;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xdce9ff, 1.1);
    fill.position.set(-58, 72, -64);
    scene.add(fill);

    const warm = new THREE.PointLight(0xffd09a, 0.55, 160);
    warm.position.set(-32, 28, 48);
    scene.add(warm);

    const bounds = new THREE.Box3().setFromObject(building);
    const center = bounds.getCenter(new THREE.Vector3());
    building.position.x -= center.x;
    building.position.z -= center.z;

    let frameId = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    render();

    const resizeObserver = new ResizeObserver(() => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(mount);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };

}, []);

return (
<div className="relative h-screen w-full overflow-hidden bg-neutral-100">
<div ref={mountRef} className="h-full w-full" />
</div>
);
}

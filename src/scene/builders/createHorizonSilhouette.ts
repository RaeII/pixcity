import * as THREE from "three";
import { seeded } from "../utils/random";

// Distância à frente da câmera onde a fileira é posicionada.
// O far plane está em 260u — ficar em 248 garante que os prédios não são clipados.
const FORWARD_DISTANCE = 248;

// A fileira se estende lateralmente além dos limites do FOV (58° horizontal ~= ±245u a 248u de distância).
// ±580u garante cobertura mesmo em qualquer ângulo de órbita.
const ROW_HALF_WIDTH = 580;

// Quantidade de prédios na fileira: 1160u / ~4.5u de largura média ≈ 258 prédios
const COUNT = 260;

const MIN_HEIGHT = 2;
const MAX_HEIGHT = 14;
const MIN_WIDTH = 3;
const MAX_WIDTH = 6.5;
const DEPTH = 3;
// Silhueta escura sem névoa — a 248u a névoa é ~100%, fog:true tornaria invisível
const COLOR = 0x1c2b3a;
const GROUND_Y = -0.03;

const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _forward = new THREE.Vector3();

type Bundle = {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshBasicMaterial;
};

function build(scene: THREE.Scene): Bundle {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: COLOR, fog: false });
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.frustumCulled = false;

  const spacing = (ROW_HALF_WIDTH * 2) / (COUNT - 1);

  for (let i = 0; i < COUNT; i++) {
    // Posição no eixo local X: de -ROW_HALF_WIDTH a +ROW_HALF_WIDTH
    const localX =
      -ROW_HALF_WIDTH + i * spacing + (seeded(i, 41, 0) - 0.5) * spacing * 0.35;

    const width = MIN_WIDTH + seeded(i, 41, 1) * (MAX_WIDTH - MIN_WIDTH);
    const heightT = seeded(i, 41, 2);
    // Distribuição quadrática: maioria de prédios baixos, alguns bem altos
    const height = MIN_HEIGHT + heightT * heightT * (MAX_HEIGHT - MIN_HEIGHT);

    // localZ = 0: o mesh é rotacionado no frame para ficar perpendicular à câmera
    _pos.set(localX, height / 2, 0);
    _euler.set(0, 0, 0);
    _quat.setFromEuler(_euler);
    _scale.set(width, height, DEPTH);
    _matrix.compose(_pos, _quat, _scale);
    mesh.setMatrixAt(i, _matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.position.y = GROUND_Y;
  scene.add(mesh);

  return { mesh, geometry, material };
}

export type HorizonSilhouette = {
  update: (camera: THREE.Camera) => void;
  dispose: () => void;
};

export function createHorizonSilhouette(scene: THREE.Scene): HorizonSilhouette {
  const bundle = build(scene);

  return {
    update(camera) {
      // Direção da câmera projetada no plano XZ
      camera.getWorldDirection(_forward);
      _forward.y = 0;
      if (_forward.lengthSq() < 1e-6) return;
      _forward.normalize();

      // Posiciona a fileira à FORWARD_DISTANCE da câmera, ao nível do chão
      bundle.mesh.position.set(
        camera.position.x + _forward.x * FORWARD_DISTANCE,
        GROUND_Y,
        camera.position.z + _forward.z * FORWARD_DISTANCE,
      );

      // Rotaciona o mesh para o eixo local X ficar perpendicular à direção da câmera.
      // Com rotação Y = θ, o eixo local X no mundo fica em (cos θ, 0, -sin θ).
      // Queremos (cos θ, 0, -sin θ) = lateral = (-forward.z, 0, forward.x):
      //   cos θ = -forward.z  →  sin θ = forward.x
      //   θ = atan2(forward.x, -forward.z)  ... mas Three.js usa a convenção abaixo:
      bundle.mesh.rotation.y = Math.atan2(-_forward.x, -_forward.z);
    },

    dispose() {
      scene.remove(bundle.mesh);
      bundle.geometry.dispose();
      bundle.material.dispose();
    },
  };
}

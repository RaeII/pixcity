import * as THREE from "three";

// Margem lateral dentro da placa (fração da largura do canvas)
const PADDING = 0.12;
// Altura do canvas em pixels (fixo — largura escala com o edifício)
const CANVAS_HEIGHT = 128;
// Proporção altura da placa / largura do edifício
const SIGN_HEIGHT_RATIO = 0.22;

/**
 * Cria um letreiro 3D estilo corporativo para a fachada de um edifício.
 *
 * O texto é renderizado via CanvasTexture em um plano fino com material emissivo
 * (simulando letreiro LED). Pode aparecer em 1 a 4 fachadas.
 *
 * @param text       Texto do letreiro (marca/empresa)
 * @param buildingW  Largura do edifício (scale.x da instância)
 * @param buildingD  Profundidade do edifício (scale.z da instância)
 * @param buildingH  Altura do edifício (scale.y da instância)
 * @param sides      Quantidade de lados (1–4). 1=frente, 2=frente+trás, 3=+lateral dir, 4=todos
 * @returns Group posicionado para ser adicionado na posição do centro do edifício,
 *          ou null se o texto for vazio.
 */
export function createSignMesh(
  text: string,
  buildingW: number,
  buildingD: number,
  buildingH: number,
  sides: number,
): THREE.Group | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const group = new THREE.Group();
  const clampedSides = Math.max(1, Math.min(4, Math.round(sides)));

  // yOffset: bem perto do topo (45% acima do centro = ~95% da altura)
  const yOffset = buildingH * 0.45;

  // Altura do letreiro consistente em todos os lados
  const signH = Math.max(buildingW, buildingD) * SIGN_HEIGHT_RATIO;

  // Definição dos 4 lados: frente (+Z), trás (−Z), direita (+X), esquerda (−X)
  // rotY deve rotacionar a normal do plano (+Z) para apontar PARA FORA do edifício.
  //   PlaneGeometry normal = +Z.
  //   Rotação +π/2 em Y: (0,0,1) → (+1,0,0) = face aponta +X (para fora da direita)  ✓
  //   Rotação −π/2 em Y: (0,0,1) → (−1,0,0) = face aponta −X (para fora da esquerda) ✓
  const sideConfigs: Array<{
    faceW: number;
    normalOffset: number;
    rotY: number;
    offsetX: number;
    offsetZ: number;
  }> = [
    // Frente (+Z): normal já aponta +Z
    { faceW: buildingW, normalOffset: buildingD / 2, rotY: 0, offsetX: 0, offsetZ: 1 },
    // Trás (−Z): rotação π → normal aponta −Z
    { faceW: buildingW, normalOffset: buildingD / 2, rotY: Math.PI, offsetX: 0, offsetZ: -1 },
    // Direita (+X): rotação +π/2 → normal aponta +X
    { faceW: buildingD, normalOffset: buildingW / 2, rotY: Math.PI / 2, offsetX: 1, offsetZ: 0 },
    // Esquerda (−X): rotação −π/2 → normal aponta −X
    { faceW: buildingD, normalOffset: buildingW / 2, rotY: -Math.PI / 2, offsetX: -1, offsetZ: 0 },
  ];

  const disposables: Array<{
    texture: THREE.CanvasTexture;
    signMaterial: THREE.MeshStandardMaterial;
    backingMaterial: THREE.MeshStandardMaterial;
    planeGeo: THREE.PlaneGeometry;
    backingGeo: THREE.BoxGeometry;
  }> = [];

  for (let i = 0; i < clampedSides; i++) {
    const cfg = sideConfigs[i];
    const signW = cfg.faceW * 0.92;

    const { texture, signMaterial, backingMaterial, planeGeo, backingGeo } =
      createSignPanel(trimmed, signW, signH);
    disposables.push({ texture, signMaterial, backingMaterial, planeGeo, backingGeo });

    const signPlane = new THREE.Mesh(planeGeo, signMaterial);
    signPlane.castShadow = true;

    const backing = new THREE.Mesh(backingGeo, backingMaterial);
    backing.castShadow = true;
    backing.receiveShadow = true;

    const dist = cfg.normalOffset + 0.02;
    const px = cfg.offsetX * dist;
    const pz = cfg.offsetZ * dist;

    signPlane.position.set(px, yOffset, pz);
    signPlane.rotation.y = cfg.rotY;

    // Backing ligeiramente atrás da placa (na direção oposta à normal)
    const backDist = cfg.normalOffset + 0.005;
    backing.position.set(cfg.offsetX * backDist, yOffset, cfg.offsetZ * backDist);
    backing.rotation.y = cfg.rotY;

    group.add(backing);
    group.add(signPlane);
  }

  group.userData.signDisposables = disposables;

  return group;
}

/** Cria o canvas, textura, materiais e geometrias para um painel de letreiro. */
function createSignPanel(
  text: string,
  signW: number,
  signH: number,
): {
  texture: THREE.CanvasTexture;
  signMaterial: THREE.MeshStandardMaterial;
  backingMaterial: THREE.MeshStandardMaterial;
  planeGeo: THREE.PlaneGeometry;
  backingGeo: THREE.BoxGeometry;
} {
  const aspect = signW / signH;
  const canvasW = Math.round(CANVAS_HEIGHT * aspect);
  const canvasH = CANVAS_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // Fundo: painel escuro com borda sutil
  ctx.fillStyle = "rgba(8, 10, 16, 0.88)";
  roundRect(ctx, 0, 0, canvasW, canvasH, 8);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, canvasW - 2, canvasH - 2, 7);
  ctx.stroke();

  // Texto — ajustar tamanho para caber
  const maxTextW = canvasW * (1 - PADDING * 2);
  let fontSize = Math.floor(canvasH * 0.52);
  ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = "middle";

  while (fontSize > 10 && ctx.measureText(text).width > maxTextW) {
    fontSize -= 1;
    ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
  }

  const textWidth = ctx.measureText(text).width;
  const textX = (canvasW - textWidth) / 2;
  const textY = canvasH / 2;

  // Glow LED
  ctx.shadowColor = "rgba(200, 220, 255, 0.6)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(220, 230, 255, 0.95)";
  ctx.fillText(text, textX, textY);

  // Texto nítido por cima
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e8ecf4";
  ctx.fillText(text, textX, textY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const signMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.4,
    roughness: 0.35,
    metalness: 0.6,
    transparent: true,
  });

  const backingMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 0.7,
    metalness: 0.5,
  });

  const planeGeo = new THREE.PlaneGeometry(signW, signH);
  const backingGeo = new THREE.BoxGeometry(signW + 0.04, signH + 0.04, 0.03);

  return { texture, signMaterial, backingMaterial, planeGeo, backingGeo };
}

/** Descarta geometrias, texturas e materiais de um sign group. */
export function disposeSignMesh(group: THREE.Group): void {
  const disposables = group.userData.signDisposables;
  if (Array.isArray(disposables)) {
    for (const d of disposables) {
      d.texture.dispose();
      d.signMaterial.dispose();
      d.backingMaterial.dispose();
      d.planeGeo.dispose();
      d.backingGeo.dispose();
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

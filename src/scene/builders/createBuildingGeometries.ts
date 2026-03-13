import * as THREE from "three";

/**
 * Creates a stylized minimalist building geometry in unit space.
 *
 * Y axis: -0.5 (ground) → +0.5 (roof edge). Rooftop box slightly exceeds +0.5.
 * XZ axis: fits within -0.5 to +0.5.
 *
 * Designed for InstancedMesh — scale and position applied via matrix.
 *
 * Silhouette (bottom to top):
 *   ┌──────────────────────┐  ← base podium  (full width)
 *   │  ┌────────────────┐  │  ← main shaft   (88% width)
 *   │  │  ┌──────────┐  │  │  ← upper setback(72% width)
 *   │  │  │  ┌────┐  │  │  │  ← rooftop box  (28% width)
 *   │  │  └──────────┘  │  │
 *   │  └────────────────┘  │
 *   └──────────────────────┘
 */
export function createBuildingGeometry(): THREE.BufferGeometry {
  return mergeBoxes([
    // Base podium — full width, bottom 12%
    // y: -0.50 → -0.38
    { w: 1.0, h: 0.12, d: 1.0, cx: 0, cy: -0.44, cz: 0 },

    // Main shaft — slightly inset, spans bottom 80%
    // y: -0.50 → +0.30
    { w: 0.88, h: 0.80, d: 0.88, cx: 0, cy: -0.10, cz: 0 },

    // Upper setback — narrower, sits on shaft top
    // y: +0.30 → +0.46
    { w: 0.72, h: 0.16, d: 0.72, cx: 0, cy: 0.38, cz: 0 },

    // Crown parapet — thin ledge, slightly wider than setback
    // y: +0.46 → +0.50
    { w: 0.82, h: 0.04, d: 0.82, cx: 0, cy: 0.48, cz: 0 },

    // Rooftop slab — flat, low-profile, sits flush on roof
    // y: +0.50 → +0.53
    { w: 0.34, h: 0.03, d: 0.34, cx: 0, cy: 0.515, cz: 0 },
  ]);
}

type BoxSpec = { w: number; h: number; d: number; cx: number; cy: number; cz: number };

function mergeBoxes(specs: BoxSpec[]): THREE.BufferGeometry {
  const geoms = specs.map(({ w, h, d, cx, cy, cz }) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(cx, cy, cz);
    return g;
  });

  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geoms) {
    totalVerts += (g.attributes.position as THREE.BufferAttribute).count;
    totalIndices += (g.index as THREE.BufferAttribute).count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;

  for (const g of geoms) {
    const pos = g.attributes.position as THREE.BufferAttribute;
    const nor = g.attributes.normal as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const idx = g.index as THREE.BufferAttribute;
    const idxArr = idx.array as Uint16Array | Uint32Array;

    positions.set(pos.array, vOffset * 3);
    normals.set(nor.array, vOffset * 3);
    uvs.set(uv.array, vOffset * 2);

    for (let i = 0; i < idxArr.length; i++) {
      indices[iOffset + i] = idxArr[i] + vOffset;
    }

    vOffset += pos.count;
    iOffset += idxArr.length;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));

  return merged;
}

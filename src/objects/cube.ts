export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

type Vertex = {
  position: Vec3
  normal: Vec3
  uv: Vec2
}

/** Нормализация вектора **/
function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2])
  return len === 0 ? [0, 0, 0] : [v[0] / len, v[1] / len, v[2] / len]
}

/** Векторное произведение **/
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

/** Генерация куба со скруглёнными краями и углами **/
export function generateBeveledCube(
  center: Vec3,
  size: number,
  bevel: number,
  bevelSegments: number = 2,
  planeSegments: number = 1
): { vertices: Vertex[]; indices: number[] } {
  if (bevel * 2 > size) throw new Error("Bevel too large")

  const [cx, cy, cz] = center
  const half = size / 2
  const inner = half - bevel

  const vertices: Vertex[] = []
  const indices: number[] = []

  function addVertex(pos: Vec3, norm: Vec3, uv: Vec2): number {
    const p: Vec3 = [cx + pos[0], cy + pos[1], cz + pos[2]]
    const n = normalize(norm)
    vertices.push({ position: p, normal: n, uv })
    return vertices.length - 1
  }

  function addQuad(a: number, b: number, c: number, d: number) {
    indices.push(a, b, c, c, b, d)
  }

  // === 1) Центральные плоские грани (минимальная сегментация) ===
  const planes: [Vec3, Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1], [half, 0, 0]],
    [[-1, 0, 0], [0, 1, 0], [0, 0, 1], [-half, 0, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, 1], [0, half, 0]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1], [0, -half, 0]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, half]],
    [[0, 0, -1], [1, 0, 0], [0, 1, 0], [0, 0, -half]],
  ]
  for (const [normal, uDir, vDir, origin] of planes) {
    const step = (inner * 2) / planeSegments
    const baseI = vertices.length
    for (let i = 0; i <= planeSegments; i++) {
      for (let j = 0; j <= planeSegments; j++) {
        const u = -inner + i * step
        const v = -inner + j * step
        const pos: Vec3 = [
          origin[0] + u * uDir[0] + v * vDir[0],
          origin[1] + u * uDir[1] + v * vDir[1],
          origin[2] + u * uDir[2] + v * vDir[2],
        ]
        addVertex(pos, normal, [i / planeSegments, j / planeSegments])
        if (i < planeSegments && j < planeSegments) {
          const a = baseI + i * (planeSegments + 1) + j
          const b = a + 1
          const c = a + (planeSegments + 1)
          const d = c + 1
          addQuad(a, b, c, d)
        }
      }
    }
  }

  // === 2) Фаски на рёбрах ===
  const faceNormals: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  for (let i = 0; i < faceNormals.length; i++) {
    for (let j = i + 1; j < faceNormals.length; j++) {
      const n1 = faceNormals[i]
      const n2 = faceNormals[j]
      if (Math.abs(n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]) !== 0) continue
      const edgeDir = normalize(cross(n1, n2))
      const origin: Vec3 = [
        n1[0] * inner + n2[0] * inner,
        n1[1] * inner + n2[1] * inner,
        n1[2] * inner + n2[2] * inner,
      ]
      const lenStep = (inner * 2) / bevelSegments
      const angStep = (Math.PI / 2) / bevelSegments
      const baseE = vertices.length
      for (let a = 0; a <= bevelSegments; a++) {
        const t = -inner + a * lenStep
        for (let b = 0; b <= bevelSegments; b++) {
          const ang = b * angStep
          const dir: Vec3 = normalize([
            Math.cos(ang) * n1[0] + Math.sin(ang) * n2[0],
            Math.cos(ang) * n1[1] + Math.sin(ang) * n2[1],
            Math.cos(ang) * n1[2] + Math.sin(ang) * n2[2],
          ])
          const base: Vec3 = [
            origin[0] + t * edgeDir[0],
            origin[1] + t * edgeDir[1],
            origin[2] + t * edgeDir[2],
          ]
          const pos: Vec3 = [
            base[0] + dir[0] * bevel,
            base[1] + dir[1] * bevel,
            base[2] + dir[2] * bevel,
          ]
          addVertex(pos, dir, [a / bevelSegments, b / bevelSegments])
          if (a < bevelSegments && b < bevelSegments) {
            const a0 = baseE + a * (bevelSegments + 1) + b
            const b0 = a0 + 1
            const c0 = a0 + (bevelSegments + 1)
            const d0 = c0 + 1
            addQuad(a0, b0, c0, d0)
          }
        }
      }
    }
  }

  // === 3) Фаски на углах (восьмушки сферы) ===
  for (const sx of [-1, 1] as number[]) {
    for (const sy of [-1, 1] as number[]) {
      for (const sz of [-1, 1] as number[]) {
        const ox = sx * inner
        const oy = sy * inner
        const oz = sz * inner
        const baseC = vertices.length
        for (let i = 0; i <= bevelSegments; i++) {
          const theta = (i / bevelSegments) * (Math.PI / 2)
          for (let j = 0; j <= bevelSegments; j++) {
            const phi = (j / bevelSegments) * (Math.PI / 2)
            const dir: Vec3 = normalize([
              Math.cos(phi) * Math.cos(theta) * sx,
              Math.cos(phi) * Math.sin(theta) * sy,
              Math.sin(phi) * sz,
            ])
            const pos: Vec3 = [
              ox + dir[0] * bevel,
              oy + dir[1] * bevel,
              oz + dir[2] * bevel,
            ]
            addVertex(pos, dir, [i / bevelSegments, j / bevelSegments])
            if (i < bevelSegments && j < bevelSegments) {
              const a = baseC + i * (bevelSegments + 1) + j
              const b = a + 1
              const c = a + (bevelSegments + 1)
              const d = c + 1
              addQuad(a, b, c, d)
            }
          }
        }
      }
    }
  }

  return { vertices, indices }
}

const cubeVertices = new Float32Array([
  // Front face (z = 1) — faceId = 0
  -1, -1,  1,   0,  0,  1, 0,
  1, -1,  1,   0,  0,  1, 0,
  1,  1,  1,   0,  0,  1, 0,
  -1,  1,  1,   0,  0,  1, 0,

  // Back face (z = -1) — faceId = 1
  -1, -1, -1,   0,  0, -1, 1,
  -1,  1, -1,   0,  0, -1, 1,
  1,  1, -1,   0,  0, -1, 1,
  1, -1, -1,   0,  0, -1, 1,

  // Top face (y = 1) — faceId = 2
  -1,  1, -1,   0,  1,  0, 2,
  -1,  1,  1,   0,  1,  0, 2,
  1,  1,  1,   0,  1,  0, 2,
  1,  1, -1,   0,  1,  0, 2,

  // Bottom face (y = -1) — faceId = 3
  -1, -1, -1,   0, -1,  0, 3,
  1, -1, -1,   0, -1,  0, 3,
  1, -1,  1,   0, -1,  0, 3,
  -1, -1,  1,   0, -1,  0, 3,

  // Right face (x = 1) — faceId = 4
  1, -1, -1,   1,  0,  0, 4,
  1,  1, -1,   1,  0,  0, 4,
  1,  1,  1,   1,  0,  0, 4,
  1, -1,  1,   1,  0,  0, 4,

  // Left face (x = -1) — faceId = 5
  -1, -1, -1,  -1,  0,  0, 5,
  -1, -1,  1,  -1,  0,  0, 5,
  -1,  1,  1,  -1,  0,  0, 5,
  -1,  1, -1,  -1,  0,  0, 5,
])

let cubeIndices = new Uint16Array([
  // Front
  0, 1, 2,  2, 3, 0,
  // Back
  4, 5, 6,  6, 7, 4,
  // Top
  8, 9,10, 10,11, 8,
  // Bottom
  12,13,14, 14,15,12,
  // Right
  16,17,18, 18,19,16,
  // Left
  20,21,22, 22,23,20
])

function uploadBeveledCube(
  gl: WebGL2RenderingContext,
  vbo: WebGLBuffer,
  ebo: WebGLBuffer,
  vertices: Vertex[],
  indices: number[]
) {
  const data: number[] = []
  for (const v of vertices) {
    data.push(...v.position, ...v.normal, ...v.uv)
  }
  const vertexData = new Float32Array(data)
  const indexData  = new Uint16Array(indices)

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW)
}

export default function loadCube(gl: WebGL2RenderingContext, vbo: WebGLBuffer, ebo: WebGLBuffer, bevel?: boolean, size: number = 1, bevelRadius: number = 0.1) {
  if (bevel) {
    const { vertices, indices } = generateBeveledCube([0,0,0], size, bevelRadius, 14)
    uploadBeveledCube(gl, vbo, ebo, vertices, indices)

    cubeIndices = new Uint16Array(indices)
    return
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW)
}

export function drawCube(gl: WebGL2RenderingContext) {
  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0)
}

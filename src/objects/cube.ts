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

const cubeIndices = new Uint16Array([
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

export default function loadCube(gl: WebGL2RenderingContext, vbo: WebGLBuffer, ebo: WebGLBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW)
}

export function drawCube(gl: WebGL2RenderingContext) {
  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0)
}

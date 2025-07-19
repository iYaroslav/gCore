#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in float aFaceId;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uTime;

out vec3 vNormal;
out vec3 vPosition;
flat out int vFaceId;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vNormal = mat3(transpose(inverse(uModel))) * aNormal;
  vPosition = worldPos.xyz;

  // Каждая грань = 6 индексов, gl_VertexID / 6 — индекс грани
//  vFaceId = gl_VertexID / 6;
  vFaceId = int(aFaceId);

  gl_Position = uProjection * uView * worldPos;
}

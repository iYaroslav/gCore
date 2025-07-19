#version 300 es

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uLightViewProjection;

out vec3 vNormal;
out vec3 vPosition;
out vec4 vShadowCoord;

void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;

  mat3 normalMatrix = mat3(transpose(inverse(uModel)));
  vNormal = normalize(normalMatrix * aNormal);

  vShadowCoord = uLightViewProjection * worldPosition;

  gl_Position = uProjection * uView * worldPosition;
}

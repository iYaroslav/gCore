#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;

vec3 vLocalPos;

uniform float uSpecularPower;      // экпонента блика (чем больше — тем острее)
uniform float uSpecularIntensity;  // сила блика (0…1)
uniform vec3 uLightDirection;      // направление «на свет» (обычно negate света)
uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform vec3 uCameraPos;
uniform vec3 uInner;
uniform float uBevel;

out vec4 outColor;

void main() {
  vec3 q = clamp(vLocalPos, -uInner, uInner);
  vec3 bevelVec = vLocalPos - q;
  float bLen = length(bevelVec);
  vec3 N = (bLen > 1e-4)
  ? bevelVec / bLen
  : normalize(vNormal);

  vec3 L = normalize(-uLightDirection);
  vec3 V = normalize(uCameraPos - vPosition);
  vec3 H = normalize(L + V);

  float diff = max(dot(N, L), 0.0);
  float specAngle = max(dot(N, H), 0.0);
  float spec    = pow(specAngle, uSpecularPower) * uSpecularIntensity;

  vec3 ambient  = 0.1 * uObjectColor;
  vec3 diffuse  = diff * uObjectColor * uLightColor;
  vec3 specular = spec * uLightColor;

  outColor = vec4(ambient + diffuse + specular, 1.0);
}

#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;
flat in int vFaceId;

uniform float uTime;
out vec4 outColor;

vec3 waterEffect() {
  float wave = sin(vPosition.x * 5.0 + uTime * 2.0) * 0.1;
  return vec3(0.0, 0.4 + wave, 0.7 + wave);
}

vec3 lavaEffect() {
  float glow = abs(sin(vPosition.y * 10.0 + uTime * 5.0));
  return mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.5, 0.0), glow);
}

vec3 iceEffect() {
  float frost = fract(sin(dot(vPosition.xy, vec2(12.9898,78.233))) * 43758.5453);
  return mix(vec3(0.8, 0.9, 1.0), vec3(0.5, 0.6, 0.7), frost);
}

vec3 metalEffect() {
  float shade = dot(normalize(vNormal), normalize(vec3(1,1,1)));
  return vec3(0.7) * shade;
}

vec3 slimeEffect() {
  float pulse = sin(vPosition.x * 10.0 + uTime * 4.0);
  return mix(vec3(0.1, 0.6, 0.2), vec3(0.3, 1.0, 0.5), pulse);
}

vec3 oilEffect() {
  float rainbow = sin(dot(vPosition.xy, vec2(10.0, 10.0)) + uTime * 3.0);
  return vec3(0.1 + rainbow * 0.5, 0.1, 0.2 + rainbow * 0.7);
}

void main() {
  vec3 color;

  if (vFaceId == 0)      color = waterEffect();
  else if (vFaceId == 1) color = lavaEffect();
  else if (vFaceId == 2) color = iceEffect();
  else if (vFaceId == 3) color = metalEffect();
  else if (vFaceId == 4) color = slimeEffect();
  else                   color = oilEffect();

  outColor = vec4(color, 1.0);
}

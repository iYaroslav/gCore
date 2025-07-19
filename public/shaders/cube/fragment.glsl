#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;
in vec4 vShadowCoord;

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uObjectColor;
uniform sampler2D uShadowMap;

out vec4 outColor;

float getShadow(vec4 shadowCoord) {
  vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
  projCoords = projCoords * 0.5 + 0.5; // от NDC к [0,1]

  // Проверка выхода за пределы
  if (projCoords.x < 0.0 || projCoords.x > 1.0 || projCoords.y < 0.0 || projCoords.y > 1.0)
  return 1.0;

  float closestDepth = texture(uShadowMap, projCoords.xy).r;
  float currentDepth = projCoords.z;

  // Простое сравнение с небольшим bias
  float bias = 0.005;
  float shadow = currentDepth - bias > closestDepth ? 0.5 : 1.0;

  return shadow;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(-uLightDirection);
  vec3 viewDir = normalize(-vPosition);

  float diff = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);

  float shadow = getShadow(vShadowCoord);

  vec3 lighting = uLightColor * (0.1 + shadow * (diff + spec));
  vec3 color = lighting * uObjectColor;

  outColor = vec4(color, 1.0);
}

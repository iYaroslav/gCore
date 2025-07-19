#version 300 es
precision highp float;

flat in int vTriId;
out vec4 fragColor;

void main() {
  float r = float((vTriId * 73) % 255) / 255.0;
  float g = float((vTriId * 151) % 255) / 255.0;
  float b = float((vTriId * 199) % 255) / 255.0;
  fragColor = vec4(r, g, b, 1.0);
}

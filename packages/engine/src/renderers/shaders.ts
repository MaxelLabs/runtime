/**
 * Basic Shaders for ForwardRenderer
 * 基础着色器源码
 *
 * @packageDocumentation
 */

/**
 * 基础顶点着色器 (WebGL2 / GLSL ES 3.00)
 * 使用 Uniform Block (UBO) 传递矩阵
 */
export const BASIC_VERTEX_SHADER_300 = `#version 300 es
precision highp float;

// Vertex attributes
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

// Uniform Block for matrices
layout(std140) uniform Matrices {
  mat4 u_modelMatrix;
  mat4 u_viewMatrix;
  mat4 u_projectionMatrix;
  mat4 u_normalMatrix;
};

// Varyings
out vec3 v_position;
out vec3 v_normal;
out vec2 v_uv;

void main() {
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  v_position = worldPosition.xyz;
  v_normal = mat3(u_normalMatrix) * a_normal;
  v_uv = a_uv;

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
`;

/**
 * 基础片段着色器 (WebGL2 / GLSL ES 3.00)
 * 简化的 PBR 光照，使用 Uniform Block
 */
export const BASIC_FRAGMENT_SHADER_300 = `#version 300 es
precision highp float;

// Varyings
in vec3 v_position;
in vec3 v_normal;
in vec2 v_uv;

// Material Uniform Block
layout(std140) uniform Material {
  vec4 u_baseColor;
  float u_metallic;
  float u_roughness;
  vec2 _pad0;  // padding for std140
  vec3 u_lightDirection;
  float _pad1;
  vec3 u_lightColor;
  float _pad2;
  vec3 u_cameraPosition;
  float _pad3;
};

// Output
out vec4 fragColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(-u_lightDirection);
  vec3 V = normalize(u_cameraPosition - v_position);
  vec3 H = normalize(L + V);

  // 简化的 Lambert 漫反射
  float NdotL = max(dot(N, L), 0.0);

  // 简化的 Blinn-Phong 高光
  float NdotH = max(dot(N, H), 0.0);
  float shininess = mix(8.0, 256.0, 1.0 - u_roughness);
  float specular = pow(NdotH, shininess) * (1.0 - u_roughness);

  // 环境光
  vec3 ambient = u_baseColor.rgb * 0.1;

  // 漫反射
  vec3 diffuse = u_baseColor.rgb * NdotL * u_lightColor;

  // 高光 (金属度影响高光颜色)
  vec3 specularColor = mix(vec3(0.04), u_baseColor.rgb, u_metallic);
  vec3 spec = specularColor * specular * u_lightColor;

  vec3 finalColor = ambient + diffuse + spec;

  // Gamma 校正
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  fragColor = vec4(finalColor, u_baseColor.a);
}
`;

/**
 * Unlit 顶点着色器 (WebGL2 / GLSL ES 3.00)
 */
export const UNLIT_VERTEX_SHADER_300 = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
}
`;

/**
 * Unlit 片段着色器 (WebGL2 / GLSL ES 3.00)
 */
export const UNLIT_FRAGMENT_SHADER_300 = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

/**
 * WebGL1 兼容的顶点着色器 (GLSL ES 1.00)
 */
export const BASIC_VERTEX_SHADER_100 = `
precision highp float;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  v_position = worldPosition.xyz;
  v_normal = mat3(u_normalMatrix) * a_normal;
  v_uv = a_uv;

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
`;

/**
 * WebGL1 兼容的片段着色器 (GLSL ES 1.00)
 */
export const BASIC_FRAGMENT_SHADER_100 = `
precision highp float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

uniform vec4 u_baseColor;
uniform float u_metallic;
uniform float u_roughness;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(-u_lightDirection);
  vec3 V = normalize(u_cameraPosition - v_position);
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  float shininess = mix(8.0, 256.0, 1.0 - u_roughness);
  float specular = pow(NdotH, shininess) * (1.0 - u_roughness);

  vec3 ambient = u_baseColor.rgb * 0.1;
  vec3 diffuse = u_baseColor.rgb * NdotL * u_lightColor;
  vec3 specularColor = mix(vec3(0.04), u_baseColor.rgb, u_metallic);
  vec3 spec = specularColor * specular * u_lightColor;

  vec3 finalColor = ambient + diffuse + spec;
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  gl_FragColor = vec4(finalColor, u_baseColor.a);
}
`;

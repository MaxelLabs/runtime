/**
 * shader-templates.ts
 * 着色器模板
 * 提供常用的顶点和片段着色器模板
 */

import { ShaderType, ShaderLanguage, type ShaderSource, type UniformDescriptor } from './shader';

/**
 * 着色器模板类
 * 提供常用的着色器代码模板
 */
export class ShaderTemplates {
  /**
   * 基础顶点着色器 - WGSL
   */
  static get basicVertexWGSL(): ShaderSource {
    return {
      type: ShaderType.VERTEX,
      language: ShaderLanguage.WGSL,
      entryPoint: 'main',
      code: `
struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

struct Uniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  normalMatrix: mat3x3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
  output.worldPos = worldPos.xyz;
  
  output.position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;
  output.normal = uniforms.normalMatrix * input.normal;
  output.uv = input.uv;
  
  return output;
}
      `,
    };
  }

  /**
   * 基础片段着色器 - WGSL
   */
  static get basicFragmentWGSL(): ShaderSource {
    return {
      type: ShaderType.FRAGMENT,
      language: ShaderLanguage.WGSL,
      entryPoint: 'main',
      code: `
struct FragmentInput {
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

struct Material {
  albedo: vec4<f32>,
  metallic: f32,
  roughness: f32,
  emissive: vec3<f32>,
  padding: f32,
};

@group(0) @binding(1) var<uniform> material: Material;
@group(0) @binding(2) var albedoTexture: texture_2d<f32>;
@group(0) @binding(3) var textureSampler: sampler;

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  let normal = normalize(input.normal);
  let albedoSample = textureSample(albedoTexture, textureSampler, input.uv);
  let finalAlbedo = material.albedo * albedoSample;
  
  // 简单的兰伯特光照
  let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
  let lambertian = max(dot(normal, lightDir), 0.0);
  
  let finalColor = finalAlbedo.rgb * lambertian + material.emissive;
  
  return vec4<f32>(finalColor, finalAlbedo.a);
}
      `,
    };
  }

  /**
   * PBR顶点着色器 - WGSL
   */
  static get pbrVertexWGSL(): ShaderSource {
    return {
      type: ShaderType.VERTEX,
      language: ShaderLanguage.WGSL,
      entryPoint: 'main',
      code: `
struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) tangent: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) tangent: vec3<f32>,
  @location(4) bitangent: vec3<f32>,
};

struct Uniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  normalMatrix: mat3x3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
  output.worldPos = worldPos.xyz;
  
  output.position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;
  output.normal = normalize(uniforms.normalMatrix * input.normal);
  output.tangent = normalize(uniforms.normalMatrix * input.tangent.xyz);
  output.bitangent = cross(output.normal, output.tangent) * input.tangent.w;
  output.uv = input.uv;
  
  return output;
}
      `,
    };
  }

  /**
   * PBR片段着色器 - WGSL
   */
  static get pbrFragmentWGSL(): ShaderSource {
    return {
      type: ShaderType.FRAGMENT,
      language: ShaderLanguage.WGSL,
      entryPoint: 'main',
      code: `
struct FragmentInput {
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) tangent: vec3<f32>,
  @location(4) bitangent: vec3<f32>,
};

struct Material {
  albedo: vec4<f32>,
  metallic: f32,
  roughness: f32,
  emissive: vec3<f32>,
  normalScale: f32,
};

struct Light {
  position: vec3<f32>,
  intensity: f32,
  color: vec3<f32>,
  range: f32,
};

@group(0) @binding(1) var<uniform> material: Material;
@group(0) @binding(2) var<uniform> light: Light;
@group(0) @binding(3) var albedoTexture: texture_2d<f32>;
@group(0) @binding(4) var normalTexture: texture_2d<f32>;
@group(0) @binding(5) var metallicRoughnessTexture: texture_2d<f32>;
@group(0) @binding(6) var textureSampler: sampler;

fn distributionGGX(NdotH: f32, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH2 = NdotH * NdotH;
  let num = a2;
  let denom = (NdotH2 * (a2 - 1.0) + 1.0);
  return num / (3.14159265 * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
  let r = (roughness + 1.0);
  let k = (r * r) / 8.0;
  let num = NdotV;
  let denom = NdotV * (1.0 - k) + k;
  return num / denom;
}

fn geometrySmith(normal: vec3<f32>, viewDir: vec3<f32>, lightDir: vec3<f32>, roughness: f32) -> f32 {
  let NdotV = max(dot(normal, viewDir), 0.0);
  let NdotL = max(dot(normal, lightDir), 0.0);
  let ggx2 = geometrySchlickGGX(NdotV, roughness);
  let ggx1 = geometrySchlickGGX(NdotL, roughness);
  return ggx1 * ggx2;
}

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
  // 采样贴图
  let albedoSample = textureSample(albedoTexture, textureSampler, input.uv);
  let normalSample = textureSample(normalTexture, textureSampler, input.uv);
  let metallicRoughnessSample = textureSample(metallicRoughnessTexture, textureSampler, input.uv);
  
  // 材质属性
  let albedo = material.albedo.rgb * albedoSample.rgb;
  let metallic = material.metallic * metallicRoughnessSample.b;
  let roughness = material.roughness * metallicRoughnessSample.g;
  
  // 法线映射
  let normal = normalize(input.normal);
  let tangent = normalize(input.tangent);
  let bitangent = normalize(input.bitangent);
  let TBN = mat3x3<f32>(tangent, bitangent, normal);
  let normalMap = normalSample.rgb * 2.0 - 1.0;
  let worldNormal = normalize(TBN * (normalMap * vec3<f32>(material.normalScale, material.normalScale, 1.0)));
  
  // 光照计算
  let viewDir = normalize(-input.worldPos); // 假设相机在原点
  let lightDir = normalize(light.position - input.worldPos);
  let halfwayDir = normalize(viewDir + lightDir);
  
  let distance = length(light.position - input.worldPos);
  let attenuation = 1.0 / (distance * distance);
  let radiance = light.color * light.intensity * attenuation;
  
  // PBR BRDF
  let F0 = mix(vec3<f32>(0.04), albedo, metallic);
  let F = fresnelSchlick(max(dot(halfwayDir, viewDir), 0.0), F0);
  let NDF = distributionGGX(max(dot(worldNormal, halfwayDir), 0.0), roughness);
  let G = geometrySmith(worldNormal, viewDir, lightDir, roughness);
  
  let numerator = NDF * G * F;
  let denominator = 4.0 * max(dot(worldNormal, viewDir), 0.0) * max(dot(worldNormal, lightDir), 0.0) + 0.0001;
  let specular = numerator / denominator;
  
  let kS = F;
  let kD = (vec3<f32>(1.0) - kS) * (1.0 - metallic);
  
  let NdotL = max(dot(worldNormal, lightDir), 0.0);
  let Lo = (kD * albedo / 3.14159265 + specular) * radiance * NdotL;
  
  // 环境光
  let ambient = vec3<f32>(0.03) * albedo;
  let color = ambient + Lo + material.emissive;
  
  // HDR色调映射
  let mapped = color / (color + vec3<f32>(1.0));
  let gamma = pow(mapped, vec3<f32>(1.0/2.2));
  
  return vec4<f32>(gamma, material.albedo.a);
}
      `,
    };
  }

  /**
   * 获取基础顶点着色器的uniform描述符
   */
  static get basicVertexUniforms(): UniformDescriptor[] {
    return [
      {
        name: 'modelMatrix',
        type: 'mat4x4<f32>',
        binding: 0,
      },
      {
        name: 'viewMatrix',
        type: 'mat4x4<f32>',
        binding: 0,
      },
      {
        name: 'projectionMatrix',
        type: 'mat4x4<f32>',
        binding: 0,
      },
      {
        name: 'normalMatrix',
        type: 'mat3x3<f32>',
        binding: 0,
      },
    ];
  }

  /**
   * 获取基础片段着色器的uniform描述符
   */
  static get basicFragmentUniforms(): UniformDescriptor[] {
    return [
      {
        name: 'material.albedo',
        type: 'vec4<f32>',
        binding: 1,
      },
      {
        name: 'material.metallic',
        type: 'f32',
        binding: 1,
      },
      {
        name: 'material.roughness',
        type: 'f32',
        binding: 1,
      },
      {
        name: 'material.emissive',
        type: 'vec3<f32>',
        binding: 1,
      },
      {
        name: 'albedoTexture',
        type: 'texture_2d<f32>',
        binding: 2,
        isTexture: true,
      },
      {
        name: 'textureSampler',
        type: 'sampler',
        binding: 3,
        isSampler: true,
      },
    ];
  }

  /**
   * 获取PBR着色器的uniform描述符
   */
  static get pbrUniforms(): UniformDescriptor[] {
    return [
      ...this.basicVertexUniforms,
      {
        name: 'light.position',
        type: 'vec3<f32>',
        binding: 2,
      },
      {
        name: 'light.intensity',
        type: 'f32',
        binding: 2,
      },
      {
        name: 'light.color',
        type: 'vec3<f32>',
        binding: 2,
      },
      {
        name: 'light.range',
        type: 'f32',
        binding: 2,
      },
      {
        name: 'normalTexture',
        type: 'texture_2d<f32>',
        binding: 4,
        isTexture: true,
      },
      {
        name: 'metallicRoughnessTexture',
        type: 'texture_2d<f32>',
        binding: 5,
        isTexture: true,
      },
    ];
  }
}

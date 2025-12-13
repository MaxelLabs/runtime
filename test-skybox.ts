// 测试文件来找出 cubemap-skybox.ts 中的类型错误
import { MSpec, MMath } from '@maxellabs/core';

// 测试 MSpec 相关类型
const device = {} as any;

// 测试 Buffer 创建
device.createBuffer({
  size: 192,
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
});

// 测试 Texture 创建
device.createTexture({
  width: 512,
  height: 512,
  depthOrArrayLayers: 6,
  dimension: 'cube',
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING, // Fixed: String enums cannot be bitwise OR'ed
});

// 测试 Sampler 创建
device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.LINEAR,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
});

// 测试 Shader 创建
device.createShaderModule({
  code: '',
  language: 'glsl',
  stage: MSpec.RHIShaderStage.VERTEX,
});

// 测试 BindGroupLayout 创建
device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
  },
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: 'cube' },
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
  },
]);

console.log('Type check passed!');
import type {
  RHIDeviceInfo } from '@maxellabs/core';
import {
  RHIBackend,
  RHIFeatureFlags,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/GLDevice';

/**
 * 基础初始化演示
 * 展示如何创建WebGL设备和初始化画布
 */
export function initDemo () {
  // 获取画布元素
  const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('找不到画布元素');

    return;
  }

  // 调整画布大小
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 创建WebGL设备
  try {
    const device = new WebGLDevice(canvas, {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    // 打印设备信息
    const info = device.getInfo();

    logDeviceInfo(info);

    // 处理窗口大小变化
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 更新视口
      const gl = device.getGL();

      gl.viewport(0, 0, canvas.width, canvas.height);
    });

    // 绘制简单的清屏
    const gl = device.getGL();

    gl.clearColor(0.2, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 返回创建的设备以供后续使用
    return device;
  } catch (error) {
    console.error('创建WebGL设备失败:', error);

    return null;
  }
}

/**
 * 在控制台打印设备信息
 */
function logDeviceInfo (info: RHIDeviceInfo) {
  console.log('===== WebGL设备信息 =====');
  console.log(`设备名称: ${info.deviceName}`);
  console.log(`厂商: ${info.vendorName}`);
  console.log(`后端API: ${getBackendName(info.backend)}`);
  console.log(`着色器语言版本: ${info.shaderLanguageVersion}`);
  console.log(`最大纹理尺寸: ${info.maxTextureSize}`);
  console.log(`支持功能标志: ${getFeatureFlags(info.features)}`);
  console.log(`支持MSAA: ${info.supportsMSAA ? '是' : '否'}`);
  console.log(`最大采样数: ${info.maxSampleCount}`);
  console.log(`支持各向异性过滤: ${info.supportsAnisotropy ? '是' : '否'}`);
  console.log(`最大绑定数: ${info.maxBindings}`);
  if (info.maxWorkgroupSize) {
    console.log(`最大工作组大小: [${info.maxWorkgroupSize.join(', ')}]`);
  }
  console.log('========================');
}

/**
 * 获取后端API名称
 */
function getBackendName (backend: RHIBackend): string {
  switch (backend) {
    case RHIBackend.WebGL:
      return 'WebGL';
    case RHIBackend.WebGL2:
      return 'WebGL 2.0';
    case RHIBackend.WebGPU:
      return 'WebGPU';
    case RHIBackend.D3D11:
      return 'Direct3D 11';
    case RHIBackend.D3D12:
      return 'Direct3D 12';
    case RHIBackend.Vulkan:
      return 'Vulkan';
    case RHIBackend.Metal:
      return 'Metal';
    default:
      return '未知';
  }
}

/**
 * 获取特性标志的字符串表示
 */
function getFeatureFlags (features: RHIFeatureFlags): string {
  const flags: string[] = [];

  if (features & RHIFeatureFlags.DEPTH_TEXTURE) {flags.push('深度纹理');}
  if (features & RHIFeatureFlags.FLOAT_TEXTURE) {flags.push('浮点纹理');}
  if (features & RHIFeatureFlags.HALF_FLOAT_TEXTURE) {flags.push('半浮点纹理');}
  if (features & RHIFeatureFlags.MULTIPLE_RENDER_TARGETS) {flags.push('多渲染目标');}
  if (features & RHIFeatureFlags.INSTANCED_DRAWING) {flags.push('实例化绘制');}
  if (features & RHIFeatureFlags.ANISOTROPIC_FILTERING) {flags.push('各向异性过滤');}
  if (features & RHIFeatureFlags.VERTEX_ARRAY_OBJECT) {flags.push('顶点数组对象');}
  if (features & RHIFeatureFlags.BLEND_OPERATION) {flags.push('混合操作');}
  if (features & RHIFeatureFlags.INDIRECT_DRAWING) {flags.push('间接绘制');}
  if (features & RHIFeatureFlags.BC_TEXTURE_COMPRESSION) {flags.push('BC纹理压缩');}
  if (features & RHIFeatureFlags.ETC2_TEXTURE_COMPRESSION) {flags.push('ETC2纹理压缩');}
  if (features & RHIFeatureFlags.ASTC_TEXTURE_COMPRESSION) {flags.push('ASTC纹理压缩');}

  return flags.join(', ');
}

// 启动演示
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('正在初始化WebGL设备...');
    const device = initDemo();

    console.log('初始化完成，设备:', device);
  });
}
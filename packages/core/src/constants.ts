/**
 * 全局常量定义
 */

// 渲染相关常量
export const MAX_DIRECTIONAL_LIGHTS = 4;
export const MAX_POINT_LIGHTS = 8;
export const MAX_SPOT_LIGHTS = 4;
export const MAX_SHADOWMAPS = 4;

// 渲染队列排序顺序
export const RENDER_QUEUE = {
  BACKGROUND: 1000,  // 背景渲染
  GEOMETRY: 2000,    // 不透明几何体
  ALPHA_TEST: 2500,  // Alpha测试
  TRANSPARENT: 3000, // 透明物体
  OVERLAY: 4000,      // UI和覆盖物
};

// 着色器宏定义
export const SHADER_MACRO = {
  USE_NORMAL_MAP: 'USE_NORMAL_MAP',
  USE_PBR: 'USE_PBR',
  USE_SHADOWMAP: 'USE_SHADOWMAP',
  USE_SKINNING: 'USE_SKINNING',
  USE_INSTANCING: 'USE_INSTANCING',
};

// 资源类型
export const RESOURCE_TYPE = {
  TEXTURE: 'texture',
  SHADER: 'shader',
  MATERIAL: 'material',
  MESH: 'mesh',
  AUDIO: 'audio',
  PREFAB: 'prefab',
};
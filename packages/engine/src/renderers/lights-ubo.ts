/**
 * Lights UBO Management - 光照 UBO 数据管理
 *
 * @packageDocumentation
 *
 * @remarks
 * 管理多光源系统的 Uniform Buffer Object (UBO) 数据。
 * 遵循 std140 布局规范，确保与着色器中的 uniform block 对齐。
 *
 * ## std140 布局
 * ```glsl
 * layout(std140) uniform LightsUBO {
 *   vec4 u_lightColors[8];       // offset 0,   size 128
 *   vec4 u_lightPositions[8];    // offset 128, size 128
 *   vec4 u_lightDirections[8];   // offset 256, size 128
 *   vec4 u_lightParams[8];       // offset 384, size 128
 *   uint u_lightCount;           // offset 512, size 4
 *   vec3 _pad;                   // offset 516, size 12 padding
 * };  // Total: 528 bytes
 * ```
 *
 * ## 数据打包规则
 * - lightColors[i]: xyz = RGB 颜色, w = 强度
 * - lightPositions[i]: xyz = 位置, w = 类型 (0=dir, 1=point, 2=spot)
 * - lightDirections[i]: xyz = 方向, w = 范围
 * - lightParams[i]: x = 内锥角余弦, y = 外锥角余弦, z = 衰减指数, w = 阴影索引
 */

import type { Light } from '../components/light';
import type { WorldTransform } from '@maxellabs/core';
import type { Vector3Like, QuaternionLike } from '@maxellabs/specification';

/**
 * 最大光源数量
 * @remarks 与着色器中的 MAX_LIGHTS 常量保持一致
 */
export const MAX_LIGHTS = 8;

/**
 * 光照 UBO 大小（字节）
 * @remarks
 * 4 * vec4[8] + uint + padding = 4 * 128 + 16 = 528 bytes
 */
export const LIGHTS_UBO_SIZE = 528;

/**
 * 光照 UBO 数据接口
 */
export interface LightsUBOData {
  /** 光源颜色和强度 (32 floats = 8 * vec4) */
  lightColors: Float32Array;
  /** 光源位置和类型 (32 floats = 8 * vec4) */
  lightPositions: Float32Array;
  /** 光源方向和范围 (32 floats = 8 * vec4) */
  lightDirections: Float32Array;
  /** 光源额外参数 (32 floats = 8 * vec4) */
  lightParams: Float32Array;
  /** 当前活跃光源数量 */
  lightCount: number;
}

/**
 * 光源与变换的组合数据
 */
export interface LightWithTransform {
  light: Light;
  transform: WorldTransform;
}

/**
 * 创建光照 UBO 数据结构
 * @returns 初始化的 LightsUBOData
 */
export function createLightsUBOData(): LightsUBOData {
  return {
    lightColors: new Float32Array(32),
    lightPositions: new Float32Array(32),
    lightDirections: new Float32Array(32),
    lightParams: new Float32Array(32),
    lightCount: 0,
  };
}

/**
 * 更新光照 UBO 数据
 * @param data 目标 UBO 数据结构
 * @param lights 光源列表（最多 MAX_LIGHTS 个）
 *
 * @remarks
 * 此函数将 Light 组件数据转换为 GPU 可用的 UBO 格式。
 * 遵循策略文档中定义的数据打包规则。
 */
export function updateLightsUBO(data: LightsUBOData, lights: LightWithTransform[]): void {
  // 限制光源数量
  const count = Math.min(lights.length, MAX_LIGHTS);
  data.lightCount = count;

  // 清零所有数据（确保未使用的槽位为 0）
  data.lightColors.fill(0);
  data.lightPositions.fill(0);
  data.lightDirections.fill(0);
  data.lightParams.fill(0);

  for (let i = 0; i < count; i++) {
    const { light, transform } = lights[i];
    const offset = i * 4;

    // lightColors[i]: xyz = RGB 颜色, w = 强度
    data.lightColors[offset + 0] = light.color[0];
    data.lightColors[offset + 1] = light.color[1];
    data.lightColors[offset + 2] = light.color[2];
    data.lightColors[offset + 3] = light.intensity;

    // lightPositions[i]: xyz = 位置, w = 类型
    data.lightPositions[offset + 0] = transform.position.x;
    data.lightPositions[offset + 1] = transform.position.y;
    data.lightPositions[offset + 2] = transform.position.z;
    data.lightPositions[offset + 3] = light.lightType as number;

    // lightDirections[i]: xyz = 方向, w = 范围
    let direction: Vector3Like;
    if (light.lightType === 0) {
      // DIRECTIONAL: 使用 light.direction
      direction = normalizeVector(light.direction);
    } else {
      // POINT/SPOT: 从 transform.rotation 计算前向方向
      direction = getForwardFromQuaternion(transform.rotation);
    }
    data.lightDirections[offset + 0] = direction.x;
    data.lightDirections[offset + 1] = direction.y;
    data.lightDirections[offset + 2] = direction.z;
    data.lightDirections[offset + 3] = light.range;

    // lightParams[i]: x = 内锥角余弦, y = 外锥角余弦, z = 衰减指数, w = 阴影索引
    data.lightParams[offset + 0] = Math.cos(light.innerAngle);
    data.lightParams[offset + 1] = Math.cos(light.outerAngle);
    data.lightParams[offset + 2] = light.decay;
    data.lightParams[offset + 3] = light.castShadow ? i : -1; // 简化：阴影索引 = 光源索引
  }
}

/**
 * 将光照 UBO 数据打包为 Float32Array
 * @param data 光照 UBO 数据
 * @returns 打包后的 Float32Array（可直接上传到 GPU）
 *
 * @remarks
 * std140 布局要求：
 * - vec4 数组连续存储
 * - uint 后需要 12 字节 padding 对齐到 16 字节边界
 */
export function packLightsUBO(data: LightsUBOData): Float32Array {
  // 总大小: 128 * 4 + 16 = 528 bytes = 132 floats
  const packed = new Float32Array(132);

  // lightColors (offset 0, 32 floats)
  packed.set(data.lightColors, 0);

  // lightPositions (offset 32, 32 floats)
  packed.set(data.lightPositions, 32);

  // lightDirections (offset 64, 32 floats)
  packed.set(data.lightDirections, 64);

  // lightParams (offset 96, 32 floats)
  packed.set(data.lightParams, 96);

  // lightCount (offset 128, 1 uint as float)
  // 注意：WebGL UBO 中 uint 需要特殊处理
  // 这里使用 Float32Array 视图，实际上传时需要转换
  packed[128] = data.lightCount;

  // padding (offset 129-131, 3 floats)
  packed[129] = 0;
  packed[130] = 0;
  packed[131] = 0;

  return packed;
}

/**
 * 将光照 UBO 数据打包为 ArrayBuffer（包含正确的 uint 类型）
 * @param data 光照 UBO 数据
 * @returns 打包后的 ArrayBuffer
 */
export function packLightsUBOBuffer(data: LightsUBOData): ArrayBuffer {
  const buffer = new ArrayBuffer(LIGHTS_UBO_SIZE);
  const floatView = new Float32Array(buffer, 0, 128); // 前 512 字节
  const uintView = new Uint32Array(buffer, 512, 1); // lightCount
  // padding 自动为 0

  // 复制 vec4 数组数据
  floatView.set(data.lightColors, 0);
  floatView.set(data.lightPositions, 32);
  floatView.set(data.lightDirections, 64);
  floatView.set(data.lightParams, 96);

  // 设置 lightCount
  uintView[0] = data.lightCount;

  return buffer;
}

// ==================== 辅助函数 ====================

/**
 * 归一化向量
 * @param v 输入向量
 * @returns 归一化后的向量
 */
function normalizeVector(v: Vector3Like): Vector3Like {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) {
    return { x: 0, y: -1, z: 0 }; // 默认向下
  }
  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  };
}

/**
 * 从四元数计算前向方向（-Z 轴）
 * @param q 四元数
 * @returns 前向方向向量
 *
 * @remarks
 * 在左手坐标系中，前向方向为 -Z 轴。
 * 四元数旋转公式：v' = q * v * q^-1
 * 对于单位向量 (0, 0, -1)，简化计算如下。
 */
function getForwardFromQuaternion(q: QuaternionLike): Vector3Like {
  const { x, y, z, w } = q;

  // 计算旋转后的 -Z 轴方向
  // 这是四元数旋转 (0, 0, -1) 的简化形式
  return {
    x: -2 * (x * z + w * y),
    y: -2 * (y * z - w * x),
    z: -(1 - 2 * (x * x + y * y)),
  };
}

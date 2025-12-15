/**
 * instancing/index.ts
 * 实例化渲染模块统一导出
 *
 * 提供实例化渲染所需的工具集：
 * - InstanceBuffer: 实例数据缓冲区管理器
 * - InstancedRenderer: 实例化渲染器封装
 * - 类型定义和辅助函数
 *
 * @example
 * ```typescript
 * import {
 *   InstanceBuffer,
 *   InstancedRenderer,
 *   getStandardInstanceLayout,
 * } from './utils/instancing';
 *
 * // 1. 创建实例缓冲区
 * const instanceBuffer = runner.track(new InstanceBuffer(runner.device, {
 *   maxInstances: 10000,
 *   instanceLayout: getStandardInstanceLayout(2),
 * }));
 *
 * // 2. 创建实例化渲染器
 * const renderer = runner.track(new InstancedRenderer(
 *   runner.device,
 *   instanceBuffer,
 *   baseGeometry
 * ));
 *
 * // 3. 更新实例数据
 * const instanceData = new Float32Array(20); // mat4 + vec4
 * instanceBuffer.updateInstance(0, instanceData);
 *
 * // 4. 渲染
 * renderer.draw(renderPass, instanceBuffer.getInstanceCount());
 * ```
 */

// 类导出
export { InstanceBuffer } from './InstanceBuffer';
export { InstancedRenderer } from './InstancedRenderer';

// 类型导出
export type {
  InstanceAttribute,
  InstancedRenderOptions,
  StandardInstanceData,
  InstanceStats,
  BaseGeometryConfig,
} from './types';

// 辅助函数导出
export { getStandardInstanceLayout, calculateInstanceStride } from './types';

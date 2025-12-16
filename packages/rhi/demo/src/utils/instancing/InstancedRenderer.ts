/**
 * instancing/InstancedRenderer.ts
 * 实例化渲染器
 *
 * 封装实例化渲染的核心逻辑，简化实例化 Draw Call 的使用。
 * 自动管理顶点布局（基础几何 + 实例属性），提供便捷的渲染接口。
 *
 * 核心特性：
 * - 自动组合基础几何和实例属性的顶点布局
 * - 支持索引和非索引渲染
 * - 封装 drawIndexed() / draw() 调用
 * - 提供顶点布局查询接口（用于创建渲染管线）
 *
 * @example
 * ```typescript
 * // 1. 创建实例缓冲区
 * const instanceBuffer = runner.track(new InstanceBuffer(runner.device, {
 *   maxInstances: 10000,
 *   instanceLayout: getStandardInstanceLayout(2),
 * }));
 *
 * // 2. 创建基础几何体
 * const cubeGeometry = GeometryGenerator.createCube({ size: 1.0 });
 * const vertexBuffer = runner.createVertexBuffer(cubeGeometry.vertices);
 * const indexBuffer = runner.createIndexBuffer(cubeGeometry.indices);
 *
 * // 3. 创建实例化渲染器
 * const renderer = runner.track(new InstancedRenderer(runner.device, instanceBuffer, {
 *   vertexBuffer,
 *   indexBuffer,
 *   vertexCount: cubeGeometry.vertexCount,
 *   indexCount: cubeGeometry.indexCount,
 *   indexFormat: 'uint16',
 * }));
 *
 * // 4. 获取顶点布局（用于创建管线）
 * const vertexBufferLayouts = renderer.getVertexBufferLayouts();
 * const pipeline = runner.device.createRenderPipeline({
 *   // ...
 *   vertex: {
 *     // ...
 *     buffers: vertexBufferLayouts,
 *   },
 * });
 *
 * // 5. 渲染
 * renderPass.setPipeline(pipeline);
 * renderer.draw(renderPass, instanceBuffer.getInstanceCount());
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { InstanceBuffer } from './InstanceBuffer';
import type { BaseGeometryConfig } from './types';

export class InstancedRenderer {
  private device: MSpec.IRHIDevice;
  private instanceBuffer: InstanceBuffer;
  private baseGeometry: BaseGeometryConfig;

  /**
   * 创建实例化渲染器
   *
   * @param device RHI 设备
   * @param instanceBuffer 实例缓冲区
   * @param baseGeometry 基础几何体配置
   */
  constructor(device: MSpec.IRHIDevice, instanceBuffer: InstanceBuffer, baseGeometry: BaseGeometryConfig) {
    this.device = device;
    this.instanceBuffer = instanceBuffer;
    this.baseGeometry = baseGeometry;

    // 验证几何体配置
    if (baseGeometry.indexBuffer && !baseGeometry.indexCount) {
      console.warn('[InstancedRenderer] Index buffer provided but indexCount is 0');
    }
  }

  /**
   * 执行实例化渲染
   *
   * @param renderPass 渲染通道
   * @param instanceCount 要渲染的实例数量
   *
   * @example
   * ```typescript
   * renderPass.setPipeline(pipeline);
   * renderer.draw(renderPass, 1000); // 渲染 1000 个实例
   * ```
   */
  draw(renderPass: MSpec.IRHIRenderPass, instanceCount: number): void {
    if (instanceCount <= 0) {
      console.warn('[InstancedRenderer] Instance count must be > 0');
      return;
    }

    const maxInstances = this.instanceBuffer.getStats().maxInstances;
    if (instanceCount > maxInstances) {
      console.error(`[InstancedRenderer] Instance count (${instanceCount}) exceeds buffer capacity (${maxInstances})`);
      return;
    }

    // 绑定顶点缓冲区
    // Buffer 0: 基础几何（per-vertex）
    renderPass.setVertexBuffer(0, this.baseGeometry.vertexBuffer);

    // Buffer 1: 实例数据（per-instance）
    renderPass.setVertexBuffer(1, this.instanceBuffer.getBuffer());

    // 执行 Draw Call
    if (this.baseGeometry.indexBuffer && this.baseGeometry.indexCount) {
      // 索引渲染
      renderPass.setIndexBuffer(
        this.baseGeometry.indexBuffer,
        this.baseGeometry.indexFormat ?? MSpec.RHIIndexFormat.UINT16
      );
      renderPass.drawIndexed(
        this.baseGeometry.indexCount,
        instanceCount, // 实例数量
        0, // firstIndex
        0, // baseVertex
        0 // firstInstance
      );
    } else {
      // 非索引渲染
      renderPass.draw(
        this.baseGeometry.vertexCount,
        instanceCount, // 实例数量
        0, // firstVertex
        0 // firstInstance
      );
    }
  }

  /**
   * 获取顶点缓冲区布局（用于创建渲染管线）
   *
   * 返回两个 buffer 的布局：
   * - Buffer 0: 基础几何顶点属性（per-vertex）
   * - Buffer 1: 实例属性（per-instance）
   *
   * @param baseVertexStride 基础顶点数据步长（默认 24 bytes = vec3 pos + vec3 normal）
   * @returns 顶点缓冲区布局数组
   *
   * @example
   * ```typescript
   * const layouts = renderer.getVertexBufferLayouts(24);
   * const pipeline = device.createRenderPipeline({
   *   vertex: {
   *     module: vertexShader,
   *     entryPoint: 'main',
   *     buffers: layouts,
   *   },
   *   // ...
   * });
   * ```
   */
  getVertexBufferLayouts(baseVertexStride: number = 24): MSpec.RHIVertexBufferLayout[] {
    const instanceLayout = this.instanceBuffer.getLayout();
    const instanceStride = this.instanceBuffer.getStrideBytes();

    return [
      // Buffer 0: 基础几何（per-vertex）
      // 默认布局：vec3 position + vec3 normal = 24 bytes
      {
        index: 0,
        stride: baseVertexStride,
        stepMode: MSpec.RHIVertexStepMode.VERTEX,
        attributes: [
          {
            name: 'aPosition',
            shaderLocation: 0,
            format: MSpec.RHIVertexFormat.FLOAT32x3,
            offset: 0,
          }, // aPosition
          {
            name: 'aNormal',
            shaderLocation: 1,
            format: MSpec.RHIVertexFormat.FLOAT32x3,
            offset: 12,
          }, // aNormal
        ],
      },

      // Buffer 1: 实例数据（per-instance）
      {
        index: 1,
        stride: instanceStride,
        stepMode: MSpec.RHIVertexStepMode.INSTANCE,
        attributes: instanceLayout.map((attr) => ({
          name: attr.name,
          shaderLocation: attr.location,
          format: attr.format,
          offset: attr.offset,
        })),
      },
    ];
  }

  /**
   * 获取扩展的顶点缓冲区布局（支持自定义基础顶点属性）
   *
   * @param baseAttributes 基础顶点属性配置
   * @returns 顶点缓冲区布局数组
   *
   * @example
   * ```typescript
   * const layouts = renderer.getVertexBufferLayoutsExtended({
   *   stride: 32, // vec3 pos + vec3 normal + vec2 uv
   *   attributes: [
   *     { location: 0, format: 'float32x3', offset: 0 },  // position
   *     { location: 1, format: 'float32x3', offset: 12 }, // normal
   *     { location: 2, format: 'float32x2', offset: 24 }, // uv
   *   ],
   * });
   * ```
   */
  getVertexBufferLayoutsExtended(baseAttributes: {
    stride: number;
    attributes: Array<{
      name: string;
      location: number;
      format: MSpec.RHIVertexFormat;
      offset: number;
    }>;
  }): MSpec.RHIVertexBufferLayout[] {
    const instanceLayout = this.instanceBuffer.getLayout();
    const instanceStride = this.instanceBuffer.getStrideBytes();

    return [
      // Buffer 0: 基础几何（per-vertex，自定义）
      {
        index: 0,
        stride: baseAttributes.stride,
        stepMode: MSpec.RHIVertexStepMode.VERTEX,
        attributes: baseAttributes.attributes.map((attr) => ({
          name: attr.name,
          shaderLocation: attr.location,
          format: attr.format,
          offset: attr.offset,
        })),
      },

      // Buffer 1: 实例数据（per-instance）
      {
        index: 1,
        stride: instanceStride,
        stepMode: MSpec.RHIVertexStepMode.INSTANCE,
        attributes: instanceLayout.map((attr) => ({
          name: attr.name,
          shaderLocation: attr.location,
          format: attr.format,
          offset: attr.offset,
        })),
      },
    ];
  }

  /**
   * 更新基础几何体（运行时切换几何体）
   *
   * @param newGeometry 新的几何体配置
   *
   * @example
   * ```typescript
   * // 从立方体切换到球体
   * const sphereGeometry = GeometryGenerator.createSphere({ radius: 1.0 });
   * renderer.updateGeometry({
   *   vertexBuffer: sphereVertexBuffer,
   *   indexBuffer: sphereIndexBuffer,
   *   vertexCount: sphereGeometry.vertexCount,
   *   indexCount: sphereGeometry.indexCount,
   * });
   * ```
   */
  updateGeometry(newGeometry: BaseGeometryConfig): void {
    this.baseGeometry = newGeometry;
  }

  /**
   * 获取基础几何体配置
   *
   * @returns 当前基础几何体配置
   */
  getGeometry(): BaseGeometryConfig {
    return this.baseGeometry;
  }

  /**
   * 获取实例缓冲区
   *
   * @returns 实例缓冲区引用
   */
  getInstanceBuffer(): InstanceBuffer {
    return this.instanceBuffer;
  }

  /**
   * 销毁资源
   * 注意：不会销毁 instanceBuffer 和 baseGeometry 的缓冲区，需要手动管理
   */
  destroy(): void {
    console.info('[InstancedRenderer] Destroyed');
    // InstancedRenderer 本身不持有资源，只是封装渲染逻辑
    // 缓冲区由外部管理（通过 runner.track() 或手动 destroy()）
  }
}

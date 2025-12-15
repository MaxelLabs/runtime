/**
 * particle/ParticleRenderer.ts
 * 粒子渲染器
 *
 * 使用实例化渲染批量绘制粒子。
 * 每个粒子渲染为一个 Billboard（始终面向相机的四边形）。
 *
 * 核心特性：
 * - 基于 InstancedRenderer 的批量渲染
 * - Billboard 效果（粒子始终面向相机）
 * - 支持透明混合（Alpha Blending）
 * - 自动管理顶点布局
 *
 * @example
 * ```typescript
 * const renderer = runner.track(new ParticleRenderer(runner.device, particleBuffer, {
 *   billboardSize: 0.1,
 *   blendMode: 'alpha',
 * }));
 *
 * // 获取顶点布局（用于创建管线）
 * const layouts = renderer.getVertexBufferLayouts();
 *
 * // 渲染
 * renderPass.setPipeline(pipeline);
 * renderer.render(renderPass, viewMatrix, projectionMatrix);
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { ParticleBuffer } from './ParticleBuffer';
import { getParticleInstanceLayout } from './types';

export interface ParticleRendererOptions {
  /** Billboard 基础大小，默认 0.1 */
  billboardSize?: number;
  /** 混合模式，默认 'alpha' */
  blendMode?: 'alpha' | 'additive';
  /** 资源标签，用于调试 */
  label?: string;
}

export class ParticleRenderer {
  private device: MSpec.IRHIDevice;
  private particleBuffer: ParticleBuffer;
  private billboardSize: number;
  private blendMode: 'alpha' | 'additive';
  private label: string;

  // Billboard 几何体（单个四边形）
  private vertexBuffer: MSpec.IRHIBuffer;
  private indexBuffer: MSpec.IRHIBuffer;
  private vertexCount: number = 4;
  private indexCount: number = 6;

  /**
   * 创建粒子渲染器
   *
   * @param device RHI 设备
   * @param particleBuffer 粒子缓冲区
   * @param options 配置选项
   */
  constructor(device: MSpec.IRHIDevice, particleBuffer: ParticleBuffer, options: ParticleRendererOptions = {}) {
    this.device = device;
    this.particleBuffer = particleBuffer;
    this.billboardSize = options.billboardSize ?? 0.1;
    this.blendMode = options.blendMode ?? 'alpha';
    this.label = options.label ?? 'ParticleRenderer';

    // 创建 Billboard 几何体
    this.createBillboardGeometry();
  }

  /**
   * 创建 Billboard 几何体（单个四边形）
   *
   * 顶点布局：
   * - position (vec3): 四边形的局部坐标（-0.5 到 +0.5）
   * - texCoord (vec2): UV 坐标
   */
  private createBillboardGeometry(): void {
    const size = this.billboardSize;

    // 顶点数据：position (vec3) + texCoord (vec2) = 5 floats per vertex
    // 四边形的局部坐标（中心为原点）
    const vertices = new Float32Array([
      // position (x, y, z)    texCoord (u, v)
      -size,
      -size,
      0,
      0,
      0, // 左下
      size,
      -size,
      0,
      1,
      0, // 右下
      size,
      size,
      0,
      1,
      1, // 右上
      -size,
      size,
      0,
      0,
      1, // 左上
    ]);

    // 索引数据（两个三角形）
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形
      0,
      2,
      3, // 第二个三角形
    ]);

    // 创建顶点缓冲区
    this.vertexBuffer = this.device.createBuffer({
      label: `${this.label}_VertexBuffer`,
      size: vertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
    });
    this.vertexBuffer.update(vertices as unknown as BufferSource, 0);

    // 创建索引缓冲区
    this.indexBuffer = this.device.createBuffer({
      label: `${this.label}_IndexBuffer`,
      size: indices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
    });
    this.indexBuffer.update(indices as unknown as BufferSource, 0);
  }

  /**
   * 渲染粒子
   *
   * @param renderPass 渲染通道
   */
  render(renderPass: MSpec.IRHIRenderPass): void {
    const instanceCount = this.particleBuffer.getActiveCount();
    if (instanceCount === 0) {
      return;
    }

    // 绑定顶点缓冲区
    // Buffer 0: Billboard 几何体（per-vertex）
    renderPass.setVertexBuffer(0, this.vertexBuffer);

    // Buffer 1: 粒子实例数据（per-instance）
    renderPass.setVertexBuffer(1, this.particleBuffer.getBuffer());

    // 绑定索引缓冲区
    renderPass.setIndexBuffer(this.indexBuffer, MSpec.RHIIndexFormat.UINT16);

    // 执行实例化绘制
    renderPass.drawIndexed(
      this.indexCount, // 索引数量
      instanceCount, // 实例数量
      0, // firstIndex
      0, // baseVertex
      0 // firstInstance
    );
  }

  /**
   * 获取顶点缓冲区布局（用于创建渲染管线）
   *
   * 返回两个 buffer 的布局：
   * - Buffer 0: Billboard 几何体顶点属性（per-vertex）
   *   - location 0: vec3 position
   *   - location 1: vec2 texCoord
   * - Buffer 1: 粒子实例属性（per-instance）
   *   - location 2: vec3 instancePosition
   *   - location 3: vec4 instanceColor
   *   - location 4: float instanceSize
   *
   * @returns 顶点缓冲区布局数组
   */
  getVertexBufferLayouts(): MSpec.RHIVertexBufferLayout[] {
    const instanceLayout = getParticleInstanceLayout(2);
    const instanceStride = this.particleBuffer.getStrideBytes();

    return [
      // Buffer 0: Billboard 几何体（per-vertex）
      // 顶点布局：vec3 position + vec2 texCoord = 20 bytes
      {
        index: 0,
        stride: 20,
        stepMode: 'vertex' as MSpec.RHIVertexStepMode,
        attributes: [
          {
            shaderLocation: 0,
            format: 'float32x3' as MSpec.RHIVertexFormat,
            offset: 0,
          }, // aPosition
          {
            shaderLocation: 1,
            format: 'float32x2' as MSpec.RHIVertexFormat,
            offset: 12,
          }, // aTexCoord
        ],
      },

      // Buffer 1: 粒子实例数据（per-instance）
      {
        index: 1,
        stride: instanceStride,
        stepMode: 'instance' as MSpec.RHIVertexStepMode,
        attributes: instanceLayout.map((attr) => ({
          shaderLocation: attr.location,
          format: attr.format,
          offset: attr.offset,
        })),
      },
    ];
  }

  /**
   * 获取推荐的混合状态配置
   *
   * @returns 混合状态配置
   */
  getBlendState(): MSpec.RHIColorBlendState {
    if (this.blendMode === 'additive') {
      // 加法混合（适合火焰、爆炸等效果）
      return {
        blendEnabled: true,
        srcColorFactor: MSpec.RHIBlendFactor.SrcAlpha,
        dstColorFactor: MSpec.RHIBlendFactor.One,
        colorBlendOperation: MSpec.RHIBlendOperation.ADD,
        srcAlphaFactor: MSpec.RHIBlendFactor.One,
        dstAlphaFactor: MSpec.RHIBlendFactor.One,
        alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
        attachments: [],
      };
    } else {
      // Alpha 混合（适合烟雾、雨雪等效果）
      return {
        blendEnabled: true,
        srcColorFactor: MSpec.RHIBlendFactor.SrcAlpha,
        dstColorFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
        colorBlendOperation: MSpec.RHIBlendOperation.ADD,
        srcAlphaFactor: MSpec.RHIBlendFactor.One,
        dstAlphaFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
        alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
        attachments: [],
      };
    }
  }

  /**
   * 获取粒子缓冲区
   *
   * @returns 粒子缓冲区引用
   */
  getParticleBuffer(): ParticleBuffer {
    return this.particleBuffer;
  }

  /**
   * 更新 Billboard 大小
   *
   * @param size 新的大小
   */
  setBillboardSize(size: number): void {
    if (size !== this.billboardSize) {
      this.billboardSize = size;
      // 销毁旧缓冲区
      this.vertexBuffer.destroy();
      this.indexBuffer.destroy();
      // 重新创建几何体
      this.createBillboardGeometry();
    }
  }

  /**
   * 获取 Billboard 大小
   *
   * @returns 当前大小
   */
  getBillboardSize(): number {
    return this.billboardSize;
  }

  /**
   * 设置混合模式
   *
   * @param mode 混合模式
   */
  setBlendMode(mode: 'alpha' | 'additive'): void {
    this.blendMode = mode;
  }

  /**
   * 获取混合模式
   *
   * @returns 当前混合模式
   */
  getBlendMode(): 'alpha' | 'additive' {
    return this.blendMode;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    console.info(`[ParticleRenderer] Destroying: ${this.label}`);
    this.vertexBuffer.destroy();
    this.indexBuffer.destroy();
  }
}

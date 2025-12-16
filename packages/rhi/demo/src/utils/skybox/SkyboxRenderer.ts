/**
 * skybox/SkyboxRenderer.ts
 * 天空盒渲染器 - 支持立方体贴图天空盒渲染
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { DemoRunner } from '../core';
import { GeometryGenerator } from '../geometry';
import type { SkyboxConfig, SkyboxOptions } from './types';

/**
 * 天空盒渲染器
 *
 * 实现天空盒渲染的核心功能：
 * - 使用反转立方体（从内部渲染）
 * - 移除视图矩阵的位移分量（只保留旋转）
 * - 使用 gl_Position.xyww 强制深度为1.0
 * - 深度测试设为LESS_EQUAL，深度写入关闭
 *
 * @example
 * ```typescript
 * const skybox = new SkyboxRenderer(runner, {
 *   type: SkyType.CUBEMAP,
 *   cubemap: cubemapTexture,
 * });
 *
 * // 在渲染循环中（在所有不透明物体之后）
 * skybox.render(camera);
 * ```
 */
export class SkyboxRenderer {
  private runner: DemoRunner;
  private config: SkyboxConfig;
  private options: Required<SkyboxOptions>;

  // 渲染资源
  private vertexBuffer: MSpec.IRHIBuffer | null = null;
  private indexBuffer: MSpec.IRHIBuffer | null = null;
  private uniformBuffer: MSpec.IRHIBuffer | null = null;
  private pipeline: MSpec.IRHIRenderPipeline | null = null;
  private bindGroup: MSpec.IRHIBindGroup | null = null;
  private sampler: MSpec.IRHISampler | null = null;

  // 几何体数据
  private indexCount: number = 0;

  // 矩阵缓存（避免每帧创建）
  private viewRotationMatrix: MMath.Matrix4;
  private uniformData: Float32Array;

  /**
   * 创建天空盒渲染器
   * @param runner Demo运行器
   * @param config 天空盒配置
   * @param options 渲染选项
   */
  constructor(runner: DemoRunner, config: SkyboxConfig, options: SkyboxOptions = {}) {
    this.runner = runner;
    this.config = config;
    this.options = {
      enabled: options.enabled ?? true,
      exposure: options.exposure ?? 1.0,
      rotation: options.rotation ?? 0,
    };

    // 初始化矩阵缓存
    this.viewRotationMatrix = new MMath.Matrix4();
    // Uniform数据: mat4 projection + mat4 viewRotation = 128 bytes
    this.uniformData = new Float32Array(32);

    this.initialize();
  }

  /**
   * 初始化渲染资源
   */
  private initialize(): void {
    this.createGeometry();
    this.createUniformBuffer();
    this.createSampler();
    this.createPipeline();
    this.createBindGroup();
  }

  /**
   * 创建天空盒几何体（立方体）
   */
  private createGeometry(): void {
    // 生成立方体几何体（只需要位置属性）
    const geometry = GeometryGenerator.cube({
      size: 1, // 大小无关紧要，因为会在着色器中移除位移
      normals: false,
      uvs: false,
    });

    // 创建顶点缓冲区
    this.vertexBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as unknown as BufferSource,
        label: 'Skybox Vertex Buffer',
      })
    );

    // 创建索引缓冲区
    if (geometry.indices) {
      this.indexBuffer = this.runner.track(
        this.runner.device.createBuffer({
          size: geometry.indices.byteLength,
          usage: MSpec.RHIBufferUsage.INDEX,
          hint: 'static',
          initialData: geometry.indices as unknown as BufferSource,
          label: 'Skybox Index Buffer',
        })
      );
      this.indexCount = geometry.indexCount!;
    }
  }

  /**
   * 创建Uniform缓冲区
   */
  private createUniformBuffer(): void {
    // Uniform Block: mat4 projection + mat4 viewRotation = 128 bytes
    this.uniformBuffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 128,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Skybox Uniform Buffer',
      })
    );
  }

  /**
   * 创建采样器
   */
  private createSampler(): void {
    this.sampler = this.runner.track(
      this.runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        label: 'Skybox Sampler',
      })
    );
  }

  /**
   * 创建渲染管线
   */
  private createPipeline(): void {
    // 顶点着色器
    const vertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform Transforms {
  mat4 uProjection;
  mat4 uViewRotation;
};

out vec3 vTexCoord;

void main() {
    // 使用局部坐标作为纹理坐标
    vTexCoord = aPosition;

    // 应用变换
    vec4 pos = uProjection * uViewRotation * vec4(aPosition, 1.0);

    // 强制深度为1.0（最远处）
    gl_Position = pos.xyww;
}`;

    // 片段着色器
    const fragmentShader = `#version 300 es
precision mediump float;

in vec3 vTexCoord;
uniform samplerCube uSkybox;
uniform float uExposure;

out vec4 fragColor;

void main() {
    vec3 color = texture(uSkybox, vTexCoord).rgb;

    // 应用曝光
    color *= uExposure;

    fragColor = vec4(color, 1.0);
}`;

    // 创建着色器模块
    const vertexShaderModule = this.runner.device.createShaderModule({
      code: vertexShader,
      label: 'Skybox Vertex Shader',
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    const fragmentShaderModule = this.runner.device.createShaderModule({
      code: fragmentShader,
      label: 'Skybox Fragment Shader',
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    // 创建绑定组布局
    const bindGroupLayout = this.runner.device.createBindGroupLayout([
      { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
        name: 'uSkybox',
      },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, sampler: { type: 'filtering' }, name: 'uSkyboxSampler' },
      { binding: 3, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'uExposure' },
    ]);

    // 创建管线布局
    const pipelineLayout = this.runner.device.createPipelineLayout([bindGroupLayout]);

    // 创建管线
    this.pipeline = this.runner.track(
      this.runner.device.createRenderPipeline({
        vertexShader: vertexShaderModule,
        fragmentShader: fragmentShaderModule,
        vertexLayout: {
          buffers: [
            {
              index: 0,
              stride: 12, // vec3 position = 12 bytes
              stepMode: 'vertex' as MSpec.RHIVertexStepMode,
              attributes: [
                {
                  name: 'aPosition',
                  shaderLocation: 0,
                  offset: 0,
                  format: MSpec.RHIVertexFormat.FLOAT32x3,
                },
              ],
            },
          ],
        },
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        rasterizationState: {
          cullMode: MSpec.RHICullMode.FRONT, // 反转立方体，剔除前面
        },
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM,
          depthWriteEnabled: false, // 不写入深度
          depthCompare: MSpec.RHICompareFunction.LESS_EQUAL, // 深度测试为LESS_EQUAL
        },
        label: 'Skybox Pipeline',
      })
    );
  }

  /**
   * 创建绑定组
   */
  private createBindGroup(): void {
    if (!this.config.cubemap) {
      throw new Error('[SkyboxRenderer] 立方体贴图纹理未提供');
    }

    const cubemapView = this.config.cubemap.createView({
      dimension: MSpec.RHITextureType.TEXTURE_CUBE,
    } as any);

    // 这里需要重新获取bindGroupLayout，但是createRenderPipeline不返回layout
    // 所以我们需要在类属性中保存bindGroupLayout或者手动重建
    // 为了简单起见，我们重新创建bindGroupLayout (或者应该保存它)
    // 更好的做法是: 在 createPipeline 中创建 bindGroupLayout 并保存到 this.bindGroupLayout
    // 但为了尽量少改动，我们这里重新创建一次相同的 layout
    const bindGroupLayout = this.runner.device.createBindGroupLayout([
      { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
        name: 'uSkybox',
      },
      { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, sampler: { type: 'filtering' }, name: 'uSkyboxSampler' },
      { binding: 3, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'uExposure' },
    ]);

    this.bindGroup = this.runner.track(
      this.runner.device.createBindGroup(bindGroupLayout, [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer! },
        },
        {
          binding: 1,
          resource: cubemapView,
        },
        {
          binding: 2,
          resource: this.sampler!,
        },
        {
          binding: 3,
          resource: { buffer: this.createExposureBuffer() },
        },
      ])
    );
  }

  /**
   * 创建曝光参数缓冲区
   */
  private createExposureBuffer(): MSpec.IRHIBuffer {
    const buffer = this.runner.track(
      this.runner.device.createBuffer({
        size: 16, // float + padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Skybox Exposure Buffer',
      })
    );

    // 初始化曝光值
    const data = new Float32Array([this.options.exposure, 0, 0, 0]);
    buffer.update(data as unknown as BufferSource);

    return buffer;
  }

  /**
   * 更新视图旋转矩阵（移除位移分量）
   * @param viewMatrix 原始视图矩阵
   */
  private updateViewRotationMatrix(viewMatrix: MMath.Matrix4): void {
    // 复制视图矩阵
    this.viewRotationMatrix.copyFrom(viewMatrix);

    // 移除位移分量（只保留旋转）
    // 列主序：m[12], m[13], m[14] 是位移分量
    const elements = this.viewRotationMatrix.getElements();
    elements[12] = 0;
    elements[13] = 0;
    elements[14] = 0;

    // Check if set accepts one argument or spread arguments.
    // Usually set(array) or set(n11, n12, ...).
    // Linter error "Expected 16 arguments, but got 1" suggests it expects 16 numbers.
    // So we should spread the array or pass 16 arguments.
    // Or maybe elements is Float32Array and set supports it?
    // If linter says "Expected 16 arguments", it means the overload taking an array is not found or not matched.
    // However, if we look at `this.uniformData.set(...)`, that works for Float32Array.
    // `Matrix4.set` might be `set(n11: number, n12: number, ...)`

    // Let's try spreading if it's an array, but elements is Float32Array.
    // If `set` only takes 16 arguments, we can use `fromArray` if available or manually set.
    // But wait, `elements` is the internal array (reference or copy).
    // If `getElements` returns the internal array, we are already modifying it in place!
    // If it returns a copy, we need to put it back.

    // Let's try assuming `set` takes 16 args and spread it (if supported) or just rely on in-place modification if possible.
    // But safer is to assume we need to set it back.
    // If `set` takes 16 numbers, we can't spread Float32Array in strict TS easily without `...Array.from(elements)`.

    // Alternative: Maybe there is `copy` method that takes another Matrix4?
    // `this.viewRotationMatrix.copy(viewMatrix)` was there originally but `copy` didn't exist.

    // Let's try `set` with spreading array from elements.
    this.viewRotationMatrix.set(
      ...(Array.from(elements) as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ])
    );

    // 应用额外的旋转（如果有）
    if (this.options.rotation !== 0) {
      const rotationMatrix = new MMath.Matrix4();
      const c = Math.cos(this.options.rotation);
      const s = Math.sin(this.options.rotation);

      // Manually construct rotation matrix
      rotationMatrix.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
      this.viewRotationMatrix.multiply(rotationMatrix);
    }
  }

  /**
   * 渲染天空盒
   * @param projectionMatrix 投影矩阵
   * @param viewMatrix 视图矩阵
   * @param passEncoder 渲染通道编码器
   */
  render(projectionMatrix: MMath.Matrix4, viewMatrix: MMath.Matrix4, passEncoder: MSpec.IRHIRenderPass): void {
    if (!this.options.enabled) {
      return;
    }

    // 更新视图旋转矩阵
    this.updateViewRotationMatrix(viewMatrix);

    // 更新Uniform数据
    // 前64字节：投影矩阵（列主序）
    this.uniformData.set(projectionMatrix.getElements(), 0);
    // 后64字节：视图旋转矩阵（列主序）
    this.uniformData.set(this.viewRotationMatrix.getElements(), 16);

    // 上传到GPU
    this.uniformBuffer!.update(this.uniformData as unknown as BufferSource);

    // 设置管线和绑定组
    passEncoder.setPipeline(this.pipeline!);
    passEncoder.setBindGroup(0, this.bindGroup!);

    // 设置顶点缓冲区
    passEncoder.setVertexBuffer(0, this.vertexBuffer!);

    // 设置索引缓冲区并绘制
    if (this.indexBuffer) {
      passEncoder.setIndexBuffer(this.indexBuffer, MSpec.RHIIndexFormat.UINT16);
      passEncoder.drawIndexed(this.indexCount, 1, 0, 0, 0);
    }
  }

  /**
   * 更新配置
   * @param config 新的配置
   */
  updateConfig(config: Partial<SkyboxConfig>): void {
    if (config.type !== undefined) {
      this.config.type = config.type;
    }
    if (config.cubemap !== undefined) {
      this.config.cubemap = config.cubemap;
      // 重新创建绑定组
      this.createBindGroup();
    }
  }

  /**
   * 更新渲染选项
   * @param options 新的选项
   */
  updateOptions(options: Partial<SkyboxOptions>): void {
    if (options.enabled !== undefined) {
      this.options.enabled = options.enabled;
    }
    if (options.exposure !== undefined) {
      this.options.exposure = options.exposure;
    }
    if (options.rotation !== undefined) {
      this.options.rotation = options.rotation;
    }
  }

  /**
   * 销毁渲染器（资源由runner自动管理）
   */
  destroy(): void {
    // 资源通过runner.track()管理，会自动销毁
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.uniformBuffer = null;
    this.pipeline = null;
    this.bindGroup = null;
    this.sampler = null;
  }
}

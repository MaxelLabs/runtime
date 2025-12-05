/**
 * opaque-pass.ts
 * 不透明物体渲染通道 - 基于RHI硬件抽象层
 * 用于渲染不透明的几何体
 */

import {
  type IRHIDevice,
  type IRHIRenderPass,
  type IRHIRenderPipeline,
  type IRHIBindGroup,
  type IRHIShaderModule,
  type IRHIBindGroupLayout,
  type IRHIPipelineLayout,
  RHITextureFormat,
} from '@maxellabs/specification';
import {
  RHIPrimitiveTopology,
  RHICullMode,
  RHIFrontFace,
  RHICompareFunction,
  RHIBlendFactor,
  RHIBlendOperation,
} from '@maxellabs/specification';
import type { Camera } from '../../camera/camera';
import type { RenderElement } from '../render-element';
import { RenderPassBase, type RenderPassConfig } from './render-pass-base';

/**
 * 不透明渲染通道配置
 */
export interface OpaquePassConfig extends RenderPassConfig {
  /**
   * 是否启用深度预排序
   */
  enableDepthPreSort?: boolean;

  /**
   * 是否启用实例化渲染
   */
  enableInstancing?: boolean;

  /**
   * 最大实例数量
   */
  maxInstances?: number;
}

/**
 * 不透明物体渲染通道
 * 按前到后的顺序渲染不透明几何体，减少过度绘制
 */
export class OpaquePass extends RenderPassBase {
  protected override config: Required<OpaquePassConfig>;
  private pipelineCache = new Map<string, IRHIRenderPipeline>();
  private bindGroupCache = new Map<string, IRHIBindGroup[]>();

  // 着色器资源
  private vertexShader: IRHIShaderModule | null = null;
  private fragmentShader: IRHIShaderModule | null = null;
  private bindGroupLayout: IRHIBindGroupLayout | null = null;
  private pipelineLayout: IRHIPipelineLayout | null = null;

  constructor(device: IRHIDevice, config: OpaquePassConfig) {
    super(device, config);

    this.config = {
      enableDepthPreSort: true,
      enableInstancing: false,
      maxInstances: 100,
      ...config,
    } as Required<OpaquePassConfig>;

    this.initializeShaders();
  }

  /**
   * 初始化着色器
   */
  private async initializeShaders(): Promise<void> {
    try {
      // 创建基础顶点着色器
      this.vertexShader = this.device.createShaderModule({
        code: this.getDefaultVertexShaderCode(),
        language: 'glsl',
        stage: 'vertex',
        label: 'OpaquePass-VertexShader',
      });

      // 创建基础片段着色器
      this.fragmentShader = this.device.createShaderModule({
        code: this.getDefaultFragmentShaderCode(),
        language: 'glsl',
        stage: 'fragment',
        label: 'OpaquePass-FragmentShader',
      });

      // 创建绑定组布局
      this.bindGroupLayout = this.device.createBindGroupLayout(
        [
          // 相机uniform缓冲区
          {
            binding: 0,
            visibility: 'vertex',
            type: 'uniform-buffer',
          },
          // 模型变换uniform缓冲区
          {
            binding: 1,
            visibility: 'vertex',
            type: 'uniform-buffer',
          },
          // 材质uniform缓冲区
          {
            binding: 2,
            visibility: 'fragment',
            type: 'uniform-buffer',
          },
          // 漫反射纹理
          {
            binding: 3,
            visibility: 'fragment',
            type: 'texture',
          },
          // 纹理采样器
          {
            binding: 4,
            visibility: 'fragment',
            type: 'sampler',
          },
        ],
        'OpaquePass-BindGroupLayout'
      );

      // 创建管线布局
      this.pipelineLayout = this.device.createPipelineLayout([this.bindGroupLayout], 'OpaquePass-PipelineLayout');
    } catch (error) {
      console.error('OpaquePass: 着色器初始化失败:', error);
    }
  }

  /**
   * 获取默认顶点着色器代码
   */
  private getDefaultVertexShaderCode(): string {
    return `
      #version 300 es
      precision highp float;

      // 顶点属性
      layout(location = 0) in vec3 a_position;
      layout(location = 1) in vec3 a_normal;
      layout(location = 2) in vec2 a_texCoord;

      // Uniform块
      layout(std140) uniform Camera {
        mat4 u_viewMatrix;
        mat4 u_projectionMatrix;
        mat4 u_viewProjectionMatrix;
        vec3 u_cameraPosition;
      };

      layout(std140) uniform Model {
        mat4 u_modelMatrix;
        mat4 u_normalMatrix;
      };

      // 输出到片段着色器
      out vec3 v_worldPosition;
      out vec3 v_worldNormal;
      out vec2 v_texCoord;

      void main() {
        // 计算世界空间位置
        vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
        v_worldPosition = worldPosition.xyz;

        // 计算世界空间法线
        v_worldNormal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);

        // 传递纹理坐标
        v_texCoord = a_texCoord;

        // 计算裁剪空间位置
        gl_Position = u_viewProjectionMatrix * worldPosition;
      }
    `;
  }

  /**
   * 获取默认片段着色器代码
   */
  private getDefaultFragmentShaderCode(): string {
    return `
      #version 300 es
      precision highp float;

      // 来自顶点着色器的输入
      in vec3 v_worldPosition;
      in vec3 v_worldNormal;
      in vec2 v_texCoord;

      // Uniform块
      layout(std140) uniform Material {
        vec4 u_baseColor;
        float u_metallic;
        float u_roughness;
        float u_transparency;
      };

      // 纹理
      uniform sampler2D u_baseColorTexture;

      // 输出
      out vec4 fragColor;

      void main() {
        // 采样基础颜色纹理
        vec4 textureColor = texture(u_baseColorTexture, v_texCoord);

        // 组合材质颜色和纹理颜色
        vec4 finalColor = u_baseColor * textureColor;

        // 简单的光照计算（临时）
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(normalize(v_worldNormal), lightDir), 0.0);

        finalColor.rgb *= lightIntensity * 0.8 + 0.2; // 环境光
        finalColor.a *= u_transparency;

        fragColor = finalColor;
      }
    `;
  }

  /**
   * 执行渲染
   */
  protected render(renderPass: IRHIRenderPass, camera: Camera, renderElements: readonly RenderElement[]): void {
    // 过滤不透明元素
    const opaqueElements = renderElements.filter((element) => !element.isTransparent);

    if (opaqueElements.length === 0) {
      return;
    }

    // 如果启用深度预排序，按距离排序
    if (this.config.enableDepthPreSort) {
      opaqueElements.sort((a, b) => a.distanceToCamera - b.distanceToCamera);
    }

    // 渲染所有不透明元素
    for (const element of opaqueElements) {
      this.renderElement(renderPass, element);
    }
  }

  /**
   * 获取渲染管线
   */
  protected getRenderPipeline(element: RenderElement): IRHIRenderPipeline | null {
    if (!this.vertexShader || !this.fragmentShader || !this.pipelineLayout) {
      return null;
    }

    const material = element.material;
    const mesh = element.mesh;

    // 创建管线缓存键
    const pipelineKey = `${material.getId()}-${mesh.getVertexLayout().toString()}`;

    // 检查缓存
    let pipeline = this.pipelineCache.get(pipelineKey);
    if (pipeline) {
      return pipeline;
    }

    try {
      // 创建新的渲染管线
      pipeline = this.device.createRenderPipeline({
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        vertexLayout: {
          buffers: mesh.getVertexLayout(),
        },
        primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: this.pipelineLayout,
        rasterizationState: {
          cullMode: RHICullMode.Back,
          frontFace: RHIFrontFace.CCW,
        },
        depthStencilState: {
          depthWriteEnabled: true,
          format: RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthCompare: RHICompareFunction.LESS,
        },
        colorBlendState: {
          attachments: [
            {
              color: {
                enable: false,
                srcFactor: RHIBlendFactor.SrcAlpha,
                dstFactor: RHIBlendFactor.OneMinusSrcAlpha,
                operation: RHIBlendOperation.ADD,
              },
              alpha: {
                enable: false,
                srcFactor: RHIBlendFactor.SrcAlpha,
                dstFactor: RHIBlendFactor.OneMinusSrcAlpha,
                operation: RHIBlendOperation.ADD,
              },
            },
          ],
        },
        label: `OpaquePass-Pipeline-${pipelineKey}`,
      });

      // 缓存管线
      this.pipelineCache.set(pipelineKey, pipeline);

      return pipeline;
    } catch (error) {
      console.error(`OpaquePass: 创建渲染管线失败 ${pipelineKey}:`, error);
      return null;
    }
  }

  /**
   * 获取绑定组
   */
  protected getBindGroups(element: RenderElement): IRHIBindGroup[] | null {
    if (!this.bindGroupLayout) {
      return null;
    }

    const cacheKey = `${element.material.getId()}-${element.gameObject.getId()}`;

    // 检查缓存
    const bindGroups = this.bindGroupCache.get(cacheKey);
    if (bindGroups) {
      return bindGroups;
    }

    try {
      // TODO: 创建实际的uniform缓冲区和纹理绑定
      // 这里需要根据材质和变换矩阵创建实际的绑定组
      // 暂时返回null，等RHI实现完成后补充

      return null;
    } catch (error) {
      console.error(`OpaquePass: 创建绑定组失败 ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * 更新配置
   */
  override updateConfig(newConfig: Partial<OpaquePassConfig>): void {
    Object.assign(this.config, newConfig);
    super.updateConfig(newConfig);
  }

  /**
   * 销毁渲染通道
   */
  override destroy(): void {
    // 清理管线缓存
    for (const pipeline of this.pipelineCache.values()) {
      pipeline.destroy();
    }
    this.pipelineCache.clear();

    // 清理绑定组缓存
    for (const bindGroups of this.bindGroupCache.values()) {
      for (const bindGroup of bindGroups) {
        bindGroup.destroy();
      }
    }
    this.bindGroupCache.clear();

    // 清理着色器资源
    this.vertexShader?.destroy();
    this.fragmentShader?.destroy();
    this.bindGroupLayout?.destroy();
    this.pipelineLayout?.destroy();

    super.destroy();
  }
}

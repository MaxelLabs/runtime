/**
 * transparent-pass.ts
 * 透明物体渲染通道 - 基于RHI硬件抽象层
 * 用于渲染透明的几何体，后到前排序
 */

import type {
  IRHIDevice,
  IRHIRenderPass,
  IRHIRenderPipeline,
  IRHIBindGroup,
  IRHIShaderModule,
  IRHIBindGroupLayout,
  IRHIPipelineLayout,
} from '../../interface/rhi';
import type { Camera } from '../../camera/camera';
import type { RenderElement } from '../render-element';
import { RenderPassBase, type RenderPassConfig } from './render-pass-base';

/**
 * 透明渲染通道配置
 */
export interface TransparentPassConfig extends RenderPassConfig {
  /**
   * 是否启用深度排序
   */
  enableDepthSort?: boolean;

  /**
   * 是否启用预乘Alpha
   */
  enablePremultipliedAlpha?: boolean;

  /**
   * 透明度阈值
   */
  alphaThreshold?: number;

  /**
   * 是否启用深度写入
   */
  enableDepthWrite?: boolean;
}

/**
 * 透明物体渲染通道
 * 按后到前的顺序渲染透明几何体，确保正确的混合效果
 */
export class TransparentPass extends RenderPassBase {
  private config: Required<TransparentPassConfig>;
  private pipelineCache = new Map<string, IRHIRenderPipeline>();
  private bindGroupCache = new Map<string, IRHIBindGroup[]>();

  // 着色器资源
  private vertexShader: IRHIShaderModule | null = null;
  private fragmentShader: IRHIShaderModule | null = null;
  private bindGroupLayout: IRHIBindGroupLayout | null = null;
  private pipelineLayout: IRHIPipelineLayout | null = null;

  constructor(device: IRHIDevice, config: TransparentPassConfig) {
    super(device, config);

    this.config = {
      enableDepthSort: true,
      enablePremultipliedAlpha: false,
      alphaThreshold: 0.01,
      enableDepthWrite: false,
      ...config,
    } as Required<TransparentPassConfig>;

    this.initializeShaders();
  }

  /**
   * 初始化着色器
   */
  private async initializeShaders(): Promise<void> {
    try {
      // 创建透明顶点着色器
      this.vertexShader = this.device.createShaderModule({
        code: this.getTransparentVertexShaderCode(),
        language: 'glsl',
        label: 'TransparentPass-VertexShader',
      });

      // 创建透明片段着色器
      this.fragmentShader = this.device.createShaderModule({
        code: this.getTransparentFragmentShaderCode(),
        language: 'glsl',
        label: 'TransparentPass-FragmentShader',
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
          // 透明度纹理
          {
            binding: 5,
            visibility: 'fragment',
            type: 'texture',
          },
        ],
        'TransparentPass-BindGroupLayout'
      );

      // 创建管线布局
      this.pipelineLayout = this.device.createPipelineLayout([this.bindGroupLayout], 'TransparentPass-PipelineLayout');
    } catch (error) {
      console.error('TransparentPass: 着色器初始化失败:', error);
    }
  }

  /**
   * 获取透明顶点着色器代码
   */
  private getTransparentVertexShaderCode(): string {
    return `
      #version 300 es
      precision highp float;

      // 顶点属性
      layout(location = 0) in vec3 a_position;
      layout(location = 1) in vec3 a_normal;
      layout(location = 2) in vec2 a_texCoord;
      layout(location = 3) in vec4 a_color;

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
      out vec4 v_color;
      out float v_cameraDistance;

      void main() {
        // 计算世界空间位置
        vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
        v_worldPosition = worldPosition.xyz;

        // 计算世界空间法线
        v_worldNormal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);

        // 传递纹理坐标和顶点颜色
        v_texCoord = a_texCoord;
        v_color = a_color;

        // 计算到相机的距离
        v_cameraDistance = length(worldPosition.xyz - u_cameraPosition);

        // 计算裁剪空间位置
        gl_Position = u_viewProjectionMatrix * worldPosition;
      }
    `;
  }

  /**
   * 获取透明片段着色器代码
   */
  private getTransparentFragmentShaderCode(): string {
    return `
      #version 300 es
      precision highp float;

      // 来自顶点着色器的输入
      in vec3 v_worldPosition;
      in vec3 v_worldNormal;
      in vec2 v_texCoord;
      in vec4 v_color;
      in float v_cameraDistance;

      // Uniform块
      layout(std140) uniform Material {
        vec4 u_baseColor;
        float u_metallic;
        float u_roughness;
        float u_transparency;
        float u_alphaThreshold;
        float u_premultipliedAlpha;
      };

      // 纹理
      uniform sampler2D u_baseColorTexture;
      uniform sampler2D u_alphaTexture;

      // 输出
      out vec4 fragColor;

      void main() {
        // 采样基础颜色纹理
        vec4 textureColor = texture(u_baseColorTexture, v_texCoord);

        // 采样透明度纹理
        float alphaFromTexture = texture(u_alphaTexture, v_texCoord).r;

        // 组合材质颜色、纹理颜色和顶点颜色
        vec4 finalColor = u_baseColor * textureColor * v_color;

        // 计算最终透明度
        float finalAlpha = finalColor.a * u_transparency * alphaFromTexture;

        // Alpha测试
        if (finalAlpha < u_alphaThreshold) {
          discard;
        }

        // 简单的光照计算
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float lightIntensity = max(dot(normalize(v_worldNormal), lightDir), 0.0);

        finalColor.rgb *= lightIntensity * 0.8 + 0.2; // 环境光

        // 距离衰减效果（可选）
        float distanceFactor = 1.0 - clamp(v_cameraDistance / 100.0, 0.0, 1.0);
        finalColor.a *= finalAlpha * distanceFactor;

        // 预乘Alpha处理
        if (u_premultipliedAlpha > 0.5) {
          finalColor.rgb *= finalColor.a;
        }

        fragColor = finalColor;
      }
    `;
  }

  /**
   * 执行渲染
   */
  protected render(renderPass: IRHIRenderPass, camera: Camera, renderElements: readonly RenderElement[]): void {
    // 过滤透明元素
    const transparentElements = renderElements.filter((element) => element.isTransparent);

    if (transparentElements.length === 0) {
      return;
    }

    // 按距离排序（后到前）
    if (this.config.enableDepthSort) {
      transparentElements.sort((a, b) => b.distanceToCamera - a.distanceToCamera);
    }

    // 渲染所有透明元素
    for (const element of transparentElements) {
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
    const blendMode = material.getBlendMode();

    // 创建管线缓存键，包含混合模式
    const pipelineKey = `${material.getId()}-${mesh.getVertexLayout().toString()}-${blendMode}`;

    // 检查缓存
    let pipeline = this.pipelineCache.get(pipelineKey);
    if (pipeline) {
      return pipeline;
    }

    try {
      // 根据混合模式配置颜色混合状态
      const colorBlendState = this.createBlendState(blendMode);

      // 创建新的渲染管线
      pipeline = this.device.createRenderPipeline({
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        vertexLayout: mesh.getVertexLayout(),
        primitiveTopology: 'triangle-list',
        layout: this.pipelineLayout,
        rasterizationState: {
          cullMode: 'none', // 透明物体通常不剔除背面
          frontFace: 'ccw',
        },
        depthStencilState: {
          depthWriteEnabled: this.config.enableDepthWrite,
          depthCompare: 'less-equal',
        },
        colorBlendState,
        label: `TransparentPass-Pipeline-${pipelineKey}`,
      });

      // 缓存管线
      this.pipelineCache.set(pipelineKey, pipeline);

      return pipeline;
    } catch (error) {
      console.error(`TransparentPass: 创建渲染管线失败 ${pipelineKey}:`, error);
      return null;
    }
  }

  /**
   * 创建混合状态
   */
  private createBlendState(blendMode: string): any {
    const baseAttachment = {
      blendEnabled: true,
      colorWriteMask: 0xf,
    };

    switch (blendMode) {
      case 'alpha':
        return {
          attachments: [
            {
              ...baseAttachment,
              srcColorFactor: 'src-alpha',
              dstColorFactor: 'one-minus-src-alpha',
              colorBlendOperation: 'add',
              srcAlphaFactor: 'one',
              dstAlphaFactor: 'one-minus-src-alpha',
              alphaBlendOperation: 'add',
            },
          ],
        };

      case 'additive':
        return {
          attachments: [
            {
              ...baseAttachment,
              srcColorFactor: 'src-alpha',
              dstColorFactor: 'one',
              colorBlendOperation: 'add',
              srcAlphaFactor: 'zero',
              dstAlphaFactor: 'one',
              alphaBlendOperation: 'add',
            },
          ],
        };

      case 'multiply':
        return {
          attachments: [
            {
              ...baseAttachment,
              srcColorFactor: 'dst-color',
              dstColorFactor: 'zero',
              colorBlendOperation: 'add',
              srcAlphaFactor: 'dst-alpha',
              dstAlphaFactor: 'zero',
              alphaBlendOperation: 'add',
            },
          ],
        };

      default:
        // 默认Alpha混合
        return {
          attachments: [
            {
              ...baseAttachment,
              srcColorFactor: 'src-alpha',
              dstColorFactor: 'one-minus-src-alpha',
              colorBlendOperation: 'add',
              srcAlphaFactor: 'one',
              dstAlphaFactor: 'one-minus-src-alpha',
              alphaBlendOperation: 'add',
            },
          ],
        };
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
      console.error(`TransparentPass: 创建绑定组失败 ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * 更新配置
   */
  override updateConfig(newConfig: Partial<TransparentPassConfig>): void {
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

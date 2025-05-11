import type { IRHIBuffer, IRHIBindGroup, IRHIRenderPass, IRHIRenderPipeline } from '@maxellabs/core';
import { RHIIndexFormat, RHITextureFormat } from '@maxellabs/core';
import type { GLTexture } from '../resources/GLTexture';
import type { WebGLTextureView } from '../resources/GLTextureView';
import type { GLBuffer } from '../resources/GLBuffer';
import type { WebGLRenderPipeline } from '../pipeline/GLRenderPipeline';
import type { WebGLBindGroup } from '../bindings/GLBindGroup';
import type { WebGLCommandEncoder } from './GLCommandEncoder';
import { WebGLUtils } from '../utils/GLUtils';

/**
 * WebGL渲染通道实现
 */
export class WebGLRenderPass implements IRHIRenderPass {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private encoder: WebGLCommandEncoder;
  private framebuffer: WebGLFramebuffer | null;
  private colorAttachments: Array<{
    view: WebGLTextureView,
    resolveTarget?: WebGLTextureView,
    loadOp: 'load' | 'clear' | 'none',
    storeOp: 'store' | 'discard',
    clearColor?: [number, number, number, number],
  }>;
  private depthStencilAttachment?: {
    view: WebGLTextureView,
    depthLoadOp: 'load' | 'clear' | 'none',
    depthStoreOp: 'store' | 'discard',
    clearDepth?: number,
    depthWriteEnabled?: boolean,
    stencilLoadOp?: 'load' | 'clear' | 'none',
    stencilStoreOp?: 'store' | 'discard',
    clearStencil?: number,
  };
  private _label?: string;
  private currentPipeline: WebGLRenderPipeline | null = null;
  private currentIndexBuffer: GLBuffer | null = null;
  private currentIndexFormat: RHIIndexFormat = RHIIndexFormat.UINT16;
  private currentIndexOffset: number = 0;
  private viewport: { x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number };
  private scissorRect: { x: number, y: number, width: number, height: number };
  private blendConstant: [number, number, number, number] = [0, 0, 0, 0];
  private stencilReference: number = 0;
  private isActive: boolean = true;
  private utils: WebGLUtils;
  private isEnded = false;

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param options 渲染通道选项
   * @param encoder 命令编码器
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, options: {
    colorAttachments: Array<{
      view: WebGLTextureView,
      resolveTarget?: WebGLTextureView,
      loadOp: 'load' | 'clear' | 'none',
      storeOp: 'store' | 'discard',
      clearColor?: [number, number, number, number],
    }>,
    depthStencilAttachment?: {
      view: WebGLTextureView,
      depthLoadOp: 'load' | 'clear' | 'none',
      depthStoreOp: 'store' | 'discard',
      clearDepth?: number,
      depthWriteEnabled?: boolean,
      stencilLoadOp?: 'load' | 'clear' | 'none',
      stencilStoreOp?: 'store' | 'discard',
      clearStencil?: number,
    },
    label?: string,
  }, encoder: WebGLCommandEncoder) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.encoder = encoder;
    this.colorAttachments = options.colorAttachments;
    this.depthStencilAttachment = options.depthStencilAttachment;
    this._label = options.label;
    this.framebuffer = null;
    this.utils = new WebGLUtils(gl);

    // 设置默认视口和裁剪矩形
    const mainColorAttachment = this.colorAttachments[0];
    const width = mainColorAttachment.view.texture.width;
    const height = mainColorAttachment.view.texture.height;

    this.viewport = { x: 0, y: 0, width, height, minDepth: 0, maxDepth: 1 };
    this.scissorRect = { x: 0, y: 0, width, height };

    // 在命令编码器中添加开始渲染通道的命令
    this.encoder.addCommand(() => this.beginPass());
  }

  /**
   * 开始渲染通道
   */
  private beginPass (): void {
    const gl = this.gl;

    // 创建帧缓冲
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    // 设置颜色附件
    const drawBuffers: number[] = [];

    for (let i = 0; i < this.colorAttachments.length; i++) {
      const attachment = this.colorAttachments[i];
      const textureView = attachment.view;
      const texture = textureView.getTexture();

      // 附加纹理到帧缓冲
      const attachmentPoint = this.isWebGL2
        ? (gl as WebGL2RenderingContext).COLOR_ATTACHMENT0 + i
        : gl.COLOR_ATTACHMENT0;

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentPoint,
        gl.TEXTURE_2D,
        textureView.getGLTexture(),
        0
      );

      drawBuffers.push(attachmentPoint);

      // 处理loadOp
      if (attachment.loadOp === 'clear' && attachment.clearColor) {
        gl.clearColor(
          attachment.clearColor[0],
          attachment.clearColor[1],
          attachment.clearColor[2],
          attachment.clearColor[3]
        );

        // 在这里，我们仅清除颜色缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }

    // 设置深度/模板附件
    if (this.depthStencilAttachment) {
      const depthAttachment = this.depthStencilAttachment;
      const depthTextureView = depthAttachment.view;
      const depthTexture = depthTextureView.getTexture();

      // 检查纹理格式是否包含深度和模板
      const hasDepth = this.hasDepthComponent(depthTexture.getFormat());
      const hasStencil = this.hasStencilComponent(depthTexture.getFormat());

      // 对于组合深度/模板格式，在WebGL中需要使用DEPTH_STENCIL_ATTACHMENT
      if (hasDepth && hasStencil) {
        // 使用组合附件点
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_STENCIL_ATTACHMENT,
          gl.TEXTURE_2D,
          depthTextureView.getGLTexture(),
          0
        );
      } else {
        // 分别处理深度和模板
        if (hasDepth) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            depthTextureView.getGLTexture(),
            0
          );
        }

        if (hasStencil) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.STENCIL_ATTACHMENT,
            gl.TEXTURE_2D,
            depthTextureView.getGLTexture(),
            0
          );
        }
      }

      // 处理深度loadOp
      if (depthAttachment.depthLoadOp === 'clear') {
        gl.clearDepth(depthAttachment.clearDepth !== undefined ? depthAttachment.clearDepth : 1.0);

        // 如果同时需要清除深度和模板，我们会在下面合并标志
        let clearFlags = gl.DEPTH_BUFFER_BIT;

        // 处理模板loadOp
        if (depthAttachment.stencilLoadOp === 'clear') {
          gl.clearStencil(depthAttachment.clearStencil !== undefined ? depthAttachment.clearStencil : 0);
          clearFlags |= gl.STENCIL_BUFFER_BIT;
        }

        // 执行清除操作
        gl.clear(clearFlags);
      } else if (depthAttachment.stencilLoadOp === 'clear') {
        // 只清除模板缓冲区
        gl.clearStencil(depthAttachment.clearStencil !== undefined ? depthAttachment.clearStencil : 0);
        gl.clear(gl.STENCIL_BUFFER_BIT);
      }
    }

    // 对于WebGL2，配置多渲染目标的drawBuffers
    if (this.isWebGL2 && drawBuffers.length > 1) {
      (gl as WebGL2RenderingContext).drawBuffers(drawBuffers);
    }

    // 检查帧缓冲完整性
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(`帧缓冲不完整: ${this.getFramebufferStatusString(status)}`);
    }

    // 设置视口和裁剪矩形
    this.applyViewportAndScissor();
  }

  /**
 * 判断纹理格式是否包含模板部分
 */
  private hasStencilComponent (format: number): boolean {
  // 根据RHITextureFormat枚举检查是否是带有模板部分的格式
    return format === RHITextureFormat.DEPTH24_UNORM_STENCIL8 || // 36
         format === RHITextureFormat.DEPTH32_FLOAT_STENCIL8;   // 37
  }

  /**
 * 判断纹理格式是否包含深度部分
 */
  private hasDepthComponent (format: number): boolean {
  // 根据RHITextureFormat枚举检查是否是深度格式
    return format === RHITextureFormat.DEPTH16_UNORM ||         // 33
         format === RHITextureFormat.DEPTH24_UNORM ||         // 34
         format === RHITextureFormat.DEPTH32_FLOAT ||         // 35
         format === RHITextureFormat.DEPTH24_UNORM_STENCIL8 || // 36
         format === RHITextureFormat.DEPTH32_FLOAT_STENCIL8;   // 37
  }

  /**
   * 获取帧缓冲状态的字符串描述
   */
  private getFramebufferStatusString (status: number): string {
    const gl = this.gl;

    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE: return 'FRAMEBUFFER_COMPLETE';
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
      case gl.FRAMEBUFFER_UNSUPPORTED: return 'FRAMEBUFFER_UNSUPPORTED';
      default: return `Unknown status: ${status}`;
    }
  }

  /**
   * 应用当前视口和裁剪矩形设置
   */
  private applyViewportAndScissor (): void {
    const gl = this.gl;
    const { x, y, width, height, minDepth, maxDepth } = this.viewport;

    // 设置视口
    gl.viewport(x, y, width, height);
    gl.depthRange(minDepth, maxDepth);

    // 设置裁剪
    gl.scissor(this.scissorRect.x, this.scissorRect.y, this.scissorRect.width, this.scissorRect.height);
    gl.enable(gl.SCISSOR_TEST);
  }

  /**
   * 结束渲染通道
   */
  end (): void {
    if (this.isEnded) {
      throw new Error('渲染通道已结束');
    }

    // 添加结束渲染通道命令
    this.encoder.addEndRenderPassCommand();
    this.isEnded = true;
  }

  /**
   * 设置渲染管线
   */
  setPipeline (pipeline: IRHIRenderPipeline): void {
    if (this.isEnded) {
      throw new Error('渲染通道已结束，无法设置渲染管线');
    }

    this.currentPipeline = pipeline as WebGLRenderPipeline;
    console.log('设置渲染管线:', pipeline);

    // 添加设置渲染管线的命令
    this.encoder.addCommand(() => {
      if (this.currentPipeline) {
        console.log('应用渲染管线');
        this.currentPipeline.apply();
      } else {
        console.error('渲染管线为空，无法应用');
      }
    });
  }

  /**
   * 设置索引缓冲区
   */
  setIndexBuffer (buffer: IRHIBuffer, indexFormat: RHIIndexFormat, offset: number = 0): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法设置索引缓冲区');
    }

    this.currentIndexBuffer = buffer;
    this.currentIndexFormat = indexFormat;
    this.currentIndexOffset = offset;

    // 添加设置索引缓冲区的命令
    this.encoder.addCommand(() => {
      const gl = this.gl;

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.currentIndexBuffer.getGLBuffer());
    });
  }

  /**
   * 设置顶点缓冲区
   */
  setVertexBuffer (slot: number, buffer: IRHIBuffer, offset: number = 0): void {
    if (!this.currentPipeline) {
      console.error('没有设置渲染管线，无法设置顶点缓冲区');

      return;
    }

    this.encoder.addCommand(() => {
      try {
        // 添加调试信息
        // console.log(`设置顶点缓冲区: 槽位 ${slot}, 缓冲区类型:`, buffer.constructor.name);

        // 检查缓冲区是否有getGLBuffer方法
        if (typeof (buffer as any).getGLBuffer !== 'function') {
          console.error('顶点缓冲区对象没有getGLBuffer方法');

          return;
        }

        const glBuffer = (buffer as any).getGLBuffer();

        if (!glBuffer) {
          console.error('获取WebGL缓冲区对象失败');

          return;
        }

        this.currentPipeline.applyVertexBufferLayout(slot, buffer, offset);
        // console.log(`设置顶点缓冲区: 槽位 ${slot}, 偏移 ${offset}`);
      } catch (e) {
        console.error('设置顶点缓冲区时出错:', e);
      }
    });
  }

  setVertexBuffers (
    firstSlot: number,
    buffers: Array<{
      buffer: IRHIBuffer,
      offset?: number,
    }>
  ): void {
    if (!this.currentPipeline) {
      console.error('没有设置渲染管线，无法设置顶点缓冲区');

      return;
    }

    // 添加设置顶点缓冲区的命令
    this.encoder.addCommand({
      type: 'setVertexBuffers',
      params: {
        startSlot: firstSlot,
        buffers: buffers,
        pipeline: this.currentPipeline,
      },
    });

    // 同时添加一个自定义命令来确保设置生效
    this.encoder.addCommand(() => {
      if (this.currentPipeline) {
        for (let i = 0; i < buffers.length; i++) {
          const slot = firstSlot + i;
          const buffer = buffers[i].buffer;
          const offset = buffers[i].offset || 0;

          try {
            // 尝试直接设置顶点缓冲区
            const glBuffer = buffer.getGLBuffer();

            this.currentPipeline.applyVertexBufferLayout(slot, glBuffer, offset);
            // console.log(`手动设置顶点缓冲区: 槽位 ${slot}, 偏移 ${offset}`);
          } catch (e) {
            console.error('设置顶点缓冲区失败:', e);
          }
        }
      }
    });
  }

  /**
   * 设置绑定组
   */
  setBindGroup (slot: number, bindGroup: IRHIBindGroup, dynamicOffsets?: number[]): void {
    if (!this.currentPipeline) {
      console.error('没有设置渲染管线，无法设置绑定组');

      return;
    }

    this.encoder.addCommand(() => {
      if (this.currentPipeline) {
        try {
          const webglBindGroup = bindGroup as any;
          const program = this.currentPipeline.getProgram();

          if (program && webglBindGroup.applyBindings) {
            webglBindGroup.applyBindings(program, dynamicOffsets);
            // console.log('成功应用绑定组');
          } else {
            console.error('无法应用绑定组：程序无效或绑定组不支持applyBindings');
          }
        } catch (e) {
          console.error('应用绑定组时出错:', e);
        }
      }
    });
  }

  /**
   * 绘制图元
   */
  draw (
    vertexCount: number,
    instanceCount: number = 1,
    firstVertex: number = 0,
    firstInstance: number = 0
  ): void {
    if (this.isEnded) {
      throw new Error('渲染通道已结束，无法执行绘制命令');
    }

    if (!this.currentPipeline) {
      console.error('没有设置渲染管线，无法执行绘制命令');

      return;
    }

    // 添加绘制命令
    this.encoder.addCommand({
      type: 'draw',
      params: {
        vertexCount,
        instanceCount,
        firstVertex,
        firstInstance,
      },
    });

    // console.log(`添加绘制命令: 顶点数=${vertexCount}, 实例数=${instanceCount}, 起始顶点=${firstVertex}`);
  }

  /**
   * 使用索引绘制几何体
   */
  drawIndexed (
    indexCount: number,
    instanceCount: number = 1,
    firstIndex: number = 0,
    baseVertex: number = 0,
    firstInstance: number = 0
  ): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法执行索引绘制');
    }

    // 添加索引绘制命令
    this.encoder.addCommand(() => {
      const gl = this.gl;

      if (!this.currentPipeline || !this.currentIndexBuffer) {
        console.error('尝试在未设置渲染管线或索引缓冲区的情况下进行索引绘制');

        return;
      }

      const primitiveType = this.utils.primitiveTopologyToGL(this.currentPipeline.primitiveTopology);
      const indexType = this.currentIndexFormat === RHIIndexFormat.UINT16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
      const bytesPerIndex = this.currentIndexFormat === RHIIndexFormat.UINT16 ? 2 : 4;
      const offset = this.currentIndexOffset + (firstIndex * bytesPerIndex);

      // baseVertex不直接被WebGL支持，需要在顶点着色器中处理

      if (instanceCount > 1) {
        // 实例化索引绘制
        if (this.isWebGL2) {
          // WebGL2原生支持
          (gl as WebGL2RenderingContext).drawElementsInstanced(
            primitiveType,
            indexCount,
            indexType,
            offset,
            instanceCount
          );
        } else {
          // WebGL1需要扩展
          const ext = gl.getExtension('ANGLE_instanced_arrays');

          if (ext) {
            ext.drawElementsInstancedANGLE(
              primitiveType,
              indexCount,
              indexType,
              offset,
              instanceCount
            );
          } else {
            console.error('当前WebGL环境不支持实例化绘制');
            gl.drawElements(primitiveType, indexCount, indexType, offset);
          }
        }
      } else {
        // 普通索引绘制
        gl.drawElements(primitiveType, indexCount, indexType, offset);
      }
    });
  }

  /**
   * 设置视口
   */
  setViewport (
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth: number = 0,
    maxDepth: number = 1
  ): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法设置视口');
    }

    this.viewport = { x, y, width, height, minDepth, maxDepth };

    // 添加设置视口的命令
    this.encoder.addCommand(() => {
      const gl = this.gl;

      gl.viewport(x, y, width, height);
      gl.depthRange(minDepth, maxDepth);
    });
  }

  /**
   * 设置裁剪矩形
   */
  setScissorRect (x: number, y: number, width: number, height: number): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法设置裁剪矩形');
    }

    this.scissorRect = { x, y, width, height };

    // 添加设置裁剪矩形的命令
    this.encoder.addCommand(() => {
      const gl = this.gl;

      gl.scissor(x, y, width, height);
      gl.enable(gl.SCISSOR_TEST);
    });
  }

  /**
   * 设置混合常量
   */
  setBlendConstant (color: [number, number, number, number]): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法设置混合常量');
    }

    this.blendConstant = color;

    // 添加设置混合常量的命令
    this.encoder.addCommand(() => {
      const gl = this.gl;

      gl.blendColor(color[0], color[1], color[2], color[3]);
    });
  }

  /**
   * 设置模板参考值
   */
  setStencilReference (reference: number): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法设置模板参考值');
    }

    this.stencilReference = reference;

    // 添加设置模板参考值的命令
    // 注意：在WebGL中，这需要重新设置整个模板函数
    this.encoder.addCommand(() => {
      // 实际实现需要重新应用整个stencilFunc
      // 这里需要访问当前的模板状态，简化起见略过
      // console.warn('setStencilReference需要完整重新设置stencilFunc');
    });
  }

  /**
   * 执行间接绘制
   */
  drawIndirect (indirectBuffer: IRHIBuffer, indirectOffset: number): void {
    throw new Error('WebGL不支持间接绘制');
  }

  /**
   * 执行间接索引绘制
   */
  drawIndexedIndirect (indirectBuffer: IRHIBuffer, indirectOffset: number): void {
    throw new Error('WebGL不支持间接索引绘制');
  }

  /**
   * 执行推送常量更新
   */
  pushConstants (offset: number, data: ArrayBufferView): void {
    if (!this.isActive) {
      throw new Error('渲染通道已结束，无法推送常量');
    }

    // WebGL没有推送常量的概念，需通过uniform实现
    // 这里简化处理，实际实现需更复杂的策略
    this.encoder.addCommand(() => {
      if (this.currentPipeline) {
        const program = this.currentPipeline.getProgram();

        if (program) {
          // 这里应该有更复杂的逻辑来映射推送常量到uniform
          console.warn('WebGL不直接支持推送常量，需要通过uniform实现');
        }
      }
    });
  }

  /**
   * 获取标签
   */
  get label (): string | undefined {
    return this._label;
  }
}
import type { IRHICommandBuffer } from '@maxellabs/core';
import type { GLBuffer } from '../resources/WebGLBuffer';
import type { WebGLTexture } from '../resources/WebGLTexture';

/**
 * WebGL命令缓冲区实现
 */
export class WebGLCommandBuffer implements IRHICommandBuffer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private commands: Array<{
    type: string,
    params: any,
  }>;
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL命令缓冲区
   *
   * @param gl WebGL上下文
   * @param commands 命令列表
   * @param label 可选标签
   */
  constructor (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    commands: Array<{
      type: string,
      params: any,
    }>,
    label?: string
  ) {
    this.gl = gl;
    this.commands = [...commands]; // 复制命令列表
    this.label = label;
  }

  /**
   * 执行命令缓冲区中的命令
   */
  execute (): void {
    if (this.isDestroyed) {
      console.warn('试图执行已销毁的命令缓冲区');

      return;
    }

    // 执行所有命令
    for (const command of this.commands) {
      this.executeCommand(command);
    }
  }

  /**
   * 执行单个命令
   */
  private executeCommand (command: { type: string, params: any }): void {
    switch (command.type) {
      case 'beginRenderPass':
        this.executeBeginRenderPass(command.params);

        break;
      case 'endRenderPass':
        this.executeEndRenderPass();

        break;
      case 'copyBufferToBuffer':
        this.executeCopyBufferToBuffer(command.params);

        break;
      case 'copyBufferToTexture':
        this.executeCopyBufferToTexture(command.params);

        break;
      case 'copyTextureToBuffer':
        this.executeCopyTextureToBuffer(command.params);

        break;
      case 'copyTextureToTexture':
        this.executeCopyTextureToTexture(command.params);

        break;
      case 'draw':
        this.executeDraw(command.params);

        break;
      case 'drawIndexed':
        this.executeDrawIndexed(command.params);

        break;
      case 'setViewport':
        this.executeSetViewport(command.params);

        break;
      case 'setScissor':
        this.executeSetScissor(command.params);

        break;
      case 'setPipeline':
        this.executeSetPipeline(command.params);

        break;
      case 'setBindGroup':
        this.executeSetBindGroup(command.params);

        break;
      case 'setVertexBuffers':
        this.executeSetVertexBuffers(command.params);

        break;
      case 'setIndexBuffer':
        this.executeSetIndexBuffer(command.params);

        break;
      case 'custom':
        if (command.params.execute) {
          command.params.execute();
        }

        break;
      default:
        console.warn(`未知的命令类型: ${command.type}`);
    }
  }

  /**
   * 执行开始渲染通道命令
   */
  private executeBeginRenderPass (params: any): void {
    const gl = this.gl;

    // 清除颜色和深度缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 设置清除颜色
    if (params.colorAttachments && params.colorAttachments.length > 0) {
      const colorAttachment = params.colorAttachments[0];

      if (colorAttachment.loadOp === 'clear' && colorAttachment.clearColor) {
        gl.clearColor(
          colorAttachment.clearColor[0],
          colorAttachment.clearColor[1],
          colorAttachment.clearColor[2],
          colorAttachment.clearColor[3]
        );
      }
    }

    // 设置清除深度
    if (params.depthStencilAttachment) {
      if (params.depthStencilAttachment.depthLoadOp === 'clear') {
        const clearDepth = params.depthStencilAttachment.clearDepth !== undefined ? params.depthStencilAttachment.clearDepth : 1.0;

        gl.clearDepth(clearDepth);
      }

      if (params.depthStencilAttachment.stencilLoadOp === 'clear') {
        const clearStencil = params.depthStencilAttachment.clearStencil !== undefined ? params.depthStencilAttachment.clearStencil : 0;

        gl.clearStencil(clearStencil);
      }
    }

    // 清除缓冲区
    let clearMask = 0;

    if (params.colorAttachments && params.colorAttachments.length > 0) {
      const colorAttachment = params.colorAttachments[0];

      if (colorAttachment.loadOp === 'clear') {
        clearMask |= gl.COLOR_BUFFER_BIT;
      }
    }

    if (params.depthStencilAttachment) {
      if (params.depthStencilAttachment.depthLoadOp === 'clear') {
        clearMask |= gl.DEPTH_BUFFER_BIT;
      }

      if (params.depthStencilAttachment.stencilLoadOp === 'clear') {
        clearMask |= gl.STENCIL_BUFFER_BIT;
      }
    }

    if (clearMask !== 0) {
      gl.clear(clearMask);
    }
  }

  /**
   * 执行结束渲染通道命令
   */
  private executeEndRenderPass (): void {
    const gl = this.gl;

    // 重置状态
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);

    // 禁用顶点属性数组
    for (let i = 0; i < 16; i++) {
      gl.disableVertexAttribArray(i);
    }
  }

  /**
   * 执行缓冲区到缓冲区复制命令
   */
  private executeCopyBufferToBuffer (params: any): void {
    const { source, sourceOffset, destination, destinationOffset, size } = params;

    // WebGL不直接支持缓冲区间复制，需要通过CPU执行
    const sourceBuffer = source as GLBuffer;
    const destBuffer = destination as GLBuffer;

    // 从源缓冲区读取数据
    sourceBuffer.map('read', sourceOffset, size)
      .then(mappedData => {
        // 更新目标缓冲区
        destBuffer.update(mappedData, destinationOffset);

        // 取消映射
        sourceBuffer.unmap();
      });
  }

  /**
   * 执行缓冲区到纹理复制命令
   */
  private executeCopyBufferToTexture (params: any): void {
    const { source, destination, copySize } = params;

    const sourceBuffer = source.buffer as GLBuffer;
    const destTexture = destination.texture as WebGLTexture;
    const mipLevel = destination.mipLevel || 0;
    const origin = destination.origin || [0, 0, 0];

    const offset = source.offset || 0;
    const bytesPerRow = source.bytesPerRow;

    // 从源缓冲区读取数据
    sourceBuffer.map('read', offset, bytesPerRow * copySize[1] * copySize[2])
      .then(mappedData => {
        // 更新纹理
        destTexture.update(
          mappedData,
          origin[0],
          origin[1],
          origin[2],
          copySize[0],
          copySize[1],
          copySize[2],
          mipLevel
        );

        // 取消映射
        sourceBuffer.unmap();
      });
  }

  /**
   * 执行纹理到缓冲区复制命令
   */
  private executeCopyTextureToBuffer (params: any): void {
    const { source, destination, copySize } = params;

    const sourceTexture = source.texture as WebGLTexture;
    const destBuffer = destination.buffer as GLBuffer;
    const mipLevel = source.mipLevel || 0;
    const origin = source.origin || [0, 0, 0];
    const offset = destination.offset || 0;

    const gl = this.gl;

    // 创建临时帧缓冲
    const framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // 附加纹理到帧缓冲
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      sourceTexture.getTarget(),
      sourceTexture.getGLTexture(),
      mipLevel
    );

    // 检查帧缓冲状态
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(framebuffer);
      throw new Error('帧缓冲不完整，无法读取纹理数据');
    }

    // 计算数据大小并分配内存
    const bytesPerPixel = 4; // 假设RGBA8格式
    const dataSize = copySize[0] * copySize[1] * bytesPerPixel;
    const pixelData = new Uint8Array(dataSize);

    // 读取像素
    gl.readPixels(
      origin[0],
      origin[1],
      copySize[0],
      copySize[1],
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixelData
    );

    // 更新目标缓冲区
    destBuffer.update(pixelData, offset);

    // 清理帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }

  /**
   * 执行纹理到纹理复制命令
   */
  private executeCopyTextureToTexture (params: any): void {
    const { source, destination, copySize } = params;

    const sourceTexture = source.texture as WebGLTexture;
    const destTexture = destination.texture as WebGLTexture;
    const sourceMipLevel = source.mipLevel || 0;
    const destMipLevel = destination.mipLevel || 0;
    const sourceOrigin = source.origin || [0, 0, 0];
    const destOrigin = destination.origin || [0, 0, 0];

    const gl = this.gl;

    // 在WebGL2中，可以使用blitFramebuffer
    if (gl instanceof WebGL2RenderingContext &&
        sourceTexture.getDimension() === '2d' &&
        destTexture.getDimension() === '2d') {

      // 创建源帧缓冲
      const sourceFramebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sourceFramebuffer);
      gl.framebufferTexture2D(
        gl.READ_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        sourceTexture.getGLTexture(),
        sourceMipLevel
      );

      // 创建目标帧缓冲
      const destFramebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destFramebuffer);
      gl.framebufferTexture2D(
        gl.DRAW_FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        destTexture.getGLTexture(),
        destMipLevel
      );

      // 执行块传输
      gl.blitFramebuffer(
        sourceOrigin[0], sourceOrigin[1],
        sourceOrigin[0] + copySize[0], sourceOrigin[1] + copySize[1],
        destOrigin[0], destOrigin[1],
        destOrigin[0] + copySize[0], destOrigin[1] + copySize[1],
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );

      // 清理帧缓冲
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.deleteFramebuffer(sourceFramebuffer);
      gl.deleteFramebuffer(destFramebuffer);
    } else {
      // WebGL1回退方法，通过CPU中转

      // 创建临时帧缓冲读取源纹理
      const framebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        sourceTexture.getTarget(),
        sourceTexture.getGLTexture(),
        sourceMipLevel
      );

      // 分配临时数据
      const bytesPerPixel = 4; // 假设RGBA8格式
      const dataSize = copySize[0] * copySize[1] * bytesPerPixel;
      const pixelData = new Uint8Array(dataSize);

      // 读取像素
      gl.readPixels(
        sourceOrigin[0],
        sourceOrigin[1],
        copySize[0],
        copySize[1],
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixelData
      );

      // 清理帧缓冲
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(framebuffer);

      // 更新目标纹理
      destTexture.update(
        pixelData,
        destOrigin[0],
        destOrigin[1],
        destOrigin[2],
        copySize[0],
        copySize[1],
        copySize[2],
        destMipLevel
      );
    }
  }

  /**
   * 执行绘制命令
   */
  private executeDraw (params: any): void {
    const gl = this.gl;

    const { vertexCount, instanceCount, firstVertex, firstInstance } = params;

    if (instanceCount && instanceCount > 1) {
      // 实例化绘制
      if (gl instanceof WebGL2RenderingContext) {
        gl.drawArraysInstanced(params.primitiveType, firstVertex, vertexCount, instanceCount);
      } else {
        const ext = gl.getExtension('ANGLE_instanced_arrays');

        if (ext) {
          ext.drawArraysInstancedANGLE(params.primitiveType, firstVertex, vertexCount, instanceCount);
        } else {
          throw new Error('当前WebGL环境不支持实例化绘制');
        }
      }
    } else {
      // 普通绘制
      gl.drawArrays(params.primitiveType, firstVertex, vertexCount);
    }
  }

  /**
   * 执行索引绘制命令
   */
  private executeDrawIndexed (params: any): void {
    const gl = this.gl;

    const { indexCount, instanceCount, firstIndex, baseVertex, firstInstance } = params;
    const indexType = params.indexType || gl.UNSIGNED_SHORT;
    const offset = firstIndex * (indexType === gl.UNSIGNED_SHORT ? 2 : 4);

    if (instanceCount && instanceCount > 1) {
      // 实例化索引绘制
      if (gl instanceof WebGL2RenderingContext) {
        gl.drawElementsInstanced(params.primitiveType, indexCount, indexType, offset, instanceCount);
      } else {
        const ext = gl.getExtension('ANGLE_instanced_arrays');

        if (ext) {
          ext.drawElementsInstancedANGLE(params.primitiveType, indexCount, indexType, offset, instanceCount);
        } else {
          throw new Error('当前WebGL环境不支持实例化绘制');
        }
      }
    } else {
      // 普通索引绘制
      gl.drawElements(params.primitiveType, indexCount, indexType, offset);
    }
  }

  /**
   * 执行设置视口命令
   */
  private executeSetViewport (params: any): void {
    const gl = this.gl;
    const { x, y, width, height, minDepth, maxDepth } = params;

    gl.viewport(x, y, width, height);

    // WebGL的深度范围是[0, 1]，可以通过gl.depthRange来设置
    if (minDepth !== undefined && maxDepth !== undefined) {
      gl.depthRange(minDepth, maxDepth);
    }
  }

  /**
   * 执行设置裁剪区域命令
   */
  private executeSetScissor (params: any): void {
    const gl = this.gl;
    const { x, y, width, height, enabled } = params;

    if (enabled) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, y, width, height);
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }
  }

  /**
   * 执行设置管线命令
   */
  private executeSetPipeline (params: any): void {
    const { pipeline } = params;

    // 应用管线状态
    pipeline.applyState();
  }

  /**
   * 执行设置绑定组命令
   */
  private executeSetBindGroup (params: any): void {
    const { index, bindGroup, program } = params;

    // 应用绑定
    bindGroup.applyBindings(program);
  }

  /**
   * 执行设置顶点缓冲区命令
   */
  private executeSetVertexBuffers (params: any): void {
    const { pipeline, buffers } = params;

    // 设置顶点缓冲区
    pipeline.setVertexBuffers(buffers);
  }

  /**
   * 执行设置索引缓冲区命令
   */
  private executeSetIndexBuffer (params: any): void {
    const gl = this.gl;
    const { buffer, type } = params;

    // 绑定索引缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.getGLBuffer());
  }

  /**
   * 获取命令缓冲区标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    this.commands = [];
    this.isDestroyed = true;
  }
}
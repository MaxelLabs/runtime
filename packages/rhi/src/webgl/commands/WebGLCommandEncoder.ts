import { IRHIBuffer, IRHICommandBuffer, IRHICommandEncoder, IRHIComputePass, IRHIRenderPass, IRHITexture, IRHITextureView } from '@maxellabs/core';
import { WebGLBuffer } from '../resources/WebGLBuffer';
import { WebGLTexture } from '../resources/WebGLTexture';
import { WebGLRenderPass } from './WebGLRenderPass';
import { WebGLCommandBuffer } from './WebGLCommandBuffer';

/**
 * WebGL命令编码器实现
 */
export class WebGLCommandEncoder implements IRHICommandEncoder {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private commands: Array<{
    type: string,
    params: any
  }>;
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL命令编码器
   * 
   * @param gl WebGL上下文
   * @param label 可选标签
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, label?: string) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.commands = [];
    this.label = label;
  }

  /**
   * 开始渲染通道
   */
  beginRenderPass(options: {
    colorAttachments: Array<{
      view: IRHITextureView,
      resolveTarget?: IRHITextureView,
      loadOp: 'load' | 'clear' | 'none',
      storeOp: 'store' | 'discard',
      clearColor?: [number, number, number, number],
    }>,
    depthStencilAttachment?: {
      view: IRHITextureView,
      depthLoadOp: 'load' | 'clear' | 'none',
      depthStoreOp: 'store' | 'discard',
      clearDepth?: number,
      depthWriteEnabled?: boolean,
      stencilLoadOp?: 'load' | 'clear' | 'none',
      stencilStoreOp?: 'store' | 'discard',
      clearStencil?: number,
    },
    label?: string,
  }): IRHIRenderPass {
    // 创建渲染通道
    const renderPass = new WebGLRenderPass(this.gl, options, this);
    
    // 记录渲染通道命令
    this.commands.push({
      type: 'beginRenderPass',
      params: options
    });
    
    return renderPass;
  }

  /**
   * 开始计算通道
   * 注意：WebGL不原生支持计算着色器，此方法可能在WebGL环境中不可用
   */
  beginComputePass(options?: {
    label?: string,
  }): IRHIComputePass {
    throw new Error('WebGL不支持计算着色器');
  }

  /**
   * 复制缓冲区到缓冲区
   */
  copyBufferToBuffer(
    source: IRHIBuffer,
    sourceOffset: number,
    destination: IRHIBuffer,
    destinationOffset: number,
    size: number
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyBufferToBuffer',
      params: {
        source,
        sourceOffset,
        destination,
        destinationOffset,
        size
      }
    });
  }

  /**
   * 复制缓冲区到纹理
   */
  copyBufferToTexture(
    source: {
      buffer: IRHIBuffer,
      offset?: number,
      bytesPerRow: number,
      rowsPerImage?: number,
    },
    destination: {
      texture: IRHITexture,
      mipLevel?: number,
      origin?: [number, number, number],
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyBufferToTexture',
      params: {
        source,
        destination,
        copySize
      }
    });
  }

  /**
   * 复制纹理到缓冲区
   */
  copyTextureToBuffer(
    source: {
      texture: IRHITexture,
      mipLevel?: number,
      origin?: [number, number, number],
    },
    destination: {
      buffer: IRHIBuffer,
      offset?: number,
      bytesPerRow: number,
      rowsPerImage?: number,
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyTextureToBuffer',
      params: {
        source,
        destination,
        copySize
      }
    });
  }

  /**
   * 复制纹理到纹理
   */
  copyTextureToTexture(
    source: {
      texture: IRHITexture,
      mipLevel?: number,
      origin?: [number, number, number],
    },
    destination: {
      texture: IRHITexture,
      mipLevel?: number,
      origin?: [number, number, number],
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyTextureToTexture',
      params: {
        source,
        destination,
        copySize
      }
    });
  }

  /**
   * 结束命令编码，返回命令缓冲区
   */
  finish(options?: {
    label?: string,
  }): IRHICommandBuffer {
    // 创建命令缓冲区
    const commandBuffer = new WebGLCommandBuffer(
      this.gl,
      this.commands,
      options?.label || this.label
    );
    
    // 清空命令列表，防止重复使用
    this.commands = [];
    
    return commandBuffer;
  }

  /**
   * 获取编码器标签
   */
  getLabel(): string | undefined {
    return this.label;
  }

  /**
   * 获取命令列表
   * 仅供内部使用
   */
  getCommands(): Array<{
    type: string,
    params: any
  }> {
    return this.commands;
  }

  /**
   * 添加渲染通道结束命令
   * 仅供内部使用，由WebGLRenderPass调用
   */
  addEndRenderPassCommand(): void {
    this.commands.push({
      type: 'endRenderPass',
      params: {}
    });
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.commands = [];
    this.isDestroyed = true;
  }
} 
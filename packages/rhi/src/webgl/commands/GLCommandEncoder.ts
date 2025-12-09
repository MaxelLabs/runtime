import { WebGLRenderPass } from './GLRenderPass';
import { WebGLCommandBuffer } from './GLCommandBuffer';
import type { MSpec } from '@maxellabs/core';

/**
 * WebGL命令编码器实现
 */
export class WebGLCommandEncoder implements MSpec.IRHICommandEncoder {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private commands: Array<{
    type: string;
    params: any;
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
   * 添加命令到编码器
   * @param command 命令对象或函数
   */
  addCommand(command: any): void {
    if (this.isDestroyed) {
      console.error('尝试向已销毁的命令编码器添加命令');

      return;
    }

    if (typeof command === 'function') {
      // 如果是函数，包装为custom类型命令
      this.commands.push({
        type: 'custom',
        params: {
          execute: command,
        },
      });
    } else if (typeof command === 'object' && command.type) {
      // 如果已经是命令对象，直接添加
      this.commands.push(command);
    } else {
      console.error('无效的命令格式，必须是函数或具有type属性的对象', command);
    }
  }

  /**
   * 开始渲染通道
   */

  beginRenderPass(options: {
    colorAttachments: Array<{
      view: MSpec.IRHITextureView;
      resolveTarget?: MSpec.IRHITextureView;
      loadOp: 'load' | 'clear' | 'none';
      storeOp: 'store' | 'discard';
      clearColor?: [number, number, number, number];
    }>;
    depthStencilAttachment?: {
      view: MSpec.IRHITextureView;
      depthLoadOp: 'load' | 'clear' | 'none';

      depthStoreOp: 'store' | 'discard';
      clearDepth?: number;
      depthWriteEnabled?: boolean;
      stencilLoadOp?: 'load' | 'clear' | 'none';
      stencilStoreOp?: 'store' | 'discard';
      clearStencil?: number;
    };
    label?: string;
  }): MSpec.IRHIRenderPass {
    // 创建渲染通道
    // 注意：WebGLRenderPass 构造函数中已经通过 addCommand 添加了 beginPass 命令，
    // 不需要再额外添加 beginRenderPass 命令，否则会导致帧缓冲被创建两次
    const renderPass = new WebGLRenderPass(this.gl, options, this);
    // // 记录渲染通道命令
    // this.commands.push({
    //   type: 'beginRenderPass',
    //   params: options,
    // });

    return renderPass;
  }

  /**
   * 开始计算通道
   * 注意：WebGL不原生支持计算着色器，此方法可能在WebGL环境中不可用
   */
  beginComputePass(options?: { label?: string }): MSpec.IRHIComputePass {
    throw new Error('WebGL不支持计算着色器');
  }

  /**
   * 复制缓冲区到缓冲区
   */
  copyBufferToBuffer(
    source: MSpec.IRHIBuffer,
    sourceOffset: number,
    destination: MSpec.IRHIBuffer,
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
        size,
      },
    });
  }

  /**
   * 复制缓冲区到纹理
   */
  copyBufferToTexture(
    source: {
      buffer: MSpec.IRHIBuffer;

      offset?: number;
      bytesPerRow: number;
      rowsPerImage?: number;
    },
    destination: {
      texture: MSpec.IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyBufferToTexture',
      params: {
        source,
        destination,
        copySize,
      },
    });
  }

  /**
   * 复制纹理到缓冲区
   */
  copyTextureToBuffer(
    source: {
      texture: MSpec.IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    destination: {
      buffer: MSpec.IRHIBuffer;
      offset?: number;
      bytesPerRow: number;
      rowsPerImage?: number;
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyTextureToBuffer',
      params: {
        source,
        destination,
        copySize,
      },
    });
  }

  /**
   * 复制纹理到纹理
   */
  copyTextureToTexture(
    source: {
      texture: MSpec.IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    destination: {
      texture: MSpec.IRHITexture;
      mipLevel?: number;
      origin?: [number, number, number];
    },
    copySize: [number, number, number]
  ): void {
    // 记录复制命令
    this.commands.push({
      type: 'copyTextureToTexture',
      params: {
        source,
        destination,
        copySize,
      },
    });
  }

  /**
   * 复制纹理到画布
   * 这是为了兼容WebGPU的渲染架构，在WebGL中提供类似功能
   */
  copyTextureToCanvas(options: {
    source: MSpec.IRHITextureView;
    destination: HTMLCanvasElement;
    origin?: [number, number];
    extent?: [number, number];
  }): void {
    // 记录复制纹理到画布的命令
    this.commands.push({
      type: 'copyTextureToCanvas',
      params: options,
    });
  }

  /**
   * 结束命令编码，返回命令缓冲区
   */
  finish(options?: { label?: string }): MSpec.IRHICommandBuffer {
    // 创建命令缓冲区
    const commandBuffer = new WebGLCommandBuffer(this.gl, this.commands, options?.label || this.label);

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
    type: string;
    params: any;
  }> {
    return this.commands;
  }

  /**
   * 添加渲染通道结束命令
   * 仅供内部使用，由WebGLRenderPass调用
   */
  addEndRenderPassCommand(): void {
    // this.addCommand(() => {
    //   // 处理渲染通道结束逻辑
    //   const gl = this.gl;

    //   // 清理帧缓冲等操作...
    //   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // });
    this.commands.push({
      type: 'endRenderPass',
      params: {},
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

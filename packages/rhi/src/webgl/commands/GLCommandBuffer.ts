import type { IRHICommandBuffer } from '@maxellabs/core';
import type { GLBuffer } from '../resources/GLBuffer';
import type { WebGLTexture } from '../resources/GLTexture';

/**
 * WebGL命令缓冲区实现
 */
export class WebGLCommandBuffer implements IRHICommandBuffer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private commands: Array<{
    type: string,
    params: any,
  }>;
  label?: string;
  private isDestroyed = false;
  private isWebGL2: boolean;

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
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
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
    if (!command || typeof command !== 'object') {
      console.error('无效的命令对象', command);

      return;
    }

    if (!command.type || typeof command.type !== 'string') {
      console.error('命令缺少有效的类型', command);

      return;
    }
    try {
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
        case 'copyTextureToCanvas':
          this.executeCopyTextureToCanvas(command.params);

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
          if (command.params && typeof command.params.execute === 'function') {
            command.params.execute();
          } else {
            console.error('自定义命令缺少有效的execute函数', command.params);
          }

          break;
        default:
          console.warn(`未知的命令类型: ${command.type}`);
      }
    } catch (error) {
      console.error(`执行命令 ${command.type} 时出错:`, error);
    }
  }

  /**
   * 执行开始渲染通道命令
   */
  private executeBeginRenderPass (params: any): void {
    const gl = this.gl;

    // 如果要渲染到画布，不使用帧缓冲区
    if (!params.colorAttachments && !params.depthStencilAttachment) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return;
    }

    // 创建临时帧缓冲区对象
    const framebuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // 处理颜色附件
    if (params.colorAttachments && params.colorAttachments.length > 0) {
      const colorAttachment = params.colorAttachments[0];
      const textureView = colorAttachment.view;

      // 确保纹理视图有效
      if (!textureView) {
        console.error('颜色附件没有有效的纹理视图');

        return;
      }

      // 获取WebGL纹理对象
      const glTexture = textureView.getGLTexture();

      if (!glTexture) {
        console.error('无法获取WebGL纹理对象');

        return;
      }

      // 将纹理附加到帧缓冲区的颜色附件点
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        glTexture,
        0 // mipmap级别
      );

      // 设置清除颜色
      if (colorAttachment.loadOp === 'clear' && colorAttachment.clearColor) {
        gl.clearColor(
          colorAttachment.clearColor[0],
          colorAttachment.clearColor[1],
          colorAttachment.clearColor[2],
          colorAttachment.clearColor[3]
        );
      }
    }

    // 处理深度模板附件
    if (params.depthStencilAttachment) {
      const depthAttachment = params.depthStencilAttachment;
      const depthTextureView = depthAttachment.view;

      // 确保深度纹理视图有效
      if (!depthTextureView) {
        console.error('深度附件没有有效的纹理视图');

        return;
      }

      // 获取WebGL纹理对象
      const glDepthTexture = depthTextureView.getGLTexture();

      if (!glDepthTexture) {
        console.error('无法获取WebGL深度纹理对象');

        return;
      }

      // WebGL中使用DEPTH_COMPONENT16类型的深度纹理
      // 将深度纹理附加到帧缓冲区的深度附件点
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        glDepthTexture,
        0 // mipmap级别
      );

      // 设置深度测试
      gl.enable(gl.DEPTH_TEST);

      // 设置深度写入
      gl.depthMask(true);

      // 设置深度比较函数
      gl.depthFunc(gl.LEQUAL);

      // 设置清除深度
      if (depthAttachment.depthLoadOp === 'clear') {
        const clearDepth = depthAttachment.clearDepth !== undefined ? depthAttachment.clearDepth : 1.0;

        gl.clearDepth(clearDepth);
      }
    }

    // 检查帧缓冲区是否完整
    const frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (frameBufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('帧缓冲区不完整:', this.getFramebufferStatusMessage(frameBufferStatus));

      // 详细诊断信息
      // console.log('颜色附件信息:', params.colorAttachments);
      // console.log('深度附件信息:', params.depthStencilAttachment);

      if (params.depthStencilAttachment) {
        // 测试使用仅深度缓冲区（无模板）的设置方式
        const depthAttachment = params.depthStencilAttachment;
        const depthTextureView = depthAttachment.view;
        const glDepthTexture = depthTextureView.getGLTexture();

        // 创建新的帧缓冲区和仅深度缓冲区尝试
        const testFramebuffer = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, testFramebuffer);

        // 先附加颜色缓冲区
        if (params.colorAttachments && params.colorAttachments.length > 0) {
          const colorAttachment = params.colorAttachments[0];
          const textureView = colorAttachment.view;
          const glTexture = textureView.getGLTexture();

          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            glTexture,
            0
          );
        }

        // 使用深度渲染缓冲区而不是深度纹理
        const depthRenderBuffer = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        gl.renderbufferStorage(
          gl.RENDERBUFFER,
          gl.DEPTH_COMPONENT16,
          depthTextureView.texture.width,
          depthTextureView.texture.height
        );
        gl.framebufferRenderbuffer(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER,
          depthRenderBuffer
        );

        // 检查是否成功
        // const newStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        // console.log('使用深度渲染缓冲区的帧缓冲区状态:', this.getFramebufferStatusMessage(newStatus));

        // 清理测试资源
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.deleteFramebuffer(testFramebuffer);
        gl.deleteRenderbuffer(depthRenderBuffer);
      }

      // 尝试不使用深度缓冲区，只使用颜色缓冲区
      if (params.colorAttachments && params.colorAttachments.length > 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        const colorAttachment = params.colorAttachments[0];
        const textureView = colorAttachment.view;
        const glTexture = textureView.getGLTexture();

        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          glTexture,
          0
        );

        // 检查这种简化配置是否可行
        const colorOnlyStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

       //  console.log('仅颜色附件的帧缓冲区状态:', this.getFramebufferStatusMessage(colorOnlyStatus));

        if (colorOnlyStatus === gl.FRAMEBUFFER_COMPLETE) {
          // console.log('使用仅颜色附件的配置继续渲染');

          // 设置清除颜色
          if (colorAttachment.loadOp === 'clear' && colorAttachment.clearColor) {
            gl.clearColor(
              colorAttachment.clearColor[0],
              colorAttachment.clearColor[1],
              colorAttachment.clearColor[2],
              colorAttachment.clearColor[3]
            );

            // 清除仅颜色缓冲区
            gl.clear(gl.COLOR_BUFFER_BIT);
          }

          // 存储此帧缓冲区
          this.currentFramebuffer = framebuffer;

          return;
        }
      }

      // 如果所有尝试都失败，清理并返回
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(framebuffer);

      return;
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
      const depthAttachment = params.depthStencilAttachment;

      if (depthAttachment.depthLoadOp === 'clear') {
        clearMask |= gl.DEPTH_BUFFER_BIT;
      }
    }

    if (clearMask !== 0) {
      // 清除指定缓冲区
      gl.clear(clearMask);
    }

    // 存储此帧缓冲区以便在endRenderPass中使用
    this.currentFramebuffer = framebuffer;

    // 输出调试信息
    // console.log('帧缓冲区已创建和配置', frameBufferStatus === gl.FRAMEBUFFER_COMPLETE);
  }

  /**
   * 获取帧缓冲区状态的描述信息
   */
  private getFramebufferStatusMessage (status: number): string {
    const gl = this.gl;

    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return 'FRAMEBUFFER_COMPLETE';
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
      case gl.FRAMEBUFFER_UNSUPPORTED:
        return 'FRAMEBUFFER_UNSUPPORTED';
      default:
        return `Unknown status: ${status}`;
    }
  }

  // 当前帧缓冲区
  private currentFramebuffer: WebGLFramebuffer | null = null;

  /**
   * 执行结束渲染通道命令
   */
  private executeEndRenderPass (): void {
    const gl = this.gl;

    // 重置状态
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(null);

    // 删除临时帧缓冲区
    if (this.currentFramebuffer) {
      gl.deleteFramebuffer(this.currentFramebuffer);
      this.currentFramebuffer = null;
    }

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
      }).catch(error => {
        console.error('缓冲区复制失败:', error);
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
      }).catch(error => {
        console.error('纹理复制失败:', error);
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
   * 复制纹理到画布
   */
  private executeCopyTextureToCanvas (params: any): void {
    const { source, destination } = params;
    const canvas = destination as HTMLCanvasElement;

    // console.log('复制纹理到画布, 源:', source, '目标:', canvas);

    const gl = this.gl;

    // 绑定到默认帧缓冲区（画布）
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 清除屏幕
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 创建一个简单的着色器程序来显示纹理
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texcoord;
      varying vec2 v_texcoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texcoord = a_texcoord;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_texcoord;
      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;

    // 创建着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // 创建程序
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // 使用程序
    gl.useProgram(program);

    // 创建顶点数据
    const vertexData = new Float32Array([
      // x, y,   u, v
      -1, -1, 0, 0,   // 左下
      1, -1, 1, 0,   // 右下
      -1, 1, 0, 1,   // 左上
      1, 1, 1, 1,    // 右上
    ]);

    // 创建缓冲区
    const vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

    // 位置属性
    const positionLoc = gl.getAttribLocation(program, 'a_position');

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    // 纹理坐标属性
    const texcoordLoc = gl.getAttribLocation(program, 'a_texcoord');

    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 16, 8);

    // 设置纹理
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 绑定源纹理
    const sourceTexture = source.getGLTexture();

    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);

    // 绘制四边形
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 清理资源
    gl.deleteBuffer(vertexBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    console.log('已复制纹理到画布');
  }

  /**
   * 执行绘制命令
   */
  private executeDraw (params: any): void {
    const gl = this.gl;
    const { vertexCount, instanceCount, firstVertex, firstInstance } = params;

    // console.log(`执行绘制命令: 顶点数=${vertexCount}, 实例数=${instanceCount}, 起始顶点=${firstVertex}`);

    try {
      // 检查WebGL状态
      const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);

      if (!currentProgram) {
        console.error('绘制失败: 没有激活的着色器程序');

        return;
      }

      // 获取当前绑定的顶点缓冲区
      const vertexBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

      if (!vertexBuffer) {
        console.error('绘制失败: 没有绑定顶点缓冲区');

        return;
      }

      // 获取活跃的顶点属性
      const maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      const enabledAttribs = [];

      for (let i = 0; i < maxAttribs; i++) {
        if (gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
          enabledAttribs.push(i);
        }
      }

      if (enabledAttribs.length === 0) {
        console.error('绘制失败: 没有启用顶点属性');

        return;
      }

       // console.log('活跃的顶点属性:', enabledAttribs);

      // 检查帧缓冲区状态
      const currentFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

      if (currentFramebuffer) {
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          console.error('绘制前帧缓冲区不完整:', this.getFramebufferStatusString(status));

          return;
        }
      }

      // 执行绘制
      gl.drawArrays(gl.TRIANGLES, firstVertex, vertexCount);

      // 检查错误
      const error = gl.getError();

      if (error !== gl.NO_ERROR) {
        console.error('绘制执行错误:', this.getGLErrorString(error));

        // 尝试清除错误状态
        while (gl.getError() !== gl.NO_ERROR) {
          // 清除所有待处理的错误
        }
      } else {
        // console.log('绘制成功');
      }
    } catch (error) {
      console.error('执行绘制命令时发生异常:', error);
    }
  }

  /**
   * 获取帧缓冲区状态的字符串描述
   */
  private getFramebufferStatusString (status: number): string {
    const gl = this.gl;

    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return 'FRAMEBUFFER_COMPLETE';
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
      case gl.FRAMEBUFFER_UNSUPPORTED:
        return 'FRAMEBUFFER_UNSUPPORTED';
      default:
        return `未知状态(${status})`;
    }
  }

  /**
   * 获取WebGL错误代码的字符串描述
   */
  private getGLErrorString (errorCode: number): string {
    const gl = this.gl;

    switch (errorCode) {
      case gl.INVALID_ENUM: return 'INVALID_ENUM';
      case gl.INVALID_VALUE: return 'INVALID_VALUE';
      case gl.INVALID_OPERATION: return 'INVALID_OPERATION';
      case gl.OUT_OF_MEMORY: return 'OUT_OF_MEMORY';
      case gl.CONTEXT_LOST_WEBGL: return 'CONTEXT_LOST_WEBGL';
      case gl.INVALID_FRAMEBUFFER_OPERATION: return 'INVALID_FRAMEBUFFER_OPERATION';
      default: return `未知错误(${errorCode})`;
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
    const { startSlot, buffers, pipeline } = params;

    if (!pipeline) {
      console.error('设置顶点缓冲区时没有有效的渲染管线');

      return;
    }

    const gl = this.gl;

    // console.log('执行设置顶点缓冲区命令', params);

    try {
      // 确保顶点数组对象 (VAO) 已绑定
      const vao = pipeline.getVertexArrayObject();

      if (vao && this.isWebGL2) {
        (gl as WebGL2RenderingContext).bindVertexArray(vao);
      }

      // 对每个需要设置的缓冲区
      for (let i = 0; i < buffers.length; i++) {
        const bufferInfo = buffers[i];
        const buffer = bufferInfo.buffer;
        const offset = bufferInfo.offset || 0;

        if (!buffer) {
          console.error(`缓冲区为空: slot ${startSlot + i}`);
          continue;
        }

        // 尝试获取WebGL缓冲区对象
        const glBuffer = buffer.getGLBuffer();

        if (!glBuffer) {
          console.error('获取WebGL缓冲区对象失败');
          continue;
        }

        // 如果渲染管线有顶点缓冲区布局，应用它
        pipeline.applyVertexBufferLayout(startSlot + i, glBuffer, offset);

        // console.log(`成功设置槽位 ${startSlot + i} 的顶点缓冲区`, buffer);
      }
    } catch (error) {
      console.error('设置顶点缓冲区时出错:', error);
    }
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
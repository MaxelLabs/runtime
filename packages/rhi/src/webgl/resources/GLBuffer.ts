import { MSpec } from '@maxellabs/core';

/**
 * 缓冲区类型信息接口
 */
export interface BufferTypeInfo {
  uniformName?: string;
  uniformType?: MSpec.RHIUniformType;
  structLayout?: Array<{
    name: string;
    type: MSpec.RHIUniformType;
    offset: number;
    size?: number;
  }>;
}

/**
 * WebGL缓冲区实现
 */
export class GLBuffer implements MSpec.IRHIBuffer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private glBuffer: WebGLBuffer | null;
  protected bufferTarget: number;
  private bufferUsage: number;
  size: number;
  usage: MSpec.RHIBufferUsage;
  label?: string;
  private isDestroyed = false;

  // 映射状态管理
  private mappedWriteBuffer: ArrayBuffer | null = null;
  private mappedMode: 'read' | 'write' | 'read-write' | null = null;
  private mappedOffset: number = 0;
  private mappedSize: number = 0;

  // 类型信息
  private typeInfo: BufferTypeInfo | null = null;

  /**
   * 创建WebGL缓冲区
   *
   * @param gl WebGL上下文
   * @param descriptor 缓冲区描述符
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: MSpec.RHIBufferDescriptor) {
    this.gl = gl;
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.label = descriptor.label;

    // 提取类型信息（如果有）
    if (descriptor.extension?.typeInfo) {
      this.typeInfo = descriptor.extension.typeInfo as BufferTypeInfo;
    }

    this.bufferTarget = this.getGLBufferTarget(descriptor.usage);
    this.bufferUsage = this.getGLBufferUsage(descriptor.hint || 'static');

    // 创建WebGL缓冲区
    this.glBuffer = gl.createBuffer();

    if (!this.glBuffer) {
      throw new Error('创建WebGL缓冲区失败');
    }

    // 绑定并初始化
    gl.bindBuffer(this.bufferTarget, this.glBuffer);

    if (descriptor.initialData) {
      gl.bufferData(this.bufferTarget, descriptor.initialData, this.bufferUsage);
    } else {
      gl.bufferData(this.bufferTarget, descriptor.size, this.bufferUsage);
    }

    gl.bindBuffer(this.bufferTarget, null);
  }

  /**
   * 设置缓冲区类型信息
   * @param typeInfo 类型信息
   */
  setTypeInfo(typeInfo: BufferTypeInfo): void {
    this.typeInfo = typeInfo;
  }

  /**
   * 获取缓冲区类型信息
   */
  getTypeInfo(): BufferTypeInfo | null {
    return this.typeInfo;
  }

  /**
   * 根据RHI缓冲区用途获取WebGL缓冲区目标
   */
  private getGLBufferTarget(usage: MSpec.RHIBufferUsage | MSpec.RHIBufferUsage[]): number {
    // 如果是数组，检查是否包含特定用途
    const usageArray = Array.isArray(usage) ? usage : [usage];

    if (usageArray.includes(MSpec.RHIBufferUsage.VERTEX)) {
      return this.gl.ARRAY_BUFFER;
    }
    if (usageArray.includes(MSpec.RHIBufferUsage.INDEX)) {
      return this.gl.ELEMENT_ARRAY_BUFFER;
    }
    if (usageArray.includes(MSpec.RHIBufferUsage.UNIFORM)) {
      return this.gl instanceof WebGL2RenderingContext ? this.gl.UNIFORM_BUFFER : this.gl.ARRAY_BUFFER;
    }

    // // WebGL2 特有支持
    // if (this.gl instanceof WebGL2RenderingContext) {
    //   if (usageArray.includes(MSpec.RHIBufferUsage.STORAGE)) {
    //     return this.gl.SHADER_STORAGE_BUFFER;
    //   }
    //   if (usageArray.includes(MSpec.RHIBufferUsage.INDIRECT)) {
    //     return this.gl.DRAW_INDIRECT_BUFFER;
    //   }
    // }

    // 默认返回
    return this.gl.ARRAY_BUFFER;
  }

  /**
   * 根据提示获取WebGL缓冲区用途
   */
  private getGLBufferUsage(hint: 'static' | 'dynamic' | 'stream'): number {
    switch (hint) {
      case 'static':
        return this.gl.STATIC_DRAW;
      case 'dynamic':
        return this.gl.DYNAMIC_DRAW;
      case 'stream':
        return this.gl.STREAM_DRAW;
      default:
        return this.gl.STATIC_DRAW;
    }
  }

  /**
   * 更新缓冲区数据
   */
  update(data: BufferSource, offset = 0): void {
    if (this.isDestroyed) {
      console.warn('试图更新已销毁的缓冲区');

      return;
    }

    // 参数边界检查
    if (offset < 0 || offset + data.byteLength > this.size) {
      console.error(`更新缓冲区参数越界: offset=${offset}, dataSize=${data.byteLength}, bufferSize=${this.size}`);

      return;
    }

    // console.log(`[GLBuffer] update: label=${this.label}, target=${this.bufferTarget}, size=${data.byteLength}, offset=${offset}`);
    this.gl.bindBuffer(this.bufferTarget, this.glBuffer);

    if (offset === 0 && data.byteLength === this.size) {
      // 更新整个缓冲区
      this.gl.bufferData(this.bufferTarget, data, this.bufferUsage);
    } else {
      // 更新部分缓冲区
      this.gl.bufferSubData(this.bufferTarget, offset, data);
    }

    this.gl.bindBuffer(this.bufferTarget, null);
  }

  /**
   * 映射缓冲区以供CPU访问
   * 注意：WebGL1不支持真正的映射，这里模拟实现
   */
  async map(mode: 'read' | 'write' | 'read-write', offset = 0, size?: number): Promise<ArrayBuffer> {
    if (this.isDestroyed) {
      throw new Error('试图映射已销毁的缓冲区');
    }

    const actualSize = size ?? this.size - offset;

    // 参数边界检查
    if (actualSize <= 0 || offset < 0 || offset + actualSize > this.size) {
      throw new Error(`map 参数越界: offset=${offset}, size=${actualSize}, bufferSize=${this.size}`);
    }

    // 保存映射状态
    this.mappedMode = mode;
    this.mappedOffset = offset;
    this.mappedSize = actualSize;

    // WebGL2支持部分映射能力
    if (this.gl instanceof WebGL2RenderingContext) {
      const gl2 = this.gl;

      gl2.bindBuffer(this.bufferTarget, this.glBuffer);

      if (mode === 'read' || mode === 'read-write') {
        // 读取数据
        const buffer = new ArrayBuffer(actualSize);

        gl2.getBufferSubData(this.bufferTarget, offset, new Uint8Array(buffer));

        // 如果是读写模式，保存副本用于稍后写回
        if (mode === 'read-write') {
          this.mappedWriteBuffer = buffer.slice(0);
        }

        return buffer;
      } else if (mode === 'write') {
        // 对于写入，创建一个新的缓冲区让用户填充，稍后在unmap时应用
        this.mappedWriteBuffer = new ArrayBuffer(actualSize);

        return this.mappedWriteBuffer;
      }
    } else {
      // WebGL1回退
      if (mode === 'read' || mode === 'read-write') {
        console.warn('WebGL1 不支持直接读取缓冲区数据，返回空缓冲区');
      }

      // 为写入模式创建临时缓冲区
      this.mappedWriteBuffer = new ArrayBuffer(actualSize);

      return this.mappedWriteBuffer;
    }

    // 创建默认缓冲区，不应该走到这里
    return new ArrayBuffer(actualSize);
  }

  /**
   * 取消映射缓冲区
   * 如果之前是写入模式，会自动将修改写回GPU
   */
  unmap(): void {
    if (this.mappedMode === null || this.mappedWriteBuffer === null) {
      // 没有活动的映射
      return;
    }

    try {
      // 如果是写入或读写模式，将数据写回GPU
      if (
        (this.mappedMode === 'write' || this.mappedMode === 'read-write') &&
        this.mappedWriteBuffer &&
        this.mappedSize > 0
      ) {
        this.gl.bindBuffer(this.bufferTarget, this.glBuffer);
        this.gl.bufferSubData(this.bufferTarget, this.mappedOffset, new Uint8Array(this.mappedWriteBuffer));
      }
    } catch (e) {
      console.error('缓冲区数据写回失败:', e);
    } finally {
      // 清理状态
      this.mappedWriteBuffer = null;
      this.mappedMode = null;
      this.mappedOffset = 0;
      this.mappedSize = 0;
      // 解绑缓冲区
      this.gl.bindBuffer(this.bufferTarget, null);
    }
  }

  /**
   * 获取原生WebGL缓冲区对象
   */
  getGLBuffer(): WebGLBuffer | null {
    return this.glBuffer;
  }

  /**
   * 获取目标类型
   */
  getTarget(): number {
    return this.bufferTarget;
  }

  /**
   * 获取缓冲区大小
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    // 确保取消所有映射
    if (this.mappedMode !== null) {
      this.unmap();
    }

    if (this.glBuffer) {
      this.gl.deleteBuffer(this.glBuffer);
      this.glBuffer = null;
    }

    this.isDestroyed = true;
  }

  /**
   * 获取缓冲区数据（同步方法）
   * 注意：此方法仅用于读取uniform数据，不适用于大型缓冲区
   * @param offset 偏移量（字节）
   * @param size 大小（字节）
   * @returns 缓冲区数据
   */
  getData(offset: number = 0, size?: number): ArrayBuffer | null {
    if (this.isDestroyed) {
      console.warn('试图从已销毁的缓冲区获取数据');

      return null;
    }

    const actualSize = size ?? this.size - offset;

    if (actualSize <= 0 || offset >= this.size) {
      console.warn('无效的缓冲区访问范围');

      return null;
    }

    try {
      // 创建临时缓冲区
      const tempBuffer = new ArrayBuffer(actualSize);
      const tempView = new Uint8Array(tempBuffer);

      // 绑定缓冲区
      this.gl.bindBuffer(this.bufferTarget, this.glBuffer);

      // 对于WebGL2，使用getBufferSubData
      if (this.gl instanceof WebGL2RenderingContext) {
        this.gl.getBufferSubData(this.bufferTarget, offset, tempView);
        this.gl.bindBuffer(this.bufferTarget, null);

        return tempBuffer;
      } else {
        // WebGL1不支持直接读取，返回null
        this.gl.bindBuffer(this.bufferTarget, null);
        console.warn('WebGL1不支持直接读取缓冲区数据');

        return null;
      }
    } catch (e) {
      console.error('获取缓冲区数据失败:', e);
      this.gl.bindBuffer(this.bufferTarget, null);

      return null;
    }
  }
}

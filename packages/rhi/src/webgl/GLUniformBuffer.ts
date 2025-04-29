import type { IUniformBuffer } from '@maxellabs/core';

export class GLUniformBuffer implements IUniformBuffer {
  private gl: WebGLRenderingContext;
  private buffer: WebGLBuffer | null;
  private data: Float32Array;
  private bindingIndex: number;
  private isDirty: boolean = false;
  private size: number;

  constructor(
    gl: WebGLRenderingContext, 
    data?: Float32Array, 
    bindingIndex: number = 0
  ) {
    this.gl = gl;
    this.size = data?.byteLength || 0;
    this.data = data || new Float32Array(16); // 默认大小
    this.bindingIndex = bindingIndex;
    this.buffer = this.createBuffer();
    
    if (data) {
      this.updateBufferData();
    }
  }

  private createBuffer(): WebGLBuffer | null {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create uniform buffer');
    }
    return buffer;
  }

  private updateBufferData(): void {
    if (!this.buffer) return;
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data, this.gl.DYNAMIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.isDirty = false;
  }

  update(): void {
    if (this.isDirty) {
      this.updateBufferData();
    }
  }

  bind(target: number = 0): void {
    if (!this.buffer) return;
    
    // 对于 WebGL2，可以使用统一缓冲区对象
    if (this.gl instanceof WebGL2RenderingContext) {
      this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.bindingIndex, this.buffer);
    } else {
      // WebGL1 没有直接支持统一缓冲区对象，需要设置单独的统一变量
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    }
  }

  unbind(): void {
    if (this.gl instanceof WebGL2RenderingContext) {
      this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.bindingIndex, null);
    } else {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
  }

  setFloat(offset: number, value: number): void {
    if (offset >= 0 && offset < this.data.length) {
      if (this.data[offset] !== value) {
        this.data[offset] = value;
        this.isDirty = true;
      }
    }
  }

  setInt(offset: number, value: number): void {
    if (offset >= 0 && offset < this.data.length) {
      const intValue = Math.floor(value);
      if (this.data[offset] !== intValue) {
        this.data[offset] = intValue;
        this.isDirty = true;
      }
    }
  }

  setVec2(offset: number, x: number, y: number): void {
    if (offset >= 0 && offset + 1 < this.data.length) {
      let changed = false;
      if (this.data[offset] !== x) {
        this.data[offset] = x;
        changed = true;
      }
      if (this.data[offset + 1] !== y) {
        this.data[offset + 1] = y;
        changed = true;
      }
      if (changed) {
        this.isDirty = true;
      }
    }
  }

  setVec3(offset: number, x: number, y: number, z: number): void {
    if (offset >= 0 && offset + 2 < this.data.length) {
      let changed = false;
      if (this.data[offset] !== x) {
        this.data[offset] = x;
        changed = true;
      }
      if (this.data[offset + 1] !== y) {
        this.data[offset + 1] = y;
        changed = true;
      }
      if (this.data[offset + 2] !== z) {
        this.data[offset + 2] = z;
        changed = true;
      }
      if (changed) {
        this.isDirty = true;
      }
    }
  }

  setVec4(offset: number, x: number, y: number, z: number, w: number): void {
    if (offset >= 0 && offset + 3 < this.data.length) {
      let changed = false;
      if (this.data[offset] !== x) {
        this.data[offset] = x;
        changed = true;
      }
      if (this.data[offset + 1] !== y) {
        this.data[offset + 1] = y;
        changed = true;
      }
      if (this.data[offset + 2] !== z) {
        this.data[offset + 2] = z;
        changed = true;
      }
      if (this.data[offset + 3] !== w) {
        this.data[offset + 3] = w;
        changed = true;
      }
      if (changed) {
        this.isDirty = true;
      }
    }
  }

  setMatrix4(offset: number, matrix: Float32Array): void {
    if (offset >= 0 && offset + 15 < this.data.length) {
      let changed = false;
      for (let i = 0; i < 16; i++) {
        if (this.data[offset + i] !== matrix[i]) {
          this.data[offset + i] = matrix[i];
          changed = true;
        }
      }
      if (changed) {
        this.isDirty = true;
      }
    }
  }

  getData(): Float32Array {
    return this.data;
  }

  getSize(): number {
    return this.size;
  }

  dispose(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
  }
}
import type { IUniformBuffer } from '@max/core';

export class GLUniformBuffer implements IUniformBuffer {
    private _gl: WebGL2RenderingContext;
    private _buffer: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;
        this._buffer = gl.createBuffer()!;
    }
    update(): void {
        throw new Error('Method not implemented.');
    }

    setData(data: Float32Array): void {
        const gl = this._gl;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this._buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
    }

    dispose(): void {
        this._gl.deleteBuffer(this._buffer);
    }
} 
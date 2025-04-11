import type { IRenderPass } from '@max/core';

export class GLRenderPass implements IRenderPass {
    private _gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext) {
        this._gl = gl;
    }

    begin(): void {
        // 开始渲染通道
    }

    end(): void {
        // 结束渲染通道
    }

    dispose(): void {
        // 清理资源
    }
} 
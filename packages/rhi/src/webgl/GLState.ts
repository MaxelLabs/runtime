export class GLState {
  private gl: WebGLRenderingContext,
  private blendEnabled: boolean = false,
  private depthTestEnabled: boolean = false,
  private cullFaceEnabled: boolean = false,
  private scissorTestEnabled: boolean = false,
  private blendSrc: number = this.gl.SRC_ALPHA,
  private blendDst: number = this.gl.ONE_MINUS_SRC_ALPHA,
  private depthFunc: number = this.gl.LEQUAL,
  private cullFace: number = this.gl.BACK,
  private scissorBox: [number, number, number, number] = [0, 0, 0, 0],

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl,
  }

  setBlend(enable: boolean): void {
    if (this.blendEnabled !== enable) {
      if (enable) {
        this.gl.enable(this.gl.BLEND),
      } else {
        this.gl.disable(this.gl.BLEND),
      }
      this.blendEnabled = enable,
    }
  }

  setBlendFunc(src: number, dst: number): void {
    if (this.blendSrc !== src || this.blendDst !== dst) {
      this.gl.blendFunc(src, dst),
      this.blendSrc = src,
      this.blendDst = dst,
    }
  }

  setDepthTest(enable: boolean): void {
    if (this.depthTestEnabled !== enable) {
      if (enable) {
        this.gl.enable(this.gl.DEPTH_TEST),
      } else {
        this.gl.disable(this.gl.DEPTH_TEST),
      }
      this.depthTestEnabled = enable,
    }
  }

  setDepthFunc(func: number): void {
    if (this.depthFunc !== func) {
      this.gl.depthFunc(func),
      this.depthFunc = func,
    }
  }

  setCullFace(enable: boolean): void {
    if (this.cullFaceEnabled !== enable) {
      if (enable) {
        this.gl.enable(this.gl.CULL_FACE),
      } else {
        this.gl.disable(this.gl.CULL_FACE),
      }
      this.cullFaceEnabled = enable,
    }
  }

  setCullFaceMode(mode: number): void {
    if (this.cullFace !== mode) {
      this.gl.cullFace(mode),
      this.cullFace = mode,
    }
  }

  setScissorTest(enable: boolean): void {
    if (this.scissorTestEnabled !== enable) {
      if (enable) {
        this.gl.enable(this.gl.SCISSOR_TEST),
      } else {
        this.gl.disable(this.gl.SCISSOR_TEST),
      }
      this.scissorTestEnabled = enable,
    }
  }

  setScissorBox(x: number, y: number, width: number, height: number): void {
    if (
      this.scissorBox[0] !== x ||
      this.scissorBox[1] !== y ||
      this.scissorBox[2] !== width ||
      this.scissorBox[3] !== height
    ) {
      this.gl.scissor(x, y, width, height),
      this.scissorBox = [x, y, width, height],
    }
  }

  reset(): void {
    this.setBlend(false),
    this.setDepthTest(true),
    this.setCullFace(true),
    this.setScissorTest(false),
    this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA),
    this.setDepthFunc(this.gl.LEQUAL),
    this.setCullFaceMode(this.gl.BACK),
    this.setScissorBox(0, 0, this.gl.canvas.width, this.gl.canvas.height),
  }
} 
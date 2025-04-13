export class GLState {
  private gl: WebGLRenderingContext;
  private stateCache: Map<string, any>;
  private dirtyStates: Set<string>;
  private blendEnabled: boolean = false;
  private depthTestEnabled: boolean = false;
  private cullFaceEnabled: boolean = false;
  private scissorTestEnabled: boolean = false;
  private blendSrc: number;
  private blendDst: number;
  private depthFunc: number;
  private cullFace: number;
  private scissorBox: [number, number, number, number] = [0, 0, 0, 0];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.stateCache = new Map();
    this.dirtyStates = new Set();
    
    // Initialize properties dependent on gl here
    this.blendSrc = this.gl.SRC_ALPHA;
    this.blendDst = this.gl.ONE_MINUS_SRC_ALPHA;
    this.depthFunc = this.gl.LEQUAL;
    this.cullFace = this.gl.BACK;
    
    this.initializeStateCache();
  }

  private initializeStateCache() {
    this.stateCache.set('blend', false);
    this.stateCache.set('depthTest', false);
    this.stateCache.set('cullFace', false);
    this.stateCache.set('scissorTest', false);
    this.stateCache.set('blendSrc', this.blendSrc);
    this.stateCache.set('blendDst', this.blendDst);
    this.stateCache.set('depthFunc', this.depthFunc);
    this.stateCache.set('cullFace', this.cullFace);
    this.stateCache.set('scissorBox', this.scissorBox);
  }

  setBlend(enabled: boolean) {
    if (this.stateCache.get('blend') !== enabled) {
      this.dirtyStates.add('blend');
      this.stateCache.set('blend', enabled);
      if (enabled) {
        this.gl.enable(this.gl.BLEND);
      } else {
        this.gl.disable(this.gl.BLEND);
      }
    }
  }

  setDepthTest(enabled: boolean) {
    if (this.stateCache.get('depthTest') !== enabled) {
      this.dirtyStates.add('depthTest');
      this.stateCache.set('depthTest', enabled);
      if (enabled) {
        this.gl.enable(this.gl.DEPTH_TEST);
      } else {
        this.gl.disable(this.gl.DEPTH_TEST);
      }
    }
  }

  setCullFace(enabled: boolean) {
    if (this.stateCache.get('cullFace') !== enabled) {
      this.dirtyStates.add('cullFace');
      this.stateCache.set('cullFace', enabled);
      if (enabled) {
        this.gl.enable(this.gl.CULL_FACE);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
    }
  }

  setScissorTest(enabled: boolean) {
    if (this.stateCache.get('scissorTest') !== enabled) {
      this.dirtyStates.add('scissorTest');
      this.stateCache.set('scissorTest', enabled);
      if (enabled) {
        this.gl.enable(this.gl.SCISSOR_TEST);
      } else {
        this.gl.disable(this.gl.SCISSOR_TEST);
      }
    }
  }

  setBlendFunc(src: number, dst: number) {
    if (this.stateCache.get('blendSrc') !== src || this.stateCache.get('blendDst') !== dst) {
      this.dirtyStates.add('blendFunc');
      this.stateCache.set('blendSrc', src);
      this.stateCache.set('blendDst', dst);
      this.gl.blendFunc(src, dst);
    }
  }

  setDepthFunc(func: number) {
    if (this.stateCache.get('depthFunc') !== func) {
      this.dirtyStates.add('depthFunc');
      this.stateCache.set('depthFunc', func);
      this.gl.depthFunc(func);
    }
  }

  setCullFaceMode(mode: number) {
    if (this.stateCache.get('cullFace') !== mode) {
      this.dirtyStates.add('cullFaceMode');
      this.stateCache.set('cullFace', mode);
      this.gl.cullFace(mode);
    }
  }

  setScissor(x: number, y: number, width: number, height: number) {
    const newBox: [number, number, number, number] = [x, y, width, height];
    if (!this.compareScissorBox(this.scissorBox, newBox)) {
      this.dirtyStates.add('scissorBox');
      this.scissorBox = newBox;
      this.stateCache.set('scissorBox', newBox);
      this.gl.scissor(x, y, width, height);
    }
  }

  private compareScissorBox(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  flush() {
    for (const state of this.dirtyStates) {
      this.applyState(state);
    }
    this.dirtyStates.clear();
  }

  private applyState(state: string) {
    switch (state) {
      case 'blend':
        this.setBlend(this.stateCache.get('blend'));
        break;
      case 'depthTest':
        this.setDepthTest(this.stateCache.get('depthTest'));
        break;
      case 'cullFace':
        this.setCullFace(this.stateCache.get('cullFace'));
        break;
      case 'scissorTest':
        this.setScissorTest(this.stateCache.get('scissorTest'));
        break;
      case 'blendFunc':
        this.setBlendFunc(this.stateCache.get('blendSrc'), this.stateCache.get('blendDst'));
        break;
      case 'depthFunc':
        this.setDepthFunc(this.stateCache.get('depthFunc'));
        break;
      case 'cullFaceMode':
        this.setCullFaceMode(this.stateCache.get('cullFace'));
        break;
      case 'scissorBox':
        const box = this.stateCache.get('scissorBox');
        this.setScissor(box[0], box[1], box[2], box[3]);
        break;
    }
  }

  reset() {
    this.stateCache.clear();
    this.dirtyStates.clear();
    this.initializeStateCache();
  }
}
/**
 * WebGL状态管理类
 * 
 * 这个类负责跟踪和管理WebGL渲染状态，减少不必要的状态切换以提高性能。
 * 通过缓存当前状态并只在状态实际变化时更新WebGL，可以显著减少API调用次数。
 */
export class GLState {
  /** WebGL渲染上下文 */
  private gl: WebGLRenderingContext;
  
  /** 当前状态缓存，存储所有跟踪的状态值 */
  private stateCache: Map<string, any>;
  
  /** 已变更但尚未应用的状态集合 */
  private dirtyStates: Set<string>;
  
  /** 混合模式是否启用 */
  private blendEnabled: boolean = false;
  
  /** 深度测试是否启用 */
  private depthTestEnabled: boolean = false;
  
  /** 面剔除是否启用 */
  private cullFaceEnabled: boolean = false;
  
  /** 剪裁测试是否启用 */
  private scissorTestEnabled: boolean = false;
  
  /** 混合源因子 */
  private blendSrc: number;
  
  /** 混合目标因子 */
  private blendDst: number;
  
  /** 深度测试比较函数 */
  private depthFunc: number;
  
  /** 面剔除模式 */
  private cullFace: number;
  
  /** 剪裁区域 [x, y, width, height] */
  private scissorBox: [number, number, number, number] = [0, 0, 0, 0];

  /**
   * 创建WebGL状态管理器
   * 
   * @param gl - WebGL渲染上下文
   */
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

  /**
   * 初始化状态缓存
   * 
   * 设置所有状态的初始默认值
   * @private
   */
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

  /**
   * 设置混合模式状态
   * 
   * 启用或禁用颜色混合。只有当状态实际改变时才会触发WebGL调用。
   * 
   * @param enabled - 是否启用混合模式
   */
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

  /**
   * 设置深度测试状态
   * 
   * 启用或禁用深度测试。只有当状态实际改变时才会触发WebGL调用。
   * 
   * @param enabled - 是否启用深度测试
   */
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

  /**
   * 设置面剔除状态
   * 
   * 启用或禁用面剔除。只有当状态实际改变时才会触发WebGL调用。
   * 
   * @param enabled - 是否启用面剔除
   */
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

  /**
   * 设置剪裁测试状态
   * 
   * 启用或禁用剪裁测试。只有当状态实际改变时才会触发WebGL调用。
   * 
   * @param enabled - 是否启用剪裁测试
   */
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

  /**
   * 设置混合函数
   * 
   * 配置源和目标混合因子。只有当参数实际改变时才会触发WebGL调用。
   * 
   * @param src - 源混合因子，如gl.SRC_ALPHA
   * @param dst - 目标混合因子，如gl.ONE_MINUS_SRC_ALPHA
   */
  setBlendFunc(src: number, dst: number) {
    if (this.stateCache.get('blendSrc') !== src || this.stateCache.get('blendDst') !== dst) {
      this.dirtyStates.add('blendFunc');
      this.stateCache.set('blendSrc', src);
      this.stateCache.set('blendDst', dst);
      this.gl.blendFunc(src, dst);
    }
  }

  /**
   * 设置深度测试比较函数
   * 
   * 配置深度测试使用的比较函数。只有当函数实际改变时才会触发WebGL调用。
   * 
   * @param func - 深度比较函数，如gl.LEQUAL, gl.LESS等
   */
  setDepthFunc(func: number) {
    if (this.stateCache.get('depthFunc') !== func) {
      this.dirtyStates.add('depthFunc');
      this.stateCache.set('depthFunc', func);
      this.gl.depthFunc(func);
    }
  }

  /**
   * 设置面剔除模式
   * 
   * 配置需要剔除的面（正面、背面或两者）。只有当模式实际改变时才会触发WebGL调用。
   * 
   * @param mode - 剔除模式，如gl.BACK, gl.FRONT等
   */
  setCullFaceMode(mode: number) {
    if (this.stateCache.get('cullFace') !== mode) {
      this.dirtyStates.add('cullFaceMode');
      this.stateCache.set('cullFace', mode);
      this.gl.cullFace(mode);
    }
  }

  /**
   * 设置剪裁区域
   * 
   * 配置剪裁测试区域。只有当区域实际改变时才会触发WebGL调用。
   * 
   * @param x - 剪裁区域左下角X坐标
   * @param y - 剪裁区域左下角Y坐标
   * @param width - 剪裁区域宽度
   * @param height - 剪裁区域高度
   */
  setScissor(x: number, y: number, width: number, height: number) {
    const newBox: [number, number, number, number] = [x, y, width, height];
    if (!this.compareScissorBox(this.scissorBox, newBox)) {
      this.dirtyStates.add('scissorBox');
      this.scissorBox = newBox;
      this.stateCache.set('scissorBox', newBox);
      this.gl.scissor(x, y, width, height);
    }
  }

  /**
   * 设置剪裁区域(别名方法)
   * 
   * @param x - 剪裁区域左下角X坐标
   * @param y - 剪裁区域左下角Y坐标
   * @param width - 剪裁区域宽度
   * @param height - 剪裁区域高度
   */
  setScissorBox(x: number, y: number, width: number, height: number): void {
    this.setScissor(x, y, width, height);
  }

  /**
   * 比较两个剪裁区域是否相同
   * 
   * @param a - 第一个剪裁区域
   * @param b - 第二个剪裁区域
   * @returns 如果两个区域完全相同则返回true
   * @private
   */
  private compareScissorBox(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  /**
   * 应用所有待处理的状态变更
   * 
   * 将所有标记为"脏"的状态应用到WebGL上下文中
   */
  flush() {
    for (const state of this.dirtyStates) {
      this.applyState(state);
    }
    this.dirtyStates.clear();
  }

  /**
   * 应用单个状态变更
   * 
   * @param state - 要应用的状态名称
   * @private
   */
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
      case 'scissorBox': {
        const box = this.stateCache.get('scissorBox');
        this.setScissor(box[0], box[1], box[2], box[3]);
        break;
      }
    }
  }

  /**
   * 重置状态管理器
   * 
   * 清空所有缓存的状态，并重置为初始默认值
   */
  reset() {
    this.stateCache.clear();
    this.dirtyStates.clear();
    this.initializeStateCache();
  }
}
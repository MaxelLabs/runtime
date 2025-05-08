import {
  IRHIRenderPipeline,
  IRHIShaderModule,
  IRHIPipelineLayout,
  RHIVertexLayout,
  RHIPrimitiveTopology,
  RHIRasterizationState,
  RHIDepthStencilState,
  RHIColorBlendState,
  RHIRenderPipelineDescriptor
} from '@maxellabs/core';
import { WebGLShader } from '../resources/WebGLShader';
import { WebGLUtils } from '../utils/WebGLUtils';

/**
 * WebGL渲染管线实现
 */
export class WebGLRenderPipeline implements IRHIRenderPipeline {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private program: WebGLProgram | null;
  private vertexArrayObject: WebGLVertexArrayObject | null = null;
  private _vertexShader: IRHIShaderModule;
  private _fragmentShader: IRHIShaderModule;
  private _vertexLayout: RHIVertexLayout;
  private _primitiveTopology: RHIPrimitiveTopology;
  private _rasterizationState: RHIRasterizationState;
  private _depthStencilState?: RHIDepthStencilState;
  private _colorBlendState?: RHIColorBlendState;
  private _layout: IRHIPipelineLayout;
  private _label?: string;
  private attributeLocations: Map<string, number> = new Map();
  private attributeBufferLayouts: Map<number, { stride: number, offset: number, format: any }[]> = new Map();
  private isDestroyed: boolean = false;
  private utils: WebGLUtils;

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param descriptor 渲染管线描述符
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHIRenderPipelineDescriptor) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.utils = new WebGLUtils(gl);
    this._vertexShader = descriptor.vertexShader;
    this._fragmentShader = descriptor.fragmentShader;
    this._vertexLayout = descriptor.vertexLayout;
    this._primitiveTopology = descriptor.primitiveTopology;
    this._rasterizationState = descriptor.rasterizationState || this.getDefaultRasterizationState();
    this._depthStencilState = descriptor.depthStencilState;
    this._colorBlendState = descriptor.colorBlendState;
    this._layout = descriptor.layout;
    this._label = descriptor.label;

    // 创建并链接着色器程序
    this.program = this.createProgram();
    
    // 解析顶点属性位置
    this.extractAttributeLocations();
    
    // 准备顶点布局数据
    this.prepareVertexLayout();
    
    // 如果支持，创建顶点数组对象(VAO)
    this.createVertexArrayObject();
  }

  /**
   * 获取默认的光栅化状态
   */
  private getDefaultRasterizationState(): RHIRasterizationState {
    return {
      cullMode: 'back',
      frontFace: 'ccw',
      lineWidth: 1,
      depthBias: 0,
      depthBiasClamp: 0,
      depthBiasSlopeScale: 0
    };
  }

  /**
   * 创建并链接着色器程序
   */
  private createProgram(): WebGLProgram | null {
    const gl = this.gl;
    const vertexShader = (this._vertexShader as WebGLShader).getGLShader();
    const fragmentShader = (this._fragmentShader as WebGLShader).getGLShader();
    
    if (!vertexShader || !fragmentShader) {
      throw new Error('创建渲染管线失败：着色器无效');
    }
    
    const program = gl.createProgram();
    if (!program) {
      throw new Error('创建WebGL程序对象失败');
    }
    
    // 附加着色器
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    // 链接程序
    gl.linkProgram(program);
    
    // 检查链接状态
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`链接着色器程序失败: ${infoLog}`);
    }
    
    return program;
  }

  /**
   * 从程序中提取顶点属性位置
   */
  private extractAttributeLocations(): void {
    if (!this.program) {
      return;
    }
    
    const gl = this.gl;
    const attribCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
    
    for (let i = 0; i < attribCount; i++) {
      const attribInfo = gl.getActiveAttrib(this.program, i);
      if (attribInfo) {
        const location = gl.getAttribLocation(this.program, attribInfo.name);
        this.attributeLocations.set(attribInfo.name, location);
      }
    }
  }

  /**
   * 准备顶点布局信息
   */
  private prepareVertexLayout(): void {
    // 处理顶点布局，将其映射到WebGL格式
    for (const bufferLayout of this._vertexLayout.buffers) {
      const { index, stride, attributes } = bufferLayout;
      
      const attributeLayouts = attributes.map(attr => {
        const format = this.utils.vertexFormatToGL(attr.format);
        return {
          stride,
          offset: attr.offset,
          format,
        };
      });
      
      this.attributeBufferLayouts.set(index, attributeLayouts);
    }
  }

  /**
   * 创建顶点数组对象
   */
  private createVertexArrayObject(): void {
    // VAO在WebGL2中原生支持，WebGL1需要扩展
    if (this.isWebGL2) {
      this.vertexArrayObject = (this.gl as WebGL2RenderingContext).createVertexArray();
    } else {
      const ext = this.gl.getExtension('OES_vertex_array_object');
      if (ext) {
        this.vertexArrayObject = ext.createVertexArrayOES();
      }
    }
    
    // 如果VAO可用，设置顶点属性
    if (this.vertexArrayObject) {
      this.bindVertexArrayObject(this.vertexArrayObject);
      // 解绑VAO - 实际顶点缓冲区将在渲染时绑定
      this.unbindVertexArrayObject();
    }
  }

  /**
   * 绑定顶点数组对象
   */
  private bindVertexArrayObject(vao: WebGLVertexArrayObject): void {
    if (this.isWebGL2) {
      (this.gl as WebGL2RenderingContext).bindVertexArray(vao);
    } else {
      const ext = this.gl.getExtension('OES_vertex_array_object');
      if (ext) {
        ext.bindVertexArrayOES(vao);
      }
    }
  }

  /**
   * 解绑顶点数组对象
   */
  private unbindVertexArrayObject(): void {
    if (this.isWebGL2) {
      (this.gl as WebGL2RenderingContext).bindVertexArray(null);
    } else {
      const ext = this.gl.getExtension('OES_vertex_array_object');
      if (ext) {
        ext.bindVertexArrayOES(null);
      }
    }
  }

  /**
   * 应用管线状态
   */
  apply(): void {
    const gl = this.gl;
    
    // 使用着色器程序
    gl.useProgram(this.program);
    
    // 应用光栅化状态
    this.applyRasterizationState();
    
    // 应用深度模板状态
    if (this._depthStencilState) {
      this.applyDepthStencilState();
    }
    
    // 应用颜色混合状态
    if (this._colorBlendState) {
      this.applyColorBlendState();
    }
    
    // 绑定VAO（如果可用）
    if (this.vertexArrayObject) {
      this.bindVertexArrayObject(this.vertexArrayObject);
    }
  }

  /**
   * 应用光栅化状态
   */
  private applyRasterizationState(): void {
    const gl = this.gl;
    const { cullMode, frontFace, lineWidth, depthBias, depthBiasClamp, depthBiasSlopeScale } = this._rasterizationState;
    
    // 设置剔除模式
    const cullResult = this.utils.cullModeToGL(cullMode);
    if (cullResult.enable) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(cullResult.mode);
    } else {
      gl.disable(gl.CULL_FACE);
    }
    
    // 设置面朝向
    gl.frontFace(this.utils.frontFaceToGL(frontFace));
    
    // 应用线宽
    gl.lineWidth(lineWidth);
    
    // 多边形偏移（深度偏移）
    if (depthBias || depthBiasSlopeScale) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(depthBiasSlopeScale, depthBias);
    } else {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
  }

  /**
   * 应用深度模板状态
   */
  private applyDepthStencilState(): void {
    const gl = this.gl;
    const state = this._depthStencilState!;
    
    // 深度测试设置
    if (state.depthTestEnabled || state.depthCompare !== 'always') {
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(state.depthWriteEnabled);
      gl.depthFunc(this.utils.compareFunctionToGL(state.depthCompare));
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    
    // 模板测试设置
    if (state.stencilFront || state.stencilBack) {
      gl.enable(gl.STENCIL_TEST);
      
      const front = state.stencilFront;
      const back = state.stencilBack || front;
      
      if (front) {
        gl.stencilFuncSeparate(
          gl.FRONT,
          this.utils.compareFunctionToGL(front.compare),
          front.reference,
          front.readMask
        );
        gl.stencilOpSeparate(
          gl.FRONT,
          this.utils.stencilOperationToGL(front.failOp),
          this.utils.stencilOperationToGL(front.depthFailOp),
          this.utils.stencilOperationToGL(front.passOp)
        );
        gl.stencilMaskSeparate(gl.FRONT, front.writeMask);
      }
      
      if (back) {
        gl.stencilFuncSeparate(
          gl.BACK,
          this.utils.compareFunctionToGL(back.compare),
          back.reference,
          back.readMask
        );
        gl.stencilOpSeparate(
          gl.BACK,
          this.utils.stencilOperationToGL(back.failOp),
          this.utils.stencilOperationToGL(back.depthFailOp),
          this.utils.stencilOperationToGL(back.passOp)
        );
        gl.stencilMaskSeparate(gl.BACK, back.writeMask);
      }
    } else {
      gl.disable(gl.STENCIL_TEST);
    }
  }

  /**
   * 应用颜色混合状态
   */
  private applyColorBlendState(): void {
    const gl = this.gl;
    const state = this._colorBlendState!;
    
    if (state.blendEnabled) {
      gl.enable(gl.BLEND);
      
      gl.blendEquationSeparate(
        this.utils.blendOperationToGL(state.colorBlendOperation),
        this.utils.blendOperationToGL(state.alphaBlendOperation)
      );
      
      gl.blendFuncSeparate(
        this.utils.blendFactorToGL(state.srcColorFactor),
        this.utils.blendFactorToGL(state.dstColorFactor),
        this.utils.blendFactorToGL(state.srcAlphaFactor),
        this.utils.blendFactorToGL(state.dstAlphaFactor)
      );
      
      if (state.blendColor) {
        gl.blendColor(
          state.blendColor[0],
          state.blendColor[1],
          state.blendColor[2],
          state.blendColor[3]
        );
      }
      
      if (state.writeMask !== undefined) {
        gl.colorMask(
          (state.writeMask & 0x1) !== 0,  // Red
          (state.writeMask & 0x2) !== 0,  // Green
          (state.writeMask & 0x4) !== 0,  // Blue
          (state.writeMask & 0x8) !== 0   // Alpha
        );
      }
    } else {
      gl.disable(gl.BLEND);
    }
  }

  /**
   * 设置顶点缓冲区
   * @param slot 顶点缓冲区槽位
   * @param buffer WebGL缓冲区
   * @param offset 偏移量（字节）
   */
  setVertexBuffer(slot: number, buffer: WebGLBuffer, offset: number = 0): void {
    const gl = this.gl;
    const layouts = this.attributeBufferLayouts.get(slot);
    
    if (!layouts) {
      return;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.getGLBuffer());
    
    for (const layout of layouts) {
      const { stride, offset: attrOffset, format } = layout;
      const attributeLocation = gl.getAttribLocation(this.program!, `a_position${slot}`); // 实际应该根据语义映射
      
      if (attributeLocation >= 0) {
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(
          attributeLocation,
          format.size,
          format.type,
          format.normalized,
          stride,
          offset + attrOffset
        );
        
        // 如果支持实例化绘制，可以设置顶点属性除数
        if (this.isWebGL2 && (this._vertexLayout.buffers[slot].stepMode === 'instance')) {
          (gl as WebGL2RenderingContext).vertexAttribDivisor(attributeLocation, 1);
        }
      }
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * 获取WebGL程序对象
   */
  getProgram(): WebGLProgram | null {
    return this.program;
  }

  /**
   * 获取顶点着色器
   */
  get vertexShader(): IRHIShaderModule {
    return this._vertexShader;
  }

  /**
   * 获取片段着色器
   */
  get fragmentShader(): IRHIShaderModule {
    return this._fragmentShader;
  }

  /**
   * 获取顶点布局
   */
  get vertexLayout(): RHIVertexLayout {
    return this._vertexLayout;
  }

  /**
   * 获取图元类型
   */
  get primitiveTopology(): RHIPrimitiveTopology {
    return this._primitiveTopology;
  }

  /**
   * 获取光栅化状态
   */
  get rasterizationState(): RHIRasterizationState {
    return this._rasterizationState;
  }

  /**
   * 获取深度模板状态
   */
  get depthStencilState(): RHIDepthStencilState | undefined {
    return this._depthStencilState;
  }

  /**
   * 获取颜色混合状态
   */
  get colorBlendState(): RHIColorBlendState | undefined {
    return this._colorBlendState;
  }

  /**
   * 获取管线布局
   */
  get layout(): IRHIPipelineLayout {
    return this._layout;
  }

  /**
   * 获取标签
   */
  get label(): string | undefined {
    return this._label;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    
    if (this.vertexArrayObject) {
      if (this.isWebGL2) {
        (this.gl as WebGL2RenderingContext).deleteVertexArray(this.vertexArrayObject);
      } else {
        const ext = this.gl.getExtension('OES_vertex_array_object');
        if (ext) {
          ext.deleteVertexArrayOES(this.vertexArrayObject);
        }
      }
      this.vertexArrayObject = null;
    }
    
    this.isDestroyed = true;
  }
} 
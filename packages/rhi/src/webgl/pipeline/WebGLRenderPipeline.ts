import type {
  IRHIRenderPipeline,
  IRHIShaderModule,
  IRHIPipelineLayout,
  RHIVertexLayout,
  RHIPrimitiveTopology,
  RHIRasterizationState,
  RHIDepthStencilState,
  RHIColorBlendState,
  RHIRenderPipelineDescriptor,
  IRHIBuffer,
} from '@maxellabs/core';
import {
  RHICompareFunction,
  RHICullMode,
  RHIFrontFace,
  RHIStencilOperation,
  RHIBlendFactor,
  RHIBlendOperation,
} from '@maxellabs/core';
import type { WebGLShader } from '../resources/WebGLShader';
import { WebGLUtils } from '../utils/WebGLUtils';
import type { GLBuffer } from '../resources';

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
  private attributeBufferLayouts: Map<number, { name: string, stride: number, offset: number, format: { type: number, size: number, normalized: boolean } }[]> = new Map();
  private isDestroyed: boolean = false;
  private utils: WebGLUtils;

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param descriptor 渲染管线描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHIRenderPipelineDescriptor) {
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
  private getDefaultRasterizationState (): RHIRasterizationState {
    return {
      cullMode: RHICullMode.BACK,
      frontFace: RHIFrontFace.CCW,
      lineWidth: 1,
      depthBias: 0,
      depthBiasClamp: 0,
      depthBiasSlopeScale: 0,
    } as RHIRasterizationState;
  }

  /**
   * 创建并链接着色器程序
   */
  private createProgram (): WebGLProgram | null {
    const gl = this.gl;
    const vertexShaderInstance = this._vertexShader as any as WebGLShader;
    const fragmentShaderInstance = this._fragmentShader as any as WebGLShader;

    const vertexGLShader = vertexShaderInstance?.getGLShader ? vertexShaderInstance.getGLShader() : null;
    const fragmentGLShader = fragmentShaderInstance?.getGLShader ? fragmentShaderInstance.getGLShader() : null;

    if (!vertexGLShader || !fragmentGLShader) {
      console.error('Create program failed: Invalid shader module type or getGLShader method missing.');
      return null;
    }

    const program = gl.createProgram();

    if (!program) {
      throw new Error('创建WebGL程序对象失败');
    }

    // 附加着色器
    gl.attachShader(program, vertexGLShader);
    gl.attachShader(program, fragmentGLShader);

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
  private extractAttributeLocations (): void {
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
  private prepareVertexLayout (): void {
    if (!this._vertexLayout?.buffers || !Array.isArray(this._vertexLayout.buffers)) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] RHIVertexLayout.buffers is invalid.`, this._vertexLayout?.buffers);
      this.attributeBufferLayouts.clear();

      return;
    }
    if (this._vertexLayout.buffers.length === 0) {
      console.warn(`[${this._label || 'WebGLRenderPipeline'}] RHIVertexLayout.buffers is an empty array.`);
    }
    // console.log(`[${this._label || 'WebGLRenderPipeline'}] Preparing vertex layout. Buffers in descriptor:`, JSON.stringify(this._vertexLayout.buffers));

    for (const bufferLayout of this._vertexLayout.buffers) {
      if (bufferLayout === null || bufferLayout === undefined) {
        console.error(`[${this._label || 'WebGLRenderPipeline'}] Encountered null or undefined bufferLayout in RHIVertexLayout.buffers.`);
        continue;
      }
      const { index, stride, attributes } = bufferLayout;

      if (typeof index !== 'number') {
         console.error(`[${this._label || 'WebGLRenderPipeline'}] bufferLayout is missing a valid 'index' (slot). Received:`, bufferLayout);
         continue;
      }
      if (!attributes || !Array.isArray(attributes)) {
        console.error(`[${this._label || 'WebGLRenderPipeline'}] RHIVertexBufferLayout.attributes for slot ${index} is undefined, null, or not an array. Received:`, attributes);
        continue; // Skip this bufferLayout if attributes are invalid
      }

      const attributeLayouts = attributes.map(attr => {
        if (!attr) {
          console.error(`[${this._label || 'WebGLRenderPipeline'}] Encountered null/undefined attribute in slot ${index}.`);

          return null;
        }
        if (attr.format === undefined) {
          console.error(`[${this._label || 'WebGLRenderPipeline'}] Attribute in slot ${index} missing 'format'.`, attr);

          return null;
        }
        const formatInfo = this.utils.vertexFormatToGL(attr.format);

        if (!formatInfo) {
          console.error(`[${this._label || 'WebGLRenderPipeline'}] Could not get GL format for RHIVertexFormat '${attr.format}' (attribute '${attr.name || 'unnamed'}' in slot ${index}).`);

          return null;
        }
        const attributeName = attr.name || `attr_slot${index}_loc${attr.shaderLocation}`;

        if (!this.attributeLocations.has(attributeName) && attr.name && this.program) {
          const loc = this.gl.getAttribLocation(this.program, attr.name);

          if (loc !== -1) {
            this.attributeLocations.set(attr.name, loc);
          }
        } else if (!attr.name && this.program && attr.shaderLocation !== undefined) {
          console.warn(`[${this._label || 'WebGLRenderPipeline'}] Attribute in slot ${index} at location ${attr.shaderLocation} is missing a 'name'.`);
        }

        return {
          name: attributeName,
          stride: stride,
          offset: attr.offset,
          format: formatInfo,
          index: index,
        };
      }).filter(Boolean);

      // Only set if there were original attributes and we successfully mapped some, or if original attributes was empty
      if (attributeLayouts.length > 0 || attributes.length === 0) {
        this.attributeBufferLayouts.set(index, attributeLayouts as { name: string, stride: number, offset: number, format: { type: number, size: number, normalized: boolean } }[]); // `as any[]` because filter(Boolean) typing can be tricky
        // console.log(`[${this._label || 'WebGLRenderPipeline'}] Prepared attribute layouts for slot ${index}:`, attributeLayouts);
      } else if (attributes.length > 0 && attributeLayouts.length === 0) {
        console.error(`[${this._label || 'WebGLRenderPipeline'}] Failed to process any attributes for slot ${index}, although ${attributes.length} original attributes were present.`);
      }
    }
  }

  /**
   * 创建顶点数组对象
   */
  private createVertexArrayObject (): void {
    // VAO在WebGL2中原生支持，WebGL1需要扩展
    if (this.isWebGL2) {
      this.vertexArrayObject = (this.gl as WebGL2RenderingContext).createVertexArray();
    } else {
      const ext = this.gl.getExtension('OES_vertex_array_object');

      if (ext) {
        this.vertexArrayObject = ext.createVertexArrayOES();
      } else {
        this.vertexArrayObject = null; // Explicitly set to null if extension not found
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
  private bindVertexArrayObject (vao: WebGLVertexArrayObject | null): void {
    if (this.isWebGL2) {
      (this.gl as WebGL2RenderingContext).bindVertexArray(vao);
    } else {
      const ext = this.gl.getExtension('OES_vertex_array_object');

      if (ext && vao) {
        ext.bindVertexArrayOES(vao);
      } else if (ext && !vao) {
        ext.bindVertexArrayOES(null); // Unbind
      }
    }
  }

  /**
   * 解绑顶点数组对象
   */
  private unbindVertexArrayObject (): void {
    this.bindVertexArrayObject(null); // Use the unified binder with null
  }

  /**
   * 应用管线状态
   */
  apply (): void {
    if (this.isDestroyed) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Attempting to apply a destroyed pipeline.`);

      return;
    }
    if (!this.program) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Cannot apply pipeline, program is null.`);

      return;
    }

    const gl = this.gl;

    gl.useProgram(this.program);

    this.applyRasterizationState();

    if (this._depthStencilState) {
      this.applyDepthStencilState(this._depthStencilState);
    }
    if (this._colorBlendState) {
      this.applyColorBlendState(this._colorBlendState);
    }

    this.bindVertexArrayObject(this.vertexArrayObject);
  }

  /**
   * 应用光栅化状态
   */
  private applyRasterizationState (): void {
    const gl = this.gl;
    const state = this._rasterizationState || {}; 
    const cullMode = state.cullMode ?? RHICullMode.NONE; 
    const frontFace = state.frontFace ?? RHIFrontFace.CCW;
    const lineWidth = state.lineWidth ?? 1;
    // Cast to any to access potentially missing properties, then use nullish coalescing
    const depthBias = (state as any).depthBias ?? 0;
    const depthBiasSlopeScale = (state as any).depthBiasSlopeScale ?? 0;

    const cullResult = this.utils.cullModeToGL(cullMode);

    if (cullResult.enable) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(cullResult.mode);
    } else {
      gl.disable(gl.CULL_FACE);
    }

    gl.frontFace(this.utils.frontFaceToGL(frontFace));
    gl.lineWidth(lineWidth);

    if (depthBias !== 0 || depthBiasSlopeScale !== 0) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(depthBiasSlopeScale, depthBias);
    } else {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
  }

  /**
   * 应用深度模板状态
   */
  private applyDepthStencilState (state: RHIDepthStencilState): void {
    const gl = this.gl;
    
    // Use optional chaining and defaults for potentially missing properties
    const depthCompare = state.depthCompare ?? RHICompareFunction.ALWAYS;
    const depthTestEnabled = (state as any).depthTestEnabled ?? (depthCompare !== RHICompareFunction.ALWAYS);
    const depthWriteEnabled = state.depthWriteEnabled ?? true;
    const stencilTestEnabled = !!(state.stencilFront || state.stencilBack);

    if (depthTestEnabled) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(depthWriteEnabled);
      gl.depthFunc(this.utils.compareFunctionToGL(depthCompare));
    } else {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }

    if (stencilTestEnabled) {
      gl.enable(gl.STENCIL_TEST);

      const front = state.stencilFront;
      const back = state.stencilBack || front;

      if (front) {
        const compare = front.compare ?? RHICompareFunction.ALWAYS;
        const reference = (front as any).reference ?? 0;
        const readMask = (front as any).readMask ?? 0xFF;
        const failOp = front.failOp ?? RHIStencilOperation.KEEP;
        const depthFailOp = front.depthFailOp ?? RHIStencilOperation.KEEP;
        const passOp = front.passOp ?? RHIStencilOperation.KEEP;
        const writeMask = (front as any).writeMask ?? 0xFF;

        gl.stencilFuncSeparate(
          gl.FRONT,
          this.utils.compareFunctionToGL(compare),
          reference,
          readMask
        );
        gl.stencilOpSeparate(
          gl.FRONT,
          this.utils.stencilOperationToGL(failOp),
          this.utils.stencilOperationToGL(depthFailOp),
          this.utils.stencilOperationToGL(passOp)
        );
        gl.stencilMaskSeparate(gl.FRONT, writeMask);
      }

      if (back) {
        const compare = back.compare ?? RHICompareFunction.ALWAYS;
        const reference = (back as any).reference ?? 0;
        const readMask = (back as any).readMask ?? 0xFF;
        const failOp = back.failOp ?? RHIStencilOperation.KEEP;
        const depthFailOp = back.depthFailOp ?? RHIStencilOperation.KEEP;
        const passOp = back.passOp ?? RHIStencilOperation.KEEP;
        const writeMask = (back as any).writeMask ?? 0xFF;

        gl.stencilFuncSeparate(
          gl.BACK,
          this.utils.compareFunctionToGL(compare),
          reference,
          readMask
        );
        gl.stencilOpSeparate(
          gl.BACK,
          this.utils.stencilOperationToGL(failOp),
          this.utils.stencilOperationToGL(depthFailOp),
          this.utils.stencilOperationToGL(passOp)
        );
        gl.stencilMaskSeparate(gl.BACK, writeMask);
      }
    } else {
      gl.disable(gl.STENCIL_TEST);
    }
  }

  /**
   * 应用颜色混合状态
   */
  private applyColorBlendState (state: RHIColorBlendState): void {
    const gl = this.gl;
    const blendEnabled = (state as any).blendEnabled ?? false;
    const colorOp = (state as any).colorBlendOperation ?? RHIBlendOperation.ADD;
    const alphaOp = (state as any).alphaBlendOperation ?? RHIBlendOperation.ADD;
    const srcColor = (state as any).srcColorFactor ?? RHIBlendFactor.ONE;
    const dstColor = (state as any).dstColorFactor ?? RHIBlendFactor.ZERO;
    const srcAlpha = (state as any).srcAlphaFactor ?? RHIBlendFactor.ONE;
    const dstAlpha = (state as any).dstAlphaFactor ?? RHIBlendFactor.ZERO;
    const blendColor = (state as any).blendColor;
    const writeMask = (state as any).writeMask ?? 0xF;

    if (blendEnabled) {
      gl.enable(gl.BLEND);

      gl.blendEquationSeparate(
        this.utils.blendOperationToGL(colorOp),
        this.utils.blendOperationToGL(alphaOp)
      );

      gl.blendFuncSeparate(
        this.utils.blendFactorToGL(srcColor),
        this.utils.blendFactorToGL(dstColor),
        this.utils.blendFactorToGL(srcAlpha),
        this.utils.blendFactorToGL(dstAlpha)
      );

      if (blendColor && Array.isArray(blendColor) && blendColor.length === 4) {
        gl.blendColor(
          blendColor[0],
          blendColor[1],
          blendColor[2],
          blendColor[3]
        );
      }

      gl.colorMask(
        (writeMask & 1) !== 0,
        (writeMask & 2) !== 0,
        (writeMask & 4) !== 0,
        (writeMask & 8) !== 0
      );
    } else {
      gl.disable(gl.BLEND);
      gl.colorMask(true, true, true, true);
    }
  }

  /**
   * 设置顶点缓冲区
   * @param slot 顶点缓冲区槽位
   * @param buffer WebGL缓冲区
   * @param offset 偏移量（字节）
   */
  setVertexBuffer (slot: number, buffer: GLBuffer, offset: number = 0): void {
    if (this.isDestroyed) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Attempting to set vertex buffer on destroyed pipeline.`);

      return;
    }
    this.applyVertexBufferLayout(slot, buffer, offset);
  }

  /**
   * 获取WebGL程序对象
   */
  getProgram (): WebGLProgram | null {
    if (this.isDestroyed) {
      return null;
    }
    return this.program;
  }

  /**
   * 获取顶点数组对象
   */
  getVertexArrayObject(): WebGLVertexArrayObject | null {
    if (this.isDestroyed) {
      return null;
    }
    return this.vertexArrayObject;
  }

  /**
   * 应用顶点缓冲区布局
   * @param slot 槽位
   * @param buffer WebGL缓冲区
   * @param offset 偏移量
   */
  applyVertexBufferLayout(slot: number, buffer: IRHIBuffer, bufferOffsetInBytes: number = 0): void {
    const gl = this.gl;
    const layoutsForSlot = this.attributeBufferLayouts.get(slot);

    // --- Start Debugging --- 
    console.log(`[${this._label || 'WebGLRenderPipeline'}] applyVertexBufferLayout called for slot ${slot}`);
    console.log(`  - Buffer object received:`, buffer);
    console.log(`  - Buffer constructor name:`, buffer?.constructor?.name);
    
    // --- End Debugging --- 

    if (!layoutsForSlot) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] No layout for slot ${slot}.`);
      return;
    }
    
    if (!Array.isArray(layoutsForSlot)) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Layout for slot ${slot} is not array.`);
      return;
    }

    // 获取WebGL缓冲区对象
    let nativeBuffer: WebGLBuffer | null = null;
    
    // 尝试调用getGLBuffer方法获取原生缓冲区
    if (typeof (buffer as any).getGLBuffer === 'function') {
      nativeBuffer = (buffer as any).getGLBuffer();
    } else {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Buffer object doesn't have getGLBuffer method`);
      return;
    }
    
    if (!nativeBuffer) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Failed to get native WebGLBuffer from buffer object for slot ${slot}.`);
      return; // Cannot proceed without native buffer
    }

    // 绑定缓冲区以确保后续顶点属性指针调用引用正确的缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, nativeBuffer);

    for (const attrLayout of layoutsForSlot) {
      if (!attrLayout?.name) {
        console.warn(`[${this._label || 'WebGLRenderPipeline'}] Skipping invalid layout in slot ${slot}.`, attrLayout);
        continue;
      }
      
      const location = this.attributeLocations.get(attrLayout.name);

      if (location === undefined || location === -1) {
        console.warn(`[${this._label || 'WebGLRenderPipeline'}] Attribute '${attrLayout.name}' location not found.`);
        continue;
      }
      
      console.log(`[${this._label || 'WebGLRenderPipeline'}] Enabling attribute: ${attrLayout.name} at location: ${location}`);
      
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        attrLayout.format.size,
        attrLayout.format.type,
        attrLayout.format.normalized,
        attrLayout.stride,
        attrLayout.offset + bufferOffsetInBytes
      );
    }
  }

  /**
   * 获取顶点着色器
   */
  get vertexShader (): IRHIShaderModule {
    return this._vertexShader;
  }

  /**
   * 获取片段着色器
   */
  get fragmentShader (): IRHIShaderModule {
    return this._fragmentShader;
  }

  /**
   * 获取顶点布局
   */
  get vertexLayout (): RHIVertexLayout {
    return this._vertexLayout;
  }

  /**
   * 获取图元类型
   */
  get primitiveTopology (): RHIPrimitiveTopology {
    return this._primitiveTopology;
  }

  /**
   * 获取光栅化状态
   */
  get rasterizationState (): RHIRasterizationState {
    return this._rasterizationState;
  }

  /**
   * 获取深度模板状态
   */
  get depthStencilState (): RHIDepthStencilState | undefined {
    return this._depthStencilState;
  }

  /**
   * 获取颜色混合状态
   */
  get colorBlendState (): RHIColorBlendState | undefined {
    return this._colorBlendState;
  }

  /**
   * 获取管线布局
   */
  get layout (): IRHIPipelineLayout {
    return this._layout;
  }

  /**
   * 获取标签
   */
  get label (): string | undefined {
    return this._label;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
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

    this.attributeLocations.clear();
    this.attributeBufferLayouts.clear();
    this.isDestroyed = true;
  }
}
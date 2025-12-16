import { MSpec } from '@maxellabs/core';
import type { GLShader } from '../resources/GLShader';
import { WebGLUtils } from '../utils/GLUtils';
import type { GLBuffer } from '../resources';
import type { Std140Layout } from '../utils/Std140Layout';

/**
 * WebGL渲染管线实现
 */
export class WebGLRenderPipeline implements MSpec.IRHIRenderPipeline {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private program: WebGLProgram | null;
  private vertexArrayObject: WebGLVertexArrayObject | null = null;
  private _vertexShader: MSpec.IRHIShaderModule;
  private _fragmentShader: MSpec.IRHIShaderModule;
  private _vertexLayout: MSpec.RHIVertexLayout;
  private _primitiveTopology: MSpec.RHIPrimitiveTopology;
  private _rasterizationState: MSpec.RHIRasterizationState;
  private _depthStencilState?: MSpec.RHIDepthStencilState;
  private _colorBlendState?: MSpec.RHIColorBlendState;
  private _layout: MSpec.IRHIPipelineLayout;
  private _label?: string;
  private attributeLocations: Map<string, number> = new Map();
  private attributeBufferLayouts: Map<
    number,
    {
      name: string;
      stride: number;
      offset: number;
      format: { type: number; size: number; normalized: boolean };
      shaderLocation?: number;
    }[]
  > = new Map();
  private isDestroyed: boolean = false;
  private utils: WebGLUtils;

  // Push Constants UBO 相关
  private pushConstantBuffer: WebGLBuffer | null = null;
  private pushConstantLayout: Std140Layout | null = null;
  private pushConstantData: Float32Array | null = null;
  private pushConstantBlockIndex: number = -1;
  private pushConstantBindingPoint: number = 15; // 使用高编号绑定点避免冲突
  private static readonly PUSH_CONSTANT_BLOCK_NAME = '_PushConstants';

  /**
   * 构造函数
   * @param gl WebGL上下文
   * @param descriptor 渲染管线描述符
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: MSpec.RHIRenderPipelineDescriptor) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.utils = new WebGLUtils(gl, { EXT_blend_minmax: this.gl.getExtension('EXT_blend_minmax') });
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

    // 初始化 Push Constants UBO（仅 WebGL2）
    this.initPushConstantsUBO();

    // 准备顶点布局数据
    this.prepareVertexLayout();

    // 如果支持，创建顶点数组对象(VAO)
    this.createVertexArrayObject();
  }

  /**
   * 获取默认的光栅化状态
   */
  private getDefaultRasterizationState(): MSpec.RHIRasterizationState {
    return {
      cullMode: MSpec.RHICullMode.BACK,
      frontFace: MSpec.RHIFrontFace.CCW,
      lineWidth: 1,
      depthBias: 0,
      depthBiasClamp: 0,
      depthBiasSlopeScale: 0,
    } as MSpec.RHIRasterizationState;
  }

  /**
   * 创建并链接着色器程序
   */
  private createProgram(): WebGLProgram | null {
    const gl = this.gl;
    const vertexShaderInstance = this._vertexShader as any as GLShader;
    const fragmentShaderInstance = this._fragmentShader as any as GLShader;

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
    if (!this._vertexLayout?.buffers || !Array.isArray(this._vertexLayout.buffers)) {
      console.error(
        `[${this._label || 'WebGLRenderPipeline'}] RHIVertexLayout.buffers is invalid.`,
        this._vertexLayout?.buffers
      );
      this.attributeBufferLayouts.clear();

      return;
    }
    if (this._vertexLayout.buffers.length === 0) {
      console.warn(`[${this._label || 'WebGLRenderPipeline'}] RHIVertexLayout.buffers is an empty array.`);
    }
    // console.log(`[${this._label || 'WebGLRenderPipeline'}] Preparing vertex layout. Buffers in descriptor:`, JSON.stringify(this._vertexLayout.buffers));

    for (const bufferLayout of this._vertexLayout.buffers) {
      if (bufferLayout === null || bufferLayout === undefined) {
        console.error(
          `[${this._label || 'WebGLRenderPipeline'}] Encountered null or undefined bufferLayout in RHIVertexLayout.buffers.`
        );
        continue;
      }
      const { index, stride, attributes, stepMode } = bufferLayout;

      if (typeof index !== 'number') {
        console.error(
          `[${this._label || 'WebGLRenderPipeline'}] bufferLayout is missing a valid 'index' (slot). Received:`,
          bufferLayout
        );
        continue;
      }
      if (!attributes || !Array.isArray(attributes)) {
        console.error(
          `[${this._label || 'WebGLRenderPipeline'}] RHIVertexBufferLayout.attributes for slot ${index} is undefined, null, or not an array. Received:`,
          attributes
        );
        continue; // Skip this bufferLayout if attributes are invalid
      }

      const attributeLayouts = attributes
        .map((attr) => {
          if (!attr) {
            console.error(
              `[${this._label || 'WebGLRenderPipeline'}] Encountered null/undefined attribute in slot ${index}.`
            );

            return null;
          }
          if (attr.format === undefined) {
            console.error(
              `[${this._label || 'WebGLRenderPipeline'}] Attribute in slot ${index} missing 'format'.`,
              attr
            );

            return null;
          }
          const formatInfo = this.utils.vertexFormatToGL(attr.format);

          if (!formatInfo) {
            console.error(
              `[${this._label || 'WebGLRenderPipeline'}] Could not get GL format for RHIVertexFormat '${attr.format}' (attribute '${attr.name || 'unnamed'}' in slot ${index}).`
            );

            return null;
          }
          const attributeName = attr.name || `attr_slot${index}_loc${attr.shaderLocation}`;

          // 优先尝试获取属性位置
          if (!this.attributeLocations.has(attributeName) && attr.name && this.program) {
            const loc = this.gl.getAttribLocation(this.program, attr.name);

            if (loc !== -1) {
              this.attributeLocations.set(attr.name, loc);
            }
          } else if (!attr.name && this.program && attr.shaderLocation !== undefined) {
            console.warn(
              `[${this._label || 'WebGLRenderPipeline'}] Attribute in slot ${index} at location ${attr.shaderLocation} is missing a 'name'.`
            );
          }

          // 如果没有找到属性位置且shaderLocation有定义，使用shaderLocation作为备选
          if (!this.attributeLocations.has(attributeName) && attr.shaderLocation !== undefined) {
            this.attributeLocations.set(attributeName, attr.shaderLocation);
            console.warn(
              `[${this._label || 'WebGLRenderPipeline'}] Using shaderLocation ${attr.shaderLocation} for attribute '${attributeName}'`
            );
          }

          return {
            name: attributeName,
            stride: stride,
            offset: attr.offset,
            format: formatInfo,
            index: index,
            shaderLocation: attr.shaderLocation, // 保存shaderLocation
            stepMode: stepMode, // 保存步进模式
          };
        })
        .filter(Boolean);

      // Only set if there were original attributes and we successfully mapped some, or if original attributes was empty
      if (attributeLayouts.length > 0 || attributes.length === 0) {
        this.attributeBufferLayouts.set(
          index,
          attributeLayouts as {
            name: string;
            stride: number;
            offset: number;
            format: { type: number; size: number; normalized: boolean };
            stepMode?: string;
          }[]
        ); // `as any[]` because filter(Boolean) typing can be tricky
        // console.log(`[${this._label || 'WebGLRenderPipeline'}] Prepared attribute layouts for slot ${index}:`, attributeLayouts);
      } else if (attributes.length > 0 && attributeLayouts.length === 0) {
        console.error(
          `[${this._label || 'WebGLRenderPipeline'}] Failed to process any attributes for slot ${index}, although ${attributes.length} original attributes were present.`
        );
      }
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
  private bindVertexArrayObject(vao: WebGLVertexArrayObject | null): void {
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
  private unbindVertexArrayObject(): void {
    this.bindVertexArrayObject(null); // Use the unified binder with null
  }

  /**
   * 应用管线状态
   */
  apply(): void {
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
  private applyRasterizationState(): void {
    const gl = this.gl;
    const state = this._rasterizationState || {};
    const cullMode = state.cullMode ?? MSpec.RHICullMode.NONE;
    const frontFace = state.frontFace ?? MSpec.RHIFrontFace.CCW;
    const lineWidth = state.lineWidth ?? 1;
    const depthBias = state.depthBias ?? 0;
    const depthBiasSlopeScale = state.depthBiasSlopeScale ?? 0;

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
  private applyDepthStencilState(state: MSpec.RHIDepthStencilState): void {
    const gl = this.gl;

    // Use optional chaining and defaults for potentially missing properties
    const depthCompare = state.depthCompare ?? MSpec.RHICompareFunction.ALWAYS;
    const depthTestEnabled = state.depthTestEnabled ?? depthCompare !== MSpec.RHICompareFunction.ALWAYS;
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
        const compare = front.compare ?? MSpec.RHICompareFunction.ALWAYS;
        const reference = front.reference ?? 0;
        const readMask = front.readMask ?? 0xff;
        const failOp = front.failOp ?? MSpec.RHIStencilOperation.KEEP;
        const depthFailOp = front.depthFailOp ?? MSpec.RHIStencilOperation.KEEP;
        const passOp = front.passOp ?? MSpec.RHIStencilOperation.KEEP;
        const writeMask = front.writeMask ?? 0xff;

        gl.stencilFuncSeparate(gl.FRONT, this.utils.compareFunctionToGL(compare), reference, readMask);
        gl.stencilOpSeparate(
          gl.FRONT,
          this.utils.stencilOperationToGL(failOp),
          this.utils.stencilOperationToGL(depthFailOp),
          this.utils.stencilOperationToGL(passOp)
        );
        gl.stencilMaskSeparate(gl.FRONT, writeMask);
      }

      if (back) {
        const compare = back.compare ?? MSpec.RHICompareFunction.ALWAYS;
        const reference = back.reference ?? 0;
        const readMask = back.readMask ?? 0xff;
        const failOp = back.failOp ?? MSpec.RHIStencilOperation.KEEP;
        const depthFailOp = back.depthFailOp ?? MSpec.RHIStencilOperation.KEEP;
        const passOp = back.passOp ?? MSpec.RHIStencilOperation.KEEP;
        const writeMask = back.writeMask ?? 0xff;

        gl.stencilFuncSeparate(gl.BACK, this.utils.compareFunctionToGL(compare), reference, readMask);
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
  private applyColorBlendState(state: MSpec.RHIColorBlendState): void {
    const gl = this.gl;
    const blendEnabled = state.blendEnabled ?? false;
    const colorOp = state.colorBlendOperation ?? MSpec.RHIBlendOperation.ADD;
    const alphaOp = state.alphaBlendOperation ?? MSpec.RHIBlendOperation.ADD;
    const srcColor = state.srcColorFactor ?? MSpec.RHIBlendFactor.One;
    const dstColor = state.dstColorFactor ?? MSpec.RHIBlendFactor.Zero;
    const srcAlpha = state.srcAlphaFactor ?? MSpec.RHIBlendFactor.One;
    const dstAlpha = state.dstAlphaFactor ?? MSpec.RHIBlendFactor.Zero;
    const blendColor = state.blendColor;
    const writeMask = state.writeMask ?? 0xf;

    if (blendEnabled) {
      gl.enable(gl.BLEND);

      gl.blendEquationSeparate(this.utils.blendOperationToGL(colorOp), this.utils.blendOperationToGL(alphaOp));

      gl.blendFuncSeparate(
        this.utils.blendFactorToGL(srcColor),
        this.utils.blendFactorToGL(dstColor),
        this.utils.blendFactorToGL(srcAlpha),
        this.utils.blendFactorToGL(dstAlpha)
      );

      if (blendColor && Array.isArray(blendColor) && blendColor.length === 4) {
        gl.blendColor(blendColor[0], blendColor[1], blendColor[2], blendColor[3]);
      }

      gl.colorMask((writeMask & 1) !== 0, (writeMask & 2) !== 0, (writeMask & 4) !== 0, (writeMask & 8) !== 0);
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
  setVertexBuffer(slot: number, buffer: GLBuffer, offset: number = 0): void {
    if (this.isDestroyed) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Attempting to set vertex buffer on destroyed pipeline.`);

      return;
    }
    this.applyVertexBufferLayout(slot, buffer, offset);
  }

  /**
   * 获取WebGL程序对象
   */
  getProgram(): WebGLProgram | null {
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
  applyVertexBufferLayout(slot: number, buffer: MSpec.IRHIBuffer, bufferOffsetInBytes: number = 0): void {
    const gl = this.gl;
    const layoutsForSlot = this.attributeBufferLayouts.get(slot);

    // --- End Debugging ---

    if (!layoutsForSlot) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] No layout for slot ${slot}.`);

      return;
    }

    if (!Array.isArray(layoutsForSlot)) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] Layout for slot ${slot} is not array.`);

      return;
    }

    // 注意：不再在这里禁用所有顶点属性
    // 原因：多缓冲区绑定时，连续调用 setVertexBuffer 会导致之前绑定的属性被禁用
    // 这会导致多顶点缓冲区 Demo 黑屏（只有最后一个缓冲区被正确绑定）
    // 顶点属性的清理应该在渲染通道开始时或管线切换时进行

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
      console.error(
        `[${this._label || 'WebGLRenderPipeline'}] Failed to get native WebGLBuffer from buffer object for slot ${slot}.`
      );

      return; // Cannot proceed without native buffer
    }

    for (const attrLayout of layoutsForSlot) {
      if (!attrLayout?.name) {
        console.warn(`[${this._label || 'WebGLRenderPipeline'}] Skipping invalid layout in slot ${slot}.`, attrLayout);
        continue;
      }

      // 获取属性位置，优先使用显式位置
      let location =
        attrLayout.shaderLocation !== undefined
          ? attrLayout.shaderLocation
          : this.attributeLocations.get(attrLayout.name);

      if (location === undefined || location === -1) {
        console.warn(
          `[${this._label || 'WebGLRenderPipeline'}] Attribute '${attrLayout.name}' location not found, trying to locate...`
        );
        // 最后尝试一次直接获取
        if (this.program && attrLayout.name) {
          location = this.gl.getAttribLocation(this.program, attrLayout.name);
        }
      }

      // 检查位置是否有效
      const maxAttribs = this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
      if (location === undefined || location < 0 || location >= maxAttribs) {
        console.error(
          `[${this._label || 'WebGLRenderPipeline'}] Invalid attribute location ${location} for '${attrLayout.name}'. Range: 0-${maxAttribs - 1}`
        );
        continue;
      }

      // 绑定缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, nativeBuffer);

      // 启用顶点属性
      gl.enableVertexAttribArray(location);

      // 设置顶点属性指针
      gl.vertexAttribPointer(
        location,
        attrLayout.format.size,
        attrLayout.format.type,
        attrLayout.format.normalized,
        attrLayout.stride,
        attrLayout.offset + bufferOffsetInBytes
      );

      // 处理实例化渲染的顶点属性分频
      // 如果是WebGL2，使用vertexAttribDivisor
      // 如果是WebGL1，尝试使用ANGLE_instanced_arrays扩展
      const stepMode = (attrLayout as any).stepMode;
      if (stepMode === 'instance') {
        if (this.isWebGL2) {
          (gl as WebGL2RenderingContext).vertexAttribDivisor(location, 1);
        } else {
          const ext = gl.getExtension('ANGLE_instanced_arrays');
          if (ext) {
            ext.vertexAttribDivisorANGLE(location, 1);
          } else {
            console.warn(`[${this._label || 'WebGLRenderPipeline'}] Instancing requested but not supported.`);
          }
        }
      } else {
        // 确保非实例化属性的divisor为0
        if (this.isWebGL2) {
          (gl as WebGL2RenderingContext).vertexAttribDivisor(location, 0);
        } else {
          const ext = gl.getExtension('ANGLE_instanced_arrays');
          if (ext) {
            ext.vertexAttribDivisorANGLE(location, 0);
          }
        }
      }
    }
  }

  /**
   * 获取顶点着色器
   */
  get vertexShader(): MSpec.IRHIShaderModule {
    return this._vertexShader;
  }

  /**
   * 获取片段着色器
   */
  get fragmentShader(): MSpec.IRHIShaderModule {
    return this._fragmentShader;
  }

  /**
   * 获取顶点布局
   */
  get vertexLayout(): MSpec.RHIVertexLayout {
    return this._vertexLayout;
  }

  /**
   * 获取图元类型
   */
  get primitiveTopology(): MSpec.RHIPrimitiveTopology {
    return this._primitiveTopology;
  }

  /**
   * 获取光栅化状态
   */
  get rasterizationState(): MSpec.RHIRasterizationState {
    return this._rasterizationState;
  }

  /**
   * 获取深度模板状态
   */
  get depthStencilState(): MSpec.RHIDepthStencilState | undefined {
    return this._depthStencilState;
  }

  /**
   * 获取颜色混合状态
   */
  get colorBlendState(): MSpec.RHIColorBlendState | undefined {
    return this._colorBlendState;
  }

  /**
   * 获取管线布局
   */
  get layout(): MSpec.IRHIPipelineLayout {
    return this._layout;
  }

  /**
   * 获取标签
   */
  get label(): string | undefined {
    return this._label;
  }

  // ==================== Push Constants UBO 方法 ====================

  /**
   * 初始化 Push Constants UBO
   * 在程序链接后查询 uniform block 并创建 UBO
   */
  private initPushConstantsUBO(): void {
    if (!this.isWebGL2 || !this.program) {
      return;
    }

    const gl2 = this.gl as WebGL2RenderingContext;

    // 查询着色器中是否有 _PushConstants uniform block
    this.pushConstantBlockIndex = gl2.getUniformBlockIndex(this.program, WebGLRenderPipeline.PUSH_CONSTANT_BLOCK_NAME);

    if (this.pushConstantBlockIndex === gl2.INVALID_INDEX) {
      // 着色器中没有定义 _PushConstants block，这是正常情况
      return;
    }

    // 获取 uniform block 的大小
    const blockSize = gl2.getActiveUniformBlockParameter(
      this.program,
      this.pushConstantBlockIndex,
      gl2.UNIFORM_BLOCK_DATA_SIZE
    ) as number;

    if (blockSize <= 0) {
      console.warn(`[${this._label || 'WebGLRenderPipeline'}] Push Constants block 大小无效: ${blockSize}`);

      return;
    }

    // 创建 UBO
    this.pushConstantBuffer = gl2.createBuffer();

    if (!this.pushConstantBuffer) {
      console.error(`[${this._label || 'WebGLRenderPipeline'}] 创建 Push Constants UBO 失败`);

      return;
    }

    // 初始化 UBO 数据
    this.pushConstantData = new Float32Array(Math.ceil(blockSize / 4));

    gl2.bindBuffer(gl2.UNIFORM_BUFFER, this.pushConstantBuffer);
    gl2.bufferData(gl2.UNIFORM_BUFFER, this.pushConstantData, gl2.DYNAMIC_DRAW);
    gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);

    // 绑定 uniform block 到绑定点
    gl2.uniformBlockBinding(this.program, this.pushConstantBlockIndex, this.pushConstantBindingPoint);

    // console.log(`[${this._label || 'WebGLRenderPipeline'}] Push Constants UBO 初始化完成，大小: ${blockSize} 字节`);
  }

  /**
   * 更新 Push Constants 数据
   *
   * @param offset 字节偏移
   * @param data 要写入的数据
   */
  updatePushConstants(offset: number, data: ArrayBufferView): void {
    if (!this.isWebGL2 || !this.pushConstantBuffer || !this.pushConstantData) {
      // WebGL1 或未初始化 UBO，降级到标量 uniform
      this.updatePushConstantsLegacy(offset, data);

      return;
    }

    const gl2 = this.gl as WebGL2RenderingContext;

    // 直接更新 UBO 中的数据
    gl2.bindBuffer(gl2.UNIFORM_BUFFER, this.pushConstantBuffer);
    gl2.bufferSubData(gl2.UNIFORM_BUFFER, offset, data);
    gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
  }

  /**
   * 绑定 Push Constants UBO
   * 在绘制之前调用
   */
  bindPushConstantsUBO(): void {
    if (!this.isWebGL2 || !this.pushConstantBuffer) {
      return;
    }

    const gl2 = this.gl as WebGL2RenderingContext;

    gl2.bindBufferBase(gl2.UNIFORM_BUFFER, this.pushConstantBindingPoint, this.pushConstantBuffer);
  }

  /**
   * 获取 Push Constants UBO 是否可用
   */
  hasPushConstantsUBO(): boolean {
    return this.isWebGL2 && this.pushConstantBuffer !== null;
  }

  /**
   * 获取 Push Constants 数据缓冲区（用于批量更新）
   */
  getPushConstantData(): Float32Array | null {
    return this.pushConstantData;
  }

  /**
   * 刷新整个 Push Constants 缓冲区到 GPU
   */
  flushPushConstants(): void {
    if (!this.isWebGL2 || !this.pushConstantBuffer || !this.pushConstantData) {
      return;
    }

    const gl2 = this.gl as WebGL2RenderingContext;

    gl2.bindBuffer(gl2.UNIFORM_BUFFER, this.pushConstantBuffer);
    gl2.bufferSubData(gl2.UNIFORM_BUFFER, 0, this.pushConstantData);
    gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
  }

  /**
   * WebGL1 降级方案：通过标量 uniform 更新数据
   * 这需要知道 uniform 的名称，目前只是占位实现
   */
  private updatePushConstantsLegacy(offset: number, data: ArrayBufferView): void {
    if (!this.program) {
      return;
    }

    // WebGL1 降级方案需要更多信息
    // 这里暂时只输出警告
    console.warn(
      `[${this._label || 'WebGLRenderPipeline'}] WebGL1 不支持 UBO，` +
        `pushConstants 需要通过标量 uniform 实现。offset=${offset}, size=${data.byteLength}`
    );
  }

  // ==================== Push Constants UBO 方法结束 ====================

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

    // 清理 Push Constants UBO
    if (this.pushConstantBuffer && this.isWebGL2) {
      this.gl.deleteBuffer(this.pushConstantBuffer);
      this.pushConstantBuffer = null;
    }
    this.pushConstantData = null;
    this.pushConstantLayout = null;

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

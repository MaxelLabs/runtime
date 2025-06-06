/**
 * shader-program.ts
 * 着色器程序类
 * 管理顶点着色器和片段着色器的组合程序
 */

import type {
  IRHIDevice,
  IRHIRenderPipeline,
  IRHIBindGroup,
  IRHIShaderModule,
} from '../../../specification/src/common/rhi';
import type { Shader } from './shader';
import { type UniformDescriptor } from './shader';
import { ShaderData } from './shader-data';
import { EventDispatcher } from '../base/event-dispatcher';

/**
 * 着色器程序事件类型
 */
export enum ShaderProgramEventType {
  /** 程序创建完成 */
  PROGRAM_CREATED = 'program-created',
  /** 程序链接完成 */
  PROGRAM_LINKED = 'program-linked',
  /** 程序链接失败 */
  PROGRAM_LINK_ERROR = 'program-link-error',
  /** 程序绑定 */
  PROGRAM_BOUND = 'program-bound',
  /** 程序销毁 */
  PROGRAM_DESTROYED = 'program-destroyed',
}

/**
 * 渲染管线配置
 */
export interface RenderPipelineConfig {
  /** 顶点布局 */
  vertexLayout?: any;
  /** 渲染状态 */
  renderState?: any;
  /** 混合状态 */
  blendState?: any;
  /** 深度测试状态 */
  depthStencilState?: any;
  /** 光栅化状态 */
  rasterizationState?: any;
}

/**
 * 着色器程序配置选项
 */
export interface ShaderProgramOptions {
  /** 程序名称 */
  name: string;
  /** 顶点着色器 */
  vertexShader: Shader;
  /** 片段着色器 */
  fragmentShader: Shader;
  /** RHI设备 */
  device?: IRHIDevice;
  /** 渲染管线配置 */
  pipelineConfig?: RenderPipelineConfig;
  /** 是否立即创建管线 */
  createImmediately?: boolean;
}

/**
 * 着色器程序类
 * 管理顶点着色器和片段着色器的组合，创建渲染管线
 */
export class ShaderProgram {
  /** 程序名称 */
  public readonly name: string;

  /** 顶点着色器 */
  public readonly vertexShader: Shader;

  /** 片段着色器 */
  public readonly fragmentShader: Shader;

  /** 渲染管线配置 */
  public readonly pipelineConfig: RenderPipelineConfig;

  /** 是否已链接 */
  public linked: boolean = false;

  /** 链接错误信息 */
  public linkError?: string;

  /** 统一变量映射 */
  public uniforms: Map<string, UniformDescriptor> = new Map();

  /** RHI设备 */
  protected device?: IRHIDevice;

  /** RHI渲染管线 */
  protected rhiRenderPipeline?: IRHIRenderPipeline;

  /** 绑定组 */
  protected bindGroups: Map<number, IRHIBindGroup> = new Map();

  /** 着色器数据 */
  protected shaderData: ShaderData;

  /** 事件分发器 */
  protected eventDispatcher: EventDispatcher;

  /** 是否正在链接 */
  protected isLinking: boolean = false;

  /**
   * 构造函数
   * @param options 着色器程序配置选项
   */
  constructor(options: ShaderProgramOptions) {
    this.name = options.name;
    this.vertexShader = options.vertexShader;
    this.fragmentShader = options.fragmentShader;
    this.pipelineConfig = options.pipelineConfig || {};
    this.device = options.device;

    // 初始化着色器数据和事件系统
    this.shaderData = new ShaderData();
    this.eventDispatcher = new EventDispatcher();

    // 合并两个着色器的uniform信息
    this.mergeUniforms();

    // 如果需要立即创建且有设备，则创建渲染管线
    if (options.createImmediately && this.device) {
      this.createRenderPipeline();
    }
  }

  /**
   * 设置RHI设备
   * @param device RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;

    // 为着色器设置设备
    this.vertexShader.setDevice(device);
    this.fragmentShader.setDevice(device);

    // 如果着色器已编译且未创建管线，则创建管线
    if (this.vertexShader.compiled && this.fragmentShader.compiled && !this.rhiRenderPipeline) {
      this.createRenderPipeline();
    }
  }

  /**
   * 创建渲染管线
   */
  async createRenderPipeline(): Promise<void> {
    if (!this.device) {
      return;
    }

    if (this.isLinking) {
      return;
    }

    if (this.rhiRenderPipeline) {
      return;
    }

    try {
      this.isLinking = true;

      // 确保两个着色器都已编译
      if (!this.vertexShader.compiled) {
        await this.vertexShader.compile();
      }
      if (!this.fragmentShader.compiled) {
        await this.fragmentShader.compile();
      }

      // 获取RHI着色器模块
      const vertexModule = this.vertexShader.getRHIVertexShader();
      const fragmentModule = this.fragmentShader.getRHIFragmentShader();

      if (!vertexModule || !fragmentModule) {
        throw new Error('着色器编译失败，无法获取RHI着色器模块');
      }

      // 创建渲染管线描述符
      const pipelineDescriptor = this.createPipelineDescriptor(vertexModule, fragmentModule);

      // 创建RHI渲染管线
      this.rhiRenderPipeline = this.device.createRenderPipeline(pipelineDescriptor);

      // 为着色器设置管线引用
      this.vertexShader.setRHIRenderPipeline(this.rhiRenderPipeline);
      this.fragmentShader.setRHIRenderPipeline(this.rhiRenderPipeline);

      this.linked = true;
      this.linkError = undefined;

      // 分发链接完成事件
      this.eventDispatcher.emit(ShaderProgramEventType.PROGRAM_LINKED, {
        program: this,
        renderPipeline: this.rhiRenderPipeline,
      });
    } catch (error) {
      this.linkError = error instanceof Error ? error.message : String(error);
      this.linked = false;

      // 分发链接错误事件
      this.eventDispatcher.emit(ShaderProgramEventType.PROGRAM_LINK_ERROR, {
        program: this,
        error: this.linkError,
      });
    } finally {
      this.isLinking = false;
    }
  }

  /**
   * 绑定程序
   */
  bind(): void {
    if (!this.rhiRenderPipeline) {
      return;
    }

    // 在渲染通道中绑定管线
    // 这通常在渲染器中处理，这里只是标记程序已绑定
    this.eventDispatcher.emit(ShaderProgramEventType.PROGRAM_BOUND, { program: this });
  }

  /**
   * 设置uniform值
   * @param name uniform名称
   * @param value uniform值
   */
  setUniform(name: string, value: any): void {
    this.shaderData.setData(name, value);

    // 通知着色器数据更新
    this.vertexShader.setUniform(name, value);
    this.fragmentShader.setUniform(name, value);
  }

  /**
   * 获取uniform值
   * @param name uniform名称
   */
  getUniform(name: string): any {
    return this.shaderData.getData(name);
  }

  /**
   * 获取着色器数据
   */
  getShaderData(): ShaderData {
    return this.shaderData;
  }

  /**
   * 获取RHI渲染管线
   */
  getRHIRenderPipeline(): IRHIRenderPipeline | undefined {
    return this.rhiRenderPipeline;
  }

  /**
   * 获取绑定组
   * @param index 绑定组索引
   */
  getBindGroup(index: number): IRHIBindGroup | undefined {
    return this.bindGroups.get(index);
  }

  /**
   * 设置绑定组
   * @param index 绑定组索引
   * @param bindGroup 绑定组
   */
  setBindGroup(index: number, bindGroup: IRHIBindGroup): void {
    this.bindGroups.set(index, bindGroup);
  }

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   */
  addEventListener(type: string, callback: (event: any) => void): void {
    this.eventDispatcher.on(type, {
      callback,
      priority: 0,
      once: false,
    });
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param callback 回调函数
   */
  removeEventListener(type: string, callback: (event: any) => void): void {
    this.eventDispatcher.off(type, {
      callback,
      priority: 0,
      once: false,
    });
  }

  /**
   * 销毁程序
   */
  destroy(): void {
    // 销毁绑定组
    for (const bindGroup of this.bindGroups.values()) {
      bindGroup.destroy();
    }
    this.bindGroups.clear();

    // 清理RHI渲染管线
    if (this.rhiRenderPipeline) {
      this.rhiRenderPipeline.destroy();
      this.rhiRenderPipeline = undefined;
    }

    // 清理着色器数据
    this.shaderData.clear();

    // 分发销毁事件
    this.eventDispatcher.emit(ShaderProgramEventType.PROGRAM_DESTROYED, { program: this });

    // 清理事件监听器
    this.eventDispatcher.destroy();

    this.linked = false;
    this.linkError = undefined;
  }

  /**
   * 克隆程序
   */
  clone(): ShaderProgram {
    const clonedOptions: ShaderProgramOptions = {
      name: `${this.name}_clone`,
      vertexShader: this.vertexShader.clone(),
      fragmentShader: this.fragmentShader.clone(),
      device: this.device,
      pipelineConfig: { ...this.pipelineConfig },
      createImmediately: false,
    };

    return new ShaderProgram(clonedOptions);
  }

  /**
   * 合并两个着色器的uniform信息
   */
  protected mergeUniforms(): void {
    // 合并顶点着色器的uniforms
    for (const [name, uniform] of this.vertexShader.uniforms) {
      this.uniforms.set(name, uniform);
    }

    // 合并片段着色器的uniforms
    for (const [name, uniform] of this.fragmentShader.uniforms) {
      if (this.uniforms.has(name)) {
        // 如果有重复的uniform，验证类型是否一致
        const existingUniform = this.uniforms.get(name)!;
        if (existingUniform.type !== uniform.type) {
          // 类型冲突警告
        }
      } else {
        this.uniforms.set(name, uniform);
      }
    }
  }

  /**
   * 创建渲染管线描述符
   */
  protected createPipelineDescriptor(vertexModule: IRHIShaderModule, fragmentModule: IRHIShaderModule): any {
    return {
      label: `ShaderProgram-${this.name}`,
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
        buffers: this.pipelineConfig.vertexLayout || [],
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [
          {
            format: 'bgra8unorm',
            blend: this.pipelineConfig.blendState || {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: this.pipelineConfig.rasterizationState || {
        topology: 'triangle-list',
        cullMode: 'back',
        frontFace: 'ccw',
      },
      depthStencil: this.pipelineConfig.depthStencilState || {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    };
  }
}

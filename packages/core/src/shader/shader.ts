/**
 * shader.ts
 * 着色器基类
 * 提供着色器的编译、管理和uniform数据绑定功能
 */

import type { IRHIDevice, IRHIShaderModule, IRHIRenderPipeline } from '../interface/rhi';
import { ShaderData } from './shader-data';
import { EventDispatcher } from '../base/event-dispatcher';

/**
 * 着色器类型枚举
 */
export enum ShaderType {
  /** 顶点着色器 */
  VERTEX = 'vertex',
  /** 片段着色器 */
  FRAGMENT = 'fragment',
  /** 计算着色器 */
  COMPUTE = 'compute',
  /** 几何着色器 */
  GEOMETRY = 'geometry',
  /** 曲面细分控制着色器 */
  TESSELLATION_CONTROL = 'tessellation-control',
  /** 曲面细分评估着色器 */
  TESSELLATION_EVALUATION = 'tessellation-evaluation',
}

/**
 * 着色器语言枚举
 */
export enum ShaderLanguage {
  /** GLSL */
  GLSL = 'glsl',
  /** HLSL */
  HLSL = 'hlsl',
  /** WGSL */
  WGSL = 'wgsl',
  /** SPIR-V */
  SPIRV = 'spirv',
}

/**
 * 着色器事件类型
 */
export enum ShaderEventType {
  /** 着色器编译开始 */
  COMPILE_START = 'compile-start',
  /** 着色器编译完成 */
  COMPILE_SUCCESS = 'compile-success',
  /** 着色器编译失败 */
  COMPILE_ERROR = 'compile-error',
  /** 着色器销毁 */
  DESTROYED = 'destroyed',
  /** Uniform数据更新 */
  UNIFORM_UPDATED = 'uniform-updated',
}

/**
 * 着色器源码
 */
export interface ShaderSource {
  /** 着色器类型 */
  type: ShaderType;
  /** 着色器语言 */
  language: ShaderLanguage;
  /** 源码内容 */
  code: string;
  /** 入口点函数名 */
  entryPoint?: string;
  /** 编译选项 */
  compileOptions?: Record<string, any>;
}

/**
 * Uniform变量描述
 */
export interface UniformDescriptor {
  /** 变量名 */
  name: string;
  /** 变量类型 */
  type: string;
  /** 绑定位置 */
  binding?: number;
  /** 数组大小 */
  arraySize?: number;
  /** 默认值 */
  defaultValue?: any;
  /** 是否为纹理 */
  isTexture?: boolean;
  /** 是否为采样器 */
  isSampler?: boolean;
}

/**
 * 着色器配置选项
 */
export interface ShaderOptions {
  /** 着色器名称 */
  name: string;
  /** 顶点着色器源码 */
  vertexSource?: ShaderSource;
  /** 片段着色器源码 */
  fragmentSource?: ShaderSource;
  /** 计算着色器源码 */
  computeSource?: ShaderSource;
  /** Uniform描述符 */
  uniforms?: UniformDescriptor[];
  /** RHI设备 */
  device?: IRHIDevice;
  /** 是否立即编译 */
  compileImmediately?: boolean;
}

/**
 * 着色器基类
 * 提供着色器的编译、管理和uniform数据绑定功能
 */
export class Shader {
  /** 着色器名称 */
  public readonly name: string;

  /** 顶点着色器源码 */
  public vertexSource?: ShaderSource;

  /** 片段着色器源码 */
  public fragmentSource?: ShaderSource;

  /** 计算着色器源码 */
  public computeSource?: ShaderSource;

  /** Uniform描述符 */
  public uniforms: Map<string, UniformDescriptor> = new Map();

  /** 是否已编译 */
  public compiled: boolean = false;

  /** 编译错误信息 */
  public compileError?: string;

  /** RHI设备 */
  protected device?: IRHIDevice;

  /** RHI着色器模块 */
  protected rhiVertexShader?: IRHIShaderModule;
  protected rhiFragmentShader?: IRHIShaderModule;
  protected rhiComputeShader?: IRHIShaderModule;

  /** RHI渲染管线 */
  protected rhiRenderPipeline?: IRHIRenderPipeline;

  /** 着色器数据 */
  protected shaderData: ShaderData;

  /** 事件分发器 */
  protected eventDispatcher: EventDispatcher;

  /** 是否正在编译 */
  protected isCompiling: boolean = false;

  /**
   * 构造函数
   * @param options 着色器配置选项
   */
  constructor(options: ShaderOptions) {
    this.name = options.name;
    this.vertexSource = options.vertexSource;
    this.fragmentSource = options.fragmentSource;
    this.computeSource = options.computeSource;
    this.device = options.device;

    // 初始化uniform描述符
    if (options.uniforms) {
      for (const uniform of options.uniforms) {
        this.uniforms.set(uniform.name, uniform);
      }
    }

    // 初始化着色器数据和事件系统
    this.shaderData = new ShaderData();
    this.eventDispatcher = new EventDispatcher();

    // 如果需要立即编译且有设备，则编译着色器
    if (options.compileImmediately && this.device) {
      this.compile();
    }
  }

  /**
   * 设置RHI设备
   * @param device RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;

    // 如果有源码且未编译，则编译着色器
    if ((this.vertexSource || this.fragmentSource || this.computeSource) && !this.compiled) {
      this.compile();
    }
  }

  /**
   * 设置顶点着色器源码
   * @param source 着色器源码
   */
  setVertexSource(source: ShaderSource): void {
    this.vertexSource = source;
    this.compiled = false;
    this.compileError = undefined;
  }

  /**
   * 设置片段着色器源码
   * @param source 着色器源码
   */
  setFragmentSource(source: ShaderSource): void {
    this.fragmentSource = source;
    this.compiled = false;
    this.compileError = undefined;
  }

  /**
   * 设置计算着色器源码
   * @param source 着色器源码
   */
  setComputeSource(source: ShaderSource): void {
    this.computeSource = source;
    this.compiled = false;
    this.compileError = undefined;
  }

  /**
   * 添加Uniform描述符
   * @param uniform Uniform描述符
   */
  addUniform(uniform: UniformDescriptor): void {
    this.uniforms.set(uniform.name, uniform);

    // 如果有默认值，设置到着色器数据中
    if (uniform.defaultValue !== undefined) {
      this.shaderData.setData(uniform.name, uniform.defaultValue);
    }
  }

  /**
   * 移除Uniform描述符
   * @param name Uniform名称
   */
  removeUniform(name: string): void {
    this.uniforms.delete(name);
    this.shaderData.removeData(name);
  }

  /**
   * 设置Uniform数据
   * @param name Uniform名称
   * @param value 数据值
   */
  setUniform(name: string, value: any): void {
    this.shaderData.setData(name, value);

    // 分发uniform更新事件
    this.eventDispatcher.emit(ShaderEventType.UNIFORM_UPDATED, {
      shader: this,
      uniformName: name,
      value,
    });
  }

  /**
   * 获取Uniform数据
   * @param name Uniform名称
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
   * 编译着色器
   */
  async compile(): Promise<void> {
    if (!this.device) {
      throw new Error('Shader: 无法编译着色器，RHI设备未设置');
    }

    if (this.isCompiling) {
      console.warn('Shader: 着色器正在编译中，忽略重复编译请求');
      return;
    }

    this.isCompiling = true;
    this.compiled = false;
    this.compileError = undefined;

    // 分发编译开始事件
    this.eventDispatcher.emit(ShaderEventType.COMPILE_START, { shader: this });

    try {
      // 编译顶点着色器
      if (this.vertexSource) {
        this.rhiVertexShader = this.device.createShaderModule({
          code: this.vertexSource.code,
          language: this.mapShaderLanguage(this.vertexSource.language),
          stage: 'vertex',
          label: `${this.name}_vertex`,
        });
      }

      // 编译片段着色器
      if (this.fragmentSource) {
        this.rhiFragmentShader = this.device.createShaderModule({
          code: this.fragmentSource.code,
          language: this.mapShaderLanguage(this.fragmentSource.language),
          stage: 'fragment',
          label: `${this.name}_fragment`,
        });
      }

      // 编译计算着色器
      if (this.computeSource) {
        this.rhiComputeShader = this.device.createShaderModule({
          code: this.computeSource.code,
          language: this.mapShaderLanguage(this.computeSource.language),
          stage: 'compute',
          label: `${this.name}_compute`,
        });
      }

      this.compiled = true;
      this.isCompiling = false;

      // 分发编译成功事件
      this.eventDispatcher.emit(ShaderEventType.COMPILE_SUCCESS, { shader: this });
    } catch (error) {
      this.isCompiling = false;
      this.compileError = error instanceof Error ? error.message : String(error);

      console.error('Shader: 编译失败', error);

      // 分发编译错误事件
      this.eventDispatcher.emit(ShaderEventType.COMPILE_ERROR, {
        shader: this,
        error: this.compileError,
      });

      throw error;
    }
  }

  /**
   * 获取RHI顶点着色器
   */
  getRHIVertexShader(): IRHIShaderModule | undefined {
    return this.rhiVertexShader;
  }

  /**
   * 获取RHI片段着色器
   */
  getRHIFragmentShader(): IRHIShaderModule | undefined {
    return this.rhiFragmentShader;
  }

  /**
   * 获取RHI计算着色器
   */
  getRHIComputeShader(): IRHIShaderModule | undefined {
    return this.rhiComputeShader;
  }

  /**
   * 获取RHI渲染管线
   */
  getRHIRenderPipeline(): IRHIRenderPipeline | undefined {
    return this.rhiRenderPipeline;
  }

  /**
   * 设置RHI渲染管线
   * @param pipeline 渲染管线
   */
  setRHIRenderPipeline(pipeline: IRHIRenderPipeline): void {
    this.rhiRenderPipeline = pipeline;
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
   * 销毁着色器
   */
  destroy(): void {
    // 销毁RHI着色器模块
    if (this.rhiVertexShader) {
      this.rhiVertexShader.destroy();
      this.rhiVertexShader = undefined;
    }

    if (this.rhiFragmentShader) {
      this.rhiFragmentShader.destroy();
      this.rhiFragmentShader = undefined;
    }

    if (this.rhiComputeShader) {
      this.rhiComputeShader.destroy();
      this.rhiComputeShader = undefined;
    }

    // 清理数据
    this.shaderData.clear();
    this.uniforms.clear();
    this.compiled = false;
    this.compileError = undefined;
    this.isCompiling = false;

    // 分发销毁事件
    this.eventDispatcher.emit(ShaderEventType.DESTROYED, { shader: this });

    // 清理事件监听器
    this.eventDispatcher.destroy();
  }

  /**
   * 映射着色器语言到RHI支持的语言
   * @param language 着色器语言
   */
  private mapShaderLanguage(language: ShaderLanguage): 'glsl' | 'wgsl' | 'spirv' {
    switch (language) {
      case ShaderLanguage.GLSL:
        return 'glsl';
      case ShaderLanguage.WGSL:
        return 'wgsl';
      case ShaderLanguage.SPIRV:
        return 'spirv';
      case ShaderLanguage.HLSL:
        // HLSL需要转换为SPIRV或其他支持的格式
        console.warn('Shader: HLSL不直接支持，将使用GLSL作为后备');
        return 'glsl';
      default:
        console.warn('Shader: 不支持的着色器语言，将使用GLSL作为默认');
        return 'glsl';
    }
  }

  /**
   * 克隆着色器
   */
  clone(): Shader {
    const options: ShaderOptions = {
      name: `${this.name}_clone`,
      vertexSource: this.vertexSource ? { ...this.vertexSource } : undefined,
      fragmentSource: this.fragmentSource ? { ...this.fragmentSource } : undefined,
      computeSource: this.computeSource ? { ...this.computeSource } : undefined,
      uniforms: Array.from(this.uniforms.values()),
      device: this.device,
      compileImmediately: false,
    };

    const clonedShader = new Shader(options);

    // 复制着色器数据
    const allData = this.shaderData.getAllData();
    for (const [name, value] of allData) {
      clonedShader.setUniform(name, value);
    }

    return clonedShader;
  }
}

import type { IPipelineContext } from '@maxellabs/core';
import type { Vector2, Vector3, Color } from '@maxellabs/math';
import { GLShader } from './GLShader';

/**
 * WebGL渲染管线上下文封装类
 * 
 * 这个类负责封装GLShader操作，提供简化的统一变量设置接口，方便应用程序与着色器交互。
 * 作为渲染管线的核心部分，管理着色器程序和状态，简化统一变量的设置过程。
 * 
 * @implements {IPipelineContext} 管线上下文接口
 */
export class GLPipelineContext implements IPipelineContext {
  /** WebGL渲染上下文 */
  private gl: WebGLRenderingContext;
  
  /** 管理的着色器对象 */
  private shader: GLShader;
  
  /** 上下文是否可用状态 */
  isReady: boolean;

  /**
   * 创建WebGL渲染管线上下文
   * 
   * @param gl - WebGL渲染上下文
   * @param shader - 此上下文管理的着色器程序
   */
  constructor(gl: WebGLRenderingContext, shader: GLShader) {
    this.gl = gl;
    this.shader = shader;
    this.isReady = true;
  }

  /**
   * 释放管线上下文资源
   * 
   * 销毁相关联的着色器程序并标记上下文为不可用状态。
   */
  dispose(): void {
    if (this.shader) {
      this.shader.dispose();
    }
    this.isReady = false;
  }

  /**
   * 设置浮点型统一变量
   * 
   * @param uniformName - 统一变量名称
   * @param value - 浮点数值
   */
  setFloat(uniformName: string, value: number): void {
    this.shader.setUniform1f(uniformName, value);
  }

  /**
   * 设置整型统一变量
   * 
   * @param uniformName - 统一变量名称
   * @param value - 整数值
   */
  setInt(uniformName: string, value: number): void {
    this.shader.setUniform1i(uniformName, value);
  }

  /**
   * 设置二维向量统一变量
   * 
   * @param uniformName - 统一变量名称
   * @param value - Vector2类型的二维向量
   */
  setVec2(uniformName: string, value: Vector2): void {
    this.shader.setUniform2f(uniformName, value.x, value.y);
  }

  /**
   * 设置三维向量统一变量
   * 
   * @param uniformName - 统一变量名称
   * @param value - Vector3类型的三维向量
   */
  setVec3(uniformName: string, value: Vector3): void {
    this.shader.setUniform3f(uniformName, value.x, value.y, value.z);
  }

  /**
   * 设置四维向量/颜色统一变量
   * 
   * @param uniformName - 统一变量名称
   * @param value - Color类型的RGBA颜色值
   */
  setVec4(uniformName: string, value: Color): void {
    this.shader.setUniform4f(uniformName, value.r, value.g, value.b, value.a);
  }
}
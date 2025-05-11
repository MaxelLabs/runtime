import type { IRHIShaderModule, RHIShaderModuleDescriptor } from '@maxellabs/core';
import { RHIShaderStage } from '@maxellabs/core';

/**
 * WebGL着色器实现
 */
export class WebGLShader implements IRHIShaderModule {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private glShader: WebGLShader | null;
  private glProgram: WebGLProgram | null = null;
  private code: string;
  private language: 'glsl' | 'wgsl' | 'spirv';
  private stage: RHIShaderStage;
  private label?: string;
  private reflection: {
    bindings: Array<{
      name: string,
      binding: number,
      group: number,
      type: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture',
      arraySize?: number,
    }>,
    entryPoints: Array<{
      name: string,
      stage: 'vertex' | 'fragment' | 'compute',
      workgroupSize?: [number, number, number],
    }>,
  };
  private isDestroyed = false;

  /**
   * 创建WebGL着色器
   *
   * @param gl WebGL上下文
   * @param descriptor 着色器描述符
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: RHIShaderModuleDescriptor) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.code = descriptor.code;
    this.language = descriptor.language;
    this.stage = this.getShaderStage(descriptor.stage);
    this.label = descriptor.label;

    // 验证着色器语言
    if (this.language !== 'glsl') {
      throw new Error(`WebGL着色器仅支持GLSL语言，不支持${this.language}`);
    }

    // 编译着色器
    this.glShader = this.compileShader();

    // 进行反射分析
    this.reflection = this.reflectShader();
  }

  /**
   * 从描述符的阶段获取RHI着色器阶段
   */
  private getShaderStage (stage: 'vertex' | 'fragment' | 'compute'): RHIShaderStage {
    switch (stage) {
      case 'vertex': return RHIShaderStage.VERTEX;
      case 'fragment': return RHIShaderStage.FRAGMENT;
      case 'compute': return RHIShaderStage.COMPUTE;
      default:
        throw new Error(`不支持的着色器阶段: ${stage}`);
    }
  }

  /**
   * 编译着色器
   */
  private compileShader (): WebGLShader | null {
    const gl = this.gl;
    const glStage = this.stage === RHIShaderStage.VERTEX ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

    // 创建着色器对象
    const shader = gl.createShader(glStage);

    if (!shader) {
      throw new Error('创建WebGL着色器对象失败');
    }

    // 预处理着色器代码 - 添加版本信息
    let processedCode = this.code;

    // WebGL2需要使用GLSL ES 3.00语法，指定版本为300 es
    // WebGL1需要使用GLSL ES 1.00语法，不需要显式指定版本
    if (this.isWebGL2) {
      if (!processedCode.includes('#version 300 es')) {
        if (processedCode.includes('#version')) {
          console.warn('着色器代码包含非WebGL2兼容的版本声明，可能导致编译错误');
        } else {
          // 添加版本声明到代码开头
          processedCode = '#version 300 es\n' + processedCode;
        }
      }
    } else {
      // WebGL1 - 如果包含WebGL2特有的版本声明，会导致编译错误
      if (processedCode.includes('#version 300 es')) {
        console.warn('WebGL1环境不支持GLSL ES 3.00语法，正在移除版本声明');
        processedCode = processedCode.replace(/#version\s+300\s+es/, '');
      }
    }

    // 添加调试信息
    console.log(`编译${this.stage === RHIShaderStage.VERTEX ? '顶点' : '片段'}着色器:`, this.label || 'unnamed');

    // 编译着色器
    gl.shaderSource(shader, processedCode);
    gl.compileShader(shader);

    // 检查编译状态
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const infoLog = gl.getShaderInfoLog(shader);

      // 输出详细的错误信息和源码
      console.error('着色器编译失败:');
      console.error(infoLog);
      console.error('源码:');

      // 添加行号并显示源码
      const lines = processedCode.split('\n');

      lines.forEach((line, index) => {
        console.error(`${index + 1}: ${line}`);
      });

      gl.deleteShader(shader);
      throw new Error(`着色器编译失败: ${infoLog}`);
    } else {
      console.log('着色器编译成功');
    }

    return shader;
  }

  /**
   * 通过解析GLSL代码进行反射分析
   * 提取uniform和变量信息
   */
  private reflectShader (): {
    bindings: Array<{
      name: string,
      binding: number,
      group: number,
      type: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture',
      arraySize?: number,
    }>,
    entryPoints: Array<{
      name: string,
      stage: 'vertex' | 'fragment' | 'compute',
      workgroupSize?: [number, number, number],
    }>,
  } {
    const bindings: Array<{
      name: string,
      binding: number,
      group: number,
      type: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture',
      arraySize?: number,
    }> = [];

    // 提取uniform声明
    const uniformRegex = /uniform\s+(\w+)(?:\s+(\w+))?\s+(\w+)(?:\[(\d+)\])?/g;
    let match: RegExpExecArray | null;

    while ((match = uniformRegex.exec(this.code)) !== null) {
      const type = match[1];
      const varName = match[3];
      const arraySize = match[4] ? parseInt(match[4], 10) : undefined;

      // 确定绑定类型
      let bindingType: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture' = 'uniform-buffer';

      if (type === 'sampler2D' || type === 'samplerCube' || type === 'sampler3D') {
        bindingType = 'sampler';
      } else if (type === 'texture2D' || type === 'textureCube' || type === 'texture3D') {
        bindingType = 'texture';
      }

      bindings.push({
        name: varName,
        binding: 0, // WebGL没有显式绑定点概念，默认为0
        group: 0, // WebGL没有绑定组概念，默认为0
        type: bindingType,
        arraySize,
      });
    }

    // 提取入口点 - 在GLSL中通常不显式定义，使用main函数
    const stage = this.stage === RHIShaderStage.VERTEX ? 'vertex' :
      (this.stage === RHIShaderStage.FRAGMENT ? 'fragment' : 'compute');

    return {
      bindings,
      entryPoints: [{
        name: 'main',
        stage,
      }],
    };
  }

  /**
   * 创建临时程序对象以获取更详细的着色器变量信息
   * 用于提取更详细的uniform信息
   */
  createTemporaryProgramForReflection (): WebGLProgram | null {
    // 只有在需要查询uniform信息时才创建程序
    if (this.glProgram) {
      return this.glProgram;
    }

    const gl = this.gl;

    // 需要一个完整的程序才能查询uniform信息
    // 为另一阶段创建一个空着色器
    const otherStage = this.stage === RHIShaderStage.VERTEX ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER;
    const emptyShader = gl.createShader(otherStage);

    if (!emptyShader) {
      return null;
    }

    // 提供一个最小的着色器代码
    const emptyCode = this.stage === RHIShaderStage.VERTEX
      ? 'void main() { gl_FragColor = vec4(1.0); }'
      : 'void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }';

    gl.shaderSource(emptyShader, emptyCode);
    gl.compileShader(emptyShader);

    // 创建程序
    const program = gl.createProgram();

    if (!program) {
      gl.deleteShader(emptyShader);

      return null;
    }

    // 附加着色器
    gl.attachShader(program, this.glShader);
    gl.attachShader(program, emptyShader);

    // 链接程序
    gl.linkProgram(program);

    // 检查链接状态
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(emptyShader);

      return null;
    }

    // 清理
    gl.detachShader(program, emptyShader);
    gl.deleteShader(emptyShader);

    this.glProgram = program;

    return program;
  }

  /**
   * 获取WebGL着色器对象
   */
  getGLShader (): WebGLShader | null {
    return this.glShader;
  }

  /**
   * 获取着色器代码
   */
  getCode (): string {
    return this.code;
  }

  /**
   * 获取着色器语言
   */
  getLanguage (): 'glsl' | 'wgsl' | 'spirv' {
    return this.language;
  }

  /**
   * 获取着色器阶段
   */
  getStage (): RHIShaderStage {
    return this.stage;
  }

  /**
   * 获取着色器标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 获取反射信息
   */
  getReflection (): {
    bindings: Array<{
      name: string,
      binding: number,
      group: number,
      type: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture',
      arraySize?: number,
    }>,
    entryPoints: Array<{
      name: string,
      stage: 'vertex' | 'fragment' | 'compute',
      workgroupSize?: [number, number, number],
    }>,
  } {
    return this.reflection;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.glShader) {
      this.gl.deleteShader(this.glShader);
      this.glShader = null;
    }

    if (this.glProgram) {
      this.gl.deleteProgram(this.glProgram);
      this.glProgram = null;
    }

    this.isDestroyed = true;
  }
}
import { MSpec } from '@maxellabs/core';

/**
 * WebGL着色器实现
 *
 * 封装WebGL着色器功能，处理编译、反射分析和资源管理
 * 支持WebGL1和WebGL2上下文，自动处理相应的GLSL版本差异
 */
export class GLShader implements MSpec.IRHIShaderModule {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private glShader: WebGLShader | null;
  private glProgram: WebGLProgram | null = null;
  code: string;
  language: 'glsl' | 'wgsl' | 'spirv';
  stage: MSpec.RHIShaderStage;
  label?: string;
  reflection: {
    bindings: Array<{
      name: string;
      binding: number;
      group: number;
      type: MSpec.RHIBindGroupLayoutEntryType;
      arraySize?: number;
    }>;
    entryPoints: Array<{
      name: string;
      stage: MSpec.RHIShaderStage;
      workgroupSize?: MSpec.Vector3Like;
    }>;
    attributes?: Array<{
      name: string;
      location: number;
      type: MSpec.RHIVertexFormat;
    }>;
    varyings?: Array<{
      name: string;
      type: MSpec.RHIVertexFormat;
    }>;
  };
  private isDestroyed = false;

  /**
   * 创建WebGL着色器
   *
   * @param gl WebGL上下文
   * @param descriptor 着色器描述符
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, descriptor: MSpec.RHIShaderModuleDescriptor) {
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

    // 验证计算着色器支持
    if (this.stage === MSpec.RHIShaderStage.COMPUTE) {
      throw new Error('WebGL不支持计算着色器，请使用顶点或片元着色器');
    }

    // 编译着色器
    this.glShader = this.compileShader();

    // 进行反射分析
    this.reflection = this.reflectShader();
  }

  /**
   * 从描述符的阶段获取RHI着色器阶段
   */
  private getShaderStage(stage: MSpec.RHIShaderStage): MSpec.RHIShaderStage {
    switch (stage) {
      case MSpec.RHIShaderStage.VERTEX:
        return MSpec.RHIShaderStage.VERTEX;
      case MSpec.RHIShaderStage.FRAGMENT:
        return MSpec.RHIShaderStage.FRAGMENT;
      case MSpec.RHIShaderStage.COMPUTE:
        // 虽然我们在构造函数中对计算着色器进行了验证，
        // 但仍然返回正确的枚举值以保持API一致性
        return MSpec.RHIShaderStage.COMPUTE;
      default:
        throw new Error(`不支持的着色器阶段: ${stage}`);
    }
  }

  /**
   * 编译着色器
   */
  private compileShader(): WebGLShader | null {
    const gl = this.gl;
    const glStage = this.stage === MSpec.RHIShaderStage.VERTEX ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

    // 创建着色器对象
    const shader = gl.createShader(glStage);

    if (!shader) {
      throw new Error('创建WebGL着色器对象失败');
    }

    // 处理着色器代码，使其兼容当前WebGL版本
    const processedCode = this.preprocessShaderCode(this.code);

    // 编译着色器
    gl.shaderSource(shader, processedCode);
    gl.compileShader(shader);

    // 检查编译状态
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = this.formatShaderError(shader, processedCode);

      gl.deleteShader(shader);
      throw new Error(error);
    }

    return shader;
  }

  /**
   * 预处理着色器代码，处理版本声明和其他兼容性问题
   */
  private preprocessShaderCode(code: string): string {
    let processedCode = code;

    // 移除现有的版本声明
    const versionRegex = /#version\s+.*/;
    const hasVersionDeclaration = versionRegex.test(processedCode);

    if (hasVersionDeclaration) {
      processedCode = processedCode.replace(versionRegex, '');
    }

    // WebGL2需要使用GLSL ES 3.00语法，指定版本为300 es
    if (this.isWebGL2) {
      // 添加版本声明到代码开头
      processedCode = '#version 300 es\n\n' + this.adaptCodeForWebGL2(processedCode);
    } else {
      // WebGL1兼容性处理，确保不使用WebGL2的特性
      processedCode = this.adaptCodeForWebGL1(processedCode);
    }

    return processedCode;
  }

  /**
   * 将着色器代码适配为WebGL2兼容
   */
  private adaptCodeForWebGL2(code: string): string {
    // 在这里可以进行WebGL2特定的转换
    // 例如：可以将texture2D调用替换为texture等
    let adapted = code;

    if (this.stage === MSpec.RHIShaderStage.FRAGMENT) {
      // 添加输出变量声明（如果代码中没有）
      if (!adapted.includes('out vec4') && !adapted.includes('layout(location=0)')) {
        adapted = 'out vec4 fragColor;\n' + adapted;

        // 将gl_FragColor替换为fragColor
        adapted = adapted.replace(/gl_FragColor/g, 'fragColor');
      }
    }

    // 将旧的纹理采样函数替换为新版本
    adapted = adapted.replace(/texture2D\(/g, 'texture(');
    adapted = adapted.replace(/textureCube\(/g, 'texture(');

    return adapted;
  }

  /**
   * 将着色器代码适配为WebGL1兼容
   */
  private adaptCodeForWebGL1(code: string): string {
    // 在这里处理WebGL1特定的转换
    // 例如：移除WebGL2特有关键字等
    let adapted = code;

    // 将in/out替换为attribute/varying（针对顶点着色器）
    if (this.stage === MSpec.RHIShaderStage.VERTEX) {
      adapted = adapted.replace(/\bin\b/g, 'attribute');
      adapted = adapted.replace(/\bout\b/g, 'varying');
    }

    // 将in替换为varying（针对片元着色器）
    if (this.stage === MSpec.RHIShaderStage.FRAGMENT) {
      adapted = adapted.replace(/\bin\b/g, 'varying');
    }

    // 将texture替换为texture2D或textureCube
    adapted = adapted.replace(/texture\s*\(\s*(\w+)\s*,/g, (_match, samplerName) => {
      // 这里可以添加逻辑来检测sampler类型并选择合适的函数
      // 简单实现：默认使用texture2D
      return `texture2D(${samplerName},`;
    });

    return adapted;
  }

  /**
   * 格式化着色器编译错误信息
   */
  private formatShaderError(shader: WebGLShader, code: string): string {
    const gl = this.gl;
    const infoLog = gl.getShaderInfoLog(shader);
    const shaderType = this.stage === MSpec.RHIShaderStage.VERTEX ? 'Vertex' : 'Fragment';

    // 构建详细错误信息
    const errorMsg = `${shaderType}着色器编译失败:\n${infoLog}\n\n源码:\n`;

    // 添加行号并显示源码
    const lines = code.split('\n');
    const formattedCode = lines
      .map((line, index) => {
        const lineNum = `${index + 1}`.padStart(4, ' ');

        return `${lineNum}: ${line}`;
      })
      .join('\n');

    return errorMsg + formattedCode;
  }

  /**
   * 通过解析GLSL代码进行反射分析
   * 提取uniform、attribute、varying等变量信息
   */
  private reflectShader(): {
    bindings: Array<{
      name: string;
      binding: number;
      group: number;
      type: MSpec.RHIBindGroupLayoutEntryType;
      arraySize?: number;
    }>;
    entryPoints: Array<{
      name: string;
      stage: MSpec.RHIShaderStage;
      workgroupSize?: MSpec.Vector3Like;
    }>;
    attributes?: Array<{
      name: string;
      location: number;
      type: MSpec.RHIVertexFormat;
    }>;
    varyings?: Array<{
      name: string;
      type: MSpec.RHIVertexFormat;
    }>;
  } {
    const bindings: Array<{
      name: string;
      binding: number;
      group: number;
      type: MSpec.RHIBindGroupLayoutEntryType;
      arraySize?: number;
    }> = [];

    const attributes: Array<{
      name: string;
      location: number;
      type: MSpec.RHIVertexFormat;
    }> = [];

    const varyings: Array<{
      name: string;
      type: MSpec.RHIVertexFormat;
    }> = [];

    // 提取uniform声明
    this.extractUniforms(this.code, bindings);

    // 提取attribute/in变量（顶点着色器）
    if (this.stage === MSpec.RHIShaderStage.VERTEX) {
      this.extractAttributes(this.code, attributes);
    }

    // 提取varying/out/in变量
    this.extractVaryings(this.code, varyings);

    // 提取入口点 - 在GLSL中通常不显式定义，使用main函数
    const stage =
      this.stage === MSpec.RHIShaderStage.VERTEX
        ? MSpec.RHIShaderStage.VERTEX
        : this.stage === MSpec.RHIShaderStage.FRAGMENT
          ? MSpec.RHIShaderStage.FRAGMENT
          : MSpec.RHIShaderStage.COMPUTE;

    return {
      bindings,
      entryPoints: [
        {
          name: 'main',
          stage,
        },
      ],
      attributes: attributes.length > 0 ? attributes : undefined,
      varyings: varyings.length > 0 ? varyings : undefined,
    };
  }

  /**
   * 从着色器代码中提取uniform声明
   */
  private extractUniforms(code: string, bindings: Array<any>): void {
    // 移除注释以避免错误匹配
    const codeWithoutComments = this.removeComments(code);

    // 匹配标准uniform声明
    const uniformRegex = /uniform\s+(\w+)(?:\s+(\w+))?\s+(\w+)(?:\[(\d+)\])?/g;
    let match: RegExpExecArray | null;

    while ((match = uniformRegex.exec(codeWithoutComments)) !== null) {
      const type = match[1];
      const varName = match[3];
      const arraySize = match[4] ? parseInt(match[4], 10) : undefined;

      // 确定绑定类型
      let bindingType: MSpec.RHIBindGroupLayoutEntryType = MSpec.RHIBindGroupLayoutEntryType.UNIFORM_BUFFER;

      if (/sampler\w+/.test(type)) {
        bindingType = MSpec.RHIBindGroupLayoutEntryType.SAMPLER;
      } else if (/texture\w+/.test(type)) {
        bindingType = MSpec.RHIBindGroupLayoutEntryType.TEXTURE;
      }

      bindings.push({
        name: varName,
        binding: 0, // WebGL没有显式绑定点概念，默认为0
        group: 0, // WebGL没有绑定组概念，默认为0
        type: bindingType,
        arraySize,
      });
    }

    // 匹配WebGL2的layout限定符uniform声明
    if (this.isWebGL2) {
      const layoutUniformRegex =
        /layout\s*\(\s*(?:binding\s*=\s*(\d+))(?:\s*,\s*set\s*=\s*(\d+))?\s*\)\s*uniform\s+(\w+)(?:\s+(\w+))?\s+(\w+)(?:\[(\d+)\])?/g;

      while ((match = layoutUniformRegex.exec(codeWithoutComments)) !== null) {
        const binding = match[1] ? parseInt(match[1], 10) : 0;
        const group = match[2] ? parseInt(match[2], 10) : 0;
        const type = match[3];
        const varName = match[5];
        const arraySize = match[6] ? parseInt(match[6], 10) : undefined;

        // 确定绑定类型
        let bindingType: MSpec.RHIBindGroupLayoutEntryType = MSpec.RHIBindGroupLayoutEntryType.UNIFORM_BUFFER;

        if (/sampler\w+/.test(type)) {
          bindingType = MSpec.RHIBindGroupLayoutEntryType.SAMPLER;
        } else if (/texture\w+/.test(type) || /image\w+/.test(type)) {
          bindingType = MSpec.RHIBindGroupLayoutEntryType.TEXTURE;
        } else if (/buffer\b/.test(type)) {
          bindingType = MSpec.RHIBindGroupLayoutEntryType.UNIFORM_BUFFER;
        }

        bindings.push({
          name: varName,
          binding,
          group,
          type: bindingType,
          arraySize,
        });
      }
    }
  }

  /**
   * 从着色器代码中提取attribute/in变量（顶点着色器）
   */
  private extractAttributes(code: string, attributes: Array<any>): void {
    // 移除注释以避免错误匹配
    const codeWithoutComments = this.removeComments(code);

    // 对于WebGL1，提取attribute声明
    let attributeRegex = /attribute\s+(\w+)\s+(\w+)/g;
    let match: RegExpExecArray | null;
    let location = 0;

    while ((match = attributeRegex.exec(codeWithoutComments)) !== null) {
      const type = match[1];
      const name = match[2];

      attributes.push({
        name,
        location: location++,
        type,
      });
    }

    // 对于WebGL2，提取带有layout位置的in声明
    if (this.isWebGL2) {
      attributeRegex = /layout\s*\(\s*location\s*=\s*(\d+)\s*\)\s*in\s+(\w+)\s+(\w+)/g;

      while ((match = attributeRegex.exec(codeWithoutComments)) !== null) {
        const locationValue = parseInt(match[1], 10);
        const type = match[2];
        const name = match[3];

        attributes.push({
          name,
          location: locationValue,
          type,
        });
      }

      // 提取没有layout位置的in声明
      attributeRegex = /in\s+(\w+)\s+(\w+)/g;

      while ((match = attributeRegex.exec(codeWithoutComments)) !== null) {
        // 跳过已经通过layout声明的变量
        const name = match[2];

        if (!attributes.some((attr) => attr.name === name)) {
          const type = match[1];

          attributes.push({
            name,
            location: location++,
            type,
          });
        }
      }
    }
  }

  /**
   * 从着色器代码中提取varying/out/in变量
   */
  private extractVaryings(code: string, varyings: Array<any>): void {
    // 移除注释以避免错误匹配
    const codeWithoutComments = this.removeComments(code);

    // 确定要查找的变量类型
    let keyword = 'varying';

    if (this.isWebGL2) {
      keyword = this.stage === MSpec.RHIShaderStage.VERTEX ? 'out' : 'in';
    }

    // 匹配varying/out/in变量
    const varyingRegex = new RegExp(`${keyword}\\s+(\\w+)\\s+(\\w+)`, 'g');
    let match: RegExpExecArray | null;

    while ((match = varyingRegex.exec(codeWithoutComments)) !== null) {
      const type = match[1];
      const name = match[2];

      // 忽略片元着色器中的内置变量
      if (this.stage === MSpec.RHIShaderStage.FRAGMENT && this.isWebGL2 && name === 'fragColor') {
        continue;
      }

      varyings.push({
        name,
        type,
      });
    }
  }

  /**
   * 从代码中移除注释
   */
  private removeComments(code: string): string {
    // 移除单行注释
    let result = code.replace(/\/\/.*$/gm, '');

    // 移除多行注释
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    return result;
  }

  /**
   * 创建临时程序对象以获取更详细的着色器变量信息
   * 用于提取更详细的uniform信息
   */
  createTemporaryProgramForReflection(): WebGLProgram | null {
    // 如果程序已创建但需要更新，先删除旧程序
    if (this.glProgram && !this.isDestroyed) {
      this.gl.deleteProgram(this.glProgram);
      this.glProgram = null;
    }

    // 如果着色器已被销毁，则返回null
    if (this.isDestroyed || !this.glShader) {
      return null;
    }

    const gl = this.gl;

    // 需要一个完整的程序才能查询uniform信息
    // 为另一阶段创建一个空着色器
    const otherStage = this.stage === MSpec.RHIShaderStage.VERTEX ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER;
    const emptyShader = gl.createShader(otherStage);

    if (!emptyShader) {
      return null;
    }

    // 提供一个最小的着色器代码，区分WebGL1和WebGL2
    let emptyCode: string;

    if (this.isWebGL2) {
      emptyCode =
        this.stage === MSpec.RHIShaderStage.VERTEX
          ? '#version 300 es\nvoid main() { }\n'
          : '#version 300 es\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1.0); }\n';
    } else {
      emptyCode =
        this.stage === MSpec.RHIShaderStage.VERTEX
          ? 'void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }'
          : 'void main() { gl_FragColor = vec4(1.0); }';
    }

    gl.shaderSource(emptyShader, emptyCode);
    gl.compileShader(emptyShader);

    if (!gl.getShaderParameter(emptyShader, gl.COMPILE_STATUS)) {
      console.warn('临时程序的空着色器编译失败:', gl.getShaderInfoLog(emptyShader));
      gl.deleteShader(emptyShader);

      return null;
    }

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
      console.warn('临时程序链接失败:', gl.getProgramInfoLog(program));
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
  getGLShader(): WebGLShader | null {
    return this.glShader;
  }

  /**
   * 获取着色器代码
   */
  getCode(): string {
    return this.code;
  }

  /**
   * 获取着色器语言
   */
  getLanguage(): 'glsl' | 'wgsl' | 'spirv' {
    return this.language;
  }

  /**
   * 获取着色器阶段
   */
  getStage(): MSpec.RHIShaderStage {
    return this.stage;
  }

  /**
   * 获取着色器标签
   */
  getLabel(): string | undefined {
    return this.label;
  }

  /**
   * 获取反射信息
   */
  getReflection(): {
    bindings: Array<{
      name: string;
      binding: number;
      group: number;
      type: MSpec.RHIBindGroupLayoutEntryType;
      arraySize?: number;
    }>;
    entryPoints: Array<{
      name: string;
      stage: MSpec.RHIShaderStage;
      workgroupSize?: MSpec.Vector3Like;
    }>;
    attributes?: Array<{
      name: string;
      location: number;
      type: string;
    }>;
    varyings?: Array<{
      name: string;
      type: string;
    }>;
  } {
    return this.reflection;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      console.debug(`着色器已被销毁: ${this.label || '未命名'}`);

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
    console.debug(`着色器资源已释放: ${this.label || '未命名'}`);
  }
}

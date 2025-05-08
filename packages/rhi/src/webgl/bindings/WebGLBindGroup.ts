import type { IRHIBindGroup, IRHIBindGroupLayout } from '@maxellabs/core';
import { GLBuffer } from '../resources/WebGLBuffer';
import { WebGLTexture } from '../resources/WebGLTexture';
import { WebGLSampler } from '../resources/WebGLSampler';
import type { WebGLBindGroupLayout } from './WebGLBindGroupLayout';
import { WebGLTextureView } from '../resources';

/**
 * WebGL绑定组实现
 */
export class WebGLBindGroup implements IRHIBindGroup {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private isWebGL2: boolean;
  private layout: IRHIBindGroupLayout;
  private entries: any[];
  private resources: Map<number, any>; // 资源映射，以绑定点为键
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL绑定组
   *
   * @param gl WebGL上下文
   * @param layout 绑定组布局
   * @param entries 绑定资源条目
   * @param label 可选标签
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, layout: IRHIBindGroupLayout, entries: any[], label?: string) {
    this.gl = gl;
    this.isWebGL2 = gl instanceof WebGL2RenderingContext;
    this.layout = layout;
    this.entries = entries;
    this.label = label;
    this.resources = new Map();

    // 验证和处理绑定资源
    this.validateAndProcessEntries();
  }

  /**
   * 验证绑定资源条目与布局的兼容性，并处理为内部格式
   */
  private validateAndProcessEntries (): void {
    // 遍历所有条目
    for (const entry of this.entries) {
      // 验证绑定条目有效性
      if (entry.binding === undefined || entry.resource === undefined) {
        throw new Error('绑定条目必须包含binding和resource字段');
      }

      // 获取对应的布局条目
      const layoutEntry = (this.layout as WebGLBindGroupLayout).getBindingEntry(entry.binding);

      if (!layoutEntry) {
        throw new Error(`找不到绑定点 ${entry.binding} 的布局条目`);
      }

      // 验证资源类型与布局类型兼容
      this.validateResourceTypeCompatibility(entry.resource, layoutEntry.type);

      // 存储资源
      this.resources.set(entry.binding, entry.resource);
    }
  }

  /**
   * 验证资源与布局类型的兼容性
   */
  private validateResourceTypeCompatibility (resource: any, layoutType: string): void {
    // 检查资源类型与布局类型的兼容性
    if (layoutType === 'uniform-buffer' || layoutType === 'storage-buffer' || layoutType === 'readonly-storage-buffer') {
      if (!(resource instanceof GLBuffer)) {
        throw new Error(`绑定类型 ${layoutType} 需要缓冲区资源`);
      }
    } else if (layoutType === 'sampler') {
      if (!(resource instanceof WebGLSampler)) {
        throw new Error('采样器绑定需要采样器资源');
      }
    } else if (layoutType === 'texture' || layoutType === 'storage-texture') {
      // if (!(resource instanceof WebGLTexture)) {
      if (!(resource instanceof WebGLTextureView)) {
        throw new Error(`${layoutType} 绑定需要纹理资源`);
      }
    }
  }

  /**
   * 获取绑定组布局
   */
  getLayout (): IRHIBindGroupLayout {
    return this.layout;
  }

  /**
   * 获取绑定条目
   */
  getEntries (): any[] {
    return this.entries;
  }

  /**
   * 获取绑定组标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 获取特定绑定点的资源
   *
   * @param binding 绑定点
   * @returns 关联的资源或undefined
   */
  getResource (binding: number): any | undefined {
    return this.resources.get(binding);
  }

  /**
   * 应用所有绑定
   * 在WebGL渲染通道中使用
   *
   * @param program WebGL程序对象
   */
  applyBindings (program: WebGLProgram): void {
    const gl = this.gl;

    // 遍历所有资源
    for (const [binding, resource] of this.resources.entries()) {
      // 获取布局条目
      const layoutEntry = (this.layout as WebGLBindGroupLayout).getBindingEntry(binding);

      if (!layoutEntry) {continue;}

      // 根据资源类型执行不同的绑定操作
      if (resource instanceof GLBuffer) {
        this.bindBuffer(program, resource, layoutEntry);
      } else if (resource instanceof WebGLTexture) {
        this.bindTexture(program, resource, layoutEntry, binding);
      } else if (resource instanceof WebGLSampler) {
        // 采样器的绑定通常与纹理一起进行
        // 在WebGL2中直接绑定，在WebGL1中应用到纹理
        if (this.isWebGL2) {
          resource.bind(binding);
        }
      }
    }
  }

  /**
   * 绑定缓冲区资源
   */
  private bindBuffer (program: WebGLProgram, buffer: GLBuffer, layoutEntry: any): void {
    const gl = this.gl;

    if (layoutEntry.type === 'uniform-buffer' && this.isWebGL2) {
      // WebGL2支持uniform缓冲区
      const blockIndex = (gl as WebGL2RenderingContext).getUniformBlockIndex(program, layoutEntry.name);

      if (blockIndex !== (gl as WebGL2RenderingContext).INVALID_INDEX) {
        (gl as WebGL2RenderingContext).uniformBlockBinding(program, blockIndex, layoutEntry.binding);
        (gl as WebGL2RenderingContext).bindBufferBase(
          (gl as WebGL2RenderingContext).UNIFORM_BUFFER,
          layoutEntry.binding,
          buffer.getGLBuffer()
        );
      }
    } else {
      // WebGL1回退或storage-buffer - 需要在着色器程序中手动处理
      // 这里需要其他逻辑来处理uniform值的设置或手动进行缓冲区读写
    }
  }

  /**
   * 绑定纹理资源
   */
  private bindTexture (program: WebGLProgram, texture: WebGLTexture, layoutEntry: any, textureUnit: number): void {
    const gl = this.gl;

    // 激活纹理单元
    gl.activeTexture(gl.TEXTURE0 + textureUnit);

    // 绑定纹理
    gl.bindTexture(texture.getTarget(), texture.getGLTexture());

    // 设置uniform采样器值
    const location = gl.getUniformLocation(program, layoutEntry.name);

    if (location) {
      gl.uniform1i(location, textureUnit);
    }
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    // WebGL绑定组只是资源的引用，所以不需要直接销毁资源
    // 资源应由各自的所有者销毁

    this.resources.clear();
    this.isDestroyed = true;
  }
}
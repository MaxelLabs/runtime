import type { IRHIBindGroupLayout, IRHIPipelineLayout } from '@maxellabs/core';

/**
 * WebGL管线布局实现
 */
export class WebGLPipelineLayout implements IRHIPipelineLayout {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  bindGroupLayouts: IRHIBindGroupLayout[];
  label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL管线布局
   *
   * @param gl WebGL上下文
   * @param bindGroupLayouts 绑定组布局数组
   * @param label 可选标签
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, bindGroupLayouts: IRHIBindGroupLayout[], label?: string) {
    this.gl = gl;
    this.bindGroupLayouts = bindGroupLayouts;
    this.label = label;

    // 验证绑定组布局的兼容性
    this.validateLayouts();
  }

  /**
   * 验证绑定组布局的兼容性
   */
  private validateLayouts (): void {
    // 在WebGL中，需要验证绑定组布局的兼容性
    // 例如，检查绑定点是否重叠或冲突
    const isWebGL2 = this.gl instanceof WebGL2RenderingContext;
    const bindingSet = new Set<number>();

    for (const layout of this.bindGroupLayouts) {
      const entries = layout.getEntries();

      for (const entry of entries) {

        if (bindingSet.has(entry.binding)) {
          throw new Error(`绑定点 ${entry.binding} 在多个绑定组布局中出现，这在WebGL中不被支持`);
        }
        bindingSet.add(entry.binding);

        // 检查特定类型是否受支持
        if (entry.type === 'storage-buffer' && !isWebGL2) {
          throw new Error('WebGL1不支持存储缓冲区');
        }
        if (entry.type === 'storage-texture') {
          throw new Error('WebGL不支持存储纹理');
        }
      }
    }
  }

  /**
   * 获取绑定组布局
   */
  getBindGroupLayouts (): IRHIBindGroupLayout[] {
    return this.bindGroupLayouts;
  }

  /**
   * 获取管线布局标签
   */
  getLabel (): string | undefined {
    return this.label;
  }

  /**
   * 获取特定绑定组布局
   *
   * @param index 绑定组索引
   */
  getBindGroupLayout (index: number): IRHIBindGroupLayout | undefined {
    return this.bindGroupLayouts[index];
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }

    // WebGL管线布局是概念性的，没有需要释放的原生资源
    this.isDestroyed = true;
  }
}
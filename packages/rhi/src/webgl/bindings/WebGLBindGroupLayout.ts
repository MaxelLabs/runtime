import { IRHIBindGroupLayout } from '@maxellabs/core';

/**
 * WebGL绑定组布局实现
 */
export class WebGLBindGroupLayout implements IRHIBindGroupLayout {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private entries: any[]; // 绑定组布局条目数组
  private label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL绑定组布局
   * 
   * @param gl WebGL上下文
   * @param entries 绑定条目数组
   * @param label 可选标签
   */
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, entries: any[], label?: string) {
    this.gl = gl;
    this.entries = entries;
    this.label = label;
    
    // 在WebGL中，bindGroupLayout是一个逻辑概念，不需要直接创建WebGL对象
    // 但我们仍然要验证entries结构的合法性
    this.validateEntries();
  }

  /**
   * 验证绑定组布局条目
   */
  private validateEntries(): void {
    // 验证每个绑定条目的结构和类型
    for (const entry of this.entries) {
      // 确保条目有binding和type
      if (entry.binding === undefined || entry.type === undefined) {
        throw new Error('绑定组布局条目必须包含binding和type字段');
      }
      
      // 确保binding是非负整数
      if (typeof entry.binding !== 'number' || entry.binding < 0 || !Number.isInteger(entry.binding)) {
        throw new Error(`无效的binding值: ${entry.binding}, 必须是非负整数`);
      }
      
      // 检查类型是否支持
      const supportedTypes = [
        'uniform-buffer',
        'storage-buffer',
        'readonly-storage-buffer',
        'sampler',
        'texture',
        'storage-texture'
      ];
      
      if (!supportedTypes.includes(entry.type)) {
        throw new Error(`不支持的绑定类型: ${entry.type}, 必须是: ${supportedTypes.join(', ')}`);
      }
    }
    
    // 检查绑定点是否唯一
    const bindingSet = new Set();
    for (const entry of this.entries) {
      if (bindingSet.has(entry.binding)) {
        throw new Error(`绑定点 ${entry.binding} 已存在，绑定点必须唯一`);
      }
      bindingSet.add(entry.binding);
    }
  }

  /**
   * 获取绑定组布局条目
   */
  getEntries(): any[] {
    return this.entries;
  }

  /**
   * 获取绑定组布局标签
   */
  getLabel(): string | undefined {
    return this.label;
  }

  /**
   * 获取绑定条目
   * 
   * @param binding 绑定点
   * @returns 绑定条目或undefined
   */
  getBindingEntry(binding: number): any | undefined {
    return this.entries.find(entry => entry.binding === binding);
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    // WebGL的绑定组布局是概念性的，没有需要释放的原生资源
    this.isDestroyed = true;
  }
} 
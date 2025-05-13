import type { IRHIBindGroupLayout, IRHIBindGroupLayoutEntry } from '@maxellabs/core';

/**
 * WebGL绑定组布局实现
 */

// Define a more detailed internal layout entry interface
interface IWebGLDetailedBindGroupLayoutEntry extends IRHIBindGroupLayoutEntry {
  name?: string, // Uniform/Sampler/Texture name in the shader, provided by the user
  // Example: if a sampler is associated with a texture, you might define it here
  // associatedTextureBinding?: number;
}

export class WebGLBindGroupLayout implements IRHIBindGroupLayout {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private detailedEntries: IWebGLDetailedBindGroupLayoutEntry[];
  private _label?: string; // Use a private backing field for the label
  private isDestroyed = false;

  // For managing texture unit allocation
  private textureBindingToUnitMap: Map<number, number>; // <texture_binding_point, texture_unit_index>
  private nextAvailableTextureUnit: number;
  entries: IRHIBindGroupLayoutEntry[];

  /**
   * 创建WebGL绑定组布局
   *
   * @param gl WebGL上下文
   * @param entries 绑定条目数组 (expected to be IWebGLDetailedBindGroupLayoutEntry compatible)
   * @param label 可选标签
   */
  constructor (gl: WebGLRenderingContext | WebGL2RenderingContext, entries: any[], label?: string) {
    this.gl = gl;
    this.detailedEntries = entries as IWebGLDetailedBindGroupLayoutEntry[];
    this._label = label; // Assign to private field
    this.textureBindingToUnitMap = new Map();
    this.nextAvailableTextureUnit = 0; // WebGL texture units start from 0

    // 在WebGL中，bindGroupLayout是一个逻辑概念，不需要直接创建WebGL对象
    // 但我们仍然要验证entries结构的合法性并处理纹理单元分配
    this.validateAndProcessDetailedEntries();
  }

  /**
   * 验证绑定组布局条目并分配纹理单元
   */
  private validateAndProcessDetailedEntries (): void {
    const bindingSet = new Set<number>();
    const maxCombinedTextureImageUnits = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    for (const entry of this.detailedEntries) {
      if (entry.binding === undefined) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Layout entry must include 'binding' field.`);
      }
      if (typeof entry.binding !== 'number' || entry.binding < 0 || !Number.isInteger(entry.binding)) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Invalid binding value: ${entry.binding}, must be a non-negative integer.`);
      }
      if (bindingSet.has(entry.binding)) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Binding point ${entry.binding} is duplicated. Bindings must be unique.`);
      }
      bindingSet.add(entry.binding);

      // 根据IRHIBindGroupLayoutEntry验证结构
      const hasBuffer = !!entry.buffer;
      const hasTexture = !!entry.texture;
      const hasSampler = !!entry.sampler;
      const hasStorageTexture = !!entry.storageTexture;

      if (!(hasBuffer || hasTexture || hasSampler || hasStorageTexture)) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Binding ${entry.binding}: Entry must define one of buffer, texture, sampler, or storageTexture.`);
      }

      // 进一步验证子属性（例如，entry.buffer.type）
      if (hasBuffer && entry.buffer!.type === undefined) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Binding ${entry.binding}: Buffer entry missing 'type'.`);
      }
      if (hasTexture && (entry.texture!.sampleType === undefined || entry.texture!.viewDimension === undefined)) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Binding ${entry.binding}: Texture entry missing 'sampleType' or 'viewDimension'.`);
      }
      if (hasSampler && entry.sampler!.type === undefined) {
        throw new Error(`[${this._label || 'WebGLBindGroupLayout'}] Binding ${entry.binding}: Sampler entry missing 'type'.`);
      }
      // Add more checks for storageTexture if it's actively used

      // Assign texture units for texture bindings
      if (hasTexture) {
        if (this.nextAvailableTextureUnit >= maxCombinedTextureImageUnits) {
          console.warn(`[${this._label || 'WebGLBindGroupLayout'}] Binding ${entry.binding}: Max texture units (${maxCombinedTextureImageUnits}) reached. Cannot assign unit.`);
        } else {
          this.textureBindingToUnitMap.set(entry.binding, this.nextAvailableTextureUnit);
          this.nextAvailableTextureUnit++;
        }
      }
    }
  }

  /**
   * 获取绑定组布局条目 (符合公共接口)
   */
  getEntries (): IRHIBindGroupLayoutEntry[] {
    return this.detailedEntries.map(de => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: _name, ...publicEntryFields } = de; // Ignore 'name' by prefixing with _

      return publicEntryFields as IRHIBindGroupLayoutEntry;
    });
  }

  /**
   * 获取绑定组布局标签
   */
  get label (): string | undefined {
    return this._label;
  }

  /**
   * 获取详细的绑定条目 (供WebGLBindGroup内部使用)
   * @param binding 绑定点
   * @returns 详细的绑定条目或undefined
   */
  public getDetailedBindingEntry (binding: number): IWebGLDetailedBindGroupLayoutEntry | undefined {
    return this.detailedEntries.find(entry => entry.binding === binding);
  }

  /**
   * 获取指定纹理绑定点的纹理单元 (供WebGLBindGroup内部使用)
   * @param textureBinding 纹理绑定点
   * @returns 分配的纹理单元索引或undefined
   */
  public getTextureUnitForBinding (textureBinding: number): number | undefined {
    return this.textureBindingToUnitMap.get(textureBinding);
  }

  /**
   * 获取采样器关联的纹理绑定点 (供WebGLBindGroup内部使用)
   * 注意：此实现依赖于引擎如何定义采样器与纹理的关联
   * @param samplerBinding 采样器绑定点
   * @returns 关联的纹理绑定点或undefined
   */
  public getAssociatedTextureBindingForSampler (samplerBinding: number): number | undefined {
    const samplerEntry = this.getDetailedBindingEntry(samplerBinding);

    // This logic is highly dependent on your engine's conventions.
    // Example: an explicit 'associatedTextureBinding' field in the sampler layout entry.
    // Or a naming convention. For now, a placeholder:
    if (samplerEntry && samplerEntry.sampler) {
      // const associatedBinding = (samplerEntry.sampler as any).associatedTextureBinding;
      // if (typeof associatedBinding === 'number') return associatedBinding;

      // Fallback: try to find a texture binding that might be related (e.g. binding-1)
      // This is a guess and likely needs to be more robust.
      const potentialTextureBinding = samplerBinding - 1;
      const textureEntry = this.getDetailedBindingEntry(potentialTextureBinding);

      if (textureEntry && textureEntry.texture) {
        // console.log(`[WebGLBindGroupLayout] Associating sampler@${samplerBinding} with texture@${potentialTextureBinding} by proximity.`);
        return potentialTextureBinding;
      }
    }
    console.warn(`[${this._label || 'WebGLBindGroupLayout'}] Could not determine associated texture for sampler binding ${samplerBinding}. This may affect sampler parameter application.`);

    return undefined;
  }

  /**
   * 销毁资源
   */
  destroy (): void {
    if (this.isDestroyed) {
      return;
    }
    // WebGL的绑定组布局是概念性的，没有需要释放的原生资源
    this.detailedEntries = [];
    this.textureBindingToUnitMap.clear();
    this.isDestroyed = true;
  }
}
import { ShaderMacro } from './ShaderMacro';

/**
 * 着色器宏定义集合类，用于管理一组着色器宏定义
 */
export class ShaderMacroCollection {
  /** 已启用的宏ID集合 */
  private enabledMacros: Set<number> = new Set();
  /** 宏值映射表 */
  private macroValues: Map<number, string | number | boolean> = new Map();

  /**
   * 创建着色器宏定义集合
   */
  constructor() {
    // 初始空集合
  }

  /**
   * 启用宏定义
   * @param macro 宏定义或宏ID
   * @param value 宏值（可选）
   */
  enable(macro: ShaderMacro | number, value: string | number | boolean = ''): void {
    const macroID = macro instanceof ShaderMacro ? macro.id : macro;

    // 将宏添加到已启用集合
    this.enabledMacros.add(macroID);

    // 设置宏值
    this.macroValues.set(macroID, value);

    // 如果提供的是ShaderMacro对象，同时更新其值
    if (macro instanceof ShaderMacro) {
      macro.value = value;
    }
  }

  /**
   * 禁用宏定义
   * @param macro 宏定义或宏ID
   */
  disable(macro: ShaderMacro | number): void {
    const macroID = macro instanceof ShaderMacro ? macro.id : macro;

    // 从已启用集合中移除
    this.enabledMacros.delete(macroID);

    // 移除宏值
    this.macroValues.delete(macroID);
  }

  /**
   * 检查宏定义是否已启用
   * @param macro 宏定义或宏ID
   * @returns 是否已启用
   */
  isEnabled(macro: ShaderMacro | number): boolean {
    const macroID = macro instanceof ShaderMacro ? macro.id : macro;

    return this.enabledMacros.has(macroID);
  }

  /**
   * 获取宏定义的值
   * @param macro 宏定义或宏ID
   * @returns 宏值
   */
  getValue(macro: ShaderMacro | number): string | number | boolean {
    const macroID = macro instanceof ShaderMacro ? macro.id : macro;

    if (this.macroValues.has(macroID)) {
      return this.macroValues.get(macroID);
    }

    return undefined;
  }

  /**
   * 设置宏定义的值，如果宏不存在则启用它
   * @param macro 宏定义或宏ID
   * @param value 宏值
   */
  setValue(macro: ShaderMacro | number, value: string | number | boolean): void {
    this.enable(macro, value);
  }

  /**
   * 获取已启用的宏定义数量
   * @returns 已启用的宏定义数量
   */
  get count(): number {
    return this.enabledMacros.size;
  }

  /**
   * 获取所有已启用的宏ID
   * @returns 已启用的宏ID数组
   */
  getEnabledMacroIDs(): number[] {
    return Array.from(this.enabledMacros);
  }

  /**
   * 获取所有已启用的宏对象
   * @returns 已启用的宏对象数组
   */
  getEnabledMacros(): ShaderMacro[] {
    const result: ShaderMacro[] = [];

    for (const macroID of this.enabledMacros) {
      const macro = ShaderMacro.getById(macroID);

      if (macro) {
        result.push(macro);
      }
    }

    return result;
  }

  /**
   * 合并另一个宏定义集合到当前集合
   * @param other 要合并的宏定义集合
   */
  merge(other: ShaderMacroCollection): void {
    if (!other) {
      return;
    }

    // 合并所有已启用的宏及其值
    for (const macroID of other.enabledMacros) {
      this.enabledMacros.add(macroID);

      if (other.macroValues.has(macroID)) {
        this.macroValues.set(macroID, other.macroValues.get(macroID));
      }
    }
  }

  /**
   * 克隆当前宏定义集合
   * @returns 克隆的宏定义集合
   */
  clone(): ShaderMacroCollection {
    const result = new ShaderMacroCollection();

    // 复制所有已启用的宏及其值
    for (const macroID of this.enabledMacros) {
      result.enabledMacros.add(macroID);

      if (this.macroValues.has(macroID)) {
        result.macroValues.set(macroID, this.macroValues.get(macroID));
      }
    }

    return result;
  }

  /**
   * 清空宏定义集合
   */
  clear(): void {
    this.enabledMacros.clear();
    this.macroValues.clear();
  }

  /**
   * 获取GLSL预处理字符串
   * @returns GLSL预处理字符串
   */
  getGLSLDefines(): string {
    const defines: string[] = [];

    for (const macroID of this.enabledMacros) {
      const macro = ShaderMacro.getById(macroID);

      if (macro) {
        const value = this.macroValues.get(macroID);

        if (value === false) {
          // 如果值为false，则不定义该宏
          continue;
        } else if (value === true || value === '') {
          // 如果值为true或空字符串，则定义为无值宏
          defines.push(`#define ${macro.name}`);
        } else {
          // 定义为有值宏
          defines.push(`#define ${macro.name} ${value}`);
        }
      }
    }

    return defines.join('\n');
  }
}

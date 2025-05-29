/**
 * shader-data.ts
 * 着色器数据管理类
 */

/**
 * 着色器数据类
 * 管理着色器的uniform数据
 */
export class ShaderData {
  private data: Map<string, any> = new Map();

  /**
   * 设置数据
   */
  setData(name: string, value: any): void {
    this.data.set(name, value);
  }

  /**
   * 获取数据
   */
  getData(name: string): any {
    return this.data.get(name);
  }

  /**
   * 删除数据
   */
  removeData(name: string): boolean {
    return this.data.delete(name);
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * 获取所有数据
   */
  getAllData(): Map<string, any> {
    return new Map(this.data);
  }
}

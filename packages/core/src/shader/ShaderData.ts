import { Vector2, Vector3, Vector4, Matrix4, Color } from '@maxellabs/math';
import { Texture } from '../texture/Texture';
import { ShaderProperty } from './ShaderProperty';
import { ShaderDataGroup } from './ShaderDataGroup';

/**
 * 着色器数据类，用于管理着色器的uniform变量数据
 */
export class ShaderData {
  /** 数据存储组 */
  private groups: Map<ShaderDataGroup, Map<number, any>> = new Map();
  /** 已更新的属性集合 */
  private dirtyProps: Set<number> = new Set();
  /** 数据变更标志 */
  private dirty: boolean = true;

  /**
   * 创建着色器数据实例
   */
  constructor() {
    // 初始化所有组的数据
    for (const group of Object.values(ShaderDataGroup)) {
      if (typeof group === 'number') {
        this.groups.set(group as ShaderDataGroup, new Map());
      }
    }
  }

  /**
   * 设置浮点数值
   * @param property 着色器属性
   * @param value 浮点数值
   */
  setFloat(property: ShaderProperty | number, value: number): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取浮点数值
   * @param property 着色器属性
   * @returns 浮点数值
   */
  getFloat(property: ShaderProperty | number): number {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置整数值
   * @param property 着色器属性
   * @param value 整数值
   */
  setInt(property: ShaderProperty | number, value: number): void {
    this._setData(property, Math.floor(value), ShaderDataGroup.Uniform);
  }

  /**
   * 获取整数值
   * @param property 着色器属性
   * @returns 整数值
   */
  getInt(property: ShaderProperty | number): number {
    return Math.floor(this._getData(property, ShaderDataGroup.Uniform));
  }

  /**
   * 设置二维向量
   * @param property 着色器属性
   * @param value 二维向量
   */
  setVector2(property: ShaderProperty | number, value: Vector2): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取二维向量
   * @param property 着色器属性
   * @returns 二维向量
   */
  getVector2(property: ShaderProperty | number): Vector2 {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置三维向量
   * @param property 着色器属性
   * @param value 三维向量
   */
  setVector3(property: ShaderProperty | number, value: Vector3): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取三维向量
   * @param property 着色器属性
   * @returns 三维向量
   */
  getVector3(property: ShaderProperty | number): Vector3 {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置四维向量
   * @param property 着色器属性
   * @param value 四维向量
   */
  setVector4(property: ShaderProperty | number, value: Vector4): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取四维向量
   * @param property 着色器属性
   * @returns 四维向量
   */
  getVector4(property: ShaderProperty | number): Vector4 {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置颜色
   * @param property 着色器属性
   * @param value 颜色
   */
  setColor(property: ShaderProperty | number, value: Color): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取颜色
   * @param property 着色器属性
   * @returns 颜色
   */
  getColor(property: ShaderProperty | number): Color {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置矩阵
   * @param property 着色器属性
   * @param value 矩阵
   */
  setMatrix(property: ShaderProperty | number, value: Matrix4): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取矩阵
   * @param property 着色器属性
   * @returns 矩阵
   */
  getMatrix(property: ShaderProperty | number): Matrix4 {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置纹理
   * @param property 着色器属性
   * @param value 纹理
   */
  setTexture(property: ShaderProperty | number, value: Texture): void {
    this._setData(property, value, ShaderDataGroup.Uniform);
  }

  /**
   * 获取纹理
   * @param property 着色器属性
   * @returns 纹理
   */
  getTexture(property: ShaderProperty | number): Texture {
    return this._getData(property, ShaderDataGroup.Uniform);
  }

  /**
   * 设置布尔值
   * @param property 着色器属性
   * @param value 布尔值
   */
  setBool(property: ShaderProperty | number, value: boolean): void {
    this._setData(property, value ? 1 : 0, ShaderDataGroup.Uniform);
  }

  /**
   * 获取布尔值
   * @param property 着色器属性
   * @returns 布尔值
   */
  getBool(property: ShaderProperty | number): boolean {
    return this._getData(property, ShaderDataGroup.Uniform) === 1;
  }

  /**
   * 设置数据
   * @param property 着色器属性
   * @param value 数据值
   * @param group 数据组
   */
  private _setData(property: ShaderProperty | number, value: any, group: ShaderDataGroup): void {
    // 获取属性ID
    const propID = property instanceof ShaderProperty ? property.id : property;
    
    // 获取组数据
    const groupData = this.groups.get(group);
    
    // 如果值不同，则更新并标记为脏
    const oldValue = groupData.get(propID);
    if (value !== oldValue) {
      groupData.set(propID, value);
      this.dirtyProps.add(propID);
      this.dirty = true;
    }
  }

  /**
   * 获取数据
   * @param property 着色器属性
   * @param group 数据组
   * @returns 数据值
   */
  private _getData(property: ShaderProperty | number, group: ShaderDataGroup): any {
    // 获取属性ID
    const propID = property instanceof ShaderProperty ? property.id : property;
    
    // 获取组数据
    const groupData = this.groups.get(group);
    
    // 返回对应的值
    return groupData.get(propID);
  }

  /**
   * 检查属性是否已设置
   * @param property 着色器属性
   * @param group 数据组
   * @returns 是否已设置
   */
  hasProperty(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): boolean {
    const propID = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);
    return groupData.has(propID);
  }

  /**
   * 删除属性
   * @param property 着色器属性
   * @param group 数据组
   */
  deleteProperty(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    const propID = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);
    if (groupData.has(propID)) {
      groupData.delete(propID);
      this.dirtyProps.add(propID);
      this.dirty = true;
    }
  }

  /**
   * 应用数据到着色器程序
   * @param program 着色器程序
   */
  applyToProgram(program: WebGLProgram, gl: WebGLRenderingContext): void {
    if (!this.dirty) {
      return;
    }

    // 遍历所有组
    for (const [group, groupData] of this.groups.entries()) {
      if (group === ShaderDataGroup.Uniform) {
        // 应用uniform变量
        let textureUnit = 0;
        for (const [propID, value] of groupData.entries()) {
          if (this.dirtyProps.has(propID)) {
            // 获取uniform位置
            const uniformName = ShaderProperty.getNameById(propID);
            const location = gl.getUniformLocation(program, uniformName);
            
            if (location) {
              // 根据类型应用不同的uniform设置方法
              if (value === null || value === undefined) {
                continue;
              } else if (typeof value === 'number') {
                gl.uniform1f(location, value);
              } else if (value instanceof Vector2) {
                gl.uniform2f(location, value.x, value.y);
              } else if (value instanceof Vector3) {
                gl.uniform3f(location, value.x, value.y, value.z);
              } else if (value instanceof Vector4 || value instanceof Color) {
                gl.uniform4f(location, value.x, value.y, value.z, value.w);
              } else if (value instanceof Matrix4) {
                gl.uniformMatrix4fv(location, false, value.elements);
              } else if (value instanceof Texture) {
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D, value.getGLTexture(gl));
                gl.uniform1i(location, textureUnit);
                textureUnit++;
              } else if (Array.isArray(value)) {
                if (value.length === 2) {
                  gl.uniform2fv(location, value);
                } else if (value.length === 3) {
                  gl.uniform3fv(location, value);
                } else if (value.length === 4) {
                  gl.uniform4fv(location, value);
                } else if (value.length === 16) {
                  gl.uniformMatrix4fv(location, false, value);
                }
              }
            }
          }
        }
      }
    }

    // 清空脏属性集合
    this.dirtyProps.clear();
    this.dirty = false;
  }

  /**
   * 重置着色器数据
   */
  reset(): void {
    // 清空所有组的数据
    for (const groupData of this.groups.values()) {
      groupData.clear();
    }
    this.dirtyProps.clear();
    this.dirty = true;
  }

  /**
   * 克隆着色器数据
   * @returns 克隆的着色器数据
   */
  clone(): ShaderData {
    const newData = new ShaderData();
    
    // 复制所有组的数据
    for (const [group, groupData] of this.groups.entries()) {
      const newGroupData = newData.groups.get(group);
      for (const [propID, value] of groupData.entries()) {
        // 深拷贝值
        let clonedValue = value;
        if (value && typeof value === 'object' && 'clone' in value) {
          clonedValue = value.clone();
        }
        newGroupData.set(propID, clonedValue);
      }
    }
    
    return newData;
  }
} 
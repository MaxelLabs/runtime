import { Vector2, Vector3, Vector4, Matrix4, Color } from '@maxellabs/math';
import { Texture } from '../texture/Texture-object';
import { ShaderProperty } from './shader-property';
import { ShaderDataGroup } from './shader-data-group';
import { ObjectPool } from '../base/object-pool';
import { ObjectPoolManager } from '../base/object-pool-manager';

/**
 * 着色器数据类型枚举
 */
export enum ShaderDataType {
  /** 浮点数 */
  Float = 0,
  /** 整数 */
  Int = 1,
  /** 二维向量 */
  Vector2 = 2,
  /** 三维向量 */
  Vector3 = 3,
  /** 四维向量 */
  Vector4 = 4,
  /** 矩阵 */
  Matrix4 = 5,
  /** 颜色 */
  Color = 6,
  /** 纹理 */
  Texture = 7,
  /** 布尔值 */
  Bool = 8,
  /** 数组 */
  Array = 9,
  /** 结构体 */
  Struct = 10,
}

/**
 * 着色器数据变更事件接口
 */
export interface ShaderDataChangeEvent {
  /** 属性ID */
  propertyId: number;
  /** 数据组 */
  group: ShaderDataGroup;
  /** 新值 */
  value: any;
  /** 旧值 */
  oldValue: any;
}

/**
 * 增强的着色器数据类，用于管理着色器的uniform变量数据
 * 支持按组管理不同类型的数据，提供脏标记跟踪和事件通知
 */
export class EnhancedShaderData {
  /** 数据存储组 */
  private groups: Map<ShaderDataGroup, Map<number, any>> = new Map();
  /** 数据类型映射 */
  private typeMap: Map<number, ShaderDataType> = new Map();
  /** 已更新的属性集合，按组分类 */
  private dirtyProps: Map<ShaderDataGroup, Set<number>> = new Map();
  /** 全局脏标记 */
  private dirty: boolean = true;
  /** 变更监听回调 */
  private changeListeners: Array<(event: ShaderDataChangeEvent) => void> = [];
  /** 向量对象池 */
  private static vector2Pool = ObjectPoolManager.getInstance().createPool<Vector2>(
    'shader:vector2',
    () => new Vector2(0, 0),
    (v) => v.set(0, 0),
    { initialCapacity: 20, maxSize: 100, logStats: false }
  );
  /** 向量对象池 */
  private static vector3Pool = ObjectPoolManager.getInstance().createPool<Vector3>(
    'shader:vector3',
    () => new Vector3(0, 0, 0),
    (v) => v.set(0, 0, 0),
    { initialCapacity: 20, maxSize: 100, logStats: false }
  );
  /** 向量对象池 */
  private static vector4Pool = ObjectPoolManager.getInstance().createPool<Vector4>(
    'shader:vector4',
    () => new Vector4(0, 0, 0, 0),
    (v) => v.set(0, 0, 0, 0),
    { initialCapacity: 20, maxSize: 100, logStats: false }
  );
  /** 颜色对象池 */
  private static colorPool = ObjectPoolManager.getInstance().createPool<Color>(
    'shader:color',
    () => new Color(1, 1, 1, 1),
    (c) => c.set(1, 1, 1, 1),
    { initialCapacity: 20, maxSize: 100, logStats: false }
  );

  /**
   * 创建着色器数据实例
   */
  constructor() {
    // 初始化所有组的数据
    for (const group of Object.values(ShaderDataGroup)) {
      if (typeof group === 'number') {
        this.groups.set(group as ShaderDataGroup, new Map());
        this.dirtyProps.set(group as ShaderDataGroup, new Set());
      }
    }
  }

  /**
   * 添加数据变更监听器
   * @param listener 监听回调函数
   */
  addChangeListener(listener: (event: ShaderDataChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * 移除数据变更监听器
   * @param listener 监听回调函数
   */
  removeChangeListener(listener: (event: ShaderDataChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);

    if (index !== -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * 通知数据变更
   * @param propertyId 属性ID
   * @param group 数据组
   * @param value 新值
   * @param oldValue 旧值
   */
  private notifyChange(propertyId: number, group: ShaderDataGroup, value: any, oldValue: any): void {
    const event: ShaderDataChangeEvent = {
      propertyId,
      group,
      value,
      oldValue,
    };

    for (const listener of this.changeListeners) {
      listener(event);
    }
  }

  /**
   * 设置浮点数值
   * @param property 着色器属性
   * @param value 浮点数值
   * @param group 数据组
   */
  setFloat(property: ShaderProperty | number, value: number, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    this.setData(property, value, group, ShaderDataType.Float);
  }

  /**
   * 获取浮点数值
   * @param property 着色器属性
   * @param group 数据组
   * @returns 浮点数值
   */
  getFloat(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): number {
    return this.getData(property, group) || 0;
  }

  /**
   * 设置整数值
   * @param property 着色器属性
   * @param value 整数值
   * @param group 数据组
   */
  setInt(property: ShaderProperty | number, value: number, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    this.setData(property, Math.floor(value), group, ShaderDataType.Int);
  }

  /**
   * 获取整数值
   * @param property 着色器属性
   * @param group 数据组
   * @returns 整数值
   */
  getInt(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): number {
    return Math.floor(this.getData(property, group) || 0);
  }

  /**
   * 设置二维向量
   * @param property 着色器属性
   * @param value 二维向量
   * @param group 数据组
   */
  setVector2(
    property: ShaderProperty | number,
    value: Vector2,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    this.setData(property, value.clone(), group, ShaderDataType.Vector2);
  }

  /**
   * 设置二维向量分量
   * @param property 着色器属性
   * @param x X分量
   * @param y Y分量
   * @param group 数据组
   */
  setVector2Components(
    property: ShaderProperty | number,
    x: number,
    y: number,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);
    let vec = groupData.get(propId);

    if (!vec || !(vec instanceof Vector2)) {
      vec = new Vector2(x, y);
      this.setData(property, vec, group, ShaderDataType.Vector2);
    } else {
      const oldValue = vec.clone();

      vec.set(x, y);
      this.markDirty(propId, group);
      this.notifyChange(propId, group, vec, oldValue);
    }
  }

  /**
   * 获取二维向量
   * @param property 着色器属性
   * @param group 数据组
   * @returns 二维向量
   */
  getVector2(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector2 {
    return this.getData(property, group) || new Vector2(0, 0);
  }

  /**
   * 设置三维向量
   * @param property 着色器属性
   * @param value 三维向量
   * @param group 数据组
   */
  setVector3(
    property: ShaderProperty | number,
    value: Vector3,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    this.setData(property, value.clone(), group, ShaderDataType.Vector3);
  }

  /**
   * 设置三维向量分量
   * @param property 着色器属性
   * @param x X分量
   * @param y Y分量
   * @param z Z分量
   * @param group 数据组
   */
  setVector3Components(
    property: ShaderProperty | number,
    x: number,
    y: number,
    z: number,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);
    let vec = groupData.get(propId);

    if (!vec || !(vec instanceof Vector3)) {
      vec = new Vector3(x, y, z);
      this.setData(property, vec, group, ShaderDataType.Vector3);
    } else {
      const oldValue = vec.clone();

      vec.set(x, y, z);
      this.markDirty(propId, group);
      this.notifyChange(propId, group, vec, oldValue);
    }
  }

  /**
   * 获取三维向量
   * @param property 着色器属性
   * @param group 数据组
   * @returns 三维向量
   */
  getVector3(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector3 {
    return this.getData(property, group) || new Vector3(0, 0, 0);
  }

  /**
   * 设置四维向量
   * @param property 着色器属性
   * @param value 四维向量
   * @param group 数据组
   */
  setVector4(
    property: ShaderProperty | number,
    value: Vector4,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    this.setData(property, value.clone(), group, ShaderDataType.Vector4);
  }

  /**
   * 设置四维向量分量
   * @param property 着色器属性
   * @param x X分量
   * @param y Y分量
   * @param z Z分量
   * @param w W分量
   * @param group 数据组
   */
  setVector4Components(
    property: ShaderProperty | number,
    x: number,
    y: number,
    z: number,
    w: number,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);
    let vec = groupData.get(propId);

    if (!vec || !(vec instanceof Vector4)) {
      vec = new Vector4(x, y, z, w);
      this.setData(property, vec, group, ShaderDataType.Vector4);
    } else {
      const oldValue = vec.clone();

      vec.set(x, y, z, w);
      this.markDirty(propId, group);
      this.notifyChange(propId, group, vec, oldValue);
    }
  }

  /**
   * 获取四维向量
   * @param property 着色器属性
   * @param group 数据组
   * @returns 四维向量
   */
  getVector4(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector4 {
    return this.getData(property, group) || new Vector4(0, 0, 0, 0);
  }

  /**
   * 设置颜色
   * @param property 着色器属性
   * @param value 颜色
   * @param group 数据组
   */
  setColor(property: ShaderProperty | number, value: Color, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    this.setData(property, value.clone(), group, ShaderDataType.Color);
  }

  /**
   * 获取颜色
   * @param property 着色器属性
   * @param group 数据组
   * @returns 颜色
   */
  getColor(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Color {
    return this.getData(property, group) || new Color(1, 1, 1, 1);
  }

  /**
   * 设置矩阵
   * @param property 着色器属性
   * @param value 矩阵
   * @param group 数据组
   */
  setMatrix(property: ShaderProperty | number, value: Matrix4, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    this.setData(property, value.clone(), group, ShaderDataType.Matrix4);
  }

  /**
   * 获取矩阵
   * @param property 着色器属性
   * @param group 数据组
   * @returns 矩阵
   */
  getMatrix(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Matrix4 {
    return this.getData(property, group) || new Matrix4();
  }

  /**
   * 设置纹理
   * @param property 着色器属性
   * @param value 纹理
   * @param group 数据组
   */
  setTexture(
    property: ShaderProperty | number,
    value: Texture,
    group: ShaderDataGroup = ShaderDataGroup.Uniform
  ): void {
    this.setData(property, value, group, ShaderDataType.Texture);
  }

  /**
   * 获取纹理
   * @param property 着色器属性
   * @param group 数据组
   * @returns 纹理
   */
  getTexture(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Texture {
    return this.getData(property, group);
  }

  /**
   * 设置布尔值
   * @param property 着色器属性
   * @param value 布尔值
   * @param group 数据组
   */
  setBool(property: ShaderProperty | number, value: boolean, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    this.setData(property, value ? 1 : 0, group, ShaderDataType.Bool);
  }

  /**
   * 获取布尔值
   * @param property 着色器属性
   * @param group 数据组
   * @returns 布尔值
   */
  getBool(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): boolean {
    return this.getData(property, group) === 1;
  }

  /**
   * 设置数据
   * @param property 着色器属性
   * @param value 数据值
   * @param group 数据组
   * @param type 数据类型
   */
  setData(property: ShaderProperty | number, value: any, group: ShaderDataGroup, type?: ShaderDataType): void {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    // 获取旧值
    const oldValue = groupData.get(propId);

    // 如果值相同，则不更新
    if (this.areValuesEqual(oldValue, value)) {
      return;
    }

    // 设置新值
    groupData.set(propId, value);

    // 如果提供了类型，则更新类型映射
    if (type !== undefined) {
      this.typeMap.set(propId, type);
    }

    // 标记为脏
    this.markDirty(propId, group);

    // 通知变更
    this.notifyChange(propId, group, value, oldValue);
  }

  /**
   * 获取数据
   * @param property 着色器属性
   * @param group 数据组
   * @returns 数据值
   */
  getData(property: ShaderProperty | number, group: ShaderDataGroup): any {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    return groupData.get(propId);
  }

  /**
   * 比较两个值是否相等
   * @param a 第一个值
   * @param b 第二个值
   * @returns 是否相等
   */
  private areValuesEqual(a: any, b: any): boolean {
    // 如果两个值都是null或undefined，则认为相等
    if (a == null && b == null) {
      return true;
    }

    // 如果只有一个是null或undefined，则不相等
    if (a == null || b == null) {
      return false;
    }

    // 如果是简单类型，直接比较
    if (typeof a !== 'object' && typeof b !== 'object') {
      return a === b;
    }

    // 向量和颜色类型的比较
    if (
      (a instanceof Vector2 && b instanceof Vector2) ||
      (a instanceof Vector3 && b instanceof Vector3) ||
      (a instanceof Vector4 && b instanceof Vector4) ||
      (a instanceof Color && b instanceof Color)
    ) {
      return a.equals(b);
    }

    // 矩阵比较
    if (a instanceof Matrix4 && b instanceof Matrix4) {
      return a.equals(b);
    }

    // 纹理比较
    if (a instanceof Texture && b instanceof Texture) {
      return a === b;
    }

    // 其他类型默认不相等
    return false;
  }

  /**
   * 标记属性为脏
   * @param propId 属性ID
   * @param group 数据组
   */
  private markDirty(propId: number, group: ShaderDataGroup): void {
    this.dirtyProps.get(group).add(propId);
    this.dirty = true;
  }

  /**
   * 清除属性脏标记
   * @param propId 属性ID
   * @param group 数据组
   */
  clearDirty(propId: number, group: ShaderDataGroup): void {
    this.dirtyProps.get(group).delete(propId);

    // 检查所有组是否都没有脏属性
    let allClean = true;

    for (const [, dirtySet] of this.dirtyProps) {
      if (dirtySet.size > 0) {
        allClean = false;

        break;
      }
    }

    this.dirty = !allClean;
  }

  /**
   * 清除组的脏标记
   * @param group 数据组
   */
  clearGroupDirty(group: ShaderDataGroup): void {
    this.dirtyProps.get(group).clear();

    // 检查所有组是否都没有脏属性
    let allClean = true;

    for (const [, dirtySet] of this.dirtyProps) {
      if (dirtySet.size > 0) {
        allClean = false;

        break;
      }
    }

    this.dirty = !allClean;
  }

  /**
   * 清除所有脏标记
   */
  clearAllDirty(): void {
    for (const [, dirtySet] of this.dirtyProps) {
      dirtySet.clear();
    }

    this.dirty = false;
  }

  /**
   * 检查属性是否已设置
   * @param property 着色器属性
   * @param group 数据组
   * @returns 是否已设置
   */
  hasProperty(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): boolean {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    return groupData.has(propId);
  }

  /**
   * 获取属性类型
   * @param property 着色器属性
   * @returns 属性类型
   */
  getPropertyType(property: ShaderProperty | number): ShaderDataType | undefined {
    const propId = property instanceof ShaderProperty ? property.id : property;

    return this.typeMap.get(propId);
  }

  /**
   * 删除属性
   * @param property 着色器属性
   * @param group 数据组
   */
  deleteProperty(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): void {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    if (groupData.has(propId)) {
      const oldValue = groupData.get(propId);

      groupData.delete(propId);
      this.typeMap.delete(propId);

      // 从脏属性集合中移除
      this.dirtyProps.get(group).delete(propId);

      // 通知变更
      this.notifyChange(propId, group, undefined, oldValue);
    }
  }

  /**
   * 获取组中所有脏属性的ID
   * @param group 数据组
   * @returns 脏属性ID数组
   */
  getDirtyProperties(group: ShaderDataGroup): number[] {
    return Array.from(this.dirtyProps.get(group));
  }

  /**
   * 获取组中所有属性的ID
   * @param group 数据组
   * @returns 属性ID数组
   */
  getAllProperties(group: ShaderDataGroup): number[] {
    const groupData = this.groups.get(group);

    return Array.from(groupData.keys());
  }

  /**
   * 复制另一个ShaderData的数据
   * @param other 要复制的ShaderData
   * @param copyDirtyOnly 是否只复制脏数据
   */
  copyFrom(other: EnhancedShaderData, copyDirtyOnly: boolean = false): void {
    // 遍历所有组
    for (const group of Object.values(ShaderDataGroup)) {
      if (typeof group === 'number') {
        const groupEnum = group as ShaderDataGroup;
        const sourceGroup = other.groups.get(groupEnum);
        const targetGroup = this.groups.get(groupEnum);

        // 如果只复制脏数据，则只复制脏属性
        if (copyDirtyOnly) {
          const dirtyProps = other.dirtyProps.get(groupEnum);

          for (const propId of dirtyProps) {
            const value = sourceGroup.get(propId);

            if (value !== undefined) {
              this.setData(propId, this.cloneValue(value), groupEnum);
            }
          }
        } else {
          // 复制所有数据
          for (const [propId, value] of sourceGroup.entries()) {
            if (value !== undefined) {
              this.setData(propId, this.cloneValue(value), groupEnum);
            }
          }
        }
      }
    }
  }

  /**
   * 克隆值
   * @param value 要克隆的值
   * @returns 克隆后的值
   */
  private cloneValue(value: any): any {
    if (value == null) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (
      value instanceof Vector2 ||
      value instanceof Vector3 ||
      value instanceof Vector4 ||
      value instanceof Color ||
      value instanceof Matrix4
    ) {
      return value.clone();
    }

    // 纹理和其他对象不克隆，直接返回引用
    return value;
  }

  /**
   * 重置所有数据
   */
  reset(): void {
    // 清空所有组数据
    for (const [group, groupData] of this.groups) {
      groupData.clear();
      this.dirtyProps.get(group).clear();
    }

    this.typeMap.clear();
    this.dirty = false;
  }

  /**
   * 克隆当前ShaderData
   * @returns 新的ShaderData实例
   */
  clone(): EnhancedShaderData {
    const result = new EnhancedShaderData();

    result.copyFrom(this);

    return result;
  }

  /**
   * 应用数据到WebGL程序
   * @param program WebGL程序
   * @param gl WebGL上下文
   */
  applyToProgram(program: WebGLProgram, gl: WebGLRenderingContext): void {
    // 遍历Uniform组的所有属性
    const uniformData = this.groups.get(ShaderDataGroup.Uniform);

    for (const [propId, value] of uniformData.entries()) {
      // 获取uniform位置
      const location = gl.getUniformLocation(program, `u_${propId}`);

      if (!location) {
        continue;
      }

      // 根据类型设置uniform
      const type = this.typeMap.get(propId);

      if (type === ShaderDataType.Float) {
        gl.uniform1f(location, value);
      } else if (type === ShaderDataType.Int || type === ShaderDataType.Bool) {
        gl.uniform1i(location, value);
      } else if (type === ShaderDataType.Vector2) {
        gl.uniform2f(location, value.x, value.y);
      } else if (type === ShaderDataType.Vector3) {
        gl.uniform3f(location, value.x, value.y, value.z);
      } else if (type === ShaderDataType.Vector4 || type === ShaderDataType.Color) {
        gl.uniform4f(location, value.x, value.y, value.z, value.w);
      } else if (type === ShaderDataType.Matrix4) {
        gl.uniformMatrix4fv(location, false, value.elements);
      } else if (type === ShaderDataType.Texture) {
        // 纹理处理需要额外逻辑，这里简化处理
      }

      // 清除脏标记
      this.clearDirty(propId, ShaderDataGroup.Uniform);
    }
  }

  /**
   * 获取四维向量，从对象池获取临时对象
   * @param property 着色器属性
   * @param group 数据组
   * @returns 四维向量
   */
  getVector4ForRead(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector4 {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    if (!groupData || !groupData.has(propId)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector4Pool.get();

      tempVec.set(0, 0, 0, 0);

      return tempVec;
    }

    const value = groupData.get(propId);

    if (!(value instanceof Vector4)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector4Pool.get();

      tempVec.set(0, 0, 0, 0);

      return tempVec;
    }

    // 克隆出一个临时向量，避免直接修改数据
    const vec = EnhancedShaderData.vector4Pool.get();

    vec.copy(value);

    return vec;
  }

  /**
   * 释放从对象池获取的临时对象
   * @param vec 临时向量对象
   */
  releaseTemporaryVector4(vec: Vector4): void {
    if (vec) {
      EnhancedShaderData.vector4Pool.release(vec);
    }
  }

  /**
   * 获取三维向量，从对象池获取临时对象
   * @param property 着色器属性
   * @param group 数据组
   * @returns 三维向量
   */
  getVector3ForRead(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector3 {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    if (!groupData || !groupData.has(propId)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector3Pool.get();

      tempVec.set(0, 0, 0);

      return tempVec;
    }

    const value = groupData.get(propId);

    if (!(value instanceof Vector3)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector3Pool.get();

      tempVec.set(0, 0, 0);

      return tempVec;
    }

    // 克隆出一个临时向量，避免直接修改数据
    const vec = EnhancedShaderData.vector3Pool.get();

    vec.copy(value);

    return vec;
  }

  /**
   * 释放从对象池获取的临时对象
   * @param vec 临时向量对象
   */
  releaseTemporaryVector3(vec: Vector3): void {
    if (vec) {
      EnhancedShaderData.vector3Pool.release(vec);
    }
  }

  /**
   * 获取二维向量，从对象池获取临时对象
   * @param property 着色器属性
   * @param group 数据组
   * @returns 二维向量
   */
  getVector2ForRead(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Vector2 {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    if (!groupData || !groupData.has(propId)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector2Pool.get();

      tempVec.set(0, 0);

      return tempVec;
    }

    const value = groupData.get(propId);

    if (!(value instanceof Vector2)) {
      // 返回临时对象，用于读取
      const tempVec = EnhancedShaderData.vector2Pool.get();

      tempVec.set(0, 0);

      return tempVec;
    }

    // 克隆出一个临时向量，避免直接修改数据
    const vec = EnhancedShaderData.vector2Pool.get();

    vec.copy(value);

    return vec;
  }

  /**
   * 释放从对象池获取的临时对象
   * @param vec 临时向量对象
   */
  releaseTemporaryVector2(vec: Vector2): void {
    if (vec) {
      EnhancedShaderData.vector2Pool.release(vec);
    }
  }

  /**
   * 获取颜色，从对象池获取临时对象
   * @param property 着色器属性
   * @param group 数据组
   * @returns 颜色
   */
  getColorForRead(property: ShaderProperty | number, group: ShaderDataGroup = ShaderDataGroup.Uniform): Color {
    const propId = property instanceof ShaderProperty ? property.id : property;
    const groupData = this.groups.get(group);

    if (!groupData || !groupData.has(propId)) {
      // 返回临时对象，用于读取
      const tempColor = EnhancedShaderData.colorPool.get();

      tempColor.set(1, 1, 1, 1);

      return tempColor;
    }

    const value = groupData.get(propId);

    if (!(value instanceof Color)) {
      // 返回临时对象，用于读取
      const tempColor = EnhancedShaderData.colorPool.get();

      tempColor.set(1, 1, 1, 1);

      return tempColor;
    }

    // 克隆出一个临时颜色，避免直接修改数据
    const color = EnhancedShaderData.colorPool.get();

    color.copy(value);

    return color;
  }

  /**
   * 释放从对象池获取的临时对象
   * @param color 临时颜色对象
   */
  releaseTemporaryColor(color: Color): void {
    if (color) {
      EnhancedShaderData.colorPool.release(color);
    }
  }

  /**
   * 分析着色器数据性能
   */
  analyzePerformance(): void {
    // 分析所有对象池性能
    ObjectPoolManager.getInstance().analyzePerformance(true);

    // 输出着色器数据统计信息
    let totalProperties = 0;
    let totalDirtyProperties = 0;

    for (const group of this.groups.keys()) {
      const props = this.getAllProperties(group);
      const dirtyProps = this.getDirtyProperties(group);

      totalProperties += props.length;
      totalDirtyProperties += dirtyProps.length;

      // eslint-disable-next-line no-console
      console.info(
        `着色器数据组 ${ShaderDataGroup[group]} 统计: ` + `总属性: ${props.length}, ` + `脏属性: ${dirtyProps.length}`
      );
    }

    // eslint-disable-next-line no-console
    console.info(
      '着色器数据总计: ' +
        `总属性: ${totalProperties}, ` +
        `总脏属性: ${totalDirtyProperties}, ` +
        `脏属性比例: ${totalProperties > 0 ? ((totalDirtyProperties / totalProperties) * 100).toFixed(2) : 0}%`
    );
  }
}

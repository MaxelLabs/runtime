import { Component } from '../base/component';
import { Entity } from '../base/entity';
import { Geometry } from '../geometry/geometry';
import { Material } from '../material/material';

/**
 * 网格组件 - 包含几何体和材质信息
 */
export class Mesh extends Component {
  /** 几何体 */
  private _geometry: Geometry | null = null;
  /** 材质列表 */
  private _materials: Material[] = [];
  /** 是否可见 */
  private _visible: boolean = true;
  /** 是否投射阴影 */
  private _castShadow: boolean = false;
  /** 是否接收阴影 */
  private _receiveShadow: boolean = false;
  /** 几何体是否已准备好 */
  private _geometryReady: boolean = false;
  /** 渲染数据缓存 */
  private _renderData: any = null;

  /**
   * 创建网格组件
   * @param entity 所属实体
   * @param geometry 几何体数据
   * @param material 材质
   */
  constructor(entity: Entity, geometry: Geometry, material: Material) {
    super(entity);
    this.setGeometry(geometry);
    this.addMaterial(material);
  }

  /**
   * 获取几何体
   */
  get geometry(): Geometry | null {
    return this._geometry;
  }

  /**
   * 设置几何体
   */
  set geometry(value: Geometry | null) {
    this.setGeometry(value);
  }

  /**
   * 设置几何体并处理引用计数
   */
  setGeometry(value: Geometry | null): void {
    // 如果已有几何体，减少引用计数
    if (this._geometry) {
      this._geometry.release();
    }
    
    this._geometry = value;
    
    // 如果设置了新几何体，增加引用计数
    if (this._geometry) {
      this._geometry.addRef();
    }
    
    this._geometryReady = false;
    this._renderData = null;
  }

  /**
   * 获取主材质（第一个材质）
   */
  get material(): Material | null {
    return this._materials.length > 0 ? this._materials[0] : null;
  }

  /**
   * 设置主材质（替换第一个材质或添加材质）
   */
  set material(value: Material | null) {
    if (value) {
      if (this._materials.length > 0) {
        // 减少旧材质的引用计数
        const oldMaterial = this._materials[0];
        if (oldMaterial) {
          oldMaterial.release();
        }
        
        // 设置新材质并增加引用计数
        this._materials[0] = value;
        value.addRef();
      } else {
        this.addMaterial(value);
      }
    } else {
      // 清空材质列表，减少所有材质的引用计数
      this.clearMaterials();
    }
    this._renderData = null;
  }

  /**
   * 获取所有材质
   */
  get materials(): Material[] {
    return [...this._materials];
  }

  /**
   * 设置所有材质
   */
  set materials(value: Material[]) {
    // 清除当前所有材质，减少引用计数
    this.clearMaterials();
    
    // 添加新材质，增加引用计数
    for (const material of value) {
      this.addMaterial(material);
    }
  }

  /**
   * 获取是否可见
   */
  get visible(): boolean {
    return this._visible;
  }

  /**
   * 设置是否可见
   */
  set visible(value: boolean) {
    this._visible = value;
  }

  /**
   * 获取是否投射阴影
   */
  get castShadow(): boolean {
    return this._castShadow;
  }

  /**
   * 设置是否投射阴影
   */
  set castShadow(value: boolean) {
    this._castShadow = value;
  }

  /**
   * 获取是否接收阴影
   */
  get receiveShadow(): boolean {
    return this._receiveShadow;
  }

  /**
   * 设置是否接收阴影
   */
  set receiveShadow(value: boolean) {
    this._receiveShadow = value;
  }

  /**
   * 添加材质
   * @param material 要添加的材质
   */
  addMaterial(material: Material): void {
    if (material) {
      this._materials.push(material);
      material.addRef();
      this._renderData = null;
    }
  }

  /**
   * 移除材质
   * @param material 要移除的材质
   * @returns 是否成功移除
   */
  removeMaterial(material: Material): boolean {
    const index = this._materials.indexOf(material);
    if (index !== -1) {
      const removedMaterial = this._materials.splice(index, 1)[0];
      if (removedMaterial) {
        removedMaterial.release();
      }
      this._renderData = null;
      return true;
    }
    return false;
  }

  /**
   * 设置指定索引的材质
   * @param index 材质索引
   * @param material 新材质
   */
  setMaterialAt(index: number, material: Material): void {
    if (index >= 0) {
      // 确保数组长度足够
      while (this._materials.length <= index) {
        // 使用undefined占位，而不是null
        this._materials.push(undefined as unknown as Material);
      }
      
      // 减少原材质的引用计数
      const oldMaterial = this._materials[index];
      if (oldMaterial) {
        oldMaterial.release();
      }
      
      // 设置新材质并增加引用计数
      this._materials[index] = material;
      if (material) {
        material.addRef();
      }
      
      this._renderData = null;
    }
  }

  /**
   * 获取指定索引的材质
   * @param index 材质索引
   * @returns 材质，如果不存在则返回null
   */
  getMaterialAt(index: number): Material | null {
    return index >= 0 && index < this._materials.length ? this._materials[index] : null;
  }

  /**
   * 清空所有材质
   */
  clearMaterials(): void {
    // 减少所有材质的引用计数
    for (const material of this._materials) {
      if (material) {
        material.release();
      }
    }
    
    this._materials = [];
    this._renderData = null;
  }

  /**
   * 当组件首次启用时调用
   */
  override onEnable(): void {
    // 在此处可以执行初始化渲染资源的操作
  }

  /**
   * 当组件禁用时调用
   */
  override onDisable(): void {
    // 在此处可以执行释放渲染资源的操作
  }

  /**
   * 当组件被销毁时调用
   */
  override onDestroy(): void {
    // 释放几何体资源
    if (this._geometry) {
      this._geometry.release();
      this._geometry = null;
    }
    
    // 释放材质资源
    this.clearMaterials();
    
    // 清理渲染数据
    this._renderData = null;
  }

  /**
   * 在渲染前调用
   */
  override render(): void {
    if (!this._visible || !this._geometry || this._materials.length === 0) {
      return;
    }

    // 准备几何体数据（如果尚未准备）
    if (!this._geometryReady) {
      this._prepareGeometry();
    }

    // 渲染操作由渲染系统处理
    // 此处只是一个占位符
  }

  /**
   * 准备几何体数据
   * 这个方法会在几何体首次用于渲染时调用
   */
  private _prepareGeometry(): void {
    if (!this._geometry) {
      return;
    }

    // 确保几何体有法线
    if (!this._geometry.getNormals()) {
      this._geometry.computeNormals();
    }

    // 如果有UV但没有切线，计算切线
    if (this._geometry.getUVs() && !this._geometry.getTangents()) {
      this._geometry.computeTangents();
    }

    // 计算包围盒
    this._geometry.computeBoundingBox();

    this._geometryReady = true;
  }

  /**
   * 更新网格组件
   * @param deltaTime 时间增量
   */
  override update(deltaTime: number): void {
    // 可以扩展更新逻辑
  }
} 
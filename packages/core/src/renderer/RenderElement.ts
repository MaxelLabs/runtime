import { Matrix4 } from '@maxellabs/math';
import type { Mesh } from '../geometry/Mesh';
import type { Material } from '../material/Material';
import { ShaderData } from '../shader/shader-data';
import type { Entity } from '../base/Entity';
import { SubRenderElement } from './SubRenderElement';

/**
 * 渲染元素类型
 */
export enum RenderElementType {
  /** 静态网格 */
  StaticMesh = 0,
  /** 骨骼网格 */
  SkinnedMesh = 1,
  /** 粒子系统 */
  Particle = 2,
  /** 地形 */
  Terrain = 3,
  /** 水体 */
  Water = 4,
  /** 贴花 */
  Decal = 5,
  /** 自定义 */
  Custom = 100,
}

/**
 * 渲染元素类，表示一个可渲染的对象
 */
export class RenderElement {
  /** 关联的实体 */
  entity: Entity;
  /** 网格数据 */
  mesh: Mesh;
  /** 材质 */
  material: Material;
  /** 子材质索引 */
  subMaterialIndex: number = 0;
  /** 是否可见 */
  visible: boolean = true;
  /** 是否接收阴影 */
  receiveShadow: boolean = true;
  /** 是否投射阴影 */
  castShadow: boolean = true;
  /** 渲染层级 */
  renderLayer: number = 0;
  /** 渲染排序值 */
  sortingValue: number = 0;
  /** 世界矩阵 */
  worldMatrix: Matrix4 = new Matrix4();
  /** 渲染元素类型 */
  elementType: RenderElementType = RenderElementType.StaticMesh;
  /** 着色器数据 */
  shaderData: ShaderData = new ShaderData();
  /** 是否使用实例化渲染 */
  useInstancing: boolean = false;
  /** 实例化数据缓冲区 */
  instanceBuffer: any = null;
  /** 实例化数量 */
  instanceCount: number = 0;
  /** 实例化着色器数据 */
  instanceShaderData: ShaderData[] = [];
  /** 自定义渲染函数 */
  customRender: ((renderElement: RenderElement) => void) | null = null;
  /** 子渲染元素列表 */
  subRenderElements: SubRenderElement[] = [];
  /** 渲染优先级 */
  priority: number = 0;
  /** 用于渲染排序的距离 */
  distanceForSort: number = 0;

  /**
   * 创建渲染元素
   * @param entity 关联的实体
   * @param mesh 网格数据
   * @param material 材质
   */
  constructor(entity: Entity, mesh: Mesh, material: Material) {
    this.entity = entity;
    this.mesh = mesh;
    this.material = material;

    // 创建一个默认的子渲染元素
    this.createDefaultSubRenderElement();
  }

  /**
   * 创建默认的子渲染元素
   */
  private createDefaultSubRenderElement(): void {
    const component = this.entity.getComponent('MeshRenderer') || this.entity.getComponent('SkinnedMeshRenderer');

    if (component && this.mesh && this.material) {
      const subElement = new SubRenderElement(component, this.material, this.mesh);

      this.subRenderElements.push(subElement);
    }
  }

  /**
   * 设置子材质索引
   * @param index 子材质索引
   * @returns 当前渲染元素实例
   */
  setSubMaterialIndex(index: number): RenderElement {
    this.subMaterialIndex = index;

    return this;
  }

  /**
   * 设置可见性
   * @param visible 是否可见
   * @returns 当前渲染元素实例
   */
  setVisible(visible: boolean): RenderElement {
    this.visible = visible;

    return this;
  }

  /**
   * 设置是否接收阴影
   * @param receive 是否接收阴影
   * @returns 当前渲染元素实例
   */
  setReceiveShadow(receive: boolean): RenderElement {
    this.receiveShadow = receive;

    return this;
  }

  /**
   * 设置是否投射阴影
   * @param cast 是否投射阴影
   * @returns 当前渲染元素实例
   */
  setCastShadow(cast: boolean): RenderElement {
    this.castShadow = cast;

    return this;
  }

  /**
   * 设置渲染层级
   * @param layer 渲染层级
   * @returns 当前渲染元素实例
   */
  setRenderLayer(layer: number): RenderElement {
    this.renderLayer = layer;

    return this;
  }

  /**
   * 设置渲染排序值
   * @param value 排序值
   * @returns 当前渲染元素实例
   */
  setSortingValue(value: number): RenderElement {
    this.sortingValue = value;

    return this;
  }

  /**
   * 设置渲染优先级
   * @param priority 优先级
   * @returns 当前渲染元素实例
   */
  setPriority(priority: number): RenderElement {
    this.priority = priority;
    if (this.subRenderElements.length > 0) {
      for (const subElement of this.subRenderElements) {
        subElement.setPriority(priority);
      }
    }

    return this;
  }

  /**
   * 设置排序距离
   * @param distance 距离
   * @returns 当前渲染元素实例
   */
  setDistanceForSort(distance: number): RenderElement {
    this.distanceForSort = distance;
    if (this.subRenderElements.length > 0) {
      for (const subElement of this.subRenderElements) {
        subElement.setDistanceForSort(distance);
      }
    }

    return this;
  }

  /**
   * 设置世界矩阵
   * @param matrix 世界矩阵
   * @returns 当前渲染元素实例
   */
  setWorldMatrix(matrix: Matrix4): RenderElement {
    this.worldMatrix.copyFrom(matrix);

    return this;
  }

  /**
   * 设置渲染元素类型
   * @param type 渲染元素类型
   * @returns 当前渲染元素实例
   */
  setElementType(type: RenderElementType): RenderElement {
    this.elementType = type;

    return this;
  }

  /**
   * 设置实例化渲染
   * @param useInstancing 是否使用实例化渲染
   * @param instanceCount 实例化数量
   * @param instanceBuffer 实例化数据缓冲区
   * @returns 当前渲染元素实例
   */
  setInstancing(useInstancing: boolean, instanceCount: number = 0, instanceBuffer: any = null): RenderElement {
    this.useInstancing = useInstancing;
    this.instanceCount = instanceCount;
    this.instanceBuffer = instanceBuffer;

    return this;
  }

  /**
   * 设置自定义渲染函数
   * @param renderFunction 自定义渲染函数
   * @returns 当前渲染元素实例
   */
  setCustomRender(renderFunction: ((renderElement: RenderElement) => void) | null): RenderElement {
    this.customRender = renderFunction;

    return this;
  }

  /**
   * 为实例化渲染添加着色器数据
   * @param instanceIndex 实例索引
   * @param data 着色器数据
   */
  addInstanceShaderData(instanceIndex: number, data: ShaderData): void {
    if (instanceIndex >= 0) {
      // 确保数组有足够的空间
      while (this.instanceShaderData.length <= instanceIndex) {
        this.instanceShaderData.push(new ShaderData());
      }

      // 合并着色器数据
      this.instanceShaderData[instanceIndex] = data;
    }
  }

  /**
   * 克隆渲染元素
   * @returns 新的渲染元素
   */
  clone(): RenderElement {
    const result = new RenderElement(this.entity, this.mesh, this.material);

    result.subMaterialIndex = this.subMaterialIndex;
    result.visible = this.visible;
    result.receiveShadow = this.receiveShadow;
    result.castShadow = this.castShadow;
    result.renderLayer = this.renderLayer;
    result.sortingValue = this.sortingValue;
    result.worldMatrix.copyFrom(this.worldMatrix);
    result.elementType = this.elementType;
    result.useInstancing = this.useInstancing;
    result.instanceCount = this.instanceCount;
    result.customRender = this.customRender;
    result.priority = this.priority;
    result.distanceForSort = this.distanceForSort;

    // 复制着色器数据
    for (const key of this.shaderData.getData()) {
      result.shaderData.setData(key, this.shaderData.getData()[key]);
    }

    // 复制实例化着色器数据
    for (let i = 0; i < this.instanceShaderData.length; i++) {
      const data = this.instanceShaderData[i];

      if (data) {
        const newData = new ShaderData();

        for (const key of data.getData()) {
          newData.setData(key, data.getData()[key]);
        }
        result.instanceShaderData[i] = newData;
      }
    }

    // 复制子渲染元素
    result.subRenderElements = this.subRenderElements.map((subElement) => subElement.clone());

    return result;
  }
}

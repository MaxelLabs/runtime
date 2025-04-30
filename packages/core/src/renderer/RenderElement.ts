import { Matrix4 } from '@maxellabs/math';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../material/Material';
import { ShaderData } from '../shader/ShaderData';
import { Entity } from '../base/Entity';

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
  Custom = 100
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
   * @returns 克隆的渲染元素
   */
  clone(): RenderElement {
    const clone = new RenderElement(this.entity, this.mesh, this.material);
    
    clone.subMaterialIndex = this.subMaterialIndex;
    clone.visible = this.visible;
    clone.receiveShadow = this.receiveShadow;
    clone.castShadow = this.castShadow;
    clone.renderLayer = this.renderLayer;
    clone.sortingValue = this.sortingValue;
    clone.worldMatrix.copyFrom(this.worldMatrix);
    clone.elementType = this.elementType;
    clone.useInstancing = this.useInstancing;
    clone.instanceCount = this.instanceCount;
    clone.instanceBuffer = this.instanceBuffer;
    clone.customRender = this.customRender;
    clone.shaderData = this.shaderData.clone();
    
    // 克隆实例化着色器数据
    for (const data of this.instanceShaderData) {
      clone.instanceShaderData.push(data.clone());
    }
    
    return clone;
  }
} 
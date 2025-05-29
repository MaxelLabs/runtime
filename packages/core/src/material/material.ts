/**
 * material.ts
 * 材质系统实现
 *
 * 基于规范包的Material接口实现，遵循规范包优先原则
 */

import { Resource, ResourceType } from '../resource/resource';
import {
  AlphaMode,
  MaterialType,
  UsdDataType,
  FillMode,
  CullMode,
  RHIBlendFactor,
  RHIBlendOperation,
  RHICompareFunction,
  RHIFrontFace,
} from '@maxellabs/math';
import type {
  MaterialProperties,
  UsdValue,
  IMaterial,
  ShaderNetwork,
  RenderState,
  MaterialProperty,
  TextureReference,
} from '@maxellabs/math';
import type { IRHIDevice } from '../interface/rhi/device';
import type { IRHITexture } from '../interface/rhi/resources/texture';
import type { IRHIBindGroup } from '../interface/rhi/bindings';
import type { EventListener } from '../base';
import { EventDispatcher } from '../base';

/**
 * 材质事件类型
 */
export enum MaterialEvent {
  /** 材质属性更新 */
  PROPERTY_UPDATED = 'propertyUpdated',
  /** 材质状态更新 */
  STATE_UPDATED = 'stateUpdated',
  /** 材质编译完成 */
  COMPILED = 'compiled',
  /** 材质编译失败 */
  COMPILE_FAILED = 'compileFailed',
}

/**
 * 材质实现类
 *
 * 实现规范包的Material接口，提供完整的材质功能
 */
export class Material extends Resource implements IMaterial {
  readonly typeName = 'Material' as const;

  /**
   * 材质路径（实现MaterialSpec接口）
   */
  readonly path: string;

  /**
   * 是否激活（实现MaterialSpec接口）
   */
  readonly active: boolean = true;

  /**
   * 材质属性
   */
  attributes: {
    name: UsdValue;
    materialType: UsdValue;
    doubleSided: UsdValue;
    opacity: UsdValue;
    alphaMode: UsdValue;
    alphaCutoff?: UsdValue;
  };

  /**
   * 着色器网络
   */
  shaderNetwork: ShaderNetwork;

  /**
   * 材质属性
   */
  properties: MaterialProperties;

  /**
   * 渲染状态
   */
  renderState?: RenderState;

  /**
   * 材质关系
   */
  relationships: Record<string, string[]> = {};

  /**
   * 子对象
   */
  children: any[] = [];

  /**
   * 元数据
   */
  override metadata: Record<string, any> = {};

  /**
   * 事件分发器
   */
  private eventEmitter = new EventDispatcher();

  /**
   * RHI设备引用
   */
  private device: IRHIDevice | null = null;

  /**
   * 材质绑定组
   */
  private bindGroup: IRHIBindGroup | null = null;

  /**
   * 纹理缓存
   */
  private textureCache = new Map<string, IRHITexture>();

  /**
   * 是否需要重新编译
   */
  private needsRecompile = true;

  /**
   * 构造函数
   */
  constructor(name: string = 'Material') {
    super(ResourceType.MATERIAL, name);

    // 初始化路径
    this.path = `/materials/${name}`;

    // 初始化默认属性
    this.attributes = {
      name: { value: name, type: UsdDataType.String },
      materialType: { value: MaterialType.Standard, type: UsdDataType.String },
      doubleSided: { value: false, type: UsdDataType.Bool },
      opacity: { value: 1.0, type: UsdDataType.Float },
      alphaMode: { value: AlphaMode.Opaque, type: UsdDataType.String },
    };

    // 初始化着色器网络
    this.shaderNetwork = {
      nodes: {},
      connections: [],
      outputNode: '',
    };

    // 初始化材质属性
    this.properties = {
      name: 'Default Material',
      type: MaterialType.Standard,
      baseColor: { r: 1, g: 1, b: 1, a: 1 },
      opacity: 1.0,
    };

    // 初始化默认渲染状态
    this.renderState = {
      blendState: {
        enabled: false,
        srcFactor: RHIBlendFactor.ONE,
        dstFactor: RHIBlendFactor.ZERO,
        operation: RHIBlendOperation.ADD,
      },
      depthState: {
        testEnabled: true,
        writeEnabled: true,
        compareFunction: RHICompareFunction.LESS,
      },
      rasterState: {
        fillMode: FillMode.Solid,
        cullMode: CullMode.Back,
        frontFace: RHIFrontFace.CCW,
        depthClampEnabled: false,
        scissorTestEnabled: false,
        multisampleEnabled: true,
        antialiasedLineEnabled: false,
      },
    };
  }

  /**
   * 设置RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
    this.needsRecompile = true;
  }

  /**
   * 获取材质类型
   */
  getMaterialType(): MaterialType {
    return this.attributes.materialType.value as MaterialType;
  }

  /**
   * 设置材质类型
   */
  setMaterialType(type: MaterialType): void {
    if (this.attributes.materialType.value !== type) {
      this.attributes.materialType.value = type;
      this.needsRecompile = true;
      this.eventEmitter.emit(MaterialEvent.PROPERTY_UPDATED, { property: 'materialType', value: type });
    }
  }

  /**
   * 获取透明度
   */
  getOpacity(): number {
    return this.attributes.opacity.value as number;
  }

  /**
   * 设置透明度
   */
  setOpacity(opacity: number): void {
    opacity = Math.max(0, Math.min(1, opacity));
    if (this.attributes.opacity.value !== opacity) {
      this.attributes.opacity.value = opacity;
      this.eventEmitter.emit(MaterialEvent.PROPERTY_UPDATED, { property: 'opacity', value: opacity });
    }
  }

  /**
   * 获取透明模式
   */
  getAlphaMode(): AlphaMode {
    return this.attributes.alphaMode.value as AlphaMode;
  }

  /**
   * 设置透明模式
   */
  setAlphaMode(mode: AlphaMode): void {
    if (this.attributes.alphaMode.value !== mode) {
      this.attributes.alphaMode.value = mode;
      this.updateBlendState(mode);
      this.eventEmitter.emit(MaterialEvent.PROPERTY_UPDATED, { property: 'alphaMode', value: mode });
    }
  }

  /**
   * 是否双面渲染
   */
  isDoubleSided(): boolean {
    return this.attributes.doubleSided.value as boolean;
  }

  /**
   * 设置双面渲染
   */
  setDoubleSided(doubleSided: boolean): void {
    if (this.attributes.doubleSided.value !== doubleSided) {
      this.attributes.doubleSided.value = doubleSided;
      this.updateCullMode(doubleSided);
      this.eventEmitter.emit(MaterialEvent.PROPERTY_UPDATED, { property: 'doubleSided', value: doubleSided });
    }
  }

  /**
   * 设置材质属性
   */
  setProperty(name: string, property: MaterialProperty): void {
    (this.properties as any)[name] = property;
    this.needsRecompile = true;
    this.eventEmitter.emit(MaterialEvent.PROPERTY_UPDATED, { property: name, value: property });
  }

  /**
   * 获取材质属性
   */
  getProperty(name: string): MaterialProperty | undefined {
    return (this.properties as any)[name];
  }

  /**
   * 设置纹理
   */
  setTexture(name: string, texture: TextureReference): void {
    this.setProperty(name, { texture });
  }

  /**
   * 获取纹理
   */
  getTexture(name: string): TextureReference | undefined {
    const property = this.getProperty(name);
    return property?.texture;
  }

  /**
   * 设置颜色属性
   */
  setColor(name: string, color: [number, number, number, number]): void {
    this.setProperty(name, { value: color });
  }

  /**
   * 设置浮点属性
   */
  setFloat(name: string, value: number): void {
    this.setProperty(name, { value });
  }

  /**
   * 编译材质
   */
  async compile(): Promise<void> {
    if (!this.device || !this.needsRecompile) {
      return;
    }

    try {
      // 创建材质绑定组
      await this.createBindGroup();

      this.needsRecompile = false;
      this.eventEmitter.emit(MaterialEvent.COMPILED, { material: this });
    } catch (error) {
      this.eventEmitter.emit(MaterialEvent.COMPILE_FAILED, { error, material: this });
      throw error;
    }
  }

  /**
   * 获取绑定组
   */
  getBindGroup(): IRHIBindGroup | null {
    return this.bindGroup;
  }

  /**
   * 监听材质事件
   */
  on<T extends MaterialEvent>(event: T, listener: EventListener): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 移除事件监听
   */
  off<T extends MaterialEvent>(event: T, listener: EventListener): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 克隆材质
   */
  clone(): Material {
    const cloned = new Material(this.name + '_clone');

    // 深拷贝属性
    cloned.attributes = JSON.parse(JSON.stringify(this.attributes));
    cloned.shaderNetwork = JSON.parse(JSON.stringify(this.shaderNetwork));
    cloned.properties = JSON.parse(JSON.stringify(this.properties));
    cloned.renderState = JSON.parse(JSON.stringify(this.renderState));

    cloned.setDevice(this.device!);
    return cloned;
  }

  /**
   * 销毁材质
   */
  override destroy(): void {
    // 清理绑定组
    if (this.bindGroup) {
      this.bindGroup.destroy();
      this.bindGroup = null;
    }

    // 清理纹理缓存
    for (const texture of this.textureCache.values()) {
      texture.destroy();
    }
    this.textureCache.clear();

    // 清理事件监听
    this.eventEmitter.destroy();

    super.destroy();
  }

  /**
   * 实现Resource基类的loadImpl方法
   */
  protected async loadImpl(url: string): Promise<void> {
    // 从URL加载材质数据的实现
    throw new Error('Material.loadImpl not implemented yet');
  }

  /**
   * 更新混合状态
   */
  private updateBlendState(alphaMode: AlphaMode): void {
    if (!this.renderState?.blendState) {
      return;
    }

    switch (alphaMode) {
      case AlphaMode.Opaque:
        this.renderState.blendState.enabled = false;
        break;
      case AlphaMode.Blend:
        this.renderState.blendState.enabled = true;
        this.renderState.blendState.srcFactor = RHIBlendFactor.SRC_ALPHA;
        this.renderState.blendState.dstFactor = RHIBlendFactor.ONE_MINUS_SRC_ALPHA;
        break;
      case AlphaMode.Mask:
        this.renderState.blendState.enabled = false;
        break;
    }

    this.needsRecompile = true;
  }

  /**
   * 更新剔除模式
   */
  private updateCullMode(doubleSided: boolean): void {
    if (!this.renderState?.rasterState) {
      return;
    }

    this.renderState.rasterState.cullMode = doubleSided ? CullMode.None : CullMode.Back;
    this.needsRecompile = true;
  }

  /**
   * 创建绑定组
   */
  private async createBindGroup(): Promise<void> {
    if (!this.device) {
      return;
    }

    // TODO: 实现绑定组创建逻辑
    // 这里需要根据材质属性创建相应的uniform缓冲区和纹理绑定

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating material bind group for:', this.name);
    }
  }

  /**
   * 获取材质ID
   */
  override getId(): string {
    return this.getPath();
  }

  /**
   * 获取透明度（1.0 - opacity）
   */
  getTransparency(): number {
    return 1.0 - this.getOpacity();
  }

  /**
   * 获取混合模式
   */
  getBlendMode(): string {
    const alphaMode = this.getAlphaMode();
    switch (alphaMode) {
      case AlphaMode.Opaque:
        return 'opaque';
      case AlphaMode.Blend:
        return 'alpha';
      case AlphaMode.Mask:
        return 'mask';
      default:
        return 'opaque';
    }
  }
}

/**
 * RenderContext.ts
 * 渲染上下文类
 *
 * 管理渲染过程中的全局状态和资源
 * 提供统一的渲染环境和状态管理
 */

import type { IRHIDevice, IRHICommandEncoder } from '../interface/rhi/device';
import type { IRHIBuffer } from '../interface/rhi/resources/buffer';
import type { IRHIBindGroup, IRHIBindGroupLayout } from '../interface/rhi/bindings';
import type { Camera } from '../camera/camera';
import type { Scene } from '../scene/scene';
import type { RendererOptions } from './Renderer';
import { Matrix4, Vector3, Vector4 } from '@maxellabs/math';
import { RHIBufferUsage, RHIShaderStage } from '../interface/rhi/types/enums';

/**
 * 全局uniform数据
 */
export interface GlobalUniforms {
  /**
   * 视图矩阵
   */
  viewMatrix: Matrix4;

  /**
   * 投影矩阵
   */
  projectionMatrix: Matrix4;

  /**
   * 视图投影矩阵
   */
  viewProjectionMatrix: Matrix4;

  /**
   * 逆视图矩阵
   */
  inverseViewMatrix: Matrix4;

  /**
   * 逆投影矩阵
   */
  inverseProjectionMatrix: Matrix4;

  /**
   * 相机位置
   */
  cameraPosition: Vector3;

  /**
   * 相机方向
   */
  cameraDirection: Vector3;

  /**
   * 视口大小
   */
  viewportSize: Vector4; // [width, height, 1/width, 1/height]

  /**
   * 时间信息
   */
  time: Vector4; // [time, deltaTime, frameCount, _unused]

  /**
   * 环境光颜色
   */
  ambientColor: Vector3;

  /**
   * 雾效参数
   */
  fogParams: Vector4; // [start, end, density, type]

  /**
   * 雾效颜色
   */
  fogColor: Vector3;
}

/**
 * 光照uniform数据
 */
export interface LightUniforms {
  /**
   * 光源数量
   */
  lightCount: number;

  /**
   * 方向光数据
   */
  directionalLights: DirectionalLightData[];

  /**
   * 点光源数据
   */
  pointLights: PointLightData[];

  /**
   * 聚光灯数据
   */
  spotLights: SpotLightData[];
}

/**
 * 方向光数据
 */
export interface DirectionalLightData {
  /**
   * 光照方向
   */
  direction: Vector3;

  /**
   * 光照颜色
   */
  color: Vector3;

  /**
   * 光照强度
   */
  intensity: number;

  /**
   * 阴影参数
   */
  shadowParams: Vector4; // [bias, normalBias, cascadeCount, _unused]

  /**
   * 阴影矩阵
   */
  shadowMatrices: Matrix4[];
}

/**
 * 点光源数据
 */
export interface PointLightData {
  /**
   * 光源位置
   */
  position: Vector3;

  /**
   * 光照颜色
   */
  color: Vector3;

  /**
   * 光照强度
   */
  intensity: number;

  /**
   * 衰减参数
   */
  attenuation: Vector3; // [constant, linear, quadratic]

  /**
   * 光照范围
   */
  range: number;
}

/**
 * 聚光灯数据
 */
export interface SpotLightData {
  /**
   * 光源位置
   */
  position: Vector3;

  /**
   * 光照方向
   */
  direction: Vector3;

  /**
   * 光照颜色
   */
  color: Vector3;

  /**
   * 光照强度
   */
  intensity: number;

  /**
   * 衰减参数
   */
  attenuation: Vector3; // [constant, linear, quadratic]

  /**
   * 光锥参数
   */
  coneParams: Vector4; // [innerCone, outerCone, range, _unused]
}

/**
 * 渲染上下文类
 *
 * 管理渲染过程中的全局状态，包括：
 * - 相机和场景信息
 * - 全局uniform缓冲区
 * - 光照数据
 * - 渲染状态
 */
export class RenderContext {
  /**
   * 渲染设备
   */
  readonly device: IRHIDevice;

  /**
   * 渲染器配置
   */
  readonly options: Required<RendererOptions>;

  /**
   * 当前相机
   */
  private currentCamera: Camera | null = null;

  /**
   * 当前场景
   */
  private currentScene: Scene | null = null;

  /**
   * 全局uniform数据
   */
  private globalUniforms: GlobalUniforms;

  /**
   * 光照uniform数据
   */
  private lightUniforms: LightUniforms;

  /**
   * 全局uniform缓冲区
   */
  private globalUniformBuffer: IRHIBuffer | null = null;

  /**
   * 光照uniform缓冲区
   */
  private lightUniformBuffer: IRHIBuffer | null = null;

  /**
   * 全局绑定组布局
   */
  private globalBindGroupLayout: IRHIBindGroupLayout | null = null;

  /**
   * 全局绑定组
   */
  private globalBindGroup: IRHIBindGroup | null = null;

  /**
   * 当前命令编码器
   */
  private currentCommandEncoder: IRHICommandEncoder | null = null;

  /**
   * 帧计数器
   */
  private frameCount = 0;

  /**
   * 开始时间
   */
  private startTime = performance.now();

  /**
   * 上一帧时间
   */
  private lastFrameTime = performance.now();

  /**
   * 是否已初始化
   */
  private initialized = false;

  /**
   * 构造函数
   */
  constructor(device: IRHIDevice, options: Required<RendererOptions>) {
    this.device = device;
    this.options = options;

    // 初始化uniform数据
    this.globalUniforms = {
      viewMatrix: new Matrix4(),
      projectionMatrix: new Matrix4(),
      viewProjectionMatrix: new Matrix4(),
      inverseViewMatrix: new Matrix4(),
      inverseProjectionMatrix: new Matrix4(),
      cameraPosition: new Vector3(),
      cameraDirection: new Vector3(0, 0, -1),
      viewportSize: new Vector4(),
      time: new Vector4(),
      ambientColor: new Vector3(0.1, 0.1, 0.1),
      fogParams: new Vector4(100, 1000, 0.001, 0),
      fogColor: new Vector3(0.5, 0.5, 0.5),
    };

    this.lightUniforms = {
      lightCount: 0,
      directionalLights: [],
      pointLights: [],
      spotLights: [],
    };
  }

  /**
   * 初始化渲染上下文
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 创建uniform缓冲区
      await this.createUniformBuffers();

      // 创建绑定组布局
      await this.createBindGroupLayouts();

      // 创建绑定组
      await this.createBindGroups();

      this.initialized = true;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('RenderContext initialized successfully');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize RenderContext:', error);
      throw error;
    }
  }

  /**
   * 更新渲染上下文
   */
  update(camera: Camera, scene: Scene): void {
    this.currentCamera = camera;
    this.currentScene = scene;

    // 更新时间信息
    this.updateTimeInfo();

    // 更新相机信息
    this.updateCameraInfo(camera);

    // 更新光照信息
    this.updateLightInfo(scene);

    // 更新uniform缓冲区
    this.updateUniformBuffers();
  }

  /**
   * 设置命令编码器
   */
  setCommandEncoder(encoder: IRHICommandEncoder): void {
    this.currentCommandEncoder = encoder;
  }

  /**
   * 获取命令编码器
   */
  getCommandEncoder(): IRHICommandEncoder | null {
    return this.currentCommandEncoder;
  }

  /**
   * 获取当前相机
   */
  getCamera(): Camera | null {
    return this.currentCamera;
  }

  /**
   * 获取当前场景
   */
  getScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * 获取全局uniform数据
   */
  getGlobalUniforms(): Readonly<GlobalUniforms> {
    return this.globalUniforms;
  }

  /**
   * 获取光照uniform数据
   */
  getLightUniforms(): Readonly<LightUniforms> {
    return this.lightUniforms;
  }

  /**
   * 获取全局绑定组
   */
  getGlobalBindGroup(): IRHIBindGroup | null {
    return this.globalBindGroup;
  }

  /**
   * 获取全局绑定组布局
   */
  getGlobalBindGroupLayout(): IRHIBindGroupLayout | null {
    return this.globalBindGroupLayout;
  }

  /**
   * 重置大小
   */
  resize(width: number, height: number): void {
    this.globalUniforms.viewportSize.set(width, height, 1.0 / width, 1.0 / height);
  }

  /**
   * 销毁渲染上下文
   */
  destroy(): void {
    // 销毁缓冲区
    if (this.globalUniformBuffer) {
      this.globalUniformBuffer.destroy();
      this.globalUniformBuffer = null;
    }

    if (this.lightUniformBuffer) {
      this.lightUniformBuffer.destroy();
      this.lightUniformBuffer = null;
    }

    // 销毁绑定组
    if (this.globalBindGroup) {
      this.globalBindGroup.destroy();
      this.globalBindGroup = null;
    }

    if (this.globalBindGroupLayout) {
      this.globalBindGroupLayout.destroy();
      this.globalBindGroupLayout = null;
    }

    // 重置状态
    this.initialized = false;
    this.currentCamera = null;
    this.currentScene = null;
    this.currentCommandEncoder = null;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('RenderContext destroyed');
    }
  }

  /**
   * 创建uniform缓冲区
   */
  private async createUniformBuffers(): Promise<void> {
    // 计算全局uniform缓冲区大小
    const globalUniformSize = this.calculateGlobalUniformSize();

    this.globalUniformBuffer = this.device.createBuffer({
      size: globalUniformSize,
      usage: RHIBufferUsage.UNIFORM | RHIBufferUsage.COPY_DST,
      label: 'GlobalUniformBuffer',
    });

    // 计算光照uniform缓冲区大小
    const lightUniformSize = this.calculateLightUniformSize();

    this.lightUniformBuffer = this.device.createBuffer({
      size: lightUniformSize,
      usage: RHIBufferUsage.UNIFORM | RHIBufferUsage.COPY_DST,
      label: 'LightUniformBuffer',
    });
  }

  /**
   * 创建绑定组布局
   */
  private async createBindGroupLayouts(): Promise<void> {
    this.globalBindGroupLayout = this.device.createBindGroupLayout(
      [
        {
          binding: 0,
          visibility: RHIShaderStage.VERTEX | RHIShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 1,
          visibility: RHIShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
      ],
      'GlobalBindGroupLayout'
    );
  }

  /**
   * 创建绑定组
   */
  private async createBindGroups(): Promise<void> {
    if (!this.globalBindGroupLayout || !this.globalUniformBuffer || !this.lightUniformBuffer) {
      throw new Error('Required resources not created');
    }

    this.globalBindGroup = this.device.createBindGroup(
      this.globalBindGroupLayout,
      [
        {
          binding: 0,
          resource: {
            buffer: this.globalUniformBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.lightUniformBuffer,
          },
        },
      ],
      'GlobalBindGroup'
    );
  }

  /**
   * 更新时间信息
   */
  private updateTimeInfo(): void {
    const currentTime = performance.now();
    const elapsedTime = (currentTime - this.startTime) / 1000; // 转换为秒
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;

    this.globalUniforms.time.set(elapsedTime, deltaTime, this.frameCount, 0);

    this.frameCount++;
    this.lastFrameTime = currentTime;
  }

  /**
   * 更新相机信息
   */
  private updateCameraInfo(camera: Camera): void {
    // 获取相机矩阵
    const viewMatrix = camera.getViewMatrix();
    const projectionMatrix = camera.getProjectionMatrix();

    // 更新矩阵
    this.globalUniforms.viewMatrix.copyFrom(viewMatrix);
    this.globalUniforms.projectionMatrix.copyFrom(projectionMatrix);
    this.globalUniforms.viewProjectionMatrix.multiplyMatrices(projectionMatrix, viewMatrix);

    // 计算逆矩阵
    this.globalUniforms.inverseViewMatrix.copyFrom(viewMatrix).invert();
    this.globalUniforms.inverseProjectionMatrix.copyFrom(projectionMatrix).invert();

    // 更新相机位置和方向
    const cameraPosition = camera.getPosition();
    const cameraDirection = camera.getForward();

    this.globalUniforms.cameraPosition.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    this.globalUniforms.cameraDirection.set(cameraDirection.x, cameraDirection.y, cameraDirection.z);
  }

  /**
   * 更新光照信息
   */
  private updateLightInfo(scene: Scene): void {
    // TODO: 实现光照信息收集
    // 这里需要遍历场景中的所有光源
    // 并将它们分类到不同的光源类型中

    // 临时实现
    this.lightUniforms.lightCount = 0;
    this.lightUniforms.directionalLights.length = 0;
    this.lightUniforms.pointLights.length = 0;
    this.lightUniforms.spotLights.length = 0;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Updating light info for scene:', scene.name);
    }
  }

  /**
   * 更新uniform缓冲区
   */
  private updateUniformBuffers(): void {
    if (!this.globalUniformBuffer || !this.lightUniformBuffer) {
      return;
    }

    // 更新全局uniform缓冲区
    const globalData = this.serializeGlobalUniforms();
    this.writeBuffer(this.globalUniformBuffer, 0, globalData);

    // 更新光照uniform缓冲区
    const lightData = this.serializeLightUniforms();
    this.writeBuffer(this.lightUniformBuffer, 0, lightData);
  }

  /**
   * 写入缓冲区数据
   */
  private writeBuffer(buffer: IRHIBuffer, offset: number, data: ArrayBuffer): void {
    // TODO: 实现缓冲区写入
    // 这里需要根据具体的RHI实现来写入数据
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Writing buffer data:', buffer, offset, data.byteLength);
    }
  }

  /**
   * 序列化全局uniform数据
   */
  private serializeGlobalUniforms(): ArrayBuffer {
    // TODO: 实现uniform数据序列化
    // 这里需要将uniform数据打包成GPU可读的格式

    // 临时实现，返回空缓冲区
    return new ArrayBuffer(256);
  }

  /**
   * 序列化光照uniform数据
   */
  private serializeLightUniforms(): ArrayBuffer {
    // TODO: 实现光照数据序列化
    // 这里需要将光照数据打包成GPU可读的格式

    // 临时实现，返回空缓冲区
    return new ArrayBuffer(1024);
  }

  /**
   * 计算全局uniform缓冲区大小
   */
  private calculateGlobalUniformSize(): number {
    // Matrix4 = 64 bytes each
    // Vector4 = 16 bytes each
    // Vector3 = 12 bytes each (但GPU对齐到16字节)

    return (
      64 * 5 + // 5个Matrix4
      16 * 3 + // 3个Vector4
      16 * 4 // 4个Vector3 (对齐到16字节)
    );
  }

  /**
   * 计算光照uniform缓冲区大小
   */
  private calculateLightUniformSize(): number {
    // 预留足够的空间给最大数量的光源
    const maxLights = this.options.maxLights;

    return (
      16 + // lightCount + padding
      maxLights * 80 + // 每个方向光80字节
      maxLights * 48 + // 每个点光源48字节
      maxLights * 64 // 每个聚光灯64字节
    );
  }
}

/**
 * camera/OrbitController.ts
 * 轨道相机控制器 - 支持鼠标/触摸交互的 3D 相机控制
 */

import { MMath } from '@maxellabs/core';
import type { OrbitControllerConfig } from './types';

/**
 * 轨道相机控制器
 *
 * 提供类似 Three.js OrbitControls 的相机控制：
 * - 鼠标左键拖动：旋转
 * - 鼠标滚轮：缩放
 * - 鼠标右键/中键拖动：平移
 *
 * @example
 * ```typescript
 * const orbit = new OrbitController(canvas, {
 *   distance: 5,
 *   target: [0, 0, 0],
 * });
 *
 * // 在渲染循环中更新
 * runner.start((dt) => {
 *   orbit.update(dt);
 *
 *   // 获取矩阵
 *   const viewMatrix = orbit.getViewMatrix();
 *   const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
 * });
 * ```
 */
export class OrbitController {
  // 配置参数
  private target: MMath.Vector3;
  private distance: number;
  private minDistance: number;
  private maxDistance: number;
  private azimuth: number; // 水平角（绕 Y 轴）
  private elevation: number; // 垂直角（绕 X 轴）
  private minElevation: number;
  private maxElevation: number;
  private rotateSpeed: number;
  private zoomSpeed: number;
  private panSpeed: number;
  private enableDamping: boolean;
  private dampingFactor: number;
  private autoRotate: boolean;
  private autoRotateSpeed: number;

  // 相机参数
  private fov: number;
  private near: number;
  private far: number;

  // 内部状态
  private canvas: HTMLCanvasElement;
  private isDragging: boolean = false;
  private dragButton: number = -1;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // 初始状态（用于 reset）
  private initialTarget: MMath.Vector3;
  private initialDistance: number;
  private initialAzimuth: number;
  private initialElevation: number;

  // 阻尼状态
  private targetAzimuth: number;
  private targetElevation: number;
  private targetDistance: number;
  private targetCenter: MMath.Vector3;

  // 矩阵缓存
  private viewMatrix: MMath.Matrix4;
  private projectionMatrix: MMath.Matrix4;
  private position: MMath.Vector3;

  // 常量向量缓存（避免每帧创建）
  private readonly upVector: MMath.Vector3;

  // 输出数组缓存（避免每帧创建）
  private viewMatrixArray: Float32Array;
  private projectionMatrixArray: Float32Array;
  private viewProjectionMatrix: MMath.Matrix4;
  private viewProjectionMatrixArray: Float32Array;

  // 事件监听器引用
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnContextMenu: (e: Event) => void;

  /**
   * 创建轨道控制器
   * @param canvas 画布元素
   * @param config 配置选项
   */
  constructor(canvas: HTMLCanvasElement, config: OrbitControllerConfig = {}) {
    this.canvas = canvas;

    // 初始化配置
    this.target = new MMath.Vector3(config.target?.[0] ?? 0, config.target?.[1] ?? 0, config.target?.[2] ?? 0);
    this.distance = config.distance ?? 5;
    this.minDistance = config.minDistance ?? 1;
    this.maxDistance = config.maxDistance ?? 100;
    this.azimuth = config.azimuth ?? 0;
    this.elevation = config.elevation ?? Math.PI / 6; // 30度
    this.minElevation = config.minElevation ?? -Math.PI / 2 + 0.1;
    this.maxElevation = config.maxElevation ?? Math.PI / 2 - 0.1;
    this.rotateSpeed = config.rotateSpeed ?? 0.005;
    this.zoomSpeed = config.zoomSpeed ?? 0.1;
    this.panSpeed = config.panSpeed ?? 0.01;
    this.enableDamping = config.enableDamping ?? true;
    this.dampingFactor = config.dampingFactor ?? 0.1;
    this.autoRotate = config.autoRotate ?? false;
    this.autoRotateSpeed = config.autoRotateSpeed ?? 0.5;

    // 相机参数
    this.fov = 45; // 45度（角度值，perspective 方法内部会转换为弧度）
    this.near = 0.1;
    this.far = 1000;

    // 保存初始状态（用于 reset）
    this.initialTarget = this.target.clone();
    this.initialDistance = this.distance;
    this.initialAzimuth = this.azimuth;
    this.initialElevation = this.elevation;

    // 初始化阻尼目标
    this.targetAzimuth = this.azimuth;
    this.targetElevation = this.elevation;
    this.targetDistance = this.distance;
    this.targetCenter = this.target.clone();

    // 初始化矩阵
    this.viewMatrix = new MMath.Matrix4();
    this.projectionMatrix = new MMath.Matrix4();
    this.position = new MMath.Vector3();

    // 初始化常量向量
    this.upVector = new MMath.Vector3(0, 1, 0);

    // 初始化输出数组缓存
    this.viewMatrixArray = new Float32Array(16);
    this.projectionMatrixArray = new Float32Array(16);
    this.viewProjectionMatrix = new MMath.Matrix4();
    this.viewProjectionMatrixArray = new Float32Array(16);

    // 绑定事件处理器
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = (e: Event) => e.preventDefault();

    // 设置事件监听
    this.setupEventListeners();

    // 初始更新
    this.updateMatrices();
  }

  // ==================== 公开属性 ====================

  /** 获取相机位置 */
  getPosition(): MMath.Vector3 {
    return this.position.clone();
  }

  /** 获取目标位置 */
  getTarget(): MMath.Vector3 {
    return this.target.clone();
  }

  /** 设置目标位置 */
  setTarget(x: number, y: number, z: number): void {
    this.targetCenter.set(x, y, z);
    if (!this.enableDamping) {
      this.target.set(x, y, z);
      this.updateMatrices();
    }
  }

  /** 获取距离 */
  getDistance(): number {
    return this.distance;
  }

  /** 设置距离 */
  setDistance(distance: number): void {
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    if (!this.enableDamping) {
      this.distance = this.targetDistance;
      this.updateMatrices();
    }
  }

  /** 获取方位角 */
  getAzimuth(): number {
    return this.azimuth;
  }

  /** 设置方位角 */
  setAzimuth(azimuth: number): void {
    this.targetAzimuth = azimuth;
    if (!this.enableDamping) {
      this.azimuth = azimuth;
      this.updateMatrices();
    }
  }

  /** 获取仰角 */
  getElevation(): number {
    return this.elevation;
  }

  /** 设置仰角 */
  setElevation(elevation: number): void {
    this.targetElevation = Math.max(this.minElevation, Math.min(this.maxElevation, elevation));
    if (!this.enableDamping) {
      this.elevation = this.targetElevation;
      this.updateMatrices();
    }
  }

  /** 启用/禁用自动旋转 */
  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  /** 设置自动旋转速度 */
  setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = speed;
  }

  /**
   * 重置相机到初始状态
   */
  reset(): void {
    this.targetCenter.copyFrom(this.initialTarget);
    this.targetDistance = this.initialDistance;
    this.targetAzimuth = this.initialAzimuth;
    this.targetElevation = this.initialElevation;

    // 如果没有启用阻尼，立即应用
    if (!this.enableDamping) {
      this.target.copyFrom(this.initialTarget);
      this.distance = this.initialDistance;
      this.azimuth = this.initialAzimuth;
      this.elevation = this.initialElevation;
      this.updateMatrices();
    }
  }

  // ==================== 矩阵获取 ====================

  /**
   * 获取视图矩阵
   * @returns 视图矩阵的 Float32Array（内部缓存，请勿修改）
   */
  getViewMatrix(): Float32Array {
    const arr = this.viewMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.viewMatrixArray[i] = arr[i];
    }
    return this.viewMatrixArray;
  }

  /**
   * 获取投影矩阵
   * @param aspect 宽高比
   * @returns 投影矩阵的 Float32Array（内部缓存，请勿修改）
   */
  getProjectionMatrix(aspect: number): Float32Array {
    this.projectionMatrix.perspective(this.fov, aspect, this.near, this.far);
    const arr = this.projectionMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.projectionMatrixArray[i] = arr[i];
    }
    return this.projectionMatrixArray;
  }

  /**
   * 获取视图投影矩阵
   * @param aspect 宽高比
   * @returns 视图投影矩阵的 Float32Array（内部缓存，请勿修改）
   */
  getViewProjectionMatrix(aspect: number): Float32Array {
    this.viewProjectionMatrix.perspective(this.fov, aspect, this.near, this.far);
    this.viewProjectionMatrix.multiply(this.viewMatrix);
    const arr = this.viewProjectionMatrix.toArray();
    for (let i = 0; i < 16; i++) {
      this.viewProjectionMatrixArray[i] = arr[i];
    }
    return this.viewProjectionMatrixArray;
  }

  // ==================== 更新 ====================

  /**
   * 更新控制器（在渲染循环中调用）
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    // 自动旋转
    if (this.autoRotate && !this.isDragging) {
      this.targetAzimuth += this.autoRotateSpeed * deltaTime;
    }

    // 阻尼平滑
    if (this.enableDamping) {
      const factor = 1 - Math.pow(1 - this.dampingFactor, deltaTime * 60);

      this.azimuth += (this.targetAzimuth - this.azimuth) * factor;
      this.elevation += (this.targetElevation - this.elevation) * factor;
      this.distance += (this.targetDistance - this.distance) * factor;

      this.target.x += (this.targetCenter.x - this.target.x) * factor;
      this.target.y += (this.targetCenter.y - this.target.y) * factor;
      this.target.z += (this.targetCenter.z - this.target.z) * factor;
    } else {
      this.azimuth = this.targetAzimuth;
      this.elevation = this.targetElevation;
      this.distance = this.targetDistance;
      this.target.copyFrom(this.targetCenter);
    }

    // 更新矩阵
    this.updateMatrices();
  }

  /**
   * 销毁控制器
   */
  destroy(): void {
    this.removeEventListeners();
  }

  // ==================== 私有方法 ====================

  /** 更新视图矩阵 */
  private updateMatrices(): void {
    // 球面坐标转笛卡尔坐标
    const cosElevation = Math.cos(this.elevation);
    const sinElevation = Math.sin(this.elevation);
    const cosAzimuth = Math.cos(this.azimuth);
    const sinAzimuth = Math.sin(this.azimuth);

    this.position.set(
      this.target.x + this.distance * cosElevation * sinAzimuth,
      this.target.y + this.distance * sinElevation,
      this.target.z + this.distance * cosElevation * cosAzimuth
    );

    // 构建视图矩阵（使用缓存的 up 向量）
    this.viewMatrix.lookAt(this.position, this.target, this.upVector);
  }

  /** 设置事件监听 */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.boundOnMouseDown);
    this.canvas.addEventListener('wheel', this.boundOnWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.boundOnContextMenu);

    // 在 window 上监听 move 和 up，以便在鼠标移出画布后继续响应
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
  }

  /** 移除事件监听 */
  private removeEventListeners(): void {
    this.canvas.removeEventListener('mousedown', this.boundOnMouseDown);
    this.canvas.removeEventListener('wheel', this.boundOnWheel);
    this.canvas.removeEventListener('contextmenu', this.boundOnContextMenu);

    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
  }

  /** 鼠标按下 */
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.dragButton = event.button;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /** 鼠标移动 */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    if (this.dragButton === 0) {
      // 左键：旋转
      this.targetAzimuth -= deltaX * this.rotateSpeed;
      this.targetElevation += deltaY * this.rotateSpeed;
      this.targetElevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.targetElevation));
    } else if (this.dragButton === 2 || this.dragButton === 1) {
      // 右键/中键：平移
      const panX = deltaX * this.panSpeed * this.distance * 0.1;
      const panY = deltaY * this.panSpeed * this.distance * 0.1;

      // 计算平移方向（相机坐标系）
      const cosAzimuth = Math.cos(this.azimuth);
      const sinAzimuth = Math.sin(this.azimuth);

      this.targetCenter.x -= panX * cosAzimuth;
      this.targetCenter.z += panX * sinAzimuth;
      this.targetCenter.y += panY;
    }
  }

  /** 鼠标释放 */
  private onMouseUp(): void {
    this.isDragging = false;
    this.dragButton = -1;
  }

  /** 滚轮缩放 */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 1 : -1;
    this.targetDistance *= 1 + delta * this.zoomSpeed;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }
}

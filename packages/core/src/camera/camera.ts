import { Component } from '../base/component';
import type { Entity } from '../base/entity';
import { Vector3, Matrix4 } from '@maxellabs/math';
import { ObjectPool } from '../base/object-pool';
import { EventDispatcher } from '../base';

/**
 * 相机事件类型
 */
export enum CameraEvent {
  /** 相机投影矩阵更新 */
  PROJECTION_MATRIX_UPDATED = 'projectionMatrixUpdated',
  /** 相机视图矩阵更新 */
  VIEW_MATRIX_UPDATED = 'viewMatrixUpdated',
  /** 相机启用 */
  CAMERA_ENABLED = 'cameraEnabled',
  /** 相机更新 */
  CAMERA_UPDATE = 'cameraUpdate',
  /** 相机销毁前 */
  BEFORE_CAMERA_DESTROY = 'beforeCameraDestroy',
  /** 相机销毁后 */
  CAMERA_DESTROYED = 'cameraDestroyed',
}

/**
 * 摄像机投影类型
 */
export enum ProjectionType {
  /** 透视投影 */
  Perspective,
  /** 正交投影 */
  Orthographic,
}

/**
 * 摄像机组件，用于渲染场景
 */
export class Camera extends Component {
  /** 摄像机视野角度（度数） */
  private fov: number = 60;
  /** 摄像机近裁剪面 */
  private near: number = 0.1;
  /** 摄像机远裁剪面 */
  private far: number = 1000;
  /** 摄像机宽高比 */
  private aspect: number = 16 / 9;
  /** 摄像机投影类型 */
  private projectionType: ProjectionType = ProjectionType.Perspective;
  /** 正交投影尺寸（高度的一半） */
  private orthographicSize: number = 5;
  /** 投影矩阵 */
  private projectionMatrix: Matrix4 = new Matrix4();
  /** 视图矩阵 */
  private viewMatrix: Matrix4 = new Matrix4();
  /** 是否需要更新投影矩阵 */
  private projectionDirty: boolean = true;
  /** 是否需要更新视图矩阵 */
  private viewDirty: boolean = true;
  /** 视口矩形（x, y, width, height）*/
  private viewport: [number, number, number, number] = [0, 0, 1, 1];
  /** 渲染优先级（数值越小优先级越高） */
  private priority: number = 0;
  /** 背景颜色 */
  private backgroundColor: [number, number, number, number] = [0, 0, 0, 1];
  /** 是否清除深度缓冲 */
  private clearDepth: boolean = true;
  /** 是否清除颜色缓冲 */
  private clearColor: boolean = true;
  /** 矩阵对象池 */
  private static readonly matrixPool = new ObjectPool<Matrix4>(
    'cameraMatrixPool',
    () => new Matrix4(),
    (matrix) => matrix.identity(),
    10,
    50
  );
  /** 向量对象池 */
  private static readonly vectorPool = new ObjectPool<Vector3>(
    'cameraVectorPool',
    () => new Vector3(),
    (vector) => vector.set(0, 0, 0),
    10,
    50
  );

  eventDispatcher: EventDispatcher = new EventDispatcher();

  /**
   * 创建一个新的摄像机组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity);
  }

  /**
   * 获取视野角度（度数）
   */
  getFov(): number {
    return this.fov;
  }

  /**
   * 设置视野角度（度数）
   */
  setFov(value: number): this {
    if (this.fov !== value) {
      this.fov = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取近裁剪面距离
   */
  getNear(): number {
    return this.near;
  }

  /**
   * 设置近裁剪面距离
   */
  setNear(value: number): this {
    if (this.near !== value) {
      this.near = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取远裁剪面距离
   */
  getFar(): number {
    return this.far;
  }

  /**
   * 设置远裁剪面距离
   */
  setFar(value: number): this {
    if (this.far !== value) {
      this.far = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取宽高比
   */
  getAspect(): number {
    return this.aspect;
  }

  /**
   * 设置宽高比
   */
  setAspect(value: number): this {
    if (this.aspect !== value) {
      this.aspect = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取投影类型
   */
  getProjectionType(): ProjectionType {
    return this.projectionType;
  }

  /**
   * 设置投影类型
   */
  setProjectionType(value: ProjectionType): this {
    if (this.projectionType !== value) {
      this.projectionType = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取正交投影尺寸（高度的一半）
   */
  getOrthographicSize(): number {
    return this.orthographicSize;
  }

  /**
   * 设置正交投影尺寸（高度的一半）
   */
  setOrthographicSize(value: number): this {
    if (this.orthographicSize !== value) {
      this.orthographicSize = value;
      this.projectionDirty = true;
    }

    return this;
  }

  /**
   * 获取视口矩形（x, y, width, height）
   */
  getViewport(): [number, number, number, number] {
    return [...this.viewport];
  }

  /**
   * 设置视口矩形（x, y, width, height）
   */
  setViewport(value: [number, number, number, number]): this {
    this.viewport = [...value];

    return this;
  }

  /**
   * 获取渲染优先级（数值越小优先级越高）
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * 设置渲染优先级（数值越小优先级越高）
   */
  setPriority(value: number): this {
    this.priority = value;

    return this;
  }

  /**
   * 获取背景颜色
   */
  getBackgroundColor(): [number, number, number, number] {
    return [...this.backgroundColor];
  }

  /**
   * 设置背景颜色
   */
  setBackgroundColor(value: [number, number, number, number]): this {
    this.backgroundColor = [...value];

    return this;
  }

  /**
   * 获取是否清除深度缓冲
   */
  getClearDepth(): boolean {
    return this.clearDepth;
  }

  /**
   * 设置是否清除深度缓冲
   */
  setClearDepth(value: boolean): this {
    this.clearDepth = value;

    return this;
  }

  /**
   * 获取是否清除颜色缓冲
   */
  getClearColor(): boolean {
    return this.clearColor;
  }

  /**
   * 设置是否清除颜色缓冲
   */
  setClearColor(value: boolean): this {
    this.clearColor = value;

    return this;
  }

  /**
   * 获取投影矩阵
   */
  getProjectionMatrix(): Matrix4 {
    if (this.projectionDirty) {
      this.updateProjectionMatrix();
    }

    // 使用对象池获取矩阵并复制
    const result = Camera.matrixPool.get();

    result.copyFrom(this.projectionMatrix);

    return result;
  }

  /**
   * 获取视图矩阵
   */
  getViewMatrix(): Matrix4 {
    if (this.viewDirty) {
      this.updateViewMatrix();
    }

    // 使用对象池获取矩阵并复制
    const result = Camera.matrixPool.get();

    result.copyFrom(this.viewMatrix);

    return result;
  }

  /**
   * 获取视图投影矩阵（VP矩阵）
   */
  getViewProjectionMatrix(): Matrix4 {
    const projMatrix = this.getProjectionMatrix();
    const viewMatrix = this.getViewMatrix();

    const result = Matrix4.multiply(projMatrix, viewMatrix, projMatrix);

    // 释放视图矩阵回对象池
    Camera.matrixPool.release(viewMatrix);

    return result;
  }

  /**
   * 更新投影矩阵
   */
  private updateProjectionMatrix(): void {
    if (this.projectionType === ProjectionType.Perspective) {
      // 透视投影
      this.projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
    } else {
      // 正交投影
      const height = this.orthographicSize * 2;
      const width = height * this.aspect;

      this.projectionMatrix.orthographic(-width / 2, width / 2, -height / 2, height / 2, this.near, this.far);
    }
    this.projectionDirty = false;

    // 派发事件通知投影矩阵已更新
    this.eventDispatcher.dispatchEvent(CameraEvent.PROJECTION_MATRIX_UPDATED, { camera: this });
  }

  /**
   * 更新视图矩阵
   */
  private updateViewMatrix(): void {
    // 获取实体的世界矩阵并求逆
    const worldMatrix = this.entity.transform.getWorldMatrix();

    this.viewMatrix.copyFrom(worldMatrix).invert();
    this.viewDirty = false;

    // 派发事件通知视图矩阵已更新
    this.eventDispatcher.dispatchEvent(CameraEvent.VIEW_MATRIX_UPDATED, { camera: this });
  }

  /**
   * 将世界坐标点转换为屏幕坐标
   * @param worldPosition 世界坐标点
   * @param screenWidth 屏幕宽度
   * @param screenHeight 屏幕高度
   * @returns 屏幕坐标点[x, y]，x和y范围都是0到1
   */
  worldToScreenPoint(worldPosition: Vector3, screenWidth: number, screenHeight: number): [number, number] {
    // 获取对象池中的向量和矩阵
    const tempVec = Camera.vectorPool.get();
    const vpMatrix = this.getViewProjectionMatrix();

    // 应用变换
    tempVec.copyFrom(worldPosition);
    vpMatrix.transformPoint(tempVec, tempVec);

    // 归一化坐标
    const ndcX = tempVec.x;
    const ndcY = tempVec.y;

    // 从NDC空间转换到屏幕空间
    const screenX = (ndcX + 1) * 0.5;
    const screenY = (1 - ndcY) * 0.5; // Y轴翻转

    // 释放资源回对象池
    Camera.vectorPool.release(tempVec);
    Camera.matrixPool.release(vpMatrix);

    return [screenX, screenY];
  }

  /**
   * 从屏幕坐标创建射线
   * @param screenX 屏幕X坐标(0-1)
   * @param screenY 屏幕Y坐标(0-1)
   * @returns 射线{origin, direction}
   */
  screenPointToRay(screenX: number, screenY: number): { origin: Vector3; direction: Vector3 } {
    // 使用对象池获取向量
    const origin = Camera.vectorPool.get();
    const direction = Camera.vectorPool.get();

    // 获取投影矩阵和视图矩阵的逆矩阵
    const projMatrix = this.getProjectionMatrix();
    const viewMatrix = this.getViewMatrix();

    // 创建逆视图投影矩阵
    const invViewProj = Camera.matrixPool.get();

    invViewProj.copyFrom(projMatrix).multiply(viewMatrix).invert();

    // 计算归一化设备坐标
    const ndcX = screenX * 2 - 1;
    const ndcY = 1 - screenY * 2; // Y轴翻转

    // 计算远近平面上的点
    const nearPoint = Camera.vectorPool.get().set(ndcX, ndcY, -1);
    const farPoint = Camera.vectorPool.get().set(ndcX, ndcY, 1);

    // 转换到世界空间
    invViewProj.transformPoint(nearPoint, origin);
    invViewProj.transformPoint(farPoint, farPoint);

    // 计算方向向量(归一化)
    direction.subtractVectors(farPoint, origin).normalize();

    // 释放资源回对象池
    Camera.vectorPool.release(nearPoint);
    Camera.vectorPool.release(farPoint);
    Camera.matrixPool.release(invViewProj);
    Camera.matrixPool.release(projMatrix);
    Camera.matrixPool.release(viewMatrix);

    return { origin, direction };
  }

  /**
   * 组件启用时调用
   */
  override onEnable(): void {
    super.onEnable();

    // 标记矩阵需要更新
    this.viewDirty = true;
    this.projectionDirty = true;

    // 派发启用事件
    this.eventDispatcher.dispatchEvent(CameraEvent.CAMERA_ENABLED, { camera: this });
  }

  /**
   * 更新组件
   * @param deltaTime 时间增量
   */
  override update(deltaTime: number): void {
    // 如果Transform有变化，标记视图矩阵需要更新
    if (this.entity.transform.isDirty()) {
      this.viewDirty = true;
    }

    // 派发更新事件
    this.eventDispatcher.dispatchEvent(CameraEvent.CAMERA_UPDATE, { camera: this, deltaTime });
  }

  /**
   * 销毁组件
   */
  override destroy(): void {
    // 派发销毁前事件
    this.eventDispatcher.dispatchEvent(CameraEvent.BEFORE_CAMERA_DESTROY, { camera: this });

    // 调用基类销毁方法
    super.destroy();
  }

  /**
   * 获取相机世界位置
   */
  getPosition(): Vector3 {
    return this.entity.transform.getPosition();
  }

  /**
   * 设置相机世界位置
   */
  setPosition(position: Vector3): this {
    this.entity.transform.setPosition(position);
    this.viewDirty = true;
    return this;
  }

  /**
   * 获取相机前方向量（世界空间）
   */
  getForward(): Vector3 {
    return this.entity.transform.getForward();
  }

  /**
   * 获取相机上方向量（世界空间）
   */
  getUp(): Vector3 {
    return this.entity.transform.getUp();
  }

  /**
   * 获取相机右方向量（世界空间）
   */
  getRight(): Vector3 {
    return this.entity.transform.getRight();
  }

  /**
   * 设置相机朝向目标点
   */
  lookAt(target: Vector3, up?: Vector3): this {
    this.entity.transform.lookAt(target, up);
    this.viewDirty = true;
    return this;
  }

  /**
   * 获取相机旋转（四元数）
   */
  getRotation() {
    return this.entity.transform.getRotation();
  }

  /**
   * 设置相机旋转（四元数）
   */
  setRotation(rotation: any): this {
    this.entity.transform.setRotation(rotation);
    this.viewDirty = true;
    return this;
  }
}

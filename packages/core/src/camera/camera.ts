import { Component } from '../base/component';
import { Entity } from '../base/entity';
import { Vector3, Matrix4 } from '@maxellabs/math';

/**
 * 摄像机投影类型
 */
export enum ProjectionType {
  /** 透视投影 */
  Perspective,
  /** 正交投影 */
  Orthographic
}

/**
 * 摄像机组件，用于渲染场景
 */
export class Camera extends Component {
  /** 摄像机视野角度（度数） */
  private _fov: number = 60;
  /** 摄像机近裁剪面 */
  private _near: number = 0.1;
  /** 摄像机远裁剪面 */
  private _far: number = 1000;
  /** 摄像机宽高比 */
  private _aspect: number = 16 / 9;
  /** 摄像机投影类型 */
  private _projectionType: ProjectionType = ProjectionType.Perspective;
  /** 正交投影尺寸（高度的一半） */
  private _orthographicSize: number = 5;
  /** 投影矩阵 */
  private _projectionMatrix: Matrix4 = new Matrix4();
  /** 视图矩阵 */
  private _viewMatrix: Matrix4 = new Matrix4();
  /** 是否需要更新投影矩阵 */
  private _projectionDirty: boolean = true;
  /** 是否需要更新视图矩阵 */
  private _viewDirty: boolean = true;
  /** 视口矩形（x, y, width, height）*/
  private _viewport: [number, number, number, number] = [0, 0, 1, 1];
  /** 渲染优先级（数值越小优先级越高） */
  private _priority: number = 0;
  /** 背景颜色 */
  private _backgroundColor: [number, number, number, number] = [0, 0, 0, 1];
  /** 是否清除深度缓冲 */
  private _clearDepth: boolean = true;
  /** 是否清除颜色缓冲 */
  private _clearColor: boolean = true;

  /**
   * 创建一个新的摄像机组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity);
  }

  /** 获取视野角度（度数） */
  get fov(): number {
    return this._fov;
  }

  /** 设置视野角度（度数） */
  set fov(value: number) {
    if (this._fov !== value) {
      this._fov = value;
      this._projectionDirty = true;
    }
  }

  /** 获取近裁剪面距离 */
  get near(): number {
    return this._near;
  }

  /** 设置近裁剪面距离 */
  set near(value: number) {
    if (this._near !== value) {
      this._near = value;
      this._projectionDirty = true;
    }
  }

  /** 获取远裁剪面距离 */
  get far(): number {
    return this._far;
  }

  /** 设置远裁剪面距离 */
  set far(value: number) {
    if (this._far !== value) {
      this._far = value;
      this._projectionDirty = true;
    }
  }

  /** 获取宽高比 */
  get aspect(): number {
    return this._aspect;
  }

  /** 设置宽高比 */
  set aspect(value: number) {
    if (this._aspect !== value) {
      this._aspect = value;
      this._projectionDirty = true;
    }
  }

  /** 获取投影类型 */
  get projectionType(): ProjectionType {
    return this._projectionType;
  }

  /** 设置投影类型 */
  set projectionType(value: ProjectionType) {
    if (this._projectionType !== value) {
      this._projectionType = value;
      this._projectionDirty = true;
    }
  }

  /** 获取正交投影尺寸（高度的一半） */
  get orthographicSize(): number {
    return this._orthographicSize;
  }

  /** 设置正交投影尺寸（高度的一半） */
  set orthographicSize(value: number) {
    if (this._orthographicSize !== value) {
      this._orthographicSize = value;
      this._projectionDirty = true;
    }
  }

  /** 获取视口矩形（x, y, width, height） */
  get viewport(): [number, number, number, number] {
    return [...this._viewport];
  }

  /** 设置视口矩形（x, y, width, height） */
  set viewport(value: [number, number, number, number]) {
    this._viewport = [...value];
  }

  /** 获取渲染优先级（数值越小优先级越高） */
  get priority(): number {
    return this._priority;
  }

  /** 设置渲染优先级（数值越小优先级越高） */
  set priority(value: number) {
    this._priority = value;
  }

  /** 获取背景颜色 */
  get backgroundColor(): [number, number, number, number] {
    return [...this._backgroundColor];
  }

  /** 设置背景颜色 */
  set backgroundColor(value: [number, number, number, number]) {
    this._backgroundColor = [...value];
  }

  /** 获取是否清除深度缓冲 */
  get clearDepth(): boolean {
    return this._clearDepth;
  }

  /** 设置是否清除深度缓冲 */
  set clearDepth(value: boolean) {
    this._clearDepth = value;
  }

  /** 获取是否清除颜色缓冲 */
  get clearColor(): boolean {
    return this._clearColor;
  }

  /** 设置是否清除颜色缓冲 */
  set clearColor(value: boolean) {
    this._clearColor = value;
  }

  /** 获取投影矩阵 */
  get projectionMatrix(): Matrix4 {
    if (this._projectionDirty) {
      this._updateProjectionMatrix();
    }
    return this._projectionMatrix.clone();
  }

  /** 获取视图矩阵 */
  get viewMatrix(): Matrix4 {
    if (this._viewDirty) {
      this._updateViewMatrix();
    }
    return this._viewMatrix.clone();
  }

  /** 获取视图投影矩阵（VP矩阵） */
  get viewProjectionMatrix(): Matrix4 {
    return Matrix4.multiply(this.projectionMatrix, this.viewMatrix);
  }

  /** 更新投影矩阵 */
  private _updateProjectionMatrix(): void {
    if (this._projectionType === ProjectionType.Perspective) {
      // 透视投影
      this._projectionMatrix = new Matrix4().perspective(
        this._fov * Math.PI / 180, // 转换为弧度
        this._aspect,
        this._near,
        this._far
      );
    } else {
      // 正交投影
      const height = this._orthographicSize * 2;
      const width = height * this._aspect;
      this._projectionMatrix = new Matrix4().orthographic(
        -width / 2,
        width / 2,
        -height / 2,
        height / 2,
        this._near,
        this._far
      );
    }
    this._projectionDirty = false;
  }

  /** 更新视图矩阵 */
  private _updateViewMatrix(): void {
    // 视图矩阵是相机世界矩阵的逆矩阵
    this._viewMatrix = Matrix4.invert(this.entity.transform.worldMatrix);
    this._viewDirty = false;
  }

  /**
   * 将世界坐标点转换为屏幕坐标
   * @param worldPosition 世界坐标点
   * @param screenWidth 屏幕宽度
   * @param screenHeight 屏幕高度
   * @returns 屏幕坐标点[x, y]，x和y范围都是0到1
   */
  worldToScreenPoint(worldPosition: Vector3, screenWidth: number, screenHeight: number): [number, number] {
    // 获取视图投影矩阵
    const vpMatrix = this.viewProjectionMatrix;
    
    // 将世界坐标转换为裁剪空间坐标
    const clipSpacePos = vpMatrix.transformPoint(worldPosition);
    
    // 裁剪空间坐标范围是 [-1, 1]，将其转换为 [0, 1] 范围的屏幕坐标
    const screenX = (clipSpacePos.x + 1) * 0.5;
    const screenY = (1 - clipSpacePos.y) * 0.5; // Y轴需要翻转
    
    return [screenX, screenY];
  }

  /**
   * 屏幕坐标转射线
   * @param screenX 屏幕X坐标（0到1）
   * @param screenY 屏幕Y坐标（0到1）
   * @returns 从相机位置指向屏幕点的射线方向
   */
  screenPointToRay(screenX: number, screenY: number): { origin: Vector3, direction: Vector3 } {
    // 将屏幕坐标转换为裁剪空间坐标（-1到1）
    const clipX = screenX * 2 - 1;
    const clipY = 1 - screenY * 2; // Y轴需要翻转
    
    // 创建近平面和远平面上的点
    const nearPlanePoint = new Vector3(clipX, clipY, -1);
    const farPlanePoint = new Vector3(clipX, clipY, 1);
    
    // 将视图投影矩阵求逆
    const vpMatrixInverse = Matrix4.invert(this.viewProjectionMatrix);
    
    // 将裁剪空间坐标转换为世界坐标
    const nearWorldPoint = vpMatrixInverse.transformPoint(nearPlanePoint);
    const farWorldPoint = vpMatrixInverse.transformPoint(farPlanePoint);
    
    // 射线原点（相机位置）
    const origin = this.entity.transform.worldPosition;
    
    // 射线方向
    const direction = Vector3.subtract(farWorldPoint, nearWorldPoint).normalize();
    
    return { origin, direction };
  }

  /**
   * 当组件启用时调用
   */
  onEnable(): void {
    // 如果是场景中第一个启用的相机，将其设置为主相机
    if (this.entity.scene && !this.entity.scene.mainCamera) {
      this.entity.scene.mainCamera = this.entity;
    }
  }

  /**
   * 在每一帧更新前调用
   */
  update(deltaTime: number): void {
    // 检查相机变换是否发生变化
    const transform = this.entity.transform;
    if (transform.worldMatrix.isDirty()) {
      this._viewDirty = true;
    }
  }

  /**
   * 在渲染时调用
   */
  render(): void {
    // 实际渲染操作通常由渲染系统处理
    // 这里只是一个占位符
  }
} 
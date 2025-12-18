import type { Entity } from './entity';
import type { ITransform, Vector3Like, QuaternionLike, Matrix4Like } from '@maxellabs/specification';
import { TransformSpace } from '@maxellabs/specification';
import { Vector3, Quaternion, Matrix4 } from '@maxellabs/math';
import { Component } from './component';
import { logError, logWarning } from './errors';
import { checkCircularReference } from './hierarchy-utils';

/**
 * 变换组件，处理实体在3D空间中的位置、旋转和缩放
 *
 * 每个实体都有一个变换组件，用于管理其在3D空间中的变换
 * 支持层级结构和本地/世界坐标系转换
 */
export class Transform extends Component implements ITransform {
  /** 父变换 */
  private parent: Transform | null = null;

  /** 子变换列表 */
  private children: Transform[] = [];

  /** 本地位置 */
  private _position: Vector3 = new Vector3();

  /** 本地旋转 */
  private _rotation: Quaternion = new Quaternion();

  /** 本地缩放 */
  private _scale: Vector3 = new Vector3(1, 1, 1);

  get position(): Vector3 {
    return this._position;
  }
  set position(value: Vector3Like) {
    this._position.copyFrom(value);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.onTransformChanged();
  }

  get rotation(): Quaternion {
    return this._rotation;
  }
  set rotation(value: QuaternionLike) {
    this._rotation.copyFrom(value);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
    this.onTransformChanged();
  }

  get scale(): Vector3 {
    return this._scale;
  }
  set scale(value: Vector3Like) {
    this._scale.copyFrom(value);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.onTransformChanged();
  }

  /** 世界位置 */
  private worldPosition: Vector3 = new Vector3();

  /** 世界旋转 */
  private worldRotation: Quaternion = new Quaternion();

  /** 世界缩放 */
  private worldScale: Vector3 = new Vector3(1, 1, 1);

  /** 本地矩阵 */
  private localMatrix: Matrix4 = new Matrix4();

  /** 世界矩阵 */
  private worldMatrix: Matrix4 = new Matrix4();

  /** 本地矩阵是否需要更新 */
  private localMatrixDirty: boolean = true;

  /** 世界矩阵是否需要更新 */
  private worldMatrixDirty: boolean = true;

  /** 向前方向（Z轴负方向） */
  private forward: Vector3 = new Vector3(0, 0, -1);

  /** 向上方向（Y轴正方向） */
  private up: Vector3 = new Vector3(0, 1, 0);

  /** 向右方向（X轴正方向） */
  private right: Vector3 = new Vector3(1, 0, 0);

  /** 方向向量是否需要更新 */
  private directionsDirty: boolean = true;

  /** 临时向量，用于避免不必要的对象创建 */
  private static readonly tempVec3 = new Vector3();
  private static readonly tempQuat = new Quaternion();

  /** 最大递归深度限制，防止栈溢出 */
  private static readonly MAX_HIERARCHY_DEPTH = 1000;

  /** 祖先节点缓存，用于优化循环引用检测 */
  private ancestorCache: WeakSet<Transform> | null = null;
  /** 祖先缓存是否有效 */
  private ancestorCacheValid: boolean = false;

  /** ITransform 接口实现：变换矩阵 */
  private _matrix: Matrix4 = new Matrix4();

  /** ITransform 接口实现：锚点 */
  private _anchor: Vector3 = new Vector3();

  /** ITransform 接口实现：变换空间 */
  private _space: TransformSpace = TransformSpace.Local;

  /**
   * 创建一个新的变换组件
   * @param entity 组件所属的实体
   */
  constructor(entity: Entity) {
    super(entity);
  }

  /**
   * ITransform 接口实现：获取/设置变换矩阵
   */
  get matrix(): Matrix4Like {
    return this.getWorldMatrix();
  }

  set matrix(value: Matrix4Like | undefined) {
    if (value) {
      // 从 Matrix4Like 复制数据到 Matrix4
      // Matrix4Like 使用 m00-m33 命名，按列主序存储
      this._matrix.set(
        value.m00,
        value.m01,
        value.m02,
        value.m03,
        value.m10,
        value.m11,
        value.m12,
        value.m13,
        value.m20,
        value.m21,
        value.m22,
        value.m23,
        value.m30,
        value.m31,
        value.m32,
        value.m33
      );
      // 从矩阵分解出位置、旋转和缩放
      this._matrix.decompose(this._position, this._rotation, this._scale);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.directionsDirty = true;
      this.onTransformChanged();
    }
  }

  /**
   * ITransform 接口实现：获取/设置锚点
   */
  get anchor(): Vector3Like {
    return this._anchor;
  }

  set anchor(value: Vector3Like | undefined) {
    if (value) {
      this._anchor.copyFrom(value);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.onTransformChanged();
    }
  }

  /**
   * ITransform 接口实现：获取/设置变换空间
   */
  get space(): TransformSpace {
    return this._space;
  }

  set space(value: TransformSpace | undefined) {
    if (value) {
      this._space = value;
    }
  }

  /**
   * 获取父变换
   */
  getParent(): Transform | null {
    return this.parent;
  }

  /**
   * 获取子变换列表
   */
  getChildren(): ReadonlyArray<Transform> {
    return this.children;
  }

  /**
   * 获取本地位置
   */
  getPosition(): Vector3 {
    return this.position;
  }

  /**
   * 设置本地位置
   */
  setPosition(value: Vector3): void {
    if (!this.position.equals(value)) {
      this.position.copyFrom(value);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.onTransformChanged();
    }
  }

  /**
   * 获取本地旋转
   */
  getRotation(): Quaternion {
    return this.rotation;
  }

  /**
   * 设置本地旋转
   */
  setRotation(value: Quaternion): void {
    if (!this.rotation.equals(value)) {
      this.rotation.copyFrom(value);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.directionsDirty = true;
      this.onTransformChanged();
    }
  }

  /**
   * 获取本地缩放
   */
  getScale(): Vector3 {
    return this.scale;
  }

  /**
   * 设置本地缩放
   */
  setScale(value: Vector3): void {
    if (!this.scale.equals(value)) {
      this.scale.copyFrom(value);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.onTransformChanged();
    }
  }

  /**
   * 获取世界位置
   */
  getWorldPosition(): Vector3 {
    this.updateWorldMatrix();

    return this.worldPosition;
  }

  /**
   * 获取世界旋转
   */
  getWorldRotation(): Quaternion {
    this.updateWorldMatrix();

    return this.worldRotation;
  }

  /**
   * 获取世界缩放
   */
  getWorldScale(): Vector3 {
    this.updateWorldMatrix();

    return this.worldScale;
  }

  /**
   * 获取前方向向量（Z轴负方向）
   */
  getForward(): Vector3 {
    this.updateDirectionVectors();

    return this.forward;
  }

  /**
   * 获取上方向向量（Y轴正方向）
   */
  getUp(): Vector3 {
    this.updateDirectionVectors();

    return this.up;
  }

  /**
   * 获取右方向向量（X轴正方向）
   */
  getRight(): Vector3 {
    this.updateDirectionVectors();

    return this.right;
  }

  /**
   * 获取本地矩阵
   */
  getLocalMatrix(): Matrix4 {
    if (this.localMatrixDirty) {
      this.updateLocalMatrix();
    }

    return this.localMatrix;
  }

  /**
   * 获取世界矩阵
   */
  getWorldMatrix(): Matrix4 {
    if (this.worldMatrixDirty) {
      this.updateWorldMatrix();
    }

    return this.worldMatrix;
  }

  /**
   * 检查递归深度是否超过限制
   * @param depth 当前深度
   * @param operation 操作名称
   * @returns 是否超过限制
   */
  private checkRecursionDepth(depth: number, operation: string): boolean {
    if (depth >= Transform.MAX_HIERARCHY_DEPTH) {
      logWarning(
        `[Transform] ${operation} 递归深度超过最大限制 ${Transform.MAX_HIERARCHY_DEPTH}，可能存在循环引用。` +
          `实体: ${this.entity.name}`,
        'Transform'
      );

      return true;
    }

    return false;
  }

  /**
   * 使祖先缓存失效
   */
  private invalidateAncestorCache(): void {
    this.ancestorCacheValid = false;
    this.ancestorCache = null;
    // 递归使所有子节点的缓存失效
    for (const child of this.children) {
      child.invalidateAncestorCache();
    }
  }

  /**
   * 构建祖先节点缓存
   */
  private buildAncestorCache(): void {
    this.ancestorCache = new WeakSet<Transform>();
    let current = this.parent;

    while (current) {
      this.ancestorCache.add(current);
      current = current.parent;
    }
    this.ancestorCacheValid = true;
  }

  /**
   * 检查是否为祖先节点（使用缓存优化）
   * @param transform 要检查的变换
   * @returns 是否为祖先节点
   */
  isAncestor(transform: Transform): boolean {
    if (!this.ancestorCacheValid) {
      this.buildAncestorCache();
    }

    return this.ancestorCache?.has(transform) ?? false;
  }

  /**
   * 在变换更改时通知相关实体和组件
   * @private
   */
  private onTransformChanged(depth: number = 0): void {
    // 防止无限递归，超过最大深度时发出警告
    if (this.checkRecursionDepth(depth, '层级更新')) {
      return;
    }

    // 通知子变换更新
    for (const child of this.children) {
      child.worldMatrixDirty = true;
      child.directionsDirty = true;
      child.onTransformChanged(depth + 1);
    }
  }

  /**
   * 设置父变换
   * @param parent 父变换
   */
  setParent(parent: Transform | null): void {
    if (this.parent === parent) {
      return;
    }

    // 防止循环引用 - 使用通用工具函数
    // 注意：这里使用 checkCircularReference 而不是 isAncestor，因为 isAncestor 依赖缓存
    // 在设置父级时缓存可能尚未更新
    if (parent && checkCircularReference(this, parent, (t) => t.getParent())) {
      logError(
        `[Transform] 检测到循环引用: 无法将变换 ${parent.entity.name} 设置为 ${this.entity.name} 的父级`,
        'Transform',
        undefined
      );

      return;
    }

    // 从原父级中移除
    if (this.parent) {
      const index = this.parent.children.indexOf(this);

      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }

    // 设置新父级
    this.parent = parent;

    // 添加到新父级
    if (parent) {
      parent.children.push(this);
    }

    // 使祖先缓存失效
    this.invalidateAncestorCache();

    // 标记需要更新
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
    this.onTransformChanged();
  }

  /**
   * 添加子变换
   * @param child 子变换
   */
  addChild(child: Transform): this {
    if (child === this) {
      logError('[Transform] 无法将变换添加为自身的子级', 'Transform', undefined);

      return this;
    }

    child.setParent(this);

    return this;
  }

  /**
   * 移除子变换
   * @param child 子变换
   */
  removeChild(child: Transform): this {
    if (child && child.parent === this) {
      child.setParent(null);
    }

    return this;
  }

  /**
   * 更新本地矩阵
   */
  updateLocalMatrix(): void {
    this.localMatrix.compose(this.position, this.rotation, this.scale);
    this.localMatrixDirty = false;
  }

  /**
   * 更新世界矩阵
   * @param depth 递归深度，用于防止无限递归
   */
  updateWorldMatrix(depth: number = 0): void {
    if (!this.worldMatrixDirty) {
      return;
    }

    // 防止无限递归 - 使用统一的检查方法
    if (this.checkRecursionDepth(depth, 'updateWorldMatrix')) {
      return;
    }

    if (this.localMatrixDirty) {
      this.updateLocalMatrix();
    }

    if (this.parent) {
      // 确保父级世界矩阵是最新的
      if (this.parent.worldMatrixDirty) {
        this.parent.updateWorldMatrix(depth + 1);
      }

      // 组合父级世界矩阵和本地矩阵
      Matrix4.multiply(this.parent.worldMatrix, this.localMatrix, this.worldMatrix);

      // 从世界矩阵分解出位置、旋转和缩放
      this.worldMatrix.decompose(this.worldPosition, this.worldRotation, this.worldScale);
    } else {
      // 如果没有父级，本地变换即为世界变换
      this.worldMatrix.copyFrom(this.localMatrix);
      this.worldPosition.copyFrom(this.position);
      this.worldRotation.copyFrom(this.rotation);
      this.worldScale.copyFrom(this.scale);
    }

    this.worldMatrixDirty = false;
    this.directionsDirty = true;
  }

  /**
   * 更新方向向量
   */
  updateDirectionVectors(): void {
    if (!this.directionsDirty) {
      return;
    }

    const worldRotation = this.getWorldRotation();

    // 更新向前方向（Z轴负方向）
    this.forward.set(0, 0, -1);
    this.forward.applyQuaternion(worldRotation);

    // 更新向上方向（Y轴正方向）
    this.up.set(0, 1, 0);
    this.up.applyQuaternion(worldRotation);

    // 更新向右方向（X轴正方向）
    this.right.set(1, 0, 0);
    this.right.applyQuaternion(worldRotation);

    this.directionsDirty = false;
  }

  /**
   * 设置本地位置
   * @param x X坐标
   * @param y Y坐标
   * @param z Z坐标
   */
  setPositionXYZ(x: number, y: number, z: number): this {
    if (this.position.x !== x || this.position.y !== y || this.position.z !== z) {
      this.position.set(x, y, z);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.onTransformChanged();
    }

    return this;
  }

  /**
   * 设置本地旋转四元数
   * @param x X分量
   * @param y Y分量
   * @param z Z分量
   * @param w W分量
   */
  setRotationQuaternion(x: number, y: number, z: number, w: number): this {
    if (this.rotation.x !== x || this.rotation.y !== y || this.rotation.z !== z || this.rotation.w !== w) {
      this.rotation.set(x, y, z, w);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.directionsDirty = true;
      this.onTransformChanged();
    }

    return this;
  }

  /**
   * 从欧拉角设置旋转
   * @param x X轴旋转（角度）
   * @param y Y轴旋转（角度）
   * @param z Z轴旋转（角度）
   */
  setRotationFromEuler(x: number, y: number, z: number): this {
    this.rotation.setFromEuler(x, y, z);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
    this.onTransformChanged();

    return this;
  }

  /**
   * 设置本地缩放
   * @param x X轴缩放
   * @param y Y轴缩放
   * @param z Z轴缩放
   */
  setScaleXYZ(x: number, y: number, z: number): this {
    if (this.scale.x !== x || this.scale.y !== y || this.scale.z !== z) {
      this.scale.set(x, y, z);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.onTransformChanged();
    }

    return this;
  }

  /**
   * 设置世界位置
   * @param x X坐标
   * @param y Y坐标
   * @param z Z坐标
   */
  setWorldPositionXYZ(x: number, y: number, z: number): this {
    Transform.tempVec3.set(x, y, z);

    return this.setWorldPosition(Transform.tempVec3);
  }

  /**
   * 设置世界位置
   * @param position 世界位置向量
   */
  setWorldPosition(position: Vector3): this {
    if (this.parent) {
      // 将世界位置转换为本地位置
      const inversedParentWorldMatrix = this.parent.getWorldMatrix().clone().invert();

      this.position.copyFrom(position).applyMatrix(inversedParentWorldMatrix);
    } else {
      // 如果没有父级，世界位置即为本地位置
      this.position.copyFrom(position);
    }

    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.onTransformChanged();

    return this;
  }

  /**
   * 设置世界旋转
   * @param quaternion 世界旋转四元数
   */
  setWorldRotation(quaternion: Quaternion): this {
    if (this.parent) {
      // 计算局部旋转 = 世界旋转 * 父级世界旋转的逆
      const inversedParentWorldRotation = Quaternion.invert(this.parent.getWorldRotation());

      this.rotation.copyFrom(quaternion).multiply(inversedParentWorldRotation);
    } else {
      // 如果没有父级，世界旋转即为本地旋转
      this.rotation.copyFrom(quaternion);
    }

    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
    this.onTransformChanged();

    return this;
  }

  /**
   * 让物体朝向目标点
   * @param target 目标点
   * @param upVector 向上向量
   */
  lookAt(target: Vector3, upVector: Vector3 = new Vector3(0, 1, 0)): this {
    if (this.parent) {
      // 在世界空间中计算朝向
      const worldPosition = this.getWorldPosition();
      const direction = Vector3.subtract(target, worldPosition).normalize();

      // 如果方向几乎为零向量，或者与上向量平行，我们无法创建有效的朝向
      const directionNorm = direction.getLength();
      const upDot = upVector.normalize().dot(direction);

      if (directionNorm < 0.0001 || Math.abs(Math.abs(upDot) - 1) < 0.0001) {
        // 跳过无效朝向
        return this;
      }

      // 构建朝向矩阵
      const right = Vector3.cross(upVector, direction).normalize();
      const correctedUp = Vector3.cross(direction, right).normalize();

      const lookMatrix = new Matrix4();

      lookMatrix.set(
        right.x,
        right.y,
        right.z,
        0,
        correctedUp.x,
        correctedUp.y,
        correctedUp.z,
        0,
        direction.x,
        direction.y,
        direction.z,
        0,
        0,
        0,
        0,
        1
      );

      // 从矩阵提取旋转
      const quaternion = new Quaternion();

      quaternion.setFromRotationMatrix(lookMatrix);
      this.setWorldRotation(quaternion);
    } else {
      // 直接设置本地旋转
      const direction = Vector3.subtract(target, this.position).normalize();
      const quaternion = new Quaternion();

      quaternion.setFromDirection(direction, upVector);
      this.rotation.copyFrom(quaternion);
      this.localMatrixDirty = true;
      this.worldMatrixDirty = true;
      this.directionsDirty = true;
      this.onTransformChanged();
    }

    return this;
  }

  /**
   * 绕指定轴旋转（世界空间）
   * @param axis 旋转轴
   * @param angle 旋转角度（弧度）
   */
  rotate(axis: Vector3, angle: number): this {
    const normalizedAxis = axis.normalize();
    const q = new Quaternion();

    q.setFromAxisAngle(normalizedAxis, angle);

    // 在世界空间中旋转
    const currentWorldRotation = this.getWorldRotation();
    const newWorldRotation = Quaternion.multiply(q, currentWorldRotation);

    this.setWorldRotation(newWorldRotation);

    return this;
  }

  /**
   * 绕世界X轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldX(angle: number): this {
    return this.rotate(new Vector3(1, 0, 0), angle);
  }

  /**
   * 绕世界Y轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldY(angle: number): this {
    return this.rotate(new Vector3(0, 1, 0), angle);
  }

  /**
   * 绕世界Z轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldZ(angle: number): this {
    return this.rotate(new Vector3(0, 0, 1), angle);
  }

  /**
   * 绕局部轴旋转
   * @param axis 局部空间中的旋转轴
   * @param angle 旋转角度（弧度）
   */
  rotateLocal(axis: Vector3, angle: number): this {
    const normalizedAxis = axis.normalize();
    const q = new Quaternion();

    q.setFromAxisAngle(normalizedAxis, angle);

    // 在局部空间中旋转
    const newRotation = Quaternion.multiply(this.rotation, q);

    this.rotation.copyFrom(newRotation);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
    this.onTransformChanged();

    return this;
  }

  /**
   * 绕局部X轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalX(angle: number): this {
    return this.rotateLocal(new Vector3(1, 0, 0), angle);
  }

  /**
   * 绕局部Y轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalY(angle: number): this {
    return this.rotateLocal(new Vector3(0, 1, 0), angle);
  }

  /**
   * 绕局部Z轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalZ(angle: number): this {
    return this.rotateLocal(new Vector3(0, 0, 1), angle);
  }

  /**
   * 在世界空间中平移
   * @param translation 平移向量
   */
  translate(translation: Vector3): this {
    // 获取当前世界位置
    const worldPosition = this.getWorldPosition();

    // 应用平移
    worldPosition.add(translation);

    // 设置新的世界位置
    this.setWorldPosition(worldPosition);

    return this;
  }

  /**
   * 在本地空间中平移
   * @param x X轴平移量
   * @param y Y轴平移量
   * @param z Z轴平移量
   */
  translateLocal(x: number, y: number, z: number): this {
    // 创建本地空间中的平移向量
    const localTranslation = new Vector3(x, y, z);

    // 将平移向量转换到世界空间
    const worldRotation = this.getWorldRotation();

    localTranslation.applyQuaternion(worldRotation);

    // 应用世界空间平移
    return this.translate(localTranslation);
  }

  /**
   * 沿前方向平移
   * @param distance 平移距离
   */
  translateForward(distance: number): this {
    const forward = this.getForward();

    // 将前方向归一化并乘以距离
    forward.normalize().scale(distance);

    // 应用平移
    return this.translate(forward);
  }

  /**
   * 沿右方向平移
   * @param distance 平移距离
   */
  translateRight(distance: number): this {
    const right = this.getRight();

    // 将右方向归一化并乘以距离
    right.normalize().scale(distance);

    // 应用平移
    return this.translate(right);
  }

  /**
   * 沿上方向平移
   * @param distance 平移距离
   */
  translateUp(distance: number): this {
    const up = this.getUp();

    // 将上方向归一化并乘以距离
    up.normalize().scale(distance);

    // 应用平移
    return this.translate(up);
  }

  /**
   * 检查变换是否需要更新
   * @returns 是否有变换需要更新
   */
  isDirty(): boolean {
    return this.localMatrixDirty || this.worldMatrixDirty || this.directionsDirty;
  }

  /**
   * 释放变换组件
   * @remarks 实现 IDisposable 接口
   */
  override dispose(): void {
    if (this.isDisposed()) {
      return;
    }

    // 移除所有子级
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].setParent(null);
    }

    // 从父级中移除
    if (this.parent) {
      this.setParent(null);
    }

    // 清空引用
    this.children.length = 0;

    super.dispose();
  }
}

import type { Entity } from './entity';
import { Vector3, Quaternion, Matrix4 } from '@maxellabs/math';
import { Component } from './component';

/**
 * 变换组件，处理实体在3D空间中的位置、旋转和缩放
 */
export class Transform extends Component {

  /** 父变换 */
  parent: Transform | null = null;

  /** 子变换列表 */
  children: Transform[] = [];

  /** 本地位置 */
  position: Vector3 = new Vector3();

  /** 本地旋转 */
  rotation: Quaternion = new Quaternion();

  /** 本地缩放 */
  scale: Vector3 = new Vector3(1, 1, 1);

  /** 世界位置 */
  worldPosition: Vector3 = new Vector3();

  /** 世界旋转 */
  worldRotation: Quaternion = new Quaternion();

  /** 世界缩放 */
  worldScale: Vector3 = new Vector3(1, 1, 1);

  /** 本地矩阵 */
  localMatrix: Matrix4 = new Matrix4();

  /** 世界矩阵 */
  worldMatrix: Matrix4 = new Matrix4();

  /** 本地矩阵是否需要更新 */
  localMatrixDirty: boolean = true;

  /** 世界矩阵是否需要更新 */
  worldMatrixDirty: boolean = true;

  /** 向前方向（Z轴负方向） */
  forward: Vector3 = new Vector3(0, 0, -1);

  /** 向上方向（Y轴正方向） */
  up: Vector3 = new Vector3(0, 1, 0);

  /** 向右方向（X轴正方向） */
  right: Vector3 = new Vector3(1, 0, 0);

  /** 方向向量是否需要更新 */
  directionsDirty: boolean = true;

  /**
   * 创建一个新的变换组件
   * @param entity 组件所属的实体
   */
  constructor (entity: Entity) {
    super(entity);
  }

  /**
   * 设置父变换
   * @param parent 父变换
   */
  setParent (parent: Transform | null): void {
    if (this.parent === parent) {return;}

    // 从原父节点移除
    if (this.parent) {
      const index = this.parent.children.indexOf(this);

      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }

    // 设置新父节点
    this.parent = parent;
    if (parent) {
      parent.children.push(this);
    }

    // 更新世界变换
    this.updateWorldTransform();
  }

  /**
   * 更新世界变换
   */
  updateWorldTransform (): void {
    if (this.parent) {
      // 计算世界位置、旋转、缩放
      this.calculateWorldPosition();
      this.calculateWorldRotation();
      this.calculateWorldScale();
    } else {
      // 没有父级，世界变换等于本地变换
      this.worldPosition.copyFrom(this.position);
      this.worldRotation.copyFrom(this.rotation);
      this.worldScale.copyFrom(this.scale);
    }

    // 更新子节点
    for (const child of this.children) {
      child.updateWorldTransform();
    }

    // 标记方向向量需要更新
    this.directionsDirty = true;
  }

  /**
   * 计算世界位置
   */
  calculateWorldPosition (): void {
    if (!this.parent) {
      this.worldPosition.copyFrom(this.position);

      return;
    }

    // 从本地位置计算世界位置
    // 1. 先应用旋转
    this.worldPosition.copyFrom(this.position);
    this.parent.worldRotation.transformVector(this.worldPosition);

    // 2. 再应用缩放
    this.worldPosition.x *= this.parent.worldScale.x;
    this.worldPosition.y *= this.parent.worldScale.y;
    this.worldPosition.z *= this.parent.worldScale.z;

    // 3. 最后加上父级世界位置
    this.worldPosition.x += this.parent.worldPosition.x;
    this.worldPosition.y += this.parent.worldPosition.y;
    this.worldPosition.z += this.parent.worldPosition.z;
  }

  /**
   * 计算世界旋转
   */
  calculateWorldRotation (): void {
    if (!this.parent) {
      this.worldRotation.copyFrom(this.rotation);

      return;
    }

    // 世界旋转 = 父级世界旋转 * 本地旋转
    this.worldRotation.copyFrom(this.parent.worldRotation);
    this.worldRotation.multiply(this.rotation);
  }

  /**
   * 计算世界缩放
   */
  calculateWorldScale (): void {
    if (!this.parent) {
      this.worldScale.copyFrom(this.scale);

      return;
    }

    // 世界缩放 = 父级世界缩放 * 本地缩放
    this.worldScale.x = this.parent.worldScale.x * this.scale.x;
    this.worldScale.y = this.parent.worldScale.y * this.scale.y;
    this.worldScale.z = this.parent.worldScale.z * this.scale.z;
  }

  /**
   * 更新方向向量
   */
  updateDirectionVectors (): void {
    if (!this.directionsDirty) {
      return;
    }

    // 计算前方向 (0, 0, -1) 经过旋转后的向量
    this.forward.set(0, 0, -1);
    this.worldRotation.transformVector(this.forward);

    // 计算上方向 (0, 1, 0) 经过旋转后的向量
    this.up.set(0, 1, 0);
    this.worldRotation.transformVector(this.up);

    // 计算右方向 (1, 0, 0) 经过旋转后的向量
    this.right.set(1, 0, 0);
    this.worldRotation.transformVector(this.right);

    this.directionsDirty = false;
  }

  /**
   * 设置本地位置
   * @param x X坐标
   * @param y Y坐标
   * @param z Z坐标
   */
  setPosition (x: number, y: number, z: number): void {
    if (this.position.x === x && this.position.y === y && this.position.z === z) {
      return;
    }

    this.position.set(x, y, z);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
  }

  /**
   * 设置本地旋转(四元数)
   * @param x X分量
   * @param y Y分量
   * @param z Z分量
   * @param w W分量
   */
  setRotation (x: number, y: number, z: number, w: number): void {
    if (this.rotation.x === x && this.rotation.y === y &&
        this.rotation.z === z && this.rotation.w === w) {
      return;
    }

    this.rotation.set(x, y, z, w);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
  }

  /**
   * 设置本地旋转(欧拉角，以弧度为单位)
   * @param x X轴旋转
   * @param y Y轴旋转
   * @param z Z轴旋转
   */
  setRotationFromEuler (x: number, y: number, z: number): void {
    this.rotation.fromEulerAngles(x, y, z);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
  }

  /**
   * 设置本地缩放
   * @param x X轴缩放
   * @param y Y轴缩放
   * @param z Z轴缩放
   */
  setScale (x: number, y: number, z: number): void {
    if (this.scale.x === x && this.scale.y === y && this.scale.z === z) {
      return;
    }

    this.scale.set(x, y, z);
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
  }

  /**
   * 设置世界位置
   * @param x X坐标
   * @param y Y坐标
   * @param z Z坐标
   */
  setWorldPosition (x: number, y: number, z: number): void {
    this.worldPosition.set(x, y, z);

    if (this.parent) {
      // 如果有父级，计算本地位置
      // 1. 移除父级位置
      const localX = x - this.parent.worldPosition.x;
      const localY = y - this.parent.worldPosition.y;
      const localZ = z - this.parent.worldPosition.z;

      // 2. 移除父级缩放
      const invScaleX = 1 / this.parent.worldScale.x;
      const invScaleY = 1 / this.parent.worldScale.y;
      const invScaleZ = 1 / this.parent.worldScale.z;

      const scaledX = localX * invScaleX;
      const scaledY = localY * invScaleY;
      const scaledZ = localZ * invScaleZ;

      // 3. 移除父级旋转
      const invRotation = this.parent.worldRotation.clone();

      invRotation.invert();

      const localPos = new Vector3(scaledX, scaledY, scaledZ);

      invRotation.transformVector(localPos);

      this.position.copyFrom(localPos);
    } else {
      // 没有父级，本地位置等于世界位置
      this.position.set(x, y, z);
    }

    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
  }

  /**
   * 设置世界旋转
   * @param quaternion 世界旋转四元数
   */
  setWorldRotation (quaternion: Quaternion): void {
    this.worldRotation.copyFrom(quaternion);

    if (this.parent) {
      // 如果有父级，计算本地旋转
      const invParentRotation = this.parent.worldRotation.clone();

      invParentRotation.invert();

      // localRotation = invParentRotation * worldRotation
      this.rotation.copyFrom(invParentRotation);
      this.rotation.multiply(quaternion);
    } else {
      // 没有父级，本地旋转等于世界旋转
      this.rotation.copyFrom(quaternion);
    }

    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.directionsDirty = true;
  }

  /**
   * 更新本地矩阵
   */
  updateLocalMatrix (): void {
    if (!this.localMatrixDirty) {
      return;
    }

    // 构建变换矩阵 (位置、旋转、缩放)
    this.localMatrix.compose(this.position, this.rotation, this.scale);
    this.localMatrixDirty = false;
  }

  /**
   * 更新世界矩阵
   */
  updateWorldMatrix (): void {
    if (!this.worldMatrixDirty && !this.localMatrixDirty) {
      return;
    }

    // 确保本地矩阵是最新的
    if (this.localMatrixDirty) {
      this.updateLocalMatrix();
    }

    if (this.parent) {
      // 确保父级世界矩阵是最新的
      if (this.parent.worldMatrixDirty) {
        this.parent.updateWorldMatrix();
      }

      // 世界矩阵 = 父级世界矩阵 * 本地矩阵
      Matrix4.multiply(this.parent.worldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // 没有父级，世界矩阵等于本地矩阵
      this.worldMatrix.copyFrom(this.localMatrix);
    }

    this.worldMatrixDirty = false;
    this.directionsDirty = true;

    // 更新所有子实体的世界矩阵
    for (const child of this.children) {
      child.worldMatrixDirty = true;
      child.updateWorldMatrix();
    }
  }

  /**
   * 获取世界位置（从世界矩阵中提取）
   */
  getPositionFromMatrix (): Vector3 {
    // 确保世界矩阵是最新的
    if (this.worldMatrixDirty) {
      this.updateWorldMatrix();
    }

    // 从矩阵中提取位置
    const position = new Vector3();

    this.worldMatrix.decompose(position, new Quaternion(), new Vector3());

    return position;
  }

  /**
   * 朝向目标点，设置实体的旋转使其朝向目标
   * @param target 目标位置
   * @param upVector 向上向量（默认为世界Y轴）
   */
  lookAt (target: Vector3, upVector: Vector3 = new Vector3(0, 1, 0)): void {
    // 确保世界位置是最新的
    this.calculateWorldPosition();

    // 计算朝向向量
    const forwardDir = Vector3.subtract(target, this.worldPosition);

    forwardDir.normalize();

    // 避免目标点与当前位置重合
    if (forwardDir.lengthSquared() < 0.0001) {
      return;
    }

    // 计算右向量
    const rightDir = Vector3.cross(upVector, forwardDir);

    rightDir.normalize();

    // 如果向上向量与前方向平行，则无法计算出有效的右向量
    if (rightDir.lengthSquared() < 0.0001) {
      // 选择一个不同的向上向量
      const altUp = (Math.abs(forwardDir.x) < 0.9 && Math.abs(forwardDir.z) < 0.9)
        ? new Vector3(0, 1, 0)
        : new Vector3(1, 0, 0);

      rightDir.copyFrom(Vector3.cross(altUp, forwardDir));
      rightDir.normalize();
    }

    // 重新计算向上向量，确保正交
    const upDir = Vector3.cross(forwardDir, rightDir);

    upDir.normalize();

    // 构建旋转矩阵
    const rotationMatrix = new Matrix4();

    rotationMatrix.setLookRotation(forwardDir, upDir);

    // 从旋转矩阵提取四元数
    const worldRot = new Quaternion();

    rotationMatrix.decompose(new Vector3(), worldRot, new Vector3());

    // 设置世界旋转
    this.setWorldRotation(worldRot);
  }

  /**
   * 绕指定轴旋转指定角度（弧度）
   * @param axis 旋转轴
   * @param angle 旋转角度（弧度）
   */
  rotate (axis: Vector3, angle: number): void {
    // 创建表示此旋转的四元数
    const rotQuat = Quaternion.fromAxisAngle(axis.normalized(), angle);

    // 将此旋转应用到当前旋转
    const newRotation = Quaternion.multiply(this.rotation, rotQuat);

    this.setRotation(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
  }

  /**
   * 沿世界坐标系的X轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldX (angle: number): void {
    this.rotate(new Vector3(1, 0, 0), angle);
  }

  /**
   * 沿世界坐标系的Y轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldY (angle: number): void {
    this.rotate(new Vector3(0, 1, 0), angle);
  }

  /**
   * 沿世界坐标系的Z轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateWorldZ (angle: number): void {
    this.rotate(new Vector3(0, 0, 1), angle);
  }

  /**
   * 沿本地坐标系的轴旋转
   * @param axis 本地坐标轴
   * @param angle 旋转角度（弧度）
   */
  rotateLocal (axis: Vector3, angle: number): void {
    // 将本地轴转换为世界轴
    this.updateDirectionVectors();
    const worldAxis = new Vector3(axis.x, axis.y, axis.z);

    this.worldRotation.transformVector(worldAxis);
    worldAxis.normalize();

    // 沿世界轴旋转
    this.rotate(worldAxis, angle);
  }

  /**
   * 沿本地X轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalX (angle: number): void {
    this.rotateLocal(new Vector3(1, 0, 0), angle);
  }

  /**
   * 沿本地Y轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalY (angle: number): void {
    this.rotateLocal(new Vector3(0, 1, 0), angle);
  }

  /**
   * 沿本地Z轴旋转
   * @param angle 旋转角度（弧度）
   */
  rotateLocalZ (angle: number): void {
    this.rotateLocal(new Vector3(0, 0, 1), angle);
  }

  /**
   * 平移指定的距离
   * @param translation 平移向量
   */
  translate (translation: Vector3): void {
    this.position.x += translation.x;
    this.position.y += translation.y;
    this.position.z += translation.z;

    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
  }

  /**
   * 沿着本地坐标系的轴平移
   * @param x 沿本地X轴平移距离
   * @param y 沿本地Y轴平移距离
   * @param z 沿本地Z轴平移距离
   */
  translateLocal (x: number, y: number, z: number): void {
    // 确保方向向量是最新的
    this.updateDirectionVectors();

    // 计算世界平移向量
    const worldX = this.right.clone().multiplyScalar(x);
    const worldY = this.up.clone().multiplyScalar(y);
    const worldZ = this.forward.clone().multiplyScalar(z);

    // 合并平移向量
    const worldTranslation = new Vector3();

    worldTranslation.x = worldX.x + worldY.x + worldZ.x;
    worldTranslation.y = worldX.y + worldY.y + worldZ.y;
    worldTranslation.z = worldX.z + worldY.z + worldZ.z;

    // 应用平移
    this.translate(worldTranslation);
  }

  /**
   * 销毁变换组件
   */
  override destroy (): void {
    if (this.destroyed) {
      return;
    }

    // 移除所有子节点
    for (const child of this.children.slice()) {
      child.destroy();
    }
    this.children = [];

    // 从父节点移除
    if (this.parent) {
      const index = this.parent.children.indexOf(this);

      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
      this.parent = null;
    }

    super.destroy();
  }
}
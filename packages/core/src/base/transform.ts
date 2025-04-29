import { Component } from './component';
import { Entity } from './entity';
import { Vector3, Quaternion, Matrix4 } from '@maxellabs/math';

/**
 * 变换组件，处理实体在3D空间中的位置、旋转和缩放
 */
export class Transform extends Component {
  /** 本地位置 */
  private _localPosition: Vector3 = new Vector3();
  /** 本地旋转（四元数） */
  private _localRotation: Quaternion = new Quaternion();
  /** 本地缩放 */
  private _localScale: Vector3 = new Vector3(1, 1, 1);
  /** 本地变换矩阵 */
  private _localMatrix: Matrix4 = new Matrix4();
  /** 世界变换矩阵 */
  private _worldMatrix: Matrix4 = new Matrix4();
  /** 本地矩阵是否需要更新 */
  private _localMatrixDirty: boolean = true;
  /** 世界矩阵是否需要更新 */
  private _worldMatrixDirty: boolean = true;

  /** 缓存向量，避免频繁创建对象 */
  private static _tempVec3: Vector3 = new Vector3();
  private static _tempQuat: Quaternion = new Quaternion();
  private static _tempMat4: Matrix4 = new Matrix4();

  /** 向前方向（Z轴负方向） */
  private _forward: Vector3 = new Vector3(0, 0, -1);
  /** 向上方向（Y轴正方向） */
  private _up: Vector3 = new Vector3(0, 1, 0);
  /** 向右方向（X轴正方向） */
  private _right: Vector3 = new Vector3(1, 0, 0);
  /** 方向向量是否需要更新 */
  private _directionsDirty: boolean = true;

  /**
   * 创建一个新的变换组件
   * @param entity 组件所属的实体
   */
  constructor(entity: Entity) {
    super(entity);
  }

  /** 获取本地位置 */
  get localPosition(): Vector3 {
    return this._localPosition.clone();
  }

  /** 设置本地位置 */
  set localPosition(value: Vector3) {
    if (!this._localPosition.equals(value)) {
      this._localPosition.copyFrom(value);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
    }
  }

  /** 设置本地位置的x、y、z分量 */
  setLocalPosition(x: number, y: number, z: number): void {
    if (this._localPosition.x !== x || this._localPosition.y !== y || this._localPosition.z !== z) {
      this._localPosition.set(x, y, z);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
    }
  }

  /** 获取本地旋转（四元数） */
  get localRotation(): Quaternion {
    return this._localRotation.clone();
  }

  /** 设置本地旋转（四元数） */
  set localRotation(value: Quaternion) {
    if (!this._localRotation.equals(value)) {
      this._localRotation.copyFrom(value);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
      this._directionsDirty = true;
    }
  }

  /** 设置本地旋转的x、y、z、w分量 */
  setLocalRotation(x: number, y: number, z: number, w: number): void {
    if (this._localRotation.x !== x || this._localRotation.y !== y ||
        this._localRotation.z !== z || this._localRotation.w !== w) {
      this._localRotation.set(x, y, z, w);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
      this._directionsDirty = true;
    }
  }

  /** 设置本地旋转（欧拉角，以弧度为单位） */
  setLocalRotationFromEuler(x: number, y: number, z: number): void {
    this._localRotation.setFromEuler(x, y, z);
    this._localMatrixDirty = true;
    this._worldMatrixDirty = true;
    this._directionsDirty = true;
  }

  /** 获取本地缩放 */
  get localScale(): Vector3 {
    return this._localScale.clone();
  }

  /** 设置本地缩放 */
  set localScale(value: Vector3) {
    if (!this._localScale.equals(value)) {
      this._localScale.copyFrom(value);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
    }
  }

  /** 设置本地缩放的x、y、z分量 */
  setLocalScale(x: number, y: number, z: number): void {
    if (this._localScale.x !== x || this._localScale.y !== y || this._localScale.z !== z) {
      this._localScale.set(x, y, z);
      this._localMatrixDirty = true;
      this._worldMatrixDirty = true;
    }
  }

  /** 获取向前方向（Z轴负方向） */
  get forward(): Vector3 {
    this._updateDirectionVectors();
    return this._forward.clone();
  }

  /** 获取向上方向（Y轴正方向） */
  get up(): Vector3 {
    this._updateDirectionVectors();
    return this._up.clone();
  }

  /** 获取向右方向（X轴正方向） */
  get right(): Vector3 {
    this._updateDirectionVectors();
    return this._right.clone();
  }

  /** 更新方向向量 */
  private _updateDirectionVectors(): void {
    if (this._directionsDirty) {
      const rotation = this.worldRotation;
      
      // 计算前方向 (0, 0, -1) 经过旋转后的向量
      this._forward.set(0, 0, -1);
      rotation.rotateVector3(this._forward);
      
      // 计算上方向 (0, 1, 0) 经过旋转后的向量
      this._up.set(0, 1, 0);
      rotation.rotateVector3(this._up);
      
      // 计算右方向 (1, 0, 0) 经过旋转后的向量
      this._right.set(1, 0, 0);
      rotation.rotateVector3(this._right);
      
      this._directionsDirty = false;
    }
  }

  /** 获取世界位置 */
  get worldPosition(): Vector3 {
    const worldMatrix = this.worldMatrix;
    const position = new Vector3();
    worldMatrix.getTranslation(position);
    return position;
  }

  /** 设置世界位置 */
  set worldPosition(value: Vector3) {
    if (this.entity.parent) {
      // 如果有父级，需要将世界位置转换为本地位置
      const parentTransform = this.entity.parent.transform;
      const parentWorldMatrixInverse = parentTransform.worldMatrix.clone().invert();
      
      // 计算新的本地位置
      const newLocalPos = parentWorldMatrixInverse.transformPoint(value);
      this.localPosition = newLocalPos;
    } else {
      // 没有父级，世界位置等于本地位置
      this.localPosition = value;
    }
  }

  /** 获取世界旋转 */
  get worldRotation(): Quaternion {
    if (this.entity.parent) {
      // 如果有父级，需要将本地旋转与父级的世界旋转组合
      const parentTransform = this.entity.parent.transform;
      return Quaternion.multiply(parentTransform.worldRotation, this._localRotation);
    } else {
      // 没有父级，世界旋转等于本地旋转
      return this._localRotation.clone();
    }
  }

  /** 设置世界旋转 */
  set worldRotation(value: Quaternion) {
    if (this.entity.parent) {
      // 如果有父级，需要将世界旋转转换为本地旋转
      const parentTransform = this.entity.parent.transform;
      const parentWorldRotationInverse = Quaternion.invert(parentTransform.worldRotation);
      
      // 计算新的本地旋转
      const newLocalRot = Quaternion.multiply(parentWorldRotationInverse, value);
      this.localRotation = newLocalRot;
    } else {
      // 没有父级，世界旋转等于本地旋转
      this.localRotation = value;
    }
  }

  /** 获取世界缩放 */
  get worldScale(): Vector3 {
    if (this.entity.parent) {
      // 如果有父级，需要将本地缩放与父级的世界缩放相乘
      const parentTransform = this.entity.parent.transform;
      const parentWorldScale = parentTransform.worldScale;
      return new Vector3(
        this._localScale.x * parentWorldScale.x,
        this._localScale.y * parentWorldScale.y,
        this._localScale.z * parentWorldScale.z
      );
    } else {
      // 没有父级，世界缩放等于本地缩放
      return this._localScale.clone();
    }
  }

  /** 获取本地变换矩阵 */
  get localMatrix(): Matrix4 {
    if (this._localMatrixDirty) {
      this._updateLocalMatrix();
    }
    return this._localMatrix.clone();
  }

  /** 获取世界变换矩阵 */
  get worldMatrix(): Matrix4 {
    if (this._worldMatrixDirty) {
      this._updateWorldMatrix();
    }
    return this._worldMatrix.clone();
  }

  /** 更新本地变换矩阵 */
  private _updateLocalMatrix(): void {
    this._localMatrix.compose(this._localPosition, this._localRotation, this._localScale);
    this._localMatrixDirty = false;
  }

  /** 更新世界变换矩阵 */
  updateWorldMatrix(): void {
    if (this._localMatrixDirty) {
      this._updateLocalMatrix();
    }

    if (this.entity.parent) {
      const parentTransform = this.entity.parent.transform;
      Matrix4.multiply(parentTransform.worldMatrix, this._localMatrix, this._worldMatrix);
    } else {
      this._worldMatrix.copy(this._localMatrix);
    }

    this._worldMatrixDirty = false;
    this._directionsDirty = true;

    // 更新所有子实体的世界矩阵
    for (const child of this.entity.children) {
      child.transform.updateWorldMatrix();
    }
  }

  /** 看向目标点，设置实体的旋转使其朝向目标 */
  lookAt(target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): void {
    const position = this.worldPosition;
    
    // 计算朝向
    const forward = Vector3.subtract(target, position).normalize();
    
    // 避免目标点与当前位置重合
    if (forward.squaredLength() === 0) {
      return;
    }
    
    // 计算右方向
    const right = Vector3.cross(up, forward).normalize();
    
    // 如果向上向量与前方向平行，则无法计算出有效的右方向
    if (right.squaredLength() === 0) {
      // 选择一个不同的向上向量
      up = forward.x !== 0 || forward.z !== 0
        ? new Vector3(0, 1, 0)
        : new Vector3(1, 0, 0);
      right.copy(Vector3.cross(up, forward).normalize());
    }
    
    // 重新计算向上向量，确保正交
    up = Vector3.cross(forward, right).normalize();
    
    // 构建旋转矩阵
    const rotationMatrix = new Matrix4();
    rotationMatrix.set(
      right.x, right.y, right.z, 0,
      up.x, up.y, up.z, 0,
      -forward.x, -forward.y, -forward.z, 0,
      0, 0, 0, 1
    );
    
    // 从旋转矩阵提取四元数
    const rotation = Quaternion.fromMatrix(rotationMatrix);
    
    // 设置世界旋转
    this.worldRotation = rotation;
  }

  /** 绕指定轴旋转指定角度（弧度） */
  rotate(axis: Vector3, angle: number): void {
    // 创建表示此旋转的四元数
    const q = Quaternion.fromAxisAngle(axis, angle);
    
    // 将此旋转应用到当前旋转
    this.localRotation = Quaternion.multiply(this._localRotation, q);
  }

  /** 沿世界坐标系的X轴旋转 */
  rotateX(angle: number): void {
    this.rotate(new Vector3(1, 0, 0), angle);
  }

  /** 沿世界坐标系的Y轴旋转 */
  rotateY(angle: number): void {
    this.rotate(new Vector3(0, 1, 0), angle);
  }

  /** 沿世界坐标系的Z轴旋转 */
  rotateZ(angle: number): void {
    this.rotate(new Vector3(0, 0, 1), angle);
  }

  /** 沿本地坐标系的轴旋转 */
  rotateLocal(axis: Vector3, angle: number): void {
    // 将本地轴转换为世界轴
    const worldAxis = this.worldRotation.transformVector(axis.clone());
    
    // 沿世界轴旋转
    this.rotate(worldAxis, angle);
  }

  /** 平移指定的距离 */
  translate(translation: Vector3): void {
    this._localPosition.add(translation);
    this._localMatrixDirty = true;
    this._worldMatrixDirty = true;
  }

  /** 沿着本地坐标系的轴平移 */
  translateLocal(x: number, y: number, z: number): void {
    // 创建本地平移向量
    const localTranslation = new Vector3(x, y, z);
    
    // 将本地平移向量转换为世界平移向量
    const worldTranslation = this.worldRotation.transformVector(localTranslation);
    
    // 应用平移
    this.translate(worldTranslation);
  }
} 
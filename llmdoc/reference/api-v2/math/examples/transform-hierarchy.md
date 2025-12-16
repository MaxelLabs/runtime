# 变换层级示例

演示如何使用Math库的矩阵和四元数操作来实现3D场景的变换层级。

## 完整代码

```typescript
import { Vec3, Mat4, Quat, Box3 } from '@maxellabs/math';

// 变换节点类
class TransformNode {
  public name: string;
  public parent?: TransformNode;
  public children: TransformNode[] = [];

  // 本地变换
  private _position: Vec3 = Vec3.zero();
  private _rotation: Quat = Quat.identity();
  private _scale: Vec3 = Vec3.one();

  // 缓存的世界矩阵
  private _worldMatrix: Mat4 = Mat4.identity();
  private _worldMatrixDirty: boolean = true;

  constructor(name: string) {
    this.name = name;
  }

  // 获取和设置本地变换
  get position(): Vec3 {
    return this._position.clone();
  }

  set position(value: Vec3) {
    this._position = value.clone();
    this.markDirty();
  }

  get rotation(): Quat {
    return this._rotation.clone();
  }

  set rotation(value: Quat) {
    this._rotation = value.clone();
    this.markDirty();
  }

  get scale(): Vec3 {
    return this._scale.clone();
  }

  set scale(value: Vec3) {
    this._scale = value.clone();
    this.markDirty();
  }

  // 标记世界矩阵需要更新
  private markDirty(): void {
    this._worldMatrixDirty = true;
    this.children.forEach(child => child.markDirty());
  }

  // 获取本地变换矩阵
  getLocalMatrix(): Mat4 {
    const p = this._position;
    const r = this._rotation;
    const s = this._scale;

    return Mat4.compose(p, r, s);
  }

  // 获取世界变换矩阵
  getWorldMatrix(): Mat4 {
    if (this._worldMatrixDirty) {
      if (this.parent) {
        this._worldMatrix = this.parent.getWorldMatrix().mul(this.getLocalMatrix());
      } else {
        this._worldMatrix = this.getLocalMatrix();
      }
      this._worldMatrixDirty = false;
    }
    return this._worldMatrix.clone();
  }

  // 设置父节点
  setParent(parent?: TransformNode): void {
    if (this.parent === parent) return;

    // 从旧父节点移除
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

    this.markDirty();
  }

  // 世界坐标到本地坐标
  worldToLocal(worldPos: Vec3): Vec3 {
    const worldMatrix = this.getWorldMatrix();
    const inverse = worldMatrix.inverse();
    return worldPos.applyMatrix4(inverse);
  }

  // 本地坐标到世界坐标
  localToWorld(localPos: Vec3): Vec3 {
    const worldMatrix = this.getWorldMatrix();
    return localPos.applyMatrix4(worldMatrix);
  }

  // 查看目标
  lookAt(target: Vec3, up: Vec3 = Vec3.up()): void {
    const worldPos = this.localToWorld(Vec3.zero());
    const direction = target.sub(worldPos).normalize();
    this.rotation = Quat.lookRotation(direction, up);
    this.markDirty();
  }

  // 更新所有子节点
  update(): void {
    // 更新自身
    this._worldMatrixDirty = true;

    // 递归更新子节点
    this.children.forEach(child => child.update());
  }

  // 打印层级信息
  printHierarchy(level: number = 0): void {
    const indent = '  '.repeat(level);
    const pos = this.localToWorld(Vec3.zero());
    console.log(`${indent}${this.name} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);

    this.children.forEach(child => child.printHierarchy(level + 1));
  }
}

// 场景管理器
class SceneManager {
  private rootNodes: TransformNode[] = [];

  addRootNode(node: TransformNode): void {
    this.rootNodes.push(node);
  }

  update(): void {
    this.rootNodes.forEach(node => node.update());
  }

  printScene(): void {
    console.log('Scene Hierarchy:');
    this.rootNodes.forEach(node => node.printHierarchy());
  }

  // 获取所有节点的世界包围盒
  getSceneBounds(): Box3 {
    let bounds = Box3.empty();

    const collectBounds = (node: TransformNode) => {
      // 这里假设每个节点有一个大小为1的包围盒
      const center = node.localToWorld(Vec3.zero());
      const size = Vec3.one().applyMatrix4(node.getWorldMatrix());

      const nodeBounds = new Box3(
        center.sub(size.mulScalar(0.5)),
        center.add(size.mulScalar(0.5))
      );

      bounds = Box3.union(bounds, nodeBounds);

      node.children.forEach(child => collectBounds(child));
    };

    this.rootNodes.forEach(node => collectBounds(node));
    return bounds;
  }
}

// 动画系统
class Animator {
  private nodes: Map<string, TransformNode> = new Map();
  private animations: Map<string, Animation> = new Map();
  private currentAnimations: Set<string> = new Set();
  private time: number = 0;

  addNode(name: string, node: TransformNode): void {
    this.nodes.set(name, node);
  }

  addAnimation(name: string, animation: Animation): void {
    this.animations.set(name, animation);
  }

  play(name: string): void {
    this.currentAnimations.add(name);
  }

  stop(name: string): void {
    this.currentAnimations.delete(name);
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    this.currentAnimations.forEach(animName => {
      const animation = this.animations.get(animName);
      const node = this.nodes.get(animName);

      if (animation && node) {
        animation.apply(node, this.time);
      }
    });
  }
}

// 简单的旋转动画
class RotationAnimation {
  constructor(
    private axis: Vec3,
    private speed: number
  ) {}

  apply(node: TransformNode, time: number): void {
    const angle = time * this.speed;
    const rotation = Quat.fromAxisAngle(this.axis, angle);
    node.rotation = rotation;
  }
}

// 弹跳动画
class BounceAnimation {
  constructor(
    private amplitude: number = 2,
    private frequency: number = 1,
    private baseY: number = 0
  ) {}

  apply(node: TransformNode, time: number): void {
    const y = this.baseY + Math.abs(Math.sin(time * this.frequency)) * this.amplitude;
    node.position = new Vec3(node.position.x, y, node.position.z);
  }
}

// 使用示例
function createScene(): SceneManager {
  const scene = new SceneManager();
  const animator = new Animator();

  // 创建层级结构
  const root = new TransformNode('Root');
  const body = new TransformNode('Body');
  const armLeft = new TransformNode('Arm_Left');
  const armRight = new TransformNode('Arm_Right');
  const head = new TransformNode('Head');

  // 构建层级
  scene.addRootNode(root);
  body.setParent(root);
  armLeft.setParent(body);
  armRight.setParent(body);
  head.setParent(body);

  // 设置初始位置
  body.position = new Vec3(0, 1, 0);
  armLeft.position = new Vec3(-0.7, 0.5, 0);
  armRight.position = new Vec3(0.7, 0.5, 0);
  head.position = new Vec3(0, 1.5, 0);

  // 设置初始旋转
  armLeft.rotation = Quat.fromAxisAngle(Vec3.forward(), Math.PI / 6);
  armRight.rotation = Quat.fromAxisAngle(Vec3.forward(), -Math.PI / 6);

  // 添加动画
  animator.addNode('Body', body);
  animator.addNode('Arm_Left', armLeft);
  animator.addNode('Arm_Right', armRight);
  animator.addNode('Head', head);

  // 添加旋转动画
  animator.addAnimation('Body', new RotationAnimation(Vec3.up(), 0.5));
  animator.addAnimation('Arm_Left', new RotationAnimation(Vec3.forward(), 2));
  animator.addAnimation('Arm_Right', new RotationAnimation(Vec3.forward(), -2));

  // 添加弹跳动画
  animator.addAnimation('Root', new BounceAnimation(0.5, 2, 0));

  // 播放动画
  animator.play('Body');
  animator.play('Arm_Left');
  animator.play('Arm_Right');
  animator.play('Root');

  // 动画循环
  function animate(currentTime: number) {
    const deltaTime = 0.016; // 假设60fps
    animator.update(deltaTime);
    scene.update();

    requestAnimationFrame(animate);
  }

  animate(0);

  return scene;
}

// 高级用法：相机控制
class CameraController {
  public target: Vec3 = Vec3.zero();
  public distance: number = 10;
  public azimuth: number = 0;  // 水平角度
  public elevation: number = Math.PI / 6; // 垂直角度

  getMatrix(): Mat4 {
    // 计算相机位置
    const x = this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
    const y = this.distance * Math.sin(this.elevation);
    const z = this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);

    const position = new Vec3(x, y, z);

    // 创建视图矩阵
    return Mat4.lookAt(position, this.target, Vec3.up());
  }

  orbit(deltaAzimuth: number, deltaElevation: number): void {
    this.azimuth += deltaAzimuth;
    this.elevation = Math.max(-Math.PI/2 + 0.1,
                             Math.min(Math.PI/2 - 0.1,
                                      this.elevation + deltaElevation));
  }

  zoom(delta: number): void {
    this.distance = Math.max(1, this.distance + delta);
  }
}

// 性能优化的批量变换
class BatchTransform {
  private positions: Float32Array;
  private rotations: Float32Array;
  private scales: Float32Array;
  private matrices: Float32Array;
  private count: number;

  constructor(count: number) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.rotations = new Float32Array(count * 4);
    this.scales = new Float32Array(count * 3);
    this.matrices = new Float32Array(count * 16);
  }

  setTransform(index: number, position: Vec3, rotation: Quat, scale: Vec3): void {
    const posOffset = index * 3;
    const rotOffset = index * 4;
    const scaleOffset = index * 3;

    // 设置数据
    this.positions[posOffset] = position.x;
    this.positions[posOffset + 1] = position.y;
    this.positions[posOffset + 2] = position.z;

    this.rotations[rotOffset] = rotation.x;
    this.rotations[rotOffset + 1] = rotation.y;
    this.rotations[rotOffset + 2] = rotation.z;
    this.rotations[rotOffset + 3] = rotation.w;

    this.scales[scaleOffset] = scale.x;
    this.scales[scaleOffset + 1] = scale.y;
    this.scales[scaleOffset + 2] = scale.z;
  }

  updateMatrices(): void {
    for (let i = 0; i < this.count; i++) {
      const posOffset = i * 3;
      const rotOffset = i * 4;
      const scaleOffset = i * 3;
      const matOffset = i * 16;

      const position = new Vec3(
        this.positions[posOffset],
        this.positions[posOffset + 1],
        this.positions[posOffset + 2]
      );

      const rotation = new Quat(
        this.rotations[rotOffset],
        this.rotations[rotOffset + 1],
        this.rotations[rotOffset + 2],
        this.rotations[rotOffset + 3]
      );

      const scale = new Vec3(
        this.scales[scaleOffset],
        this.scales[scaleOffset + 1],
        this.scales[scaleOffset + 2]
      );

      const matrix = Mat4.compose(position, rotation, scale);
      matrix.elements.copyWithin(matOffset, 0, 16);
    }
  }

  getMatrices(): Float32Array {
    return this.matrices;
  }
}

// 运行示例
const scene = createScene();
scene.printScene();

// 获取场景包围盒
const bounds = scene.getSceneBounds();
console.log('Scene bounds:', bounds);

// 创建相机控制器
const camera = new CameraController();
camera.distance = 20;
camera.azimuth = Math.PI / 4;

// 鼠标控制（伪代码）
canvas.addEventListener('wheel', (e) => {
  camera.zoom(e.deltaY * 0.01);
});

canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1) { // 左键按下
    camera.orbit(e.movementX * 0.01, e.movementY * 0.01);
  }
});
```

## 关键概念

### 1. 局部变换 vs 世界变换
- **局部变换**: 相对于父节点的变换
- **世界变换**: 相对于世界原点的最终变换

### 2. 矩阵组合
```typescript
// T * R * S 顺序很重要
const matrix = Mat4.compose(position, rotation, scale);
```

### 3. 四元数旋转
```typescript
// 从欧拉角创建
const quat = Quat.fromEuler(pitch, yaw, roll);

// 从轴角创建
const quat = Quat.fromAxisAngle(axis, angle);

// 旋转向量
const rotated = quat.transformVector(vector);
```

### 4. 坐标空间转换
```typescript
// 世界到本地
const localPos = node.worldToLocal(worldPos);

// 本地到世界
const worldPos = node.localToWorld(localPos);
```

## 性能优化

### 1. 延迟计算
只在需要时计算世界矩阵，使用脏标记模式。

### 2. 对象池
```typescript
const pos = Vec3.fromPool();
const rot = Quat.fromPool();
// 使用...
Vec3.toPool(pos);
Quat.toPool(rot);
```

### 3. 批量处理
对于大量对象，使用批量变换计算。

### 4. SIMD
Math库自动使用SIMD加速（在支持的浏览器中）。

## 常见陷阱

1. **旋转顺序**: 四元数乘法的顺序很重要
2. **万向锁**: 使用四元数避免欧拉角的问题
3. **矩阵精度**: 避免连续乘法导致的精度损失
4. **内存泄漏**: 及时释放从池中借用的对象

## 下一步

- [骨骼动画系统](./skeletal-animation.md)
- [约束系统](./constraints.md)
- [碰撞检测](./collision-detection.md)
- [空间分割结构](./spatial-partitioning.md)
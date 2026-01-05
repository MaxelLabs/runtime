# Engine Transform & Camera Integration Plan

## 概述

本计划旨在修复 `packages/engine` 中 `SimpleWebGLRenderer` 的两个关键问题：
1. **WorldTransform 集成**: 渲染器当前使用单位矩阵而非实体的 WorldTransform 组件
2. **Camera 集成**: 渲染器当前使用硬编码的视图/投影矩阵而非 Camera 组件

---

## ✅ 实现状态 (2026-01-05 更新)

### 已完成功能

| 功能 | 状态 | 位置 |
|------|------|------|
| WorldTransform Query | ✅ | [`simple-webgl-renderer.ts:468-469`](packages/engine/src/renderers/simple-webgl-renderer.ts:468) |
| buildModelMatrix() | ✅ | [`simple-webgl-renderer.ts:638-682`](packages/engine/src/renderers/simple-webgl-renderer.ts:638) |
| findMainCamera() | ✅ | [`simple-webgl-renderer.ts:525-555`](packages/engine/src/renderers/simple-webgl-renderer.ts:525) |
| buildViewMatrix() | ✅ | [`simple-webgl-renderer.ts:563-577`](packages/engine/src/renderers/simple-webgl-renderer.ts:563) |
| buildProjectionMatrix() | ✅ | [`simple-webgl-renderer.ts:593-602`](packages/engine/src/renderers/simple-webgl-renderer.ts:593) |
| 相机位置传递到材质 UBO | ✅ | [`simple-webgl-renderer.ts:488`](packages/engine/src/renderers/simple-webgl-renderer.ts:488) |

### 待修复问题

#### 问题: WorldTransform 初始化不完整

**位置**: [`engine.ts:637`](packages/engine/src/engine/engine.ts:637)

```typescript
// 当前代码 - WorldTransform 使用默认值初始化
this.scene.world.addComponent(entity, WorldTransform, new WorldTransform());
```

**影响**:
- `WorldTransform` 组件被添加但未从 `LocalTransform` 复制初始值
- 导致首帧渲染时所有 Mesh 都在原点 (0,0,0)
- Demo 中通过手动同步解决，但这不是正确的架构方案

**根本原因**: 缺少 `TransformSystem` 在渲染前将 `LocalTransform` 同步到 `WorldTransform`

---

## 原始问题分析 (已解决)

### ~~问题 1: WorldTransform 未被使用~~ ✅ 已修复

**原位置**: `simple-webgl-renderer.ts:463`

**修复方案**:
- Query 已包含 `WorldTransform` 组件
- `buildModelMatrix()` 方法已实现

### ~~问题 2: Camera 组件未被使用~~ ✅ 已修复

**原位置**: `simple-webgl-renderer.ts:603-604`

**修复方案**:
- `findMainCamera()` 方法已实现
- `buildViewMatrix()` 和 `buildProjectionMatrix()` 方法已实现

---

## 实施方案

### 任务 1: 集成 WorldTransform 到渲染器

#### 1.1 修改 Query 以包含 WorldTransform

**文件**: `packages/engine/src/renderers/simple-webgl-renderer.ts`

**修改位置**: `renderMeshInstances` 方法 (约第 442-494 行)

```typescript
// 修改前
import { MeshInstance, MaterialInstance } from '../components';

// 修改后
import { MeshInstance, MaterialInstance } from '../components';
import { WorldTransform } from '@maxellabs/core';
```

```typescript
// 修改前 (第 446-448 行)
const query = world.query({
  all: [MeshInstance, MaterialInstance],
});

// 修改后
const query = world.query({
  all: [MeshInstance, MaterialInstance, WorldTransform],
});
```

#### 1.2 从 WorldTransform 构建模型矩阵

**新增方法**: `buildModelMatrix`

```typescript
/**
 * 从 WorldTransform 组件构建模型矩阵
 * @param transform WorldTransform 组件
 * @returns 4x4 模型矩阵 (列主序)
 */
private buildModelMatrix(transform: WorldTransform): Float32Array {
  const { position, rotation, scale } = transform;

  // 从四元数构建旋转矩阵
  const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  const sx = scale.x, sy = scale.y, sz = scale.z;

  return new Float32Array([
    (1 - (yy + zz)) * sx, (xy + wz) * sx,       (xz - wy) * sx,       0,
    (xy - wz) * sy,       (1 - (xx + zz)) * sy, (yz + wx) * sy,       0,
    (xz + wy) * sz,       (yz - wx) * sz,       (1 - (xx + yy)) * sz, 0,
    position.x,           position.y,           position.z,           1
  ]);
}
```

#### 1.3 修改渲染循环使用 WorldTransform

```typescript
// 修改前 (第 454-466 行)
query.forEach((_entity, components) => {
  const meshInstance = components[0] as MeshInstance;
  const materialInstance = components[1] as MaterialInstance;

  if (!meshInstance.vertexBuffer || !materialInstance.material) {
    return;
  }

  // 更新矩阵 UBO
  this.updateMatricesUBO(this.createIdentityMatrix(), viewMatrix, projectionMatrix);
  // ...
});

// 修改后
query.forEach((_entity, components) => {
  const meshInstance = components[0] as MeshInstance;
  const materialInstance = components[1] as MaterialInstance;
  const worldTransform = components[2] as WorldTransform;

  if (!meshInstance.vertexBuffer || !materialInstance.material) {
    return;
  }

  // 从 WorldTransform 构建模型矩阵
  const modelMatrix = this.buildModelMatrix(worldTransform);

  // 更新矩阵 UBO
  this.updateMatricesUBO(modelMatrix, viewMatrix, projectionMatrix);
  // ...
});
```

---

### 任务 2: 集成 Camera 组件到渲染器

#### 2.1 添加 Camera 相关导入

```typescript
// 添加导入
import { Camera, CameraTarget, LocalTransform, WorldTransform } from '@maxellabs/core';
```

#### 2.2 新增方法: 查找主相机

```typescript
/**
 * 查找场景中的主相机
 * @param world ECS World
 * @returns 相机数据或 null
 */
private findMainCamera(world: World): {
  camera: Camera;
  transform: WorldTransform;
  target?: CameraTarget;
} | null {
  const query = world.query({
    all: [Camera, WorldTransform],
    optional: [CameraTarget],
  });

  let mainCameraData: {
    camera: Camera;
    transform: WorldTransform;
    target?: CameraTarget;
  } | null = null;

  query.forEach((_entity, components, optionalComponents) => {
    const camera = components[0] as Camera;
    const transform = components[1] as WorldTransform;
    const target = optionalComponents?.[0] as CameraTarget | undefined;

    // 优先选择 isMain = true 的相机
    if (camera.isMain || !mainCameraData) {
      mainCameraData = { camera, transform, target };
    }
  });

  world.removeQuery(query);
  return mainCameraData;
}
```

#### 2.3 新增方法: 从 Camera 组件构建视图矩阵

```typescript
/**
 * 从相机组件构建视图矩阵
 * @param transform 相机的 WorldTransform
 * @param target 可选的 CameraTarget
 * @returns 视图矩阵
 */
private buildViewMatrix(transform: WorldTransform, target?: CameraTarget): Float32Array {
  const eye = [transform.position.x, transform.position.y, transform.position.z];

  if (target) {
    // 使用 LookAt 目标
    const targetPos = [target.target.x, target.target.y, target.target.z];
    const up = [target.up.x, target.up.y, target.up.z];
    return this.createLookAtMatrix(eye, targetPos, up);
  } else {
    // 从相机的旋转四元数计算前向方向
    const { rotation } = transform;
    const forward = this.quaternionToForward(rotation);
    const targetPos = [
      eye[0] - forward[0],
      eye[1] - forward[1],
      eye[2] - forward[2]
    ];
    return this.createLookAtMatrix(eye, targetPos, [0, 1, 0]);
  }
}

/**
 * 从四元数提取前向方向
 */
private quaternionToForward(q: { x: number; y: number; z: number; w: number }): number[] {
  const { x, y, z, w } = q;
  return [
    2 * (x * z + w * y),
    2 * (y * z - w * x),
    1 - 2 * (x * x + y * y)
  ];
}
```

#### 2.4 新增方法: 从 Camera 组件构建投影矩阵

```typescript
/**
 * 从 Camera 组件构建投影矩阵
 * @param camera Camera 组件
 * @param aspect 宽高比 (如果 camera.aspect 未设置则使用此值)
 * @returns 投影矩阵
 */
private buildProjectionMatrix(camera: Camera, aspect: number): Float32Array {
  const actualAspect = camera.aspect || aspect;

  if (camera.projectionType === 'orthographic') {
    return this.createOrthographicMatrix(
      camera.orthographicSize,
      actualAspect,
      camera.near,
      camera.far
    );
  } else {
    // 透视投影
    return this.createPerspectiveMatrix(
      camera.fov, // Camera.fov 已经是度数
      actualAspect,
      camera.near,
      camera.far
    );
  }
}

/**
 * 创建正交投影矩阵
 */
private createOrthographicMatrix(
  size: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const halfHeight = size;
  const halfWidth = size * aspect;

  return new Float32Array([
    1 / halfWidth, 0, 0, 0,
    0, 1 / halfHeight, 0, 0,
    0, 0, -2 / (far - near), 0,
    0, 0, -(far + near) / (far - near), 1
  ]);
}
```

#### 2.5 修改 renderMeshInstances 使用相机组件

```typescript
private renderMeshInstances(ctx: RenderContext, renderPass: MSpec.IRHIRenderPass, aspect: number): void {
  const world = ctx.scene.world;

  // 查找主相机
  const cameraData = this.findMainCamera(world);

  // 获取视图和投影矩阵
  let viewMatrix: Float32Array;
  let projectionMatrix: Float32Array;

  if (cameraData) {
    viewMatrix = this.buildViewMatrix(cameraData.transform, cameraData.target);
    projectionMatrix = this.buildProjectionMatrix(cameraData.camera, aspect);
  } else {
    // 回退到默认值
    console.warn('[SimpleWebGLRenderer] No camera found, using defaults');
    viewMatrix = this.createDefaultViewMatrix();
    projectionMatrix = this.createDefaultProjectionMatrix(aspect);
  }

  // ... 其余渲染代码
}
```

#### 2.6 更新材质 UBO 中的相机位置

```typescript
private updateMaterialUBO(
  material: PBRMaterial | UnlitMaterial,
  cameraPosition?: { x: number; y: number; z: number }
): void {
  // ... 现有代码 ...

  // cameraPosition (vec3) + pad
  const camPos = cameraPosition ?? { x: 0, y: 2, z: 5 };
  data[16] = camPos.x;
  data[17] = camPos.y;
  data[18] = camPos.z;
  data[19] = 0; // _pad3

  this.materialBuffer.update(data);
}
```

---

### 任务 3: 更新 Demo 验证集成效果

#### 3.1 修改 quick-start.ts 添加变换测试

**文件**: `packages/engine/demo/src/quick-start.ts`

```typescript
// 创建多个 Mesh 在不同位置
const box1 = engine.createMesh(boxGeometry, redMaterial, {
  position: [-2, 0, 0],
  name: 'RedBox'
});

const box2 = engine.createMesh(boxGeometry, greenMaterial, {
  position: [0, 0, 0],
  name: 'GreenBox'
});

const box3 = engine.createMesh(boxGeometry, blueMaterial, {
  position: [2, 0, 0],
  name: 'BlueBox'
});

// 测试相机移动
let time = 0;
engine.onBeforeRender = (deltaTime) => {
  time += deltaTime;

  // 获取主相机并更新位置
  const cameraEntity = engine.mainCamera;
  if (cameraEntity !== null) {
    const localTransform = engine.scene.world.getComponent(cameraEntity, LocalTransform);
    if (localTransform) {
      // 相机绕 Y 轴旋转
      const radius = 5;
      localTransform.position.x = Math.sin(time * 0.5) * radius;
      localTransform.position.z = Math.cos(time * 0.5) * radius;
      localTransform.markDirty();
    }
  }
};
```

---

## 依赖关系

```mermaid
graph TD
    A[SimpleWebGLRenderer] --> B[WorldTransform]
    A --> C[Camera]
    A --> D[CameraTarget]
    A --> E[LocalTransform]

    B --> F[@maxellabs/core]
    C --> F
    D --> F
    E --> F

    G[Engine] --> A
    G --> H[createMesh - 已添加 WorldTransform]
    G --> I[createCamera - 已添加 Camera 组件]
```

---

## 测试验证

### 验证点 1: WorldTransform 集成
- [x] 创建多个 Mesh 在不同位置，验证它们正确渲染在各自位置
- [x] 修改 Mesh 的 LocalTransform.position，验证渲染位置更新
- [x] 测试旋转和缩放是否正确应用

### 验证点 2: Camera 集成
- [x] 修改相机位置，验证视角变化
- [x] 修改 CameraTarget.target，验证 LookAt 效果
- [x] 测试透视投影参数 (FOV, near, far)
- [ ] 测试正交投影

### 验证点 3: 回归测试
- [x] 现有 Demo 仍然正常工作
- [x] 没有 Camera 组件时使用默认值

---

## 风险与注意事项

1. **TransformSystem 依赖**: ⚠️ **当前缺失** - 需要实现 `TransformSystem` 在渲染前将 `LocalTransform` 同步到 `WorldTransform`
2. **矩阵顺序**: ✅ WebGL 使用列主序矩阵，`buildModelMatrix()` 已正确实现
3. **四元数归一化**: ⚠️ 假设输入四元数已归一化，未做验证
4. **性能**: ⚠️ 每帧查询相机，考虑缓存主相机引用

## 下一步行动

### 短期方案 (Workaround)
在 `Engine.createMesh()` 中初始化 `WorldTransform` 时复制 `LocalTransform` 的值：

```typescript
// engine.ts:637 修改
const worldTransform = WorldTransform.fromData({
  position: { x: pos[0], y: pos[1], z: pos[2] },
  rotation: { x: rot[0], y: rot[1], z: rot[2], w: rot[3] },
  scale: { x: scl[0], y: scl[1], z: scl[2] },
});
this.scene.world.addComponent(entity, WorldTransform, worldTransform);
```

### 长期方案 (Proper Architecture)
实现 `TransformSystem`:
1. 在 `SystemStage.PreRender` 阶段运行
2. 遍历所有带有 `LocalTransform` + `WorldTransform` 的实体
3. 考虑 `Parent` 组件进行层级变换计算
4. 将计算结果写入 `WorldTransform`

---

## 实施顺序

1. **Phase 1**: 集成 WorldTransform (任务 1) ✅ **已完成**
   - ✅ 修改 Query
   - ✅ 添加 buildModelMatrix 方法
   - ✅ 修改渲染循环

2. **Phase 2**: 集成 Camera (任务 2) ✅ **已完成**
   - ✅ 添加相机查找方法
   - ✅ 添加视图/投影矩阵构建方法
   - ✅ 修改渲染循环使用相机数据

3. **Phase 3**: 验证 (任务 3) ⏳ **进行中**
   - ✅ 更新 Demo
   - ⏳ 运行测试

4. **Phase 4**: 修复 WorldTransform 初始化 ⏳ **待实施**
   - [ ] 修改 `Engine.createMesh()` 初始化 WorldTransform
   - [ ] 修改 `Engine.createDefaultCamera()` 初始化 WorldTransform
   - [ ] 修改 `Engine.createCamera()` 初始化 WorldTransform

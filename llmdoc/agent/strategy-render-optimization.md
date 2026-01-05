---
id: "strategy-render-optimization"
type: "strategy"
title: "渲染优化系统技术规格"
description: "Engine 包渲染优化技术的详细规格，包括视锥剔除、批处理、LOD、实例化渲染等"
tags: ["engine", "optimization", "culling", "batching", "lod", "instancing", "performance"]
context_dependency: ["arch-engine-architecture-spec"]
related_ids: ["arch-engine-architecture-spec"]
last_updated: "2026-01-05"
---

# 渲染优化系统技术规格

> **Context**: Engine 包需要高效的渲染优化以支持复杂场景。
> **Goal**: 实现视锥剔除、批处理、LOD 和实例化渲染等优化技术。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| 视锥剔除 | Frustum Culling | P1 |
| 批处理 | Draw Call Batching | P1 |
| 实例化渲染 | GPU Instancing | P1 |
| LOD 系统 | Level of Detail | P2 |
| 遮挡剔除 | Occlusion Culling | P3 |
| 空间分区 | BVH/Octree | P2 |
| 排序优化 | 状态排序 | P1 |

### 1.2 性能目标

| 指标 | 目标值 |
|------|--------|
| 剔除计算 | < 1ms (10K 对象) |
| 批处理开销 | < 0.5ms |
| Draw Call | < 500 (复杂场景) |
| 内存开销 | < 10MB (优化数据结构) |

---

## 2. 视锥剔除系统

### 2.1 视锥体定义

```typescript
/**
 * 视锥体平面
 */
interface FrustumPlane {
  /** 平面法向量 */
  normal: Vector3Like;
  /** 平面到原点距离 */
  distance: number;
}

/**
 * 视锥体
 */
interface Frustum {
  /** 6 个平面: Near, Far, Left, Right, Top, Bottom */
  planes: [FrustumPlane, FrustumPlane, FrustumPlane, FrustumPlane, FrustumPlane, FrustumPlane];
}

/**
 * 包围盒
 */
interface AABB {
  min: Vector3Like;
  max: Vector3Like;
}

/**
 * 包围球
 */
interface BoundingSphere {
  center: Vector3Like;
  radius: number;
}
```

### 2.2 视锥体提取

```pseudocode
/**
 * 从 ViewProjection 矩阵提取视锥体平面
 * @param vp ViewProjection 矩阵 (列主序)
 */
FUNCTION extractFrustumPlanes(vp: Matrix4): Frustum
  planes = []
  
  // Left plane: row3 + row0
  planes[0] = normalizePlane({
    normal: {
      x: vp[3] + vp[0],
      y: vp[7] + vp[4],
      z: vp[11] + vp[8]
    },
    distance: vp[15] + vp[12]
  })
  
  // Right plane: row3 - row0
  planes[1] = normalizePlane({
    normal: {
      x: vp[3] - vp[0],
      y: vp[7] - vp[4],
      z: vp[11] - vp[8]
    },
    distance: vp[15] - vp[12]
  })
  
  // Bottom plane: row3 + row1
  planes[2] = normalizePlane({
    normal: {
      x: vp[3] + vp[1],
      y: vp[7] + vp[5],
      z: vp[11] + vp[9]
    },
    distance: vp[15] + vp[13]
  })
  
  // Top plane: row3 - row1
  planes[3] = normalizePlane({
    normal: {
      x: vp[3] - vp[1],
      y: vp[7] - vp[5],
      z: vp[11] - vp[9]
    },
    distance: vp[15] - vp[13]
  })
  
  // Near plane: row3 + row2
  planes[4] = normalizePlane({
    normal: {
      x: vp[3] + vp[2],
      y: vp[7] + vp[6],
      z: vp[11] + vp[10]
    },
    distance: vp[15] + vp[14]
  })
  
  // Far plane: row3 - row2
  planes[5] = normalizePlane({
    normal: {
      x: vp[3] - vp[2],
      y: vp[7] - vp[6],
      z: vp[11] - vp[10]
    },
    distance: vp[15] - vp[14]
  })
  
  RETURN { planes }

FUNCTION normalizePlane(plane: FrustumPlane): FrustumPlane
  len = length(plane.normal)
  RETURN {
    normal: divide(plane.normal, len),
    distance: plane.distance / len
  }
```

### 2.3 剔除测试

```pseudocode
/**
 * 测试 AABB 是否在视锥体内
 * @returns -1: 完全在外, 0: 相交, 1: 完全在内
 */
FUNCTION testAABBFrustum(aabb: AABB, frustum: Frustum): number
  result = 1  // 假设完全在内
  
  FOR plane IN frustum.planes:
    // 计算 AABB 的正负顶点
    pVertex = {
      x: plane.normal.x >= 0 ? aabb.max.x : aabb.min.x,
      y: plane.normal.y >= 0 ? aabb.max.y : aabb.min.y,
      z: plane.normal.z >= 0 ? aabb.max.z : aabb.min.z
    }
    
    nVertex = {
      x: plane.normal.x >= 0 ? aabb.min.x : aabb.max.x,
      y: plane.normal.y >= 0 ? aabb.min.y : aabb.max.y,
      z: plane.normal.z >= 0 ? aabb.min.z : aabb.max.z
    }
    
    // 测试正顶点
    pDist = dot(plane.normal, pVertex) + plane.distance
    IF pDist < 0:
      RETURN -1  // 完全在外
    
    // 测试负顶点
    nDist = dot(plane.normal, nVertex) + plane.distance
    IF nDist < 0:
      result = 0  // 相交
  
  RETURN result

/**
 * 测试包围球是否在视锥体内
 */
FUNCTION testSphereFrustum(sphere: BoundingSphere, frustum: Frustum): number
  result = 1
  
  FOR plane IN frustum.planes:
    dist = dot(plane.normal, sphere.center) + plane.distance
    
    IF dist < -sphere.radius:
      RETURN -1  // 完全在外
    
    IF dist < sphere.radius:
      result = 0  // 相交
  
  RETURN result
```

### 2.4 剔除系统实现

```pseudocode
CLASS FrustumCullingSystem:
  PRIVATE frustum: Frustum
  PRIVATE visibleEntities: EntityId[]
  
  FUNCTION update(camera: CameraComponent, renderables: RenderableQuery):
    // 提取视锥体
    vp = multiply(camera.projectionMatrix, camera.viewMatrix)
    frustum = extractFrustumPlanes(vp)
    
    // 清空可见列表
    visibleEntities = []
    
    // 遍历所有可渲染对象
    FOR entity, (transform, bounds, meshInstance) IN renderables:
      // 变换包围盒到世界空间
      worldBounds = transformAABB(bounds.localAABB, transform.worldMatrix)
      
      // 视锥剔除测试
      result = testAABBFrustum(worldBounds, frustum)
      
      IF result >= 0:  // 在内或相交
        visibleEntities.push(entity)
        meshInstance.visible = true
      ELSE:
        meshInstance.visible = false
    
    RETURN visibleEntities
```

---

## 3. 批处理系统

### 3.1 批处理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                     Batching Strategy                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  排序键 (Sort Key) 64-bit:                                       │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐        │
│  │ Layer  │ Blend  │ Shader │Material│  Mesh  │ Depth  │        │
│  │ 4-bit  │ 2-bit  │ 12-bit │ 16-bit │ 16-bit │ 14-bit │        │
│  └────────┴────────┴────────┴────────┴────────┴────────┘        │
│                                                                  │
│  排序优先级:                                                      │
│  1. Layer (渲染层)                                               │
│  2. Blend Mode (不透明 > 透明)                                   │
│  3. Shader Program (减少着色器切换)                              │
│  4. Material (减少 Uniform 更新)                                 │
│  5. Mesh (减少 VAO 切换)                                         │
│  6. Depth (透明物体从后往前)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 批处理接口

```typescript
/**
 * 渲染批次
 */
interface RenderBatch {
  /** 排序键 */
  sortKey: bigint;
  /** 着色器程序 */
  shader: IRHIPipeline;
  /** 材质 */
  material: IMaterial;
  /** 网格 */
  mesh: IMesh;
  /** 实例数据 */
  instances: InstanceData[];
}

/**
 * 实例数据
 */
interface InstanceData {
  /** 世界矩阵 */
  worldMatrix: Float32Array;
  /** 自定义数据 */
  customData?: Float32Array;
}

/**
 * 批处理器
 */
interface IBatcher {
  /**
   * 添加渲染项
   */
  add(item: RenderItem): void;
  
  /**
   * 排序并生成批次
   */
  flush(): RenderBatch[];
  
  /**
   * 清空
   */
  clear(): void;
}
```

### 3.3 批处理实现

```pseudocode
CLASS RenderBatcher IMPLEMENTS IBatcher:
  PRIVATE items: RenderItem[] = []
  PRIVATE batches: Map<bigint, RenderBatch> = new Map()
  
  FUNCTION add(item: RenderItem):
    items.push(item)
  
  FUNCTION flush(): RenderBatch[]
    // Step 1: 计算排序键
    FOR item IN items:
      item.sortKey = computeSortKey(item)
    
    // Step 2: 排序
    items.sort((a, b) => a.sortKey - b.sortKey)
    
    // Step 3: 合并批次
    batches.clear()
    
    FOR item IN items:
      batchKey = getBatchKey(item)  // 不包含 depth
      
      IF batches.has(batchKey):
        batch = batches.get(batchKey)
        batch.instances.push({
          worldMatrix: item.worldMatrix,
          customData: item.customData
        })
      ELSE:
        batches.set(batchKey, {
          sortKey: item.sortKey,
          shader: item.shader,
          material: item.material,
          mesh: item.mesh,
          instances: [{
            worldMatrix: item.worldMatrix,
            customData: item.customData
          }]
        })
    
    // Step 4: 返回排序后的批次
    result = Array.from(batches.values())
    result.sort((a, b) => a.sortKey - b.sortKey)
    
    RETURN result
  
  PRIVATE FUNCTION computeSortKey(item: RenderItem): bigint
    key = 0n
    
    // Layer (4-bit)
    key |= BigInt(item.layer & 0xF) << 60n
    
    // Blend Mode (2-bit)
    blendBits = item.material.transparent ? 1 : 0
    key |= BigInt(blendBits) << 58n
    
    // Shader ID (12-bit)
    key |= BigInt(item.shader.id & 0xFFF) << 46n
    
    // Material ID (16-bit)
    key |= BigInt(item.material.id & 0xFFFF) << 30n
    
    // Mesh ID (16-bit)
    key |= BigInt(item.mesh.id & 0xFFFF) << 14n
    
    // Depth (14-bit) - 透明物体从后往前
    IF item.material.transparent:
      depth = encodeDepth(item.depth)  // 反向编码
    ELSE:
      depth = 0  // 不透明物体不关心深度
    key |= BigInt(depth & 0x3FFF)
    
    RETURN key
```

---

## 4. 实例化渲染

### 4.1 实例化数据布局

```typescript
/**
 * 实例化缓冲区布局
 */
interface InstanceBufferLayout {
  /** 每实例字节数 */
  stride: number;
  /** 属性列表 */
  attributes: InstanceAttribute[];
}

interface InstanceAttribute {
  /** 属性名 */
  name: string;
  /** 偏移量 */
  offset: number;
  /** 格式 */
  format: VertexFormat;
  /** 着色器位置 */
  location: number;
}

// 默认实例化布局: 世界矩阵 (4x vec4)
const DEFAULT_INSTANCE_LAYOUT: InstanceBufferLayout = {
  stride: 64,  // 4x4 float matrix
  attributes: [
    { name: 'a_instanceMatrix0', offset: 0,  format: 'float4', location: 4 },
    { name: 'a_instanceMatrix1', offset: 16, format: 'float4', location: 5 },
    { name: 'a_instanceMatrix2', offset: 32, format: 'float4', location: 6 },
    { name: 'a_instanceMatrix3', offset: 48, format: 'float4', location: 7 }
  ]
};
```

### 4.2 实例化渲染器

```pseudocode
CLASS InstancedRenderer:
  PRIVATE instanceBuffer: IRHIBuffer
  PRIVATE instanceData: Float32Array
  PRIVATE maxInstances: number = 1000
  
  FUNCTION initialize(device: IRHIDevice):
    // 创建实例缓冲区
    instanceBuffer = device.createBuffer({
      size: maxInstances * 64,  // 64 bytes per instance
      usage: VERTEX | COPY_DST,
      mappedAtCreation: false
    })
    
    instanceData = new Float32Array(maxInstances * 16)
  
  FUNCTION renderBatch(batch: RenderBatch, encoder: IRHICommandEncoder):
    instanceCount = batch.instances.length
    
    IF instanceCount == 0:
      RETURN
    
    // 更新实例数据
    FOR i = 0 TO instanceCount - 1:
      instance = batch.instances[i]
      instanceData.set(instance.worldMatrix, i * 16)
    
    // 上传到 GPU
    device.queue.writeBuffer(
      instanceBuffer,
      0,
      instanceData.buffer,
      0,
      instanceCount * 64
    )
    
    // 设置管线
    encoder.setPipeline(batch.shader)
    
    // 绑定顶点缓冲区
    encoder.setVertexBuffer(0, batch.mesh.vertexBuffer)
    encoder.setVertexBuffer(1, instanceBuffer)  // 实例缓冲区
    
    // 绑定索引缓冲区
    IF batch.mesh.indexBuffer:
      encoder.setIndexBuffer(batch.mesh.indexBuffer, 'uint16')
      encoder.drawIndexed(batch.mesh.indexCount, instanceCount)
    ELSE:
      encoder.draw(batch.mesh.vertexCount, instanceCount)
```

### 4.3 实例化着色器

```glsl
// instanced.vert
#version 300 es

// 顶点属性
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

// 实例属性
layout(location = 4) in vec4 a_instanceMatrix0;
layout(location = 5) in vec4 a_instanceMatrix1;
layout(location = 6) in vec4 a_instanceMatrix2;
layout(location = 7) in vec4 a_instanceMatrix3;

// Uniforms
uniform mat4 u_viewProjection;

// Outputs
out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec2 v_uv;

void main() {
    // 重建世界矩阵
    mat4 worldMatrix = mat4(
        a_instanceMatrix0,
        a_instanceMatrix1,
        a_instanceMatrix2,
        a_instanceMatrix3
    );
    
    // 计算世界位置
    vec4 worldPos = worldMatrix * vec4(a_position, 1.0);
    v_worldPosition = worldPos.xyz;
    
    // 计算世界法线 (假设均匀缩放)
    mat3 normalMatrix = mat3(worldMatrix);
    v_worldNormal = normalize(normalMatrix * a_normal);
    
    // UV
    v_uv = a_uv;
    
    // 最终位置
    gl_Position = u_viewProjection * worldPos;
}
```

---

## 5. LOD 系统

### 5.1 LOD 配置

```typescript
/**
 * LOD 级别
 */
interface LODLevel {
  /** 距离阈值 */
  distance: number;
  /** 网格 */
  mesh: IMesh;
  /** 屏幕覆盖率阈值 (可选) */
  screenCoverage?: number;
}

/**
 * LOD 组件
 */
interface LODComponent {
  /** LOD 级别列表 (按距离升序) */
  levels: LODLevel[];
  /** 当前 LOD 级别 */
  currentLevel: number;
  /** 过渡模式 */
  transitionMode: 'instant' | 'fade' | 'dither';
  /** 过渡时间 */
  transitionTime: number;
}
```

### 5.2 LOD 选择算法

```pseudocode
CLASS LODSystem:
  FUNCTION update(camera: CameraComponent, lodEntities: LODQuery):
    cameraPosition = camera.position
    
    FOR entity, (transform, lod, meshInstance) IN lodEntities:
      // 计算到相机的距离
      distance = length(subtract(transform.worldPosition, cameraPosition))
      
      // 选择 LOD 级别
      newLevel = selectLODLevel(lod.levels, distance)
      
      IF newLevel != lod.currentLevel:
        // 更新 LOD
        lod.currentLevel = newLevel
        meshInstance.mesh = lod.levels[newLevel].mesh
        
        // 触发过渡效果
        IF lod.transitionMode == 'fade':
          startFadeTransition(entity, lod.transitionTime)
  
  PRIVATE FUNCTION selectLODLevel(levels: LODLevel[], distance: number): number
    FOR i = 0 TO levels.length - 1:
      IF distance < levels[i].distance:
        RETURN i
    
    RETURN levels.length - 1  // 最低 LOD

/**
 * 基于屏幕覆盖率的 LOD 选择
 */
FUNCTION selectLODByScreenCoverage(
  bounds: BoundingSphere,
  camera: CameraComponent,
  levels: LODLevel[]
): number
  // 计算屏幕覆盖率
  distance = length(subtract(bounds.center, camera.position))
  projectedRadius = bounds.radius / distance
  screenCoverage = projectedRadius * camera.focalLength / camera.sensorHeight
  
  FOR i = 0 TO levels.length - 1:
    IF screenCoverage > levels[i].screenCoverage:
      RETURN i
  
  RETURN levels.length - 1
```

---

## 6. 空间分区

### 6.1 BVH 结构

```typescript
/**
 * BVH 节点
 */
interface BVHNode {
  /** 包围盒 */
  bounds: AABB;
  /** 左子节点 */
  left: BVHNode | null;
  /** 右子节点 */
  right: BVHNode | null;
  /** 叶子节点包含的实体 */
  entities: EntityId[];
  /** 是否是叶子节点 */
  isLeaf: boolean;
}

/**
 * BVH 树
 */
interface IBVH {
  /** 根节点 */
  root: BVHNode;
  
  /**
   * 构建 BVH
   */
  build(entities: EntityId[], getBounds: (id: EntityId) => AABB): void;
  
  /**
   * 查询与视锥体相交的实体
   */
  queryFrustum(frustum: Frustum): EntityId[];
  
  /**
   * 查询与射线相交的实体
   */
  queryRay(ray: Ray): EntityId[];
  
  /**
   * 更新单个实体
   */
  update(entity: EntityId, newBounds: AABB): void;
}
```

### 6.2 BVH 构建

```pseudocode
CLASS BVH IMPLEMENTS IBVH:
  root: BVHNode
  
  FUNCTION build(entities: EntityId[], getBounds: Function):
    IF entities.length == 0:
      root = null
      RETURN
    
    root = buildNode(entities, getBounds, 0)
  
  PRIVATE FUNCTION buildNode(
    entities: EntityId[],
    getBounds: Function,
    depth: number
  ): BVHNode
    // 计算所有实体的包围盒
    bounds = computeCombinedBounds(entities, getBounds)
    
    // 叶子节点条件
    IF entities.length <= 4 OR depth >= 20:
      RETURN {
        bounds,
        left: null,
        right: null,
        entities,
        isLeaf: true
      }
    
    // 选择分割轴 (最长轴)
    axis = getLongestAxis(bounds)
    
    // 按中心点排序
    entities.sort((a, b) => {
      centerA = getCenter(getBounds(a))[axis]
      centerB = getCenter(getBounds(b))[axis]
      RETURN centerA - centerB
    })
    
    // 分割
    mid = floor(entities.length / 2)
    leftEntities = entities.slice(0, mid)
    rightEntities = entities.slice(mid)
    
    RETURN {
      bounds,
      left: buildNode(leftEntities, getBounds, depth + 1),
      right: buildNode(rightEntities, getBounds, depth + 1),
      entities: [],
      isLeaf: false
    }
  
  FUNCTION queryFrustum(frustum: Frustum): EntityId[]
    result = []
    queryFrustumNode(root, frustum, result)
    RETURN result
  
  PRIVATE FUNCTION queryFrustumNode(
    node: BVHNode,
    frustum: Frustum,
    result: EntityId[]
  ):
    IF node == null:
      RETURN
    
    // 测试节点包围盒
    test = testAABBFrustum(node.bounds, frustum)
    
    IF test == -1:  // 完全在外
      RETURN
    
    IF node.isLeaf:
      // 叶子节点: 添加所有实体
      result.push(...node.entities)
    ELSE:
      // 递归子节点
      queryFrustumNode(node.left, frustum, result)
      queryFrustumNode(node.right, frustum, result)
```

---

## 7. 渲染管线优化

### 7.1 状态缓存

```pseudocode
CLASS RenderStateCache:
  PRIVATE currentPipeline: IRHIPipeline = null
  PRIVATE currentBindGroups: Map<number, IRHIBindGroup> = new Map()
  PRIVATE currentVertexBuffers: Map<number, IRHIBuffer> = new Map()
  PRIVATE currentIndexBuffer: IRHIBuffer = null
  
  FUNCTION setPipeline(encoder: IRHICommandEncoder, pipeline: IRHIPipeline):
    IF pipeline != currentPipeline:
      encoder.setPipeline(pipeline)
      currentPipeline = pipeline
      // 管线改变时清空绑定组缓存
      currentBindGroups.clear()
  
  FUNCTION setBindGroup(
    encoder: IRHICommandEncoder,
    index: number,
    bindGroup: IRHIBindGroup
  ):
    IF currentBindGroups.get(index) != bindGroup:
      encoder.setBindGroup(index, bindGroup)
      currentBindGroups.set(index, bindGroup)
  
  FUNCTION setVertexBuffer(
    encoder: IRHICommandEncoder,
    slot: number,
    buffer: IRHIBuffer
  ):
    IF currentVertexBuffers.get(slot) != buffer:
      encoder.setVertexBuffer(slot, buffer)
      currentVertexBuffers.set(slot, buffer)
  
  FUNCTION setIndexBuffer(
    encoder: IRHICommandEncoder,
    buffer: IRHIBuffer,
    format: string
  ):
    IF buffer != currentIndexBuffer:
      encoder.setIndexBuffer(buffer, format)
      currentIndexBuffer = buffer
  
  FUNCTION reset():
    currentPipeline = null
    currentBindGroups.clear()
    currentVertexBuffers.clear()
    currentIndexBuffer = null
```

### 7.2 优化后的渲染循环

```pseudocode
FUNCTION optimizedRenderLoop(scene: Scene, camera: Camera):
  // Phase 1: 剔除
  frustum = extractFrustumPlanes(camera.viewProjectionMatrix)
  visibleEntities = bvh.queryFrustum(frustum)
  
  // Phase 2: 收集渲染项
  batcher.clear()
  FOR entity IN visibleEntities:
    meshInstance = getMeshInstance(entity)
    IF meshInstance.visible:
      batcher.add({
        entity,
        mesh: meshInstance.mesh,
        material: meshInstance.material,
        worldMatrix: getWorldMatrix(entity),
        depth: computeDepth(entity, camera)
      })
  
  // Phase 3: 批处理
  batches = batcher.flush()
  
  // Phase 4: 渲染
  stateCache.reset()
  
  FOR batch IN batches:
    // 设置管线
    stateCache.setPipeline(encoder, batch.shader)
    
    // 设置材质
    stateCache.setBindGroup(encoder, 0, batch.material.bindGroup)
    
    // 设置相机
    stateCache.setBindGroup(encoder, 1, camera.bindGroup)
    
    // 渲染实例
    IF batch.instances.length > 1:
      // 实例化渲染
      instancedRenderer.renderBatch(batch, encoder)
    ELSE:
      // 单个渲染
      stateCache.setVertexBuffer(encoder, 0, batch.mesh.vertexBuffer)
      stateCache.setIndexBuffer(encoder, batch.mesh.indexBuffer, 'uint16')
      encoder.drawIndexed(batch.mesh.indexCount, 1)
```

---

## 8. 实现步骤

### 8.1 Step 1: 实现视锥剔除

**文件**: `packages/engine/src/culling/frustum-culling.ts`

### 8.2 Step 2: 实现批处理系统

**文件**: `packages/engine/src/rendering/batcher.ts`

### 8.3 Step 3: 实现实例化渲染

**文件**: `packages/engine/src/rendering/instanced-renderer.ts`

### 8.4 Step 4: 实现 BVH

**文件**: `packages/engine/src/culling/bvh.ts`

### 8.5 Step 5: 实现 LOD 系统

**文件**: `packages/engine/src/lod/lod-system.ts`

### 8.6 Step 6: 集成到渲染器

**文件**: `packages/engine/src/renderers/simple-webgl-renderer.ts`

---

## 9. 验证标准

- [ ] 视锥剔除正确工作
- [ ] 批处理减少 Draw Call
- [ ] 实例化渲染正常
- [ ] BVH 查询高效
- [ ] LOD 切换平滑
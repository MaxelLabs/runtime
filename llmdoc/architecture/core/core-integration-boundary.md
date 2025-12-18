---
id: "core-integration-boundary"
type: "architecture"
title: "Core-Engine-RHI Integration Boundary"
description: "定义Core、Engine、RHI三个包之间的职责边界、数据流向和集成契约"
tags: ["integration", "boundary", "core", "engine", "rhi", "architecture", "data-flow"]
context_dependency: ["core-ecs-architecture", "rhi-architecture"]
related_ids: ["graphics-system-bible", "engine-architecture"]
token_cost: "high"
---

# Core-Engine-RHI Integration Boundary

## Context

本文档定义 `@maxellabs/core`、`@maxellabs/engine`、`@maxellabs/rhi` 三个核心包之间的集成边界和契约。确保各包职责清晰、依赖单向、接口稳定。

## Goal

1. 明确各包的职责边界
2. 定义包间的数据流向
3. 规范集成接口契约
4. 防止循环依赖

---

## 第一章：包层级架构

### 1.1 依赖关系图

```
                    ┌──────────────────────────────────────┐
                    │        Application Layer              │
                    │    (游戏/设计工具/可视化应用)          │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         @maxellabs/engine                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ SceneManager│ │RenderSystem │ │CullingSystem│ │InputSystem  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │MeshComponent│ │CameraComp.  │ │LightComponent│ │MaterialComp.│       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                          │
│  职责: 渲染相关组件/系统实现, 场景管理, 资源绑定                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────────┐
│ @maxellabs/core │ │ @maxellabs/rhi  │ │ @maxellabs/specification        │
│                 │ │                 │ │                                 │
│ ECS框架        │ │ 图形API抽象     │ │ 类型定义                        │
│ Transform组件   │ │ WebGL实现      │ │ 接口规范                        │
│ 层级关系       │ │ 资源管理        │ │ USD兼容                         │
│ 事件系统       │ │ 渲染命令       │ │                                 │
└────────┬────────┘ └────────┬────────┘ └─────────────────────────────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ @maxellabs/math │
         │                 │
         │ 向量/矩阵/四元数 │
         │ 几何计算        │
         └─────────────────┘
```

### 1.2 依赖规则

```typescript
/**
 * 依赖规则约束
 */
const DEPENDENCY_RULES = {
  '@maxellabs/math': [],                              // 无依赖
  '@maxellabs/specification': ['@maxellabs/math'],    // 仅依赖math
  '@maxellabs/core': ['@maxellabs/math', '@maxellabs/specification'],
  '@maxellabs/rhi': ['@maxellabs/math', '@maxellabs/specification'],
  '@maxellabs/engine': ['@maxellabs/core', '@maxellabs/rhi', '@maxellabs/math', '@maxellabs/specification'],
};

// 负面约束
const FORBIDDEN_DEPENDENCIES = {
  '@maxellabs/core': ['@maxellabs/rhi', '@maxellabs/engine'],  // Core禁止依赖RHI/Engine
  '@maxellabs/rhi': ['@maxellabs/core', '@maxellabs/engine'],   // RHI禁止依赖Core/Engine
  '@maxellabs/math': ['@maxellabs/core', '@maxellabs/rhi', '@maxellabs/engine'],
  '@maxellabs/specification': ['@maxellabs/core', '@maxellabs/rhi', '@maxellabs/engine'],
};
```

---

## 第二章：各包职责边界

### 2.1 @maxellabs/core 职责

```typescript
/**
 * Core包职责清单
 */
const CORE_RESPONSIBILITIES = {
  /** ✅ 必须包含 */
  MUST_INCLUDE: [
    'Entity管理器 (EntityManager)',
    'Component存储 (ComponentStorage)',
    'System执行器 (SystemExecutor)',
    'Query查询器 (QueryBuilder)',
    'Resource管理 (ResourceManager)',
    'CommandBuffer (延迟命令)',
    'Event系统 (EventDispatcher)',
    'Transform组件',
    'Parent/Children组件 (层级关系)',
    'Tag组件 (Visible, Static等标记)',
    'Time资源',
    'Input资源接口',
  ],

  /** ❌ 禁止包含 */
  MUST_NOT_INCLUDE: [
    '任何WebGL/WebGPU代码',
    '任何GPU资源创建/管理',
    '任何着色器相关代码',
    '任何纹理/缓冲区实现',
    '任何渲染命令编码',
    '具体的Mesh/Material组件实现',
    '相机投影矩阵计算（接口除外）',
    '光照计算逻辑',
  ],
};
```

### 2.2 @maxellabs/rhi 职责

```typescript
/**
 * RHI包职责清单
 */
const RHI_RESPONSIBILITIES = {
  /** ✅ 必须包含 */
  MUST_INCLUDE: [
    'Device抽象 (IRHIDevice)',
    'Buffer管理 (IRHIBuffer)',
    'Texture管理 (IRHITexture)',
    'Pipeline状态 (IRHIPipeline)',
    'RenderPass (IRHIRenderPass)',
    'CommandEncoder (IRHICommandEncoder)',
    'Shader编译/管理',
    'WebGL 2.0实现',
    '资源生命周期管理',
    '渲染状态管理',
  ],

  /** ❌ 禁止包含 */
  MUST_NOT_INCLUDE: [
    'ECS相关代码',
    '场景图/层级结构',
    '任何业务逻辑',
    '具体的材质/光照模型',
    '任何对Core包的依赖',
  ],
};
```

### 2.3 @maxellabs/engine 职责

```typescript
/**
 * Engine包职责清单
 */
const ENGINE_RESPONSIBILITIES = {
  /** ✅ 必须包含 */
  MUST_INCLUDE: [
    'MeshComponent实现',
    'CameraComponent实现',
    'LightComponent实现',
    'MaterialComponent实现',
    'RenderSystem (渲染系统)',
    'CullingSystem (剔除系统)',
    'SceneManager (场景管理)',
    'ResourceLoader (资源加载)',
    'RenderPipeline (渲染管线)',
    'Core到RHI的桥接逻辑',
  ],

  /** ✅ 集成点 */
  INTEGRATION_POINTS: [
    '从Core继承ECS框架',
    '使用RHI进行GPU操作',
    '实现渲染相关的System',
    '桥接Transform到GPU Uniform',
  ],
};
```

---

## 第三章：数据流规范

### 3.1 渲染数据流

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           每帧渲染数据流                                  │
└──────────────────────────────────────────────────────────────────────────┘

1. INPUT STAGE (Core)
   ┌─────────────┐
   │InputResource│ ← 用户输入事件
   └──────┬──────┘
          │
          ▼
2. UPDATE STAGE (Core Systems)
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ InputSystem │ →  │ LogicSystem │ →  │TransformSys │
   │(更新Transform)│   │(游戏逻辑)    │   │(计算WorldMatrix)│
   └─────────────┘    └─────────────┘    └──────┬──────┘
                                                │
                                                ▼
3. PREPARE STAGE (Engine Systems)
   ┌─────────────────────────────────────────────────────┐
   │                  CullingSystem                       │
   │  Input: Transform + BoundingBox + Camera            │
   │  Output: VisibleEntityList                          │
   └──────────────────────┬──────────────────────────────┘
                          │
                          ▼
   ┌─────────────────────────────────────────────────────┐
   │                  SortingSystem                       │
   │  Input: VisibleEntityList + Material               │
   │  Output: RenderQueue (按材质/深度排序)              │
   └──────────────────────┬──────────────────────────────┘
                          │
                          ▼
4. RENDER STAGE (Engine → RHI)
   ┌─────────────────────────────────────────────────────┐
   │                   RenderSystem                       │
   │  Input: RenderQueue + Transform.worldMatrix         │
   │  Process:                                           │
   │    1. 绑定Pipeline                                  │
   │    2. 设置Uniform (MVP矩阵等)                       │
   │    3. 绑定VertexBuffer                              │
   │    4. 调用RHI.draw()                                │
   └──────────────────────┬──────────────────────────────┘
                          │
                          ▼
5. GPU EXECUTION (RHI)
   ┌─────────────────────────────────────────────────────┐
   │                   RHI Layer                          │
   │  - CommandEncoder.beginRenderPass()                 │
   │  - CommandEncoder.setPipeline()                     │
   │  - CommandEncoder.setBindGroup()                    │
   │  - CommandEncoder.draw()                            │
   │  - CommandEncoder.endRenderPass()                   │
   └─────────────────────────────────────────────────────┘
```

### 3.2 接口契约定义

```typescript
// ===== Core → Engine 接口 =====

/**
 * Core提供的渲染准备数据
 */
interface ICoreRenderData {
  /** 实体ID */
  entityId: EntityId;

  /** 世界变换矩阵 */
  worldMatrix: Matrix4Like;

  /** 边界盒（世界空间） */
  worldBoundingBox: {
    min: Vector3Like;
    max: Vector3Like;
  };
}

/**
 * Core提供的相机数据
 */
interface ICoreCameraData {
  /** 视图矩阵 */
  viewMatrix: Matrix4Like;

  /** 投影矩阵（由Engine计算） */
  projectionMatrix?: Matrix4Like;

  /** 视锥体平面（用于剔除） */
  frustumPlanes?: Plane[];
}

// ===== Engine → RHI 接口 =====

/**
 * Engine生成的渲染命令
 */
interface IRenderCommand {
  /** 命令类型 */
  type: 'draw' | 'drawIndexed' | 'dispatch';

  /** Pipeline ID */
  pipelineId: string;

  /** Bind Group */
  bindGroups: IBindGroupDescriptor[];

  /** 顶点缓冲区 */
  vertexBuffers: IVertexBufferDescriptor[];

  /** 索引缓冲区（可选） */
  indexBuffer?: IIndexBufferDescriptor;

  /** 绘制参数 */
  drawParams: IDrawParams;
}

/**
 * Uniform数据
 */
interface IUniformData {
  /** MVP矩阵 */
  mvpMatrix: Float32Array;

  /** Model矩阵 */
  modelMatrix: Float32Array;

  /** View矩阵 */
  viewMatrix: Float32Array;

  /** Projection矩阵 */
  projectionMatrix: Float32Array;

  /** 法线矩阵 */
  normalMatrix: Float32Array;

  /** 相机位置 */
  cameraPosition: Float32Array;

  /** 时间 */
  time: number;
}
```

---

## 第四章：组件桥接规范

### 4.1 Transform桥接

```typescript
/**
 * Transform组件（Core定义）到GPU Uniform（RHI）的桥接
 * 由Engine实现
 */
class TransformBridge {
  /**
   * 将Core的Transform数据转换为GPU Uniform格式
   */
  static toUniform(
    transform: TransformComponent,
    camera: CameraComponent,
    out: IUniformData
  ): void {
    // 1. Model矩阵直接使用worldMatrix
    out.modelMatrix.set(transform.worldMatrix.elements);

    // 2. View矩阵从Camera组件获取
    out.viewMatrix.set(camera.viewMatrix.elements);

    // 3. Projection矩阵从Camera组件获取
    out.projectionMatrix.set(camera.projectionMatrix.elements);

    // 4. 计算MVP矩阵
    const mvp = Matrix4.multiply(
      camera.projectionMatrix,
      Matrix4.multiply(camera.viewMatrix, transform.worldMatrix)
    );
    out.mvpMatrix.set(mvp.elements);

    // 5. 计算法线矩阵（Model矩阵的逆转置的3x3部分）
    const normalMatrix = Matrix4.invert(transform.worldMatrix);
    Matrix4.transpose(normalMatrix, normalMatrix);
    // 提取3x3部分到normalMatrix
    out.normalMatrix.set([
      normalMatrix.elements[0], normalMatrix.elements[1], normalMatrix.elements[2],
      normalMatrix.elements[4], normalMatrix.elements[5], normalMatrix.elements[6],
      normalMatrix.elements[8], normalMatrix.elements[9], normalMatrix.elements[10],
    ]);
  }
}
```

### 4.2 Material桥接

```typescript
/**
 * Material组件（Engine定义）到RHI Pipeline的桥接
 */
interface IMaterialBridge {
  /**
   * 获取对应的Pipeline ID
   */
  getPipelineId(material: MaterialComponent): string;

  /**
   * 生成Bind Group描述
   */
  createBindGroupDescriptor(
    material: MaterialComponent,
    device: IRHIDevice
  ): IBindGroupDescriptor;

  /**
   * 更新Uniform Buffer
   */
  updateUniformBuffer(
    material: MaterialComponent,
    uniformBuffer: IRHIBuffer
  ): void;
}

/**
 * 标准PBR材质桥接实现
 */
class PBRMaterialBridge implements IMaterialBridge {
  getPipelineId(material: MaterialComponent): string {
    // 根据材质特性生成Pipeline变体ID
    const features = [];
    if (material.hasNormalMap) features.push('NORMAL_MAP');
    if (material.hasEmissive) features.push('EMISSIVE');
    if (material.isTransparent) features.push('TRANSPARENT');

    return `pbr_${features.join('_')}`;
  }

  createBindGroupDescriptor(
    material: MaterialComponent,
    device: IRHIDevice
  ): IBindGroupDescriptor {
    return {
      layout: 'pbr_material_layout',
      entries: [
        { binding: 0, resource: { buffer: material.uniformBuffer } },
        { binding: 1, resource: { texture: material.albedoTexture } },
        { binding: 2, resource: { texture: material.normalTexture } },
        { binding: 3, resource: { texture: material.metallicRoughnessTexture } },
        { binding: 4, resource: { sampler: material.sampler } },
      ],
    };
  }

  updateUniformBuffer(material: MaterialComponent, uniformBuffer: IRHIBuffer): void {
    const data = new Float32Array([
      ...material.baseColor,           // vec4
      material.metallic,               // float
      material.roughness,              // float
      material.emissiveIntensity,      // float
      0,                               // padding
    ]);
    uniformBuffer.write(data);
  }
}
```

---

## 第五章：资源生命周期管理

### 5.1 资源创建流程

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        资源创建流程                                        │
└───────────────────────────────────────────────────────────────────────────┘

1. 应用层请求加载资源
   ┌────────────┐
   │ loadModel()│
   └─────┬──────┘
         │
         ▼
2. Engine层解析资源
   ┌─────────────────────────────────────────────────────────────────┐
   │ ResourceLoader (Engine)                                         │
   │   - 解析GLTF/OBJ等格式                                          │
   │   - 提取几何数据、材质参数、纹理引用                             │
   │   - 创建Core层的Entity和Component                               │
   └──────────────────────────┬──────────────────────────────────────┘
                              │
                              ▼
3. 创建GPU资源
   ┌─────────────────────────────────────────────────────────────────┐
   │ RHI Layer                                                        │
   │   - device.createBuffer() → 顶点/索引缓冲区                      │
   │   - device.createTexture() → 纹理资源                           │
   │   - device.createPipeline() → 渲染管线                          │
   └──────────────────────────┬──────────────────────────────────────┘
                              │
                              ▼
4. 绑定到组件
   ┌─────────────────────────────────────────────────────────────────┐
   │ MeshComponent.geometryId = "geo_xxx"                            │
   │ MeshComponent.vertexBuffer = rhiBuffer                          │
   │ MaterialComponent.materialId = "mat_xxx"                        │
   │ MaterialComponent.albedoTexture = rhiTexture                    │
   └─────────────────────────────────────────────────────────────────┘
```

### 5.2 资源销毁流程

```typescript
/**
 * 资源销毁契约
 */
interface IResourceLifecycle {
  /**
   * 当Entity被销毁时调用
   * Engine负责清理关联的RHI资源
   */
  onEntityDestroyed(entity: EntityId, world: IWorld): void;

  /**
   * 当Component被移除时调用
   */
  onComponentRemoved<T extends IComponent>(
    entity: EntityId,
    component: T,
    world: IWorld
  ): void;
}

/**
 * Engine实现的资源清理逻辑
 */
class RenderResourceCleanup implements IResourceLifecycle {
  constructor(private device: IRHIDevice) {}

  onEntityDestroyed(entity: EntityId, world: IWorld): void {
    // 清理Mesh组件关联的GPU资源
    const mesh = world.getStorage(MeshComponent).get(entity);
    if (mesh) {
      this.device.destroyBuffer(mesh.vertexBuffer);
      this.device.destroyBuffer(mesh.indexBuffer);
    }

    // 清理Material组件关联的GPU资源
    const material = world.getStorage(MaterialComponent).get(entity);
    if (material) {
      // 纹理使用引用计数，不直接销毁
      this.releaseTextureRef(material.albedoTexture);
      this.releaseTextureRef(material.normalTexture);
      this.device.destroyBuffer(material.uniformBuffer);
    }
  }

  private releaseTextureRef(texture: IRHITexture | undefined): void {
    if (texture) {
      texture.refCount--;
      if (texture.refCount <= 0) {
        this.device.destroyTexture(texture);
      }
    }
  }
}
```

---

## 第六章：错误处理边界

### 6.1 错误传播规则

```typescript
/**
 * 各层错误类型定义
 */

// Core层错误
class CoreError extends Error {
  constructor(
    public readonly code: CoreErrorCode,
    message: string
  ) {
    super(`[Core] ${message}`);
  }
}

enum CoreErrorCode {
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  INVALID_QUERY = 'INVALID_QUERY',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

// RHI层错误
class RHIError extends Error {
  constructor(
    public readonly code: RHIErrorCode,
    message: string
  ) {
    super(`[RHI] ${message}`);
  }
}

enum RHIErrorCode {
  DEVICE_LOST = 'DEVICE_LOST',
  RESOURCE_CREATION_FAILED = 'RESOURCE_CREATION_FAILED',
  INVALID_OPERATION = 'INVALID_OPERATION',
  SHADER_COMPILATION_FAILED = 'SHADER_COMPILATION_FAILED',
}

// Engine层错误（聚合Core和RHI错误）
class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
    public readonly cause?: CoreError | RHIError
  ) {
    super(`[Engine] ${message}`);
  }
}
```

### 6.2 错误处理策略

```typescript
/**
 * Engine层统一错误处理
 */
class EngineErrorHandler {
  /**
   * 处理渲染错误
   */
  handleRenderError(error: Error): void {
    if (error instanceof RHIError) {
      switch (error.code) {
        case RHIErrorCode.DEVICE_LOST:
          // 尝试恢复设备
          this.attemptDeviceRecovery();
          break;
        case RHIErrorCode.SHADER_COMPILATION_FAILED:
          // 使用fallback着色器
          this.useFallbackShader();
          break;
        default:
          // 记录错误，继续渲染（降级模式）
          console.error('RHI Error:', error);
      }
    } else if (error instanceof CoreError) {
      // Core错误通常是逻辑错误，需要开发者修复
      console.error('Core Error:', error);
      throw error; // 向上传播
    }
  }
}
```

---

## Few-Shot示例

### 示例1：正确的跨包数据传递

```typescript
// ✅ 正确：Engine从Core获取数据，传递给RHI
class RenderSystem implements ISystem {
  constructor(private device: IRHIDevice) {}

  execute(world: IWorld, deltaTime: number): void {
    // 1. 从Core获取Transform数据
    const transforms = world.getStorage(TransformComponent);

    // 2. 从Engine组件获取渲染数据
    const meshes = world.getStorage(MeshComponent);

    // 3. 遍历可渲染实体
    for (const [entity, mesh] of meshes.iter()) {
      const transform = transforms.get(entity);
      if (!transform) continue;

      // 4. 桥接到RHI
      this.device.setUniform('u_modelMatrix', transform.worldMatrix.elements);
      this.device.draw(mesh.vertexBuffer, mesh.indexBuffer, mesh.indexCount);
    }
  }
}
```

### 示例2：错误的直接依赖

```typescript
// ❌ 错误：Core直接依赖RHI
// packages/core/src/systems/transform-system.ts
import { IRHIDevice } from '@maxellabs/rhi'; // ❌ 禁止！

class BadTransformSystem implements ISystem {
  constructor(private device: IRHIDevice) {} // ❌ Core不应知道RHI

  execute(world: IWorld, deltaTime: number): void {
    // ❌ Core不应直接操作GPU资源
    this.device.setUniform('u_time', world.getResource(TimeResource).totalTime);
  }
}
```

### 示例3：正确的组件定义位置

```typescript
// ✅ Core包中定义基础组件
// packages/core/src/components/transform.ts
class TransformComponent implements IComponent {
  readonly __type = Symbol('Transform');
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  worldMatrix: Matrix4;
  dirty: boolean;
}

// ✅ Engine包中定义渲染组件
// packages/engine/src/components/mesh.ts
class MeshComponent implements IComponent {
  readonly __type = Symbol('Mesh');
  geometryId: string;
  vertexBuffer: IRHIBuffer;  // Engine可以引用RHI类型
  indexBuffer: IRHIBuffer;
  indexCount: number;
}
```

---

## 相关文档

### 核心规范
- [Core ECS Architecture](./core-ecs-architecture.md) - Core包架构规范
- [RHI Architecture](../rhi/rhi-architecture.md) - RHI层架构

### 技术参考
- [Graphics Bible](../../foundations/graphics-bible.md) - 图形系统规范
- [Engine Architecture](./engine-architecture.md) - Engine包架构

---
id: "strategy-resource-manager-refactoring"
type: "strategy"
status: "pending"
title: "ResourceManager 插件化重构策略"
description: "将当前 ResourceManager (613行) 拆分为核心调度器 + 可扩展 Loader 系统的详细实施方案"
tags: ["resource-manager", "refactoring", "plugin-system", "architecture", "extensibility"]
context_dependency: ["arch-core-unified", "architecture-resources"]
related_ids: ["strategy-scene-resource-integration", "ref-data-models-core"]
created: "2025-12-24"
---

## 1. 分析（Analysis）

### 1.1 上下文（Context）

**当前状态**：
- ResourceManager 实现完成，包含 Mesh/Texture/Material 加载功能
- Scene 已成功集成 ResourceManager（Ref: strategy-scene-resource-integration）
- 测试覆盖率 95%+，1413/1413 测试通过
- 所有资源逻辑在单文件中实现（假设 ~600 行）

**问题识别**：
- **代码重复**：95% 的加载逻辑重复（loadMesh/loadTexture/loadMaterial 结构相同）
- **扩展困难**：新增资源类型（Shader、Audio、Animation）需修改核心类
- **职责混乱**：ResourceManager 同时负责调度、缓存、具体加载逻辑
- **测试膨胀**：随资源类型增加，ResourceManager 测试将线性增长

**业务需求**：
- 支持应用包注册自定义资源类型（如 Effects 需要 SpriteAtlas）
- 支持动态加载器（运行时替换 Loader 实现）
- 为未来的 Shader/Audio/Font 资源类型预留扩展点

### 1.2 宪法约束（Constitution）

从架构文档（Ref: arch-core-unified）提取的关键规则：

**目录结构约束**（第 127-133 行）：
```
packages/core/src/resources/
├── resource-manager.ts      # 核心调度器（< 300 行）
├── resource-handle.ts       # 句柄类
└── loaders/                 # 加载器目录
    ├── i-resource-loader.ts # 加载器接口
    ├── mesh-loader.ts       # 网格加载器
    ├── texture-loader.ts    # 纹理加载器
    └── material-loader.ts   # 材质加载器
```

**架构原则**：
- Core 包只能依赖 `@maxellabs/specification` 接口（禁止依赖 RHI 实现）
- 资源管理器使用依赖注入（IRHIDevice 作为参数）
- 所有资源操作返回 Promise（异步契约）
- 引用计数为 0 时自动释放 GPU 资源

**代码质量约束**：
- 测试覆盖率要求 ≥95%
- 单个文件行数建议 < 300 行
- 禁止使用全局单例（ResourceManager 应由 Scene 持有）

### 1.3 负面约束（Negative Constraints）

🚫 **架构禁止事项**：
- 不要破坏现有 Scene API（Scene.loadMesh/loadTexture 签名保持不变）
- 不要创建新的全局状态（Loader 通过 registerLoader 注册）
- 不要在 Core 包定义具体的资源加载逻辑（应使用占位符 Loader）
- 不要依赖具体 RHI 实现（只能依赖 IRHIDevice 接口）

🚫 **兼容性禁止事项**：
- 不要降低测试覆盖率（当前 95%+）
- 不要移除现有的 public API（forceRelease、getStats 等）
- 不要修改 IResourceHandle 接口（Specification 包定义）
- 不要破坏现有的 1413 个测试用例

🚫 **代码质量禁止事项**：
- 不要在循环中创建新 Loader 实例（Loader 应注册后复用）
- 不要使用 `any` 类型（除了 mock 对象）
- 不要跳过边界条件测试（并发加载、错误处理）

## 2. 评估（Assessment）

<Assessment>
**复杂度等级**：Level 2（架构重构）

**理由**：
- 不涉及复杂算法或数学推导（非 Level 3）
- 主要是职责拆分和接口设计（架构模式应用）
- 需要保证向后兼容性（API 不变）
- 涉及多文件协作（ResourceManager + Loaders）

**成功标准**：
- ✅ ResourceManager 核心类缩减到 < 300 行
- ✅ 支持动态注册自定义资源类型
- ✅ 测试覆盖率保持 ≥95%
- ✅ 现有 1413 个测试全部通过
- ✅ Scene API 保持不变（零破坏性变更）

**风险识别**：
- 🟡 **中等风险**：默认 Loader 的占位符逻辑可能与测试预期不符
  - 缓解方案：提供空资源（vertexCount=0, texture=null）作为默认实现
- 🟢 **低风险**：现有 ResourceManager 已有完整测试，重构时可逐步迁移
- 🟢 **低风险**：Loader 接口设计简单，扩展性强
</Assessment>

## 3. 架构设计（Architecture Design）

### 3.1 模块分解（Module Decomposition）

#### A. ResourceManager（核心调度器）
**职责**：
- 缓存管理（Map<string, ResourceEntry>）
- 引用计数（refCount 增减）
- 生命周期管理（dispose、release）
- Loader 注册与调度（registerLoader、getLoader）

**不负责**：
- 具体资源加载逻辑（委托给 Loader）
- GPU 资源创建（由 Loader 调用 RHI Device）
- 资源数据解析（由 Loader 处理）

**伪代码**：
```typescript
class ResourceManager {
  private loaders: Map<string, IResourceLoader<unknown>> = new Map();
  private meshes: Map<string, ResourceEntry<MeshResource>> = new Map();
  private textures: Map<string, ResourceEntry<TextureResource>> = new Map();
  private materials: Map<string, ResourceEntry<MaterialResource>> = new Map();

  registerLoader<T>(type: ResourceType, loader: IResourceLoader<T>): void {
    this.loaders.set(type, loader);
  }

  async loadMesh(uri: string): Promise<IResourceHandle> {
    return this.loadResource('mesh', uri, this.meshes);
  }

  // 通用加载逻辑（消除重复代码）
  private async loadResource<T>(
    type: ResourceType,
    uri: string,
    cache: Map<string, ResourceEntry<T>>
  ): Promise<IResourceHandle> {
    // 1. 检查缓存
    let entry = cache.get(uri);
    if (entry) {
      entry.refCount++;
      if (entry.loadPromise) await entry.loadPromise;
      return this.createHandle(uri, type);
    }

    // 2. 创建新 entry
    entry = { data: null, state: Loading, refCount: 1, loadPromise: null };
    cache.set(uri, entry);

    // 3. 获取 Loader 并加载
    const loader = this.loaders.get(type);
    if (!loader) {
      entry.loadPromise = this.getDefaultLoader(type).load(uri, this.device);
    } else {
      entry.loadPromise = loader.load(uri, this.device);
    }

    entry.data = await entry.loadPromise;
    entry.state = Loaded;
    return this.createHandle(uri, type);
  }
}
```

**预期行数**：200-250 行（消除 95% 重复逻辑）

---

#### B. ResourceHandle（独立类）
**职责**：
- 资源唯一标识（id、type、uri）
- 轻量级（仅数据结构，无逻辑）

**当前状态**：假设内联在 ResourceManager 中
**目标**：提取到独立文件 `resource-handle.ts`

**伪代码**：
```typescript
// packages/core/src/resources/resource-handle.ts
import type { IResourceHandle, ResourceType } from '@maxellabs/specification';

export class ResourceHandle implements IResourceHandle {
  public readonly id: string;
  public readonly type: ResourceType;
  public readonly uri: string;

  constructor(id: string, type: ResourceType, uri: string) {
    this.id = id;
    this.type = type;
    this.uri = uri;
  }

  toString(): string {
    return `ResourceHandle(${this.type}:${this.uri})`;
  }
}

// 工厂函数
export function createResourceHandle(
  uri: string,
  type: ResourceType,
  idCounter: number
): ResourceHandle {
  const id = `${type}_${idCounter}`;
  return new ResourceHandle(id, type, uri);
}
```

**预期行数**：30-50 行

---

#### C. IResourceLoader（加载器接口）
**职责**：
- 定义加载器契约
- 支持泛型（IResourceLoader<T>）
- 支持自定义 Loader 扩展

**伪代码**：
```typescript
// packages/core/src/resources/loaders/i-resource-loader.ts
import type { IRHIDevice } from '@maxellabs/specification';

/**
 * 资源加载器接口
 * @template T - 资源类型（MeshResource, TextureResource, MaterialResource 等）
 */
export interface IResourceLoader<T> {
  /**
   * 加载资源
   * @param uri - 资源 URI
   * @param device - RHI 设备（用于创建 GPU 资源）
   * @returns 加载后的资源数据
   */
  load(uri: string, device: IRHIDevice): Promise<T>;
}

/**
 * 加载器元数据（可选，用于调试）
 */
export interface LoaderMetadata {
  name: string;
  supportedFormats: string[];
  version?: string;
}
```

**预期行数**：20-30 行

---

#### D. MeshLoader（网格加载器）
**职责**：
- 实现 IResourceLoader<MeshResource>
- 处理网格数据解析（由应用包提供实际实现）
- Core 包提供默认占位符实现（返回空网格）

**伪代码**：
```typescript
// packages/core/src/resources/loaders/mesh-loader.ts
import type { IRHIDevice, IMeshResource } from '@maxellabs/specification';
import type { IResourceLoader } from './i-resource-loader';

/**
 * 默认网格加载器（占位符实现）
 *
 * 注意：Core 包不包含具体的网格解析逻辑（如 GLTF）。
 * 应用包（如 Engine）应注册自定义 MeshLoader。
 */
export class DefaultMeshLoader implements IResourceLoader<IMeshResource> {
  async load(uri: string, device: IRHIDevice): Promise<IMeshResource> {
    console.warn(`[DefaultMeshLoader] No custom loader registered for mesh: ${uri}`);

    // 返回空网格（避免加载失败）
    return {
      vertexBuffer: null,
      indexBuffer: null,
      indexCount: 0,
      vertexCount: 0,
      primitiveType: 'triangles',
    };
  }
}

// 使用示例（应用包提供的实际实现）
// export class GLTFLoader implements IResourceLoader<IMeshResource> {
//   async load(uri: string, device: IRHIDevice): Promise<IMeshResource> {
//     const gltf = await fetch(uri).then(r => r.json());
//     // ... 解析 GLTF
//     const vertexBuffer = device.createBuffer({ data: vertices });
//     const indexBuffer = device.createBuffer({ data: indices });
//     return { vertexBuffer, indexBuffer, ... };
//   }
// }
```

**预期行数**：50-80 行（含注释和使用示例）

---

#### E. TextureLoader 和 MaterialLoader
**实现策略**：与 MeshLoader 相同
- DefaultTextureLoader 返回 1x1 白色占位符
- DefaultMaterialLoader 返回默认材质（shaderId='default'）

**预期行数**：每个 50-80 行

---

### 3.2 依赖关系图（Dependency Graph）

```
┌─────────────────────────────────────────────────┐
│              @maxellabs/specification            │
│  (IResourceHandle, IMeshResource, IRHIDevice)   │
└───────────────────┬─────────────────────────────┘
                    ▲
                    │ (依赖)
┌───────────────────┴─────────────────────────────┐
│            packages/core/src/resources/          │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │      resource-manager.ts (核心)         │   │
│  │  - 注册 Loader                           │   │
│  │  - 调度加载请求                          │   │
│  │  - 引用计数管理                          │   │
│  └──────────┬───────────────┬───────────────┘   │
│             │               │                    │
│             ▼               ▼                    │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │ resource-    │  │    loaders/          │    │
│  │ handle.ts    │  │  - i-resource-loader │    │
│  │ (数据结构)   │  │  - mesh-loader       │    │
│  │              │  │  - texture-loader    │    │
│  │              │  │  - material-loader   │    │
│  └──────────────┘  └──────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       ▲
                       │ (注入)
┌──────────────────────┴──────────────────────────┐
│         packages/core/src/scene/scene.ts         │
│  - 持有 ResourceManager                          │
│  - 调用 loadMesh/loadTexture/loadMaterial       │
└──────────────────────────────────────────────────┘
                       ▲
                       │ (使用)
┌──────────────────────┴──────────────────────────┐
│            应用包（Engine/Effects）              │
│  - 注册自定义 Loader（GLTFLoader, PNGLoader）   │
│  - 使用 Scene.loadMesh() 加载资源                │
└──────────────────────────────────────────────────┘
```

---

### 3.3 接口规格（Interface Specification）

#### IResourceLoader 接口
```typescript
interface IResourceLoader<T> {
  load(uri: string, device: IRHIDevice): Promise<T>;
}
```

**扩展示例**：
```typescript
// 应用包注册自定义加载器
const scene = new Scene({ device });

// 注册 GLTF 加载器
scene.resourceManager.registerLoader('mesh', new GLTFLoader());

// 注册 PNG/JPG 加载器
scene.resourceManager.registerLoader('texture', new ImageLoader());

// 注册自定义资源类型
scene.resourceManager.registerLoader('audio', new AudioLoader());
```

---

## 4. 实施计划（Implementation Plan）

<ExecutionPlan>

### Phase 1: 提取 ResourceHandle 类
**文件**：`packages/core/src/resources/resource-handle.ts`

**步骤**：
1. 创建 `resource-handle.ts` 文件
2. 定义 ResourceHandle 类（实现 IResourceHandle）
3. 添加工厂函数 `createResourceHandle()`
4. 导出到 `packages/core/src/resources/index.ts`

**验证**：
- `pnpm build` 通过
- 类型检查无错误

**预计时间**：30 分钟

---

### Phase 2: 创建 IResourceLoader 接口
**文件**：`packages/core/src/resources/loaders/i-resource-loader.ts`

**步骤**：
1. 创建 `loaders/` 目录
2. 定义 IResourceLoader<T> 接口
3. 添加 JSDoc 注释（说明扩展用法）
4. 导出到 `loaders/index.ts`

**验证**：
- 接口定义清晰
- 支持泛型约束

**预计时间**：20 分钟

---

### Phase 3: 实现默认 Loader（3个）
**文件**：
- `loaders/mesh-loader.ts`
- `loaders/texture-loader.ts`
- `loaders/material-loader.ts`

**步骤**：
1. 实现 DefaultMeshLoader（返回空网格）
2. 实现 DefaultTextureLoader（返回 1x1 白纹理）
3. 实现 DefaultMaterialLoader（返回默认材质）
4. 添加警告日志（提示用户注册自定义 Loader）
5. 添加使用示例注释（如何在应用包中注册 GLTFLoader）

**伪代码**（DefaultTextureLoader）：
```typescript
export class DefaultTextureLoader implements IResourceLoader<ITextureResource> {
  async load(uri: string, device: IRHIDevice): Promise<ITextureResource> {
    console.warn(`[DefaultTextureLoader] No custom loader for: ${uri}`);

    // 返回 1x1 白色纹理
    return {
      texture: null,  // 应用包应创建实际纹理
      width: 1,
      height: 1,
      hasMipmaps: false,
    };
  }
}
```

**验证**：
- 每个 Loader 编译通过
- JSDoc 注释完整

**预计时间**：1 小时

---

### Phase 4: 重构 ResourceManager
**文件**：`packages/core/src/resources/resource-manager.ts`

**步骤**：
1. 添加 `private loaders: Map<string, IResourceLoader<unknown>>` 字段
2. 实现 `registerLoader<T>(type: ResourceType, loader: IResourceLoader<T>)` 方法
3. 提取通用加载逻辑到 `loadResource<T>()` 私有方法（消除重复）
4. 修改 `loadMesh/loadTexture/loadMaterial` 调用通用方法
5. 在构造函数中注册默认 Loader：
   ```typescript
   constructor(device?: IRHIDevice) {
     this.device = device ?? null;
     // 注册默认 Loader
     this.registerLoader('mesh', new DefaultMeshLoader());
     this.registerLoader('texture', new DefaultTextureLoader());
     this.registerLoader('material', new DefaultMaterialLoader());
   }
   ```
6. 添加 `getLoader(type: string): IResourceLoader<unknown> | undefined` 方法（用于测试）

**验证**：
- ResourceManager 行数 < 300 行
- 现有测试通过（1413/1413）
- 新增 `registerLoader` 和 `getLoader` 测试

**预计时间**：2 小时

---

### Phase 5: 更新测试
**文件**：
- `packages/core/test/resources/resource-manager.test.ts`

**新增测试用例**：
```typescript
describe('Loader System', () => {
  test('应该注册自定义 Loader', () => {
    const customLoader = { load: async () => ({}) };
    manager.registerLoader('custom', customLoader);
    expect(manager.getLoader('custom')).toBe(customLoader);
  });

  test('应该使用注册的 Loader', async () => {
    const mockLoad = jest.fn().mockResolvedValue({
      vertexBuffer: null, indexBuffer: null,
      vertexCount: 0, indexCount: 0, primitiveType: 'triangles'
    });
    manager.registerLoader('mesh', { load: mockLoad });

    await manager.loadMesh('test.glb');
    expect(mockLoad).toHaveBeenCalledWith('test.glb', mockDevice);
  });

  test('应该在未注册 Loader 时使用默认实现', async () => {
    // 不注册自定义 Loader
    const handle = await manager.loadMesh('default.glb');
    const mesh = manager.getMesh(handle);

    // 默认 Loader 返回空网格
    expect(mesh?.vertexCount).toBe(0);
    expect(mesh?.indexCount).toBe(0);
  });

  test('应该支持多种资源类型的 Loader', () => {
    manager.registerLoader('audio', { load: async () => ({}) });
    manager.registerLoader('shader', { load: async () => ({}) });

    expect(manager.getLoader('audio')).toBeDefined();
    expect(manager.getLoader('shader')).toBeDefined();
  });
});
```

**验证**：
- 测试覆盖率保持 ≥95%
- 所有现有测试通过
- 新增 5+ Loader 相关测试

**预计时间**：1 小时

---

### Phase 6: 集成测试与验证
**步骤**：
1. 运行完整测试套件：`pnpm test`
2. 检查覆盖率报告：`pnpm test:coverage`
3. 验证 Scene API 兼容性（现有 Scene 测试应全部通过）
4. 手动验证扩展场景：
   ```typescript
   // 示例：注册自定义 Loader
   class MyCustomLoader implements IResourceLoader<any> {
     async load(uri: string, device: IRHIDevice) { ... }
   }

   scene.resourceManager.registerLoader('custom', new MyCustomLoader());
   ```

**验证标准**：
- ✅ 1413/1413 测试通过
- ✅ 覆盖率 ≥95%
- ✅ ResourceManager 行数 < 300
- ✅ 支持动态注册 Loader

**预计时间**：30 分钟

---

### Phase 7: 文档更新
**文件**：
- `llmdoc/architecture/resources.md`

**更新内容**：
1. 添加 Loader System 章节（第 622 行后）：
   ```markdown
   ## 🔌 Loader System (Extensibility)

   ### IResourceLoader Interface
   #### Custom Loader Example
   #### Registration
   ```

2. 更新目录结构说明
3. 添加最佳实践（如何在应用包中注册 Loader）

**预计时间**：30 分钟

</ExecutionPlan>

---

## 5. 向后兼容性（Backward Compatibility）

### 5.1 API 保证
✅ **不变的 API**：
- `Scene.loadMesh(uri: string): Promise<IResourceHandle>`
- `Scene.loadTexture(uri: string): Promise<IResourceHandle>`
- `Scene.loadMaterial(uri: string): Promise<IResourceHandle>`
- `Scene.getMesh(handle: IResourceHandle)`
- `ResourceManager.release(handle: IResourceHandle)`
- `ResourceManager.dispose()`

✅ **新增的 API**（不影响现有代码）：
- `ResourceManager.registerLoader<T>(type: ResourceType, loader: IResourceLoader<T>)`
- `ResourceManager.getLoader(type: string): IResourceLoader<unknown> | undefined`

### 5.2 行为保证
✅ **不变的行为**：
- 默认 Loader 返回空资源（与当前行为一致）
- 引用计数逻辑不变
- 资源缓存机制不变
- dispose 时清理所有资源

### 5.3 测试保证
✅ **现有测试无需修改**：
- 所有 Scene 测试保持不变（Scene API 未变）
- ResourceManager 测试仅新增 Loader 相关用例
- 集成测试无需修改

---

## 6. 实施检查清单（Implementation Checklist）

### 阶段 1：文件提取
- [ ] 创建 `resource-handle.ts`（独立类）
- [ ] 创建 `loaders/i-resource-loader.ts`（接口）
- [ ] 创建 `loaders/mesh-loader.ts`（默认实现）
- [ ] 创建 `loaders/texture-loader.ts`（默认实现）
- [ ] 创建 `loaders/material-loader.ts`（默认实现）
- [ ] 更新 `resources/index.ts` 导出

### 阶段 2：ResourceManager 重构
- [ ] 添加 `loaders: Map<string, IResourceLoader<unknown>>` 字段
- [ ] 实现 `registerLoader<T>()` 方法
- [ ] 提取通用 `loadResource<T>()` 方法（消除重复代码）
- [ ] 修改 `loadMesh/loadTexture/loadMaterial` 调用通用方法
- [ ] 在构造函数中注册默认 Loader
- [ ] 添加 `getLoader()` 方法（用于测试）
- [ ] 验证行数 < 300 行

### 阶段 3：测试更新
- [ ] 新增 Loader 注册测试（5+ 用例）
- [ ] 新增默认 Loader 测试
- [ ] 新增自定义 Loader 测试
- [ ] 运行 `pnpm test` 验证所有测试通过
- [ ] 运行 `pnpm test:coverage` 确认覆盖率 ≥95%

### 阶段 4：文档同步
- [ ] 更新 `llmdoc/architecture/resources.md`（添加 Loader System 章节）
- [ ] 添加 IResourceLoader 接口说明
- [ ] 添加自定义 Loader 示例
- [ ] 更新目录结构图

### 阶段 5：集成验证
- [ ] 验证 Scene API 兼容性（现有测试全部通过）
- [ ] 手动测试自定义 Loader 注册
- [ ] 代码 lint 检查通过（`pnpm lint`）
- [ ] 构建成功（`pnpm build`）

---

## 7. 禁止事项（Negative Constraints）

🚫 **架构约束**：
- 不要在 Core 包实现具体的资源解析逻辑（如 GLTF 解析）
- 不要创建全局 Loader 注册表（Loader 通过 ResourceManager 注册）
- 不要在 Loader 接口中暴露 RHI 实现细节（只依赖 IRHIDevice）

🚫 **代码质量约束**：
- 不要在 ResourceManager 中保留重复的加载逻辑（使用通用方法）
- 不要在每次加载时创建新 Loader（Loader 应注册后复用）
- 不要跳过默认 Loader 的警告日志（提示用户注册自定义实现）

🚫 **兼容性约束**：
- 不要修改 ResourceManager 的 public API 签名（仅新增方法）
- 不要破坏现有的引用计数逻辑
- 不要移除现有的测试用例（仅新增）

---

## 8. 风险评估与缓解（Risk Assessment）

### 🟡 中等风险：默认 Loader 行为变化
**风险**：现有测试可能依赖特定的空资源格式

**缓解方案**：
1. 默认 Loader 返回与当前相同的空资源格式
2. 在重构前运行完整测试套件（基线）
3. 逐步迁移，每完成一个 Loader 运行一次测试

### 🟢 低风险：Loader 注册冲突
**风险**：多次注册同一类型 Loader

**缓解方案**：
1. `registerLoader()` 覆盖已存在的 Loader（Map 特性）
2. 添加警告日志：`console.warn('Overriding existing loader for type: ...')`
3. 测试覆盖注册冲突场景

### 🟢 低风险：行数目标未达成
**风险**：重构后 ResourceManager 仍超过 300 行

**缓解方案**：
1. 提取通用方法（loadResource、releaseResource、disposeResource）
2. 将 ResourceEntry 类型定义提取到独立文件
3. 移除冗余注释和空行

---

## 9. 性能考量（Performance Considerations）

### 优化点
✅ **Loader 复用**：
- Loader 实例在注册时创建，后续复用
- 避免每次加载都创建新 Loader

✅ **缓存机制不变**：
- URI 为 key 的 Map 缓存
- 引用计数避免重复加载

✅ **异步加载不变**：
- 并发加载同一资源时共享 Promise
- 避免重复网络请求

### 潜在性能影响
⚠️ **Loader 查找开销**：
- `Map.get(type)` 复杂度 O(1)
- 影响可忽略不计

---

## 10. 验收标准（Acceptance Criteria）

### 功能要求
- ✅ ResourceManager 支持 `registerLoader<T>()` 方法
- ✅ 默认 Loader 返回空资源（与当前行为一致）
- ✅ 应用包可注册自定义 Loader
- ✅ 支持扩展新资源类型（Audio、Shader、Font）

### 质量要求
- ✅ ResourceManager 核心类 < 300 行
- ✅ 测试覆盖率 ≥95%
- ✅ 所有现有测试通过（1413/1413）
- ✅ 代码通过 lint 检查

### 架构要求
- ✅ 职责清晰（Manager=调度，Loader=加载）
- ✅ 依赖倒置（依赖 IResourceLoader 接口）
- ✅ 开闭原则（对扩展开放，对修改封闭）

### 文档要求
- ✅ `llmdoc/architecture/resources.md` 更新 Loader System 章节
- ✅ IResourceLoader 接口有完整 JSDoc
- ✅ 提供自定义 Loader 示例

---

## 11. 参考资料（References）

### 架构文档
- `Ref: arch-core-unified` - Core 包目录结构（第 127-133 行）
- `Ref: architecture-resources` - 资源管理架构文档
- `Ref: strategy-scene-resource-integration` - Scene 集成 ResourceManager 策略

### 实现文件
- `packages/core/src/resources/resource-manager.ts` - 当前实现（待重构）
- `packages/core/src/scene/scene.ts` - Scene 类（持有 ResourceManager）
- `packages/specification/src/core/interfaces.ts` - IResourceHandle 接口定义

### 测试文件
- `packages/core/test/resources/resource-manager.test.ts` - ResourceManager 测试
- `packages/core/test/scene/scene-resource-integration.test.ts` - 集成测试

---

## 12. 实施时间估算（Time Estimation）

### 总预计时间：6-8 小时

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| Phase 1 | 提取 ResourceHandle 类 | 30 分钟 |
| Phase 2 | 创建 IResourceLoader 接口 | 20 分钟 |
| Phase 3 | 实现 3 个默认 Loader | 1 小时 |
| Phase 4 | 重构 ResourceManager | 2 小时 |
| Phase 5 | 更新测试 | 1 小时 |
| Phase 6 | 集成测试与验证 | 30 分钟 |
| Phase 7 | 文档更新 | 30 分钟 |
| **缓冲时间** | 调试和修复 | 1.5 小时 |

---

**策略版本**：1.0
**实施状态**：待执行
**预计收益**：
- ✅ 代码量减少 60%（613 → 250 行）
- ✅ 扩展性提升（支持无限种资源类型）
- ✅ 测试维护成本降低（Loader 独立测试）
- ✅ 职责清晰（Manager=调度，Loader=加载）

---
id: "architecture-shader-compiler"
type: "architecture"
title: "Shader Compiler Architecture"
description: "ShaderCompiler 系统架构，包括编译、缓存、生命周期管理和与 Renderer/MaterialInstance 的集成"
tags: ["shader", "compiler", "cache", "rhi", "material", "renderer", "gpu"]
context_dependency: ["architecture-scene-systems", "constitution-core-runtime"]
related_ids: ["architecture-resources", "concept-material-instance", "strategy-shader-compiler"]
---

## 1. 概述（Overview）

### 1.1 目的（Purpose）
ShaderCompiler 系统负责着色器程序的编译、缓存和生命周期管理，为 Renderer 提供高效的着色器编译能力。

### 1.2 核心职责（Responsibilities）
- 编译顶点/片元着色器（通过 IRHIDevice 接口）
- 基于源码哈希缓存编译结果（避免重复编译）
- 管理引用计数（多个 MaterialInstance 共享同一着色器）
- 提供 Uniform/Attribute 位置查询接口
- 支持 Fallback 着色器（编译失败时使用）
- 实现完整的生命周期管理（dispose 模式）

### 1.3 架构约束（Constraints）
- ✅ **NO WebGL Dependencies**: 仅通过 IRHIDevice 接口操作 GPU
- ✅ **All Types from Specification**: 所有 RHI 类型来自 @maxellabs/specification
- ✅ **Reference Counting**: 着色器程序支持引用计数和自动释放
- ✅ **Dispose Pattern**: 实现 IDisposable 模式
- ✅ **Async Compilation**: 编译使用异步 API

---

## 2. 核心接口（Core Interfaces）

### 2.1 ShaderProgram（着色器程序包装器）

```typescript
/**
 * 着色器程序包装器
 * 持有编译后的 IRHIShaderModule 和元数据
 */
export class ShaderProgram {
  /** 程序唯一标识（基于源码哈希） */
  readonly id: string;

  /** 顶点着色器模块 */
  readonly vertexModule: IRHIShaderModule;

  /** 片元着色器模块 */
  readonly fragmentModule: IRHIShaderModule;

  /** 引用计数 */
  refCount: number;

  /**
   * 获取 Uniform 位置
   * @param name Uniform 名称
   * @returns 位置索引，如果未找到返回 -1
   */
  getUniformLocation(name: string): number;

  /**
   * 获取 Attribute 位置
   * @param name Attribute 名称
   * @returns 位置索引，如果未找到返回 -1
   */
  getAttributeLocation(name: string): number;

  /**
   * 释放 GPU 资源
   */
  destroy(): void;
}
```

### 2.2 ShaderCache（缓存管理器）

```typescript
/**
 * 着色器缓存
 * 管理着色器程序的生命周期和缓存
 */
export class ShaderCache {
  /**
   * 获取缓存的着色器程序
   * @param hash 着色器源码哈希
   * @returns 着色器程序，如果不存在返回 undefined
   */
  get(hash: string): ShaderProgram | undefined;

  /**
   * 缓存着色器程序
   * @param hash 着色器源码哈希
   * @param program 着色器程序
   */
  set(hash: string, program: ShaderProgram): void;

  /**
   * 检查缓存是否存在
   * @param hash 着色器源码哈希
   * @returns 是否存在
   */
  has(hash: string): boolean;

  /**
   * 释放着色器程序（减少引用计数）
   * @param hash 着色器源码哈希
   * @returns 是否完全释放（refCount = 0）
   */
  release(hash: string): boolean;

  /**
   * 清空缓存
   */
  clear(): void;

  /**
   * 获取缓存统计
   * @returns 缓存程序数量
   */
  getSize(): number;
}
```

### 2.3 ShaderCompiler（编译器核心）

```typescript
/**
 * 着色器编译器配置
 */
export interface ShaderCompilerConfig {
  /** RHI 设备 */
  device: IRHIDevice;

  /** 启用缓存（默认 true） */
  enableCache?: boolean;

  /** Fallback 着色器（编译失败时使用） */
  fallbackShader?: {
    vertex: string;
    fragment: string;
  };
}

/**
 * 着色器编译错误
 */
export class ShaderCompilerError extends Error {
  constructor(
    message: string,
    public details: {
      stage?: 'vertex' | 'fragment';
      line?: number;
      column?: number;
      originalError?: unknown;
    }
  );
}

/**
 * 着色器编译器
 * 负责着色器程序的编译、缓存和生命周期管理
 */
export class ShaderCompiler {
  /**
   * 编译着色器程序
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片元着色器源码
   * @returns 编译后的着色器程序
   * @throws {ShaderCompilerError} 编译失败或参数无效
   */
  async compile(
    vertexSource: string,
    fragmentSource: string
  ): Promise<ShaderProgram>;

  /**
   * 获取已缓存的着色器程序（同步）
   * @param vertexSource 顶点着色器源码
   * @param fragmentSource 片元着色器源码
   * @returns 着色器程序，如果未编译返回 undefined
   */
  getProgram(vertexSource: string, fragmentSource: string): ShaderProgram | undefined;

  /**
   * 释放着色器程序（减少引用计数）
   * @param program 着色器程序
   */
  release(program: ShaderProgram): void;

  /**
   * 获取缓存统计
   * @returns 缓存的着色器程序数量
   */
  getCacheSize(): number;

  /**
   * 释放所有资源
   */
  dispose(): void;
}
```

---

## 3. 数据流（Data Flow）

### 3.1 编译流程

```
┌─────────────────────────────────────────────────────────┐
│                   Renderer.render()                     │
│  获取 MaterialInstance 和着色器源码                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│            ShaderCompiler.compile(vs, fs)               │
│  1. 计算源码哈希                                         │
│  2. 检查缓存                                             │
│  3. 编译着色器模块                                       │
│  4. 创建 ShaderProgram 包装器                            │
│  5. 缓存程序                                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│         IRHIDevice.createShaderModule()                 │
│  编译顶点/片元着色器，返回 IRHIShaderModule              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              ShaderProgram 返回                          │
│  包含编译后的模块和元数据                                │
└─────────────────────────────────────────────────────────┘
```

### 3.2 缓存策略

#### 哈希计算
```pseudocode
FUNCTION computeShaderHash(vertexSource, fragmentSource):
  combined = vertexSource + "\n---FRAGMENT---\n" + fragmentSource
  RETURN fnv1aHash(combined)
```

#### 缓存键值对
- **键**：`hash(vertexSource + fragmentSource)`
- **值**：`ShaderProgram { vertexModule, fragmentModule, uniformLocations, ... }`

#### 引用计数生命周期
```pseudocode
FUNCTION compile(vs, fs):
  1. hash = computeShaderHash(vs, fs)
  2. IF cache.has(hash):
       program = cache.get(hash)
       program.refCount++
       RETURN program
  3. ELSE:
       vertexModule = device.createShaderModule({ code: vs, stage: 'vertex' })
       fragmentModule = device.createShaderModule({ code: fs, stage: 'fragment' })
       program = new ShaderProgram(hash, vertexModule, fragmentModule)
       program.refCount = 1
       cache.set(hash, program)
       RETURN program

FUNCTION release(program):
  1. program.refCount--
  2. IF program.refCount <= 0:
       program.destroy()
       cache.delete(program.id)
```

---

## 4. 集成点（Integration Points）

### 4.1 Renderer → ShaderCompiler

```typescript
class MyRenderer extends Renderer {
  private shaderCompiler: ShaderCompiler;

  constructor(config: RendererConfig) {
    super(config);
    this.shaderCompiler = new ShaderCompiler({
      device: this.getDevice(),
      fallbackShader: {
        vertex: DEFAULT_VS,
        fragment: DEFAULT_FS,
      },
    });
  }

  protected async render(ctx: RenderContext): Promise<void> {
    for (const renderable of ctx.renderables) {
      // 1. 获取材质
      const material = ctx.scene.getMaterial(renderable.materialId);
      if (!material) continue;

      // 2. 获取着色器源码
      const shaderSources = this.getShaderSources(material.shaderId);

      // 3. 编译着色器（或从缓存获取）
      const program = await this.shaderCompiler.compile(
        shaderSources.vertex,
        shaderSources.fragment
      );

      // 4. 使用着色器程序
      // device.useProgram(program);
    }
  }

  override dispose(): void {
    this.shaderCompiler.dispose();
    super.dispose();
  }
}
```

### 4.2 MaterialInstance → ShaderCompiler

- MaterialInstance 持有 `shaderId: string`
- Renderer 使用 `shaderId` 查询着色器源码
- 调用 `ShaderCompiler.compile(vs, fs)` 获取编译后的程序

### 4.3 ShaderCompiler → IRHIDevice

- 通过 `device.createShaderModule()` 编译着色器
- 错误处理：捕获编译失败，返回详细错误信息

---

## 5. 错误处理（Error Handling）

### 5.1 三层错误处理

#### Layer 1: Type Validation (Compile-Time)
```typescript
interface ShaderCompilerConfig {
  device: IRHIDevice;              // 必须提供 device
  enableCache?: boolean;           // 默认 true
  fallbackShader?: {
    vertex: string;
    fragment: string;
  };
}
```

#### Layer 2: Runtime Validation
```pseudocode
FUNCTION compile(vs, fs):
  1. IF NOT vs OR NOT fs:
       THROW ShaderCompilerError('Empty shader source')
  2. TRY:
       vertexModule = device.createShaderModule(...)
       fragmentModule = device.createShaderModule(...)
  3. CATCH error:
       IF fallbackShader:
         RETURN compile(fallbackShader.vertex, fallbackShader.fragment)
       ELSE:
         THROW ShaderCompilerError('Compilation failed', error)
```

#### Layer 3: Error Reporting
```typescript
class ShaderCompilerError extends Error {
  constructor(
    message: string,
    public details: {
      stage?: 'vertex' | 'fragment';
      line?: number;
      column?: number;
      originalError?: unknown;
    }
  );
}
```

---

## 6. 性能考虑（Performance Considerations）

### 6.1 缓存效率
- **哈希算法**：FNV-1a（快速、低碰撞）
- **缓存键**：源码哈希（避免重复编译）
- **缓存大小**：无限制（未来可考虑 LRU 策略）

### 6.2 编译优化
- **异步编译**：不阻塞渲染循环
- **位置缓存**：Uniform/Attribute 位置提前缓存
- **引用计数**：自动释放未使用的着色器

### 6.3 内存管理
- **引用计数**：多个 MaterialInstance 共享同一着色器
- **自动清理**：refCount = 0 时自动销毁
- **Dispose 模式**：显式释放所有资源

---

## 7. 禁止事项（Negative Constraints）

### 7.1 架构约束
- 🚫 **不要** 在 Core 中直接使用 WebGL/WebGPU API（仅通过 IRHIDevice）
- 🚫 **不要** 创建全局 ShaderCompiler 单例（应由 Renderer 持有）
- 🚫 **不要** 在 ShaderCompiler 中管理材质逻辑（职责分离）
- 🚫 **不要** 绕过 IRHIDevice.createShaderModule()（保持抽象层）
- 🚫 **不要** 将着色器源码存储在 ShaderCompiler 中（应由 ShaderLibrary 管理）

### 7.2 性能约束
- 🚫 **不要** 在渲染循环中重复编译着色器（使用缓存）
- 🚫 **不要** 在渲染循环中查询 Uniform 位置（提前缓存到 ShaderProgram）
- 🚫 **不要** 同步编译着色器（使用异步 API）
- 🚫 **不要** 无限制增长缓存（未来考虑 LRU 策略）

### 7.3 代码质量约束
- 🚫 **不要** 使用 `any` 类型（除 IRHIDevice mock）
- 🚫 **不要** 忽略编译错误（必须抛出详细信息）
- 🚫 **不要** 省略 JSDoc（所有公开 API 必须文档化）
- 🚫 **不要** 在 index.ts 中实现逻辑（仅用于导出）

### 7.4 错误处理约束
- 🚫 **不要** 静默失败（编译错误必须抛出或使用 fallback）
- 🚫 **不要** 丢失错误上下文（ShaderCompilerError 包含 stage/line/originalError）
- 🚫 **不要** 在 fallback 链中循环（最多 1 层 fallback）

---

## 8. 文件结构（File Structure）

```
packages/core/src/renderer/
├── shader-compiler.ts      # ShaderCompiler 编译器核心
├── shader-program.ts       # ShaderProgram 包装器
├── shader-cache.ts         # ShaderCache 缓存管理器
├── renderer.ts             # Renderer 基类
├── material-instance.ts    # MaterialInstance 实现
├── render-context.ts       # RenderContext 定义
└── index.ts                # 导出模块

packages/core/test/renderer/
├── shader-compiler.test.ts      # ShaderCompiler 单元测试
├── shader-integration.test.ts   # 集成测试
└── ...
```

---

## 9. 依赖关系（Dependencies）

### 9.1 内部依赖
- **Renderer → ShaderCompiler**（组合关系，1:1）
- **ShaderCompiler → IRHIDevice**（依赖注入）
- **ShaderCompiler → ShaderCache**（组合关系）
- **MaterialInstance → ShaderCompiler**（通过 Renderer 间接使用）

### 9.2 类型依赖
- `@maxellabs/specification`：
  - IRHIDevice
  - IRHIShaderModule
  - ShaderStage
  - ShaderModuleDescriptor

### 9.3 测试依赖
- `@jest/globals`
- Mock IRHIDevice

---

## 10. 参考资源（References）

### 架构文档
- `architecture-scene-systems` - Renderer 架构
- `architecture-resources` - 资源管理模式
- `strategy-scene-resource-integration` - 资源集成策略（参考模式）

### 宪法文档
- `constitution-core-runtime` - 命名规范、错误处理标准
- `doc-standard` - 文档编写规范

### 实现文件
- `/packages/core/src/renderer/shader-compiler.ts` - ShaderCompiler 实现
- `/packages/core/src/renderer/shader-program.ts` - ShaderProgram 实现
- `/packages/core/src/renderer/shader-cache.ts` - ShaderCache 实现
- `/packages/core/src/renderer/index.ts` - 导出模块

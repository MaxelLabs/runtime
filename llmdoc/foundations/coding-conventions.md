---
title: "项目编码规范"
id: "coding-conventions"
type: "constitution"
tags: ["typescript", "code-style", "performance", "architecture"]
related_ids: ["graphics-system-bible", "rhi-demo-constitution"]
token_cost: "medium"
context_dependency: ["typescript-basics", "project-structure"]
---

# 项目编码规范

## Context
本文档定义了项目的TypeScript编码规范、架构模式和性能要求。所有代码必须遵循这些约定以确保代码质量、性能和可维护性。

## Goal
提供统一、清晰、高效的编码标准，支持高性能渲染系统的开发需求。

## 接口定义

### 项目配置接口
```typescript
interface ProjectConfig {
  compiler: TypeScriptConfig;
  linter: ESLintConfig;
  formatter: PrettierConfig;
  paths: PathMapping;
}

interface TypeScriptConfig {
  target: 'ESNext';
  module: 'ESNext';
  moduleResolution: 'node';
  strict: true;
  experimentalDecorators: true;
  noImplicitAny: true;
  noImplicitReturns: true;
  noUnusedLocals: true;
  noUnusedParameters: true;
}

interface PathMapping {
  '@/*': string; // 指向 src/*
}
```

### 命名约定接口
```typescript
interface NamingConventions {
  // 类命名
  className: string;     // PascalCase
  methodName: string;    // camelCase
  constantName: string;  // UPPER_SNAKE_CASE
  privateMember: string; // camelCase
  fileName: string;      // kebab-case
  interfaceName: string; // PascalCase, I前缀可选
}

interface FileStructure {
  src: string;           // 所有源代码
  types: string;         // 类型声明文件
  test: string;          // 测试文件（排除在构建外）
}
```

## 1. TypeScript编译配置

### 1.1 强制配置要求

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "experimentalDecorators": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**负面约束：**
- ❌ 禁止使用 `any` 类型（除非必要）
- ❌ 禁止禁用 strict 模式
- ❌ 禁止隐式返回类型
- ❌ 禁止未使用的变量

### 1.2 类型系统最佳实践

#### 泛型基类原则
```typescript
// 正确：使用泛型接口定义通用行为
interface BaseAnimationTrack<K extends MinimalKeyframe> {
  id: string;
  keyframes: K[];
  duration: number;
}

// 正确：通过约束实现特化
interface TransformTrack extends BaseAnimationTrack<TransformKeyframe> {
  space: TransformSpace;
}
```

#### 类型别名使用规范
```typescript
// ✅ 正确：简化复杂泛型类型
type AnimationKeyframe = UnifiedKeyframe<any>;
type MaterialKeyframe = UnifiedKeyframe<any>;

// ✅ 正确：提供语义化名称
type CommonTextureRef = BaseTextureRef & {
  metadata: TextureMetadata;
};

// ❌ 错误：过度简化
type Simple = any;
type Data = object;
```

#### 枚举设计规范
```typescript
// ✅ 正确：基础功能枚举
enum EasingFunction {
  Linear = 'linear',
  EaseInOut = 'easeInOut'
}

// ✅ 正确：扩展功能枚举
enum ExtendedEasingType {
  Elastic = 'elastic',
  Bounce = 'bounce'
}

// ✅ 正确：完整类型联合
type FullEasingType = EasingFunction | ExtendedEasingType;
```

## 2. 架构设计模式

### 2.1 对象池模式

```typescript
// 对象池接口
interface Poolable {
  reset(): void;
  dispose(): void;
}

class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 10) {
    this.createFn = createFn;
    this.preAllocate(initialSize);
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    obj.reset();
    this.pool.push(obj);
  }
}

// 使用示例
class Vector3 implements Poolable {
  constructor(public x = 0, public y = 0, public z = 0) {}

  reset(): void {
    this.x = this.y = this.z = 0;
  }

  dispose(): void {
    // 清理资源
  }
}

const vectorPool = new ObjectPool(() => new Vector3());
```

### 2.2 命名空间导出模式

```typescript
// 在包的主入口文件中
export * as MMath from '@maxellabs/math';
export * as RHI from './rhi';
export * as Utils from './utils';

// 类型导出
export type {
  Vector3,
  Matrix4,
  Quaternion
} from '@maxellabs/math';
```

**负面约束：**
- ❌ 禁止使用默认导出（除非是React组件）
- ❌ 禁止混合使用命名和默认导出
- ❌ 禁止循环依赖

### 2.3 继承体系设计

```typescript
// ✅ 正确：扁平化扩展
interface BaseTransform {
  position: Vector3;
  rotation: Quaternion;
}

interface Transform3D extends BaseTransform {
  eulerRotation: Vector3; // 添加新属性
  scale: Vector3;         // 添加缩放
}

// ❌ 错误：深层嵌套
interface A extends B {}
interface B extends C {}
interface C extends D {}
```

## 3. 性能约束

### 3.1 内存对齐要求

```typescript
// 向量类必须使用Float32Array确保内存对齐
class Vector3 {
  private elements = new Float32Array(4); // 4元素对齐

  get x(): number { return this.elements[0]; }
  get y(): number { return this.elements[1]; }
  get z(): number { return this.elements[2]; }
  get w(): number { return this.elements[3]; } // 填充字节
}
```

### 3.2 对象创建约束

```typescript
// 性能管理器 - 强制对象复用
class PerformanceManager {
  private static readonly _tempVectors = new Map<string, Vector3>();
  private static readonly _tempMatrices = new Map<string, Matrix4>();

  static getTempVector(id: string = 'default'): Vector3 {
    if (!this._tempVectors.has(id)) {
      this._tempVectors.set(id, new Vector3());
    }
    const vec = this._tempVectors.get(id)!;
    return vec.set(0, 0, 0); // 重置后返回
  }

  static getTempMatrix(id: string = 'default'): Matrix4 {
    if (!this._tempMatrices.has(id)) {
      this._tempMatrices.set(id, new Matrix4());
    }
    const mat = this._tempMatrices.get(id)!;
    return mat.identity(); // 重置后返回
  }
}
```

**负面约束：**
- ❌ 禁止在循环中创建对象
- ❌ 禁止在update函数中分配内存
- ❌ 禁止频繁的GC压力操作

## 4. 错误处理规范

### 4.1 核心原则

#### 轻量级优先
- ❌ 禁止：过度工程化的错误处理系统（ErrorManager、错误类型层次、恢复策略等）
- ✅ 推荐：简单的错误数组收集机制
- ✅ 推荐：让错误自然抛出，只在关键位置catch

#### 用户导向
```typescript
// 用户应该能够通过简单的方式判断和查看错误
import { errors } from '@maxellabs/core';

if (errors.length > 0) {
  console.warn('发现错误:', errors);
}
```

#### 最小化验证
- ❌ 禁止：在底层库的每个函数入口都做参数验证
- ❌ 禁止：到处使用 try-catch 包裹代码
- ✅ 推荐：让错误在发生时自然抛出
- ✅ 推荐：只在确实需要恢复的地方catch

### 4.2 错误收集机制

#### API 设计

```typescript
// 错误信息接口
interface ErrorInfo {
  message: string;
  component?: string;
  timestamp: number;
  stack?: string;
}

// 核心导出
export const errors: ErrorInfo[] = [];

/**
 * 记录错误到全局数组并抛出异常
 * 实现"记录+统一抛出"模式：既收集错误信息，又统一抛出
 * @throws {Error} 总是抛出错误
 */
export function logError(message: string, component?: string, error?: Error): void;
export function clearErrors(): void;
export function getErrorCount(): number;
```

#### 设计理念：统一错误处理

**核心思想**：logError 同时做两件事
1. **记录**：将错误信息push到 `errors` 数组
2. **抛出**：立即 throw Error，确保调用者必须处理

**优势**：
- ✅ 集中收集所有错误信息，便于日志分析
- ✅ 强制调用者处理异常，避免静默失败
- ✅ 用户可通过 `errors.length` 查看累积错误数

#### 使用场景

**✅ 何时使用 logError（记录+抛出）：**
1. **需要记录但也要终止的错误**：操作失败且需要中断执行
2. **需要追踪的异常**：想要在错误数组中留下记录
3. **需要统一处理的错误**：上层需要catch并统一处理

**✅ 何时直接 throw Error（不记录）：**
1. **参数验证失败**：编程错误，不需要记录到全局数组
2. **前置条件检查**：如对象已销毁，这是使用错误不需要记录

### 4.3 实践指南

#### ✅ 正确示例

```typescript
// Example 1: 使用 logError 记录+抛出
try {
  const obj = pool.get();
  // ... 使用对象
} catch (error) {
  // logError 已经记录错误并抛出，这里统一处理
  console.error('池操作失败，已记录:', errors[errors.length - 1]);
  // 进行降级处理
}

// Example 2: 参数验证直接抛出（不使用logError）
class ObjectPool<T> {
  release(obj: T): void {
    if (obj == null) {
      throw new Error('Cannot release null object'); // 编程错误，直接抛出
    }
    // ...
  }
}

// Example 3: 关键操作使用logError
function preAllocate(count: number): void {
  try {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  } catch (error) {
    // logError 记录错误到数组并抛出
    logError('Failed to preallocate objects', 'ObjectPool', error);
  }
}
```

#### ❌ 错误示例

```typescript
// ❌ 过度验证
function setWidth(value: number) {
  if (typeof value !== 'number') {
    throw new ValidationError('width must be number', 'width', 'number', value);
  }
  if (isNaN(value)) {
    throw new ValidationError('width cannot be NaN', 'width', 'number', value);
  }
  if (value < 0) {
    throw new ValidationError('width must be non-negative', 'width', 'non-negative number', value);
  }
  this.element.width = value;
}

// ❌ 滥用 try-catch
function updateMatrix() {
  try {
    try {
      try {
        // 三层嵌套的 try-catch...
      } catch (e) { /* ... */ }
    } catch (e) { /* ... */ }
  } catch (e) { /* ... */ }
}

// ❌ 复杂的错误类型层次
class MaxError extends Error { /* ... */ }
class ObjectPoolError extends MaxError { /* ... */ }
class ContainerError extends MaxError { /* ... */ }
// ... 10+ 种错误类型
```

### 4.4 集成规范

#### Core 包导出

```typescript
// packages/core/src/base/errors.ts
export const errors: ErrorInfo[] = [];
export function logError(message: string, component?: string, error?: Error): void {
  errors.push({
    message,
    component,
    timestamp: Date.now(),
    stack: error?.stack,
  });
}
export function clearErrors(): void { errors.length = 0; }
export function getErrorCount(): number { return errors.length; }
```

#### 其他包使用方式

```typescript
import { errors, logError } from '@maxellabs/core';

// 检查是否有错误
if (errors.length > 0) {
  console.warn('发现错误:', errors);
}

// 记录错误
try {
  riskyOperation();
} catch (error) {
  logError('Operation failed', 'MyComponent', error);
}

// 清空错误（测试或重置时）
clearErrors();
```

### 4.5 负面清单（DO NOT）

1. **❌ 不要创建 ErrorManager 单例**
   - 理由：过度设计，增加复杂度

2. **❌ 不要创建错误类型层次结构**
   - 理由：简单的消息字符串足够

3. **❌ 不要在每个函数入口验证参数**
   - 理由：TypeScript 类型系统已提供编译时保障

4. **❌ 不要添加错误恢复策略、过滤器、处理器等**
   - 理由：用户只需要知道"有没有错"

5. **❌ 不要在底层库catch所有错误**
   - 理由：让错误向上冒泡，由使用者决定如何处理

6. **❌ 不要在错误处理中使用复杂的事件系统**
   - 理由：简单的数组访问即可

### 4.6 审查清单

在代码审查时，检查以下项：

- [ ] 是否使用了简单的 `errors` 数组而非复杂的 ErrorManager？
- [ ] 是否只在真正需要容错的地方使用 try-catch？
- [ ] 是否避免了过度的参数验证？
- [ ] 是否让编程错误直接抛出而非收集？
- [ ] 是否避免了创建多层错误类型？
- [ ] 用户是否能够通过 `errors.length` 判断问题？

## 5. 导入/导出规范

### 5.1 导入格式

```typescript
// ✅ 类型导入
import type { Component, SceneNode } from './types';

// ✅ 具体导入
import { ComponentLifecycleState } from './component';
import { SceneManager } from '../scene';

// ✅ 路径别名
import type { Scene } from '@/scene';
import { Renderer } from '@/renderer';

// ❌ 错误：混合导入
// import Component, { type SceneNode } from './component';
```

### 5.2 导出约定

```typescript
// ✅ 命名空间导出
export * as MathUtils from './utils/math';
export * as Geometry from './geometry';

// ✅ 类型重新导出
export type { Vector3, Matrix4 } from './math';

// ✅ 选择性导出
export { SceneManager, SceneNode } from './scene';

// ❌ 错误：默认导出非组件类
// export default SceneManager;
```

## 6. 代码质量控制

### 6.1 ESLint配置

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### 6.2 Prettier配置

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false
}
```

## Few-Shot示例

### 示例1：正确的组件定义
```typescript
// 问题：定义一个可复用的渲染组件
// 解决方案：
interface RenderComponent extends Poolable {
  readonly id: string;
  material: Material;
  geometry: Geometry;

  render(): void;
  reset(): void;
}

class MeshRenderer implements RenderComponent {
  public readonly id: string;

  constructor(
    public material: Material,
    public geometry: Geometry
  ) {
    this.id = generateUUID();
  }

  render(): void {
    // 渲染逻辑
  }

  reset(): void {
    this.material = Material.DEFAULT;
    this.geometry = Geometry.EMPTY;
  }
}
```

### 示例2：正确的性能优化
```typescript
// 问题：需要在动画循环中进行大量向量计算
// 错误方式：
// function animate(): void {
//   for (const obj of objects) {
//     const pos = new Vector3(); // ❌ 每帧创建
//     pos.add(obj.velocity);
//     obj.position.copy(pos);
//   }
// }

// 正确方式：
function animate(): void {
  const tempVec = PerformanceManager.getTempVector('animation');
  for (const obj of objects) {
    tempVec.copy(obj.position).add(obj.velocity);
    obj.position.copy(tempVec);
  }
}
```

### 示例3：正确的类型扩展
```typescript
// 问题：扩展现有的材质系统
// 错误方式：
// interface ExtendedMaterial extends Material extends BaseMaterial {} // ❌ 深层嵌套

// 正确方式：
interface MaterialExtension {
  emissive: Vector3;
  normalMap: Texture;
}

interface ExtendedMaterial extends Material, MaterialExtension {
  // 扁平化扩展
}
```

## 文件结构规范

### 目录组织
```
src/
├── core/           # 核心类型和接口
├── math/           # 数学库
├── rendering/      # 渲染系统
├── utils/          # 工具函数
├── types/          # 类型定义
└── index.ts        # 主入口文件
```

### 文件命名
- 使用 kebab-case: `vector-3.ts`, `matrix-4.ts`
- 测试文件添加 `.test` 后缀: `vector-3.test.ts`
- 类型定义文件使用 `.d.ts` 后缀

## 相关文档

### 🏛️ 核心规范
- [图形系统圣经](./graphics-bible.md) - 图形学基础原理
- [RHI Demo宪法](./rhi-demo-constitution.md) - Demo实现规范

### 🔧 开发工具
- [构建配置](../guides/build-setup.md) - 项目构建指南
- [测试规范](../guides/testing.md) - 单元测试要求

### 📚 学习资源
- [TypeScript最佳实践](../learning/typescript-best-practices.md)
- [性能优化指南](../learning/performance-optimization.md)
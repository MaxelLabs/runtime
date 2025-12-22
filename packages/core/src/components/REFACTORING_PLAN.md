# 组件重构方案 - 基于 Specification

## 📋 重构原则

### ✅ 已完成

#### 1. **Transform 组件** - 完全基于 `ITransform`

```typescript
// specification/core/interfaces.ts
export interface ITransform {
  position: Vector3Like;
  rotation: QuaternionLike;
  scale: Vector3Like;
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
}

// core/src/components/transform/index.ts
export class LocalTransform implements ITransform {
  position: Vector3Like = { x: 0, y: 0, z: 0 };
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };
  scale: Vector3Like = { x: 1, y: 1, z: 1 };
  matrix?: Matrix4Like;
  anchor?: Vector3Like;
  dirty: boolean = true; // ECS 专用字段

  static fromData(data: ITransform): LocalTransform {
    // 从 spec ITransform 解析
  }
}
```

**特点**:
- ✅ 直接实现 `ITransform` 接口
- ✅ `fromData()` 接收完整的 `ITransform` 类型
- ✅ 所有字段严格遵循 specification 定义
- ✅ 可以添加 ECS 专用字段 (如 `dirty`)

---

## 🎯 待确认方案

### **核心问题**: Specification 中缺少某些组件的标准定义

#### 现状分析

1. **有标准定义的组件**:
   - ✅ `ITransform` - 变换
   - ✅ `ColorLike` - 颜色
   - ✅ `BaseTextureRef` - 纹理引用
   - ✅ `Vector3Like`, `QuaternionLike` - 数学类型

2. **没有标准定义的组件**:
   - ❌ Mesh 引用 (只有 geometry 定义)
   - ❌ Material 引用 (只有 MaterialProperties)
   - ❌ Visible, Layer, CastShadow等简单标记组件

---

## 💡 推荐方案

### **方案 A: 混合模式** (推荐)

对于有 spec 定义的组件,严格基于 spec;对于没有定义的,保持简单结构:

```typescript
// ✅ 有 spec 定义 - 严格遵循
export class LocalTransform implements ITransform {
  static fromData(data: ITransform): LocalTransform { }
}

export class Color implements ColorLike {
  static fromData(data: ColorLike): Color { }
}

export class TextureRef implements BaseTextureRef {
  static fromData(data: BaseTextureRef): TextureRef { }
}

// ✅ 无 spec 定义 - 简单结构
export class MeshRef {
  assetId: string = '';
  meshName?: string;

  static fromData(data: { assetId: string; meshName?: string }): MeshRef { }
}

export class Visible {
  value: boolean = true;

  static fromData(data: { value: boolean }): Visible { }
}
```

**优点**:
- 有标准就遵循标准
- 没有标准则保持简洁
- 类型安全
- 易于扩展

**缺点**:
- 不够统一 (但这反映了实际情况)

---

### **方案 B: 扩展 Specification**

在 specification 包中补充缺失的定义:

```typescript
// specification/src/common/references.ts (新文件)
export interface BaseMeshRef {
  assetId: string;
  meshName?: string;
  submeshIndex?: number;
}

export interface BaseMaterialRef {
  assetId: string;
  overrides?: Record<string, any>;
  enabled?: boolean;
}
```

然后 ECS 组件严格实现:

```typescript
export class MeshRef implements BaseMeshRef {
  static fromData(data: BaseMeshRef): MeshRef { }
}

export class MaterialRef implements BaseMaterialRef {
  static fromData(data: BaseMaterialRef): MaterialRef { }
}
```

**优点**:
- 完全统一
- 类型定义集中管理
- 更好的跨包一致性

**缺点**:
- 需要修改 specification 包
- 增加额外的接口定义

---

### **方案 C: 现状保持**

保持当前实现,但在文档中明确说明:

```typescript
// 当前实现 (已完成)
export class MeshRef {
  assetId: string = '';
  meshName?: string;

  static fromData(data: Partial<MeshRef>): MeshRef { }
}
```

**优点**:
- 无需改动
- 简单直接

**缺点**:
- 不符合"严格从 spec 获取"的要求
- 类型定义分散

---

## 🤔 需要您的决策

请选择一个方案:

1. **方案 A (混合模式)** - 有 spec 就用 spec,没有则简单定义
2. **方案 B (扩展 specification)** - 补充 specification,全部统一
3. **方案 C (现状保持)** - 保持当前实现

或者您有其他想法?

---

## 📊 当前重构状态

### 已重构组件

| 组件 | 基于 Spec | 状态 |
|------|-----------|------|
| `LocalTransform` | ✅ `ITransform` | ✅ 完成 |
| `WorldTransform` | ✅ `ITransform` | ✅ 完成 |
| `Parent` | ❌ 简单结构 | ✅ 完成 |
| `Children` | ❌ 简单结构 | ✅ 完成 |

### 待重构组件

| 组件 | 可用 Spec | 建议方案 |
|------|-----------|----------|
| `Color` | ✅ `ColorLike` | 方案 A/B |
| `TextureRef` | ✅ `BaseTextureRef` | 方案 A/B |
| `MeshRef` | ❌ 无定义 | 方案 A (简单) / B (新增) |
| `MaterialRef` | ❌ 无定义 | 方案 A (简单) / B (新增) |
| `Visible` | ❌ 无定义 | 方案 A (简单) |
| `Layer` | ❌ 无定义 | 方案 A (简单) |
| `CastShadow` | ❌ 无定义 | 方案 A (简单) |
| `ReceiveShadow` | ❌ 无定义 | 方案 A (简单) |

---

**请告诉我您希望采用哪个方案,我将继续完成重构。**

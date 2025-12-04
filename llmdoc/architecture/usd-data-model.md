# USD 数据模型和类型系统

## 1. Identity

**USD 数据模型** 是一个基于 Universal Scene Description 格式的类型化场景数据模型，提供完整的场景图、属性系统和时间表达能力。

**Purpose**: 定义 3D 场景数据的结构和类型系统，确保数据的一致性和可扩展性。

## 2. 核心组件

- `packages/specification/src/core/usd.ts` (UsdPrim, UsdValue, UsdDataType): 核心数据类型和值系统
- `packages/specification/src/core/interfaces.ts` (ITransform, CoreBoundingBox, MaterialProperties): 业务接口定义
- `packages/specification/src/core/math.ts` (ColorLike, Matrix4Like, Vector3Like): 数学类型支持
- `packages/specification/src/animation/core.ts` (UsdAnimationClip, UsdKeyframe): 动画数据模型

## 3. 执行流程 (LLM Retrieval Map)

- **1. 类型定义**: 通过 `UsdDataType` 枚举定义所有支持的数据类型
- **2. 值表达**: `UsdValue` 统一表达所有属性值，支持时间采样
- **3. 场景图**: `UsdPrim` 构建层次化的场景图结构
- **4. 属性系统**: 属性通过 `UsdPropertySpec` 定义类型、默认值、变化性
- **5. 组合关系**: Reference、Payload、SubLayer 等组合弧管理场景组装
- **6. 变体系统**: 通过 `UsdVariantSet` 实现条件化场景内容
- **7. 动画集成**: 动画数据作为特殊的属性集集成到场景模型中

## 4. 设计原理

### 4.1 类型系统

```typescript
// 基础数据类型
enum UsdDataType {
  Bool = 'bool',
  Int = 'int',
  Float = 'float',
  String = 'string',
  Vector3f = 'float3',
  Color3f = 'color3f',
  Matrix4d = 'matrix4d',
  // ... 更多类型
}

// 统一值表达
interface UsdValue {
  type: UsdDataType;
  value: any;
  timeSamples?: Record<number, any>;
}
```

### 4.2 场景图模型

```typescript
// Prim 是场景的基本单位
interface UsdPrim {
  path: string;           // 路径标识
  typeName: string;      // 类型名称
  active: boolean;        // 激活状态
  attributes: Record<string, UsdValue>;  // 属性集合
  relationships: Record<string, string[]>; // 关系集合
  children: UsdPrim[];   // 子 Prim
  variantSets?: Record<string, UsdVariantSet>; // 变体集合
}
```

### 4.3 时间采样支持

- **时间轴**: 每个 Stage 定义 `timeCodesPerSecond`、`startTimeCode`、`endTimeCode`
- **动画数据**: 属性值可以通过 `timeSamples` 支持关键帧动画
- **插值**: 支持 `varying` 和 `uniform` 两种变化性

### 4.4 扩展机制

- **Custom 属性**: 通过 `custom` 标记添加扩展属性
- **命名空间**: 使用 `maxellabs:` 前缀组织扩展功能
- **元数据**: 通过 `metadata` 字段存储附加信息

### 4.5 组合策略

- **SubLayer**: 层级组合，支持场景分层管理
- **Reference**: 引用组合，支持资产复用
- **Payload**: 按需加载，支持大型场景管理
- **Inherit**: 继承关系，支持属性传播
- **Specialize**: 特化关系，支持覆盖和重定义
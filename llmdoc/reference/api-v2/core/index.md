---
# Identity
id: "core-modules"
type: "reference"
title: "Core Modules - Foundation Components"

# Semantics
description: "Foundation components providing thread-safe IOC, browser validation, event system, and transform hierarchy for the runtime architecture."

# Graph
context_dependency: []
related_ids: [
  "core-ioc-container", "core-canvas-wrapper", "core-event-dispatcher", "core-transform-component",
  "core-max-object", "core-component", "core-entity", "core-event", "core-refer-resource",
  "core-object-pool", "core-object-pool-manager", "core-time", "core-hierarchy-utils",
  "core-bitset", "core-sparse-set", "core-disposable"
]
---

## 📚 核心模块概览

本目录包含运行时架构的基础组件，这些组件为上层系统提供可靠的基础服务。包括对象基础、实体系统、事件管理、内存池和工具类。

### 模块结构

```
core/
├── index.md                    # 本文件 - 核心模块概览
├── max-object.md               # 引擎对象基类（唯一ID、生命周期）
├── refer-resource.md           # 资源引用计数（自动管理）
├── entity.md                   # 实体类（组件容器、场景层级）
├── component.md                # 组件基类（生命周期管理）
├── event.md                    # 事件对象（数据载体）
├── event-dispatcher.md         # 事件分发器（优先级系统）
├── object-pool.md              # 对象池（通用复用）
├── object-pool-manager.md      # 池管理器（集中监控）
├── time.md                     # 时间管理（delta、缩放）
├── ioc-container.md            # 依赖注入容器（线程安全）
├── canvas-wrapper.md           # Canvas包装器（浏览器验证）
├── transform-component.md      # 变换组件（层级管理）
├── hierarchy-utils.md          # 层级工具函数（循环检测等）
├── bitset.md                   # 位集合（ECS组件掩码）
├── sparse-set.md               # 稀疏集合（高效整数集）
└── disposable.md               # 可释放资源接口
```

## 🔑 关键特性

### 对象系统
- **MaxObject**: 统一ID生成、销毁检测、生命周期跟踪
- **ReferResource**: 引用计数资源管理，防止内存泄漏
- **Entity/Component**: ECS风格架构，模块化行为

### 事件系统
- **优先级系统**: 高数值先执行，精确控制执行顺序
- **事件冒泡/捕获**: 支持层级事件传递
- **一次性监听**: 自动清理，防止资源泄漏

### 内存管理
- **对象池**: 对象重用，减少频繁创建/销毁开销
- **中央管理**: 统一监控、统计、告警系统
- **引用计数**: GPU资源、纹理等大对象的自动管理

### 时空系统
- **时间缩放**: 慢动作、暂停、快进
- **固定步长**: 确定性物理模拟
- **FPS独立**: 任何帧率下表现一致

### 安全性
- **循环检测**: 在IOC和变换层级中防止循环引用
- **深度限制**: 1000层变换层级限制
- **错误恢复**: 事件系统的错误隔离和恢复机制

## 🎯 使用场景

### 游戏引擎架构
```typescript
// 基础架构初始化
const container = Container.getInstance();
container.register('event-bus', new EventDispatcher('global'));
container.registerFactory('canvas', () => new Canvas('game-canvas'));

// 场景图构建
const root = new TransformComponent();
transformSystem.add(root);
```

### 应用开发
```typescript
// UI组件系统
const uiEvents = new EventDispatcher('ui-root');

// 响应式画布
const canvas = new Canvas('render-target');
window.addEventListener('resize', () => {
  canvas.resizeByClientSize();
  uiEvents.emit('layout-updated');
});
```

### 系统集成
```typescript
// 组件通信
const container = Container.getInstance();
const events = container.resolve<EventDispatcher>('event-bus');

// 跨系统事件
events.on('resource-loaded', {
  callback: (event) => {
    sceneManager.add(event.data);
    renderer.upload(event.data);
  },
  priority: 0
});
```

## 📊 模块依赖关系

```
┌─────────────────────────────────────┐
│        Application Layer            │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│   Core Module (this directory)      │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ IOC     │  │ Event   │          │
│  │ Container│  │ Dispatcher│        │
│  └─────────┘  └─────────┘          │
│        ▲             ▲              │
│        │             │              │
│  ┌─────────┐  ┌─────────┐          │
│  │ Canvas  │  │ Transform│         │
│  │ Wrapper │  │ Component│          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        Supporting Libraries         │
│  (Math, Specification, RHI, etc.)   │
└─────────────────────────────────────┘
```

## 🚀 快速入门

### 1. 初始化基础服务
```typescript
import { Container, EventDispatcher, Canvas, TransformComponent } from '@maxellabs/core';

// 依赖注入容器（单例）
const container = Container.getInstance();

// 注册核心服务
container.register('events', new EventDispatcher('system'));
container.registerFactory('canvas', () => new Canvas('main'));
```

### 2. 构建场景层级
```typescript
// 创建转换器
const root = new TransformComponent();
const child = new TransformComponent();

// 建立父子关系
root.addChild(child);

// 设置变换
child.position.set(10, 0, 0);
child.scale.set(2, 2, 2);

// 访问世界坐标
const worldPos = child.getWorldPosition(); // (10, 0, 0)
```

### 3. 事件驱动架构
```typescript
const events = container.resolve<EventDispatcher>('events');

// 发布事件
events.emit('app-ready', { version: '2.0.0' });

// 订阅事件
events.on('app-ready', {
  callback: (event) => {
    console.log(`App ready: ${event.data.version}`);
  },
  priority: 100
});
```

## 🔒 安全准则

### 线程安全（JavaScript上下文）
- ✅ 使用`isInitializing`标志防止并发初始化
- ✅ 事件循环友好，避免阻塞
- ❌ 不支持真实多线程（Web Workers除外）

### 内存安全
- ✅ 组件销毁时清理引用
- ✅ 防止事件监听器内存泄漏
- ✅ 及时释放变换层级引用

### 逻辑安全
- ✅ IOC容器循环引用检测
- ✅ 变换层级循环引用检测
- ✅ 递归深度限制

## 🔗 扩展接口

### 事件监听器扩展
```typescript
interface ExtendedEventListener extends EventListener {
  filter?: (event: Event) => boolean;
  tag?: string;
}
```

### 变换扩展接口
```typescript
interface TransformStats {
  getHierarchyDepth(): number;
  getMemoryUsage(): number;
  getDirtyFlags(): string[];
}
```

## 📈 性能提示

### 高频操作优化
1. **批量变换**: 在一帧内收集所有变换，统一更新
2. **事件合并**: 合并相似事件，减少分发次数
3. **懒加载**: 使用IOC工厂函数，延迟对象创建

### 内存优化
1. **事件监听器使用 `once`**: 避免忘记清理
2. **变换层级控制**: 不要过度嵌套（< 50层最佳）
3. **IOC服务管理**: 定期清理无用服务

## 🎯 最佳实践

### 1. 依赖注入优先
```typescript
// ✅ 推荐
const bus = container.resolve('event-bus');

// ❌ 避免
const bus = new EventDispatcher(); // 失去单例管理
```

### 2. 事件系统错误处理
```typescript
events.on('critical-operation', {
  callback: (event) => {
    try {
      // 危险操作
    } catch (error) {
      // 捕获不影响主流程
      events.emit('error-recovery', { error });
    }
  },
  priority: 999 // 高优先级，确保执行
});
```

### 3. 变换层级设计
```typescript
// ✅ 扁平结构
root → entity → component

// ❌ 深度嵌套
root → a → b → c → ... → entity // 难以维护，性能下降
```

## 📚 相关文档

### 🏗️ 架构设计
- [系统架构](./architecture.md) - 完整架构概览与集成方案
- [模块索引](../SUMMARY.md) - API文档目录

### 📖 基础组件
- [MaxObject](./max-object.md) - 对象基类与生命周期
- [ReferResource](./refer-resource.md) - 引用计数资源管理
- [Entity](./entity.md) - 实体与场景层级
- [Component](./component.md) - 组件系统
- [Event](./event.md) - 事件对象
- [EventDispatcher](./event-dispatcher.md) - 优先级事件系统
- [Time](./time.md) - 时间管理

### 🔧 工具系统
- [ObjectPool](./object-pool.md) - 对象池优化
- [ObjectPoolManager](./object-pool-manager.md) - 池管理器
- [IOCContainer](./ioc-container.md) - 依赖注入容器
- [CanvasWrapper](./canvas-wrapper.md) - 环境验证
- [TransformComponent](./transform-component.md) - 变换层级
- [HierarchyUtils](./hierarchy-utils.md) - 层级工具函数
- [BitSet](./bitset.md) - 高性能位集合
- [SparseSet](./sparse-set.md) - 高性能稀疏集合
- [Disposable](./disposable.md) - 资源释放接口

## 🔍 调试建议

### 常见问题排查

**问题：事件未触发**
```typescript
console.log(events.hasEventListener('my-event'));
console.log(events.getEventListenerCount('my-event'));
```

**问题：变换未更新**
```typescript
// 检查脏标记
if (transform.isDirty()) {
  console.log('Dirty flags:', {
    local: transform.localMatrixDirty,
    world: transform.worldMatrixDirty,
    directions: transform.directionsDirty
  });
}

// 强制刷新
transform.updateWorldMatrix();
```

**问题：IOC找不到服务**
```typescript
// 检查注册状态
if (!container.has('my-service')) {
  console.log('Available services:',
    container.resolve('serviceA') // Trigger registration
  );
}
```

---
**文档状态**: 完成 ✅
**最后更新**: 2025-12-18
**版本**: 1.0.0

# Maxellabs 3D Engine - 核心包 (`@maxellabs/core`)

## 概述

`@maxellabs/core` 是 Maxellabs 3D Engine 的核心层，为整个引擎生态系统提供基础架构和核心功能。它是连接设计、动效、图表、渲染引擎的关键纽带，提供了一个完整的、可扩展的、高性能的 3D 应用程序开发框架。

## 🎯 设计目标

- **统一架构**: 为从设计工具到生产环境的完整工作流程提供统一的技术栈
- **API 无关**: 通过RHI层抽象不同的图形API（WebGL、WebGL2、WebGPU等）
- **高性能**: 优化的渲染管线和资源管理，支持复杂的3D场景
- **可扩展**: 基于组件的架构，支持自定义组件和系统
- **跨平台**: 支持Web、移动端、桌面端等多平台部署

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Maxellabs 3D Engine                     │
├─────────────────────────────────────────────────────────────┤
│  设计工具层  │  动效工具层  │  图表工具层  │  应用开发层    │
├─────────────────────────────────────────────────────────────┤
│                    @maxellabs/core                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Engine    │ │   Scene     │ │  Resource   │            │
│  │   引擎核心   │ │   场景管理   │ │   资源管理   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Renderer   │ │   Input     │ │  Material   │            │
│  │   渲染系统   │ │   输入系统   │ │   材质系统   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                     RHI Interface                          │
│              (Rendering Hardware Interface)                │
├─────────────────────────────────────────────────────────────┤
│       WebGL        │      WebGL2       │      WebGPU       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 核心模块

### 🎮 Engine (`engine.ts`)
**引擎核心控制器**

负责整个引擎的生命周期管理、主循环控制和系统协调。

**主要功能**:
- 引擎初始化和生命周期管理
- 主循环控制（Update-Render循环）
- 系统间的协调和通信
- 性能监控和调试支持
- IOC容器管理

**关键特性**:
- 目标帧率控制
- 异步初始化
- 事件驱动架构
- 状态管理

```typescript
import { Engine, EngineOptions } from '@maxellabs/core';

const engine = new Engine({
  targetFrameRate: 60,
  autoStart: true,
  enablePhysics: true,
  debug: true
});

await engine.initialize();
engine.start();
```

### 🎭 Scene (`scene/`)
**场景图和对象管理**

提供基于层级结构的场景管理和实体-组件-系统（ECS）架构。

**主要功能**:
- 场景图管理
- 游戏对象生命周期
- 组件系统
- 变换层级
- 场景序列化/反序列化

**目录结构**:
```
scene/
├── Scene.ts              # 场景根容器
├── GameObject.ts         # 游戏对象
├── Component.ts          # 组件基类
├── scene-manager.ts      # 场景管理器
└── components/           # 内置组件
    ├── MeshRenderer.ts   # 网格渲染组件
    ├── Camera.ts         # 相机组件
    ├── Light.ts          # 光源组件
    └── Transform.ts      # 变换组件
```

### 🎨 Renderer (`renderer/`)
**渲染管线和绘制系统**

管理整个渲染流程，从场景数据到最终画面输出。

**主要功能**:
- 渲染管线管理
- 渲染队列排序
- 视锥剔除和优化
- 批处理和实例化
- 后处理效果

**目录结构**:
```
renderer/
├── Renderer.ts           # 渲染器主类
├── RenderPipeline.ts     # 渲染管线抽象
├── ForwardRenderer.ts    # 前向渲染管线
├── RenderQueue.ts        # 渲染队列
├── RenderElement.ts      # 渲染元素
├── render-context.ts     # 渲染上下文
└── passes/               # 渲染通道
    ├── DepthPass.ts      # 深度通道
    ├── ShadowPass.ts     # 阴影通道
    └── PostProcessPass.ts # 后处理通道
```

### 🎯 Resource (`resource/`)
**资源管理和缓存**

统一管理纹理、模型、材质、着色器等各类资源。

**主要功能**:
- 异步资源加载
- 资源缓存和重用
- 资源生命周期管理
- 内存优化
- 资源热重载

**目录结构**:
```
resource/
├── resource-manager.ts   # 资源管理器
├── Resource.ts           # 资源基类
├── ResourceLoader.ts     # 资源加载器
├── ResourceCache.ts      # 资源缓存
└── loaders/              # 各类加载器
    ├── TextureLoader.ts  # 纹理加载器
    ├── ModelLoader.ts    # 模型加载器
    └── ShaderLoader.ts   # 着色器加载器
```

### 🧊 Geometry (`geometry/`)
**几何体和网格管理**

提供各种几何体的创建、操作和优化功能。

**主要功能**:
- 基础几何体生成
- 网格数据管理
- 几何体变换
- LOD（细节层次）支持
- 几何体优化

**目录结构**:
```
geometry/
├── Geometry.ts           # 几何体基类
├── Mesh.ts               # 网格数据
├── primitives/           # 基础几何体
│   ├── BoxGeometry.ts    # 立方体
│   ├── SphereGeometry.ts # 球体
│   ├── PlaneGeometry.ts  # 平面
│   └── CylinderGeometry.ts # 圆柱体
└── modifiers/            # 几何体修改器
    ├── SubdivisionModifier.ts # 细分
    └── SimplificationModifier.ts # 简化
```

### 🎨 Material (`material/`)
**材质和着色器系统**

管理材质属性、着色器程序和渲染状态。

**主要功能**:
- 材质属性管理
- 着色器参数绑定
- 渲染状态控制
- 材质变体系统
- PBR材质支持

**目录结构**:
```
material/
├── Material.ts           # 材质基类
├── MaterialProperty.ts   # 材质属性
├── MaterialVariant.ts    # 材质变体
└── materials/            # 内置材质
    ├── StandardMaterial.ts # 标准材质
    ├── PBRMaterial.ts    # PBR材质
    └── UnlitMaterial.ts  # 无光照材质
```

### 🕹️ Input (`input/`)
**输入处理和事件系统**

处理键盘、鼠标、触摸和其他输入设备的交互。

**主要功能**:
- 多设备输入支持
- 输入事件处理
- 手势识别
- 输入映射和绑定

**目录结构**:
```
input/
├── InputManager.ts       # 输入管理器
├── enums/                # 输入枚举
├── interface/            # 输入接口
├── keyboard/             # 键盘输入
├── pointer/              # 指针输入
└── wheel/                # 滚轮输入
```

### 📷 Camera (`camera/`)
**相机和视口管理**

管理3D场景的观察视角和投影。

**主要功能**:
- 透视/正交投影
- 视锥剔除
- 相机控制器
- 多相机支持

### 💡 Light (`light/`)
**光照系统**

提供各种光源类型和光照计算。

**主要功能**:
- 多种光源类型
- 实时阴影
- 光照烘焙
- 环境光照

### 🎨 Texture (`texture/`)
**纹理管理**

处理2D纹理、立方体贴图和渲染目标。

**主要功能**:
- 多种纹理格式
- 纹理压缩
- Mipmap生成
- 渲染到纹理

### 🔧 Shader (`shader/`)
**着色器管理**

管理顶点、片段和计算着色器。

**主要功能**:
- 着色器编译
- 参数绑定
- 变体管理
- 热重载

### 📋 Serialization (`serialization/`)
**序列化系统**

支持场景、对象和资源的序列化。

**主要功能**:
- JSON序列化
- 二进制序列化
- 预制件系统
- 版本兼容

### 🏗️ Base (`base/`)
**基础框架**

提供引擎的基础设施和工具类。

**主要功能**:
- 事件系统
- 对象池
- IOC容器
- 数学工具

**目录结构**:
```
base/
├── event-dispatcher.ts   # 事件分发器
├── event.ts              # 事件定义
├── max-object.ts         # 基础对象
├── component.ts          # 组件基类
├── entity.ts             # 实体基类
├── transform.ts          # 变换组件
├── time.ts               # 时间管理
├── IOC.ts                # 控制反转容器
├── object-pool.ts        # 对象池
├── object-pool-manager.ts # 对象池管理器
├── refer-resource.ts     # 资源引用
└── canvas.ts             # 画布管理
```

### 🔌 Interface (`interface/`)
**RHI接口层**

定义与底层图形API的抽象接口。

**主要功能**:
- 图形API抽象
- 设备管理
- 资源创建
- 渲染命令

**目录结构**:
```
interface/
└── rhi/                  # 渲染硬件接口
    ├── device.ts         # 设备抽象
    ├── pipeline.ts       # 渲染管线
    ├── bindings.ts       # 资源绑定
    ├── types/            # 类型定义
    ├── resources/        # 资源接口
    └── passes/           # 渲染通道
```

## 🚀 快速开始

### 安装

```bash
npm install @maxellabs/core
# 或
pnpm add @maxellabs/core
```

### 基础使用

```typescript
import { Engine, Scene, GameObject, MeshRenderer, BoxGeometry, StandardMaterial } from '@maxellabs/core';

// 创建引擎
const engine = new Engine({
  targetFrameRate: 60,
  autoStart: true,
  debug: true
});

// 初始化引擎
await engine.initialize();

// 创建场景
const scene = engine.createScene('MainScene');

// 创建游戏对象
const cubeObject = scene.createGameObject('Cube');

// 添加网格渲染器组件
const meshRenderer = cubeObject.addComponent(MeshRenderer);
meshRenderer.setGeometry(new BoxGeometry(1, 1, 1));
meshRenderer.setMaterial(new StandardMaterial());

// 设置位置
cubeObject.transform.setPosition(0, 0, 0);

// 创建相机
const cameraObject = scene.createGameObject('Camera');
const camera = cameraObject.addComponent(Camera);
camera.setFieldOfView(60);
cameraObject.transform.setPosition(0, 0, 5);

// 加载场景
engine.loadScene(scene);

// 启动引擎
engine.start();
```

### 高级使用示例

#### 资源管理
```typescript
import { ResourceManager } from '@maxellabs/core';

const resourceManager = engine.getResourceManager();

// 加载纹理
const texture = await resourceManager.load<Texture2D>('/textures/diffuse.jpg');

// 加载模型
const model = await resourceManager.load<Model>('/models/character.gltf');

// 创建材质
const material = new PBRMaterial();
material.setTexture('albedo', texture);
material.setFloat('metallic', 0.0);
material.setFloat('roughness', 0.5);
```

#### 输入处理
```typescript
import { InputManager, PointerEventType } from '@maxellabs/core';

const inputManager = engine.getInputManager();

// 监听指针事件
inputManager.on(PointerEventType.Down, (event) => {
  console.log('Pointer down at:', event.position);
});

// 监听键盘事件
inputManager.on('keydown', (event) => {
  if (event.key === 'Space') {
    // 处理空格键按下
  }
});
```

#### 自定义组件
```typescript
import { Component } from '@maxellabs/core';

export class RotationComponent extends Component {
  private speed: number = 1.0;

  setRotationSpeed(speed: number): void {
    this.speed = speed;
  }

  onUpdate(deltaTime: number): void {
    const rotation = this.gameObject.transform.rotation;
    rotation.y += this.speed * deltaTime;
    this.gameObject.transform.setRotation(rotation);
  }
}

// 使用自定义组件
const rotationComponent = cubeObject.addComponent(RotationComponent);
rotationComponent.setRotationSpeed(2.0);
```

## 🔧 配置选项

### 引擎配置
```typescript
interface EngineOptions {
  /** 目标帧率 */
  targetFrameRate?: number;
  /** 是否自动启动引擎 */
  autoStart?: boolean;
  /** 是否启用物理系统 */
  enablePhysics?: boolean;
  /** 是否启用音频系统 */
  enableAudio?: boolean;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 渲染器配置 */
  renderer?: RendererOptions;
}
```

### 渲染器配置
```typescript
interface RendererOptions {
  /** 画布元素或选择器 */
  canvas?: HTMLCanvasElement | string;
  /** 抗锯齿 */
  antialias?: boolean;
  /** 背景色 */
  backgroundColor?: Color;
  /** 是否透明 */
  alpha?: boolean;
  /** 深度缓冲 */
  depth?: boolean;
  /** 模板缓冲 */
  stencil?: boolean;
}
```

## 🎯 与其他包的关系

### 依赖关系
- **`@maxellabs/math`**: 数学库，提供向量、矩阵、四元数等数学运算
- **`@maxellabs/specification`**: 规范库，提供类型定义和接口规范

### 被依赖关系
- **`@maxellabs/engine`**: 引擎包，基于core包构建完整的引擎
- **`@maxellabs/rhi`**: RHI实现包，实现具体的图形API
- **设计工具**: 基于core包的组件系统构建设计工具
- **动效工具**: 使用core包的动画和时间系统
- **图表工具**: 利用core包的渲染能力绘制图表

## 🏆 性能特性

### 渲染优化
- **批处理渲染**: 自动合并相同材质的绘制调用
- **视锥剔除**: GPU加速的视锥剔除算法
- **LOD系统**: 自动细节层次管理
- **实例化渲染**: 高效的大量相似对象渲染

### 内存管理
- **对象池**: 减少垃圾回收压力
- **资源缓存**: 智能的资源复用机制
- **懒加载**: 按需加载资源
- **内存监控**: 实时内存使用统计

### 异步处理
- **非阻塞加载**: 异步资源加载不阻塞主线程
- **并行处理**: 多线程任务调度
- **帧预算**: 智能的帧时间分配

## 🧪 测试和调试

### 单元测试
```bash
# 运行测试
pnpm test

# 观察模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

### 调试功能
- **性能分析器**: 内置的性能监控工具
- **渲染调试**: 可视化渲染管线状态
- **内存分析**: 实时内存使用监控
- **日志系统**: 分级日志和过滤

## 📚 最佳实践

### 组件设计
- 保持组件单一职责
- 避免组件间的强耦合
- 使用事件系统进行通信

### 性能优化
- 合理使用对象池
- 避免频繁的资源加载
- 优化渲染状态切换

### 内存管理
- 及时释放不需要的资源
- 使用弱引用避免循环引用
- 监控内存使用情况

## 🔮 未来规划

### 短期目标
- [ ] WebGPU支持
- [ ] 物理引擎集成
- [ ] 音频系统完善
- [ ] 性能分析工具

### 长期目标
- [ ] 移动端优化
- [ ] VR/AR支持
- [ ] 云渲染支持
- [ ] AI辅助开发

## 📖 相关文档

- [RHI接口文档](../rhi/README.md)
- [规范包文档](../specification/README.md)
- [数学库文档](../math/README.md)
- [引擎包文档](../engine/README.md)

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [CONTRIBUTING.md](../../CONTRIBUTING.md) 了解如何参与项目开发。

## 📄 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

**Maxellabs 3D Engine** - 让3D开发更简单、更高效、更有趣！

# Core包高级API渲染流程Demo

这个Demo展示了Maxellabs 3D Engine Core包的高级API使用，完整演示了Engine、Scene、GameObject、MeshRenderer、Material等组件的协作流程。

## Demo概述

### 🎯 主要目标
展示Core包如何提供高级API封装，让开发者无需直接操作RHI接口，通过Engine、Scene、GameObject等概念完成3D渲染。

### 🏗️ 技术架构
```
用户代码 (Core包高级API)
    ↓
Engine → Scene → GameObject → MeshRenderer → Material
    ↓
Core包内部 (自动处理RHI调用)
    ↓
@maxellabs/rhi (硬件抽象层)
    ↓
WebGL (底层渲染API)
```

## Core包高级API

### 🏗️ Engine引擎系统
- **生命周期管理**: initialize() → start() → pause() → destroy()
- **系统注册**: 自动管理TimeManager、SceneManager、ResourceManager等
- **主循环控制**: 60FPS目标帧率，VSync支持
- **IOC容器**: 依赖注入和服务定位

### 🎬 Scene场景管理
- **GameObject层级**: 完整的父子关系和变换继承
- **组件系统**: 灵活的ECS架构
- **场景图**: 高效的场景遍历和更新
- **事件系统**: 场景生命周期事件

### 📦 GameObject游戏对象
- **组件容器**: addComponent()、getComponent()、removeComponent()
- **Transform变换**: 位置、旋转、缩放的统一管理
- **层级结构**: 父子关系和世界/本地坐标转换
- **生命周期**: 创建、更新、销毁的完整流程

### 🎯 MeshRenderer渲染组件
- **材质绑定**: setMaterial()设置渲染材质
- **几何体绑定**: setGeometry()设置网格数据
- **渲染状态**: 阴影投射、接收等渲染属性
- **批处理优化**: 自动合并相似渲染调用

### 🎨 Material材质系统
- **PBR属性**: diffuse、metallic、roughness等物理属性
- **着色器管理**: 自动选择和编译着色器
- **纹理绑定**: 支持多种纹理类型
- **参数动画**: 运行时修改材质参数

### 📷 Camera相机系统
- **投影类型**: 透视投影和正交投影
- **视图变换**: lookAt()、setPosition()等便捷方法
- **视锥裁剪**: 自动计算可见对象
- **多相机支持**: 不同优先级的相机渲染

## 完整渲染流程

### 1. 🚀 Engine初始化
```typescript
const engine = new Engine({
  canvas,
  targetFrameRate: 60,
  debug: true,
  antialias: true
});
await engine.initialize();
```

### 2. 🎬 Scene和Camera创建
```typescript
const scene = new Scene('MainScene');
const cameraObject = new GameObject('MainCamera');
const camera = new PerspectiveCamera(cameraObject.getEntity());
scene.addGameObject(cameraObject);
```

### 3. 🎨 Material创建
```typescript
const material = new Material('MyMaterial');
material.setColor('diffuse', [1.0, 0.5, 0.5, 1.0]);
material.setFloat('metallic', 0.0);
material.setFloat('roughness', 0.8);
```

### 4. 📦 GameObject和组件
```typescript
const gameObject = new GameObject('MyObject');
const transform = gameObject.getComponent(Transform);
transform.setPosition(new Vector3(0, 0, 0));

const renderer = gameObject.addComponent(MeshRenderer);
renderer.setMaterial(material);
scene.addGameObject(gameObject);
```

### 5. 🔄 Engine启动和渲染
```typescript
engine.loadScene(scene);
engine.start(); // 自动开始渲染循环
```

## 架构优势

### 🎯 开发者友好
- **高级抽象**: 无需了解WebGL细节
- **类型安全**: 完整的TypeScript类型支持
- **智能提示**: IDE友好的API设计
- **错误处理**: 详细的错误信息和调试支持

### 🏗️ 架构清晰
- **分层设计**: 清晰的职责分离
- **组件化**: 可复用的组件系统
- **事件驱动**: 松耦合的通信机制
- **依赖注入**: 灵活的服务管理

### ⚡ 性能优化
- **自动批处理**: Core包内部优化渲染调用
- **对象池**: 减少GC压力
- **脏标记**: 只在需要时更新
- **视锥裁剪**: 自动剔除不可见对象

## 实时监控

### 📊 引擎状态
- **Engine State**: 显示引擎当前状态
- **Current Stage**: 显示当前执行阶段
- **FPS**: 实时帧率监控
- **Frame Count**: 总帧数统计

### 🎬 场景信息
- **Scene**: 当前活跃场景
- **GameObjects**: 场景中的游戏对象数量
- **Materials**: 材质数量统计
- **Camera**: 相机状态

### 🔄 渲染统计
- **Draw Calls**: 渲染调用次数
- **Triangles**: 渲染的三角形数量
- **Vertices**: 顶点数量统计

## 交互控制

### 🎮 键盘控制
- **空格键**: 调用engine.pause()/resume()
- **R键**: 重启Demo
- **D键**: 切换engine.setDebugMode()
- **ESC键**: 调用engine.destroy()

### 🖱️ 动态效果
- **旋转三角形**: 使用transform.rotateLocalZ()
- **缩放立方体**: 使用transform.setScale()
- **实时更新**: 在渲染循环中更新Transform

## 与RHI的对比

### 🔄 之前 (直接使用RHI)
```typescript
// 需要手动管理WebGL资源
const device = new WebGLDevice(canvas);
const vertexShader = device.createShaderModule({...});
const fragmentShader = device.createShaderModule({...});
const pipeline = device.createRenderPipeline({...});
// ... 大量底层代码
```

### ✨ 现在 (使用Core包)
```typescript
// 高级API，自动管理底层资源
const engine = new Engine({ canvas });
const scene = new Scene('MainScene');
const gameObject = new GameObject('MyObject');
const material = new Material('MyMaterial');
// Core包内部自动处理RHI调用
```

## 技术亮点

### 🎯 用户体验
- **简单易用**: 几行代码即可创建3D场景
- **概念清晰**: Engine、Scene、GameObject等直观概念
- **渐进式**: 可以从简单开始，逐步添加复杂功能
- **文档完善**: 完整的API文档和示例

### 🏗️ 架构设计
- **职责分离**: Engine管理生命周期，Scene管理对象，GameObject管理组件
- **扩展性**: 易于添加新的组件类型和系统
- **可测试**: 清晰的接口便于单元测试
- **可维护**: 模块化设计便于维护和升级

## 文件结构

```
packages/core/demo/
├── src/
│   └── renderFlowDemo.ts     # Core包高级API Demo
├── html/
│   └── renderFlow.html       # HTML页面
└── README.md                 # 本文档
```

## 运行Demo

1. 启动开发服务器:
```bash
cd packages/core
npm run dev
```

2. 访问Demo页面:
```
http://localhost:3002/demo/html/renderFlow.html
```

## 技术栈

- **Core包**: Engine、Scene、GameObject、MeshRenderer、Material等高级API
- **Math包**: Vector3、Quaternion、Matrix4等数学类型
- **RHI包**: 底层渲染抽象（Core包内部使用）
- **TypeScript**: 类型安全的开发语言

---

这个Demo完美展示了Maxellabs 3D Engine Core包如何为开发者提供友好的高级API，隐藏底层复杂性，让3D应用开发变得简单直观。开发者可以专注于业务逻辑，而不需要关心WebGL的底层细节。 
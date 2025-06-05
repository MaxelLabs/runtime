# 🚀 Maxellabs Core包 Demo

这个Demo集合展示了Maxellabs 3D Engine Core包的完整渲染流程和架构设计。

## 📖 Demo概述

### 🎯 Core包渲染流程概念演示

#### 🔄 渲染流程概念Demo (`renderFlowDemo.ts`)

这是一个专门展示Core包架构和渲染流程概念的演示，重点关注：

**核心特性：**
- ✨ **Engine生命周期管理** - 完整的引擎初始化、运行、暂停和销毁流程
- 🎬 **Scene场景管理** - GameObject创建、组件添加和层次结构管理
- 📦 **Component组件架构** - ECS(Entity-Component-System)模式演示
- 📷 **Camera视图控制** - 透视投影、视图变换和相机动画
- 🎨 **Material材质系统** - 材质属性管理和着色器集成
- ⚡ **实时性能监控** - FPS、内存使用和系统状态监控

**渲染流程：**
```
1. 🔧 Engine.initialize()
   └── 初始化所有核心系统

2. 🎬 Scene.create()
   ├── GameObject创建
   ├── Component添加
   └── Transform层次结构

3. 📷 Camera.setup()
   ├── 投影矩阵计算
   ├── 视图矩阵计算
   └── 视锥裁剪设置

4. 🎨 Material.prepare()
   ├── 着色器编译
   ├── 材质属性设置
   └── 渲染状态配置

5. 🔄 Engine.mainLoop()
   ├── Time.update()
   ├── Scene.update()
   ├── Renderer.render()
   └── Performance.monitor()

6. 🎯 Renderer.process()
   ├── 场景遍历
   ├── 渲染队列构建
   ├── 渲染通道执行
   └── 后处理管线
```

## 🎮 控制说明

### 渲染流程概念Demo
- **空格键**: 暂停/继续引擎运行
- **R键**: 重启Demo
- **D键**: 切换调试模式
- **ESC键**: 退出Demo

## 🏗️ 架构演示

### Engine核心架构
```typescript
Engine {
  ├── IOC容器管理
  ├── 系统生命周期
  ├── 主循环控制
  ├── 事件分发机制
  └── 性能监控
}
```

### Scene场景管理
```typescript
Scene {
  ├── GameObject层次结构
  ├── Component组件系统
  ├── Transform变换管理
  └── 场景更新循环
}
```

### Component组件架构
```typescript
Component {
  ├── MeshRenderer - 网格渲染
  ├── Transform - 变换组件
  ├── Light - 光源组件
  ├── Camera - 相机组件
  └── Material - 材质组件
}
```

## 🎨 渲染特性

### 材质系统
- **PBR材质属性**: 基础颜色、金属度、粗糙度
- **渲染状态管理**: 混合、深度、剔除
- **事件驱动更新**: 材质属性变化通知

### 相机系统
- **透视投影**: FOV、长宽比、近远平面
- **视图变换**: 位置、方向、LookAt
- **轨道动画**: 自动相机路径

### 性能监控
- **实时FPS统计**: 帧率和帧时间
- **内存使用监控**: CPU和GPU内存
- **系统状态追踪**: 引擎状态和组件数量

## 🔧 技术实现

### 依赖关系
```
@maxellabs/core
├── @maxellabs/math (数学库)
├── @maxellabs/rhi (渲染接口)
└── Web平台API
```

### 核心模块
- **Engine**: 引擎核心控制器
- **Scene**: 场景和对象管理
- **GameObject**: 游戏对象容器
- **Component**: 组件基类系统
- **Material**: 材质和着色器
- **Camera**: 相机和投影

## 📚 学习路径

### 1. 基础概念 (🔄 渲染流程概念Demo)
学习Core包的整体架构和基本概念

### 2. 基础渲染 (⚡ 基础渲染Demo)
了解基本的几何体渲染和变换

### 3. 高级功能
探索光照、阴影、后处理等高级渲染技术

## 🛠️ 开发指南

### 启动Demo
```bash
# 构建项目
npm run build

# 启动开发服务器
npm run dev

# 访问Demo
open http://localhost:3000/packages/core/demo/
```

### Demo文件结构
```
packages/core/demo/
├── src/
│   ├── renderFlowDemo.ts     # 渲染流程概念Demo
│   ├── basic.ts              # 基础渲染Demo
│   ├── triangle.ts           # 三角形渲染Demo
│   └── utils/                # 工具函数
├── html/
│   ├── renderFlow.html       # 渲染流程概念页面
│   ├── basic.html            # 基础渲染页面
│   └── triangle.html         # 三角形渲染页面
└── index.html                # Demo首页
```

## 🎯 Demo目标

### 教育目的
1. **架构理解**: 展示现代3D引擎的组件化架构
2. **渲染流程**: 演示从场景到像素的完整渲染管线
3. **性能优化**: 展示实时渲染的性能监控和优化方法
4. **最佳实践**: 演示正确的引擎使用模式

### 技术验证
1. **系统集成**: 验证Core包各模块的正确集成
2. **性能基准**: 测试渲染性能和内存使用
3. **稳定性**: 验证长时间运行的稳定性
4. **兼容性**: 测试不同浏览器和设备的兼容性

## 📊 性能指标

### 目标性能
- **FPS**: 60fps @ 1080p
- **内存使用**: < 100MB
- **启动时间**: < 2秒
- **响应延迟**: < 16ms

### 监控指标
- 帧率和帧时间
- CPU和GPU内存使用
- 绘制调用数量
- 三角形和顶点数量

## 🔮 未来扩展

### 计划功能
- [ ] **纹理系统演示**: Texture2D、TextureCube
- [ ] **着色器系统演示**: 自定义着色器编译
- [ ] **动画系统演示**: 关键帧和骨骼动画
- [ ] **物理系统演示**: 碰撞检测和刚体
- [ ] **VR/AR支持**: WebXR集成演示

### 技术改进
- [ ] 更高级的渲染技术
- [ ] 更丰富的交互功能
- [ ] 更详细的性能分析
- [ ] 更完善的错误处理

---

🎮 **立即体验**: [启动渲染流程概念Demo](html/renderFlow.html)

💡 **了解更多**: 查看[DEVELOPMENT_PLAN.md](../../../DEVELOPMENT_PLAN.md)了解完整的开发规划

## 🚀 新增功能: Core包WebGL渲染演示

我们成功创建了完整的WebGL渲染流程Demo（`renderFlowDemo.ts`），使用您封装的`@maxellabs/rhi`库进行真正的WebGL渲染！这个Demo实现了DEVELOPMENT_PLAN.md中阶段五的核心目标：

### ✨ 核心成果

1. **真正的WebGL渲染**: 使用`@maxellabs/rhi` WebGLDevice进行真实的GPU渲染
2. **完整的渲染流程串联**: 从Engine初始化到WebGL渲染命令提交的完整流程
3. **Core包架构展示**: Engine→Scene→GameObject→Component→Material→RHI的完整架构
4. **实时状态监控**: 动态显示引擎状态、WebGL渲染统计和性能指标
5. **交互式学习工具**: 支持暂停/继续、重启、调试模式等交互功能

### 🎯 技术亮点

- **真实WebGL渲染**: 使用您的`@maxellabs/rhi`库进行硬件加速渲染
- **完整的着色器系统**: 展示顶点着色器和片段着色器的完整变换流程
- **矩阵变换系统**: 实现模型矩阵、视图矩阵和投影矩阵的完整计算
- **WebGL资源管理**: 展示顶点缓冲区、Uniform缓冲区、渲染管线的创建和使用
- **实时渲染统计**: 精确的DrawCall、三角形、顶点数量统计

### 🔄 WebGL渲染流程演示

Demo按照标准的现代游戏引擎渲染流程，使用真正的WebGL进行渲染：

1. **Engine.initialize()** → 系统初始化（IOC容器、时间管理器、场景管理器等）
2. **WebGLDevice.create()** → 创建WebGL设备和上下文
3. **Shader.compile()** → 编译顶点着色器和片段着色器
4. **Buffer.upload()** → 上传顶点数据到GPU缓冲区
5. **Pipeline.create()** → 创建渲染管线和绑定组
6. **Transform.compute()** → 计算模型、视图、投影矩阵
7. **WebGL.render()** → 执行真实的WebGL渲染命令

### 🌐 WebGL技术实现

- **着色器系统**: 使用GLSL ES 3.00编写的顶点和片段着色器
- **缓冲区管理**: 顶点缓冲区（VBO）和Uniform缓冲区（UBO）
- **渲染管线**: 完整的WebGL渲染管线状态管理
- **矩阵运算**: 手工实现的4x4变换矩阵计算
- **实时动画**: GPU驱动的旋转和缩放动画效果

这个Demo不仅是功能演示，更是完整的学习工具和技术验证平台，成功完成了core包demo的开发，使用`@maxellabs/rhi`实现了整个渲染流程的串联！
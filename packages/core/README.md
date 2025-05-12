# MAX引擎核心层设计文档

## 一、核心架构分析

从当前目录结构分析，MAX引擎采用了基于实体组件系统(ECS)的架构，结合了现代渲染硬件接口(RHI)抽象层设计。以下是对现有架构的优化重构方案。数学库为@maxellabs/math，在Core包中只能使用interface/rhi中的相关接口。webgl/webgpu实现不在Core包，在Engine包。

## 二、建议的目录结构

```
/core/src/
├── Engine.ts                      # 引擎主类
├── index.ts                       # 模块导出
├── constants.ts                   # 全局常量
│
├── base/                          # 基础系统
│   ├── index.ts                   # 导出所有基础类
│   ├── Component.ts               # 组件基类
│   ├── Entity.ts                  # 实体类
│   ├── EventDispatcher.ts         # 事件分发系统
│   ├── IOC.ts                     # 依赖注入容器
│   ├── MaxObject.ts               # 基础对象类
│   ├── ObjectPool.ts              # 对象池
│   ├── ReferResource.ts           # 引用计数资源
│   ├── Time.ts                    # 时间管理
│   └── Transform.ts               # 变换组件
│
├── camera/                        # 相机系统
│   ├── index.ts
│   ├── Camera.ts                  # 相机基类
│   ├── PerspectiveCamera.ts       # 透视相机 (缺失)
│   └── OrthographicCamera.ts      # 正交相机 (缺失)
│
├── interface/                     # 接口定义
│   ├── index.ts
│   └── rhi/                       # 渲染硬件接口
│
├── geometry/                      # 几何体系统
│   ├── index.ts
│   ├── Geometry.ts                # 几何体类
│   └── GeometryUtils.ts           # 几何体工具 (缺失)
│
├── input/                         # 输入系统
│   ├── index.ts
│   └── InputManager.ts            # 输入管理器
│
├── light/                         # 光照系统
│   ├── index.ts
│   ├── Light.ts                   # 光照基类
│   ├── DirectionalLight.ts        # 方向光 (缺失)
│   ├── PointLight.ts              # 点光源 (缺失)
│   └── SpotLight.ts               # 聚光灯 (缺失)
│
├── material/                      # 材质系统
│   ├── index.ts
│   ├── constants.ts               # 材质常量
│   └── Material.ts                # 材质类
│
├── renderer/                      # 渲染系统
│   ├── index.ts
│   ├── RenderContext.ts           # 渲染上下文
│   ├── RenderElement.ts           # 渲染元素
│   ├── SubRenderElement.ts        # 子渲染元素
│   ├── RenderQueue.ts             # 渲染队列
│   ├── BatcherManager.ts          # 批处理管理器
│   ├── CullingResults.ts          # 视锥剔除结果
│   └──Mesh.ts                     # 网格组件
│
├── resource/                      # 资源管理
│   ├── index.ts
│   ├── ResourceManager.ts         # 资源管理器
│   └── EnhancedResourceManager.ts # 增强资源管理器
│
├── scene/                         # 场景系统
│   ├── index.ts
│   ├── Scene.ts                   # 场景类
│   └── SceneManager.ts            # 场景管理器
│
├── shader/                        # 着色器系统
│   ├── index.ts
│   ├── Shader.ts                  # 着色器类
│   └── ShaderData.ts              # 着色器数据
│
├── texture/                       # 纹理系统
│   ├── index.ts
│   └── Texture2D.ts               # 2D纹理
│
├── animation/                     # 动画系统 (缺失)
│   ├── index.ts
│   ├── Animation.ts               # 动画基类
│   └── AnimationClip.ts           # 动画片段
│
├── physics/                       # 物理系统 (缺失)
│   ├── index.ts
│   └── PhysicsWorld.ts            # 物理世界
│
└── debug/                         # 调试工具 (缺失)
    ├── index.ts
    ├── Logger.ts                  # 日志系统
    └── Stats.ts                   # 性能统计
```

## 三、关键模块职责说明

### 1. 核心模块

#### Engine.ts
- **职责**：引擎的核心类，管理引擎生命周期、主循环、场景和渲染
- **功能**：
  - 初始化和管理渲染环境
  - 维护主渲染循环
  - 处理引擎状态(初始化、运行、暂停、销毁)
  - 协调各个子系统的更新和渲染
  - 提供全局服务访问点

### 2. 基础系统

#### IOC.ts
- **职责**：依赖注入容器，解决组件间循环依赖问题
- **功能**：
  - 注册和获取服务
  - 提供服务标识符常量
  - 支持服务生命周期管理

#### Entity.ts
- **职责**：实体类，表示场景中的一个对象
- **功能**：
  - 组件管理(添加、获取、移除)
  - 子实体管理
  - 场景关联
  - 激活状态控制

#### Component.ts
- **职责**：组件基类，所有功能组件的基础
- **功能**：
  - 定义组件生命周期(Awake、Enable、Disable、Destroy)
  - 提供与实体的关联
  - 处理启用/禁用逻辑

### 3. 渲染系统 

#### interface/rhi/
- **职责**：抽象渲染硬件接口，实现跨平台图形API
- **功能**：
  - 定义缓冲区、纹理、着色器等资源接口
  - 抽象渲染管线和状态控制
  - 枚举定义各种渲染状态和标志

#### renderer/Mesh.ts
- **职责**：网格组件，包含几何体和材质信息
- **功能**：
  - 管理几何体和材质
  - 处理网格的可见性、阴影特性
  - 准备渲染数据

#### renderer/RenderQueue.ts
- **职责**：管理渲染元素的排序和处理
- **功能**：
  - 根据材质特性对渲染元素进行排序
  - 支持透明度排序
  - 优化渲染顺序减少状态切换

#### BatcherManager.ts  
- **职责**：批处理管理，合并相似的渲染元素
- **功能**：
  - 检测可合并的渲染元素
  - 准备批处理数据
  - 优化绘制调用次数

### 4. 资源管理

#### ResourceManager.ts
- **职责**：管理引擎中的各种资源
- **功能**：
  - 资源加载、缓存和卸载
  - 资源引用计数
  - 处理不同类型资源的生命周期

### 5. 场景系统

#### scene/Scene.ts
- **职责**：场景类，管理场景中的所有实体
- **功能**：
  - 实体管理(添加、查找、移除)
  - 场景生命周期(加载、更新、卸载)
  - 维护场景图

#### SceneManager.ts
- **职责**：管理多个场景，处理场景切换
- **功能**：
  - 场景创建和管理
  - 活动场景设置与切换
  - 场景加载流程控制

## 四、缺失模块分析

### 3. 物理系统
缺少物理引擎接口，用于处理碰撞检测和物理模拟。

### 4. 动画系统
需要添加动画系统，支持骨骼动画、关键帧动画等。

### 5. 扩展光照类型
现有Light.ts基类需要扩展为具体的光照类型实现。

### 6. 调试工具
缺少性能监控、日志记录等调试工具。

## 五、设计建议

1. **统一命名规范**：保持一致的文件命名约定(例如使用大驼峰)
3. **扩展组件库**：添加更多内置组件以满足常见需求
4. **优化资源加载**：引入异步加载和资源依赖管理
5. **添加单元测试**：为核心模块添加测试用例

## 六、实现优先级

3. 扩展光照和相机系统
4. 动画系统
5. 物理系统
6. 调试和性能工具

通过以上结构优化和模块补充，MAX引擎核心层将更加完整、可扩展，既保持良好的跨平台兼容性，又能支持现代图形API的高级特性。
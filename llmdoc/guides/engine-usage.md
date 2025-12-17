---
title: Engine Usage
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: general
tags: ['guide', 'llm-native', 'general', 'developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: developers
complexity: intermediate
estimated_time: f"44 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**general**类型的开发指南，面向**developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 如何使用 3D 引擎

## 引擎基本使用流程

1. **创建引擎实例**
   ```typescript
   import { Engine } from "@maxellabs/engine";

   const engine = new Engine({
     canvas: document.getElementById("canvas"),
     // 其他配置...
   });
   ```

2. **创建场景**
   ```typescript
   const scene = engine.sceneManager.createScene("MyScene");
   ```

3. **创建实体和组件**
   ```typescript
   const entity = scene.createEntity("GameObject");

   // 添加变换组件
   const transform = entity.addComponent(Transform);
   transform.position.set(0, 0, 0);

   // 添加相机组件
   const camera = entity.addComponent(Camera);
   camera.fov = 45;
   camera.near = 0.1;
   camera.far = 1000;

   // 添加渲染组件
   const renderer = entity.addComponent(MeshRenderer);
   renderer.mesh = sphereMesh;
   renderer.material = material;
   ```

4. **运行引擎**
   ```typescript
   engine.run();
   ```

## 场景管理

### 创建和切换场景
```typescript
// 创建新场景
const scene1 = engine.sceneManager.createScene("Scene1");
const scene2 = engine.sceneManager.createScene("Scene2");

// 切换场景
engine.sceneManager.switchActiveScene(scene2);
```

### 管理场景实体
```typescript
// 创建实体
const entity = scene.createEntity("Player");

// 查找实体
const player = scene.findEntity("Player");
const allEntities = scene.entities;

// 删除实体
entity.destroy();
```

## 组件系统

### 使用内置组件
```typescript
// 变换组件
const transform = entity.addComponent(Transform);
transform.position = new Vector3(0, 1, 0);
transform.rotation = Quaternion.identity;
transform.scale = new Vector3(1, 1, 1);

// 相机组件
const camera = entity.addComponent(Camera);
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;

// 光照组件
const light = entity.addComponent(DirectLight);
light.color = new Color(1, 1, 1, 1);
light.intensity = 1.0;
```

### 自定义组件
```typescript
class MyComponent extends Component {
  onAwake() {
    // 组件初始化
  }

  onUpdate(deltaTime: number) {
    // 每帧更新
  }

  onDestroy() {
    // 组件销毁
  }
}

// 使用自定义组件
const myComp = entity.addComponent(MyComponent);
```

## 资源管理

### 加载资源
```typescript
// 加载模型
const modelPromise = engine.resourceManager.load("path/to/model.gltf");

// 加载纹理
const texturePromise = engine.resourceManager.load("path/to/texture.png");

// 加载着色器
const shaderPromise = engine.resourceManager.load("path/to/shader.shader");
```

### 使用资源
```typescript
modelPromise.then((model) => {
  const renderer = entity.addComponent(MeshRenderer);
  renderer.mesh = model.meshes[0];
  renderer.material = model.materials[0];
});

texturePromise.then((texture) => {
  const material = new Material(engine);
  material.baseTexture = texture;
});
```

## 渲染管线

### 自定义渲染管线
```typescript
class CustomRenderPipeline extends BasicRenderPipeline {
  constructor(scene: Scene) {
    super(scene);
    // 自定义初始化
  }

  render(camera: Camera) {
    // 自定义渲染逻辑
    super.render(camera);
  }
}

// 使用自定义管线
scene.renderPipeline = new CustomRenderPipeline(scene);
```

### 后处理效果
```typescript
// 添加后处理效果
const postProcessManager = scene.postProcessManager;

const bloomPass = postProcessManager.addPass(BloomPass);
bloomPass.intensity = 0.5;

const colorCorrectionPass = postProcessManager.addPass(ColorCorrectionPass);
colorCorrectionPass.brightness = 1.2;
```

## 动画系统

### 播放动画
```typescript
// 添加动画组件
const animator = entity.addComponent(Animator);

// 加载动画剪辑
const animClip = await engine.resourceManager.load("animation.anim");

// 添加动画状态
const animState = animator.addState(animClip);
animState.play();
```

### 控制动画
```typescript
// 设置动画参数
animState.speed = 1.5;
animState.loop = true;

// 跨淡入淡出
animator.crossFade(animState1, animState2, 0.3);
```

## 性能优化

### 使用对象池
```typescript
// 获取对象池对象
const pool = engine.getPool(MyClass);
const obj = pool.get();

// 回收对象
pool.reclaim(obj);
```

### 优化渲染
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;
```

## 错误处理和调试

### 日志系统
```typescript
// 启用调试日志
Logger.debugEnabled = true;

// 输出日志
Logger.debug("Debug message");
Logger.warn("Warning message");
Logger.error("Error message");
```

### 性能监控
```typescript
// 获取帧率
const fps = engine.fps;

// 获取渲染统计
const stats = engine.renderStats;
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`Triangles: ${stats.triangles}`);
```

## 代码参考：
- 引擎创建: `packages/core/src/code.zip:Engine`
- 场景管理: `packages/core/src/code.zip:Scene`
- 实体组件: `packages/core/src/code.zip:Entity`
- 资源管理: `packages/core/src/code.zip:ResourceManager`
- 渲染管线: `packages/core/src/code.zip:BasicRenderPipeline`
## 🔌 Interface First

### 核心接口定义
#### MyComponent
```typescript
// 接口定义和用法
```

#### CustomRenderPipeline
```typescript
// 接口定义和用法
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 如何使用 3D 引擎

## 引擎基本使用流程

1. **创建引擎实例**
   ```typescript
   import { Engine } from "@maxellabs/engine";

   const engine = new Engine({
     canvas: document.getElementById("canvas"),
     // 其他配置...
   });
   ```

2. **创建场景**
   ```typescript
   const scene = engine.sceneManager.createScene("MyScene");
   ```

3. **创建实体和组件**
   ```typescript
   const entity = scene.createEntity("GameObject");

   // 添加变换组件
   const transform = entity.addComponent(Transform);
   transform.position.set(0, 0, 0);

   // 添加相机组件
   const camera = entity.addComponent(Camera);
   camera.fov = 45;
   camera.near = 0.1;
   camera.far = 1000;

   // 添加渲染组件
   const renderer = entity.addComponent(MeshRenderer);
   renderer.mesh = sphereMesh;
   renderer.material = material;
   ```

4. **运行引擎**
   ```typescript
   engine.run();
   ```

## 场景管理

### 创建和切换场景
```typescript
// 创建新场景
const scene1 = engine.sceneManager.createScene("Scene1");
const scene2 = engine.sceneManager.createScene("Scene2");

// 切换场景
engine.sceneManager.switchActiveScene(scene2);
```

### 管理场景实体
```typescript
// 创建实体
const entity = scene.createEntity("Player");

// 查找实体
const player = scene.findEntity("Player");
const allEntities = scene.entities;

// 删除实体
entity.destroy();
```

## 组件系统

### 使用内置组件
```typescript
// 变换组件
const transform = entity.addComponent(Transform);
transform.position = new Vector3(0, 1, 0);
transform.rotation = Quaternion.identity;
transform.scale = new Vector3(1, 1, 1);

// 相机组件
const camera = entity.addComponent(Camera);
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;

// 光照组件
const light = entity.addComponent(DirectLight);
light.color = new Color(1, 1, 1, 1);
light.intensity = 1.0;
```

### 自定义组件
```typescript
class MyComponent extends Component {
  onAwake() {
    // 组件初始化
  }

  onUpdate(deltaTime: number) {
    // 每帧更新
  }

  onDestroy() {
    // 组件销毁
  }
}

// 使用自定义组件
const myComp = entity.addComponent(MyComponent);
```

## 资源管理

### 加载资源
```typescript
// 加载模型
const modelPromise = engine.resourceManager.load("path/to/model.gltf");

// 加载纹理
const texturePromise = engine.resourceManager.load("path/to/texture.png");

// 加载着色器
const shaderPromise = engine.resourceManager.load("path/to/shader.shader");
```

### 使用资源
```typescript
modelPromise.then((model) => {
  const renderer = entity.addComponent(MeshRenderer);
  renderer.mesh = model.meshes[0];
  renderer.material = model.materials[0];
});

texturePromise.then((texture) => {
  const material = new Material(engine);
  material.baseTexture = texture;
});
```

## 渲染管线

### 自定义渲染管线
```typescript
class CustomRenderPipeline extends BasicRenderPipeline {
  constructor(scene: Scene) {
    super(scene);
    // 自定义初始化
  }

  render(camera: Camera) {
    // 自定义渲染逻辑
    super.render(camera);
  }
}

// 使用自定义管线
scene.renderPipeline = new CustomRenderPipeline(scene);
```

### 后处理效果
```typescript
// 添加后处理效果
const postProcessManager = scene.postProcessManager;

const bloomPass = postProcessManager.addPass(BloomPass);
bloomPass.intensity = 0.5;

const colorCorrectionPass = postProcessManager.addPass(ColorCorrectionPass);
colorCorrectionPass.brightness = 1.2;
```

## 动画系统

### 播放动画
```typescript
// 添加动画组件
const animator = entity.addComponent(Animator);

// 加载动画剪辑
const animClip = await engine.resourceManager.load("animation.anim");

// 添加动画状态
const animState = animator.addState(animClip);
animState.play();
```

### 控制动画
```typescript
// 设置动画参数
animState.speed = 1.5;
animState.loop = true;

// 跨淡入淡出
animator.crossFade(animState1, animState2, 0.3);
```

## 性能优化

### 使用对象池
```typescript
// 获取对象池对象
const pool = engine.getPool(MyClass);
const obj = pool.get();

// 回收对象
pool.reclaim(obj);
```

### 优化渲染
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;
```

## 错误处理和调试

### 日志系统
```typescript
// 启用调试日志
Logger.debugEnabled = true;

// 输出日志
Logger.debug("Debug message");
Logger.warn("Warning message");
Logger.error("Error message");
```

### 性能监控
```typescript
// 获取帧率
const fps = engine.fps;

// 获取渲染统计
const stats = engine.renderStats;
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`Triangles: ${stats.triangles}`);
```

## 代码参考：
- 引擎创建: `packages/core/src/code.zip:Engine`
- 场景管理: `packages/core/src/code.zip:Scene`
- 实体组件: `packages/core/src/code.zip:Entity`
- 资源管理: `packages/core/src/code.zip:ResourceManager`
- 渲染管线: `packages/core/src/code.zip:BasicRenderPipeline`
## ⚠️ 禁止事项

### 关键约束
- 🚫 **忽略错误处理**: 确保所有异常情况都有对应的处理逻辑
- 🚫 **缺少验证**: 验证输入参数和返回值的有效性
- 🚫 **不遵循约定**: 保持与项目整体架构和约定的一致性

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 如何使用 3D 引擎

## 引擎基本使用流程

1. **创建引擎实例**
   ```typescript
   import { Engine } from "@maxellabs/engine";

   const engine = new Engine({
     canvas: document.getElementById("canvas"),
     // 其他配置...
   });
   ```

2. **创建场景**
   ```typescript
   const scene = engine.sceneManager.createScene("MyScene");
   ```

3. **创建实体和组件**
   ```typescript
   const entity = scene.createEntity("GameObject");

   // 添加变换组件
   const transform = entity.addComponent(Transform);
   transform.position.set(0, 0, 0);

   // 添加相机组件
   const camera = entity.addComponent(Camera);
   camera.fov = 45;
   camera.near = 0.1;
   camera.far = 1000;

   // 添加渲染组件
   const renderer = entity.addComponent(MeshRenderer);
   renderer.mesh = sphereMesh;
   renderer.material = material;
   ```

4. **运行引擎**
   ```typescript
   engine.run();
   ```

## 场景管理

### 创建和切换场景
```typescript
// 创建新场景
const scene1 = engine.sceneManager.createScene("Scene1");
const scene2 = engine.sceneManager.createScene("Scene2");

// 切换场景
engine.sceneManager.switchActiveScene(scene2);
```

### 管理场景实体
```typescript
// 创建实体
const entity = scene.createEntity("Player");

// 查找实体
const player = scene.findEntity("Player");
const allEntities = scene.entities;

// 删除实体
entity.destroy();
```

## 组件系统

### 使用内置组件
```typescript
// 变换组件
const transform = entity.addComponent(Transform);
transform.position = new Vector3(0, 1, 0);
transform.rotation = Quaternion.identity;
transform.scale = new Vector3(1, 1, 1);

// 相机组件
const camera = entity.addComponent(Camera);
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;

// 光照组件
const light = entity.addComponent(DirectLight);
light.color = new Color(1, 1, 1, 1);
light.intensity = 1.0;
```

### 自定义组件
```typescript
class MyComponent extends Component {
  onAwake() {
    // 组件初始化
  }

  onUpdate(deltaTime: number) {
    // 每帧更新
  }

  onDestroy() {
    // 组件销毁
  }
}

// 使用自定义组件
const myComp = entity.addComponent(MyComponent);
```

## 资源管理

### 加载资源
```typescript
// 加载模型
const modelPromise = engine.resourceManager.load("path/to/model.gltf");

// 加载纹理
const texturePromise = engine.resourceManager.load("path/to/texture.png");

// 加载着色器
const shaderPromise = engine.resourceManager.load("path/to/shader.shader");
```

### 使用资源
```typescript
modelPromise.then((model) => {
  const renderer = entity.addComponent(MeshRenderer);
  renderer.mesh = model.meshes[0];
  renderer.material = model.materials[0];
});

texturePromise.then((texture) => {
  const material = new Material(engine);
  material.baseTexture = texture;
});
```

## 渲染管线

### 自定义渲染管线
```typescript
class CustomRenderPipeline extends BasicRenderPipeline {
  constructor(scene: Scene) {
    super(scene);
    // 自定义初始化
  }

  render(camera: Camera) {
    // 自定义渲染逻辑
    super.render(camera);
  }
}

// 使用自定义管线
scene.renderPipeline = new CustomRenderPipeline(scene);
```

### 后处理效果
```typescript
// 添加后处理效果
const postProcessManager = scene.postProcessManager;

const bloomPass = postProcessManager.addPass(BloomPass);
bloomPass.intensity = 0.5;

const colorCorrectionPass = postProcessManager.addPass(ColorCorrectionPass);
colorCorrectionPass.brightness = 1.2;
```

## 动画系统

### 播放动画
```typescript
// 添加动画组件
const animator = entity.addComponent(Animator);

// 加载动画剪辑
const animClip = await engine.resourceManager.load("animation.anim");

// 添加动画状态
const animState = animator.addState(animClip);
animState.play();
```

### 控制动画
```typescript
// 设置动画参数
animState.speed = 1.5;
animState.loop = true;

// 跨淡入淡出
animator.crossFade(animState1, animState2, 0.3);
```

## 性能优化

### 使用对象池
```typescript
// 获取对象池对象
const pool = engine.getPool(MyClass);
const obj = pool.get();

// 回收对象
pool.reclaim(obj);
```

### 优化渲染
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;
```

## 错误处理和调试

### 日志系统
```typescript
// 启用调试日志
Logger.debugEnabled = true;

// 输出日志
Logger.debug("Debug message");
Logger.warn("Warning message");
Logger.error("Error message");
```

### 性能监控
```typescript
// 获取帧率
const fps = engine.fps;

// 获取渲染统计
const stats = engine.renderStats;
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`Triangles: ${stats.triangles}`);
```

## 代码参考：
- 引擎创建: `packages/core/src/code.zip:Engine`
- 场景管理: `packages/core/src/code.zip:Scene`
- 实体组件: `packages/core/src/code.zip:Entity`
- 资源管理: `packages/core/src/code.zip:ResourceManager`
- 渲染管线: `packages/core/src/code.zip:BasicRenderPipeline`
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: API调用返回错误
**解决方案**: 实现错误处理和重试机制
```typescript
try {
  const result = await apiCall(params);
  return result;
} catch (error) {
  if (retryCount < 3) {
    await delay(1000);
    return apiCall(params, retryCount + 1);
  }
  throw error;
}
```

**问题**: 配置文件格式错误
**解决方案**: 添加配置验证和默认值
```typescript
const config = validateAndNormalize(userConfig, defaultConfig);
if (!config.isValid()) {
  throw new ConfigError('配置验证失败');
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 如何使用 3D 引擎

## 引擎基本使用流程

1. **创建引擎实例**
   ```typescript
   import { Engine } from "@maxellabs/engine";

   const engine = new Engine({
     canvas: document.getElementById("canvas"),
     // 其他配置...
   });
   ```

2. **创建场景**
   ```typescript
   const scene = engine.sceneManager.createScene("MyScene");
   ```

3. **创建实体和组件**
   ```typescript
   const entity = scene.createEntity("GameObject");

   // 添加变换组件
   const transform = entity.addComponent(Transform);
   transform.position.set(0, 0, 0);

   // 添加相机组件
   const camera = entity.addComponent(Camera);
   camera.fov = 45;
   camera.near = 0.1;
   camera.far = 1000;

   // 添加渲染组件
   const renderer = entity.addComponent(MeshRenderer);
   renderer.mesh = sphereMesh;
   renderer.material = material;
   ```

4. **运行引擎**
   ```typescript
   engine.run();
   ```

## 场景管理

### 创建和切换场景
```typescript
// 创建新场景
const scene1 = engine.sceneManager.createScene("Scene1");
const scene2 = engine.sceneManager.createScene("Scene2");

// 切换场景
engine.sceneManager.switchActiveScene(scene2);
```

### 管理场景实体
```typescript
// 创建实体
const entity = scene.createEntity("Player");

// 查找实体
const player = scene.findEntity("Player");
const allEntities = scene.entities;

// 删除实体
entity.destroy();
```

## 组件系统

### 使用内置组件
```typescript
// 变换组件
const transform = entity.addComponent(Transform);
transform.position = new Vector3(0, 1, 0);
transform.rotation = Quaternion.identity;
transform.scale = new Vector3(1, 1, 1);

// 相机组件
const camera = entity.addComponent(Camera);
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;

// 光照组件
const light = entity.addComponent(DirectLight);
light.color = new Color(1, 1, 1, 1);
light.intensity = 1.0;
```

### 自定义组件
```typescript
class MyComponent extends Component {
  onAwake() {
    // 组件初始化
  }

  onUpdate(deltaTime: number) {
    // 每帧更新
  }

  onDestroy() {
    // 组件销毁
  }
}

// 使用自定义组件
const myComp = entity.addComponent(MyComponent);
```

## 资源管理

### 加载资源
```typescript
// 加载模型
const modelPromise = engine.resourceManager.load("path/to/model.gltf");

// 加载纹理
const texturePromise = engine.resourceManager.load("path/to/texture.png");

// 加载着色器
const shaderPromise = engine.resourceManager.load("path/to/shader.shader");
```

### 使用资源
```typescript
modelPromise.then((model) => {
  const renderer = entity.addComponent(MeshRenderer);
  renderer.mesh = model.meshes[0];
  renderer.material = model.materials[0];
});

texturePromise.then((texture) => {
  const material = new Material(engine);
  material.baseTexture = texture;
});
```

## 渲染管线

### 自定义渲染管线
```typescript
class CustomRenderPipeline extends BasicRenderPipeline {
  constructor(scene: Scene) {
    super(scene);
    // 自定义初始化
  }

  render(camera: Camera) {
    // 自定义渲染逻辑
    super.render(camera);
  }
}

// 使用自定义管线
scene.renderPipeline = new CustomRenderPipeline(scene);
```

### 后处理效果
```typescript
// 添加后处理效果
const postProcessManager = scene.postProcessManager;

const bloomPass = postProcessManager.addPass(BloomPass);
bloomPass.intensity = 0.5;

const colorCorrectionPass = postProcessManager.addPass(ColorCorrectionPass);
colorCorrectionPass.brightness = 1.2;
```

## 动画系统

### 播放动画
```typescript
// 添加动画组件
const animator = entity.addComponent(Animator);

// 加载动画剪辑
const animClip = await engine.resourceManager.load("animation.anim");

// 添加动画状态
const animState = animator.addState(animClip);
animState.play();
```

### 控制动画
```typescript
// 设置动画参数
animState.speed = 1.5;
animState.loop = true;

// 跨淡入淡出
animator.crossFade(animState1, animState2, 0.3);
```

## 性能优化

### 使用对象池
```typescript
// 获取对象池对象
const pool = engine.getPool(MyClass);
const obj = pool.get();

// 回收对象
pool.reclaim(obj);
```

### 优化渲染
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;
```

## 错误处理和调试

### 日志系统
```typescript
// 启用调试日志
Logger.debugEnabled = true;

// 输出日志
Logger.debug("Debug message");
Logger.warn("Warning message");
Logger.error("Error message");
```

### 性能监控
```typescript
// 获取帧率
const fps = engine.fps;

// 获取渲染统计
const stats = engine.renderStats;
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`Triangles: ${stats.triangles}`);
```

## 代码参考：
- 引擎创建: `packages/core/src/code.zip:Engine`
- 场景管理: `packages/core/src/code.zip:Scene`
- 实体组件: `packages/core/src/code.zip:Entity`
- 资源管理: `packages/core/src/code.zip:ResourceManager`
- 渲染管线: `packages/core/src/code.zip:BasicRenderPipeline`
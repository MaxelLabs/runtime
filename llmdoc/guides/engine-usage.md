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
- 引擎创建: `temp/engine/packages/core/src/Engine.ts:52-149`
- 场景管理: `temp/engine/packages/core/src/SceneManager.ts`
- 实体组件: `temp/engine/packages/core/src/Entity.ts`
- 资源管理: `temp/engine/packages/core/src/asset/ResourceManager.ts`
- 渲染管线: `temp/engine/packages/core/src/RenderPipeline/BasicRenderPipeline.ts`
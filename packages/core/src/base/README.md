Collecting workspace information# Max 引擎基础模块 (base) 使用指南

## 目录

- 概述
- MaxObject
- EventDispatcher
- Entity & Component
- Transform
- ObjectPool
- ObjectPoolManager
- ReferResource
- Time
- Canvas
- IOC Container

## 概述

Max 引擎的 `base` 目录包含游戏引擎核心基础设施，提供实体组件系统、事件处理、资源管理等基础功能。这些模块共同构建了游戏开发的底层架构。

## MaxObject

### 使用场景
作为引擎中大多数对象的基类，提供唯一标识符、名称管理等基础功能。

### 注意事项
- 不要直接修改对象的 `id` 属性，它是自动生成的唯一标识符
- 销毁对象后不应继续使用

### 使用示例
```typescript
import { MaxObject } from '@maxellabs/core';

class MyGameObject extends MaxObject {
  constructor() {
    super();
    this.name = "CustomGameObject";
  }
  
  // 自定义方法
  doSomething() {
    console.log(`Object ${this.name} (ID: ${this.id}) is doing something`);
  }
}

const obj = new MyGameObject();
obj.doSomething();

// 销毁对象
obj.destroy();
```

## EventDispatcher

### 使用场景
实现对象间通信和事件处理，支持事件冒泡、捕获和优先级。适用于UI事件、游戏事件和系统消息传递。

### 注意事项
- 注意移除不再需要的事件监听器以避免内存泄漏
- 避免在事件回调中修改正在迭代的事件监听器列表
- 使用优先级可以控制事件处理顺序

### 使用示例
```typescript
import { EventDispatcher } from '@maxellabs/core';

// 自定义事件类型
const GAME_EVENTS = {
  LEVEL_COMPLETE: 'level-complete',
  PLAYER_DIED: 'player-died'
};

class GameManager extends EventDispatcher {
  completeLevel(score: number) {
    this.dispatchEvent(GAME_EVENTS.LEVEL_COMPLETE, { score });
  }
}

const gameManager = new GameManager();

// 添加事件监听器
gameManager.addEventListener(GAME_EVENTS.LEVEL_COMPLETE, (event) => {
  console.log(`Level completed with score: ${event.data.score}`);
});

// 添加一次性事件监听
gameManager.once(GAME_EVENTS.LEVEL_COMPLETE, (event) => {
  console.log('This will only fire once!');
});

// 触发事件
gameManager.completeLevel(1000);

// 移除事件监听器
gameManager.removeAllEventListeners();
```

## Entity & Component

### 使用场景
实现实体组件系统，用于构建游戏对象和逻辑。Entity 代表游戏世界中的物体，Component 提供特定功能。

### 注意事项
- 每个 Entity 默认包含一个 Transform 组件
- 组件不应直接调用其他实体的组件，应使用事件通信
- 避免在组件中存储对其他实体的直接引用，容易造成引用循环
- 销毁实体时会自动销毁其所有组件

### 使用示例
```typescript
import { Entity, Component } from '@maxellabs/core';

// 自定义组件
class HealthComponent extends Component {
  private health: number = 100;
  
  onAwake(): void {
    console.log('Health component initialized');
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
    console.log(`Health reduced to ${this.health}`);
    
    if (this.health <= 0) {
      this.entity.destroy();
    }
  }
}

// 创建实体
const player = new Entity('Player');

// 添加组件
const healthComponent = new HealthComponent(player);
player.addComponent(healthComponent);

// 获取组件并使用
const health = player.getComponent(HealthComponent);
if (health) {
  health.takeDamage(25);
}

// 移除组件
player.removeComponent(HealthComponent);

// 销毁实体
player.destroy();
```

## Transform

### 使用场景
管理实体在3D空间中的位置、旋转和缩放，支持层级结构和坐标转换。

### 注意事项
- 修改 Transform 属性会自动标记相关矩阵为脏（需要更新）
- 子对象的世界变换受父对象影响
- 避免深层嵌套的层级结构，可能导致性能问题
- 使用 `lookAt` 方法使对象朝向特定目标

### 使用示例
```typescript
import { Entity, Vector3 } from '@maxellabs/core';

// 创建父实体和子实体
const parent = new Entity('Parent');
const child = new Entity('Child');

// 设置父子关系
child.transform.setParent(parent.transform);

// 设置本地位置
parent.transform.setPosition(0, 5, 0);
child.transform.setPosition(0, 2, 0); // 相对于父实体的位置

// 子实体的世界坐标现在是 (0, 7, 0)
console.log(child.transform.worldPosition); 

// 旋转操作
parent.transform.rotateWorldY(Math.PI / 2); // 绕Y轴旋转90度

// 朝向特定点
const target = new Vector3(10, 0, 10);
child.transform.lookAt(target);

// 移动实体
child.transform.translate(new Vector3(1, 0, 0));
```

## ObjectPool

### 使用场景
管理频繁创建和销毁的对象（如子弹、粒子效果），通过对象重用减少内存分配和垃圾回收，提高性能。

### 注意事项
- 确保重置函数完全清理对象状态
- 注意正确释放不再需要的对象回池中
- 避免从池中获取对象后忘记释放
- 不要对池中对象保存外部引用

### 使用示例
```typescript
import { ObjectPool } from '@maxellabs/core';

// 定义一个简单的子弹类
class Bullet {
  x: number = 0;
  y: number = 0;
  active: boolean = false;
  
  fire(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.active = true;
  }
  
  update(deltaTime: number) {
    if (!this.active) return;
    this.y -= 10 * deltaTime; // 向上移动
  }
}

// 创建子弹对象池
const bulletPool = new ObjectPool<Bullet>(
  'bullets',
  // 工厂函数 - 创建新对象
  () => new Bullet(),
  // 重置函数 - 重置对象状态
  (bullet) => {
    bullet.x = 0;
    bullet.y = 0;
    bullet.active = false;
  },
  // 初始容量
  20,
  // 最大容量
  100
);

// 预热对象池
bulletPool.warmUp(20);

// 游戏中使用
function fireBullet(x: number, y: number) {
  const bullet = bulletPool.get();
  bullet.fire(x, y);
  return bullet;
}

// 子弹不再使用时释放回池
function releaseBullet(bullet: Bullet) {
  bulletPool.release(bullet);
}

// 游戏循环
function gameLoop(deltaTime: number) {
  // 使用对象池中的子弹
  const bullet = fireBullet(100, 100);
  
  // 在某个条件下释放子弹
  if (bullet.y < 0) {
    releaseBullet(bullet);
  }
}
```

## ObjectPoolManager

### 使用场景
统一管理多个对象池，提供全局配置、性能监控和资源管理功能。

### 注意事项
- 使用单例模式访问管理器
- 为对象池指定唯一ID
- 监控性能分析报告，调整池大小
- 应用退出时清理所有池

### 使用示例
```typescript
import { ObjectPoolManager } from '@maxellabs/core';

// 获取对象池管理器实例
const poolManager = ObjectPoolManager.getInstance();

// 初始化管理器
poolManager.initialize({
  initialCapacity: 10,
  maxSize: 500,
  logStats: true,
  memoryWarningThreshold: 5000
});

// 创建并注册多个对象池
poolManager.createPool<Bullet>(
  'game:bullets',
  () => new Bullet(),
  (bullet) => {
    bullet.active = false;
  },
  { initialCapacity: 50 }
);

poolManager.createPool<Particle>(
  'fx:particles',
  () => new Particle(),
  (particle) => particle.reset(),
  { maxSize: 1000 }
);

// 预热所有对象池
poolManager.warmUpAllPools(20);

// 从特定池获取对象
const bullet = poolManager.getPool<Bullet>('game:bullets')?.get();
if (bullet) {
  // 使用子弹...
}

// 监控对象池性能
poolManager.addEventListener('performance-analysis', (event) => {
  console.log('对象池使用统计:', event.data.summary);
});

// 启用自动分析
poolManager.enableAutoAnalysis(true, 5000); // 每5秒分析一次

// 程序退出时清理
function onApplicationQuit() {
  poolManager.destroyAllPools();
  ObjectPoolManager.destroyInstance();
}
```

## ReferResource

### 使用场景
管理需要手动释放的资源（如纹理、网格、材质等），使用引用计数控制资源生命周期。

### 注意事项
- 每次使用资源时调用 `addRef()` 增加引用计数
- 不再使用时调用 `subRef()` 减少引用计数
- 引用计数为0时资源会自动销毁
- 子类需实现 `onResourceDestroy()` 方法释放具体资源

### 使用示例
```typescript
import { ReferResource } from '@maxellabs/core';

// 自定义资源类
class Texture extends ReferResource {
  private textureData: WebGLTexture | null = null;
  
  constructor(url: string) {
    super();
    this.setUrl(url);
    // 加载纹理...
  }
  
  // 资源销毁时释放WebGL纹理
  protected onResourceDestroy(): void {
    if (this.textureData) {
      // 释放WebGL纹理
      gl.deleteTexture(this.textureData);
      this.textureData = null;
    }
  }
}

// 使用资源
function useTexture() {
  // 创建纹理
  const texture = new Texture('images/sprite.png');
  
  // 每次使用时增加引用计数
  texture.addRef();
  
  // 材质使用纹理
  const material = {
    use() {
      // 使用纹理
    },
    dispose() {
      // 不再使用纹理时减少引用
      texture.subRef();
    }
  };
  
  return material;
}

// 在组件中使用
class SpriteComponent extends Component {
  private material = useTexture();
  
  override destroy(): void {
    // 清理资源
    this.material.dispose();
    super.destroy();
  }
}
```

## Time

### 使用场景
管理游戏时间、帧率和时间流逝，提供不同类型的时间信息（实际时间、游戏时间）。

### 注意事项
- 组件更新应使用 `deltaTime` 使动画和逻辑与帧率无关
- 使用 `timeScale` 可以实现慢动作或快进效果
- `fixedDeltaTime` 用于物理更新，保持稳定步长
- 避免依赖实际帧率进行逻辑计算

### 使用示例
```typescript
import { Time } from '@maxellabs/core';

// 创建时间管理器
const time = new Time();

// 游戏类
class Game {
  private gameObjects: GameObject[] = [];
  private paused: boolean = false;
  
  constructor() {
    // 重置时间
    time.reset();
  }
  
  update() {
    // 更新时间
    time.update();
    
    // 如果游戏暂停，设置时间缩放为0
    time.timeScale = this.paused ? 0 : 1;
    
    // 使用deltaTime更新所有游戏对象
    for (const obj of this.gameObjects) {
      obj.update(time.deltaTime);
    }
    
    // 物理更新使用固定时间步长
    while (time.needFixedUpdate()) {
      this.updatePhysics(time.fixedDeltaTime);
      time.performFixedUpdate();
    }
    
    // 获取游戏运行信息
    const fps = 1.0 / time.deltaTime;
    const runningTime = time.sinceStartup;
    
    this.updateUI({ fps, runningTime });
  }
  
  updatePhysics(fixedDeltaTime: number) {
    // 物理更新逻辑
  }
  
  // 慢动作效果
  enableSlowMotion() {
    time.timeScale = 0.3;
  }
}
```

## Canvas

### 使用场景
封装HTML Canvas元素，管理画布大小调整和渲染上下文。

### 注意事项
- 在窗口大小改变时调用 `resizeByClientSize()` 保持正确尺寸
- 画布宽高和视觉尺寸可能不一致，注意区分
- 获取渲染上下文后要检查是否支持
- DPI缩放需要特殊处理以保持清晰

### 使用示例
```typescript
import { Canvas } from '@maxellabs/core';

// 初始化
function initializeRenderer() {
  // 从DOM元素创建画布
  const canvas = new Canvas('game-canvas');
  
  // 或直接传入HTML元素
  // const canvasElement = document.createElement('canvas');
  // document.body.appendChild(canvasElement);
  // const canvas = new Canvas(canvasElement);
  
  // 设置初始大小
  canvas.setWidth(800);
  canvas.setHeight(600);
  
  // 获取WebGL上下文
  const gl = canvas.element.getContext('webgl2');
  if (!gl) {
    throw new Error('WebGL2 not supported');
  }
  
  // 窗口大小改变时调整画布
  window.addEventListener('resize', () => {
    // 根据客户端大小调整画布
    const resized = canvas.resizeByClientSize();
    
    if (resized) {
      // 更新视口
      gl.viewport(0, 0, canvas.getWidth(), canvas.getHeight());
      // 通知渲染系统尺寸变化
      onCanvasResize(canvas.getWidth(), canvas.getHeight());
    }
  });
  
  return { canvas, gl };
}
```

## IOC Container

### 使用场景
依赖注入容器，解决组件间循环依赖问题，实现松耦合架构。

### 注意事项
- 使用单例模式访问容器
- 避免在构造函数中有复杂依赖逻辑
- 服务标识符保持统一命名规范
- 确保及时清理不再需要的服务引用

### 使用示例
```typescript
import { Container, ServiceKeys } from '@maxellabs/core';

// 定义服务
class RenderSystem {
  render() {
    console.log('Rendering scene...');
  }
}

class PhysicsSystem {
  update(deltaTime: number) {
    console.log(`Physics update: ${deltaTime}`);
  }
}

class GameEngine {
  private renderer: RenderSystem;
  private physics: PhysicsSystem;
  
  constructor() {
    // 从容器获取服务
    const container = Container.getInstance();
    this.renderer = container.resolve<RenderSystem>('renderer');
    this.physics = container.resolve<PhysicsSystem>('physics');
  }
  
  update(deltaTime: number) {
    this.physics.update(deltaTime);
    this.renderer.render();
  }
}

// 初始化容器
function initializeSystems() {
  const container = Container.getInstance();
  
  // 注册服务
  container.register(ServiceKeys.RENDERER, new RenderSystem());
  
  // 注册工厂函数，延迟创建
  container.registerFactory(ServiceKeys.INPUT_MANAGER, () => {
    return new InputManager();
  });
  
  // 注册物理系统
  container.register('physics', new PhysicsSystem());
  
  // 创建引擎
  const engine = new GameEngine();
  container.register(ServiceKeys.ENGINE, engine);
  
  return engine;
}

// 使用
const engine = initializeSystems();
engine.update(0.016);

// 清理
function shutdown() {
  Container.getInstance().clear();
}
```

---

本文档提供了Max引擎基础模块的使用指南。通过合理使用这些基础设施，可以构建高效、可维护的游戏应用。
import { ObjectPool, ObjectPoolManager } from '../base';
import { Vector3 } from '@maxellabs/math';

/**
 * 示例粒子类
 */
class Particle {
  position: Vector3 = new Vector3();
  velocity: Vector3 = new Vector3();
  acceleration: Vector3 = new Vector3();
  lifetime: number = 0;
  maxLifetime: number = 0;
  size: number = 1;
  color: { r: number, g: number, b: number, a: number } = { r: 1, g: 1, b: 1, a: 1 };

  /**
   * 重置粒子状态
   */
  reset (): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
    this.lifetime = 0;
    this.maxLifetime = 0;
    this.size = 1;
    this.color.r = this.color.g = this.color.b = this.color.a = 1;
  }

  /**
   * 更新粒子
   * @param deltaTime 帧时间
   * @returns 粒子是否存活
   */
  update (deltaTime: number): boolean {
    // 更新速度
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;

    // 更新位置
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // 更新生命周期
    this.lifetime += deltaTime;

    // 更新透明度
    this.color.a = Math.max(0, 1 - (this.lifetime / this.maxLifetime));

    // 返回粒子是否还存活
    return this.lifetime < this.maxLifetime;
  }
}

/**
 * 简单粒子发射器，展示对象池使用
 */
export class ParticleEmitter {
  /** 粒子池 */
  private particlePool: ObjectPool<Particle>;

  /** 活跃粒子 */
  private activeParticles: Particle[] = [];

  /** 最大粒子数 */
  private maxParticles: number;

  /** 发射速率 (粒子/秒) */
  private emitRate: number;

  /** 累计时间 */
  private accumTime: number = 0;

  /** 累计发射数量 */
  private totalEmitted: number = 0;

  /**
   * 创建粒子发射器
   * @param maxParticles 最大粒子数
   * @param emitRate 发射速率
   */
  constructor (maxParticles: number = 1000, emitRate: number = 100) {
    this.maxParticles = maxParticles;
    this.emitRate = emitRate;

    // 方式1: 直接创建对象池
    this.particlePool = new ObjectPool<Particle>(
      () => new Particle(),
      (particle: Particle) => particle.reset(),
      {
        identifier: 'ParticleEmitter',
        initialCapacity: Math.min(100, maxParticles),
        maxSize: maxParticles,
        logStats: false,
      }
    );

    // 方式2: 使用对象池管理器创建并管理对象池
    // this.particlePool = ObjectPoolManager.getInstance().createPool<Particle>(
    //   'particles',
    //   () => new Particle(),
    //   (particle: Particle) => particle.reset(),
    //   {
    //     initialCapacity: Math.min(100, maxParticles),
    //     maxSize: maxParticles,
    //     logStats: false
    //   }
    // );
  }

  /**
   * 发射新粒子
   * @param count 发射数量
   */
  emit (count: number): void {
    for (let i = 0; i < count; i++) {
      // 检查活跃粒子数量是否已达上限
      if (this.activeParticles.length >= this.maxParticles) {
        break;
      }

      // 从对象池获取粒子
      const particle = this.particlePool.get();

      // 设置粒子初始状态
      particle.position.set(0, 0, 0);

      // 随机速度
      particle.velocity.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      );

      // 重力加速度
      particle.acceleration.set(0, -0.5, 0);

      // 随机生命周期
      particle.maxLifetime = 1 + Math.random() * 2;
      particle.lifetime = 0;

      // 随机大小
      particle.size = 0.5 + Math.random() * 0.5;

      // 随机颜色
      particle.color.r = Math.random();
      particle.color.g = Math.random();
      particle.color.b = Math.random();
      particle.color.a = 1;

      // 添加到活跃粒子
      this.activeParticles.push(particle);
      this.totalEmitted++;
    }
  }

  /**
   * 更新粒子系统
   * @param deltaTime 帧时间(秒)
   */
  update (deltaTime: number): void {
    // 更新累计时间
    this.accumTime += deltaTime;

    // 计算本帧应该发射的粒子数
    const emitCount = Math.floor(this.emitRate * deltaTime);

    if (emitCount > 0) {
      this.emit(emitCount);
    }

    // 更新所有活跃粒子
    const deadParticles: Particle[] = [];

    for (let i = 0; i < this.activeParticles.length; i++) {
      const particle = this.activeParticles[i];

      // 更新粒子，检查是否已死亡
      if (!particle.update(deltaTime)) {
        deadParticles.push(particle);
      }
    }

    // 移除死亡粒子
    for (const particle of deadParticles) {
      const index = this.activeParticles.indexOf(particle);

      if (index !== -1) {
        this.activeParticles.splice(index, 1);
      }

      // 将粒子返回对象池
      this.particlePool.release(particle);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus (): { activeCount: number, poolStatus: any } {
    return {
      activeCount: this.activeParticles.length,
      poolStatus: this.particlePool.getStatus(),
    };
  }

  /**
   * 分析性能
   */
  analyzePerformance (): void {
    this.particlePool.analyzePerformance(0);

    // 计算粒子重用率
    const status = this.particlePool.getStatus();
    const reuseRate = status.efficiency;

    // 打印性能数据
    console.info(
      '粒子系统性能分析:\n' +
      `- 活跃粒子: ${this.activeParticles.length}\n` +
      `- 对象池总大小: ${status.total}\n` +
      `- 对象重用率: ${reuseRate.toFixed(2)}%\n` +
      `- 累计发射粒子: ${this.totalEmitted}个`
    );
  }

  /**
   * 清理所有粒子
   */
  clear (): void {
    // 将所有活跃粒子返回对象池
    this.particlePool.releaseAll(this.activeParticles);
    this.activeParticles = [];
  }

  /**
   * 销毁发射器
   */
  destroy (): void {
    this.clear();

    // 如果使用的是对象池管理器，可以直接销毁对象池
    // ObjectPoolManager.getInstance().destroyPool('particles');
  }
}

/**
 * 示例用法
 */
export function demonstrateObjectPool (): void {
  // 1. 初始化对象池管理器
  const poolManager = ObjectPoolManager.getInstance();

  poolManager.enableAutoAnalysis(true, 5000);

  // 2. 创建粒子发射器
  const emitter = new ParticleEmitter(1000, 200);

  // 3. 模拟主循环
  let time = 0;
  const simulateFrame = (deltaTime: number) => {
    // 更新粒子
    emitter.update(deltaTime);

    // 更新对象池管理器
    poolManager.update();

    // 每秒输出一次状态
    time += deltaTime;
    if (Math.floor(time) > Math.floor(time - deltaTime)) {
      console.log(`时间: ${time.toFixed(1)}s, ${JSON.stringify(emitter.getStatus())}`);
    }
  };

  // 4. 模拟10秒游戏运行
  const frameTime = 1 / 60; // 60 FPS

  for (let t = 0; t < 10; t += frameTime) {
    simulateFrame(frameTime);
  }

  // 5. 分析最终性能
  emitter.analyzePerformance();

  // 6. 清理资源
  emitter.destroy();

  console.log('对象池示例完成');
}

/**
 * 演示不同对象类型的池化
 */
export function demonstrateMultipleObjectPools (): void {
  const poolManager = ObjectPoolManager.getInstance();

  // 创建一些不同类型的对象池

  // 1. 向量对象池
  const vectorPool = poolManager.createPool<Vector3>(
    'math:vector3',
    () => new Vector3(),
    v => v.set(0, 0, 0),
    { initialCapacity: 50, maxSize: 500 }
  );

  // 2. 数组对象池
  const arrayPool = poolManager.createPool<number[]>(
    'collections:array',
    () => [],
    arr => arr.length = 0,
    { initialCapacity: 20, maxSize: 200 }
  );

  // 3. 映射对象池
  const mapPool = poolManager.createPool<Map<string, any>>(
    'collections:map',
    () => new Map<string, any>(),
    map => map.clear(),
    { initialCapacity: 10, maxSize: 100 }
  );

  // 模拟使用这些对象池
  for (let i = 0; i < 100; i++) {
    // 获取并使用向量
    const vectors: Vector3[] = [];

    for (let j = 0; j < 10; j++) {
      const vec = vectorPool.get();

      vec.set(Math.random(), Math.random(), Math.random());
      vectors.push(vec);
    }

    // 获取并使用数组
    const arrays: number[][] = [];

    for (let j = 0; j < 5; j++) {
      const arr = arrayPool.get();

      for (let k = 0; k < 5; k++) {
        arr.push(Math.random() * 100);
      }
      arrays.push(arr);
    }

    // 获取并使用映射
    const maps: Map<string, any>[] = [];

    for (let j = 0; j < 3; j++) {
      const map = mapPool.get();

      map.set('x', Math.random());
      map.set('y', Math.random());
      maps.push(map);
    }

    // 释放所有对象回对象池
    vectorPool.releaseAll(vectors);
    arrayPool.releaseAll(arrays);
    mapPool.releaseAll(maps);
  }

  // 输出性能分析
  poolManager.analyzePerformance(true);
}
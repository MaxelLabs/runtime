# 粒子物理模块文档

粒子物理模块定义了Maxellabs中的粒子系统和物理模拟，包括粒子行为、碰撞检测、力场效果和物理约束。

## 1. 概览与背景

粒子物理系统是Maxellabs动画系统的重要组成部分，专门用于处理粒子效果如爆炸、烟雾、火焰、水流等。该系统基于物理引擎构建，支持真实的物理模拟和高效的性能优化。

## 2. API 签名与类型定义

### ParticlePhysics

粒子物理系统的核心配置接口。

```typescript
interface ParticlePhysics {
  gravity: [number, number, number]; // 重力向量 [x, y, z]
  damping: number; // 阻尼系数 [0, 1]
  collision?: ParticleCollision; // 碰撞配置
  forceFields?: ForceField[]; // 力场列表
  constraints?: ParticleConstraint[]; // 物理约束
  emission?: ParticleEmission; // 发射器配置
}
```

### ParticleCollision

粒子碰撞行为定义。

```typescript
interface ParticleCollision {
  enabled: boolean; // 是否启用碰撞
  layers: string[]; // 碰撞层列表
  bounce: number; // 弹性系数 [0, 1]
  lifetimeLoss: number; // 碰撞后的生命周期损失 [0, 1]
  friction: number; // 摩擦系数 [0, 1]
  stickiness: number; // 粘性系数 [0, 1]
}
```

### ForceField

力场系统配置。

```typescript
interface ForceField {
  type: ForceFieldType; // 力场类型
  strength: number; // 力场强度
  position: [number, number, number]; // 力场位置 [x, y, z]
  range: number; // 影响范围
  falloff: number; // 衰减系数
  direction?: [number, number, number]; // 力场方向（用于方向力场）
  frequency?: number; // 频率（用于振荡力场）
  phase?: number; // 相位（用于振荡力场）
}
```

### ForceFieldType

力场类型枚举。

```typescript
enum ForceFieldType {
  Point = 'point',           // 点力场
  Directional = 'directional', // 方向力场
  Vortex = 'vortex',         // 旋涡力场
  Turbulence = 'turbulence', // 湍流力场
  Radial = 'radial',         // 径向力场
  Gravity = 'gravity',       // 重力力场
  Wind = 'wind',            // 风力场
  Attractor = 'attractor',   // 吸引力场
  Repulsor = 'repulsor',     // 排斥力场
}
```

### ParticleConstraint

粒子物理约束定义。

```typescript
interface ParticleConstraint {
  type: ConstraintType; // 约束类型
  parameters: Record<string, any>; // 约束参数
  enabled: boolean; // 是否启用
  weight: number; // 约束权重 [0, 1]
}
```

### ConstraintType

约束类型枚举。

```typescript
enum ConstraintType {
  Distance = 'distance',     // 距离约束
  Position = 'position',     // 位置约束
  Velocity = 'velocity',     // 速度约束
  Collision = 'collision',   // 碰撞约束
  Spring = 'spring',         // 弹簧约束
  Rod = 'rod',               // 杆约束
}
```

### ParticleEmission

粒子发射器配置。

```typescript
interface ParticleEmission {
  rate: number; // 发射速率（粒子/秒）
  burst?: number; // 爆发数量
  interval?: number; // 发射间隔（秒）
  shape?: EmissionShape; // 发射形状
  velocity?: [number, number, number]; // 初始速度
  spread?: number; // 扩散角度（度）
  lifetime?: ValueRange; // 生命周期范围
}
```

### EmissionShape

发射形状枚举。

```typescript
enum EmissionShape {
  Point = 'point',           // 点发射
  Sphere = 'sphere',         // 球体发射
  Box = 'box',              // 立方体发射
  Cone = 'cone',            // 锥体发射
  Circle = 'circle',        // 圆形发射
  Line = 'line',            // 线形发射
}
```

### ValueRange

数值范围定义。

```typescript
interface ValueRange {
  min: number;
  max: number;
}
```

## 3. 参数与返回值详细说明

### ParticlePhysics 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 | 范围 |
|--------|------|------|--------|------|------|
| gravity | [number,number,number] | 是 | [0,-9.8,0] | 重力向量 | 任意 |
| damping | number | 是 | 0.1 | 阻尼系数 | [0, 1] |
| collision | ParticleCollision | 否 | - | 碰撞配置 | - |
| forceFields | ForceField[] | 否 | [] | 力场列表 | - |
| constraints | ParticleConstraint[] | 否 | [] | 物理约束 | - |
| emission | ParticleEmission | 否 | - | 发射器配置 | - |

### ParticleCollision 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 | 范围 |
|--------|------|------|--------|------|------|
| enabled | boolean | 是 | true | 是否启用碰撞 | true/false |
| layers | string[] | 是 | [] | 碰撞层列表 | 任意字符串 |
| bounce | number | 是 | 0.5 | 弹性系数 | [0, 1] |
| lifetimeLoss | number | 是 | 0.1 | 生命周期损失 | [0, 1] |
| friction | number | 否 | 0.3 | 摩擦系数 | [0, 1] |
| stickiness | number | 否 | 0.0 | 粘性系数 | [0, 1] |

### ForceField 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 | 适用类型 |
|--------|------|------|--------|------|----------|
| type | ForceFieldType | 是 | - | 力场类型 | 所有 |
| strength | number | 是 | 1.0 | 力场强度 | 所有 |
| position | [number,number,number] | 是 | [0,0,0] | 力场位置 | 所有 |
| range | number | 是 | 10.0 | 影响范围 | 所有 |
| falloff | number | 是 | 1.0 | 衰减系数 | 所有 |
| direction | [number,number,number] | 否 | [0,1,0] | 力场方向 | Directional |
| frequency | number | 否 | 1.0 | 频率 | Turbulence |
| phase | number | 否 | 0.0 | 相位 | Turbulence |

### ParticleEmission 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 | 范围 |
|--------|------|------|--------|------|------|
| rate | number | 是 | 10 | 发射速率 | > 0 |
| burst | number | 否 | - | 爆发数量 | > 0 |
| interval | number | 否 | 0.1 | 发射间隔 | > 0 |
| shape | EmissionShape | 否 | 'point' | 发射形状 | 枚举值 |
| velocity | [number,number,number] | 否 | [0,0,0] | 初始速度 | 任意 |
| spread | number | 否 | 0 | 扩散角度 | [0, 360] |
| lifetime | ValueRange | 否 | {min:1,max:3} | 生命周期 | > 0 |

## 4. 使用场景与代码示例

### 基础粒子系统

```typescript
const explosion: ParticlePhysics = {
  gravity: [0, -9.8, 0],
  damping: 0.1,
  collision: {
    enabled: true,
    layers: ['ground', 'walls'],
    bounce: 0.7,
    lifetimeLoss: 0.2,
    friction: 0.3,
    stickiness: 0.1,
  },
  forceFields: [
    {
      type: ForceFieldType.Point,
      strength: 100,
      position: [0, 0, 0],
      range: 50,
      falloff: 2,
    },
    {
      type: ForceFieldType.Wind,
      strength: 20,
      position: [0, 0, 0],
      range: 100,
      falloff: 0.5,
      direction: [1, 0.5, 0],
    },
  ],
  emission: {
    rate: 100,
    burst: 500,
    shape: 'sphere',
    velocity: [0, 10, 0],
    spread: 360,
    lifetime: { min: 1, max: 3 },
  },
  constraints: [
    {
      type: ConstraintType.Distance,
      parameters: { maxDistance: 100 },
      enabled: true,
      weight: 0.8,
    },
  ],
};
```

### 烟雾效果

```typescript
const smoke: ParticlePhysics = {
  gravity: [0, -2, 0],
  damping: 0.05,
  collision: {
    enabled: false,
    layers: [],
    bounce: 0.1,
    lifetimeLoss: 0,
  },
  forceFields: [
    {
      type: ForceFieldType.Turbulence,
      strength: 15,
      position: [0, 0, 0],
      range: 20,
      falloff: 1.5,
      frequency: 0.5,
      phase: 0,
    },
    {
      type: ForceFieldType.Wind,
      strength: 5,
      position: [0, 0, 0],
      range: 50,
      falloff: 0.3,
      direction: [1, 0.2, 0],
    },
  ],
  emission: {
    rate: 20,
    shape: 'cone',
    velocity: [0, 3, 0],
    spread: 30,
    lifetime: { min: 2, max: 5 },
  },
};
```

### 水流效果

```typescript
const waterFlow: ParticlePhysics = {
  gravity: [0, -9.8, 0],
  damping: 0.02,
  collision: {
    enabled: true,
    layers: ['container'],
    bounce: 0.3,
    lifetimeLoss: 0.1,
    friction: 0.1,
  },
  forceFields: [
    {
      type: ForceFieldType.Vortex,
      strength: 30,
      position: [0, 0, 0],
      range: 10,
      falloff: 1,
    },
    {
      type: ForceFieldType.Gravity,
      strength: 9.8,
      position: [0, 0, 0],
      range: 100,
      falloff: 0,
    },
  ],
  emission: {
    rate: 50,
    shape: 'box',
    velocity: [0, -5, 0],
    spread: 10,
    lifetime: { min: 3, max: 8 },
  },
};
```

### 火焰效果

```typescript
const fire: ParticlePhysics = {
  gravity: [0, 5, 0], // 向上的浮力
  damping: 0.08,
  collision: {
    enabled: false,
    layers: [],
    bounce: 0,
    lifetimeLoss: 0,
  },
  forceFields: [
    {
      type: ForceFieldType.Point,
      strength: -20, // 吸引力
      position: [0, 0, 0],
      range: 15,
      falloff: 2,
    },
    {
      type: ForceFieldType.Turbulence,
      strength: 8,
      position: [0, 5, 0],
      range: 10,
      falloff: 1,
      frequency: 1.2,
    },
  ],
  emission: {
    rate: 30,
    shape: 'point',
    velocity: [0, 8, 0],
    spread: 15,
    lifetime: { min: 0.5, max: 2 },
  },
};
```

### 动态力场

```typescript
function createDynamicForceField(
  type: ForceFieldType,
  position: [number, number, number],
  strength: number
): ForceField {
  return {
    type,
    strength,
    position,
    range: 20 + strength * 0.5,
    falloff: 1 + Math.sin(Date.now() * 0.001) * 0.3,
  };
}

// 使用示例
const dynamicVortex = createDynamicForceField(
  ForceFieldType.Vortex,
  [Math.sin(time) * 10, 5, Math.cos(time) * 10],
  50 + Math.sin(time * 2) * 20
);
```

## 5. 内部实现与算法剖析

### 粒子系统模拟器

```typescript
class ParticleSystemSimulator {
  private particles: Particle[] = [];
  private currentTime: number = 0;

  constructor(private config: ParticlePhysics) {}

  update(deltaTime: number): void {
    this.currentTime += deltaTime;
    
    // 发射新粒子
    this.emitParticles(deltaTime);
    
    // 更新现有粒子
    this.updateParticles(deltaTime);
    
    // 移除过期粒子
    this.removeExpiredParticles();
  }

  private emitParticles(deltaTime: number): void {
    if (!this.config.emission) return;
    
    const { rate, shape, velocity, spread, lifetime } = this.config.emission;
    const particlesToEmit = Math.floor(rate * deltaTime);
    
    for (let i = 0; i < particlesToEmit; i++) {
      const particle = this.createParticle(shape, velocity, spread, lifetime);
      this.particles.push(particle);
    }
  }

  private createParticle(
    shape: EmissionShape,
    initialVelocity: [number, number, number],
    spread: number,
    lifetime: ValueRange
  ): Particle {
    const position = this.getEmissionPosition(shape);
    const velocity = this.getEmissionVelocity(initialVelocity, spread);
    
    return {
      position,
      velocity,
      lifetime: lifetime.min + Math.random() * (lifetime.max - lifetime.min),
      age: 0,
    };
  }

  private getEmissionPosition(shape: EmissionShape): [number, number, number] {
    switch (shape) {
      case EmissionShape.Point:
        return [0, 0, 0];
      case EmissionShape.Sphere:
        return this.randomSpherePoint(1);
      case EmissionShape.Box:
        return [
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        ];
      case EmissionShape.Cone:
        return this.randomConePoint(30);
      default:
        return [0, 0, 0];
    }
  }

  private getEmissionVelocity(
    baseVelocity: [number, number, number],
    spread: number
  ): [number, number, number] {
    const spreadRad = (spread * Math.PI) / 180;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(1 - 2 * Math.random());
    
    const spreadX = Math.sin(phi) * Math.cos(theta) * spreadRad;
    const spreadY = Math.sin(phi) * Math.sin(theta) * spreadRad;
    const spreadZ = Math.cos(phi) * spreadRad;
    
    return [
      baseVelocity[0] + spreadX,
      baseVelocity[1] + spreadY,
      baseVelocity[2] + spreadZ,
    ];
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      // 应用重力
      particle.velocity[1] += this.config.gravity[1] * deltaTime;
      
      // 应用阻尼
      particle.velocity[0] *= (1 - this.config.damping);
      particle.velocity[1] *= (1 - this.config.damping);
      particle.velocity[2] *= (1 - this.config.damping);
      
      // 应用力场
      this.applyForceFields(particle);
      
      // 更新位置
      particle.position[0] += particle.velocity[0] * deltaTime;
      particle.position[1] += particle.velocity[1] * deltaTime;
      particle.position[2] += particle.velocity[2] * deltaTime;
      
      // 更新年龄
      particle.age += deltaTime;
    }
  }

  private applyForceFields(particle: Particle): void {
    if (!this.config.forceFields) return;
    
    for (const field of this.config.forceFields) {
      const force = this.calculateForce(field, particle);
      particle.velocity[0] += force[0];
      particle.velocity[1] += force[1];
      particle.velocity[2] += force[2];
    }
  }

  private calculateForce(field: ForceField, particle: Particle): [number, number, number] {
    const dx = particle.position[0] - field.position[0];
    const dy = particle.position[1] - field.position[1];
    const dz = particle.position[2] - field.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > field.range) return [0, 0, 0];
    
    const factor = field.strength * Math.pow(1 - distance / field.range, field.falloff) / (distance + 0.01);
    
    switch (field.type) {
      case ForceFieldType.Point:
        return [-dx * factor, -dy * factor, -dz * factor];
      case ForceFieldType.Directional:
        return [
          field.direction![0] * factor,
          field.direction![1] * factor,
          field.direction![2] * factor,
        ];
      case ForceFieldType.Vortex:
        const crossX = field.direction![1] * dz - field.direction![2] * dy;
        const crossY = field.direction![2] * dx - field.direction![0] * dz;
        const crossZ = field.direction![0] * dy - field.direction![1] * dx;
        return [crossX * factor, crossY * factor, crossZ * factor];
      case ForceFieldType.Turbulence:
        const noise = Math.sin(distance * field.frequency! + field.phase!) * factor;
        return [dx * noise, dy * noise, dz * noise];
      default:
        return [0, 0, 0];
    }
  }

  private removeExpiredParticles(): void {
    this.particles = this.particles.filter(particle => particle.age < particle.lifetime);
  }

  private randomSpherePoint(radius: number): [number, number, number] {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());
    
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ];
  }

  private randomConePoint(angle: number): [number, number, number] {
    const theta = Math.random() * 2 * Math.PI;
    const phi = (angle * Math.PI) / 180 * Math.sqrt(Math.random());
    
    return [
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    ];
  }
}
```

### 碰撞检测算法

```typescript
class ParticleCollisionDetector {
  static detectCollisions(
    particles: Particle[],
    colliders: Collider[],
    collisionConfig: ParticleCollision
  ): CollisionResult[] {
    const results: CollisionResult[] = [];
    
    for (const particle of particles) {
      for (const collider of colliders) {
        if (this.checkCollision(particle, collider)) {
          const result = this.resolveCollision(particle, collider, collisionConfig);
          results.push(result);
        }
      }
    }
    
    return results;
  }

  private static checkCollision(particle: Particle, collider: Collider): boolean {
    switch (collider.type) {
      case 'sphere':
        return this.checkSphereCollision(particle, collider);
      case 'box':
        return this.checkBoxCollision(particle, collider);
      case 'plane':
        return this.checkPlaneCollision(particle, collider);
      default:
        return false;
    }
  }

  private static checkSphereCollision(particle: Particle, sphere: SphereCollider): boolean {
    const dx = particle.position[0] - sphere.center[0];
    const dy = particle.position[1] - sphere.center[1];
    const dz = particle.position[2] - sphere.center[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < sphere.radius;
  }

  private static checkBoxCollision(particle: Particle, box: BoxCollider): boolean {
    return (
      particle.position[0] >= box.min[0] && particle.position[0] <= box.max[0] &&
      particle.position[1] >= box.min[1] && particle.position[1] <= box.max[1] &&
      particle.position[2] >= box.min[2] && particle.position[2] <= box.max[2]
    );
  }

  private static checkPlaneCollision(particle: Particle, plane: PlaneCollider): boolean {
    const distance =
      plane.normal[0] * particle.position[0] +
      plane.normal[1] * particle.position[1] +
      plane.normal[2] * particle.position[2] +
      plane.distance;
    return Math.abs(distance) < 0.1;
  }

  private static resolveCollision(
    particle: Particle,
    collider: Collider,
    config: ParticleCollision
  ): CollisionResult {
    // 计算碰撞法线
    const normal = this.calculateNormal(particle, collider);
    
    // 反弹速度
    const dotProduct =
      particle.velocity[0] * normal[0] +
      particle.velocity[1] * normal[1] +
      particle.velocity[2] * normal[2];
    
    const bounceFactor = config.bounce;
    
    particle.velocity[0] -= 2 * dotProduct * normal[0] * bounceFactor;
    particle.velocity[1] -= 2 * dotProduct * normal[1] * bounceFactor;
    particle.velocity[2] -= 2 * dotProduct * normal[2] * bounceFactor;
    
    // 应用摩擦
    particle.velocity[0] *= (1 - config.friction);
    particle.velocity[1] *= (1 - config.friction);
    particle.velocity[2] *= (1 - config.friction);
    
    // 减少生命周期
    particle.lifetime *= (1 - config.lifetimeLoss);
    
    return {
      particle,
      collider,
      normal,
      impulse: Math.abs(dotProduct),
    };
  }

  private static calculateNormal(particle: Particle, collider: Collider): [number, number, number] {
    switch (collider.type) {
      case 'sphere':
        const sphere = collider as SphereCollider;
        const dx = particle.position[0] - sphere.center[0];
        const dy = particle.position[1] - sphere.center[1];
        const dz = particle.position[2] - sphere.center[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return [dx / distance, dy / distance, dz / distance];
      case 'plane':
        return collider.normal;
      default:
        return [0, 1, 0];
    }
  }
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| INVALID_PARAMETER | 无效参数 | 参数超出有效范围 | 使用默认值 |
| PARTICLE_OVERFLOW | 粒子溢出 | 粒子数量超过限制 | 限制最大数量 |
| FORCE_FIELD_ERROR | 力场错误 | 力场配置不正确 | 禁用问题力场 |
| COLLISION_FAILURE | 碰撞失败 | 碰撞检测异常 | 跳过碰撞处理 |
| MEMORY_LIMIT | 内存限制 | 内存使用超出限制 | 降低粒子数量 |
| PERFORMANCE_DEGRADATION | 性能下降 | 帧率低于阈值 | 降低模拟精度 |

### 性能优化

```typescript
class ParticlePerformanceOptimizer {
  static optimizeLOD(particleCount: number, targetFPS: number): OptimizationSettings {
    const maxParticles = this.calculateMaxParticles(targetFPS);
    
    if (particleCount > maxParticles) {
      return {
        maxParticles,
        simulationRate: 30,
        collisionDetail: 'low',
        forceFieldCount: Math.min(3, Math.floor(maxParticles / 100)),
      };
    }
    
    return {
      maxParticles: particleCount,
      simulationRate: 60,
      collisionDetail: 'high',
      forceFieldCount: this.config.forceFields?.length || 0,
    };
  }

  private static calculateMaxParticles(targetFPS: number): number {
    const baseParticles = 10000;
    const fpsRatio = targetFPS / 60;
    return Math.floor(baseParticles * fpsRatio);
  }
}

class ParticleValidation {
  static validateConfig(config: ParticlePhysics): ValidationResult {
    const errors: string[] = [];
    
    if (config.damping < 0 || config.damping > 1) {
      errors.push('Damping must be between 0 and 1');
    }
    
    if (config.forceFields) {
      for (const field of config.forceFields) {
        if (field.strength < 0) {
          errors.push('Force field strength must be non-negative');
        }
        if (field.range <= 0) {
          errors.push('Force field range must be positive');
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

## 7. 变更记录与未来演进

### v2.8.0 (2024-08-20)

- 添加湍流力场支持
- 优化碰撞检测算法
- 支持GPU加速计算
- 添加实时性能监控

### v2.0.0 (2024-08-01)

- 重构粒子系统架构
- 支持多种发射形状
- 添加物理约束系统
- 优化内存使用50%

### v1.6.0 (2024-07-15)

- 初始粒子物理实现
- 基础力场支持
- 简单碰撞检测
- 基础性能优化

### 路线图

- **v3.0.0**: 支持GPU粒子系统
- **v3.1.0**: 添加流体动力学模拟
- **v3.2.0**: 支持粒子间交互
- **v3.3.0**: 添加粒子着色系统
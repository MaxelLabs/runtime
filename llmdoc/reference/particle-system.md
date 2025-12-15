# 粒子系统参考

## 1. 概述

粒子系统是高性能的GPU加速粒子渲染解决方案，支持大规模粒子效果（10K+粒子），适用于烟雾、火焰、爆炸、雨雪等视觉特效。

## 2. 核心特性

### 2.1 GPU实例化渲染
- 使用 WebGL2 `drawArraysInstanced` 实现批量渲染
- 单次绘制调用处理数千个粒子
- 高效的GPU内存管理

### 2.2 灵活的发射器系统
- 多种发射形状：点、盒、球、圆锥
- 可配置的发射速率和生命周期
- 随机和确定性发射模式

### 2.3 物理模拟
- 重力、风力、涡流等力场
- 碰撞检测和响应
- 速度衰减和阻尼

### 2.4 生命周期动画
- 颜色渐变（RGBA）
- 大小缩放
- 透明度变化
- 自定义属性曲线

## 3. 架构设计

### 3.1 系统组件

```
ParticleSystem
├── ParticleBuffer      # GPU数据管理
│   ├── Position Buffer   # 位置数据 (vec3)
│   ├── Velocity Buffer   # 速度数据 (vec3)
│   ├── Life Buffer       # 生命周期 (float)
│   ├── Size Buffer       # 大小 (float)
│   └── Color Buffer      # 颜色 (vec4)
├── ParticleEmitter     # 发射器
│   ├── EmitPoint        # 点发射
│   ├── EmitBox          # 盒发射
│   ├── EmitSphere       # 球发射
│   └── EmitCone         # 锥发射
├── ParticleAnimator    # 动画器
│   ├── UpdatePhysics    # 物理更新
│   ├── UpdateLife       # 生命周期管理
│   └── RecycleDead      # 死亡粒子回收
└── ParticleRenderer    # 渲染器
    ├── BillboardShader  # 广告牌着色器
    ├── RenderPipeline   # 渲染管线
    └── BlendModes       # 混合模式
```

### 3.2 数据流程

1. **发射阶段**: Emitter 生成新粒子数据
2. **更新阶段**: Animator 更新粒子状态
3. **渲染阶段**: Renderer 批量渲染活跃粒子
4. **回收阶段**: 死亡粒子重新使用

## 4. API参考

### 4.1 ParticleSystem类

```typescript
class ParticleSystem {
    constructor(
        rhi: RHIDevice,
        config: ParticleSystemConfig
    );

    // 发射粒子
    emit(count: number, config?: EmitConfig): void;

    // 更新系统
    update(deltaTime: number): void;

    // 渲染粒子
    render(
        cmdBuf: CommandBuffer,
        camera: Camera
    ): void;

    // 设置力场
    addForce(force: ForceField): void;
    removeForce(force: ForceField): void;

    // 获取统计信息
    getStats(): ParticleStats;

    // 资源管理
    dispose(): void;
}
```

### 4.2 配置接口

```typescript
interface ParticleSystemConfig {
    // 容量设置
    maxParticles: number;           // 最大粒子数
    bufferSize?: number;           // 缓冲区大小

    // 发射器设置
    emitter: {
        type: 'point' | 'box' | 'sphere' | 'cone';
        position: Vec3;
        direction?: Vec3;          // 锥发射方向
        radius?: number;           // 球/锥半径
        size?: Vec3;               // 盒尺寸
        angle?: number;            // 锥角度
    };

    // 发射参数
    emission: {
        rate: number;              // 每秒发射数
        burstCount?: number;       // 突发粒子数
        burstInterval?: number;    // 突发间隔
        loop?: boolean;            // 是否循环
    };

    // 粒子属性
    particle: {
        lifetime: { min: number; max: number };
        size: { start: number; end: number };
        color: {
            start: Vec4;
            end: Vec4;
            curve?: ColorCurve;
        };
        velocity: {
            magnitude: { min: number; max: number };
            spread: number;        // 扩散角度
            inheritRotation?: boolean;
        };
        acceleration: Vec3;        // 加速度
    };

    // 物理设置
    physics: {
        gravity: Vec3;
        damping: number;           // 阻尼
        drag: number;              // 空气阻力
    };

    // 渲染设置
    rendering: {
        texture?: Texture;
        blendMode: BlendMode;
        depthWrite: boolean;
        depthTest: boolean;
        cullMode: CullMode;
        shader?: string;           // 自定义着色器
    };
}

interface ColorCurve {
    points: { time: number; color: Vec4 }[];
    interpolation: 'linear' | 'bezier' | 'step';
}
```

### 4.3 力场系统

```typescript
interface ForceField {
    type: 'gravity' | 'wind' | 'vortex' | 'turbulence' | 'point';
    position?: Vec3;
    direction?: Vec3;
    strength: number;
    radius?: number;
    falloff: 'none' | 'linear' | 'quadratic';

    apply(particle: Particle): Vec3;
}

// 预定义力场
class GravityForce implements ForceField {
    type = 'gravity';
    constructor(public gravity: Vec3) {}
    apply(): Vec3 { return this.gravity; }
}

class WindForce implements ForceField {
    type = 'wind';
    constructor(
        public direction: Vec3,
        public strength: number,
        public turbulence: number = 0
    ) {}
    apply(particle: Particle): Vec3 {
        const turbulence = this.turbulence > 0 ?
            this.generateTurbulence(particle) : Vec3.ZERO;
        return this.direction.scale(this.strength).add(turbulence);
    }
}
```

## 5. 着色器实现

### 5.1 顶点着色器

```glsl
#version 300 es
precision highp float;

// 实例属性
layout(location = 0) in vec2 aQuadPos;    // 四边形位置
layout(location = 1) in vec3 aPosition;   // 粒子位置
layout(location = 2) in float aSize;      // 粒子大小
layout(location = 3) in vec4 aColor;      // 粒子颜色
layout(location = 4) in float aLife;      // 生命周期

// Uniform
uniform mat4 uViewProjection;
uniform vec3 uCameraRight;
uniform vec3 uCameraUp;

// 输出
out vec4 vColor;
out float vLife;

void main() {
    // Billboard计算
    vec3 worldPos = aPosition +
        uCameraRight * aQuadPos.x * aSize +
        uCameraUp * aQuadPos.y * aSize;

    gl_Position = uViewProjection * vec4(worldPos, 1.0);

    vColor = aColor;
    vLife = aLife;
}
```

### 5.2 片段着色器

```glsl
#version 300 es
precision mediump float;

in vec4 vColor;
in float vLife;

uniform sampler2D uTexture;
uniform bool uUseTexture;

out vec4 fragColor;

void main() {
    vec4 baseColor = uUseTexture ?
        texture(uTexture, gl_PointCoord) : vec4(1.0);

    // 生命周期渐隐
    float alpha = vColor.a * smoothstep(0.0, 0.2, vLife);

    fragColor = vec4(vColor.rgb, alpha) * baseColor;
}
```

## 6. 使用示例

### 6.1 创建基础粒子系统

```typescript
import { ParticleSystem } from './utils/particle';

// 创建火焰效果
const fireParticles = new ParticleSystem(rhi, {
    maxParticles: 1000,

    emitter: {
        type: 'cone',
        position: [0, 0, 0],
        direction: [0, 1, 0],
        angle: 15 * Math.PI / 180
    },

    emission: {
        rate: 100,
        loop: true
    },

    particle: {
        lifetime: { min: 1.0, max: 2.0 },
        size: { start: 0.1, end: 0.3 },
        color: {
            start: [1, 1, 0, 1],    // 黄色
            end: [1, 0, 0, 0],      // 红色透明
            curve: {
                points: [
                    { time: 0, color: [1, 1, 0, 1] },
                    { time: 0.5, color: [1, 0.5, 0, 0.8] },
                    { time: 1, color: [1, 0, 0, 0] }
                ],
                interpolation: 'linear'
            }
        },
        velocity: {
            magnitude: { min: 2, max: 4 },
            spread: 0.2
        },
        acceleration: [0, -9.8, 0]
    },

    physics: {
        gravity: [0, -5, 0],
        damping: 0.98
    },

    rendering: {
        texture: fireTexture,
        blendMode: 'additive',
        depthWrite: false
    }
});

// 添加上升力场
const updraftForce = new WindForce([0, 1, 0], 10);
fireParticles.addForce(updraftForce);
```

### 6.2 雪效果

```typescript
const snowParticles = new ParticleSystem(rhi, {
    maxParticles: 5000,

    emitter: {
        type: 'box',
        position: [0, 20, 0],
        size: [50, 1, 50]
    },

    emission: {
        rate: 500,
        loop: true
    },

    particle: {
        lifetime: { min: 10, max: 20 },
        size: { start: 0.05, end: 0.1 },
        color: {
            start: [1, 1, 1, 0.8],
            end: [1, 1, 1, 0.3]
        },
        velocity: {
            magnitude: { min: 0.5, max: 1.5 },
            spread: Math.PI * 2
        }
    },

    physics: {
        gravity: [0, -1, 0],
        damping: 0.99
    },

    rendering: {
        blendMode: 'alpha',
        depthWrite: false
    }
});

// 添加风力
const windForce = new WindForce([1, 0, 0], 2, 0.5);
snowParticles.addForce(windForce);
```

### 6.3 爆炸效果

```typescript
function createExplosion(position: Vec3) {
    const explosion = new ParticleSystem(rhi, {
        maxParticles: 1000,

        emitter: {
            type: 'point',
            position: position
        },

        emission: {
            rate: 0,
            burstCount: 1000,
            loop: false
        },

        particle: {
            lifetime: { min: 0.5, max: 1.5 },
            size: { start: 0.2, end: 0.01 },
            color: {
                start: [1, 1, 0, 1],
                end: [1, 0, 0, 0]
            },
            velocity: {
                magnitude: { min: 10, max: 30 },
                spread: Math.PI * 2
            }
        },

        physics: {
            damping: 0.95
        },

        rendering: {
            blendMode: 'additive'
        }
    });

    // 立即发射所有粒子
    explosion.emit(1000);
    return explosion;
}
```

## 7. 性能优化

### 7.1 批量更新

```typescript
// 使用 Transform Feedback 进行GPU更新
const gpuUpdater = new ParticleGPUUpdater(rhi);

function updateGPU(particles: ParticleSystem) {
    gpuUpdater.update(particles);
    particles.syncFromGPU();
}
```

### 7.2 LOD系统

```typescript
class ParticleLOD {
    update(system: ParticleSystem, distance: number) {
        if (distance < 100) {
            system.setEmissionRate(100);
            system.setMaxParticles(1000);
        } else if (distance < 500) {
            system.setEmissionRate(50);
            system.setMaxParticles(500);
        } else {
            system.setEmissionRate(10);
            system.setMaxParticles(100);
        }
    }
}
```

### 7.3 纹理图集

```typescript
// 多种粒子类型共享纹理
const particleAtlas = loadTexture('particles.png');

const systems = [
    { type: 'smoke', uv: [0, 0, 0.25, 0.25] },
    { type: 'spark', uv: [0.25, 0, 0.5, 0.25] },
    { type: 'bubble', uv: [0.5, 0, 0.75, 0.25] }
];
```

## 8. 高级特性

### 8.1 粒子间交互

```typescript
interface ParticleInteraction {
    type: 'collision' | 'attraction' | 'repulsion';
    radius: number;
    strength: number;

    evaluate(p1: Particle, p2: Particle): void;
}

class CollisionInteraction implements ParticleInteraction {
    type = 'collision';

    constructor(
        public radius: number,
        public restitution: number = 0.8
    ) {}

    evaluate(p1: Particle, p2: Particle) {
        const dist = p1.position.distance(p2.position);
        if (dist < this.radius) {
            // 碰撞响应
            const normal = p1.position.subtract(p2.position).normalize();
            const relativeVel = p1.velocity.subtract(p2.velocity);
            const separatingVel = relativeVel.dot(normal);

            if (separatingVel < 0) {
                const impulse = 2 * separatingVel / 2;
                p1.velocity.subtract(normal.scale(impulse * this.restitution));
                p2.velocity.add(normal.scale(impulse * this.restitution));
            }
        }
    }
}
```

### 8.2 粒子轨迹

```typescript
class ParticleTrail {
    private trails: Map<number, Vec3[]> = new Map();
    private maxTrailLength: number = 10;

    update(particle: Particle) {
        if (!this.trails.has(particle.id)) {
            this.trails.set(particle.id, []);
        }

        const trail = this.trails.get(particle.id)!;
        trail.push(particle.position.clone());

        if (trail.length > this.maxTrailLength) {
            trail.shift();
        }
    }

    render(cmdBuf: CommandBuffer) {
        for (const [id, trail] of this.trails) {
            if (trail.length > 1) {
                this.renderTrail(cmdBuf, trail);
            }
        }
    }
}
```

### 8.3 体积渲染

```typescript
class VolumeRenderer {
    render(
        cmdBuf: CommandBuffer,
        particles: ParticleSystem,
        densityTexture: Texture3D
    ) {
        // 使用体积渲染技术实现厚实的烟雾效果
        cmdBuf.bindPipeline(volumePipeline);
        cmdBuf.bindTexture(0, densityTexture);
        cmdBuf.bindStorageBuffer(1, particles.getPositionBuffer());

        cmdBuf.dispatchCompute(
            Math.ceil(particles.getCount() / 64),
            1, 1
        );
    }
}
```

## 9. 调试工具

### 9.1 可视化调试

```typescript
class ParticleDebugger {
    private enabled: boolean = false;

    enable() { this.enabled = true; }
    disable() { this.enabled = false; }

    render(system: ParticleSystem) {
        if (!this.enabled) return;

        // 绘制边界框
        this.drawBoundingBox(system.getBounds());

        // 绘制发射器
        this.drawEmitter(system.getEmitter());

        // 绘制力场
        for (const force of system.getForces()) {
            this.drawForceField(force);
        }

        // 绘制统计信息
        this.drawStats(system.getStats());
    }

    private drawStats(stats: ParticleStats) {
        const text = `
Active Particles: ${stats.activeCount}
Emitted/Second: ${stats.emissionRate}
Average Lifetime: ${stats.avgLifetime.toFixed(2)}
Memory Usage: ${(stats.memoryUsage / 1024).toFixed(1)} KB
        `;
        drawText(text, 10, 10);
    }
}
```

## 10. 最佳实践

### 10.1 性能准则
1. **预分配缓冲区**：避免动态内存分配
2. **批量更新**：减少CPU-GPU同步
3. **合理设置粒子数量**：根据目标设备性能调整
4. **使用纹理图集**：减少纹理绑定切换

### 10.2 视觉效果优化
1. **颜色渐变**：避免突兀的颜色变化
2. **大小变化**：结合生命周期调整粒子大小
3. **混合模式**：根据效果选择合适的混合模式
4. **深度排序**：对于alpha混合的粒子需要排序

### 10.3 内存管理
1. **对象池**：复用粒子对象
2. **及时清理**：释放不用的资源
3. **压缩数据**：使用合适的数据类型存储粒子属性

## 11. 故障排除

### 11.1 常见问题

**问题**: 粒子不显示
- **原因**: 着色器编译错误或缓冲区未绑定
- **解决**: 检查WebGL控制台错误信息

**问题**: 性能问题
- **原因**: 粒子数量过多或更新频率过高
- **解决**: 实现LOD系统或降低更新频率

**问题**: 视觉效果不佳
- **原因**: 颜色或大小曲线设置不当
- **解决**: 调整生命周期属性曲线

### 11.2 性能分析工具

```typescript
class ParticleProfiler {
    private timings: { [key: string]: number } = {};

    startMeasure(name: string) {
        this.timings[name] = performance.now();
    }

    endMeasure(name: string): number {
        const duration = performance.now() - this.timings[name];
        console.log(`${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }

    profileSystem(system: ParticleSystem) {
        this.startMeasure('Update');
        system.update(deltaTime);
        this.endMeasure('Update');

        this.startMeasure('Render');
        system.render(cmdBuf, camera);
        this.endMeasure('Render');
    }
}
```

## 12. 扩展开发

### 12.1 自定义力场

```typescript
class CustomForce implements ForceField {
    type = 'custom';

    constructor(
        public evaluateFn: (particle: Particle) => Vec3
    ) {}

    apply(particle: Particle): Vec3 {
        return this.evaluateFn(particle);
    }
}

// 使用示例
const tornadoForce = new CustomForce((particle) => {
    const center = Vec3.ZERO;
    const toParticle = particle.position.subtract(center);
    const distance = toParticle.length();

    if (distance < 20) {
        // 旋转力
        const tangent = new Vec3(-toParticle.z, 0, toParticle.x).normalize();
        const strength = (20 - distance) / 20;
        return tangent.scale(strength * 10);
    }

    return Vec3.ZERO;
});
```

### 12.2 着色器扩展

```glsl
// 自定义粒子效果着色器
#version 300 es
precision highp float;

// 添加扰动效果
uniform float uTime;
uniform float uDistortion;

in vec2 vTexCoord;
in vec4 vColor;

void main() {
    // UV扰动
    vec2 distortedUV = vTexCoord +
        vec2(sin(vTexCoord.y * 10.0 + uTime) * uDistortion,
             cos(vTexCoord.x * 10.0 + uTime) * uDistortion);

    vec4 texColor = texture(uTexture, distortedUV);

    // 闪烁效果
    float flicker = sin(uTime * 10.0) * 0.5 + 0.5;

    fragColor = texColor * vColor * flicker;
}
```

## 13. 参考资源

### 13.1 理论基础
- [GPU Particles](http://developer.download.nvidia.com/books/HTML/gpugems/gpugems_ch39.html)
- [Real-Time Volumetric Cloud Scattering](https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter40.html)
- [Particle Systems](https://www.cs.unc.edu/geom/volcrow/volcrow.pdf)

### 13.2 实现参考
- [Three.js Particle System](https://threejs.org/examples/?q=particles)
- [Unity Particle System](https://docs.unity3d.com/Manual/ParticleSystems.html)
- [Unreal Niagara](https://docs.unrealengine.com/en-US/Engine/Rendering/Niagara/)

## 14. 版本历史

- **v1.0.0** - 基础粒子系统
- **v1.1.0** - 添加力场支持
- **v1.2.0** - GPU更新功能
- **v1.3.0** - 粒子交互和轨迹
- **v1.4.0** - 体积渲染支持
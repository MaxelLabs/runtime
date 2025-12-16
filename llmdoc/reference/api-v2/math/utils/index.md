# 数学实用工具API文档

## 概述

Math库提供了丰富的数学工具函数，包括基础数学运算、坐标转换、插值函数、特殊优化算法等。这些工具函数经过性能优化，支持缓存机制，为3D应用开发提供高效的数学计算支持。

# 基础数学常量

## 核心常量

```typescript
// 基础数学常量
NumberEpsilon: number      // 1e-10 - 数值比较精度阈值
DEG2RAD: number           // π/180 - 度转弧度系数
RAD2DEG: number           // 180/π - 弧度转度系数
PI2: number               // 2π - 完整圆周弧度

// 常用数学常数
export const HALF_PI = Math.PI / 2;     // π/2
export const QUARTER_PI = Math.PI / 4;  // π/4
export const TWO_PI = Math.PI * 2;      // 2π
export const INV_PI = 1 / Math.PI;      // 1/π
export const INV_TWO_PI = 1 / (Math.PI * 2); // 1/(2π)
```

## 使用示例

```typescript
// 角度转换
const degrees = 90;
const radians = degrees * DEG2RAD;  // 转换为弧度

// 精度比较
const isEqual = Math.abs(a - b) < NumberEpsilon;  // 浮点数比较

// 圆周计算
const circumference = 2 * Math.PI * radius;  // 周长
const circleArea = Math.PI * radius * radius; // 面积
```

# 优化的三角函数

## 快速正弦函数

### `fastSin(angle: number): number`

优化的正弦函数，使用缓存和小角度近似提升性能。

**特性：**
- 内置缓存机制，减少重复计算
- 小角度近似优化（当角度接近0时）
- 自动角度归一化到[0, 2π)范围

**性能提升：**
- 缓存命中时性能提升10-50倍
- 小角度计算性能提升2-5倍

```typescript
// 基础使用
const angle = Math.PI / 4;  // 45度
const sinValue = fastSin(angle);

// 在动画循环中使用（自动缓存）
for (let i = 0; i < 1000; i++) {
  const t = i / 1000 * Math.PI * 2;
  const y = Math.sin(t) * amplitude;  // 每次都会缓存结果
}
```

## 快速余弦函数

### `fastCos(angle: number): number`

优化的余弦函数，与`fastSin`共享缓存机制。

```typescript
// 计算3D旋转
const cosTheta = fastCos(theta);
const sinTheta = fastSin(theta);

// 旋转矩阵元素
const m00 = cosTheta;  const m01 = -sinTheta;
const m10 = sinTheta;  const m11 = cosTheta;
```

## 缓存管理

### `clearTrigCache(): void`

清除三角函数缓存，在内存压力大时使用。

```typescript
// 定期清理缓存
setInterval(() => {
  clearTrigCache();
}, 60000); // 每分钟清理一次
```

# 优化基础函数

## 快速平方根

### `fastSqrt(x: number): number`

针对常见值优化的平方根函数。

**优化策略：**
- 常见值(0,1,4,9,16)直接返回
- 其他值使用标准Math.sqrt

```typescript
// 常见值优化
fastSqrt(0)   // 0 - 直接返回
fastSqrt(1)   // 1 - 直接返回
fastSqrt(4)   // 2 - 直接返回
fastSqrt(9)   // 3 - 直接返回
fastSqrt(16)  // 4 - 直接返回

// 其他值
fastSqrt(2)   // 1.4142135623730951
```

## 快速反平方根

### `fastInvSqrt(x: number): number`

基于Quake III算法的反平方根函数，适用于向量归一化等场景。

**算法特点：**
- 使用位操作技巧
- 两次Newton-Raphson迭代
- 高精度（相对误差<0.1%）

```typescript
// 向量归一化中的使用
function normalizeVector(x: number, y: number, z: number): void {
  const lengthSquared = x * x + y * y + z * z;
  const invLength = fastInvSqrt(lengthSquared);

  // 归一化
  x *= invLength;
  y *= invLength;
  z *= invLength;
}
```

# 坐标系统转换

## 角度转换

```typescript
// 度转弧度
degToRad(degrees: number): number

// 弧度转度
radToDeg(radians: number): number
```

**使用示例：**

```typescript
// 欧拉角转换
const eulerDegrees = { x: 45, y: 90, z: 30 };
const eulerRadians = {
  x: degToRad(eulerDegrees.x),
  y: degToRad(eulerDegrees.y),
  z: degToRad(eulerDegrees.z)
};

// 旋转角度显示
const rotationRad = quaternion.toEuler();
const rotationDeg = {
  x: radToDeg(rotationRad.x),
  y: radToDeg(rotationRad.y),
  z: radToDeg(rotationRad.z)
};
```

## 3D坐标系统转换

### 笛卡尔坐标 ↔ 球坐标

```typescript
// 笛卡尔转球坐标
function cartesianToSpherical(
  x: number, y: number, z: number
): { radius: number, phi: number, theta: number } {
  const radius = fastSqrt(x * x + y * y + z * z);
  const theta = Math.atan2(z, x);
  const phi = Math.acos(y / radius);

  return { radius, phi, theta };
}

// 球坐标转笛卡尔
function sphericalToCartesian(
  radius: number, phi: number, theta: number
): { x: number, y: number, z: number } {
  const sinPhi = fastSin(phi);
  const cosPhi = fastCos(phi);
  const sinTheta = fastSin(theta);
  const cosTheta = fastCos(theta);

  return {
    x: radius * sinPhi * cosTheta,
    y: radius * cosPhi,
    z: radius * sinPhi * sinTheta
  };
}
```

### 笛卡尔坐标 ↔ 柱坐标

```typescript
// 笛卡尔转柱坐标
function cartesianToCylindrical(
  x: number, y: number, z: number
): { radius: number, angle: number, height: number } {
  const radius = fastSqrt(x * x + y * y);
  const angle = Math.atan2(y, x);

  return { radius, angle, height: z };
}

// 柱坐标转笛卡尔
function cylindricalToCartesian(
  radius: number, angle: number, height: number
): { x: number, y: number, z: number } {
  return {
    x: radius * fastCos(angle),
    y: radius * fastSin(angle),
    z: height
  };
}
```

## 应用示例

### 极坐标动画

```typescript
class PolarAnimation {
  private time = 0;

  // 圆形运动
  circularMotion(centerX: number, centerY: number, radius: number): { x: number, y: number } {
    this.time += 0.016; // 60fps
    const angle = this.time * 2; // 每秒2圈

    return {
      x: centerX + radius * fastCos(angle),
      y: centerY + radius * fastSin(angle)
    };
  }

  // 螺旋运动
  spiralMotion(
    centerX: number, centerY: number,
    initialRadius: number, growthRate: number
  ): { x: number, y: number, radius: number } {
    this.time += 0.016;
    const angle = this.time;
    const radius = initialRadius + growthRate * this.time;

    return {
      x: centerX + radius * fastCos(angle),
      y: centerY + radius * fastSin(angle),
      radius
    };
  }

  // 李萨如图形
  lissajous(
    centerX: number, centerY: number,
    amplitudeX: number, amplitudeY: number,
    freqX: number, freqY: number,
    phase: number
  ): { x: number, y: number } {
    this.time += 0.016;

    return {
      x: centerX + amplitudeX * fastSin(freqX * this.time + phase),
      y: centerY + amplitudeY * fastSin(freqY * this.time)
    };
  }
}
```

# 插值和缓动函数

## 基础插值

### 线性插值

```typescript
lerp(x: number, y: number, t: number): number
```

优化的线性插值函数，参数t在[0,1]范围内。

```typescript
// 位置插值
const position = lerp(startPosition, endPosition, alpha);

// 颜色插值
const red = lerp(startRed, endRed, t);
const green = lerp(startGreen, endGreen, t);
const blue = lerp(startBlue, endBlue, t);

// 动画混合
const mixedValue = lerp(value1, value2, blendWeight);
```

### 反线性插值

```typescript
inverseLerp(x: number, y: number, value: number): number {
  return (value - x) / (y - x);
}
```

计算value在[x,y]区间内的相对位置。

### 重映射

```typescript
remap(
  value: number,
  fromLow: number, fromHigh: number,
  toLow: number, toHigh: number
): number {
  const t = inverseLerp(fromLow, fromHigh, value);
  return lerp(toLow, toHigh, t);
}
```

## 平滑插值

### 平滑阶跃

```typescript
smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
```

Hermite插值，提供平滑的过渡效果。

### 更平滑的阶跃

```typescript
smootherStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
```

6次多项式插值，提供更平滑的过渡。

## 缓动函数

```typescript
// 缓动函数集合
export const Easing = {
  // 二次缓动
  quadIn: (t: number): number => t * t,
  quadOut: (t: number): number => t * (2 - t),
  quadInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // 三次缓动
  cubicIn: (t: number): number => t * t * t,
  cubicOut: (t: number): number => (--t) * t * t + 1,
  cubicInOut: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // 指数缓动
  expIn: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  expOut: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  expInOut: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // 弹性缓动
  elasticOut: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * fastSin((t * 10 - 0.75) * c4) + 1;
  },

  // 反弹缓动
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};
```

## 应用示例

### 动画系统

```typescript
class AnimationSystem {
  // 帧率独立的阻尼
  damp(value: number, target: number, lambda: number, dt: number): number {
    return lerp(value, target, 1 - Math.exp(-lambda * dt));
  }

  // 平滑跟随
  smoothFollow(
    current: Vector3, target: Vector3,
    speed: number, deltaTime: number
  ): Vector3 {
    const lerpFactor = 1 - Math.exp(-speed * deltaTime);
    return current.lerp(target, lerpFactor);
  }

  // 弹性动画
  elasticAnimation(
    from: number, to: number,
    duration: number, currentTime: number
  ): number {
    const t = clamp(currentTime / duration, 0, 1);
    return lerp(from, to, Easing.elasticOut(t));
  }

  // 路径动画（贝塞尔曲线）
  bezierPath(
    p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3,
    t: number
  ): Vector3 {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return Vector3.create().set(
      uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
      uuu * p0.z + 3 * uu * t * p1.z + 3 * u * tt * p2.z + ttt * p3.z
    );
  }
}
```

# 数值工具函数

## 范围和约束

```typescript
// 数值约束
clamp(value: number, min: number, max: number): number

// 范围检查
isInRange(value: number, min: number, max: number): boolean

// 包装到范围
wrap(value: number, min: number, max: number): number
```

### 使用示例

```typescript
// 颜色值约束
const red = clamp(color.r, 0, 255);
const green = clamp(color.g, 0, 255);
const blue = clamp(color.b, 0, 255);

// 角度包装（保持在0-360度）
const wrappedAngle = wrap(angle + deltaAngle, 0, 360);

// 生命值限制
const currentHealth = clamp(health + healAmount, 0, maxHealth);
```

## 数值比较

```typescript
// 零值检测
isZero(value: number): boolean

// 精度相等比较
isEqual(a: number, b: number): boolean

// 相对误差比较
isRelativeEqual(a: number, b: number, epsilon?: number): boolean
```

```typescript
// 向量长度检测
if (isZero(vector.length())) {
  // 向量长度接近0
}

// 浮点数安全比较
if (isEqual(calculatedValue, expectedValue)) {
  // 值相等（考虑浮点精度）
}

// 百分比误差比较
const relativeError = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b));
if (relativeError < 0.001) {
  // 相对误差小于0.1%
}
```

## 数值处理

```typescript
// 小数位截断
truncateDecimals(value: number, decimals: number): number

// 安全除法
safeDivide(a: number, b: number, fallback?: number): number

// 高效立方
cube(x: number): number
```

```typescript
// 精确的小数位处理
const truncated = truncateDecimals(3.14159265359, 2);  // 3.14

// 避免除零错误
const result = safeDivide(numerator, denominator, 0);  // 除零时返回0

// 快速立方计算
const volume = cube(sideLength);  // 比 sideLength ** 3 更快
```

# 2的幂运算

## 2的幂检测

```typescript
// 检测是否为2的整数幂
isPowerOfTwo(value: number): boolean

// 检测是否为2的幂范围
isPowerOfTwoInRange(min: number, max: number): boolean
```

### 使用示例

```typescript
// 纹理尺寸优化
function makeValidTextureSize(size: number): number {
  if (isPowerOfTwo(size)) {
    return size;  // 已经是有效的纹理尺寸
  }

  // 找到下一个2的幂
  return nextPowerOfTwo(size);
}

// 内存对齐检查
function isMemoryAligned(address: number, alignment: number): boolean {
  return (address & (alignment - 1)) === 0 && isPowerOfTwo(alignment);
}
```

## 2的幂计算

```typescript
// 计算不小于给定值的2的幂
nextPowerOfTwo(value: number): number

// 计算不大于给定值的2的幂
previousPowerOfTwo(value: number): number

// 向下舍入到最近的2的幂
floorToPowerOfTwo(value: number): number

// 四舍五入到最近的2的幂
roundToPowerOfTwo(value: number): number
```

### 实际应用

```typescript
class TextureManager {
  // 优化纹理尺寸
  optimizeTextureDimensions(width: number, height: number): { width: number, height: number } {
    return {
      width: nextPowerOfTwo(width),
      height: nextPowerOfTwo(height)
    };
  }

  // Mipmap级别计算
  calculateMipmapLevels(textureSize: number): number {
    return Math.floor(Math.log2(textureSize)) + 1;
  }

  // 块压缩对齐
  alignToBlockSize(size: number, blockSize: number): number {
    return Math.ceil(size / blockSize) * blockSize;
  }
}

// 内存池管理
class MemoryPool {
  // 按块分配内存
  allocateBlock(requestedSize: number): number {
    const alignedSize = nextPowerOfTwo(requestedSize);
    const blockSize = Math.max(alignedSize, 64);  // 最小64字节对齐
    return this.allocateFromFreeList(blockSize);
  }

  // 合并相邻的空闲块
  coalesceBlocks(): void {
    // 实现内存块合并逻辑
    // 只合并大小为2的幂的块
  }
}
```

# 常用数学模式

## 噪声函数

```typescript
// 简单的伪随机噪声
noise1D(x: number): number {
  const n = Math.sin(x * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

// 平滑噪声（插值版本）
smoothNoise1D(x: number): number {
  const intX = Math.floor(x);
  const fracX = x - intX;

  const a = noise1D(intX);
  const b = noise1D(intX + 1);

  return lerp(a, b, smoothStep(0, 1, fracX));
}
```

## 数值积分

```typescript
// 梯形法则数值积分
trapezoidalIntegrate(
  f: (x: number) => number,
  a: number, b: number,
  n: number = 1000
): number {
  const h = (b - a) / n;
  let sum = 0.5 * (f(a) + f(b));

  for (let i = 1; i < n; i++) {
    sum += f(a + i * h);
  }

  return sum * h;
}

// 辛普森法则数值积分
simpsonIntegrate(
  f: (x: number) => number,
  a: number, b: number,
  n: number = 1000
): number {
  if (n % 2 !== 0) n++;  // 确保n为偶数

  const h = (b - a) / n;
  let sum = f(a) + f(b);

  for (let i = 1; i < n; i += 2) {
    sum += 4 * f(a + i * h);
  }

  for (let i = 2; i < n; i += 2) {
    sum += 2 * f(a + i * h);
  }

  return sum * h / 3;
}
```

## 根求解

```typescript
// 二分法求根
bisection(
  f: (x: number) => number,
  a: number, b: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) return null;  // 符号相同，无根

  for (let i = 0; i < maxIterations; i++) {
    const c = (a + b) / 2;
    const fc = f(c);

    if (Math.abs(fc) < tolerance || (b - a) / 2 < tolerance) {
      return c;
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  return (a + b) / 2;  // 返回近似解
}

// 牛顿-拉夫逊法求根
newtonRaphson(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let x = x0;

  for (let i = 0; i < maxIterations; i++) {
    const fx = f(x);
    const dfx = df(x);

    if (Math.abs(dfx) < NumberEpsilon) return null;  // 导数为零

    const x1 = x - fx / dfx;

    if (Math.abs(x1 - x) < tolerance) {
      return x1;
    }

    x = x1;
  }

  return null;  // 未收敛
}
```

## 应用示例

### 物理模拟

```typescript
class PhysicsSimulation {
  // 欧拉积分
  eulerIntegrate(
    position: Vector3, velocity: Vector3,
    acceleration: Vector3, dt: number
  ): void {
    velocity.add(acceleration.multiplyScalar(dt));
    position.add(velocity.multiplyScalar(dt));
  }

  // Verlet积分（更稳定）
  verletIntegrate(
    position: Vector3, oldPosition: Vector3,
    acceleration: Vector3, dt: number
  ): void {
    const tempPosition = position.clone();

    position.multiplyScalar(2)
      .sub(oldPosition)
      .add(acceleration.multiplyScalar(dt * dt));

    oldPosition.copy(tempPosition);
  }

  // 阻尼振动
  dampedOscillation(
    position: number, velocity: number,
    equilibrium: number, springConstant: number,
    damping: number, dt: number
  ): { position: number, velocity: number } {
    const force = -springConstant * (position - equilibrium) - damping * velocity;
    const acceleration = force;  // 假设质量为1

    velocity += acceleration * dt;
    position += velocity * dt;

    return { position, velocity };
  }
}
```

### 音频合成

```typescript
class AudioSynthesis {
  // 正弦波
  sineWave(frequency: number, time: number, amplitude: number = 1): number {
    return amplitude * fastSin(2 * Math.PI * frequency * time);
  }

  // 方波（傅里叶级数近似）
  squareWave(frequency: number, time: number, harmonics: number = 10): number {
    let value = 0;
    const omega = 2 * Math.PI * frequency * time;

    for (let n = 1; n <= harmonics; n += 2) {
      value += fastSin(n * omega) / n;
    }

    return (4 / Math.PI) * value;
  }

  // 锯齿波
  sawtoothWave(frequency: number, time: number, harmonics: number = 10): number {
    let value = 0;
    const omega = 2 * Math.PI * frequency * time;

    for (let n = 1; n <= harmonics; n++) {
      value += fastSin(n * omega) / n;
    }

    return (2 / Math.PI) * value;
  }

  // ADSR包络
  adsrEnvelope(
    time: number,
    attackTime: number, decayTime: number,
    sustainLevel: number, releaseTime: number
  ): number {
    const totalTime = attackTime + decayTime + releaseTime;

    if (time <= attackTime) {
      // 攻击阶段：0到1
      return time / attackTime;
    } else if (time <= attackTime + decayTime) {
      // 衰减阶段：1到sustainLevel
      const decayProgress = (time - attackTime) / decayTime;
      return lerp(1, sustainLevel, decayProgress);
    } else if (time <= totalTime) {
      // 释放阶段：sustainLevel到0
      const releaseProgress = (time - attackTime - decayTime) / releaseTime;
      return lerp(sustainLevel, 0, releaseProgress);
    } else {
      return 0;
    }
  }
}
```

## 性能优化技巧

### 批量计算

```typescript
// 预计算常用值
class PrecomputedTables {
  private static sinTable: Float32Array;
  private static cosTable: Float32Array;
  private static tableSize = 1024;

  static initialize(): void {
    this.sinTable = new Float32Array(this.tableSize);
    this.cosTable = new Float32Array(this.tableSize);

    for (let i = 0; i < this.tableSize; i++) {
      const angle = (i / this.tableSize) * Math.PI * 2;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }
  }

  static fastSinLUT(angle: number): number {
    const index = Math.floor((angle % (Math.PI * 2)) / (Math.PI * 2) * this.tableSize);
    return this.sinTable[index];
  }

  static fastCosLUT(angle: number): number {
    const index = Math.floor((angle % (Math.PI * 2)) / (Math.PI * 2) * this.tableSize);
    return this.cosTable[index];
  }
}
```

### 内存优化

```typescript
// 对象复用模式
class MathObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;

    // 预分配
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
}

// 使用示例
const vectorPool = new MathObjectPool(
  () => ({ x: 0, y: 0, z: 0 }),
  (v) => { v.x = v.y = v.z = 0; },
  100
);

// 获取临时向量
const tempVector = vectorPool.acquire();
tempVector.x = 1; tempVector.y = 2; tempVector.z = 3;

// 使用完后归还
vectorPool.release(tempVector);
```

## 总结

Math库的工具函数提供了：

1. **高性能计算** - 优化的三角函数、平方根等基础运算
2. **完整的插值支持** - 线性、平滑、缓动等多种插值方式
3. **坐标转换工具** - 笛卡尔、球坐标、柱坐标互相转换
4. **数值处理函数** - 范围约束、精度比较、2的幂运算等
5. **常用数学模式** - 噪声、积分、求根等算法实现

合理使用这些工具函数可以显著提升3D应用的性能和开发效率。
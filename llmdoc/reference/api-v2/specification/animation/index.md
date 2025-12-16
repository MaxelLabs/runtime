# Specification 动画系统 API 文档

## 概述

Specification 动画系统提供了完整的、基于 USD 标准的动画解决方案，支持关键帧动画、序列帧动画、骨骼动画等多种动画类型。系统采用统一的泛型设计，确保类型安全和性能优化。

## 核心特性

- **统一动画架构**: 基于统一关键帧和轨道的泛型设计
- **USD 时间采样**: 完全兼容 USD 时间采样数据格式
- **多种动画类型**: 关键帧、序列帧、骨骼、变形、程序化动画
- **高级插值**: 线性、贝塞尔、样条等多种插值模式
- **动画混合**: 支持多层动画混合和遮罩
- **性能优化**: 智能缓存和预加载策略

## 动画核心系统

### 动画剪辑 (AnimationClip)

```typescript
// USD 动画剪辑
interface UsdAnimationClip extends AnimationPrim {
  attributes: {
    name: UsdValue;           // 动画名称 (string)
    duration: UsdValue;       // 持续时间（秒）(float)
    frameRate: UsdValue;      // 帧率 (float)
    loopMode: UsdValue;       // 循环模式 (AnimationLoopMode)
    startTime?: UsdValue;     // 开始时间 (float)
    endTime?: UsdValue;       // 结束时间 (float)
  };
  tracks: AnimationTrack[];   // 动画轨道
  events?: AnimationEvent[];  // 动画事件
}
```

### USD 特定关键帧

```typescript
// USD 关键帧（基于 UnifiedKeyframe）
interface UsdKeyframe extends Omit<UnifiedKeyframe<any>, 'inTangent' | 'outTangent'> {
  // USD 格式的切线定义
  inTangent?: UsdTangent;     // 输入切线 (x, y)
  outTangent?: UsdTangent;    // 输出切线 (x, y)
}

interface UsdTangent {
  x: number;                  // 时间分量
  y: number;                  // 值分量
}

// USD 动画轨道
interface UsdAnimationTrack extends Omit<UnifiedAnimationTrack<UsdKeyframe>, 'targetPath'> {
  usdPath: string;            // USD 属性路径
  usdType: string;            // USD 属性类型
  targetPath?: string;        // 可选的目标路径
}
```

## 缓动函数系统

### 基础缓动函数 (来自 core)

```typescript
// 核心缓动函数
enum EasingFunction {
  Linear = 'linear',
  QuadraticIn = 'quad-in',
  QuadraticOut = 'quad-out',
  QuadraticInOut = 'quad-in-out',
  CubicIn = 'cubic-in',
  CubicOut = 'cubic-out',
  CubicInOut = 'cubic-in-out',
  SineIn = 'sine-in',
  SineOut = 'sine-out',
  SineInOut = 'sine-in-out',
  BackIn = 'back-in',
  BackOut = 'back-out',
  BackInOut = 'back-in-out',
  BounceIn = 'bounce-in',
  BounceOut = 'bounce-out',
  BounceInOut = 'bounce-in-out',
  ElasticIn = 'elastic-in',
  ElasticOut = 'elastic-out',
  ElasticInOut = 'elastic-in-out',
}
```

### 扩展缓动函数

```typescript
// 动画特有的扩展缓动函数
enum ExtendedEasingType {
  CubicBezier = 'cubic-bezier',  // 贝塞尔曲线
  Spring = 'spring',              // 弹簧效果
  Steps = 'steps',                // 步进函数
  ExpoIn = 'expo-in',             // 指数入
  ExpoOut = 'expo-out',           // 指数出
  ExpoInOut = 'expo-in-out',      // 指数出入
  CircIn = 'circ-in',             // 圆形入
  CircOut = 'circ-out',           // 圆形出
  CircInOut = 'circ-in-out',      // 圆形出入
}

// 完整缓动类型
type FullEasingType = EasingFunction | ExtendedEasingType;
```

### 自定义缓动配置

```typescript
// 贝塞尔曲线缓动
interface CubicBezierEasing {
  type: 'cubic-bezier';
  x1: number;               // 控制点1 x
  y1: number;               // 控制点1 y
  x2: number;               // 控制点2 x
  y2: number;               // 控制点2 y
}

// 弹簧缓动
interface SpringEasing {
  type: 'spring';
  tension: number;          // 张力
  friction: number;         // 摩擦力
  mass?: number;            // 质量
  velocity?: number;        // 初始速度
}

// 步进缓动
interface StepsEasing {
  type: 'steps';
  steps: number;            // 步数
  stepPosition: 'start' | 'end';  // 步进位置
}

// 缓动函数配置
type EasingConfig =
  | EasingFunction
  | CubicBezierEasing
  | SpringEasing
  | StepsEasing;
```

## 动画控制器系统

### 基础动画控制器

```typescript
// 扩展动画控制器（添加状态机支持）
interface ExtendedAnimationController extends AnimationController {
  name: string;                        // 控制器名称
  stateMachine?: AnimationStateMachine;  // 状态机
  currentState?: string;               // 当前状态

  // 播放控制
  play(animationName: string, fadeTime?: number): void;
  pause(): void;
  stop(): void;
  resume(): void;

  // 权重控制
  setLayerWeight(layerIndex: number, weight: number): void;
  getLayerWeight(layerIndex: number): number;

  // 状态控制
  setState(stateName: string, transitionTime?: number): void;
  getState(): string;
}
```

### 动画图层系统

```typescript
// 状态机动画图层
interface StateMachineAnimationLayer extends AnimationMixerLayer {
  stateMachine?: AnimationStateMachine;  // 图层状态机
  blendMode?: AnimationBlendMode;       // 混合模式
  additive?: boolean;                   // 是否为 additive 模式

  // 图层控制
  setWeight(weight: number): void;
  getWeight(): number;
  setMask(mask: AnimationMask): void;
  applyMask(): void;
}

// 动画混合模式
enum AnimationBlendMode {
  Override = 'override',      // 覆盖模式
  Additive = 'additive',      // 叠加模式
  Multiply = 'multiply',      // 乘法模式
  Min = 'min',               // 最小值模式
  Max = 'max',               // 最大值模式
}
```

### 动画遮罩系统

```typescript
// 骨骼动画遮罩
interface BoneAnimationMask extends AnimationMask {
  includedBones: string[];    // 包含的骨骼
  excludedBones: string[];    // 排除的骨骼

  // 基于路径的骨骼匹配
  includePaths: string[];     // 包含的骨骼路径
  excludePaths: string[];     // 排除的骨骼路径

  // 遮罩配置
  influence: number;          // 遮罩影响范围 (0-1)
  invert?: boolean;           // 是否反转遮罩
}

// 物理动画遮罩
interface PhysicsAnimationMask extends AnimationMask {
  physicsBones: string[];     // 物理骨骼列表
  constraints: PhysicsConstraint[];  // 物理约束
  simulationType: PhysicsSimulationType;  // 模拟类型
}

enum PhysicsSimulationType {
  Rigid = 'rigid',            // 刚体模拟
  Cloth = 'cloth',            // 布料模拟
  Rope = 'rope',              // 绳索模拟
  SoftBody = 'softbody',      // 软体模拟
}
```

## 状态机系统

### 状态机定义

```typescript
// 动画状态机
interface AnimationStateMachine {
  name: string;                        // 状态机名称
  states: Record<string, AnimationState>;  // 状态集合
  transitions: AnimationTransition[];      // 转换集合
  parameters: StateMachineParameter[];     // 参数集合
  layers?: StateMachineLayer[];            // 分层状态机
  defaultState: string;                // 默认状态
}

// 动画状态
interface AnimationState {
  name: string;                        // 状态名称
  animation: string;                   // 关联的动画
  speed?: number;                      // 播放速度
  loopMode?: LoopMode;                 // 循环模式
  transitTo?: string;                  // 自动转换状态
  transitTime?: number;                // 转换时间

  // 状态行为
  onEnter?: string;                    // 进入状态时执行
  onExit?: string;                     // 离开状态时执行
  onUpdate?: string;                   // 状态更新时执行

  // 子状态机
  subStateMachine?: AnimationStateMachine;

  // 动画混合
  blendAnimations?: StateAnimationBlend[];
}

// 动画转换
interface AnimationTransition {
  name: string;                        // 转换名称
  fromState: string;                   // 源状态
  toState: string;                     // 目标状态
  duration: number;                    // 转换时间
  conditions?: TransitionCondition[];  // 转换条件

  // 转换配置
  exitTime?: number;                   // 退出时间
  hasExitTime?: boolean;               // 是否有退出时间
  canTransitionToSelf?: boolean;       // 是否可以转换到自己

  // 混合配置
  blendMode?: AnimationBlendMode;      // 混合模式
  interruptible?: boolean;             // 是否可中断

  // 动画事件
  onTransitionStart?: string;          // 转换开始事件
  onTransitionEnd?: string;            // 转换结束事件
}
```

### 状态机参数

```typescript
// 状态机参数
interface StateMachineParameter {
  name: string;                        // 参数名称
  type: ParameterType;                 // 参数类型
  defaultValue: any;                   // 默认值
  value?: any;                         // 当前值

  // 参数配置
  description?: string;                // 参数描述
  range?: [number, number];            // 数值范围（数值类型）
  options?: string[];                  // 可选值（枚举类型）
}

enum ParameterType {
  Bool = 'bool',
  Float = 'float',
  Int = 'int',
  Trigger = 'trigger',
}

// 转换条件
interface TransitionCondition {
  parameter: string;                   // 参数名称
  operator: ComparisonOperator;        // 比较操作符
  value: any;                          // 比较值

  // 条件逻辑
  logicalOperator?: 'and' | 'or';      // 逻辑操作符
  weight?: number;                     // 条件权重
}
```

### 分层状态机

```typescript
// 状态机图层
interface StateMachineLayer {
  name: string;                        // 图层名称
  stateMachine: AnimationStateMachine; // 状态机
  weight: number;                      // 图层权重
  mask?: AnimationMask;                // 动画遮罩
  blending?: LayerBlending;            // 图层混合
}

// 图层混合配置
interface LayerBlending {
  blendMode: AnimationBlendMode;       // 混合模式
  duration: number;                    // 混合时间
  curve: EasingFunction;               // 混合曲线
}
```

## 粒子动画系统

### 粒子系统定义

```typescript
// 粒子系统
interface ParticleSystem {
  name: string;                        // 系统名称
  capacity: number;                    // 粒子容量
  duration: number;                    // 粒子生命周期
  looping: boolean;                    // 是否循环
  prewarm?: boolean;                   // 是否预热

  // 发射器配置
  emitter: ParticleEmitter;            // 粒子发射器

  // 粒子模块
  modules: ParticleModule[];           // 粒子模块列表

  // 渲染配置
  renderer: ParticleRenderer;          // 粒子渲染器

  // 物理配置
  physics?: ParticlePhysics;           // 粒子物理
}

// 粒子发射器
interface ParticleEmitter {
  type: EmitterType;                   // 发射器类型
  rate: ParticleValue<number>;         // 发射速率
  count: ParticleValue<number>;        // 粒子数量

  // 形状配置
  shape: ParticleShape;                // 发射形状

  // 发射配置
  enabled: boolean;                    // 是否启用
  startTime: number;                   // 开始时间
  duration: number;                    // 持续时间
  repeatDelay?: number;                // 重复延迟
}

enum EmitterType {
  Point = 'point',                     // 点发射器
  Line = 'line',                       // 线发射器
  Circle = 'circle',                   // 圆发射器
  Sphere = 'sphere',                   // 球发射器
  Cone = 'cone',                       // 锥发射器
  Box = 'box',                         // 盒发射器
  Mesh = 'mesh',                       // 网格发射器
  SkinnedMesh = 'skinned_mesh',        // 蒙皮网格发射器
}
```

### 粒子模块系统

```typescript
// 粒子模块基类
interface ParticleModule {
  name: string;                        // 模块名称
  type: ModuleType;                    // 模块类型
  enabled: boolean;                    // 是否启用
  order: number;                       // 执行顺序
}

enum ModuleType {
  Initialize = 'initialize',           // 初始化模块
  Update = 'update',                   // 更新模块
  Render = 'render',                   // 渲染模块
  Event = 'event',                     // 事件模块
}

// 粒子值（支持常数、曲线、随机）
interface ParticleValue<T> {
  type: 'constant' | 'curve' | 'random'; // 值类型
  constant?: T;                        // 常数值
  curve?: AnimationCurve<T>;           // 曲线值
  random?: ParticleRandom<T>;          // 随机值
}

// 随机值配置
interface ParticleRandom<T> {
  min: T;                              // 最小值
  max: T;                              // 最大值
  distribution?: 'uniform' | 'normal'; // 分布类型
}

// 初始化模块
interface ParticleInitializeModule extends ParticleModule {
  // 生命周期
  startLifetime: ParticleValue<number>; // 初始生命周期

  // 速度
  startSpeed: ParticleValue<number>;   // 初始速度

  // 大小
  startSize: ParticleValue<number>;    // 初始大小

  // 旋转
  startRotation: ParticleValue<number>; // 初始旋转

  // 颜色
  startColor: ParticleValue<Color>;    // 初始颜色
}

// 更新模块
interface ParticleUpdateModule extends ParticleModule {
  // 力场
  force?: ParticleForceField;          // 力场

  // 速度限制
  velocityLimit?: ParticleValue<number>; // 速度限制

  // 阻尼
  damping?: ParticleValue<number>;     // 阻尼系数

  // 大小变化
  sizeOverLifetime: ParticleValue<number>; // 生命周期大小变化

  // 颜色变化
  colorOverLifetime: AnimationCurve<Color>; // 生命周期颜色变化

  // 旋转变化
  rotationOverLifetime: ParticleValue<number>; // 生命周期旋转变化
}
```

### 粒子物理系统

```typescript
// 粒子物理
interface ParticlePhysics {
  enabled: boolean;                    // 是否启用物理
  gravity: Vector3;                    // 重力
  damping: number;                     // 阻尼

  // 碰撞检测
  collision?: ParticleCollision;       // 碰撞配置

  // 约束
  constraints?: ParticleConstraint[];  // 约束列表
}

// 粒子碰撞
interface ParticleCollision {
  type: CollisionType;                 // 碰撞类型
  planes: ParticleCollisionPlane[];    // 碰撞平面
  damping?: number;                    // 碰撞阻尼
  bounce?: number;                     // 弹性系数
  lifetimeLoss?: number;               // 生命周期损失
}

enum CollisionType {
  Plane = 'plane',                     // 平面碰撞
  Sphere = 'sphere',                   // 球体碰撞
  Mesh = 'mesh',                       // 网格碰撞
}

// 粒子约束
interface ParticleConstraint {
  type: ConstraintType;                // 约束类型
  strength: number;                    // 约束强度

  // 约束参数
  parameters: Record<string, any>;
}

enum ConstraintType {
  Position = 'position',               // 位置约束
  Velocity = 'velocity',               // 速度约束
  Rotation = 'rotation',               // 旋转约束
  Size = 'size',                       // 大小约束
}
```

## 动画曲线系统

### 动画曲线定义

```typescript
// 动画曲线
interface AnimationCurve<T = any> {
  keys: AnimationKey<T>[];             // 关键点
  preWrapMode: WrapMode;               // 前置包装模式
  postWrapMode: WrapMode;              // 后置包装模式
  interpolation?: InterpolationMode;   // 插值模式
}

// 动画关键点
interface AnimationKey<T = any> {
  time: number;                        // 时间
  value: T;                            // 值

  // 贝塞尔控制点
  inTangent?: T;                       // 输入切线
  outTangent?: T;                      // 输出切线

  // 权重（用于有理贝塞尔曲线）
  inWeight?: number;                   // 输入权重
  outWeight?: number;                  // 输出权重

  // 切线模式
  tangentMode?: TangentMode;           // 切线模式
}

enum WrapMode {
  Once = 'once',                       // 播放一次
  Loop = 'loop',                       // 循环
  PingPong = 'ping-pong',              // 来回循环
  Clamp = 'clamp',                     // 钳制
}

enum TangentMode {
  Auto = 'auto',                       // 自动切线
  Linear = 'linear',                   // 线性切线
  Constant = 'constant',               // 常数切线
  Free = 'free',                       // 自由切线
  Broken = 'broken',                   // 断开切线
}
```

### 曲线插值系统

```typescript
// 插值模式
enum InterpolationMode {
  Linear = 'linear',                   // 线性插值
  Step = 'step',                       // 步进插值
  Cubic = 'cubic',                     // 三次样条插值
  Bezier = 'bezier',                   // 贝塞尔插值
  Hermite = 'hermite',                 // Hermite 插值
  Cardinal = 'cardinal',               // Cardinal 插值
  CatmullRom = 'catmull-rom',          // Catmull-Rom 插值
  KochanekBartels = 'kochanek-bartels', // Kochanek-Bartels 插值
}

// 插值函数配置
interface InterpolationConfig {
  mode: InterpolationMode;             // 插值模式
  tension?: number;                    // 张力（Cardinal、Catmull-Rom）
  bias?: number;                       // 偏移（Cardinal、Catmull-Rom）
  continuity?: number;                 // 连续性（Kochanek-Bartels)

  // 样条配置
  splineType?: SplineType;             // 样条类型
  closed?: boolean;                    // 是否闭合
}

enum SplineType {
  Uniform = 'uniform',                 // 均匀样条
  Chordal = 'chordal',                 // 弦长样条
  Centripetal = 'centripetal',         // 向心样条
}
```

## 时间线和播放器

### 动画时间线

```typescript
// 动画时间线
interface AnimationTimeline {
  name: string;                        // 时间线名称
  duration: number;                    // 总时长
  markers: TimelineMarker[];           // 时间线标记
  tracks: TimelineTrack[];             // 时间线轨道

  // 时间控制
  timeScale: number;                   // 时间缩放
  startTime: number;                   // 开始时间
  endTime: number;                     // 结束时间

  // 播放配置
  loopMode: LoopMode;                  // 循环模式
  playDirection: 1 | -1;               // 播放方向
}

// 时间线标记
interface TimelineMarker {
  name: string;                        // 标记名称
  time: number;                        // 标记时间
  type: MarkerType;                    // 标记类型
  color?: Color;                       // 标记颜色
  description?: string;                // 标记描述

  // 标记事件
  event?: string;                      // 触发事件
  parameters?: Record<string, any>;    // 事件参数
}

enum MarkerType {
  Event = 'event',                     // 事件标记
  Comment = 'comment',                 // 注释标记
  Section = 'section',                 // 段落标记
  Cue = 'cue',                         // 提示标记
}

// 时间线轨道
interface TimelineTrack {
  name: string;                        // 轨道名称
  type: TrackType;                     // 轨道类型
  muted: boolean;                      // 是否静音
  solo: boolean;                       // 是否独奏

  // 轨道内容
  clips: AnimationClip[];              // 动画片段
  events: TimelineEvent[];             // 轨道事件
}

enum TrackType {
  Animation = 'animation',             // 动画轨道
  Audio = 'audio',                     // 音频轨道
  Event = 'event',                     // 事件轨道
  Control = 'control',                 // 控制轨道
}
```

### 动画播放器

```typescript
// 动画播放器
interface AnimationPlayer {
  name: string;                        // 播放器名称

  // 播放状态
  state: PlayerState;                  // 播放状态
  time: number;                        // 当前时间
  duration: number;                    // 播放时长

  // 播放控制
  play(time?: number): void;           // 播放
  pause(): void;                       // 暂停
  stop(): void;                        // 停止
  resume(): void;                      // 恢复

  // 跳转控制
  seek(time: number): void;            // 跳转到时间
  previousFrame(): void;               // 上一帧
  nextFrame(): void;                   // 下一帧

  // 播放配置
  setPlaybackSpeed(speed: number): void; // 设置播放速度
  getPlaybackSpeed(): number;          // 获取播放速度
  setLoopMode(mode: LoopMode): void;   // 设置循环模式
  getLoopMode(): LoopMode;             // 获取循环模式

  // 事件处理
  on(event: PlayerEvent, callback: Function): void; // 注册事件
  off(event: PlayerEvent, callback: Function): void; // 移除事件

  // 播放列表
  addClip(clip: AnimationClip): void;  // 添加片段
  removeClip(clip: AnimationClip): void; // 移除片段
  getClips(): AnimationClip[];         // 获取片段列表
}

enum PlayerState {
  Stopped = 'stopped',                 // 停止
  Playing = 'playing',                 // 播放中
  Paused = 'paused',                   // 暂停
  Finished = 'finished',               // 完成
  Error = 'error',                     // 错误
}

enum PlayerEvent {
  Play = 'play',                       // 开始播放
  Pause = 'pause',                     // 暂停
  Stop = 'stop',                       // 停止
  Seek = 'seek',                       // 跳转
  ClipStart = 'clip-start',            // 片段开始
  ClipEnd = 'clip-end',                // 片段结束
  Finished = 'finished',               // 播放完成
  Error = 'error',                     // 播放错误
}
```

## 动画混合系统

### 动画混合器

```typescript
// 动画混合器
interface AnimationMixer {
  name: string;                        // 混合器名称

  // 混合图层
  layers: AnimationMixerLayer[];       // 混合图层

  // 混合树
  blendTree?: AnimationBlendTree;      // 混合树

  // 全局权重
  globalWeight: number;                // 全局权重

  // 混合控制
  blend(to: string, duration: number, curve?: EasingFunction): void;
  setWeight(layerName: string, weight: number): void;
  getWeight(layerName: string): number;

  // 遮罩应用
  applyMask(mask: AnimationMask, layerIndex?: number): void;
  removeMask(layerIndex?: number): void;
}

// 混合图层
interface AnimationMixerLayer {
  name: string;                        // 图层名称
  animation: AnimationClip;            // 动画片段
  weight: number;                      // 图层权重
  blendMode: AnimationBlendMode;       // 混合模式
  additive?: boolean;                  // 是否 additive

  // 播放控制
  speed: number;                       // 播放速度
  time: number;                        // 当前时间

  // 遮罩
  mask?: AnimationMask;                // 动画遮罩

  // 混合控制
  blendWeight: number;                 // 混合权重
  blendDuration: number;               // 混合时间
}
```

### 混合树系统

```typescript
// 动画混合树
interface AnimationBlendTree {
  name: string;                        // 混合树名称
  root: BlendTreeNode;                 // 根节点

  // 参数
  parameters: Record<string, any>;     // 混合参数

  // 计算配置
  updateMode: BlendTreeUpdateMode;     // 更新模式
  normalizeWeights: boolean;           // 是否归一化权重
}

// 混合树节点
interface BlendTreeNode {
  name: string;                        // 节点名称
  type: BlendNodeType;                 // 节点类型

  // 子节点
  children?: BlendTreeNode[];          // 子节点（混合节点）

  // 叶子节点数据
  animation?: AnimationClip;           // 动画片段（叶子节点）

  // 混合配置
  blendParameter?: string;             // 混合参数
  blendThreshold?: number[];           // 混合阈值

  // 节点权重
  weight: number;                      // 节点权重

  // 节点状态
  active: boolean;                     // 是否激活
  time: number;                        // 当前时间
}

enum BlendNodeType {
  Animation = 'animation',             // 动画节点
  Blend1D = 'blend-1d',                // 1D 混合
  Blend2D = 'blend-2d',                // 2D 混合
  BlendDirect = 'blend-direct',        // 直接混合
  BlendTree = 'blend-tree',            // 混合树（子树）
}

// 1D 混合节点
interface Blend1DNode extends BlendTreeNode {
  type: BlendNodeType.Blend1D;
  parameter: string;                   // 混合参数
  threshold: number[];                 // 阈值列表

  // 混合曲线
  blendCurve?: EasingFunction;         // 混合曲线
  adaptiveBlend?: boolean;             // 自适应混合
}

// 2D 混合节点
interface Blend2DNode extends BlendTreeNode {
  type: BlendNodeType.Blend2D;
  parameters: [string, string];        // 混合参数 [x, y]
  samples: Blend2DSample[];            // 采样点

  // 三角化配置
  autoTriangulate: boolean;            // 自动三角化
  triangles?: [number, number, number][]; // 三角形索引
}

// 2D 采样点
interface Blend2DSample {
  animation: AnimationClip;            // 动画片段
  position: [number, number];          // 参数位置
  speed?: number;                      // 播放速度
  cycleOffset?: number;                // 循环偏移
}
```

## 实际应用示例

### 创建基础动画

```typescript
import {
  UsdAnimationClip,
  UsdAnimationTrack,
  UsdKeyframe,
  EasingFunction
} from '@maxellabs/specification';

// 创建位置动画轨道
const positionTrack: UsdAnimationTrack = {
  name: 'position',
  usdPath: 'xformOp:translate',
  usdType: 'float3',
  keyframes: [
    {
      time: 0,
      value: [0, 0, 0],
      outTangent: { x: 0.1, y: 2 }
    },
    {
      time: 1,
      value: [5, 0, 0],
      interpolation: InterpolationMode.Cubic,
      inTangent: { x: 0.9, y: 2 },
      outTangent: { x: 1.1, y: 2 }
    },
    {
      time: 2,
      value: [5, 5, 0],
      interpolation: InterpolationMode.Cubic,
      inTangent: { x: 1.9, y: 2 }
    }
  ],
  enabled: true,
  loopMode: LoopMode.Loop
};

// 创建动画剪辑
const animationClip: UsdAnimationClip = {
  path: '/Animations/Walk',
  typeName: 'Animation',
  active: true,
  attributes: {
    name: { type: UsdDataType.String, value: 'Walk' },
    duration: { type: UsdDataType.Float, value: 2.0 },
    frameRate: { type: UsdDataType.Float, value: 30 },
    loopMode: { type: UsdDataType.Token, value: 'loop' }
  },
  relationships: {},
  metadata: {},
  children: [],
  tracks: [positionTrack]
};
```

### 状态机配置

```typescript
import {
  AnimationStateMachine,
  AnimationState,
  AnimationTransition,
  ParameterType
} from '@maxellabs/specification';

// 创建状态机
const stateMachine: AnimationStateMachine = {
  name: 'CharacterController',
  states: {
    Idle: {
      name: 'Idle',
      animation: 'Idle',
      loopMode: LoopMode.Loop,
      onEnter: 'onIdleEnter',
      onExit: 'onIdleExit'
    },
    Walk: {
      name: 'Walk',
      animation: 'Walk',
      loopMode: LoopMode.Loop,
      speed: 1.2
    },
    Run: {
      name: 'Run',
      animation: 'Run',
      loopMode: LoopMode.Loop,
      speed: 1.8
    },
    Jump: {
      name: 'Jump',
      animation: 'Jump',
      loopMode: LoopMode.Once,
      transitTo: 'Idle',
      transitTime: 0.2
    }
  },
  transitions: [
    {
      name: 'IdleToWalk',
      fromState: 'Idle',
      toState: 'Walk',
      duration: 0.3,
      conditions: [
        {
          parameter: 'isMoving',
          operator: ComparisonOperator.Equals,
          value: true
        },
        {
          parameter: 'speed',
          operator: ComparisonOperator.LessThan,
          value: 5.0,
          logicalOperator: 'and'
        }
      ],
      blendMode: AnimationBlendMode.Override
    },
    {
      name: 'WalkToRun',
      fromState: 'Walk',
      toState: 'Run',
      duration: 0.2,
      conditions: [
        {
          parameter: 'speed',
          operator: ComparisonOperator.GreaterThanOrEqual,
          value: 5.0
        }
      ]
    },
    {
      name: 'AnyToJump',
      fromState: 'any',
      toState: 'Jump',
      duration: 0.1,
      conditions: [
        {
          parameter: 'jumpTrigger',
          operator: ComparisonOperator.Trigger,
          value: true
        }
      ],
      interruptible: false
    }
  ],
  parameters: [
    {
      name: 'isMoving',
      type: ParameterType.Bool,
      defaultValue: false
    },
    {
      name: 'speed',
      type: ParameterType.Float,
      defaultValue: 0.0,
      range: [0.0, 10.0]
    },
    {
      name: 'jumpTrigger',
      type: ParameterType.Trigger,
      defaultValue: false
    }
  ],
  defaultState: 'Idle'
};
```

### 粒子系统配置

```typescript
import {
  ParticleSystem,
  ParticleEmitter,
  ParticleInitializeModule,
  ParticleUpdateModule,
  ParticleValue,
  EmitterType
} from '@maxellabs/specification';

// 创建粒子系统
const particleSystem: ParticleSystem = {
  name: 'FireEffect',
  capacity: 1000,
  duration: 5.0,
  looping: true,
  prewarm: false,

  emitter: {
    type: EmitterType.Cone,
    rate: {
      type: 'constant',
      constant: 100
    },
    count: {
      type: 'constant',
      constant: 500
    },
    shape: {
      type: 'cone',
      angle: 30,
      radius: 0.5,
      length: 2.0
    },
    enabled: true,
    startTime: 0,
    duration: 5.0
  },

  modules: [
    // 初始化模块
    {
      name: 'Initialize',
      type: ModuleType.Initialize,
      enabled: true,
      order: 0,
      startLifetime: {
        type: 'random',
        random: {
          min: 1.0,
          max: 3.0
        }
      },
      startSpeed: {
        type: 'curve',
        curve: {
          keys: [
            { time: 0, value: 5.0 },
            { time: 1, value: 2.0 }
          ],
          preWrapMode: WrapMode.Clamp,
          postWrapMode: WrapMode.Clamp
        }
      },
      startSize: {
        type: 'random',
        random: {
          min: 0.1,
          max: 0.3
        }
      },
      startColor: {
        type: 'random',
        random: {
          min: [1.0, 0.8, 0.2, 1.0], // 黄色
          max: [1.0, 0.4, 0.0, 1.0]  // 红色
        }
      }
    } as ParticleInitializeModule,

    // 更新模块
    {
      name: 'Update',
      type: ModuleType.Update,
      enabled: true,
      order: 1,
      force: {
        type: 'gravity',
        direction: [0, -1, 0],
        magnitude: 9.8
      },
      sizeOverLifetime: {
        type: 'curve',
        curve: {
          keys: [
            { time: 0, value: 1.0 },
            { time: 0.5, value: 1.2 },
            { time: 1, value: 0.0 }
          ],
          preWrapMode: WrapMode.Clamp,
          postWrapMode: WrapMode.Clamp
        }
      },
      colorOverLifetime: {
        keys: [
          { time: 0, value: [1.0, 1.0, 0.0, 1.0] }, // 黄色
          { time: 0.3, value: [1.0, 0.5, 0.0, 1.0] }, // 橙色
          { time: 0.7, value: [0.5, 0.0, 0.0, 0.5] }, // 暗红半透明
          { time: 1.0, value: [0.0, 0.0, 0.0, 0.0] }  // 完全透明
        ],
        preWrapMode: WrapMode.Clamp,
        postWrapMode: WrapMode.Clamp
      }
    } as ParticleUpdateModule
  ],

  renderer: {
    type: 'billboard',
    material: 'ParticleFireMaterial',
    sortingMode: 'by_depth'
  },

  physics: {
    enabled: true,
    gravity: [0, -9.8, 0],
    damping: 0.98,
    collision: {
      type: CollisionType.Plane,
      planes: [
        {
          normal: [0, 1, 0],
          distance: 0
        }
      ],
      bounce: 0.3,
      lifetimeLoss: 0.1
    }
  }
};
```

### 缓动函数使用

```typescript
import {
  EasingFunction,
  ExtendedEasingType,
  EasingConfig
} from '@maxellabs/specification';

// 使用内置缓动函数
const linearEasing: EasingFunction = EasingFunction.Linear;
const bounceEasing: EasingFunction = EasingFunction.BounceOut;

// 使用扩展缓动函数
const cubicBezierEasing: EasingConfig = {
  type: 'cubic-bezier',
  x1: 0.25,
  y1: 0.1,
  x2: 0.25,
  y2: 1
};

const springEasing: EasingConfig = {
  type: 'spring',
  tension: 100,
  friction: 10,
  mass: 1,
  velocity: 0
};

const stepsEasing: EasingConfig = {
  type: 'steps',
  steps: 4,
  stepPosition: 'end'
};

// 应用缓动函数
function applyEasing(t: number, easing: EasingConfig): number {
  switch (easing.type) {
    case 'linear':
      return t;

    case 'cubic-bezier':
      return cubicBezier(t, easing.x1, easing.y1, easing.x2, easing.y2);

    case 'spring':
      return springEasing(t, easing.tension, easing.friction, easing.mass, easing.velocity);

    case 'steps':
      return stepsEasing(t, easing.steps, easing.stepPosition);

    default:
      return t;
  }
}
```

## 性能优化建议

### 1. 关键帧优化

```typescript
// ✅ 推荐：使用合适的关键帧密度
const optimizedTrack: UsdAnimationTrack = {
  name: 'rotation',
  usdPath: 'xformOp:rotateXYZ',
  usdType: 'float3',
  keyframes: [
    { time: 0, value: [0, 0, 0] },
    { time: 1, value: [0, 90, 0] },
    { time: 2, value: [0, 180, 0] }
    // 避免过多的关键帧
  ]
};

// ✅ 推荐：使用循环减少关键帧
const loopTrack: UsdAnimationTrack = {
  name: 'bounce',
  usdPath: 'y_position',
  usdType: 'float',
  keyframes: [
    { time: 0, value: 0 },
    { time: 0.5, value: 1 },
    { time: 1, value: 0 }
  ],
  loopMode: LoopMode.Loop // 自动循环，无需重复关键帧
};
```

### 2. 状态机优化

```typescript
// ✅ 推荐：使用分层状态机
const layeredStateMachine: AnimationStateMachine = {
  name: 'CharacterController',
  states: {
    // 基础移动层
    Idle: { /* ... */ },
    Walk: { /* ... */ },
    Run: { /* ... */ },

    // 上半身动作层（独立）
    UpperBody_Idle: { /* ... */ },
    UpperBody_Aim: { /* ... */ },
    UpperBody_Attack: { /* ... */ }
  },
  layers: [
    {
      name: 'Base',
      stateMachine: baseStateMachine,
      weight: 1.0
    },
    {
      name: 'UpperBody',
      stateMachine: upperBodyStateMachine,
      weight: 1.0,
      mask: upperBodyMask
    }
  ]
};
```

### 3. 粒子系统优化

```typescript
// ✅ 推荐：合理的粒子容量
const optimizedParticleSystem: ParticleSystem = {
  name: 'Smoke',
  capacity: 500, // 根据实际需求设置，避免过大

  // ✅ 推荐：使用预计算
  prewarm: true, // 预热避免初始卡顿

  // ✅ 推荐：使用 LOD
  lods: [
    { distance: 10, rate: 1.0 },
    { distance: 50, rate: 0.5 },
    { distance: 100, rate: 0.2 }
  ]
};
```

## 总结

Specification 动画系统提供了：

1. **完整的 USD 兼容**：原生支持 OpenUSD 动画规范
2. **灵活的状态机**：复杂动画流程控制
3. **高性能粒子系统**：丰富的粒子效果和物理模拟
4. **强大的混合系统**：多层级动画混合和遮罩
5. **丰富的缓动函数**：自定义插值和动画效果
6. **类型安全保证**：TypeScript 完整类型支持

该系统为 3D 动画、UI 动效、粒子效果等各种动画需求提供了统一、高效的解决方案。
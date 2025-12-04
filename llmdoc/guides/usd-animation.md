# USD 动画系统使用指南

## 1. 创建基础动画剪辑

1. **定义动画剪辑**: 使用 `UsdAnimationClip` 定义动画数据
   ```usda
   def "MyAnimation"
   {
       # 动画属性
       custom string maxellabs:name = "Rotation"
       custom float maxellabs:duration = 2.0
       custom float maxellabs:frameRate = 30.0
       custom string maxellabs:loopMode = "repeat"

       # 时间采样数据
       double3 xformOp:rotateY.timeSamples = {
           0: 0,
           60: 180,
           120: 360
       }
   }
   ```

2. **配置动画属性**: 使用 `AnimationProperties` 统一配置
   ```usda
   def "MyAnimation"
   {
       # 基础动画属性
       custom bool maxellabs:animation:enabled = true
       custom float maxellabs:animation:duration = 3.0
       custom bool maxellabs:animation:loop = true
       custom string maxellabs:animation:easing = "ease-in-out"

       # 播放控制
       custom float maxellabs:animation:speed = 1.0
       custom float maxellabs:animation:delay = 0.5
   }
   ```

## 2. 创建关键帧动画

1. **位置动画**: 沿路径移动对象
   ```usda
   def "PositionAnimation"
   {
       custom string maxellabs:targetPrim = "/MyScene/MyObject"
       custom string maxellabs:property = "xformOp:translate"

       # 位置关键帧
       double3 xformOp:translate.timeSamples = {
           0: (0, 0, 0),
           30: (5, 2, 0),
           60: (10, 0, 0),
           90: (5, -2, 0),
           120: (0, 0, 0)
       }
   }
   ```

2. **旋转动画**: 3D 旋转动画
   ```usda
   def "RotationAnimation"
   {
       custom string maxellabs:targetPrim = "/MyScene/MyObject"
       custom string maxellabs:property = "xformOp:rotateY"

       # 旋转关键帧
       double3 xformOp:rotateY.timeSamples = {
           0: 0,
           30: 90,
           60: 180,
           90: 270,
           120: 360
       }
   }
   ```

3. **缩放动画**: 大小变化动画
   ```usda
   def "ScaleAnimation"
   {
       custom string maxellabs:targetPrim = "/MyScene/MyObject"
       custom string maxellabs:property = "xformOp:scale"

       # 缩放关键帧
       double3 xformOp:scale.timeSamples = {
           0: (1, 1, 1),
           30: (1.5, 1.5, 1.5),
           60: (1, 1, 1)
       }
   }
   ```

## 3. 使用缓动函数

1. **内置缓动**: 使用预定义的缓动函数
   ```usda
   def "EasingAnimation"
   {
       # 使用不同的缓动函数
       custom string maxellabs:animation:easing = "linear"      // 线性
       custom string maxellabs:animation:easing = "ease-in"    // 缓入
       custom string maxellabs:animation:easing = "ease-out"   // 缓出
       custom string maxellabs:animation:easing = "ease-in-out" // 缓入缓出
       custom string maxellabs:animation:easing = "bounce"      // 弹跳
   }
   ```

2. **自定义缓动**: 使用贝塞尔曲线定义
   ```usda
   def "CustomEasing"
   {
       # 贝塞尔控制点
       custom float maxellabs:animation:bezier:p1x = 0.25
       custom float maxellabs:animation:bezier:p1y = 0.1
       custom float maxellabs:animation:bezier:p2x = 0.25
       custom float maxellabs:animation:bezier:p2y = 1.0
   }
   ```

## 4. 管理动画状态

1. **动画状态机**: 定义复杂的状态转换
   ```usda
   def "AnimationStateMachine"
   {
       custom string maxellabs:animation:type = "state-machine"

       def "Idle"
       {
           custom string maxellabs:animation:initial = "true"
       }

       def "Walking"
       {
           custom string maxellabs:animation:transition = "Idle"
           custom float maxellabs:animation:condition:parameter = "velocity"
           custom float maxellabs:animation:condition:value = 0.1
       }
   }
   ```

2. **动画事件**: 在特定时间触发事件
   ```usda
   def "AnimationWithEvents"
   {
       # 动画数据
       double3 xformOp:translate.timeSamples = {
           0: (0, 0, 0),
           60: (5, 0, 0),
           120: (10, 0, 0)
       }

       # 事件定义
       custom dictionary maxellabs:animation:events = {
           "30": {
               "type": "sound",
               "name": "footstep.wav"
           },
           "60": {
               "type": "particle",
               "name": "dust_particles"
           }
       }
   }
   ```

## 5. 创建粒子动画

1. **粒子发射器**: 定义粒子系统
   ```usda
   def "FireParticles"
   {
       custom string maxellabs:particle:type = "emitter"
       custom float3 maxellabs:particle:position = (0, 2, 0)
       custom float maxellabs:particle:rate = 100.0
       custom float maxellabs:particle:duration = 2.0

       # 粒子动画
       float3[] maxellabs:particle:velocity = [(0, 1, 0), (0.1, 1.1, 0.1), (-0.1, 1.1, -0.1)]
       float[] maxellabs:particle:lifetime = [1.0, 2.0]
   }
   ```

2. **物理动画**: 集成物理模拟
   ```usda
   def "PhysicsAnimation"
   {
       custom string maxellabs:animation:type = "physics"
       custom string maxellabs:physics:targetPrim = "/MyScene/FallingObject"
       custom float3 maxellabs:physics:gravity = (0, -9.81, 0)
       custom float maxellabs:physics:bounce = 0.7
       custom float maxellabs:physics:friction = 0.3
   }
   ```

## 6. 集成和优化

1. **动画混合**: 混合多个动画轨道
   ```usda
   def "AnimationBlend"
   {
       custom string maxellabs:animation:blendMode = "add"
       custom float maxellabs:animation:weight = 0.5

       # 混合的动画数据
       double3 xformOp:translate.timeSamples = {
           0: (0, 0, 0),
           60: (2, 0, 0)
       }
   }
   ```

2. **动画优化**: 使用 LOD 和实例化
   ```usda
   def "OptimizedAnimation"
   {
       # LOD 配置
       custom string maxellabs:animation:lod:level = "high"
       custom float maxellabs:animation:lod:distance = 10.0

       # 实例化配置
       custom bool maxellabs:animation:instancing = true
       custom int maxellabs:animation:instanceCount = 100
   }
   ```

## 7. 调试和验证

1. **可视化曲线**: 检查动画曲线的平滑度
2. **性能监控**: 监控动画对性能的影响
3. **循环检查**: 确保动画循环的平滑性
4. **碰撞检测**: 验证动画过程中的碰撞行为
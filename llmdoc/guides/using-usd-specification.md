# 使用 USD 规范系统

## 1. 创建基础 USD 场景

1. **定义场景文件**: 创建 `.usda` 文件，定义场景结构和属性
   ```usda
   #usda 1.0
   (
       defaultPrim = "MyScene"
       doc = "My 3D Scene"
       timeCodesPerSecond = 24
   )

   def Scope "MyScene"
   {
       # 在这里定义场景内容
   }
   ```

2. **添加几何体**: 定义 Mesh 类型的 Prim
   ```usda
   def Mesh "Cube"
   {
       int[] faceVertexCounts = [4, 4, 4, 4, 4, 4]
       int[] faceVertexIndices = [0, 1, 3, 2, 2, 3, 5, 4, 4, 5, 7, 6, 6, 7, 1, 0, 1, 7, 5, 3, 6, 0, 2, 4]
       point3f[] points = [(-1, -1, 1), (1, -1, 1), (-1, 1, 1), (1, 1, 1), (-1, 1, -1), (1, 1, -1), (-1, -1, -1), (1, -1, -1)]

       # 变换属性
       double3 xformOp:translate = (0, 1, 0)
       uniform token[] xformOpOrder = ["xformOp:translate"]
   }
   ```

## 2. 使用 Maxellabs 扩展

1. **添加自定义属性**: 使用 `custom` 前缀添加扩展功能
   ```usda
   def Mesh "MyObject"
   {
       # 标准 USD 属性
       point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]

       # Maxellabs 扩展属性
       custom bool maxellabs:visible = true
       custom int maxellabs:renderOrder = 0
       custom string maxellabs:blendMode = "normal"
       custom bool maxellabs:castShadows = true
   }
   ```

2. **配置交互属性**: 添加交互相关配置
   ```usda
   def Mesh "InteractiveObject"
   {
       # 基础几何
       point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]

       # 交互配置
       custom bool maxellabs:interaction:enabled = true
       custom bool maxellabs:interaction:hover:enabled = true
       custom color4f maxellabs:interaction:hover:highlightColor = (1, 1, 0, 0.3)
       custom string maxellabs:interaction:click:sound = "click.wav"
   }
   ```

## 3. 配置动画系统

1. **创建动画剪辑**: 定义动画数据和关键帧
   ```usda
   def "RotationAnimation"
   {
       custom string maxellabs:targetPrim = "/MyScene/MyObject"
       custom string maxellabs:property = "xformOp:rotateY"
       custom float maxellabs:duration = 4.0
       custom bool maxellabs:loop = true

       # 时间采样数据
       double3 xformOp:rotateY.timeSamples = {
           0: 0,
           120: 360
       }
   }
   ```

2. **使用曲线动画**: 通过关键帧定义平滑动画
   ```usda
   def "PositionAnimation"
   {
       custom string maxellabs:targetPrim = "/MyScene/MyObject"
       custom string maxellabs:property = "xformOp:translate"
       custom float maxellabs:duration = 2.0

       # 关键帧动画
       double3 xformOp:translate.timeSamples = {
           0: (0, 0, 0),
           60: (5, 2, 0),
           120: (10, 0, 0)
       }
   }
   ```

## 4. 管理材质和着色器

1. **定义材质**: 创建 PBR 材质定义
   ```usda
   def Material "MyMaterial"
   {
       token outputs:surface.connect = </MyMaterial/Shader.outputs:surface>

       def Shader "Shader"
       {
           uniform token info:id = "UsdPreviewSurface"
           color3f inputs:diffuseColor = (0.8, 0.8, 0.8)
           float inputs:metallic = 0.0
           float inputs:roughness = 0.5
           float inputs:opacity = 1.0
           token outputs:surface
       }
   }
   ```

2. **绑定材质**: 将材质应用到几何体
   ```usda
   def Mesh "MyObject"
   {
       # 几何数据
       point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]

       # 材质绑定
       rel material:binding = </MyMaterial>
   }
   ```

## 5. 使用场景引用和组合

1. **引用外部资产**: 使用 reference 组合外部模型
   ```usda
   def "Building" (
       references = @./building.usda@</Building>
   )
   {
       # 可以覆盖或添加属性
       custom bool maxellabs:visible = true
   }
   ```

2. **分层场景**: 使用 subLayer 组织场景层次
   ```usda
   #usda 1.0
   (
       subLayers = [
           "@./environment.usda@",
           "@./characters.usda@"
       ]
       defaultPrim = "MainScene"
   )
   ```

## 6. 验证场景完整性

1. **检查语法**: 确保 USD 文件格式正确
2. **验证路径**: 检查所有引用路径的有效性
3. **测试渲染**: 在 3D 引擎中加载和渲染场景
4. **性能检查**: 监控场景加载和渲染性能
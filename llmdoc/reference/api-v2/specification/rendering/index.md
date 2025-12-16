# Specification 渲染规范 API 文档

## 概述

Specification 渲染规范提供了完整的 3D 渲染管线定义，包括几何体、材质、着色器、光照、阴影等所有渲染相关组件。该规范基于现代渲染 API 设计，深度集成 USD 标准，支持 PBR、卡通渲染、线框渲染等多种渲染模式。

## 核心特性

- **USD 几何体兼容**: 完全支持 OpenUSD 几何体规范
- **PBR 材质系统**: 基于物理的渲染材质
- **着色器网络**: 灵活的节点化着色器编辑
- **多渲染管线**: 前向、延迟、自定义渲染管线
- **光照阴影系统**: 完整的光照和阴影支持
- **LOD 系统**: 多细节层次优化

## 几何体系统

### 网格几何体

```typescript
// 网格几何体基础定义
interface MeshGeometry extends GeometryPrim {
  attributes: {
    points: UsdValue;                 // 顶点位置 (Point3f[])
    faceVertexIndices: UsdValue;      // 面顶点索引 (int[])
    faceVertexCounts: UsdValue;       // 每个面的顶点数 (int[])

    // 可选属性
    normals?: UsdValue;               // 法线 (Normal3f[])
    uvs?: UsdValue;                   // UV 坐标 (float2[])
    colors?: UsdValue;                // 顶点颜色 (Color3f[])
    tangents?: UsdValue;              // 切线 (Vector3f[])
    bitangents?: UsdValue;            // 双切线 (Vector3f[])
  };

  properties: GeometryProperties;     // 几何体属性
  materialBinding?: MaterialBinding[]; // 材质绑定
  lodConfig?: LODConfiguration;       // LOD 配置
}

// 几何体属性
interface GeometryProperties {
  boundingBox: CoreBoundingBox;       // 边界框
  boundingSphere: CommonBounds;       // 边界球

  // 拓扑信息
  topology: TopologyInfo;             // 拓扑信息

  // 细分属性
  subdivision?: SubdivisionProperties; // 细分属性

  // 实例化支持
  instancing?: InstancingProperties;  // 实例化属性

  // 流体网格（可选）
  fluidMesh?: FluidMeshProperties;    // 流体网格属性
}

// 拓扑信息
interface TopologyInfo {
  topology: TopologyType;             // 拓扑类型
  winding: WindingOrder;              // 绕序
  indexFormat: IndexFormat;           // 索引格式
  vertexFormat: VertexFormat;         // 顶点格式
}

enum TopologyType {
  TriangleList = 'triangle-list',     // 三角形列表
  TriangleStrip = 'triangle-strip',   // 三角形条带
  TriangleFan = 'triangle-fan',       // 三角形扇
  LineList = 'line-list',             // 线段列表
  LineStrip = 'line-strip',           // 线段条带
  PointList = 'point-list',           // 点列表
  PatchList = 'patch-list',           // 补丁列表
}

enum WindingOrder {
  Clockwise = 'cw',                   // 顺时针
  CounterClockwise = 'ccw',           // 逆时针
}
```

### 细分曲面

```typescript
// 细分属性
interface SubdivisionProperties {
  enabled: boolean;                   // 是否启用细分

  // 细分级别
  levels: SubdivisionLevels;          // 细分级别

  // 细分器
  scheme: SubdivisionScheme;          // 细分方案

  // 边界插值
  boundaryInterpolation: BoundaryInterpolation; // 边界插值

  // 自适应细分
  adaptive?: AdaptiveSubdivision;     // 自适应细分
}

// 细分级别
interface SubdivisionLevels {
  uniform?: number;                   // 均匀细分级别
  edge?: number[];                    // 边细分级别
  vertex?: number[];                  // 顶点细分级别

  // 视图相关细分
  screenSpace?: boolean;              // 是否屏幕空间细分
  maxScreenSpaceError?: number;       // 最大屏幕空间误差
}

enum SubdivisionScheme {
  CatmullClark = 'catmull-clark',     // Catmull-Clark 细分
  Loop = 'loop',                      // Loop 细分（三角形）
  Bilinear = 'bilinear',              // 双线性细分
  Linear = 'linear',                  // 线性细分
}

enum BoundaryInterpolation {
  EdgeOnly = 'edge-only',             // 仅边
  EdgeAndCorner = 'edge-and-corner',  // 边和角
  AlwaysSharp = 'always-sharp',       // 总是锐利
}
```

### LOD 系统

```typescript
// LOD 配置
interface LODConfiguration {
  enabled: boolean;                   // 是否启用 LOD
  levels: LODLevel[];                 // LOD 级别

  // 切换配置
  switchMode: LODSwitchMode;          // 切换模式
  hysteresis?: number;                // 防抖动范围

  // 屏幕空间 LOD
  screenSize?: number[];              // 屏幕尺寸阈值

  // 距离 LOD
  distances?: number[];               // 距离阈值
}

// LOD 级别
interface LODLevel {
  level: number;                      // LOD 级别
  geometry?: string;                  // 几何体引用
  material?: string;                  // 材质引用

  // 简化配置
  simplification?: SimplificationSettings; // 简化设置

  // 渐变过渡
  crossfade?: CrossfadeSettings;      // 渐变设置
}

enum LODSwitchMode {
  Distance = 'distance',              // 距离切换
  ScreenSize = 'screen-size',         // 屏幕尺寸切换
  Performance = 'performance',        // 性能切换
  Manual = 'manual',                  // 手动切换
}
```

### 实例化渲染

```typescript
// 实例化属性
interface InstancingProperties {
  enabled: boolean;                   // 是否启用实例化
  count: number;                      // 实例数量

  // 实例数据
  instanceData: InstanceData[];       // 实例数据

  // 渲染配置
  cullingMode: InstanceCullingMode;   // 剔除模式
  sorting?: InstanceSorting;          // 排序配置

  // 动态实例
  dynamic?: boolean;                  // 是否动态实例
  buffer?: InstanceBuffer;            // 实例缓冲区
}

// 实例数据
interface InstanceData {
  transform: Matrix4Like;             // 变换矩阵
  color?: ColorLike;                  // 颜色
  uvScale?: Vector2Like;              // UV 缩放
  uvOffset?: Vector2Like;             // UV 偏移

  // 自定义数据
  customData?: Record<string, any>;   // 自定义属性
}

enum InstanceCullingMode {
  None = 'none',                      // 无剔除
  Frustum = 'frustum',                // 视锥剔除
  Distance = 'distance',              // 距离剔除
  Occlusion = 'occlusion',            // 遮挡剔除
}
```

## 材质系统

### 基础材质

```typescript
// 材质基础接口
interface IMaterial extends MaterialPrim {
  attributes: {
    name: UsdValue;                   // 材质名称 (string)
    materialType: UsdValue;           // 材质类型 (MaterialType)
    doubleSided: UsdValue;            // 是否双面 (bool)
    opacity: UsdValue;                // 透明度 (float)
    alphaMode: UsdValue;              // 透明模式 (AlphaMode)
    alphaCutoff?: UsdValue;           // 透明度阈值 (float)
  };

  shaderNetwork: ShaderNetwork;       // 着色器网络
  properties: MaterialProperties;     // 材质属性
  renderState?: MaterialRenderState;  // 渲染状态
}

// 材质类型
enum MaterialType {
  Standard = 'standard',              // 标准材质
  Unlit = 'unlit',                    // 无光照材质
  Toon = 'toon',                      // 卡通材质
  Hair = 'hair',                      // 头发材质
  Skin = 'skin',                      // 皮肤材质
  Cloth = 'cloth',                    // 布料材质
  Glass = 'glass',                    // 玻璃材质
  Metal = 'metal',                    // 金属材质
  ClearCoat = 'clearcoat',            // 清漆材质
  Subsurface = 'subsurface',          // 次表面散射材质
  Volume = 'volume',                  // 体积材质
  Decal = 'decal',                    // 贴花材质
  Terrain = 'terrain',                // 地形材质
}

// 透明模式
enum AlphaMode {
  Opaque = 'opaque',                  // 不透明
  Mask = 'mask',                      // 遮罩
  Blend = 'blend',                    // 混合
  Dither = 'dither',                  // 抖动
}
```

### 着色器网络

```typescript
// 着色器网络
interface ShaderNetwork {
  nodes: Record<string, ShaderNode>;  // 着色器节点
  connections: ShaderConnection[];    // 节点连接
  outputNode: string;                 // 输出节点

  // 网络属性
  version: string;                    // 网络版本
  description?: string;               // 描述
}

// 着色器节点
interface ShaderNode {
  type: ShaderNodeType;               // 节点类型
  category: ShaderNodeCategory;       // 节点分类

  // 节点属性
  parameters: Record<string, ShaderParameter>; // 节点参数
  inputs: Record<string, ShaderInput>;         // 输入接口
  outputs: Record<string, ShaderOutput>;       // 输出接口

  // 节点配置
  position: Vector2Like;              // 节点位置
  enabled: boolean;                   // 是否启用
  preview?: ShaderPreview;            // 预览配置
}

enum ShaderNodeType {
  // 输入节点
  Input = 'input',
  Texture = 'texture',
  Cubemap = 'cubemap',
  Constant = 'constant',

  // 数学节点
  Math = 'math',
  Vector = 'vector',
  Matrix = 'matrix',

  // 颜色节点
  Color = 'color',
  HSV = 'hsv',
  Gradient = 'gradient',

  // 几何节点
  Position = 'position',
  Normal = 'normal',
  UV = 'uv',
  Tangent = 'tangent',

  // 工具节点
  Mix = 'mix',
  Clamp = 'clamp',
  Remap = 'remap',
  Noise = 'noise',

  // 输出节点
  Output = 'output',
  SubSurfaceOutput = 'subsurface_output',
}
```

### 节点连接系统

```typescript
// 着色器连接
interface ShaderConnection {
  fromNode: string;                   // 源节点
  fromOutput: string;                 // 源输出接口
  toNode: string;                     // 目标节点
  toInput: string;                    // 目标输入接口

  // 连接属性
  priority: number;                   // 连接优先级
  enabled: boolean;                   // 是否启用
}

// 着色器参数
interface ShaderParameter {
  type: ShaderParameterType;          // 参数类型
  value: any;                         // 参数值
  defaultValue?: any;                 // 默认值

  // 参数配置
  min?: number;                       // 最小值
  max?: number;                       // 最大值
  step?: number;                      // 步长
  options?: string[];                 // 选项列表

  // UI 配置
  displayName?: string;               // 显示名称
  description?: string;               // 描述
  group?: string;                     // 参数组
  condition?: string;                 // 显示条件
}

enum ShaderParameterType {
  Float = 'float',
  Vector2 = 'vector2',
  Vector3 = 'vector3',
  Vector4 = 'vector4',
  Color = 'color',
  Texture = 'texture',
  Cubemap = 'cubemap',
  Boolean = 'boolean',
  Integer = 'integer',
  Enum = 'enum',
}

// 着色器输入接口
interface ShaderInput {
  type: ShaderParameterType;          // 输入类型
  defaultValue: any;                  // 默认值
  connection?: ShaderConnection;      // 连接的节点

  // 输入配置
  required: boolean;                  // 是否必需
  displayName?: string;               // 显示名称
  description?: string;               // 描述
}

// 着色器输出接口
interface ShaderOutput {
  type: ShaderParameterType;          // 输出类型
  value?: any;                        // 输出值（仅用于预览）

  // 输出配置
  displayName?: string;               // 显示名称
  description?: string;               // 描述
}
```

### PBR 材质属性

```typescript
// PBR 材质属性
interface PBRMaterialProperties extends MaterialProperties {
  // 基础属性
  baseColor: ColorLike;               // 基础颜色
  baseColorTexture?: TextureReference; // 基础颜色贴图
  baseColorUVTransform?: UVTransform; // UV 变换

  // 金属度
  metallic: number;                   // 金属度 (0-1)
  metallicTexture?: TextureReference; // 金属度贴图
  metallicTextureChannel?: TextureChannel; // 金属度通道

  // 粗糙度
  roughness: number;                  // 粗糙度 (0-1)
  roughnessTexture?: TextureReference; // 粗糙度贴图
  roughnessTextureChannel?: TextureChannel; // 粗糙度通道

  // 法线
  normalScale: number;                // 法线强度
  normalTexture?: TextureReference;   // 法线贴图
  normalUVTransform?: UVTransform;    // 法线 UV 变换

  // 遮挡
  occlusionStrength: number;          // 遮挡强度
  occlusionTexture?: TextureReference; // 遮挡贴图
  occlusionTextureChannel?: TextureChannel; // 遮挡通道

  // 自发光
  emissiveColor: ColorLike;           // 自发光颜色
  emissiveIntensity: number;          // 自发光强度
  emissiveTexture?: TextureReference; // 自发光贴图

  // 透明度
  alphaMode: AlphaMode;               // 透明模式
  alphaCutoff: number;                // 透明度阈值
  alphaTexture?: TextureReference;    // 透明度贴图
}

// UV 变换
interface UVTransform {
  offset: Vector2Like;                // UV 偏移
  scale: Vector2Like;                 // UV 缩放
  rotation: number;                   // UV 旋转

  // 高级变换
  tiling?: Vector2Like;               // UV 平铺
  mirror?: boolean;                   // 是否镜像
  wrapU?: TextureWrapMode;            // U 方向包装
  wrapV?: TextureWrapMode;            // V 方向包装
}

enum TextureChannel {
  Red = 'r',
  Green = 'g',
  Blue = 'b',
  Alpha = 'a',
}
```

## 渲染状态系统

### 渲染状态

```typescript
// 材质渲染状态
interface MaterialRenderState {
  // 深度状态
  depth: DepthState;                  // 深度测试状态

  // 模板状态
  stencil: StencilState;              // 模板测试状态

  // 混合状态
  blend: BlendState;                  // 混合状态

  // 剔除状态
  cull: CullState;                    // 剔除状态

  // 多重采样
  multisample: MultisampleState;      // 多重采样状态

  // 填充模式
  fillMode: FillMode;                 // 填充模式

  // 光照模式
  lightingMode: LightingMode;         // 光照模式
}

// 深度状态
interface DepthState {
  enabled: boolean;                   // 是否启用深度测试
  writeEnabled: boolean;              // 是否写入深度
  compareFunction: RHICompareFunction; // 深度比较函数

  // 深度偏移
  bias?: number;                      // 深度偏移
  slopeBias?: number;                 // 斜率偏移

  // 深度范围
  near?: number;                      // 近平面深度
  far?: number;                       // 远平面深度
}

// 模板状态
interface StencilState {
  enabled: boolean;                   // 是否启用模板测试
  frontFace: StencilOperation;        // 前面操作
  backFace: StencilOperation;         // 背面操作

  // 模板参考值
  reference: number;                  // 参考值
  readMask: number;                   // 读取掩码
  writeMask: number;                  // 写入掩码
}

interface StencilOperation {
  compareFunction: RHICompareFunction; // 比较函数
  failOperation: RHStencilOperation;  // 测试失败操作
  passOperation: RHStencilOperation;  // 测试通过操作
  depthFailOperation: RHStencilOperation; // 深度失败操作
}
```

### 混合状态

```typescript
// 混合状态
interface BlendState {
  enabled: boolean;                   // 是否启用混合
  color: ColorBlendState;             // 颜色混合
  alpha: AlphaBlendState;             // Alpha 混合

  // 混合因子
  constantColor?: ColorLike;          // 常量混合颜色

  // 高级混合
  logicOperation?: RHLogicOperation;  // 逻辑操作
}

// 颜色混合状态
interface ColorBlendState {
  operation: RHIBlendOperation;       // 混合操作
  sourceFactor: RHIBlendFactor;       // 源混合因子
  destinationFactor: RHIBlendFactor;  // 目标混合因子
}

// Alpha 混合状态
interface AlphaBlendState {
  operation: RHIBlendOperation;       // 混合操作
  sourceFactor: RHIBlendFactor;       // 源混合因子
  destinationFactor: RHIBlendFactor;  // 目标混合因子
}

// 剔除状态
interface CullState {
  enabled: boolean;                   // 是否启用剔除
  mode: RHICullMode;                  // 剔除模式
  frontFace: RHIFrontFace;            // 前面方向
}
```

### 渲染管线

```typescript
// 渲染管线
interface RenderPipeline {
  name: string;                       // 管线名称
  type: RenderPipelineType;           // 管线类型

  // 渲染阶段
  stages: RenderStage[];              // 渲染阶段

  // 管线配置
  configuration: PipelineConfiguration; // 管线配置

  // 资源绑定
  resourceBindings: ResourceBinding[]; // 资源绑定

  // 渲染目标
  renderTargets: RenderTarget[];      // 渲染目标
}

enum RenderPipelineType {
  Forward = 'forward',                // 前向渲染
  Deferred = 'deferred',              // 延迟渲染
  ForwardPlus = 'forward-plus',       // Forward+ 渲染
  TileDeferred = 'tile-deferred',     // 分块延迟渲染
  Clustered = 'clustered',            // 聚类渲染
  RayTracing = 'ray-tracing',         // 光线追踪
  Hybrid = 'hybrid',                  // 混合渲染
}

// 渲染阶段
interface RenderStage {
  name: string;                       // 阶段名称
  type: RenderStageType;              // 阶段类型
  order: number;                      // 执行顺序

  // 渲染配置
  renderTargets: RenderTarget[];      // 渲染目标
  clearFlags: ClearFlags;             // 清除标志

  // 渲染状态
  renderState: MaterialRenderState;   // 渲染状态

  // 着色器
  shaders: ShaderStage[];             // 着色器阶段

  // 过滤器
  filters: RenderFilter[];            // 渲染过滤器
}

enum RenderStageType {
  Base = 'base',                      // 基础渲染
  Shadow = 'shadow',                  // 阴影渲染
  Reflection = 'reflection',          // 反射渲染
  Refraction = 'refraction',          // 折射渲染
  Transparent = 'transparent',        // 透明渲染
  Overlay = 'overlay',                // 覆盖渲染
  PostProcess = 'post-process',       // 后处理
  UI = 'ui',                          // UI 渲染
  Debug = 'debug',                    // 调试渲染
}
```

## 光照系统

### 光源定义

```typescript
// 光源基础接口
interface Light extends UsdPrim {
  attributes: {
    // 基础属性
    color: UsdValue;                  // 光源颜色 (Color3f)
    intensity: UsdValue;              // 光照强度 (float)
    enable: UsdValue;                 // 是否启用 (bool)

    // 影响范围
    diffuse: UsdValue;                // 漫反射影响 (float)
    specular: UsdValue;               // 镜面反射影响 (float)

    // 阴影配置
    enableShadows: UsdValue;          // 是否投射阴影 (bool)
    shadowBias?: UsdValue;            // 阴影偏移 (float)
    shadowSlopeBias?: UsdValue;       // 阴影斜率偏移 (float)
  };

  properties: LightProperties;        // 光源属性
  transform: ITransform;              // 光源变换
}

// 光源属性
interface LightProperties {
  type: LightType;                    // 光源类型

  // 范围配置
  range: number;                      // 光照范围
  attenuation: LightAttenuation;      // 衰减配置

  // 光照配置
  innerConeAngle?: number;            // 内锥角（聚光灯）
  outerConeAngle?: number;            // 外锥角（聚光灯）

  // 阴影配置
  shadow: ShadowProperties;           // 阴影属性

  // Cookie 配置
  cookie?: CookieProperties;          // Cookie 属性

  // 体积光
  volumetric?: VolumetricProperties;  // 体积光属性
}

enum LightType {
  Directional = 'directional',        // 方向光
  Point = 'point',                    // 点光源
  Spot = 'spot',                      // 聚光灯
  Area = 'area',                      // 面光源
  Environment = 'environment',        // 环境光
  Sky = 'sky',                        // 天空光
  Volume = 'volume',                  // 体积光
}
```

### 光照衰减

```typescript
// 光照衰减
interface LightAttenuation {
  type: AttenuationType;              // 衰减类型

  // 距离衰减
  constant: number;                   // 常数衰减
  linear: number;                     // 线性衰减
  quadratic: number;                  // 二次衰减

  // 自定义衰减曲线
  customCurve?: AnimationCurve<number>; // 自定义曲线
}

enum AttenuationType {
  Inverse = 'inverse',                // 反比衰减
  InverseSquare = 'inverse-square',   // 平方反比衰减
  Linear = 'linear',                  // 线性衰减
  Physical = 'physical',              // 物理衰减
  Custom = 'custom',                  // 自定义衰减
}

// 阴影属性
interface ShadowProperties {
  enabled: boolean;                   // 是否启用阴影

  // 阴影类型
  type: ShadowType;                   // 阴影类型

  // 阴影贴图
  resolution: number;                 // 阴影贴图分辨率
  cascadeCount?: number;              // 级联阴影数量（方向光）
  cascadeDistances?: number[];        // 级联距离

  // 阴影偏差
  bias: number;                       // 阴影偏移
  slopeBias: number;                  // 斜率偏移
  normalBias: number;                 // 法线偏移

  // 阴影过滤
  filterType: ShadowFilterType;       // 阴影过滤类型
  filterSize: number;                 // 过滤器大小

  // 阴影距离
  nearPlane: number;                  // 近平面
  farPlane: number;                   // 远平面
}

enum ShadowType {
  Hard = 'hard',                      // 硬阴影
  Soft = 'soft',                      // 软阴影
  ContactHardening = 'contact-hardening', // 接触硬化阴影
  VSM = 'vsm',                        // 方差阴影贴图
  CSM = 'csm',                        // 级联阴影贴图
  PCSM = 'pcsm',                      // 平行分割级联阴影
}
```

### 环境光

```typescript
// 环境光
interface EnvironmentLight extends Light {
  type: LightType.Environment;

  attributes: {
    // 环境贴图
    texture: UsdValue;                // 环境贴图 (Asset)
    intensity: UsdValue;              // 环境光强度 (float)
    rotation: UsdValue;               // 旋转 (float)

    // 天空盒
    skybox: UsdValue;                 // 天空盒贴图 (Asset)

    // 光照探针
    irradiance: UsdValue;             // 漫反射光照探针 (Asset)
    prefilter: UsdValue;              // 镜面反射探针 (Asset)
    brdf: UsdValue;                   // BRDF 贴图 (Asset)
  };

  properties: {
    // 环境光配置
    environmentType: EnvironmentType; // 环境光类型

    // 旋转配置
    rotation: Vector3Like;            // 旋转角度

    // 背景配置
    backgroundType: BackgroundType;   // 背景类型
    backgroundColor?: ColorLike;      // 背景颜色

    // 动态环境
    dynamic?: boolean;                // 是否动态环境
    updateTime?: number;              // 更新时间
  };
}

enum EnvironmentType {
  CubeMap = 'cube-map',               // 立方体贴图
  Equirectangular = 'equirectangular', // 等距圆柱投影
  HDRI = 'hdri',                      // HDRI 贴图
  Procedural = 'procedural',          // 程序化环境
  Gradient = 'gradient',              // 渐变环境
}

enum BackgroundType {
  Color = 'color',                    // 纯色背景
  Skybox = 'skybox',                  // 天空盒背景
  Environment = 'environment',        // 环境贴图背景
  Gradient = 'gradient',              // 渐变背景
  Procedural = 'procedural',          // 程序化背景
}
```

## 纹理系统

### 纹理定义

```typescript
// 纹理基础接口
interface Texture extends BaseTextureRef {
  properties: TextureProperties;      // 纹理属性

  // 纹理数据
  data: TextureData;                  // 纹理数据

  // Mipmap 配置
  mipmap: MipmapConfiguration;        // Mipmap 配置

  // LOD 配置
  lod: LODConfiguration;              // LOD 配置
}

// 纹理属性
interface TextureProperties {
  // 尺寸信息
  width: number;                      // 纹理宽度
  height: number;                     // 纹理高度
  depth?: number;                     // 纹理深度（3D纹理）

  // 格式信息
  format: PixelFormat;                // 像素格式
  compression?: CompressionFormat;    // 压缩格式

  // 采样模式
  minFilter: RHIFilterMode;           // 缩小过滤器
  magFilter: RHIFilterMode;           // 放大过滤器
  wrapS: RHIAddressMode;              // S 方向包装模式
  wrapT: RHIAddressMode;              // T 方向包装模式
  wrapR?: RHIAddressMode;             // R 方向包装模式（3D纹理）

  // 各向异性
  anisotropy: number;                 // 各向异性级别

  // 纹理流
  streaming?: TextureStreaming;       // 纹理流配置
}

// 纹理数据
interface TextureData {
  type: TextureDataType;              // 数据类型

  // 数据来源
  source: TextureDataSource;          // 数据来源

  // 数据缓冲区
  buffers: TextureBuffer[];           // 数据缓冲区

  // 数据格式
  componentType: TextureComponentType; // 组件类型
}

enum TextureDataType {
  Texture2D = 'texture-2d',           // 2D纹理
  Texture3D = 'texture-3d',           // 3D纹理
  CubeMap = 'cube-map',               // 立方体贴图
  TextureArray = 'texture-array',     // 纹理数组
  Texture2DArray = 'texture-2d-array', // 2D纹理数组
}

enum TextureComponentType {
  UnsignedByte = 'unsigned-byte',     // 无符号字节
  UnsignedShort = 'unsigned-short',   // 无符号短整型
  UnsignedInt = 'unsigned-int',       // 无符号整型
  Float = 'float',                    // 浮点数
  HalfFloat = 'half-float',           // 半精度浮点数
}
```

### 纹理流系统

```typescript
// 纹理流配置
interface TextureStreaming {
  enabled: boolean;                   // 是否启用流

  // 流优先级
  priority: StreamingPriority;        // 流优先级

  // Mipmap 偏移
  bias: number;                       // Mipmap 偏移

  // 流目标
  targetMemory?: number;              // 目标内存占用
  targetQuality?: number;             // 目标质量

  // 预加载
  preloadDistance?: number;           // 预加载距离
  preloadCount?: number;              // 预加轂数量
}

enum StreamingPriority {
  Critical = 'critical',              // 关键
  High = 'high',                      // 高
  Medium = 'medium',                  // 中
  Low = 'low',                        // 低
  Background = 'background',          // 后台
}

// 纹理缓冲区
interface TextureBuffer {
  level: number;                      // Mipmap 级别
  data: ArrayBuffer;                  // 数据缓冲区
  offset: number;                     // 数据偏移
  size: number;                       // 数据大小

  // 压缩信息
  compressedSize?: number;            // 压缩后大小
  compressionFormat?: CompressionFormat; // 压缩格式

  // 附加信息
  timestamp?: number;                 // 时间戳
  checksum?: string;                  // 校验和
}
```

### 材质绑定

```typescript
// 材质绑定
interface MaterialBinding {
  material: string;                   // 材质路径
  purpose: MaterialPurpose;           // 绑定用途
  strength?: number;                  // 绑定强度

  // 材质变体
  variant?: MaterialVariant;          // 材质变体
  fallback?: string;                  // 备用材质

  // 绑定配置
  mapping?: UVMapping;                // UV 映射
  priority?: number;                  // 绑定优先级
}

enum MaterialPurpose {
  Full = 'full',                      // 完整材质
  Preview = 'preview',                // 预览材质
  Proxy = 'proxy',                    // 代理材质
  Guide = 'guide',                    // 指导材质
}

// 材质变体
interface MaterialVariant {
  name: string;                       // 变体名称
  selection: string;                  // 当前选择
  variants: Record<string, MaterialBinding>; // 变体列表
}

// UV 映射
interface UVMapping {
  channel: number;                    // UV 通道
  transform: UVTransform;             // UV 变换

  // 投影类型
  projection?: ProjectionType;        // 投影类型

  // 三平面映射
  triplanar?: TriplanarMapping;       // 三平面映射
}

enum ProjectionType {
  UV = 'uv',                          // UV 投影
  Planar = 'planar',                  // 平面投影
  Cylindrical = 'cylindrical',        // 圆柱投影
  Spherical = 'spherical',            // 球面投影
  Box = 'box',                        // 立方体投影
  Triplanar = 'triplanar',            // 三平面投影
}
```

## 实际应用示例

### 创建 PBR 材质

```typescript
import {
  IMaterial,
  MaterialType,
  ShaderNetwork,
  ShaderNodeType,
  PBRMaterialProperties,
  TextureReference
} from '@maxellabs/specification';

// 创建 PBR 材质
const pbrMaterial: IMaterial = {
  path: '/Materials/Metal_Paint',
  typeName: 'Material',
  active: true,
  attributes: {
    name: { type: UsdDataType.String, value: 'MetalPaint' },
    materialType: { type: UsdDataType.Token, value: MaterialType.Standard },
    doubleSided: { type: UsdDataType.Bool, value: false },
    opacity: { type: UsdDataType.Float, value: 1.0 },
    alphaMode: { type: UsdDataType.Token, value: AlphaMode.Opaque }
  },
  relationships: {},
  metadata: {},
  children: [],

  shaderNetwork: {
    nodes: {
      'baseColor': {
        type: ShaderNodeType.Texture,
        category: 'Input',
        parameters: {
          texture: { type: 'texture', value: '/Textures/MetalPaint_BaseColor.png' }
        },
        inputs: {
          uv: { type: 'vector2', defaultValue: [0, 0] }
        },
        outputs: {
          color: { type: 'color', value: [1, 1, 1, 1] }
        },
        position: [100, 100],
        enabled: true
      },

      'normal': {
        type: ShaderNodeType.Texture,
        category: 'Input',
        parameters: {
          texture: { type: 'texture', value: '/Textures/MetalPaint_Normal.png' }
        },
        inputs: {
          uv: { type: 'vector2', defaultValue: [0, 0] }
        },
        outputs: {
          normal: { type: 'vector3', value: [0, 0, 1] }
        },
        position: [300, 100],
        enabled: true
      },

      'metallicRoughness': {
        type: ShaderNodeType.Texture,
        category: 'Input',
        parameters: {
          texture: { type: 'texture', value: '/Textures/MetalPaint_MetallicRoughness.png' }
        },
        inputs: {
          uv: { type: 'vector2', defaultValue: [0, 0] }
        },
        outputs: {
          metallic: { type: 'float', value: 0.0 },
          roughness: { type: 'float', value: 0.5 }
        },
        position: [100, 300],
        enabled: true
      },

      'split': {
        type: ShaderNodeType.Vector,
        category: 'Math',
        parameters: {
          operation: 'split'
        },
        inputs: {
          vector: { type: 'vector4', defaultValue: [0, 0, 0, 1] }
        },
        outputs: {
          x: { type: 'float', value: 0 },
          y: { type: 'float', value: 0 },
          z: { type: 'float', value: 0 },
          w: { type: 'float', value: 1 }
        },
        position: [300, 300],
        enabled: true
      },

      'output': {
        type: ShaderNodeType.Output,
        category: 'Output',
        parameters: {},
        inputs: {
          baseColor: { type: 'color', defaultValue: [1, 1, 1, 1] },
          metallic: { type: 'float', defaultValue: 0.0 },
          roughness: { type: 'float', defaultValue: 0.5 },
          normal: { type: 'vector3', defaultValue: [0, 0, 1] },
          emissive: { type: 'color', defaultValue: [0, 0, 0, 0] }
        },
        outputs: {},
        position: [500, 200],
        enabled: true
      }
    },
    connections: [
      {
        fromNode: 'baseColor',
        fromOutput: 'color',
        toNode: 'output',
        toInput: 'baseColor',
        priority: 1,
        enabled: true
      },
      {
        fromNode: 'normal',
        fromOutput: 'normal',
        toNode: 'output',
        toInput: 'normal',
        priority: 2,
        enabled: true
      },
      {
        fromNode: 'metallicRoughness',
        fromOutput: 'color',
        toNode: 'split',
        toInput: 'vector',
        priority: 3,
        enabled: true
      },
      {
        fromNode: 'split',
        fromOutput: 'x',
        toNode: 'output',
        toInput: 'metallic',
        priority: 4,
        enabled: true
      },
      {
        fromNode: 'split',
        fromOutput: 'y',
        toNode: 'output',
        toInput: 'roughness',
        priority: 5,
        enabled: true
      }
    ],
    outputNode: 'output',
    version: '1.0',
    description: 'PBR Metal Paint Material'
  },

  properties: {
    name: 'MetalPaint',
    type: MaterialType.Standard,
    baseColor: [1.0, 0.8, 0.6, 1.0],
    opacity: 1.0,
    metallic: 1.0,
    roughness: 0.3,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    emissiveColor: [0.0, 0.0, 0.0, 1.0],
    emissiveIntensity: 0.0,

    // PBR 特定属性
    baseColorTexture: {
      id: 'metal_paint_basecolor',
      path: '/Textures/MetalPaint_BaseColor.png',
      type: TextureType.Albedo,
      format: PixelFormat.RGBA8,
      compression: CompressionFormat.BC7,
      mipmap: true
    } as TextureReference,

    normalTexture: {
      id: 'metal_paint_normal',
      path: '/Textures/MetalPaint_Normal.png',
      type: TextureType.Normal,
      format: PixelFormat.RGB8,
      compression: CompressionFormat.BC5,
      mipmap: true
    } as TextureReference,

    metallicTexture: {
      id: 'metal_paint_mr',
      path: '/Textures/MetalPaint_MetallicRoughness.png',
      type: TextureType.MetallicRoughness,
      format: PixelFormat.RG8,
      compression: CompressionFormat.BC4,
      mipmap: true,
      metallicTextureChannel: TextureChannel.Red,
      roughnessTextureChannel: TextureChannel.Green
    } as TextureReference
  } as PBRMaterialProperties,

  renderState: {
    depth: {
      enabled: true,
      writeEnabled: true,
      compareFunction: RHICompareFunction.Less
    },
    stencil: {
      enabled: false
    },
    blend: {
      enabled: false
    },
    cull: {
      enabled: true,
      mode: RHICullMode.Back,
      frontFace: RHIFrontFace.CounterClockwise
    },
    multisample: {
      enabled: true,
      sampleCount: 4
    },
    fillMode: FillMode.Fill,
    lightingMode: LightingMode.PBR
  }
};
```

### 创建渲染管线

```typescript
import {
  RenderPipeline,
  RenderPipelineType,
  RenderStage,
  RenderStageType,
  ClearFlags,
  MaterialRenderState,
  DepthState,
  BlendState,
  CullState
} from '@maxelllabs/specification';

// 创建前向渲染管线
const forwardPipeline: RenderPipeline = {
  name: 'ForwardPipeline',
  type: RenderPipelineType.Forward,

  stages: [
    // 深度预渲染阶段
    {
      name: 'DepthPrepass',
      type: RenderStageType.Base,
      order: 0,
      renderTargets: [
        {
          name: 'depth',
          type: 'depth',
          format: PixelFormat.Depth32F,
          width: 1920,
          height: 1080
        }
      ],
      clearFlags: ClearFlags.Depth,
      renderState: {
        depth: {
          enabled: true,
          writeEnabled: true,
          compareFunction: RHICompareFunction.Less
        },
        cull: {
          enabled: true,
          mode: RHICullMode.Back,
          frontFace: RHIFrontFace.CounterClockwise
        },
        blend: {
          enabled: false
        }
      },
      shaders: [
        {
          type: 'vertex',
          stage: 'vertex',
          source: '/Shaders/DepthVert.hlsl',
          entryPoint: 'main'
        },
        {
          type: 'fragment',
          stage: 'fragment',
          source: '/Shaders/DepthFrag.hlsl',
          entryPoint: 'main'
        }
      ],
      filters: [
        {
          type: 'opaque',
          enabled: true
        },
        {
          type: 'casts-shadows',
          enabled: true
        }
      ]
    },

    // 基础渲染阶段
    {
      name: 'BasePass',
      type: RenderStageType.Base,
      order: 100,
      renderTargets: [
        {
          name: 'color',
          type: 'color',
          format: PixelFormat.RGBA16F,
          width: 1920,
          height: 1080
        },
        {
          name: 'depth',
          type: 'depth',
          format: PixelFormat.Depth32F,
          width: 1920,
          height: 1080
        }
      ],
      clearFlags: ClearFlags.Color | ClearFlags.Depth,
      renderState: {
        depth: {
          enabled: true,
          writeEnabled: true,
          compareFunction: RHICompareFunction.LessOrEqual
        },
        cull: {
          enabled: true,
          mode: RHICullMode.Back,
          frontFace: RHIFrontFace.CounterClockwise
        },
        blend: {
          enabled: false
        }
      },
      shaders: [
        {
          type: 'vertex',
          stage: 'vertex',
          source: '/Shaders/ForwardVert.hlsl',
          entryPoint: 'main'
        },
        {
          type: 'fragment',
          stage: 'fragment',
          source: '/Shaders/ForwardFrag.hlsl',
          entryPoint: 'main'
        }
      ],
      filters: [
        {
          type: 'opaque',
          enabled: true
        }
      ]
    },

    // 透明渲染阶段
    {
      name: 'TransparentPass',
      type: RenderStageType.Transparent,
      order: 200,
      renderTargets: [
        {
          name: 'color',
          type: 'color',
          format: PixelFormat.RGBA16F,
          width: 1920,
          height: 1080
        },
        {
          name: 'depth',
          type: 'depth',
          format: PixelFormat.Depth32F,
          width: 1920,
          height: 1080
        }
      ],
      clearFlags: ClearFlags.None,
      renderState: {
        depth: {
          enabled: true,
          writeEnabled: false,
          compareFunction: RHICompareFunction.LessOrEqual
        },
        cull: {
          enabled: false, // 透明物体可能需要双面渲染
        },
        blend: {
          enabled: true,
          color: {
            operation: RHIBlendOperation.Add,
            sourceFactor: RHIBlendFactor.SrcAlpha,
            destinationFactor: RHIBlendFactor.OneMinusSrcAlpha
          },
          alpha: {
            operation: RHIBlendOperation.Add,
            sourceFactor: RHIBlendFactor.One,
            destinationFactor: RHIBlendFactor.OneMinusSrcAlpha
          }
        }
      },
      shaders: [
        {
          type: 'vertex',
          stage: 'vertex',
          source: '/Shaders/TransparentVert.hlsl',
          entryPoint: 'main'
        },
        {
          type: 'fragment',
          stage: 'fragment',
          source: '/Shaders/TransparentFrag.hlsl',
          entryPoint: 'main'
        }
      ],
      filters: [
        {
          type: 'transparent',
          enabled: true
        }
      ]
    }
  ],

  configuration: {
    enableMSAA: true,
    sampleCount: 4,
    enableHDR: true,
    tonemapping: 'ACES',
    gammaCorrection: 2.2
  },

  resourceBindings: [
    {
      set: 0,
      binding: 0,
      type: 'uniform-buffer',
      name: 'CameraBuffer',
      visibility: ['vertex', 'fragment']
    },
    {
      set: 0,
      binding: 1,
      type: 'uniform-buffer',
      name: 'LightBuffer',
      visibility: ['fragment']
    },
    {
      set: 1,
      binding: 0,
      type: 'texture-2d',
      name: 'BaseColorTexture',
      visibility: ['fragment']
    },
    {
      set: 1,
      binding: 1,
      type: 'sampler',
      name: 'TextureSampler',
      visibility: ['fragment']
    }
  ],

  renderTargets: [
    {
      name: 'color',
      type: 'color',
      format: PixelFormat.RGBA16F,
      width: 1920,
      height: 1080,
      clearColor: [0.0, 0.0, 0.0, 1.0]
    },
    {
      name: 'depth',
      type: 'depth',
      format: PixelFormat.Depth32F,
      width: 1920,
      height: 1080,
      clearDepth: 1.0
    }
  ]
};
```

### 光源配置示例

```typescript
import {
  Light,
  LightType,
  ShadowProperties,
  ShadowType,
  ShadowFilterType,
  LightAttenuation,
  AttenuationType
} from '@maxellabs/specification';

// 创建方向光（太阳光）
const sunLight: Light = {
  path: '/Lights/Sun',
  typeName: 'Light',
  active: true,
  attributes: {
    color: { type: UsdDataType.Color3f, value: [1.0, 0.95, 0.8] },
    intensity: { type: UsdDataType.Float, value: 10.0 },
    enable: { type: UsdDataType.Bool, value: true },
    diffuse: { type: UsdDataType.Float, value: 1.0 },
    specular: { type: UsdDataType.Float, value: 1.0 },
    enableShadows: { type: UsdDataType.Bool, value: true },
    shadowBias: { type: UsdDataType.Float, value: 0.005 },
    shadowSlopeBias: { type: UsdDataType.Float, value: 0.002 }
  },
  relationships: {},
  metadata: {},
  children: [],

  properties: {
    type: LightType.Directional,
    range: 1000.0,
    attenuation: {
      type: AttenuationType.Physical,
      constant: 1.0,
      linear: 0.0,
      quadratic: 0.0
    },

    shadow: {
      enabled: true,
      type: ShadowType.CSM,
      resolution: 4096,
      cascadeCount: 4,
      cascadeDistances: [10, 50, 150, 500],
      bias: 0.005,
      slopeBias: 0.002,
      normalBias: 0.0,
      filterType: ShadowFilterType.PCF,
      filterSize: 5,
      nearPlane: 1.0,
      farPlane: 1000.0
    },

    volumetric: {
      enabled: true,
      density: 0.1,
      scattering: 0.5,
      absorption: 0.3,
      samples: 64,
      noiseScale: 10.0,
      noiseStrength: 0.5
    }
  },

  transform: {
    position: [0, 50, 0],
    rotation: [0.707, -0.707, 0, 0], // 45度旋转
    scale: [1, 1, 1]
  }
};

// 创建点光源
const pointLight: Light = {
  path: '/Lights/PointLight_001',
  typeName: 'Light',
  active: true,
  attributes: {
    color: { type: UsdDataType.Color3f, value: [1.0, 0.7, 0.3] }, // 暖黄色
    intensity: { type: UsdDataType.Float, value: 100.0 },
    enable: { type: UsdDataType.Bool, value: true },
    diffuse: { type: UsdDataType.Float, value: 1.0 },
    specular: { type: UsdDataType.Float, value: 1.0 },
    enableShadows: { type: UsdDataType.Bool, value: true }
  },
  relationships: {},
  metadata: {},
  children: [],

  properties: {
    type: LightType.Point,
    range: 20.0,
    attenuation: {
      type: AttenuationType.InverseSquare,
      constant: 1.0,
      linear: 0.0,
      quadratic: 1.0
    },

    shadow: {
      enabled: true,
      type: ShadowType.VSM,
      resolution: 1024,
      bias: 0.01,
      filterType: ShadowFilterType.Gaussian,
      filterSize: 3,
      nearPlane: 0.1,
      farPlane: 20.0
    },

    cookie: {
      enabled: true,
      texture: '/Textures/LightCookies/PointLightCookie.png',
      intensity: 0.8,
      rotation: 45.0
    }
  },

  transform: {
    position: [5, 3, 2],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1]
  }
};
```

## 性能优化建议

### 1. 材质优化

```typescript
// ✅ 推荐：使用材质实例
const materialInstance: IMaterial = {
  ...baseMaterial,
  instanceData: {
    parameters: {
      baseColor: [1, 0, 0, 1], // 仅修改颜色
      roughness: 0.3
    }
  }
};

// ✅ 推荐：合理的纹理压缩
const optimizedTexture: Texture = {
  ...baseTexture,
  format: PixelFormat.BC7, // 高效压缩格式
  mipmap: {
    enabled: true,
    filter: 'box',
    maxLevel: 10
  },
  streaming: {
    enabled: true,
    priority: StreamingPriority.High,
    targetMemory: 32 * 1024 * 1024 // 32MB 目标
  }
};
```

### 2. 渲染管线优化

```typescript
// ✅ 推荐：使用合批渲染
const batchedStage: RenderStage = {
  name: 'BatchedOpaque',
  type: RenderStageType.Base,
  batchMode: {
    enabled: true,
    algorithm: 'radix-sort',
    materialSorting: true
  }
};

// ✅ 推荐：多线程渲染
const multithreadedPipeline: RenderPipeline = {
  ...basePipeline,
  threading: {
    enabled: true,
    workerCount: 4,
    stageSplitting: true,
    asyncShaderCompilation: true
  }
};
```

### 3. 阴影优化

```typescript
// ✅ 推荐：级联阴影优化
const optimizedCSM: ShadowProperties = {
  ...baseShadow,
  cascadeCount: 3, // 减少级联数量
  cascadeDistances: [20, 100, 300], // 优化距离分布
  resolution: 2048, // 降低分辨率
  filterType: ShadowFilterType.PCF, // 使用快速过滤
  filterSize: 3
};
```

## 总结

Specification 渲染规范提供了：

1. **完整的几何体系统**：支持网格、细分、LOD、实例化
2. **强大的材质系统**：PBR、着色器网络、多材质变体
3. **灵活的渲染管线**：前向、延迟、自定义管线
4. **专业的光照系统**：多种光源类型、阴影、体积光
5. **高效的纹理系统**：流式加载、压缩、Mipmap
6. **USD 标准兼容**：完全支持 OpenUSD 渲染规范

该规范为现代 3D 渲染提供了完整、高效、类型安全的解决方案。
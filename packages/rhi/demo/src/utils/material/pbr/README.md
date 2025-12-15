# PBR材质系统

基于物理的渲染（Physically Based Rendering）材质系统，实现Cook-Torrance BRDF模型。

## 功能特性

### Phase 1: 基础PBR ✅
- ✅ 金属度/粗糙度工作流
- ✅ Cook-Torrance BRDF模型
  - Fresnel: Schlick近似
  - Normal Distribution: GGX/Trowbridge-Reitz
  - Geometry: Smith's method
- ✅ 多光源支持（最多4个点光源）
- ✅ 材质预设库（金、银、铜、塑料、木材、橡胶）

### Phase 2: 纹理支持 ✅
- ✅ Albedo贴图（sRGB空间，自动Gamma校正）
- ✅ Metalness贴图（线性空间）
- ✅ Roughness贴图（线性空间）
- ✅ Normal贴图（切线空间，TBN矩阵）
- ✅ AO贴图（环境光遮蔽）

### Phase 3: IBL集成 ✅
- ✅ 辐照度图（漫反射IBL）
- ✅ 预过滤环境图（镜面IBL）
- ✅ BRDF查找表（LUT）
- ✅ IBL加载器

### Phase 4: 材质库 ✅
- ✅ 材质预设管理
- ✅ 材质插值
- ✅ sRGB颜色转换
- ✅ 材质验证

## 使用示例

### 基础用法

```typescript
import { PBRMaterial, MaterialLibrary } from '@/utils/material/pbr';

// 创建金属材质
const goldConfig = MaterialLibrary.getPreset('gold');
const goldMaterial = new PBRMaterial(device, goldConfig);

// 设置光源
goldMaterial.setLights([
  {
    position: [5, 5, 5],
    color: [1, 1, 1],
    intensity: 300.0,
  },
]);

// 渲染
goldMaterial.updateUniforms(modelMatrix, viewMatrix, projMatrix, cameraPos);
goldMaterial.bind(passEncoder);
```

### 使用纹理

```typescript
import { PBRMaterial, TextureLoader } from '@/utils';

// 加载纹理
const albedoMap = await TextureLoader.load('textures/albedo.jpg');
const metalnessMap = await TextureLoader.load('textures/metalness.jpg');
const roughnessMap = await TextureLoader.load('textures/roughness.jpg');
const normalMap = await TextureLoader.load('textures/normal.jpg');

// 创建材质
const material = new PBRMaterial(
  device,
  {
    albedo: [1, 1, 1], // 纹理会覆盖此值
    metalness: 1.0,
    roughness: 0.5,
  },
  {
    albedoMap,
    metalnessMap,
    roughnessMap,
    normalMap,
  }
);
```

### 使用IBL

```typescript
import { PBRMaterial, IBLLoader } from '@/utils/material/pbr';

// 加载环境贴图
const environmentMap = await loadCubemap('env/skybox');

// 生成IBL贴图
const iblLoader = new IBLLoader(device);
const iblTextures = await iblLoader.generateIBLTextures(environmentMap);

// 创建材质（启用IBL）
const material = new PBRMaterial(
  device,
  config,
  textures,
  iblTextures
);
```

### 自定义材质

```typescript
import { MaterialLibrary } from '@/utils/material/pbr';

// 创建自定义金属
const customMetal = MaterialLibrary.createMetal(
  [0.8, 0.5, 0.2], // 橙色金属
  0.3 // 粗糙度
);

// 从sRGB颜色创建
const material = MaterialLibrary.fromSRGB(
  [255, 100, 50], // sRGB颜色
  0.0, // 非金属
  0.7 // 粗糙度
);

// 材质插值
const blended = MaterialLibrary.lerp(
  MaterialLibrary.getPreset('gold'),
  MaterialLibrary.getPreset('copper'),
  0.5 // 50%混合
);
```

## 宪法约束

### 线性空间光照
- ✅ 所有光照计算在线性空间进行
- ✅ sRGB纹理读取时自动转换（pow(color, 2.2)）
- ✅ 输出时应用Gamma校正（pow(color, 1/2.2)）

### Uniform布局
- ✅ 使用std140布局
- ✅ vec3对齐到16字节（添加padding）
- ✅ 数组元素对齐到16字节

### 资源管理
- ✅ 所有纹理通过runner.track()管理
- ✅ 添加label标识资源
- ✅ 提供destroy()方法释放资源

### 纹理坐标
- ✅ 原点在左下角（符合OpenGL约定）
- ✅ TextureLoader自动处理Y轴翻转

## 技术细节

### Cook-Torrance BRDF

```
f(l,v) = kD * fLambert + kS * fCookTorrance

其中：
- kD: 漫反射比例 = (1 - F) * (1 - metalness)
- kS: 镜面反射比例 = F
- fLambert: albedo / π
- fCookTorrance: (D * F * G) / (4 * NdotV * NdotL)
```

### Fresnel（Schlick近似）

```glsl
F = F0 + (1 - F0) * (1 - HdotV)^5

其中：
- F0 = mix(0.04, albedo, metalness)
- 非金属F0 = 0.04（4%反射率）
- 金属F0 = albedo（使用基础颜色）
```

### Normal Distribution（GGX）

```glsl
D = α² / (π * ((NdotH)² * (α² - 1) + 1)²)

其中：
- α = roughness²
```

### Geometry（Smith's method）

```glsl
G = G1(NdotV) * G1(NdotL)

G1(x) = x / (x * (1 - k) + k)

其中：
- k = (roughness + 1)² / 8
```

## 性能优化

1. **Uniform缓冲区复用**：单个缓冲区存储所有uniform数据
2. **默认纹理**：未提供纹理时使用1x1白色纹理，避免条件分支
3. **着色器变体**：根据是否启用IBL选择不同着色器
4. **光源限制**：最多4个光源，避免动态循环

## 文件结构

```
material/pbr/
├── types.ts              # 类型定义
├── PBRShaders.ts         # 着色器代码
├── PBRMaterial.ts        # 核心材质类
├── MaterialLibrary.ts    # 材质预设库
├── IBLLoader.ts          # IBL加载器
├── index.ts              # 统一导出
└── README.md             # 文档
```

## 参考资料

- [LearnOpenGL - PBR Theory](https://learnopengl.com/PBR/Theory)
- [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf)
- [Physically Based Rendering in Filament](https://google.github.io/filament/Filament.html)

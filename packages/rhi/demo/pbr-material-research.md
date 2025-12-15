# PBR Material Demo 技术需求调研报告

## 📊 调研概览

**调研目标**: 评估实现 `pbr-material.ts` Demo 的技术基础和所需工作量

**调研时间**: 2025-12-15

**调研范围**: 
- 现有光照系统基础设施
- PBR 相关代码和 Shader 实现
- 数学工具库可用性
- Demo 实现模式

---

## ✅ 现状分析

### 1. 光照系统基础 【已完善】

#### 1.1 Phong 光照模型实现
- **文件**: `/packages/rhi/demo/src/phong-lighting.ts`
- **特性**:
  - ✅ 顶点着色器 + 片段着色器分离
  - ✅ Uniform Buffer (std140 布局)
  - ✅ 环境光 + 漫反射 + 镜面反射
  - ✅ 法线矩阵变换
  - ✅ 相机位置 Uniform
  - ✅ GUI 实时参数调整

#### 1.2 多光源累加模式
- **文件**: `/packages/rhi/demo/src/point-lights.ts`
- **特性**:
  - ✅ 支持最多 4 个点光源
  - ✅ 距离衰减公式: `1.0 / (constant + linear * distance + quadratic * distance²)`
  - ✅ Shader 循环累加光照贡献
  - ✅ std140 Uniform Buffer 布局（PointLight 结构体 48 bytes）

#### 1.3 聚光灯实现
- **文件**: `/packages/rhi/demo/src/spotlight.ts`
- **特性**:
  - ✅ 内外锥角 (InnerCutoff / OuterCutoff)
  - ✅ 平滑边缘过渡 (smoothstep)
  - ✅ 位置 + 方向向量
  - ✅ 距离衰减

#### 1.4 Shader 工具类
- **文件**: `/packages/rhi/demo/src/utils/shader/ShaderUtils.ts`
- **功能**:
  - ✅ `generateUniformBlock()`: 自动生成 std140 Uniform 块
  - ✅ `calculateUniformBlockSize()`: 计算 Buffer 大小
  - ✅ `getLightingSnippet()`: Blinn-Phong 光照代码片段
  - ✅ `phongShaders()`: 完整 Phong 着色器对

---

### 2. PBR Shader 代码 【已存在！】

#### 2.1 完整 PBR 实现
- **文件**: `/packages/core/demo/src/lighting.ts`
- **Shader 函数**:
  ```glsl
  // Trowbridge-Reitz GGX 法线分布函数
  float DistributionGGX(vec3 N, vec3 H, float roughness)
  
  // Schlick-GGX 几何衰减函数
  float GeometrySchlickGGX(float NdotV, float roughness)
  float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
  
  // Fresnel 反射（Schlick 近似）
  vec3 fresnelSchlick(float cosTheta, vec3 F0)
  ```

- **BRDF 计算**:
  ```glsl
  // Cook-Torrance BRDF
  float NDF = DistributionGGX(N, H, roughness);
  float G = GeometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 kS = F;                      // 镜面反射比率
  vec3 kD = vec3(1.0) - kS;         // 漫反射比率
  kD *= 1.0 - metallic;             // 金属度调制
  
  // 最终 BRDF
  vec3 specular = (NDF * G * F) / (4.0 * NdotV * NdotL + 0.0001);
  vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;
  ```

- **参数**:
  - ✅ `uAlbedo`: 基础颜色 (vec3)
  - ✅ `uMetallic`: 金属度 (float, 0-1)
  - ✅ `uRoughness`: 粗糙度 (float, 0-1)
  - ✅ HDR 色调映射 + Gamma 校正

---

### 3. 数学工具库 【功能完备】

#### 3.1 核心类 (`@maxellabs/math`)
- ✅ `Vector3`: 向量运算、normalize()、dot()、cross()
- ✅ `Vector4`: 四维向量
- ✅ `Matrix4`: 4x4 矩阵、MVP 变换、invert()、transpose()
- ✅ `Matrix3`: 3x3 矩阵（法线矩阵）
- ✅ `Quaternion`: 四元数旋转
- ✅ `Color`: 颜色管理

#### 3.2 工具函数 (`utils.ts`)
```typescript
// 常量
const DEG2RAD = Math.PI / 180;
const NumberEpsilon = 1e-10;

// 实用函数
degToRad(degrees: number): number
clamp(value: number, min: number, max: number): number
lerp(x: number, y: number, t: number): number
fastSin(angle: number): number          // 缓存优化
fastCos(angle: number): number          // 缓存优化
fastSqrt(x: number): number
safeDivide(a: number, b: number): number
```

---

## 🚨 缺失项分析

### 1. 需要新建的内容

#### 1.1 Demo 主文件
- **文件**: `/packages/rhi/demo/src/pbr-material.ts` (不存在)
- **需实现**:
  - [ ] 球体/立方体几何体
  - [ ] PBR Shader 移植（从 `/packages/core/demo/src/lighting.ts`）
  - [ ] Uniform Buffer 布局设计
  - [ ] GUI 参数控制（Metallic、Roughness、Albedo）
  - [ ] 光源配置（建议使用 1-2 个点光源）

#### 1.2 纹理支持（可选）
- 当前 PBR 实现使用纯色 Albedo
- **未来扩展**:
  - [ ] Albedo 纹理贴图
  - [ ] Normal Map（法线贴图）
  - [ ] Metallic/Roughness 纹理
  - [ ] AO 贴图

---

## 💡 实现建议

### 方案 A: 快速原型（推荐，1-2 小时）

**复用现有代码 90%**

1. **复制 Shader 代码**:
   - 从 `/packages/core/demo/src/lighting.ts` 提取 PBR Fragment Shader
   - 调整 Uniform 布局为 std140（参考 `point-lights.ts`）

2. **复用 Demo 框架**:
   ```typescript
   import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI } from './utils';
   ```

3. **Uniform Buffer 设计**:
   ```glsl
   layout(std140) uniform PBRMaterial {
     vec3 uAlbedo;           // 16 bytes (12 + 4 padding)
     float uMetallic;        // 4 bytes
     float uRoughness;       // 4 bytes
     float uAmbientStrength; // 4 bytes
     float _padding[2];      // 8 bytes
   };  // 总计 32 bytes
   ```

4. **光源配置**:
   - 复用 `point-lights.ts` 的 PointLight 结构
   - 初始配置 1-2 个白光源
   - GUI 暴露 Metallic (0-1)、Roughness (0-1)、Albedo (Color Picker)

5. **验证步骤**:
   - [ ] Metallic = 0, Roughness = 0.5 -> 类似塑料
   - [ ] Metallic = 1, Roughness = 0.1 -> 类似金属
   - [ ] Metallic = 0, Roughness = 1.0 -> 类似粗糙表面

---

### 方案 B: 完整实现（3-5 小时）

**增加纹理和多材质球**

1. 实现方案 A 的所有内容
2. **纹理加载**:
   - 添加 Albedo 纹理 Uniform
   - 使用 `createTexture()` API
   - GUI 切换"纯色 / 纹理"模式

3. **材质预设**:
   - 金属预设（Metallic=1.0, Roughness=0.2, Silver Color）
   - 塑料预设（Metallic=0.0, Roughness=0.4, Red Color）
   - 粗糙石头（Metallic=0.0, Roughness=0.9, Gray Color）

4. **多球展示**:
   - 渲染 5x5 网格
   - X 轴: Metallic 0->1
   - Y 轴: Roughness 0->1
   - 类似 Unreal Engine 材质球展示

---

## 📋 实现检查清单（方案 A）

### 阶段 1: Shader 移植（30 分钟）
- [ ] 从 `lighting.ts` 复制 PBR Fragment Shader
- [ ] 调整为 std140 Uniform 布局
- [ ] 添加顶点着色器（可复用 `phong-lighting.ts`）
- [ ] 验证 Shader 编译无误

### 阶段 2: Demo 框架搭建（30 分钟）
- [ ] 创建 `pbr-material.ts`
- [ ] 初始化 DemoRunner + OrbitController
- [ ] 生成球体几何体（`GeometryGenerator.sphere()`）
- [ ] 创建 Vertex Buffer + Index Buffer

### 阶段 3: Uniform 管理（30 分钟）
- [ ] 创建 Transform Uniform Buffer (256 bytes)
- [ ] 创建 PBRMaterial Uniform Buffer (32 bytes)
- [ ] 创建 PointLights Uniform Buffer (复用现有代码)
- [ ] 创建 Camera Uniform Buffer (16 bytes)
- [ ] 绑定 BindGroup

### 阶段 4: GUI 和测试（30 分钟）
- [ ] SimpleGUI 添加 Metallic 滑块 (0-1)
- [ ] SimpleGUI 添加 Roughness 滑块 (0-1)
- [ ] SimpleGUI 添加 Albedo 颜色选择器
- [ ] 添加光源位置控制
- [ ] 测试不同参数组合

---

## 🎯 技术风险评估

| 风险项 | 等级 | 说明 | 缓解措施 |
|--------|------|------|----------|
| Shader 编译错误 | 🟢 低 | 已有完整 PBR Shader 代码 | 直接复制验证过的代码 |
| Uniform 布局错误 | 🟡 中 | std140 对齐规则复杂 | 使用 `ShaderUtils.calculateUniformBlockSize()` |
| 视觉效果不符预期 | 🟢 低 | BRDF 公式已验证 | 参考 `lighting.ts` 的参数配置 |
| 性能问题 | 🟢 低 | 单个球体 + 简单光照 | 后期优化考虑 Instancing |

---

## 📚 参考资源

### 内部代码
1. **PBR Shader 参考**: `/packages/core/demo/src/lighting.ts` (第 151-263 行)
2. **Demo 模板**: `/packages/rhi/demo/src/phong-lighting.ts`
3. **多光源示例**: `/packages/rhi/demo/src/point-lights.ts`
4. **Shader 工具**: `/packages/rhi/demo/src/utils/shader/ShaderUtils.ts`

### 外部文档
- [LearnOpenGL - PBR Theory](https://learnopengl.com/PBR/Theory)
- [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf)

---

## ✨ 总结

### 技术可行性: ⭐⭐⭐⭐⭐ (5/5)

**关键发现**:
1. ✅ **PBR Shader 代码已完整实现**（无需从头编写 BRDF 函数）
2. ✅ **光照系统基础设施完善**（Uniform Buffer、多光源、GUI）
3. ✅ **数学库功能完备**（Vector3、Matrix4、工具函数）
4. ✅ **有成熟的 Demo 模板可复用**（DemoRunner、OrbitController）

**工作量评估**:
- **最小可行 Demo**: 1-2 小时
- **完整功能 Demo**: 3-5 小时
- **带纹理和材质预设**: 6-8 小时

**建议行动**:
1. **立即开始**: 技术风险极低，基础设施完备
2. **优先级**: 先实现方案 A（快速原型）
3. **迭代优化**: 验证效果后再考虑纹理和材质球网格

**核心优势**:
- 现有代码可复用 > 90%
- 无需学习新的 API 或架构
- 已有验证过的 PBR BRDF 实现
- Demo 框架统一，维护成本低

---

**调研结论**: 🟢 **强烈推荐立即实施**

所有技术基础设施已就绪，唯一缺失的是组装代码的时间投入。

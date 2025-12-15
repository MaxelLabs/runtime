# Normal-Mapping Demo 技术需求调研报告

## 调研概述
本次调研针对实现法线贴图(Normal Mapping)Demo的技术需求进行，涵盖现有代码能力、缺失功能和实现建议。

---

## 一、现状分析

### 1.1 切线生成 - **缺失**
- **检查位置**: `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`
- **结果**: 
  - ❌ 所有几何体生成器(plane, cube, sphere, torus等)均**未生成切线数据**
  - ✅ 类型定义中已预留 `'tangent'` 类型: `geometry/types.ts:11`
  - ✅ 几何体支持 position、normal、uv、color 属性，但无切线实现

### 1.2 法线贴图资源 - **可用**
- **工具类**: `ProceduralTexture.normalMap()` (line 213-264)
- **功能**:
  - ✅ 支持3种图案: `flat`(平面)、`bumpy`(随机凹凸)、`wave`(波浪)
  - ✅ 可调节强度参数 (0-1)
  - ✅ 正确映射法线向量到RGB: `[-1,1] → [0,255]`
  - ✅ 输出格式: `RGBA8` Uint8Array
- **位置**: `packages/rhi/demo/src/utils/texture/ProceduralTexture.ts`

### 1.3 相关Demo参考
- **Phong光照Demo**: `packages/rhi/demo/src/phong-lighting.ts`
  - ✅ 完整的顶点法线处理流程
  - ✅ 法线矩阵变换 (line 310)
  - ✅ 片元着色器中的法线插值和归一化
  - ❌ 未使用切线空间计算

---

## 二、缺失功能清单

### 2.1 切线/副切线生成 (Critical)
**位置**: `GeometryGenerator.ts` 需要扩展
**需要实现的几何体**:
1. **Plane** - 平面是最简单的测试对象
2. **Sphere** - 球体切线计算较复杂(参数方程求偏导)
3. **Cube** - 立方体需要处理6个面的独立切线空间

**算法要点**:
- 基于三角形的切线计算(使用UV梯度)
- 正交化处理(Gram-Schmidt)
- 处理UV缝合处的切线不连续

### 2.2 切线空间TBN矩阵 (Critical)
**需要在着色器中**:
- 顶点着色器: 传递切线、副切线到片元着色器
- 片元着色器: 构建TBN矩阵,将法线从切线空间转换到世界/视图空间

### 2.3 示例Demo实现 (Critical)
**建议文件名**: `normal-mapping.ts`
**需要演示**:
1. 启用/禁用法线贴图的对比效果
2. 多种法线贴图图案(flat/bumpy/wave)切换
3. GUI控制法线强度
4. 旋转光源展示明暗变化

---

## 三、实现建议

### 3.1 分阶段开发策略

#### Phase 1: 切线生成器 (2-3小时)
```typescript
// 在 GeometryGenerator 中添加
static plane(options: PlaneOptions & { tangents?: boolean })
```
- 实现平面切线生成(最简单,切线固定指向U方向)
- 扩展 `VertexAttributeConfig` 支持tangent属性
- 更新 `GeometryData` 包含切线数据

#### Phase 2: 着色器实现 (1-2小时)
```glsl
// Vertex Shader
in vec3 aTangent;
out mat3 vTBN;

void main() {
  vec3 T = normalize(uNormalMatrix * aTangent);
  vec3 N = normalize(uNormalMatrix * aNormal);
  vec3 B = cross(N, T);
  vTBN = mat3(T, B, N);
}

// Fragment Shader
uniform sampler2D uNormalMap;
vec3 normalTS = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
vec3 normalWS = vTBN * normalTS;
```

#### Phase 3: Demo集成 (1小时)
- 复制 `phong-lighting.ts` 作为模板
- 添加法线贴图纹理绑定
- GUI控制: 法线强度、图案切换、启用开关

### 3.2 技术决策

**切线计算方法选择**:
- ✅ **推荐**: 基于UV梯度的三角形切线 (适用于任意网格)
- ❌ 避免: 手工指定(仅适用于简单几何体)

**法线贴图格式**:
- ✅ 使用现有 `ProceduralTexture.normalMap()`
- ✅ 格式: `RHITextureFormat.RGBA8_UNORM`
- ✅ 采样器: Linear过滤,避免阶梯伪影

**性能考虑**:
- TBN矩阵可在顶点着色器计算并插值(当前推荐)
- 也可在片元着色器中重构(节省varying,但计算量大)

### 3.3 参考资源
- **几何生成**: 当前 `sphere()` 方法的UV生成逻辑 (line 540-570)
- **光照计算**: `phong-lighting.ts` 的法线处理 (line 60, 310)
- **纹理集成**: `multi-textures.ts` 的多纹理绑定模式

---

## 四、工作量估算

| 任务 | 预计时间 | 优先级 |
|------|---------|--------|
| 平面几何切线生成 | 1.5h | P0 |
| 球体切线生成 | 2h | P1 |
| 立方体切线生成 | 2h | P2 |
| 切线空间着色器 | 1.5h | P0 |
| Normal-Mapping Demo | 1h | P0 |
| GUI交互和文档 | 1h | P1 |
| **总计** | **9h** | - |

---

## 五、验收标准

### 功能验收
1. ✅ 平面可正常显示法线贴图效果
2. ✅ 光源旋转时凹凸细节随之变化
3. ✅ 可切换启用/禁用法线贴图,对比差异
4. ✅ 法线强度可通过GUI实时调节

### 代码质量
1. ✅ 切线生成算法注释完整
2. ✅ 与现有 `GeometryGenerator` 风格一致
3. ✅ Shader代码包含TBN矩阵说明
4. ✅ Demo包含操作说明(DemoRunner.showHelp)

---

## 六、潜在风险

1. **UV不连续问题**: 立方体6个面的UV缝合处可能出现切线翻转
   - **缓解方案**: 为每个面生成独立顶点(不共享)

2. **法线贴图方向约定**: 不同工具生成的法线贴图可能Y轴相反
   - **缓解方案**: 提供 `flipY` 选项

3. **性能**: TBN矩阵增加3个vec3的varying传输
   - **影响**: 现代GPU影响可忽略,移动端需关注

---

## 附录: 关键代码位置

```
packages/rhi/demo/src/
├── utils/
│   ├── geometry/
│   │   ├── GeometryGenerator.ts      [需扩展: 添加切线生成]
│   │   └── types.ts                  [已就绪: tangent类型已定义]
│   └── texture/
│       ├── ProceduralTexture.ts      [已就绪: normalMap()可用]
│       └── types.ts                  [已就绪: NormalMapConfig定义]
├── phong-lighting.ts                 [参考模板: 法线处理流程]
└── normal-mapping.ts                 [待创建: 新Demo]
```

---

**调研完成时间**: 2025-12-15  
**调研者**: Radar (Investigator Agent)

---

## 七、外部参考资源

### 权威教程
1. **[LearnOpenGL - Normal Mapping](https://learnopengl.com/Advanced-Lighting/Normal-Mapping)**
   - 最全面的TBN矩阵实现教程
   - 包含顶点着色器和片元着色器完整代码

2. **[3DCoat - Normalize TB (2025最新)](https://3dcoat.com/documentation/2025/11/03/normalize-tb-tangent-basis/)**
   - 2025年11月更新的文档
   - 切线基(TBN矩阵)的规范化处理

3. **[David Bauer's Normal Mapping (Observable)](https://observablehq.com/@davidbauer/normal-mapping)**
   - 交互式可视化教程
   - 直观理解切线空间变换

### 实现参考
4. **[Stack Overflow - TBN Matrix Calculation](https://stackoverflow.com/questions/15324357/normal-mapping-tbn-matrix-calculation)**
   - 实战问题和解决方案
   - 眼空间(eye space)TBN转换

5. **[GitHub - normalMapping Demo](https://github.com/iamyoukou/normalMapping)**
   - 完整的法线贴图+视差效果实现
   - 可直接参考的代码示例

### 中文资源
6. **[CSDN - 法线贴图、TBN矩阵](https://blog.csdn.net/weixin_43399489/article/details/121403095)**
7. **[CNBlogs - 谈谈法线贴图](https://www.cnblogs.com/kekec/p/15799843.html)**

---

**报告更新**: 添加外部参考资源 (2025-12-15)

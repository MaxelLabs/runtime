# 高级光照Demo战役策略

**战役目标**: 完成第三层光照与材质系统的3个高级Demo
**战役日期**: 2025-12-15
**战役模式**: Campaign Mode（并行饱和打击）

---

## <Constitution> 全局宪法规则

**所有Worker必须严格遵守以下20条核心规则**：

### 图形学基础
1. **坐标系统**: 统一采用右手坐标系（+X右, +Y上, +Z前）
2. **矩阵内存布局**: 强制列主序（Column-Major），`m[col*4+row]`
3. **矩阵乘法顺序**: 后乘，`M_mvp = M_proj * M_view * M_model`
4. **MVP变换流程**: `P_clip = M_projection × M_view × M_model × P_local`
5. **浮点比较**: 禁止直接 `a === b`，必须使用 `EPSILON = 1e-6`

### std140对齐规则
6. `vec3`: **16字节**（必须添加4字节padding）
7. `mat4`: 64字节
8. Uniform块命名：块名大驼峰（`Transforms`），成员 `u` 前缀（`uModelMatrix`）

### 资源管理
9. **资源追踪**: 所有RHI资源必须通过 `runner.track()` 追踪
10. **资源标签**: 所有资源必须提供有意义的 `label` 参数
11. **纹理加载**: 强制启用 `flipY: true`
12. **纹理格式**: 默认 `RHITextureFormat.RGBA8_UNORM`

### 顶点与着色器标准
13. **顶点属性顺序**: `location = 0` (Position) → `1` (Normal) → `2` (UV) → `3` (Tangent)
14. **GLSL版本**: 强制 `#version 300 es`
15. **精度声明**: 顶点着色器 `precision highp float;`，片元着色器 `precision mediump float;`

### UI布局规范
16. **FPS显示器**: 左上角，使用 `Stats` 类
17. **GUI控制**: 右上角，使用 `SimpleGUI` 类
18. **Demo介绍面板**: 左下角
19. **Canvas容器**: 必须包裹在 `.container` div 中

### 禁止事项
20. ❌ 禁止省略 `runner.track()`（资源泄漏）
21. ❌ 禁止 `flipY: false` 加载纹理
22. ❌ 禁止直接对Canvas设置 `width: 100%; height: 100%` CSS（黑屏陷阱）
23. ❌ 禁止在渲染循环中创建新数学对象（GC压力）

---

## 执行块A: normal-mapping Demo

### 优先级: P1（中等）
### 工作量: 约9小时
### 复杂度: Level 2（需扩展工具）

### 技术需求
- **几何体扩展**: 为 `GeometryGenerator` 添加切线生成
- **Shader实现**: TBN矩阵构建和切线空间变换
- **纹理资源**: 使用 `ProceduralTexture.normalMap()`

### 实现步骤

**Step 1: 扩展几何体生成器**（2.5小时）
```typescript
// 在 GeometryGenerator.ts 中添加
static plane(options: PlaneOptions & { tangents?: boolean }): GeometryData {
  // 1. 生成基础顶点（position, normal, uv）
  // 2. 如果 options.tangents === true:
  //    - 计算切线方向（固定指向U轴正方向）
  //    - 计算副切线（cross(normal, tangent)）
  //    - 返回 tangents Float32Array
}

// 类似扩展 sphere() 和 cube()
```

**Step 2: 实现切线空间Shader**（1.5小时）
```glsl
// 顶点着色器
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;
in vec3 aTangent;  // 新增

out mat3 vTBN;     // 传递TBN矩阵

void main() {
  vec3 T = normalize(uNormalMatrix * aTangent);
  vec3 N = normalize(uNormalMatrix * aNormal);
  vec3 B = cross(N, T);
  vTBN = mat3(T, B, N);

  gl_Position = uProjectionMatrix * uViewMatrix * (uModelMatrix * vec4(aPosition, 1.0));
  vTexCoord = aTexCoord;
}

// 片元着色器
uniform sampler2D uNormalMap;
in mat3 vTBN;

void main() {
  // 从法线贴图采样（切线空间）
  vec3 normalTS = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;

  // 转换到世界空间
  vec3 normalWS = normalize(vTBN * normalTS);

  // Phong光照计算（使用转换后的法线）
  vec3 lighting = computePhongLighting(normalWS, ...);
  fragColor = vec4(lighting, 1.0);
}
```

**Step 3: 创建Demo主文件**（1小时）
```typescript
// packages/rhi/demo/src/normal-mapping.ts
import { DemoRunner, GeometryGenerator, OrbitController, Stats, SimpleGUI, ProceduralTexture } from './utils';

// 1. 初始化DemoRunner
// 2. 生成平面几何体（启用tangents选项）
// 3. 创建Uniform Buffers（Transforms + Lighting + Camera）
// 4. 加载法线贴图（ProceduralTexture.normalMap({ pattern: 'bumpy' })）
// 5. 创建RenderPipeline（包含tangent属性）
// 6. 渲染循环
```

**Step 4: GUI和HTML入口**（1小时）
- 添加法线强度滑块
- 添加图案切换（flat/bumpy/wave）
- 添加启用/禁用开关
- 创建 `html/normal-mapping.html`
- 在 `demo/index.html` 注册卡片

### Constitution检查清单
- [ ] 右手坐标系：`X × Y = Z`
- [ ] std140对齐：Uniform块使用 `ShaderUtils.calculateUniformBlockSize()`
- [ ] 资源追踪：所有资源使用 `runner.track()`
- [ ] 纹理翻转：`flipY: true`
- [ ] 顶点属性顺序：Position(0) → Normal(1) → UV(2) → Tangent(3)
- [ ] UI布局：Stats左上 + GUI右上 + 介绍左下
- [ ] Canvas容器：使用 `.container` 包裹
- [ ] HTML注册：在 `index.html` 中添加Demo卡片

### 预期输出
- ✅ `packages/rhi/demo/src/normal-mapping.ts`（约300行）
- ✅ `packages/rhi/demo/html/normal-mapping.html`
- ✅ `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`（扩展切线生成）
- ✅ 在 `demo/index.html` 注册Demo卡片

---

## 执行块B: environment-mapping Demo

### 优先级: P0（高，技术栈完备度70%）
### 工作量: Phase 1 最小化 2-4小时，完整版 6-10小时
### 复杂度: Level 1-2（可快速验证）

### 技术需求
- **立方体贴图**: 复用 `CubemapGenerator.loadFromUrls()`
- **反射Shader**: `reflect(-viewDir, normal)` + 立方体采样
- **折射Shader**: `refract(-viewDir, normal, eta)` (Phase 2)
- **Fresnel**: Schlick近似（Phase 2）

### 实现步骤（Phase 1: 纯反射）

**Step 1: 复用立方体贴图加载**（0.5小时）
```typescript
// 直接复制 cubemap-skybox.ts 的加载代码
import { CubemapGenerator } from './utils';

const cubemapUrls = {
  posX: 'https://cdn.jsdelivr.net/gh/...Bridge2/posx.jpg',
  negX: '...negx.jpg',
  posY: '...posy.jpg',
  negY: '...negy.jpg',
  posZ: '...posz.jpg',
  negZ: '...negz.jpg',
};

const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);
```

**Step 2: 实现反射Shader**（1小时）
```glsl
// 顶点着色器
in vec3 aPosition;
in vec3 aNormal;

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}

// 片元着色器
uniform samplerCube uEnvironmentMap;
uniform vec3 uCameraPosition;

in vec3 vWorldPosition;
in vec3 vNormal;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // 计算反射方向
  vec3 reflectDir = reflect(-viewDir, normal);

  // 采样环境贴图
  vec3 reflectionColor = texture(uEnvironmentMap, reflectDir).rgb;

  fragColor = vec4(reflectionColor, 1.0);
}
```

**Step 3: 创建Demo主文件**（1小时）
```typescript
// packages/rhi/demo/src/environment-mapping.ts
// 1. 加载立方体贴图（复用cubemap-skybox代码）
// 2. 生成球体几何体（GeometryGenerator.sphere()）
// 3. 创建Uniform Buffers（Transforms + Camera）
// 4. 绑定立方体贴图到 samplerCube
// 5. 渲染循环
```

**Step 4: GUI和HTML入口**（0.5小时）
- 添加反射强度滑块
- 创建 `html/environment-mapping.html`
- 在 `demo/index.html` 注册卡片

### Phase 2 扩展（Optional，+4-6小时）
- 实现Fresnel效果
- 添加refract()折射
- 材质预设切换（Chrome/Glass/Water）

### Constitution检查清单
- [ ] 立方体贴图面顺序：posX/negX/posY/negY/posZ/negZ
- [ ] samplerCube绑定正确
- [ ] 相机位置Uniform：`vec3 uCameraPosition + padding`
- [ ] std140对齐
- [ ] 资源追踪
- [ ] UI布局标准

### 预期输出
- ✅ `packages/rhi/demo/src/environment-mapping.ts`（约200行）
- ✅ `packages/rhi/demo/html/environment-mapping.html`
- ✅ 在 `demo/index.html` 注册Demo卡片

---

## 执行块C: pbr-material Demo

### 优先级: P0（高，代码可复用>90%）
### 工作量: 1-2小时（快速原型）
### 复杂度: Level 1（直接移植）

### 关键发现
**PBR Shader代码已完整实现**！位于：`/packages/core/demo/src/lighting.ts`

包含完整的Cook-Torrance BRDF：
- `DistributionGGX()` - GGX法线分布函数
- `GeometrySchlickGGX()` + `GeometrySmith()` - 几何衰减
- `fresnelSchlick()` - Fresnel反射
- HDR色调映射 + Gamma校正

### 实现步骤

**Step 1: 复制PBR Shader代码**（30分钟）
```glsl
// 从 /packages/core/demo/src/lighting.ts 复制以下函数：
// - DistributionGGX()
// - GeometrySchlickGGX()
// - GeometrySmith()
// - fresnelSchlick()

// 调整Uniform布局为std140：
uniform PBRMaterial {
  vec3 uAlbedo;           // 16 bytes (12 + 4 padding)
  float uMetallic;        // 4 bytes
  float uRoughness;       // 4 bytes
  float uAmbientStrength; // 4 bytes
  float _padding[2];      // 8 bytes
};  // 总计 32 bytes
```

**Step 2: 创建Demo框架**（30分钟）
```typescript
// packages/rhi/demo/src/pbr-material.ts
import { DemoRunner, GeometryGenerator, OrbitController, Stats, SimpleGUI } from './utils';

// 1. 初始化DemoRunner
// 2. 生成球体几何体
// 3. 创建PBR Material Uniform Buffer（32 bytes）
// 4. 复用point-lights的点光源系统（1-2个光源）
// 5. 渲染循环
```

**Step 3: GUI参数控制**（30分钟）
```typescript
const gui = new SimpleGUI();
gui.add('metallic', { value: 0.5, min: 0, max: 1, onChange: updateMaterial });
gui.add('roughness', { value: 0.5, min: 0, max: 1, onChange: updateMaterial });
gui.addColorPicker('albedo', { value: [255, 0, 0], onChange: updateMaterial });
```

**Step 4: HTML入口**（10分钟）
- 创建 `html/pbr-material.html`
- 在 `demo/index.html` 注册卡片

### Constitution检查清单
- [ ] std140对齐：PBRMaterial块32字节
- [ ] 光源配置：复用 `point-lights.ts` 的PointLight结构
- [ ] 资源追踪
- [ ] UI布局标准

### 预期输出
- ✅ `packages/rhi/demo/src/pbr-material.ts`（约250行）
- ✅ `packages/rhi/demo/html/pbr-material.html`
- ✅ 在 `demo/index.html` 注册Demo卡片

---

## 战略优先级

### 推荐顺序（按技术风险和成本排序）

1. **pbr-material** (P0, 1-2小时) - 风险最低，代码可复用>90%
2. **environment-mapping** (P0, 2-4小时) - 风险低，技术栈完备70%
3. **normal-mapping** (P1, 9小时) - 风险中等，需扩展工具链

### 并行执行可行性分析

✅ **强烈推荐并行执行**

**理由**：
- 3个Demo技术独立，无依赖关系
- 共享基础设施（DemoRunner、OrbitController、Stats）已稳定
- Constitution规则统一，无冲突风险
- 预期节省时间：30-40%

**并行策略**：
- Worker A: pbr-material（快速完成，建立信心）
- Worker B: environment-mapping（中等难度，验证立方体贴图）
- Worker C: normal-mapping（最复杂，独立开发）

---

## 质量保证清单

### 代码一致性
- [ ] 所有Demo使用统一的DemoRunner初始化模式
- [ ] 所有Demo使用OrbitController相机控制
- [ ] 所有Demo包含Stats性能监控
- [ ] 所有Uniform块使用std140对齐
- [ ] 所有资源使用 `runner.track()` 追踪

### 文档完整性
- [ ] 每个Demo创建对应的HTML入口（`html/<demo-name>.html`）
- [ ] 所有Demo在 `demo/index.html` 中注册卡片
- [ ] 每个Demo添加操作说明（DemoRunner.showHelp）
- [ ] 创建参考文档（`llmdoc/reference/<demo-name>-demo.md`）

### 性能基准
- [ ] FPS ≥ 60（桌面浏览器）
- [ ] FPS ≥ 30（移动浏览器）
- [ ] 无内存泄漏（运行10分钟后检查）

---

## 战役时间估算

### 顺序执行（Sequential Mode）
- pbr-material: 1-2小时
- environment-mapping: 2-4小时
- normal-mapping: 9小时
- **总计**: 12-15小时

### 并行执行（Parallel Mode）
- 阶段1（并行开发）: Max(2h, 4h, 9h) = **9小时**
- 阶段2（批量审查）: 1小时
- 阶段3（文档归档）: 1小时
- **总计**: **11小时**（节省 1-4小时）

---

## 风险矩阵

| Demo | 技术风险 | 工作量 | 依赖关系 | 推荐模式 |
|------|---------|--------|---------|----------|
| pbr-material | 🟢 低 | 1-2h | 无 | 并行优先 |
| environment-mapping | 🟡 中低 | 2-4h | 无 | 并行 |
| normal-mapping | 🟡 中 | 9h | 无 | 并行/顺序均可 |

---

## 交付物清单

### 代码文件
- [ ] `packages/rhi/demo/src/normal-mapping.ts`
- [ ] `packages/rhi/demo/src/environment-mapping.ts`
- [ ] `packages/rhi/demo/src/pbr-material.ts`
- [ ] `packages/rhi/demo/html/normal-mapping.html`
- [ ] `packages/rhi/demo/html/environment-mapping.html`
- [ ] `packages/rhi/demo/html/pbr-material.html`
- [ ] `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`（扩展切线生成）

### 文档文件
- [ ] `llmdoc/reference/normal-mapping-demo.md`
- [ ] `llmdoc/reference/environment-mapping-demo.md`
- [ ] `llmdoc/reference/pbr-material-demo.md`
- [ ] 更新 `llmdoc/guides/demo-development.md`（添加新Demo记录）
- [ ] 更新 `llmdoc/index.md`（索引新Demo文档）

### HTML注册
- [ ] `packages/rhi/demo/index.html` 添加3个Demo卡片

---

## 成功标准

### 功能验收
- [ ] 所有Demo可正常启动和运行
- [ ] 键盘快捷键工作正常（ESC/F11/R）
- [ ] 鼠标交互正常（旋转/缩放/平移）
- [ ] GUI参数实时生效
- [ ] FPS显示正常

### 视觉验收
- [ ] normal-mapping: 光源旋转时凹凸细节清晰可见
- [ ] environment-mapping: 反射效果准确，环境贴图无拉伸
- [ ] pbr-material: 金属度/粗糙度调节效果明显

### 代码质量
- [ ] 通过Critic审查（无Constitution违规）
- [ ] 无TypeScript类型错误
- [ ] 无WebGL警告或错误
- [ ] 无资源泄漏（通过浏览器DevTools验证）

---

**战略文档版本**: v1.0
**制定日期**: 2025-12-15
**下一步**: 等待用户批准执行模式（Parallel/Sequential/TDD）

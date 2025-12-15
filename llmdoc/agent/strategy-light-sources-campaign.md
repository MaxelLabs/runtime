# Light Sources Campaign Strategy

## <Constitution> 全局规范（所有 Worker 必读）

### 几何体选择
- **优先推荐**：球体（Sphere）用于环境光演示
- **要求**：必须使用索引绘制（IndexBuffer）
- **法线要求**：几何体必须包含法线信息（`normals: true`）

### GUI 参数命名规范
- **滑块参数**：使用 camelCase，如 `lightIntensity`、`rotationSpeed`
- **布尔开关**：使用 camelCase，如 `autoRotate`、`enableLighting`
- **位置**：SimpleGUI 固定在右上角

### 着色器精度和版本
- **强制版本**：`#version 300 es`
- **顶点着色器**：`precision highp float;`
- **片元着色器**：`precision mediump float;`

### Uniform Block 布局规则
- **命名规范**：
  - Block：大驼峰（`Lighting`、`Transforms`）
  - 成员：小驼峰 + u 前缀（`uLightPosition`、`uLightColor`）
- **std140 对齐**：
  - `vec3` 必须对齐到 16 字节
  - `mat4` 占 64 字节

### 资源管理要求
- **强制追踪**：所有 RHI 资源必须通过 `runner.track()` 追踪
- **标签要求**：必须提供有意义的 `label`
- **Buffer Hint**：
  - 静态数据：`hint: 'static'`
  - 动态数据：`hint: 'dynamic'`

### HTML 文件规范
- **CSS 引用**：
  ```html
  <link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>
  <link rel="stylesheet" href="../css/demo-styles.css" />
  ```
- **JS 引用**：`<script type="module" src="../src/[demo-name].ts"></script>`
- **Canvas 容器**：必须包裹在 `.container` div 中
- **信息面板**：必须包含 `.info-panel`

---

## BLOCK A: directional-light Demo

### A1. 技术定义
- **光源类型**：平行光（Directional Light）
- **核心特征**：光线平行，无位置，无衰减
- **典型应用**：太阳光、月光
- **实现方式**：使用方向向量，忽略光源位置

### A2. 文件清单
1. `packages/rhi/demo/src/directional-light.ts`
2. `packages/rhi/demo/html/directional-light.html`
3. `llmdoc/reference/directional-light-demo.md`

### A3. 实现要点
**几何体选择：** `GeometryGenerator.sphere({ radius: 1, normals: true })`

**着色器特殊性：**
- 使用光照方向向量（而非位置）
- 无距离衰减计算
- Lambert 漫反射 + Phong 镜面反射

**Uniform Buffer 布局（std140）：**
```glsl
uniform DirectionalLight {
  vec3 uLightDirection;    // 16 bytes (with padding)
  vec3 uLightColor;        // 16 bytes (with padding)
  float uAmbientIntensity; // 4 bytes
  float uDiffuseIntensity; // 4 bytes
  float uSpecularIntensity;// 4 bytes
  float uShininess;        // 4 bytes
};
// Total: 48 bytes
```

**GUI 参数：**
- lightDirX/Y/Z: 光照方向（-5 到 5）
- ambientIntensity: 环境光强度（0-1）
- diffuseIntensity: 漫反射强度（0-1）
- specularIntensity: 镜面反射强度（0-1）
- shininess: 高光指数（1-128）

### A4. 代码差异点（vs phong-lighting.ts）
- 使用方向向量代替位置向量
- 移除距离衰减计算
- Uniform Buffer 布局调整

### A5. 验证标准
- [ ] 球体表面光照均匀（无距离衰减）
- [ ] 旋转光照方向时效果明显
- [ ] GUI 可调整所有光照参数

---

## BLOCK B: point-lights Demo

### B1. 技术定义
- **光源类型**：点光源（Point Light）
- **核心特征**：从点发出，距离衰减
- **典型应用**：灯泡、火把、蜡烛
- **实现方式**：使用位置向量 + 距离衰减公式

### B2. 文件清单
1. `packages/rhi/demo/src/point-lights.ts`
2. `packages/rhi/demo/html/point-lights.html`
3. `llmdoc/reference/point-lights-demo.md`

### B3. 实现要点
**几何体选择：** `GeometryGenerator.sphere({ radius: 1, normals: true })`

**多光源支持：** 使用数组存储多个点光源（最多 4 个）

**距离衰减公式：**
```glsl
float distance = length(lightPosition - fragPosition);
float attenuation = 1.0 / (constant + linear * distance + quadratic * distance * distance);
```

**Uniform Buffer 布局（std140）：**
```glsl
struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes
};
// Total per light: 48 bytes

uniform PointLights {
  PointLight uLights[4];  // 192 bytes
  int uLightCount;        // 4 bytes
  float uAmbientIntensity;// 4 bytes
  float uShininess;       // 4 bytes
  float _padding;         // 4 bytes
};
// Total: 208 bytes
```

**GUI 参数：**
- lightCount: 点光源数量（1-4）
- light1PosX/Y/Z: 第一个光源位置
- light1Constant/Linear/Quadratic: 衰减系数
- （每个光源独立控制）

### B4. 代码差异点（vs phong-lighting.ts）
- 添加距离衰减计算
- 支持多光源循环累加
- Uniform Buffer 数组布局

### B5. 验证标准
- [ ] 球体表面呈现明显的距离衰减效果
- [ ] 多光源叠加正确
- [ ] 可调整光源位置和衰减参数

---

## BLOCK C: spotlight Demo

### C1. 技术定义
- **光源类型**：聚光灯（Spotlight）
- **核心特征**：锥形光束，方向 + 角度
- **典型应用**：手电筒、舞台灯、车灯
- **实现方式**：位置 + 方向 + 内外锥角 + 距离衰减

### C2. 文件清单
1. `packages/rhi/demo/src/spotlight.ts`
2. `packages/rhi/demo/html/spotlight.html`
3. `llmdoc/reference/spotlight-demo.md`

### C3. 实现要点
**几何体选择：** `GeometryGenerator.sphere({ radius: 1, normals: true })`

**锥角计算：**
```glsl
vec3 lightDir = normalize(uLightPosition - fragPosition);
float theta = dot(lightDir, normalize(-uLightDirection));
float epsilon = uInnerCutoff - uOuterCutoff;
float intensity = clamp((theta - uOuterCutoff) / epsilon, 0.0, 1.0);
```

**Uniform Buffer 布局（std140）：**
```glsl
uniform Spotlight {
  vec3 uLightPosition;     // 16 bytes (with padding)
  vec3 uLightDirection;    // 16 bytes (with padding)
  vec3 uLightColor;        // 16 bytes (with padding)
  float uInnerCutoff;      // 4 bytes (cos of inner angle)
  float uOuterCutoff;      // 4 bytes (cos of outer angle)
  float uConstant;         // 4 bytes
  float uLinear;           // 4 bytes
  float uQuadratic;        // 4 bytes
  float uAmbientIntensity; // 4 bytes
  float uShininess;        // 4 bytes
  float _padding;          // 4 bytes
};
// Total: 80 bytes
```

**GUI 参数：**
- lightPosX/Y/Z: 光源位置
- lightDirX/Y/Z: 光照方向
- innerAngle: 内锥角（度）
- outerAngle: 外锥角（度）
- constant/linear/quadratic: 衰减系数

### C4. 代码差异点（vs point-lights.ts）
- 添加方向向量和锥角计算
- 边缘平滑过渡（smoothstep）
- 角度需转换为余弦值

### C5. 验证标准
- [ ] 球体表面呈现明显的锥形光束效果
- [ ] 内外锥角过渡平滑
- [ ] 可调整光源位置、方向和锥角

---

## 共享资源（所有 Block 复用）

### 可直接复用（来自 phong-lighting.ts）
```typescript
// 1. DemoRunner 初始化
const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: '[Demo Name]',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});

// 2. Stats 和 OrbitController
const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
const orbit = new OrbitController(runner.canvas, { distance: 3.5 });

// 3. 球体几何体生成
const geometry = GeometryGenerator.sphere({
  radius: 1,
  normals: true,
  uvs: false,
});

// 4. MVP 矩阵
const modelMatrix = new MMath.Matrix4();
const viewMatrix = new MMath.Matrix4();
const projectionMatrix = new MMath.Matrix4();
```

### 需要修改的部分
- 着色器代码（光照计算不同）
- Uniform Buffer 布局（参数不同）
- GUI 参数（根据光源类型调整）

---

## Execution Order（执行顺序）

**推荐：Parallel Mode（并行模式）**
- BLOCK A, B, C 之间无依赖关系
- 可以同时启动 3 个 Worker 并行开发
- 最大化开发效率

---

## Quality Gates（质量门禁）

**Critic 检查项：**
1. **Constitution 合规性：**
   - [ ] 所有资源使用 `runner.track()`
   - [ ] Uniform Block 使用 std140 对齐
   - [ ] 着色器精度一致性
   - [ ] HTML 文件使用正确的 CSS 和 JS 引用

2. **光照正确性：**
   - [ ] 光照计算公式正确
   - [ ] 距离衰减效果明显（点光源、聚光灯）
   - [ ] 锥角计算正确（聚光灯）

3. **代码一致性：**
   - [ ] 3 个 Demo 的文件结构一致
   - [ ] GUI 参数命名规范统一
   - [ ] 注释和文档风格一致

---

## Recorder 更新清单

**需要更新的文档：**
1. `llmdoc/guides/demo-development.md` — 更新第三层完成度
2. `llmdoc/index.md` — 添加 3 个新 Demo 的索引
3. `packages/rhi/demo/index.html` — 添加 3 个 Demo 卡片

---

## Timeline Estimate（时间预估）

- **Parallel Mode**: 40-60 分钟（3 个 Worker 同时）
- **Sequential Mode**: 90-120 分钟（逐个开发）
- **Critic Review**: 15-20 分钟
- **Documentation Update**: 10-15 分钟

**Total**: 约 1.5-2 小时完成全部 3 个 Demo

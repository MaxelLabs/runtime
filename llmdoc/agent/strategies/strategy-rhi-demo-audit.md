# RHI Demo 全面审查与优化策略

## <Constitution>（宪法约束）

### 图形渲染核心规则
1. **坐标系统**: 右手坐标系（+X向右，+Y向上，+Z向前）
2. **矩阵顺序**: 列主序（Column-Major），内存布局为 `m[col*4+row]`
3. **矩阵乘法**: 后乘（Post-multiplication），`A.multiply(B) = A × B`
4. **MVP变换**: `P_clip = M_proj × M_view × M_model × P_local`
5. **数值精度**: 使用 `EPSILON = 1e-6` 进行浮点数比较

### RHI Demo实现规范
1. **资源管理**:
   - 所有RHI资源必须使用 `runner.track()` 追踪
   - 所有资源必须提供有意义的 `label`
   - Buffer对齐遵循std140规则（vec3占用16字节）

2. **性能规范**:
   - 禁止在渲染循环中创建新对象（Matrix4, Vector3等）
   - 必须使用对象池模式
   - 避免不必要的GPU状态切换

3. **着色器规范**:
   - 必须声明 `#version 300 es`
   - 顶点着色器使用 `highp float`
   - 片元着色器使用 `mediump float`
   - 顶点属性使用 `a` 前缀（`aPosition`, `aNormal`, `aTexCoord`）
   - Uniform Block使用 `std140` 布局
   - Varying变量使用 `v` 前缀

4. **UI布局规范**:
   - FPS显示器：左上角（`top: 10px; left: 10px;`）
   - SimpleGUI：右上角（`top: 10px; right: 10px;`）
   - 信息面板：右下角（可选，最大宽度400px）

5. **HTML文件规范**:
   - 强制引用 `antui.css` 和 `demo-styles.css`
   - Canvas必须包裹在 `.container` div中
   - JavaScript引用使用 `src/` 路径

## <AuditScope>（审查范围）

### 1. 代码质量审查

#### 1.1 Constitution合规性
- [ ] 资源追踪：所有Buffer/Texture/Shader是否使用 `runner.track()`
- [ ] 资源标签：所有资源是否有有意义的 `label`
- [ ] std140对齐：Uniform Buffer中vec3是否正确对齐到16字节
- [ ] 着色器版本：是否声明 `#version 300 es`
- [ ] 着色器精度：是否正确使用 `highp`/`mediump`
- [ ] 命名规范：顶点属性是否使用 `a` 前缀，varying是否使用 `v` 前缀

#### 1.2 API一致性
- [ ] DemoRunner使用：是否正确实现 `setup()`/`render()`/`cleanup()`
- [ ] 几何体生成：是否使用 `GeometryGenerator` 而非手写顶点数据
- [ ] 纹理加载：是否使用 `TextureLoader` 统一加载
- [ ] 相机控制：是否使用 `OrbitController` 提供交互

#### 1.3 错误处理
- [ ] 资源加载失败处理
- [ ] 着色器编译错误捕获
- [ ] WebGL上下文丢失处理
- [ ] 用户输入验证

### 2. 性能优化

#### 2.1 对象创建优化
- [ ] 渲染循环中是否创建临时对象（Matrix4, Vector3等）
- [ ] 是否使用对象池或预分配对象
- [ ] 是否复用几何体和纹理

#### 2.2 资源管理优化
- [ ] 是否正确释放不再使用的资源
- [ ] 是否避免重复创建相同资源
- [ ] 纹理是否使用合适的格式和大小

#### 2.3 渲染效率优化
- [ ] 是否使用索引绘制减少顶点数据
- [ ] 是否批量绘制相同材质的对象
- [ ] 是否避免不必要的状态切换

### 3. 文档完善

#### 3.1 llmdoc索引
- [ ] 所有32个Demo是否在 `llmdoc/index.md` 中列出
- [ ] 是否按类别（基础/纹理/光照）组织
- [ ] 是否提供Demo的简短描述

#### 3.2 技术文档
- [ ] 每个Demo是否有对应的技术文档（在 `llmdoc/reference/`）
- [ ] 是否说明Demo的技术要点和实现原理
- [ ] 是否提供关键代码片段和注释

#### 3.3 参数文档
- [ ] SimpleGUI中的参数是否有清晰的说明
- [ ] 参数范围是否合理
- [ ] 是否提供默认值说明

### 4. 用户体验改进

#### 4.1 UI布局
- [ ] FPS显示器是否在左上角
- [ ] SimpleGUI是否在右上角
- [ ] UI元素是否遮挡重要内容

#### 4.2 交互反馈
- [ ] 相机控制是否流畅
- [ ] 参数调节是否实时生效
- [ ] 是否提供重置功能

#### 4.3 帮助信息
- [ ] 是否显示操作提示（鼠标/键盘控制）
- [ ] 是否说明Demo的目的和效果
- [ ] 是否提供相关技术链接

## <ExecutionPlan>（执行计划）

### Phase 1: 自动化扫描（批量检查）

**目标**: 使用Grep快速识别常见问题

**检查项**:
1. 资源追踪缺失：搜索 `createBuffer`/`createTexture`/`createShader` 但未跟随 `track()`
2. 对象创建问题：搜索 `new Matrix4`/`new Vector3` 在 `render()` 函数中
3. 调试代码残留：搜索 `console.log`/`console.warn`/`debugger`
4. 魔法数字：搜索硬编码的数值（如 `0.5`, `1.0` 等未定义为常量）
5. 着色器版本：搜索缺少 `#version 300 es` 的着色器
6. HTML引用错误：搜索 `dist/` 路径引用

**输出**: 问题清单和受影响的Demo列表

### Phase 2: 分类审查（逐个检查）

**目标**: 按Demo类别进行深度审查

#### 2.1 基础功能Demo（11个）
- triangle, colored-triangle, depth-test, quad-indexed
- primitive-types, viewport-scissor, blend-modes
- rotating-cube, multiple-buffers, dynamic-buffer
- vertex-formats, stencil-test

**重点检查**:
- 基础API使用是否规范
- 是否作为其他Demo的参考模板
- 代码可读性和教学价值

#### 2.2 纹理系统Demo（10个）
- texture-2d, texture-wrapping, texture-filtering, mipmaps
- multi-textures, cubemap-skybox, render-to-texture
- procedural-texture, texture-array, compressed-texture

**重点检查**:
- 纹理加载和采样是否正确
- 纹理坐标是否符合规范
- 是否正确处理纹理格式

#### 2.3 光照系统Demo（11个）
- flat-shading, gouraud-shading, phong-lighting
- directional-light, point-lights, spotlight
- normal-mapping, environment-mapping, pbr-material

**重点检查**:
- 光照计算是否在线性空间
- 法线变换是否正确
- PBR材质是否符合物理规律

### Phase 3: 工具库优化

**目标**: 审查和优化核心工具组件

**组件清单**:
1. **DemoRunner** (`core/DemoRunner.ts`)
   - 生命周期管理是否完善
   - 资源追踪是否可靠
   - 错误处理是否健壮

2. **OrbitController** (`camera/OrbitController.ts`)
   - 相机控制是否流畅
   - 边界限制是否合理
   - 性能是否优化

3. **GeometryGenerator** (`geometry/GeometryGenerator.ts`)
   - 几何体生成是否正确
   - 是否支持所有常用几何体
   - 是否提供UV坐标和法线

4. **TextureLoader** (`texture/TextureLoader.ts`)
   - 纹理加载是否异步
   - 是否支持所有纹理格式
   - 是否提供加载进度

5. **Stats** (`ui/Stats.ts`)
   - FPS计算是否准确
   - 显示位置是否符合规范
   - 性能开销是否最小

6. **SimpleGUI** (`ui/SimpleGUI.ts`)
   - 参数控制是否灵活
   - UI布局是否符合规范
   - 是否支持所有参数类型

### Phase 4: 文档同步

**目标**: 更新llmdoc索引和技术文档

**任务清单**:
1. 更新 `llmdoc/index.md`
   - 添加所有32个Demo的索引
   - 按类别组织
   - 提供简短描述和链接

2. 创建/更新技术文档
   - 为每个Demo类别创建技术文档
   - 说明实现原理和关键技术
   - 提供代码示例和最佳实践

3. 更新参考文档
   - 确保 `graphics-bible.md` 包含所有图形规范
   - 确保 `rhi-demo-constitution.md` 包含所有Demo规范
   - 更新 `technical-debt.md` 记录已修复的问题

### Phase 5: 验证测试

**目标**: 确保所有Demo正常运行，无回归

**测试清单**:
1. **功能测试**
   - 所有32个Demo是否能正常启动
   - 所有交互功能是否正常工作
   - 所有参数调节是否生效

2. **性能测试**
   - FPS是否达到60fps
   - 内存使用是否稳定
   - 是否存在内存泄漏

3. **兼容性测试**
   - 是否在Chrome/Firefox/Safari上正常运行
   - 是否在不同分辨率下正常显示
   - 是否在移动设备上正常运行

4. **回归测试**
   - 运行现有的单元测试
   - 确保修改未破坏现有功能
   - 确保性能未下降

## <ChecklistTemplate>（检查清单模板）

### Demo检查清单：[Demo名称]

#### 代码质量
- [ ] 资源追踪：所有资源使用 `runner.track()`
- [ ] 资源标签：所有资源有 `label`
- [ ] std140对齐：Uniform Buffer正确对齐
- [ ] 着色器版本：声明 `#version 300 es`
- [ ] 着色器精度：正确使用精度限定符
- [ ] 命名规范：符合 `a`/`v` 前缀规范
- [ ] API一致性：正确使用DemoRunner和工具库
- [ ] 错误处理：有资源加载和编译错误处理

#### 性能优化
- [ ] 无临时对象：渲染循环中无 `new` 操作
- [ ] 对象池：使用预分配对象或对象池
- [ ] 资源复用：避免重复创建资源
- [ ] 索引绘制：使用索引减少顶点数据
- [ ] 状态优化：避免不必要的状态切换

#### 文档完善
- [ ] llmdoc索引：在 `llmdoc/index.md` 中列出
- [ ] 技术文档：有对应的技术说明文档
- [ ] 参数文档：SimpleGUI参数有清晰说明
- [ ] 代码注释：关键代码有注释说明

#### 用户体验
- [ ] UI布局：FPS左上角，GUI右上角
- [ ] 交互流畅：相机控制流畅，参数实时生效
- [ ] 帮助信息：有操作提示和Demo说明
- [ ] HTML规范：正确引用CSS和JS文件

#### 测试验证
- [ ] 功能正常：Demo能正常启动和运行
- [ ] 性能良好：FPS稳定在60fps
- [ ] 无内存泄漏：长时间运行内存稳定
- [ ] 跨浏览器：在主流浏览器上正常运行

## <RiskAssessment>（风险评估）

### 高风险项
1. **批量修改引入回归**
   - 风险：修改32个Demo可能引入新的bug
   - 缓解：每修改一个Demo立即测试，使用版本控制
   - 应对：保留原始代码备份，出现问题快速回滚

2. **性能优化影响功能**
   - 风险：对象池等优化可能影响代码逻辑
   - 缓解：先在单个Demo上验证，再推广到其他Demo
   - 应对：保留性能测试基准，对比优化前后

3. **着色器修改破坏渲染**
   - 风险：修改着色器可能导致渲染错误
   - 缓解：逐个测试着色器修改，保留原始着色器
   - 应对：使用着色器版本管理，支持快速切换

### 中风险项
1. **文档更新遗漏**
   - 风险：文档可能与代码不同步
   - 缓解：使用检查清单确保文档完整
   - 应对：定期审查文档，建立文档更新流程

2. **工具库修改影响范围广**
   - 风险：工具库修改影响所有使用它的Demo
   - 缓解：先在少数Demo上测试工具库修改
   - 应对：保持工具库API稳定，避免破坏性修改

### 低风险项
1. **UI布局调整**
   - 风险：UI调整可能影响用户习惯
   - 缓解：遵循统一的UI规范
   - 应对：提供UI配置选项

2. **代码风格统一**
   - 风险：代码风格修改可能引入语法错误
   - 缓解：使用自动化工具（如Prettier）
   - 应对：代码审查和测试

## <SuccessCriteria>（成功标准）

### 必须达成（Must Have）
1. **零回归**: 所有32个Demo在审查后仍能正常运行
2. **Constitution合规**: 所有Demo符合宪法规则（资源追踪、std140对齐、着色器规范）
3. **性能达标**: 所有Demo在主流浏览器上FPS稳定在60fps
4. **文档完整**: 所有Demo在llmdoc中有索引和技术文档

### 应该达成（Should Have）
1. **性能优化**: 修复CRITICAL和HIGH级别的技术债务（内存泄漏、对象创建）
2. **代码质量**: 移除调试代码，定义魔法数字为常量
3. **用户体验**: UI布局统一，交互流畅，有帮助信息
4. **测试覆盖**: 核心工具库有单元测试

### 可以达成（Nice to Have）
1. **文档增强**: 提供更详细的技术说明和最佳实践
2. **工具优化**: 工具库功能更完善，性能更优
3. **跨平台**: 在移动设备上也能正常运行
4. **国际化**: 支持多语言UI和文档

## <ExecutionNotes>（执行注意事项）

### 优先级排序
1. **P0 - 阻塞性问题**: 资源泄漏、渲染错误、无法运行
2. **P1 - 严重问题**: 性能问题、Constitution违规、文档缺失
3. **P2 - 一般问题**: 代码风格、UI布局、帮助信息
4. **P3 - 优化项**: 代码重构、功能增强、文档完善

### 修改原则
1. **最小修改**: 只修改必要的部分，避免过度重构
2. **保持一致**: 所有Demo使用统一的模式和风格
3. **向后兼容**: 工具库修改不破坏现有Demo
4. **测试驱动**: 每次修改后立即测试验证

### 沟通机制
1. **进度汇报**: 每完成一个类别的Demo审查后汇报
2. **问题上报**: 发现重大问题立即上报
3. **决策请求**: 遇到多种方案时请求用户决策
4. **最终验收**: 所有审查完成后提交验收报告

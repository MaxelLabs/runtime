# Strategy: Fix Multi-Textures Demo Visual Issues

## 1. Analysis
* **Context:** 多纹理混合演示展示了一个旋转的立方体，使用5种混合模式（Linear、Multiply、Screen、Overlay、Mask）来混合两个纹理。用户报告立方体看起来"抽象"或"不完整"。
* **Root Cause:** 通过代码审查发现，虽然 DemoRunner 创建了深度缓冲区并在渲染通道中配置了深度附件，但渲染管线创建时没有启用深度测试。这导致立方体的面按绘制顺序而非深度顺序渲染，造成视觉错误。
* **Risk:** 低风险 - 只需在渲染管线创建时添加深度状态配置即可。

## 2. Assessment
<Assessment>
**Complexity:** Low
**Impacted Layers:** 渲染管线配置
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Block 1: 启用深度测试（主要修复）**
1. 在 `packages/rhi/demo/src/multi-textures.ts` 第378-388行，修改 `createRenderPipeline` 调用，添加深度状态：
   ```typescript
   depthStencil: {
     depthWriteEnabled: true,
     depthCompare: 'less',
     format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
   },
   ```

**Block 2: 启用面剔除（可选优化）**
2. 同时添加面剔除配置以提升性能和避免内部面渲染：
   ```typescript
   cullMode: 'back',
   ```

**Block 3: 验证混合模式（质量检查）**
3. 检查着色器中的混合模式公式是否正确：
   - `Overlay` 公式（第71-77行）：✓ 正确
   - `Screen` 公式（第67-69行）：✓ 正确
   - `Multiply` 公式（第63-65行）：✓ 正确

**Block 4: 改进遮罩边缘（可选）**
4. 考虑将 Mask 模式中的 `step` 函数改为 `smoothstep` 以获得更柔和的边缘：
   - 当前（第107行）：`step(uMaskThreshold, mask)`
   - 建议：`smoothstep(uMaskThreshold - 0.05, uMaskThreshold + 0.05, mask)`
</ExecutionPlan>

## 4. Implementation Status ✅ COMPLETED

### 4.1 Changes Made
1. **✅ 深度测试修复** - 添加了 `depthStencilState` 配置：
   - `depthWriteEnabled: true`
   - `depthCompare: MSpec.RHICompareFunction.LESS`
   - `format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8`

2. **✅ 面剔除优化** - 添加了 `cullMode: MSpec.RHICullMode.BACK`

3. **✅ 遮罩边缘改进** - 将 `step` 改为 `smoothstep` 以获得更柔和的边缘

4. **✅ 深度纹理管理** - 确认深度纹理在初始化和调整大小时正确创建：
   - `updateDepthTexture()` 在初始化时调用（第194行）
   - `updateDepthTexture()` 在窗口调整大小时调用（第197行）
   - 深度视图正确绑定到渲染通道（第519行）

### 4.2 Verification
- 深度缓冲区现在正确工作，立方体的各面按深度正确渲染
- 面剔除避免了不必要的内部面渲染
- 混合模式公式全部验证正确
- 遮罩边缘过渡更加平滑

### 4.3 Files Modified
- `packages/rhi/demo/src/multi-textures.ts`: 添加深度状态和面剔除配置，改进遮罩边缘算法
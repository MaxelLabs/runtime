<!-- This entire block is your raw intelligence report for other agents. It is not a final document. -->

### Code Sections (The Evidence)
- `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/stencil-test.ts` (完整文件): 模板测试演示的实现，包含两遍渲染管线
- `/Users/mac/Desktop/project/max/runtime/packages/specification/src/common/rhi/types/states.ts` (RHIDepthStencilState, RHIStencilFaceState): 深度模板状态的结构定义
- `/Users/mac/Desktop/project/max/runtime/packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (applyDepthStencilState): WebGL中模板状态的应用实现
- `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/utils/core/DemoRunner.ts` (beginFrame): DemoRunner中渲染通道的创建，包含模板缓冲的清除

### Report (The Answers)

#### result
经过分析，我发现了模板测试demo中描边效果没有显示的几个关键问题：

1. **第二遍渲染管线的深度测试被禁用** (第277行):
   - `depthTestEnabled: false` 导致轮廓可能被错误地渲染
   - 轮廓应该使用深度测试，但是深度写入应该禁用

2. **第二遍渲染的模板比较逻辑可能有问题**:
   - 使用 `NOT_EQUAL` 比较函数，但可能需要调整参考值
   - 当前实现在模板不等于1时绘制轮廓

3. **缩放实现在顶点着色器中** (第36-42行):
   - 直接缩放顶点位置可能不会产生正确的轮廓效果
   - 轮廓效果通常需要在视图空间进行缩放，而不是模型空间

4. **模板缓冲的清除和写入**:
   - 第一遍使用 `REPLACE` 操作写入模板值1
   - 第二遍应该只在物体边缘绘制轮廓

#### conclusions
- 模板测试的基础框架已经正确搭建，包括两遍渲染管线
- WebGL的模板测试实现看起来是正确的
- 主要问题在于轮廓渲染的深度测试设置和顶点缩放方式
- 当前的方法（缩放顶点）不是实现轮廓效果的最佳方式

#### relations
- `stencil-test.ts` 创建了两个渲染管线：`normalPipeline` 和 `outlinePipeline`
- `normalPipeline` 第一遍渲染物体并写入模板缓冲
- `outlinePipeline` 第二遍渲染缩放的物体，使用模板测试仅在边缘显示
- `DemoRunner.beginFrame()` 正确设置了模板缓冲的清除
- `GLRenderPipeline.applyDepthStencilState()` 正确应用了WebGL的模板状态

### 建议的修复方案

1. **修改第二遍渲染管线的深度设置**:
   ```typescript
   depthWriteEnabled: false,  // 保持不变
   depthTestEnabled: true,    // 改为 true，启用深度测试
   depthCompare: MSpec.RHICompareFunction.LESS_EQUAL, // 添加深度比较
   ```

2. **修改顶点着色器中的缩放实现**:
   - 在视图空间而非模型空间进行缩放
   - 或者使用法线挤出技术实现真正的轮廓效果

3. **检查模板缓冲的格式**:
   - 确保使用的纹理格式支持模板缓冲 (DEPTH24_UNORM_STENCIL8)
   - 确认WebGL上下文正确初始化了模板缓冲

4. **可选：使用不同的轮廓实现方法**:
   - 使用背面剔除和正面渲染的技巧
   - 或者使用后处理效果实现轮廓
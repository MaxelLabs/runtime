### WebGL纹理渲染问题 - MipMap过滤模式导致黑色纹理

#### 问题描述
在WebGL 2.0环境中，使用RHI抽象层渲染纹理时，纹理显示为黑色，尽管纹理数据正确上传且绑定成功。

#### 根本原因
**WebGL规范要求：当纹理的minFilter使用mipmap模式时，纹理必须有完整的mipmap链。**

具体问题：
1. 纹理创建时只有1个mip级别（默认）
2. 采样器配置为：`minFilter: LINEAR` + `mipmapFilter: NEAREST`
3. 这导致实际的minFilter模式为 `LINEAR_MIPMAP_NEAREST` (值=9985)
4. 由于缺少完整的mipmap链，WebGL无法采样纹理，导致渲染为黑色

#### 调试过程
1. **初始问题**：纹理渲染为黑色，但绑定看起来正确
2. **添加调试信息**：发现纹理参数 `minFilter=9985` (LINEAR_MIPMAP_NEAREST)
3. **对比测试**：创建原生WebGL测试demo，确认纹理数据正确
4. **定位问题**：发现minFilter模式与mip级别数量不匹配

#### 解决方案
在创建采样器时明确禁用mipmap：

```typescript
const sampler = device.createSampler({
  magFilter: RHIFilterMode.LINEAR,
  minFilter: RHIFilterMode.LINEAR,
  mipmapFilter: RHIFilterMode.NEAREST,
  useMipmap: false, // 关键：明确禁用mipmap
  addressModeU: RHIAddressMode.REPEAT,
  addressModeV: RHIAddressMode.REPEAT,
});
```

这确保minFilter使用 `LINEAR` (9729) 而不是 `LINEAR_MIPMAP_NEAREST` (9985)。

#### 相关文件
- `packages/rhi/demo/src/rotating-cube.ts`：修复采样器配置
- `packages/rhi/src/webgl/resources/GLSampler.ts`：getMinFilterValue方法正确处理useMipmap标志
- `packages/rhi/src/webgl/bindings/GLBindGroup.ts`：纹理绑定和采样器应用逻辑

#### 教训
1. **WebGL mipmap要求严格**：使用mipmap过滤模式必须提供完整的mipmap链
2. **RHI抽象层的复杂性**：简单的配置可能导致底层WebGL行为复杂
3. **调试工具的重要性**：详细的调试信息帮助快速定位问题
4. **对比测试的价值**：原生WebGL测试帮助隔离问题

#### 预防措施
1. 在GLSampler构造函数中添加验证，当useMipmap=true但纹理缺少mipmap时发出警告
2. 在文档中明确说明mipmap使用条件
3. 考虑在纹理创建时自动检测并设置合适的采样器默认值

---
记录时间：2025-12-10
问题状态：已解决
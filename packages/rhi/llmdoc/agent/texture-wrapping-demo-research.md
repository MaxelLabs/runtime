<!-- Texture Wrapping Demo 实现调研报告 -->

### Code Sections (The Evidence)

- `/packages/specification/src/common/rhi/types/enums.ts` (RHIAddressMode enum): 定义了4种纹理包裹模式：REPEAT, MIRROR_REPEAT, CLAMP_TO_EDGE, CLAMP_TO_BORDER
- `/src/webgl/resources/GLSampler.ts` (GLSampler class): WebGL采样器实现，支持创建带不同包裹模式的采样器对象
- `/demo/src/texture-2d.ts` (texture-2d demo): 现有的纹理演示，展示了如何使用SimpleGUI进行动态切换，以及如何创建多个纹理和采样器
- `/demo/src/utils/ui/SimpleGUI.ts` (SimpleGUI class): 提供了add方法用于添加下拉选择框控件，支持options配置和onChange回调
- `/demo/src/utils/texture/ProceduralTexture.ts` (ProceduralTexture class): 程序化纹理生成器，可用于创建适合展示包裹效果的纹理

### Report (The Answers)

#### result

1. **RHI 采样器 API 调研**：
   - IRHISampler 接口支持以下包裹模式（RHIAddressMode枚举）：
     - `REPEAT`: 重复纹理
     - `MIRROR_REPEAT`: 镜像重复
     - `CLAMP_TO_EDGE`: 边缘夹紧
     - `CLAMP_TO_BORDER`: 边界颜色（需要扩展支持）
   - device.createSampler() 参数结构：
     ```typescript
     {
       addressModeU: MSpec.RHIAddressMode,
       addressModeV: MSpec.RHIAddressMode,
       addressModeW: MSpec.RHIAddressMode,
       magFilter: MSpec.RHIFilterMode,
       minFilter: MSpec.RHIFilterMode,
       mipmapFilter: MSpec.RHIFilterMode,
       label?: string
     }
     ```

2. **现有 Demo 参考**：
   - texture-2d.ts 使用单平面 + GUI 切换模式
   - 创建了多个纹理（UV Debug、Caravaggio、Checkerboard）
   - 使用SimpleGUI添加下拉选择框：
     ```typescript
     gui.add('Current Texture', {
       value: textureNames[currentTextureIndex],
       options: textureNames,
       onChange: (value) => { /* 切换逻辑 */ }
     });
     ```
   - 通过创建多个绑定组实现纹理切换

3. **着色器实现**：
   - 修改顶点坐标生成超出 [0,1] 范围的 UV
   - 例如：使用 [-1, 2] 范围展示包裹效果
   - 片段着色器保持简单的 texture(uTexture, vTexCoord) 调用
   - 不同的包裹模式会自动处理超出范围的坐标

4. **实现策略建议**：
   - **推荐方案**：单平面 + GUI 切换（类似texture-2d）
   - 创建多个采样器（每个包裹模式一个）
   - 使用程序化纹理（棋盘格或数字纹理）便于观察包裹效果
   - GUI包含两个下拉框：
     1. 纹理选择（Checkerboard/Numbers等）
     2. 包裹模式选择（REPEAT/MIRROR_REPEAT/CLAMP_TO_EDGE）
   - 动态切换采样器绑定

#### conclusions

- RHI 支持完整的纹理包裹模式 API
- WebGL 实现通过 GLSampler 类正确映射到原生 WebGL 参数
- SimpleGUI 提供了现成的下拉选择控件
- texture-2d 提供了很好的参考实现
- 需要创建专门的测试纹理来清晰展示包裹效果

#### relations

- `texture-2d.ts` -> `GLSampler.ts`: 展示了如何创建和使用采样器
- `SimpleGUI.ts` -> `texture-2d.ts`: GUI组件的使用方式
- `ProceduralTexture.ts` -> 新Demo: 用于生成测试纹理
- `RHIAddressMode` -> `GLSampler`: 枚举到WebGL常量的转换

### 实现建议

#### 1. 创建专门的测试纹理
```typescript
// 建议使用带数字或箭头的纹理，便于观察重复和镜像效果
const testTexture = ProceduralTexture.createTestPattern({
  width: 256,
  height: 256,
  showNumbers: true,
  showArrows: true
});
```

#### 2. 修改 UV 坐标范围
```typescript
// 生成超出 [0,1] 范围的 UV 坐标
const uvs = new Float32Array([
  -1.0, -1.0,  // 左下角外
   2.0, -1.0,  // 右下角外
   2.0,  2.0,  // 右上角外
  -1.0,  2.0   // 左上角外
]);
```

#### 3. 创建多个采样器
```typescript
const samplers = {
  repeat: runner.device.createSampler({
    addressModeU: MSpec.RHIAddressMode.REPEAT,
    addressModeV: MSpec.RHIAddressMode.REPEAT,
    // ...
  }),
  mirror: runner.device.createSampler({
    addressModeU: MSpec.RHIAddressMode.MIRROR_REPEAT,
    addressModeV: MSpec.RHIAddressMode.MIRROR_REPEAT,
    // ...
  }),
  clamp: runner.device.createSampler({
    addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
    addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
    // ...
  })
};
```

#### 4. GUI 控制
```typescript
// 包裹模式选择
gui.add('Wrap Mode', {
  value: 'repeat',
  options: ['repeat', 'mirror-repeat', 'clamp-to-edge'],
  onChange: (mode) => {
    // 切换对应的采样器
  }
});

// UV 缩放控制
gui.add('UV Scale', {
  value: 1.0,
  min: 0.5,
  max: 3.0,
  step: 0.1,
  onChange: (scale) => {
    // 动态调整UV范围
  }
});
```
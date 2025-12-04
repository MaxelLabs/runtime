# WebGL 命令使用指南

## 常见 WebGL 命令和操作

1. **设置视口**
   ```typescript
   // 设置视口区域，定义渲染区域
   device.viewport(x, y, width, height);
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:254-260`

2. **设置裁剪区域**
   ```typescript
   // 设置裁剪区域，只渲染指定区域内的内容
   device.scissor(x, y, width, height);
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:262-280`

3. **清除渲染目标**
   ```typescript
   // 清除颜色、深度或模板缓冲区
   device.clearRenderTarget(engine, CameraClearFlags.Color | CameraClearFlags.Depth, clearColor);
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:286-326`

4. **纹理管理**
   ```typescript
   // 激活纹理单元
   device.activeTexture(gl.TEXTURE0);

   // 绑定纹理到当前单元
   device.bindTexture(texture);
   ```
   **参考代码**:
   - 激活纹理: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:475-480`
   - 绑定纹理: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:482-488`

5. **渲染目标管理**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection, mipLevel, faceIndex);

   // 复制渲染目标内容
   device.blitInternalRTByBlitFrameBuffer(srcRT, destRT, clearFlags, viewport);
   ```
   **参考代码**:
   - 激活渲染目标: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:345-376`
   - 缓冲区复制: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:378-446`

6. **深度偏移**
   ```typescript
   // 设置深度偏移，解决 Z-fighting 问题
   device.setGlobalDepthBias(bias, slopeBias);
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:490-500`

7. **强制刷新**
   ```typescript
   // 强制刷新命令缓冲区
   device.flush();
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:502-504`

8. **设备状态测试**
   ```typescript
   // 强制丢失设备上下文
   device.forceLoseDevice();

   // 强制恢复设备上下文
   device.forceRestoreDevice();
   ```
   **参考代码**:
   - 丢失设备: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:506-509`
   - 恢复设备: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:511-514`

9. **能力检测**
   ```typescript
   // 检测硬件支持能力
   const canUseVAO = device.canIUse(GLCapabilityType.vertexArrayObject);
   const canUseInstancing = device.canIUse(GLCapabilityType.instancedArrays);
   ```
   **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:246-248`

10. **调试信息获取**
    ```typescript
    // 获取渲染器信息
    const renderer = device.renderer;
    const isWebGL2 = device.isWebGL2;
    ```
    **参考代码**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:112-118`

## 性能优化建议

### 1. 减少状态切换
- 批量处理相同状态的渲染调用
- 缓存常用的视口和裁剪区域设置
- 避免频繁的纹理单元切换

### 2. 使用适当的图元类型
- 对于静态几何体，使用 VAO 提高性能
- 对于大量相同几何体，使用实例化渲染
- 根据硬件支持选择最优的绘制方法

### 3. 管理纹理内存
- 及时释放不再使用的纹理
- 使用适当的纹理格式减少内存占用
- 启用 mipmaps 提高渲染质量

### 4. 处理特殊平台
- iOS 设备可能需要强制刷新命令缓冲区
- 监听上下文丢失事件，及时恢复状态
- 根据平台能力调整渲染策略
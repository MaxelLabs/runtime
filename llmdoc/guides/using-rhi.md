# 使用 RHI 抽象层

## 如何使用 RHI 进行基本渲染

1. **创建 WebGL 引擎**
   ```typescript
   const configuration: WebGLEngineConfiguration = {
     canvas: "canvas-element", // 或 HTMLCanvasElement
     graphicDeviceOptions: {
       webGLMode: WebGLMode.Auto, // 自动选择 WebGL 版本
       stencil: true,
       _forceFlush: false
     }
   };

   const engine = await WebGLEngine.create(configuration);
   ```

2. **创建图形设备**
   WebGL 引擎会自动创建 WebGLGraphicDevice，但也可以通过配置自定义设备行为：
   ```typescript
   // 检查设备能力
   if (engine.device.canIUse(GLCapabilityType.vertexArrayObject)) {
     console.log("VAO 可用");
   }
   ```

3. **创建基本资源**
   ```typescript
   // 创建缓冲区
   const vertexBuffer = device.createPlatformBuffer(
     BufferBindFlag.VertexBuffer,
     vertexData.byteLength,
     BufferUsage.Static,
     vertexData
   );

   // 创建纹理
   const texture = device.createPlatformTexture2D(texture2D);

   // 创建渲染目标
   const renderTarget = device.createPlatformRenderTarget(target);
   ```

4. **设置渲染状态**
   ```typescript
   // 设置视口
   device.viewport(0, 0, width, height);

   // 设置裁剪区域
   device.scissor(0, 0, width, height);

   // 设置颜色遮罩
   device.colorMask(true, true, true, true);
   ```

5. **执行渲染**
   ```typescript
   // 激活渲染目标
   device.activeRenderTarget(renderTarget, viewport, isFlipProjection);

   // 激活纹理
   device.activeTexture(gl.TEXTURE0);
   device.bindTexture(texture);

   // 绘制图元
   device.drawPrimitive(primitive, subMesh, shaderProgram);
   ```

6. **资源清理**
   ```typescript
   // 销毁资源
   vertexBuffer.destroy();
   texture.destroy();
   renderTarget.destroy();
   ```

**参考代码**:
- 引擎创建: `temp/engine/packages/rhi-webgl/src/WebGLEngine.ts:14-25`
- 设备初始化: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:168-211`
- 图元创建: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:213-240`
- 渲染执行: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:328-335`
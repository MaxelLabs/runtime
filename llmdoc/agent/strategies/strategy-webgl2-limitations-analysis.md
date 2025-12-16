# Strategy: WebGL2技术限制分析与替代方案

## 1. Analysis

### Context
WebGL2基于OpenGL ES 3.0，相比桌面版OpenGL缺少一些高级特性。针对第四层高级渲染Demo，需要明确了解这些限制并制定替代方案。

### Constitution
- 在WebGL2约束下实现尽可能接近现代GPU的功能
- 优先保证性能和兼容性
- 所有方案必须经过实际验证

## 2. WebGL2关键限制及替代方案

### 2.1 Indirect Drawing（间接绘制）

**限制**：WebGL2不支持`glDrawArraysIndirect`和`glDrawElementsIndirect`

**影响**：Demo无法使用GPU驱动的渲染管线

**替代方案**：
```typescript
// 方案1：CPU端实例化数据准备
class InstancedRenderer {
  private instanceData: Float32Array;
  private instanceBuffer: RHIBuffer;

  // CPU端剔除和数据准备
  prepareInstances(camera: Camera, objects: RenderObject[]) {
    let count = 0;
    for (const obj of objects) {
      if (obj.visible && this.frustumTest(obj, camera)) {
        // 填充实例数据
        this.instanceData.set(obj.modelMatrix.elements, count * 16);
        count++;
      }
    }

    // 更新缓冲区
    this.instanceBuffer.update(this.instanceData.subarray(0, count * 16));
    return count;
  }
}

// 方案2：使用WebGL扩展模拟（如果可用）
if (gl.getExtension('WEBGL_draw_instanced_base_vertex_base_instance')) {
  // 支持base instance
} else {
  // 退回到标准实例化
}
```

### 2.2 Compute Shaders（计算着色器）

**限制**：WebGL2没有计算着色器支持

**影响**：无法进行通用GPU计算，影响粒子系统和物理模拟

**替代方案**：
```typescript
// Transform Feedback模拟计算着色器
class GPUParticleSystem {
  private transformFeedback: RHITransformFeedback;
  private particleBuffers: RHIBuffer[] = [];
  private currentBuffer = 0;

  // 粒子更新着色器
  private updateShaderSource = `
    #version 300 es
    // Transform Feedback输出定义
    out vec3 outPosition;
    out vec3 outVelocity;
    out float outLife;

    void main() {
      // 从当前缓冲区读取
      vec3 pos = inPosition;
      vec3 vel = inVelocity;
      float life = inLife;

      // 物理计算
      vel += gravity * deltaTime;
      vel *= damping;
      pos += vel * deltaTime;
      life -= deltaTime;

      // 输出到Transform Feedback缓冲区
      outPosition = pos;
      outVelocity = vel;
      outLife = life;
    }
  `;

  update(deltaTime: number) {
    // 绑定Transform Feedback
    this.transformFeedback.begin();

    // 执行计算着色器
    this.device.drawTransformFeedback(
      this.updatePipeline,
      this.particleBuffers[this.currentBuffer],
      this.particleBuffers[1 - this.currentBuffer],
      this.particleCount
    );

    this.transformFeedback.end();

    // 交换缓冲区
    this.currentBuffer = 1 - this.currentBuffer;
  }
}

// CPU+GPU混合方案
class HybridParticleSystem {
  private readonly GPU_PARTICLE_THRESHOLD = 10000;

  update(particles: Particle[]) {
    if (particles.length < this.GPU_PARTICLE_THRESHOLD) {
      // 简单粒子使用GPU Transform Feedback
      this.updateOnGPU(particles);
    } else {
      // 复杂粒子使用CPU计算
      this.updateOnCPU(particles);
    }
  }
}
```

### 2.3 Shader Storage Buffer Objects（SSBO）

**限制**：WebGL2支持有限的SSBO（通过扩展）

**影响**：无法实现大容量数据读写，影响高级算法

**替代方案**：
```typescript
// 使用纹理作为数据存储
class TextureDataBuffer {
  private dataTexture: RHITexture;
  private width: number;
  private height: number;

  constructor(size: number) {
    // 计算纹理尺寸（存储float4数据）
    this.width = Math.ceil(Math.sqrt(size / 4));
    this.height = Math.ceil(size / 4 / this.width);

    this.dataTexture = this.device.createTexture({
      width: this.width,
      height: this.height,
      format: MSpec.RHITextureFormat.RGBA32F, // 高精度浮点纹理
      usage: MSpec.RHITextureUsage.STORAGE_BINDING | MSpec.RHITextureUsage.TEXTURE_BINDING
    });
  }

  // 写入数据
  setData(data: Float32Array) {
    // 将数据编码到纹理中
    const imageData = new Float32Array(this.width * this.height * 4);
    imageData.set(data);

    this.dataTexture.update(imageData);
  }

  // 读取数据（使用像素读取）
  readData(callback: (data: Float32Array) => void) {
    const pixels = new Uint8Array(this.width * this.height * 16); // RGBA32F = 16 bytes
    this.dataTexture.readPixels(pixels);

    // 解码数据
    const floatData = new Float32Array(pixels.buffer);
    callback(floatData);
  }
}

// 着色器中使用纹理作为数据缓冲
const dataBufferShader = `
  uniform sampler2D uDataBuffer;
  uniform vec2 uBufferSize;

  float readData(int index) {
    vec2 uv = vec2(
      float(index % int(uBufferSize.x)) / uBufferSize.x,
      float(index / int(uBufferSize.x)) / uBufferSize.y
    );
    return texture(uDataBuffer, uv).r;
  }
`;
```

### 2.4 Multi-Draw Indirect

**限制**：WebGL2不支持一次调用绘制多个实例

**影响**：批量渲染效率受限

**替代方案**：
```typescript
// Multi-Draw模拟
class MultiDrawRenderer {
  private drawCommands: DrawCommand[] = [];

  // 收集绘制命令
  submitDraw(drawCmd: DrawCommand) {
    this.drawCommands.push(drawCmd);
  }

  // 执行批量绘制
  execute(device: RHI) {
    // 合并相同着色器的绘制
    const grouped = this.groupDrawCommandsByShader(this.drawCommands);

    for (const [shaderId, commands] of grouped) {
      device.bindPipeline(this.pipelines[shaderId]);

      // 批量执行
      for (const cmd of commands) {
        device.bindVertexBuffers(cmd.vertexBuffers);
        device.bindIndexBuffer(cmd.indexBuffer);
        device.setPushConstants(cmd.pushConstants);
        device.drawIndexed(cmd.indexCount);
      }
    }

    this.drawCommands.length = 0; // 清空
  }

  // 使用glMultiDrawElementsBaseVertex扩展（如果可用）
  tryUseMultiDraw(device: RHI) {
    const ext = device.gl.getExtension('WEBGL_multi_draw_instanced_base_vertex_base_instance');

    if (ext) {
      // 使用真正的multi-draw
      ext.multiDrawElementsInstancedBaseVertexBaseVertexWEBGL(
        this.drawCommands.map(cmd => cmd.mode),
        this.drawCommands.map(cmd => cmd.counts),
        this.drawCommands.map(cmd => cmd.type),
        this.drawCommands.map(cmd => cmd.offsets),
        this.drawCommands.map(cmd => cmd.instanceCounts),
        this.drawCommands.map(cmd => cmd.baseInstances),
        this.drawCommands.map(cmd => cmd.baseVertices),
        this.drawCommands.length
      );
      return true;
    }

    return false;
  }
}
```

### 2.5 Geometry Shaders

**限制**：WebGL2完全不支持几何着色器

**影响**：无法动态生成几何体，影响毛发、植被等效果

**替代方案**：
```typescript
// CPU预生成几何体
class GeometryGenerator {
  // 毛发生成
  generateFurStrands(baseGeometry: Geometry, density: number, length: number): Geometry {
    const strands = [];

    for (let i = 0; i < density; i++) {
      // 随机选择表面点
      const surfacePoint = this.sampleSurfacePoint(baseGeometry);
      const normal = surfacePoint.normal;

      // 生成毛发段
      const strand = this.generateStrand(
        surfacePoint.position,
        normal,
        length,
        8 // 段数
      );

      strands.push(strand);
    }

    return this.mergeGeometries(strands);
  }

  // 植被生成
  generateGrassPatch(position: Vector3, count: number): Geometry {
    const blades = [];

    for (let i = 0; i < count; i++) {
      const blade = this.generateGrassBlade(
        position.add(this.randomOffset(2, 0, 2)),
        this.randomRange(0.5, 1.5),
        this.randomDirection()
      );
      blades.push(blade);
    }

    return this.mergeGeometries(blades);
  }
}

// 使用实例化替代几何着色器
class InstancedFurRenderer {
  private instanceData: Float32Array;

  generateInstanceData(baseGeometry: Geometry, density: number) {
    const data = new Float32Array(density * 16); // mat4 per instance

    for (let i = 0; i < density; i++) {
      const surfacePoint = this.sampleSurfacePoint(baseGeometry);
      const transform = Matrix4().makeTranslation(surfacePoint.position);

      // 计算朝向
      transform.lookAt(
        surfacePoint.position,
        surfacePoint.position.add(surfacePoint.normal),
        this.getRandomPerpendicular(surfacePoint.normal)
      );

      // 添加随机变化
      transform.rotateZ(this.randomRange(-0.2, 0.2));
      transform.scale(
        this.randomRange(0.8, 1.2),
        this.randomRange(0.8, 1.2),
        1
      );

      data.set(transform.elements, i * 16);
    }

    return data;
  }
}
```

### 2.6 Tessellation Shaders

**限制**：WebGL2不支持细分着色器

**影响**：无法动态细分网格，影响细节层次（LOD）

**替代方案**：
```typescript
// 预计算LOD网格
class LODMeshSystem {
  private lodMeshes: Map<string, Mesh[]> = new Map();

  // 生成LOD级别
  generateLODMeshes(baseMesh: Mesh, levels: number): Mesh[] {
    const meshes = [baseMesh]; // LOD 0

    for (let level = 1; level < levels; level++) {
      const simplified = this.simplifyMesh(meshes[level - 1], 0.5); // 50%简化
      meshes.push(simplified);
    }

    return meshes;
  }

  // 动态LOD选择
  selectLOD(meshes: Mesh[], camera: Camera, bounds: BoundingBox): number {
    const distance = camera.position.distanceTo(bounds.center);
    const screenSpaceSize = this.calculateScreenSize(bounds, camera);

    if (screenSpaceSize > 512) return 0; // 高细节
    if (screenSpaceSize > 256) return 1; // 中细节
    if (screenSpaceSize > 64) return 2; // 低细节
    return Math.min(meshes.length - 1, 3); // 最低细节
  }

  // PN Triangles细分（着色器实现）
  createPNTrianglesShader() {
    return {
      vertex: `
        #version 300 es
        // 控制点数据
        in vec3 aPosition;
        in vec3 aNormal;
        in vec3 aNextNormal;
        in vec3 aPrevNormal;

        // 输出到片元着色器进行细分
        out vec3 vPosition;
        out vec3 vNormal;
        out vec3 vNextNormal;
        out vec3 vPrevNormal;

        void main() {
          vPosition = aPosition;
          vNormal = aNormal;
          vNextNormal = aNextNormal;
          vPrevNormal = aPrevNormal;
          gl_Position = projectionMatrix * viewMatrix * vec4(aPosition, 1.0);
        }
      `,
      fragment: `
        #version 300 es
        precision mediump float;

        in vec3 vPosition;
        in vec3 vNormal;
        in vec3 vNextNormal;
        in vec3 vPrevNormal;

        // 片元着色器中实现细分
        // 使用重心坐标插值

        void main() {
          // 计算细分位置（简化版）
          vec3 position = vPosition;
          vec3 normal = normalize(vNormal);

          // Phong细分
          float w1 = gl_FragCoord.x - floor(gl_FragCoord.x);
          float w2 = gl_FragCoord.y - floor(gl_FragCoord.y);
          float w3 = 1.0 - w1 - w2;

          // 法线插值和位置调整
          vec3 interpolatedNormal = normalize(
            w3 * vNormal + w1 * vNextNormal + w2 * vPrevNormal
          );

          position += interpolatedNormal * 0.01; // 微小偏移

          // ... 渲染计算
        }
      `
    };
  }
}
```

## 3. 性能优化策略

### 3.1 内存带宽优化
```typescript
// 紧凑的数据布局
interface VertexFormat {
  position: Float32Array(3);    // 12 bytes
  normal: Uint8Array(4);        // 4 bytes (packed)
  uv: Uint16Array(2);           // 4 bytes (half-float)
  // 总计: 20 bytes vs 32 bytes
}

// 使用GLTF Draco压缩
class DracoMeshLoader {
  async loadMesh(url: string): Promise<Geometry> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const decoder = new draco.Decoder();
    const geometryType = decoder.GetEncodedGeometryType(buffer);

    let dracoGeometry;
    if (geometryType === draco.TRIANGULAR_MESH) {
      dracoGeometry = new draco.Mesh();
    } else {
      dracoGeometry = new draco.PointCloud();
    }

    const status = decoder.DecodeBufferToDracoGeometry(buffer, dracoGeometry);
    if (!status.ok()) {
      throw new Error('Draco decoding failed');
    }

    return this.convertDracoToWebGL(dracoGeometry);
  }
}
```

### 3.2 CPU-GPU同步优化
```typescript
// 使用gl.flush()和gl.finish()控制同步
class FrameSync {
  private syncObjects: WebGLSync[] = [];
  private currentFrame = 0;
  private readonly MAX_FRAMES_IN_FLIGHT = 3;

  beginFrame() {
    // 等待前一帧完成
    if (this.syncObjects[this.currentFrame]) {
      this.gl.clientWaitSync(this.syncObjects[this.currentFrame], 0, -1);
      this.gl.deleteSync(this.syncObjects[this.currentFrame]);
    }
  }

  endFrame() {
    // 插入同步对象
    const sync = this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    this.syncObjects[this.currentFrame] = sync;

    this.currentFrame = (this.currentFrame + 1) % this.MAX_FRAMES_IN_FLIGHT;
  }
}

// 使用MapBufferRange避免阻塞
class DynamicBuffer {
  private ringSize: number;
  private offset = 0;

  map(size: number): ArrayBufferView {
    if (this.offset + size > this.ringSize) {
      this.offset = 0; // 回到开头
    }

    // 使用MAP_INVALIDATE_BUFFER_BIT避免同步
    return this.gl.mapBufferRange(
      this.gl.ARRAY_BUFFER,
      this.offset,
      size,
      this.gl.MAP_WRITE_BIT | this.gl.MAP_INVALIDATE_BUFFER_BIT
    );
  }

  unmap() {
    this.gl.unmapBuffer(this.gl.ARRAY_BUFFER);
    this.offset += this.pendingSize;
  }
}
```

## 4. 调试与分析工具

### 4.1 性能分析器
```typescript
class WebGLProfiler {
  private queries: WebGLQuery[] = [];
  private frameStartTime = 0;

  beginFrame() {
    this.frameStartTime = performance.now();

    // 创建时间戳查询
    const query = this.gl.createQuery();
    this.gl.beginQuery(this.gl.TIME_ELAPSED_EXT, query);
    this.queries.push(query);
  }

  endFrame() {
    this.gl.endQuery(this.gl.TIME_ELAPSED_EXT);

    // 收集结果
    if (this.queries.length > 60) {
      const results = this.collectQueryResults();
      this.analyzePerformance(results);
      this.queries.shift(); // 移除最旧的
    }
  }

  private collectQueryResults(): number[] {
    const results = [];
    for (const query of this.queries) {
      if (this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE)) {
        const timeElapsed = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT);
        results.push(timeElapsed);
      }
    }
    return results;
  }
}
```

### 4.2 内存追踪器
```typescript
class MemoryTracker {
  private allocations = new Map<RHIResource, number>();
  private totalAllocated = 0;

  track(resource: RHIResource, size: number) {
    this.allocations.set(resource, size);
    this.totalAllocated += size;
  }

  untrack(resource: RHIResource) {
    const size = this.allocations.get(resource) || 0;
    this.allocations.delete(resource);
    this.totalAllocated -= size;
  }

  getMemoryReport(): MemoryReport {
    return {
      totalAllocated: this.totalAllocated,
      textureCount: this.countByType('texture'),
      bufferCount: this.countByType('buffer'),
      renderTargetCount: this.countByType('renderTarget')
    };
  }
}
```

## 5. 总结

WebGL2虽然有一些限制，但通过合理的替代方案设计，仍然可以实现接近现代GPU的渲染效果。关键策略包括：

1. **CPU-GPU协作**：使用Transform Feedback和实例化渲染
2. **纹理存储**：利用高精度纹理作为数据缓冲
3. **预计算**：在资源加载时生成多级LOD和细分网格
4. **批量优化**：合并渲染调用，减少状态切换
5. **内存管理**：使用环形缓冲区和对象池避免GC

通过这些优化策略，第四层的10个高级渲染Demo完全可以在WebGL2平台上实现优秀的性能和视觉效果。
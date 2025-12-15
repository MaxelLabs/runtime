# 阴影工具参考

## 1. 概述

阴影工具提供完整的实时阴影渲染解决方案，支持多种光源类型、PCF软阴影滤波和级联阴影贴图（CSM），为场景提供真实的阴影效果。

## 2. 核心特性

### 2.1 阴影贴图管理
- 单光源和多光源阴影贴图
- 可配置的阴影分辨率
- 动态级联阴影贴图
- 阴影贴图优化（剔除、LOD）

### 2.2 光源支持
- 平行光（方向光）阴影
- 点光源阴影（立方体贴图）
- 聚光灯阴影
- 阴影视锥体自动计算

### 2.3 软阴影技术
- PCF（Percentage-Closer Filtering）软阴影
- 可配置的采样模式
- 自适应阴影偏移
- 阴影渐变优化

## 3. 渲染管线

### 3.1 阴影渲染流程

```typescript
// 阴影渲染管线
class ShadowRenderPipeline {
    constructor(private rhi: RHIDevice) {
        this.shadowMaps = new Map<Light, ShadowMap>();
    }

    render(scene: Scene, camera: Camera) {
        // 阶段1：生成阴影贴图
        this.generateShadowMaps(scene);

        // 阶段2：主渲染（使用阴影）
        this.renderSceneWithShadows(scene, camera);
    }

    private generateShadowMaps(scene: Scene) {
        for (const light of scene.lights) {
            if (!light.castShadow) continue;

            const shadowMap = this.getOrCreateShadowMap(light);
            this.renderLightView(light, shadowMap, scene);
        }
    }

    private renderLightView(light: Light, shadowMap: ShadowMap, scene: Scene) {
        const cmdBuf = this.rhi.createCommandBuffer();
        cmdBuf.begin();

        // 设置阴影渲染目标
        cmdBuf.setRenderTarget(shadowMap.renderTarget);
        cmdBuf.clear([1, 1, 1, 1], 1.0);

        // 设置光源视图矩阵
        const lightView = this.calculateLightViewMatrix(light);
        const lightProj = this.calculateLightProjection(light, scene);
        const lightVP = lightProj.multiply(lightView);

        // 设置渲染状态
        cmdBuf.setViewport(0, 0, shadowMap.width, shadowMap.height);
        cmdBuf.setCullMode(CullMode.Front);

        // 渲染所有阴影投射者
        for (const object of scene.shadowCasters) {
            this.renderShadowCaster(cmdBuf, object, lightVP);
        }

        cmdBuf.end();
        this.rhi.submit(cmdBuf);

        // 更新光源的视图投影矩阵
        light.shadowMatrix = lightVP;
    }
}
```

### 3.2 PCF软阴影着色器

```glsl
#version 300 es
precision highp float;

// 阴影相关Uniform
uniform sampler2D uShadowMap;
uniform mat4 uShadowMatrix;
uniform vec3 uLightPosition;
uniform vec3 uLightDirection;
uniform float uShadowBias;
uniform int uPCFSamples;
uniform float uPCFRadius;

// 输入
in vec3 vWorldPos;
in vec3 vNormal;

// 输出
out vec4 fragColor;

// PCF滤波函数
float calculatePCFShadow(vec3 shadowCoord, vec2 texelSize) {
    float shadow = 0.0;

    // 根据距离动态调整采样半径
    float distanceToLight = length(vWorldPos - uLightPosition);
    float dynamicRadius = uPCFRadius * (1.0 + distanceToLight * 0.001);

    // Poisson Disk采样
    vec2 poissonDisk[16] = vec2[](
        vec2(-0.94201624, -0.39906216),
        vec2(0.94558609, -0.76890725),
        vec2(-0.09418410, -0.92938870),
        vec2(0.34495938, 0.29387760),
        // ... 更多采样点
    );

    for(int i = 0; i < uPCFSamples; ++i) {
        vec2 offset = poissonDisk[i] * dynamicRadius * texelSize;
        float depth = texture(uShadowMap, shadowCoord.xy + offset).r;
        shadow += (shadowCoord.z - uShadowBias) > depth ? 0.0 : 1.0;
    }

    return shadow / float(uPCFSamples);
}

void main() {
    // 计算阴影坐标
    vec4 shadowCoord = uShadowMatrix * vec4(vWorldPos, 1.0);
    shadowCoord = shadowCoord / shadowCoord.w;
    shadowCoord = shadowCoord * 0.5 + 0.5; // 转换到[0,1]范围

    // 纹理坐标验证
    if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
        shadowCoord.y < 0.0 || shadowCoord.y > 1.0) {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0); // 在贴图外，完全照亮
        return;
    }

    // 计算阴影
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);
    float shadowFactor = calculatePCFShadow(shadowCoord.xyz, texelSize);

    // 基础光照计算
    vec3 lightDir = normalize(uLightDirection);
    float NdotL = max(dot(normalize(vNormal), lightDir), 0.0);

    // 应用阴影
    vec3 finalColor = vec3(NdotL) * shadowFactor;

    fragColor = vec4(finalColor, 1.0);
}
```

## 4. API参考

### 4.1 ShadowMap类

```typescript
class ShadowMap {
    constructor(
        rhi: RHIDevice,
        config: ShadowMapConfig
    );

    // 获取阴影贴图
    getTexture(): Texture;

    // 获取渲染目标
    getRenderTarget(): RenderTarget;

    // 设置分辨率
    setResolution(width: number, height: number): void;

    // 清除阴影贴图
    clear(): void;

    // 获取视口
    getViewport(): Viewport;

    // 资源管理
    dispose(): void;
}

interface ShadowMapConfig {
    width: number;
    height: number;
    format: PixelFormat;
    compareMode: CompareMode;
    wrapMode: WrapMode;
    filterMode: FilterMode;
}
```

### 4.2 LightSpaceMatrix类

```typescript
class LightSpaceMatrix {
    // 计算平行光视图投影矩阵
    static calculateDirectionalLight(
        light: DirectionalLight,
        scene: Scene,
        cascadeIndex?: number
    ): Mat4;

    // 计算点光源视图投影矩阵
    static calculatePointLight(
        light: PointLight
    ): Mat4[];

    // 计算聚光灯视图投影矩阵
    static calculateSpotLight(
        light: Spotlight
    ): Mat4;

    // 计算级联阴影的视锥体
    static calculateCascadeFrustum(
        camera: Camera,
        cascadeIndex: number,
        cascadeCount: number
    ): Frustum;

    // 优化阴影视锥体
    static optimizeShadowFrustum(
        lightView: Mat4,
        shadowCasters: BoundingVolume[]
    ): Mat4;
}
```

### 4.3 ShadowRenderer类

```typescript
class ShadowRenderer {
    constructor(rhi: RHIDevice, config?: ShadowRendererConfig);

    // 渲染场景阴影
    renderShadows(
        cmdBuf: CommandBuffer,
        scene: Scene,
        lights: Light[]
    ): void;

    // 设置阴影质量
    setShadowQuality(quality: ShadowQuality): void;

    // 启用/禁用软阴影
    enableSoftShadows(enabled: boolean): void;

    // 设置PCF采样参数
    setPCFParameters(samples: number, radius: number): void;

    // 获取阴影统计信息
    getStats(): ShadowStats;
}

enum ShadowQuality {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    ULTRA = 'ultra'
}

interface ShadowRendererConfig {
    shadowQuality: ShadowQuality;
    enableSoftShadows: boolean;
    pcfSamples: number;
    pcfRadius: number;
    shadowBias: number;
    cascadeCount?: number;
    cascadeSplitLambda?: number;
}

interface ShadowStats {
    shadowCasters: number;
    shadowLights: number;
    totalShadowTexels: number;
    renderTime: number;
}
```

### 4.4 CascadeShadowMap类

```typescript
class CascadeShadowMap {
    constructor(
        rhi: RHIDevice,
        cascadeCount: number,
        resolution: number
    );

    // 更新级联
    updateCascades(
        camera: Camera,
        light: DirectionalLight,
        scene: Scene
    ): void;

    // 获取指定级联的阴影矩阵
    getCascadeMatrix(index: number): Mat4;

    // 获取级联距离
    getCascadeDistances(): number[];

    // 获取级联阴影贴图数组
    getCascadeTextures(): Texture[];

    // 设置级联分割参数
    setCascadeSplit(
        splitLambda: number,
        distances?: number[]
    ): void;

    // 调试渲染级联边界
    renderCascadeDebug(
        cmdBuf: CommandBuffer,
        camera: Camera
    ): void;
}
```

## 5. 使用示例

### 5.1 基础平行光阴影

```typescript
import { ShadowRenderer, LightSpaceMatrix } from './utils/shadow';

// 创建阴影渲染器
const shadowRenderer = new ShadowRenderer(rhi, {
    shadowQuality: ShadowQuality.MEDIUM,
    enableSoftShadows: true,
    pcfSamples: 16,
    pcfRadius: 2.0
});

// 创建平行光
const sunLight = new DirectionalLight({
    direction: new Vec3(-1, -1, -1).normalize(),
    color: new Vec3(1, 1, 1),
    intensity: 1.0,
    castShadow: true,
    shadowMapSize: 2048
});

// 渲染循环
function render() {
    const cmdBuf = rhi.createCommandBuffer();
    cmdBuf.begin();

    // 第一阶段：渲染阴影贴图
    shadowRenderer.renderShadows(cmdBuf, scene, [sunLight]);

    // 第二阶段：正常渲染
    cmdBuf.setRenderTarget(mainRenderTarget);
    cmdBuf.clear([0.1, 0.1, 0.2, 1.0], 1.0);

    // 设置主渲染管线
    cmdBuf.bindPipeline(mainPipeline);

    // 绑定阴影贴图
    cmdBuf.bindTexture(3, sunLight.shadowMap.getTexture());
    cmdBuf.setUniform('uShadowMatrix', sunLight.shadowMatrix);

    // 渲染场景
    renderScene(cmdBuf, scene, camera);

    cmdBuf.end();
    rhi.submit(cmdBuf);
}
```

### 5.2 级联阴影贴图

```typescript
const csm = new CascadeShadowMap(rhi, 4, 1024);

// 更新级联
function updateCSM() {
    csm.updateCascades(camera, sunLight, scene);

    // 获取级联矩阵
    for (let i = 0; i < 4; i++) {
        const cascadeMatrix = csm.getCascadeMatrix(i);
        // 设置到着色器
        cmdBuf.setUniform(`uCascadeMatrices[${i}]`, cascadeMatrix);
    }

    const cascadeDistances = csm.getCascadeDistances();
    cmdBuf.setUniform('uCascadeDistances', cascadeDistances);

    // 绑定级联贴图数组
    const cascadeTextures = csm.getCascadeTextures();
    cmdBuf.bindTextureArray(4, cascadeTextures);
}
```

### 5.3 点光源阴影

```typescript
const pointLight = new PointLight({
    position: new Vec3(0, 10, 0),
    color: new Vec3(1, 1, 1),
    intensity: 100,
    range: 50,
    castShadow: true,
    shadowMapSize: 512
});

// 点光源需要6个方向的阴影贴图
const cubeShadowMap = createCubeShadowMap(rhi, 512);

function renderPointLightShadow() {
    const lightViews = LightSpaceMatrix.calculatePointLight(pointLight);

    for (let face = 0; face < 6; face++) {
        renderShadowToCubeFace(cubeShadowMap, face, lightViews[face], scene);
    }
}
```

### 5.4 聚光灯阴影

```typescript
const spotLight = new Spotlight({
    position: new Vec3(0, 5, 0),
    direction: new Vec3(0, -1, 0).normalize(),
    color: new Vec3(1, 1, 1),
    intensity: 50,
    innerAngle: 15 * Math.PI / 180,
    outerAngle: 25 * Math.PI / 180,
    range: 20,
    castShadow: true,
    shadowMapSize: 1024
});

// 计算聚光灯视图投影矩阵
spotLight.shadowMatrix = LightSpaceMatrix.calculateSpotLight(spotLight);
```

## 6. 性能优化

### 6.1 阴影贴图优化

```typescript
class ShadowOptimizer {
    // 动态分辨率调整
    adjustShadowResolution(camera: Camera, shadowMap: ShadowMap) {
        const distanceToCamera = camera.position.distance(
            shadowMap.getLightPosition()
        );

        // 根据距离调整分辨率
        let resolution: number;
        if (distanceToCamera < 50) {
            resolution = 2048;
        } else if (distanceToCamera < 200) {
            resolution = 1024;
        } else {
            resolution = 512;
        }

        shadowMap.setResolution(resolution, resolution);
    }

    // 视锥体裁剪
    frustumCulling(shadowCasters: Object3D[], lightMatrix: Mat4) {
        const lightFrustum = new Frustum().setFromMatrix(lightMatrix);
        return shadowCasters.filter(obj =>
            lightFrustum.intersectsObject(obj)
        );
    }

    // LOD阴影
    LODShadows(objects: Object3D[], distance: number) {
        return objects.map(obj => {
            if (distance < 100) {
                return { obj, lod: 0 }; // 高质量阴影
            } else if (distance < 500) {
                return { obj, lod: 1 }; // 中等质量
            } else {
                return { obj, lod: 2 }; // 低质量
            }
        });
    }
}
```

### 6.2 渲染优化

```typescript
class ShadowBatchRenderer {
    private batchedObjects: Map<Material, Object3D[]> = new Map();

    // 批量渲染相同材质的物体
    batchRender(objects: Object3D[], material: Material) {
        if (!this.batchedObjects.has(material)) {
            this.batchedObjects.set(material, []);
        }
        this.batchedObjects.get(material)!.push(...objects);
    }

    // 执行批量渲染
    flushBatch(cmdBuf: CommandBuffer) {
        for (const [material, objects] of this.batchedObjects) {
            cmdBuf.bindPipeline(material.getPipeline());

            for (const obj of objects) {
                cmdBuf.setUniform('uModel', obj.matrix);
                cmdBuf.draw(obj.geometry);
            }
        }

        this.batchedObjects.clear();
    }
}
```

## 7. 高级特性

### 7.1 变形阴影贴图（VSM）

```typescript
class VarianceShadowMap {
    private renderTarget: RenderTarget;
    private blurPipeline: Pipeline;

    constructor(rhi: RHIDevice, size: number) {
        // 创建双通道渲染目标（深度和深度的平方）
        this.renderTarget = rhi.createRenderTarget({
            width: size,
            height: size,
            format: 'rg32f',
            colorAttachments: 2
        });
    }

    // 渲染VSM
    render(scene: Scene, lightMatrix: Mat4) {
        // 第一遍：渲染深度和深度平方
        this.renderDepthAndSquared(scene, lightMatrix);

        // 第二遍：模糊处理
        this.applyBlur();
    }

    // VSM阴影计算
    calculateVarianceShadow(
        uv: vec2,
        depth: number,
        texelSize: vec2
    ): float {
        // 采样VSM纹理
        vec2 moments = texture(uShadowMap, uv).rg;

        // 计算方差
        float E_x2 = moments.y;
        float Ex_2 = moments.x * moments.x;
        float variance = E_x2 - Ex_2;

        // 应用Chebyshev不等式
        float d = depth - moments.x;
        float p_max = variance / (variance + d * d);

        return max(p_max, depth <= moments.x ? 1.0 : 0.0);
    }
}
```

### 7.2 接触阴影

```typescript
class ContactShadows {
    private contactShadowMap: Texture2D;
    private screenSpacePipeline: Pipeline;

    // 渲染接触阴影
    renderContactShadows(
        cmdBuf: CommandBuffer,
        depthTexture: Texture2D,
        normalTexture: Texture2D
    ) {
        cmdBuf.bindPipeline(this.screenSpacePipeline);
        cmdBuf.bindTexture(0, depthTexture);
        cmdBuf.bindTexture(1, normalTexture);
        cmdBuf.bindTexture(2, this.contactShadowMap);

        // 屏幕空间接触阴影
        cmdBuf.drawFullscreenQuad();
    }
}
```

### 7.3 自适应阴影质量

```typescript
class AdaptiveShadowQuality {
    private frameTimeHistory: number[] = [];
    private currentQuality: ShadowQuality = ShadowQuality.HIGH;

    updateQuality(frameTime: number) {
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > 60) {
            this.frameTimeHistory.shift();
        }

        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) /
                           this.frameTimeHistory.length;

        // 根据性能自动调整质量
        if (avgFrameTime > 16.67) { // 低于60fps
            this.downgradeQuality();
        } else if (avgFrameTime < 10) { // 高于100fps
            this.upgradeQuality();
        }
    }

    private downgradeQuality() {
        switch (this.currentQuality) {
            case ShadowQuality.ULTRA:
                this.currentQuality = ShadowQuality.HIGH;
                break;
            case ShadowQuality.HIGH:
                this.currentQuality = ShadowQuality.MEDIUM;
                break;
            case ShadowQuality.MEDIUM:
                this.currentQuality = ShadowQuality.LOW;
                break;
        }
    }
}
```

## 8. 调试工具

### 8.1 阴影可视化

```typescript
class ShadowDebugger {
    // 可视化阴影贴图
    visualizeShadowMap(
        cmdBuf: CommandBuffer,
        shadowMap: Texture2D,
        viewport: Viewport
    ) {
        cmdBuf.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
        cmdBuf.bindPipeline(this.debugPipeline);
        cmdBuf.bindTexture(0, shadowMap);
        cmdBuf.drawFullscreenQuad();
    }

    // 显示级联边界
    visualizeCascades(
        cmdBuf: CommandBuffer,
        csm: CascadeShadowMap,
        camera: Camera
    ) {
        const cascadeColors = [
            new Vec3(1, 0, 0), // 红
            new Vec3(0, 1, 0), // 绿
            new Vec3(0, 0, 1), // 蓝
            new Vec3(1, 1, 0)  // 黄
        ];

        for (let i = 0; i < csm.getCascadeCount(); i++) {
            const cascadeFrustum = csm.getCascadeFrustum(i);
            this.renderFrustumWireframe(
                cmdBuf,
                cascadeFrustum,
                cascadeColors[i],
                camera
            );
        }
    }

    // 渲染视锥体线框
    private renderFrustumWireframe(
        cmdBuf: CommandBuffer,
        frustum: Frustum,
        color: Vec3,
        camera: Camera
    ) {
        const corners = frustum.getCorners();

        cmdBuf.bindPipeline(this.wireframePipeline);
        cmdBuf.setUniform('uColor', color);
        cmdBuf.setUniform('uViewProjection', camera.getViewProjection());

        // 绘制视锥体的12条边
        const edges = this.getFrustumEdges(corners);
        for (const edge of edges) {
            cmdBuf.drawLines(edge.start, edge.end);
        }
    }

    // 显示统计信息
    renderStats(shadowStats: ShadowStats) {
        const text = `
Shadow Casters: ${shadowStats.shadowCasters}
Shadow Lights: ${shadowStats.shadowLights}
Total Texels: ${shadowStats.totalShadowTexels}
Render Time: ${shadowStats.renderTime.toFixed(2)}ms
        `;
        drawText(text, 10, 100);
    }
}
```

## 9. 最佳实践

### 9.1 阴影配置建议
1. **分辨率设置**：根据场景大小和光源重要性
2. **PCF采样**：平衡质量和性能（16-32个采样）
3. **阴影偏移**：根据场景比例调整
4. **级联分割**：使用对数分割或手动设置

### 9.2 性能优化建议
1. **视锥体裁剪**：只渲染视野内的阴影
2. **距离LOD**：远距离使用低分辨率阴影
3. **批量渲染**：相同材质物体合并渲染
4. **帧率自适应**：根据性能动态调整质量

### 9.3 视觉质量提升
1. **渐变边缘**：使用软阴影技术
2. **级联过渡**：平滑级联边界
3. **接触阴影**：增强细节阴影
4. **环境光遮蔽**：配合阴影使用

## 10. 故障排除

### 10.1 常见问题

**问题**: 阴影边缘锯齿
- **原因**: 阴影分辨率不足或缺少软阴影滤波
- **解决**: 提高分辨率或启用PCF软阴影

**问题**: 阴影飘移（Shadow Acne）
- **原因**: 阴影偏移设置不当
- **解决**: 调整shadow bias值

**问题**: 阴影缺失（Peter Panning）
- **原因**: 阴影偏移过大
- **解决**: 减小shadow bias或使用正常偏移

**问题**: 性能问题
- **原因**: 阴影贴图过大或过多光源
- **解决**: 优化分辨率和光源数量

## 11. 参考资源

### 11.1 理论基础
- [Shadow Mapping](https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch10.html)
- [Cascaded Shadow Maps](https://developer.nvidia.com/gpugems/gpugems3/part-ii-lighting-and-shadows/chapter-10-parallel-split-shadow-maps-pssm)
- [Variance Shadow Maps](http://www.punkuser.net/vsm/)

### 11.2 实现参考
- [Unity Shadows](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@10.0/manual/shadows.html)
- [Unreal Engine Shadows](https://docs.unrealengine.com/en-US/Engine/Rendering/LightingAndShadows/)
- [Three.js Shadow Mapping](https://threejs.org/examples/?q=shadow)

## 12. 版本历史

- **v1.0.0** - 基础阴影贴图
- **v1.1.0** - PCF软阴影支持
- **v1.2.0** - 级联阴影贴图
- **v1.3.0** - VSM和ESM支持
- **v1.4.0** - 接触阴影和自适应质量
# 天空盒系统参考

## 1. 概述

天空盒系统提供完整的环境渲染解决方案，包括立方体贴图天空盒、程序化天空生成和基于图像的光照（IBL）支持，为PBR材质提供环境映射。

## 2. 核心特性

### 2.1 立方体贴图天空盒
- 标准立方体贴图渲染 (+X, -X, +Y, -Y, +Z, -Z)
- 优化的深度处理（使用 `gl_Position.xyww`）
- 支持HDR格式环境贴图

### 2.2 程序化天空生成
- 动态天空渐变（天顶到地平线）
- 太阳/月亮光晕效果
- 日夜循环系统
- 大气散射模拟

### 2.3 IBL环境映射
- 漫反射辐照度图生成
- 镜面反射预过滤
- BRDF查找表生成
- 多级Mipmap支持

## 3. 渲染技术

### 3.1 天空盒渲染算法

```typescript
function renderSkybox(camera: Camera) {
    // 1. 移除视图矩阵的位移分量
    const viewMatrix = camera.viewMatrix.clone();
    viewMatrix.m03 = 0; // x
    viewMatrix.m13 = 0; // y
    viewMatrix.m23 = 0; // z

    // 2. 设置渲染状态
    cmdBuf.setDepthTest(true, CompareFunction.LessOrEqual);
    cmdBuf.setDepthWrite(false);
    cmdBuf.setCullMode(CullMode.Front); // 渲染立方体内部

    // 3. 绑定资源
    cmdBuf.bindPipeline(skyboxPipeline);
    cmdBuf.bindTexture(0, cubemapTexture);
    cmdBuf.setUniform('uViewProjection', viewMatrix.multiply(camera.projMatrix));

    // 4. 绘制
    cmdBuf.drawIndexed(cubeGeometry);
}
```

### 3.2 程序化天空生成

```glsl
// 片段着色器 - 程序化天空
#version 300 es
precision highp float;

uniform vec3 uSunDirection;
uniform vec3 uCameraPosition;
uniform float uTime;

in vec3 vPosition;
out vec4 fragColor;

// Rayleigh散射系数
const vec3 RAYLEIGH_BETA = vec3(5.8e-6, 13.5e-6, 33.1e-6);

// Mie散射系数
const float MIE_BETA = 2.0e-5;

// 大气参数
const float ATMOSPHERE_RADIUS = 6420e3;
const float PLANET_RADIUS = 6360e3;
const float HEIGHT_RAYLEIGH = 8e3;
const float HEIGHT_MIE = 1.2e3;

void main() {
    vec3 viewDir = normalize(vPosition - uCameraPosition);
    vec3 sunDir = normalize(uSunDirection);

    // 计算天空颜色
    float height = vPosition.y;
    float zenith = smoothstep(0.0, 1.0, height);

    // 天空渐变
    vec3 horizonColor = vec3(0.89, 0.96, 1.0);
    vec3 zenithColor = vec3(0.09, 0.18, 0.35);
    vec3 skyColor = mix(horizonColor, zenithColor, zenith);

    // 太阳光晕
    float sunDot = dot(viewDir, sunDir);
    float sun = smoothstep(0.9995, 1.0, sunDot);
    vec3 sunColor = vec3(1.0, 0.9, 0.7);

    // 大气散射
    float cosTheta = dot(viewDir, sunDir);
    float rayleigh = calculateRayleighScattering(cosTheta);
    float mie = calculateMieScattering(cosTheta);

    // 合成最终颜色
    vec3 scatteredColor = skyColor * (1.0 + rayleigh);
    scatteredColor += sunColor * sun;
    scatteredColor += sunColor * mie * 0.3;

    fragColor = vec4(scatteredColor, 1.0);
}
```

### 3.3 IBL贴图生成

#### 漫反射辐照度
```glsl
// 卷积着色器 - 生成漫反射辐照度图
#version 300 es
precision highp float;

uniform samplerCube uEnvironment;
uniform float uRoughness;
in vec3 vPosition;
out vec4 fragColor;

const float PI = 3.14159265359;

// 重要性采样函数
vec3 importanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // 构建切线空间向量
    vec3 H;
    H.x = sinTheta * cos(phi);
    H.y = sinTheta * sin(phi);
    H.z = cosTheta;

    // 转换到世界空间
    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

void main() {
    vec3 N = normalize(vPosition);
    vec3 irradiance = vec3(0.0);

    const int SAMPLE_COUNT = 2048;
    for(int i = 0; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = hammersley(i, SAMPLE_COUNT);
        vec3 H = importanceSampleGGX(Xi, N, uRoughness);
        vec3 L = normalize(2.0 * dot(N, H) * H - N);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0) {
            irradiance += texture(uEnvironment, L).rgb * NdotL;
        }
    }

    irradiance = irradiance * (1.0 / float(SAMPLE_COUNT));
    fragColor = vec4(irradiance, 1.0);
}
```

## 4. API参考

### 4.1 SkyboxRenderer类

```typescript
class SkyboxRenderer {
    constructor(rhi: RHIDevice);

    // 设置立方体贴图
    setCubemap(texture: Texture): void;

    // 加载立方体贴图
    async loadCubemap(paths: {
        positiveX: string;
        negativeX: string;
        positiveY: string;
        negativeY: string;
        positiveZ: string;
        negativeZ: string;
    }): Promise<Texture>;

    // 渲染天空盒
    render(
        cmdBuf: CommandBuffer,
        camera: Camera,
        exposure?: number
    ): void;

    // 获取立方体贴图
    getCubemap(): Texture;

    // 销毁资源
    dispose(): void;
}
```

### 4.2 ProceduralSky类

```typescript
class ProceduralSky {
    constructor(rhi: RHIDevice);

    // 设置时间（用于日夜循环）
    setTime(time: number): void;

    // 设置太阳位置
    setSunPosition(direction: Vec3): void;

    // 设置大气参数
    setAtmosphereParams(params: AtmosphereParams): void;

    // 设置天气
    setWeather(weather: WeatherConfig): void;

    // 生成天空盒纹理
    generateCubemap(size: number = 512): Texture;

    // 渲染程序化天空
    render(
        cmdBuf: CommandBuffer,
        camera: Camera
    ): void;

    // 更新动态效果
    update(deltaTime: number): void;
}

interface AtmosphereParams {
    sunIntensity: number;
    sunColor: Vec3;
    skyColor: Vec3;
    horizonColor: Vec3;
    atmosphereRadius: number;
    planetRadius: number;
}

interface WeatherConfig {
    cloudiness: number;        // 云量 0-1
    cloudAltitude: number;     // 云高度
    cloudSpeed: number;        // 云移动速度
    precipitation: 'none' | 'rain' | 'snow';
    fogDensity: number;        // 雾密度
}
```

### 4.3 EnvironmentMap类

```typescript
class EnvironmentMap {
    constructor(rhi: RHIDevice);

    // 从立方体贴图生成IBL贴图
    async generateFromCubemap(
        cubemap: Texture,
        config?: IBLConfig
    ): Promise<IBLMaps>;

    // 从HDR纹理生成
    async generateFromHDR(
        hdrTexture: Texture,
        config?: IBLConfig
    ): Promise<IBLMaps>;

    // 预过滤环境贴图
    prefilterEnvironment(
        environment: Texture,
        roughnessLevels: number = 8
    ): Texture;

    // 生成辐照度图
    generateIrradiance(environment: Texture): Texture;

    // 生成BRDF LUT
    generateBRDFLUT(size: number = 512): Texture;
}

interface IBLMaps {
    irradiance: Texture;       // 漫反射辐照度图
    prefilter: Texture;        // 镜面反射预过滤图
    brdfLUT: Texture;          // BRDF查找表
}

interface IBLConfig {
    irradianceSize: number;    // 辐射度图分辨率
    prefilterSize: number;     // 预过滤图分辨率
    roughnessLevels: number;   // 粗糙度级别数
    sampleCount: number;       // 采样数量
}
```

## 5. 使用示例

### 5.1 基础天空盒

```typescript
import { SkyboxRenderer } from './utils/skybox';

// 创建天空盒渲染器
const skybox = new SkyboxRenderer(rhi);

// 加载立方体贴图
await skybox.loadCubemap({
    positiveX: 'textures/skybox/px.jpg',
    negativeX: 'textures/skybox/nx.jpg',
    positiveY: 'textures/skybox/py.jpg',
    negativeY: 'textures/skybox/ny.jpg',
    positiveZ: 'textures/skybox/pz.jpg',
    negativeZ: 'textures/skybox/nz.jpg'
});

// 渲染循环
function render() {
    // 渲染天空盒（最后渲染，深度为1.0）
    skybox.render(commandBuffer, camera);
}
```

### 5.2 程序化天空

```typescript
const proceduralSky = new ProceduralSky(rhi);

// 设置大气参数
proceduralSky.setAtmosphereParams({
    sunIntensity: 1.0,
    sunColor: [1.0, 0.9, 0.7],
    skyColor: [0.09, 0.18, 0.35],
    horizonColor: [0.89, 0.96, 1.0],
    atmosphereRadius: 6420e3,
    planetRadius: 6360e3
});

// 设置天气
proceduralSky.setWeather({
    cloudiness: 0.3,
    cloudAltitude: 2000,
    cloudSpeed: 10,
    precipitation: 'none',
    fogDensity: 0.1
});

// 日夜循环
let time = 0;
function update(deltaTime: number) {
    time += deltaTime;
    proceduralSky.setTime(time);

    // 计算太阳位置
    const sunAngle = time * 2 * Math.PI;
    const sunDirection = new Vec3(
        Math.cos(sunAngle),
        Math.sin(sunAngle),
        0
    ).normalize();

    proceduralSky.setSunPosition(sunDirection);
    proceduralSky.update(deltaTime);
}
```

### 5.3 IBL环境映射

```typescript
const envMap = new EnvironmentMap(rhi);

// 从HDR环境贴图生成IBL
const hdrTexture = await loadHDRTexture('textures/env.hdr');
const iblMaps = await envMap.generateFromHDR(hdrTexture, {
    irradianceSize: 32,
    prefilterSize: 256,
    roughnessLevels: 8,
    sampleCount: 1024
});

// 设置到PBR材质
pbrMaterial.setEnvironmentMaps(
    iblMaps.irradiance,
    iblMaps.prefilter,
    iblMaps.brdfLUT
);

// 也可以用于实时反射
const skyboxTexture = skybox.getCubemap();
const reflectionMaps = await envMap.generateFromCubemap(skyboxTexture);
```

### 5.4 动态天空盒更新

```typescript
class DynamicSkybox {
    private renderer: SkyboxRenderer;
    private procedural: ProceduralSky;
    private updateInterval: number = 1000; // 1秒更新一次

    constructor(rhi: RHIDevice) {
        this.renderer = new SkyboxRenderer(rhi);
        this.procedural = new ProceduralSky(rhi);
    }

    startDynamicUpdate() {
        setInterval(() => {
            // 生成新的立方体贴图
            const cubemap = this.procedural.generateCubemap(256);
            this.renderer.setCubemap(cubemap);
        }, this.updateInterval);
    }

    render(cmdBuf: CommandBuffer, camera: Camera) {
        this.renderer.render(cmdBuf, camera);
    }
}
```

## 6. 性能优化

### 6.1 纹理优化

```typescript
// 使用压缩格式
const compressionFormats = {
    irradiance: 'rgb16f',      // 16位浮点
    prefilter: 'rgb16f',
    brdfLUT: 'rg16f'           // 只需要RG通道
};

// 动态分辨率
function calculateIBLResolution(devicePixelRatio: number) {
    return {
        irradiance: 32 * devicePixelRatio,
        prefilter: 128 * devicePixelRatio,
        brdfLUT: 256 * devicePixelRatio
    };
}
```

### 6.2 渲染优化

```typescript
// 延迟渲染天空盒
class DeferredSkybox {
    private renderTarget: RenderTarget;

    constructor(rhi: RHIDevice, size: Vec2) {
        this.renderTarget = rhi.createRenderTarget({
            width: size.x,
            height: size.y,
            format: 'rgba16f'
        });
    }

    // 预渲染天空盒到纹理
    preRender(camera: Camera): Texture {
        const cmdBuf = rhi.createCommandBuffer();
        cmdBuf.begin();
        cmdBuf.setRenderTarget(this.renderTarget);
        cmdBuf.clear([0, 0, 0, 0], 1.0);

        this.skybox.render(cmdBuf, camera);

        cmdBuf.end();
        rhi.submit(cmdBuf);

        return this.renderTarget.getTexture();
    }
}
```

### 6.3 缓存系统

```typescript
class IBLCache {
    private cache: Map<string, IBLMaps> = new Map();

    async getIBLMaps(source: string): Promise<IBLMaps> {
        if (this.cache.has(source)) {
            return this.cache.get(source)!;
        }

        const maps = await this.generateIBL(source);
        this.cache.set(source, maps);
        return maps;
    }

    private async generateIBL(source: string): Promise<IBLMaps> {
        const texture = await loadTexture(source);
        return this.envMap.generateFromCubemap(texture);
    }
}
```

## 7. 高级特性

### 7.1 体积云

```typescript
class VolumetricClouds {
    private noiseTexture: Texture3D;
    private weatherTexture: Texture2D;

    constructor(rhi: RHIDevice) {
        // 生成3D噪声纹理
        this.generateNoiseTexture();
        // 生成天气图
        this.generateWeatherTexture();
    }

    render(cmdBuf: CommandBuffer, camera: Camera, skybox: SkyboxRenderer) {
        // 使用体积渲染技术渲染云层
        cmdBuf.bindPipeline(this.cloudPipeline);
        cmdBuf.bindTexture(0, skybox.getCubemap());
        cmdBuf.bindTexture(1, this.noiseTexture);
        cmdBuf.bindTexture(2, this.weatherTexture);

        // 渲染云层
        cmdBuf.drawInstanced(this.cloudGeometry, 1000);
    }

    private generateNoiseTexture() {
        // 使用Perlin噪声生成3D纹理
        const size = 128;
        const data = new Float32Array(size * size * size * 4);

        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const noise = perlinNoise3D(x / 32, y / 32, z / 32);
                    const index = (z * size * size + y * size + x) * 4;
                    data[index] = noise;
                    data[index + 1] = noise;
                    data[index + 2] = noise;
                    data[index + 3] = 1.0;
                }
            }
        }

        this.noiseTexture = rhi.createTexture3D({
            width: size,
            height: size,
            depth: size,
            format: 'rgba32f',
            data: data
        });
    }
}
```

### 7.2 大气散射

```typescript
class AtmosphericScattering {
    private lookupTable: Texture2D;

    constructor(rhi: RHIDevice) {
        // 预计算散射查找表
        this.precomputeScattering();
    }

    render(cmdBuf: CommandBuffer, camera: Camera, skyDirection: Vec3) {
        cmdBuf.bindPipeline(this.scatteringPipeline);
        cmdBuf.bindTexture(0, this.lookupTable);
        cmdBuf.setUniform('uCameraPosition', camera.position);
        cmdBuf.setUniform('uSkyDirection', skyDirection);

        // 全屏四边形
        cmdBuf.draw(this.fullscreenQuad);
    }

    private precomputeScattering() {
        const size = 256;
        const data = new Float32Array(size * size * 4);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cosView = x / size;
                const cosSun = y / size;

                const scattering = this.calculateScattering(cosView, cosSun);
                const index = (y * size + x) * 4;

                data[index] = scattering.x;
                data[index + 1] = scattering.y;
                data[index + 2] = scattering.z;
                data[index + 3] = 1.0;
            }
        }

        this.lookupTable = rhi.createTexture2D({
            width: size,
            height: size,
            format: 'rgba32f',
            data: data
        });
    }
}
```

## 8. 调试工具

### 8.1 可视化调试

```typescript
class SkyboxDebugger {
    private showWireframe: boolean = false;
    private showIBLMAPS: boolean = false;

    renderDebug(cmdBuf: CommandBuffer, skybox: SkyboxRenderer) {
        if (this.showWireframe) {
            // 渲染立方体线框
            this.renderWireframeCube(cmdBuf, skybox);
        }

        if (this.showIBLMAPS) {
            // 显示IBL贴图
            this.renderIBLMaps(cmdBuf, skybox);
        }
    }

    private renderWireframeCube(cmdBuf: CommandBuffer, skybox: SkyboxRenderer) {
        cmdBuf.bindPipeline(this.wireframePipeline);
        cmdBuf.setUniform('uViewProjection', skybox.getViewProjection());
        cmdBuf.drawIndexed(this.cubeWireframe);
    }

    private renderIBLMaps(cmdBuf: CommandBuffer, skybox: SkyboxRenderer) {
        const iblMaps = skybox.getIBLMaps();

        // 在屏幕角落显示贴图
        this.renderTexturePreview(iblMaps.irradiance, 10, 10, 128);
        this.renderTexturePreview(iblMaps.prefilter, 148, 10, 128);
        this.renderTexturePreview(iblMaps.brdfLUT, 286, 10, 128);
    }
}
```

## 9. 最佳实践

### 9.1 资源管理
1. **及时释放**：不用的纹理及时释放
2. **缓存复用**：相同环境贴图复用IBL计算结果
3. **压缩存储**：使用合适的纹理压缩格式

### 9.2 性能优化
1. **动态分辨率**：根据性能动态调整IBL贴图分辨率
2. **延迟更新**：环境变化不频繁时延迟更新
3. **批处理**：多个天空盒共享渲染管线

### 9.3 视觉质量
1. **HDR支持**：使用HDR环境贴图获得更好的光照
2. **Mipmap**：确保预过滤贴图有完整的Mipmap链
3. **色彩空间**：正确处理线性空间和sRGB转换

## 10. 故障排除

### 10.1 常见问题

**问题**: 天空盒接缝明显
- **原因**: 立方体贴图边缘不连续或过滤设置不当
- **解决**: 使用无缝纹理和正确的边缘处理

**问题**: IBL光照过暗或过亮
- **原因**: 色彩空间转换错误或曝光值不当
- **解决**: 检查线性空间转换和调整曝光参数

**问题**: 性能问题
- **原因**: IBL贴图分辨率过高或更新频率过高
- **解决**: 降低分辨率或实现缓存机制

## 11. 参考资源

### 11.1 理论基础
- [Physically Based Rendering: From Theory to Implementation](http://www.pbr-book.org/)
- [Real-Time Rendering, Fourth Edition](https://www.realtimerendering.com/)
- [GPU Gems 2 - Chapter 20: High-Quality Environmental Mapping](https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter20.html)

### 11.2 实现参考
- [CryEngine Atmospheric Scattering](https://www.cryengine.com/news/view/introducing-volumetric-clouds-and-fog)
- [Unreal Engine Sky Atmosphere](https://docs.unrealengine.com/en-US/Engine/Rendering/PostProcessEffects/SkyAtmosphere/)
- [Unity HDRP Sky](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@10.0/manual/Sky-and-Fog.html)

## 12. 版本历史

- **v1.0.0** - 基础天空盒渲染
- **v1.1.0** - 程序化天空生成
- **v1.2.0** - IBL环境映射支持
- **v1.3.0** - 大气散射模拟
- **v1.4.0** - 体积云渲染
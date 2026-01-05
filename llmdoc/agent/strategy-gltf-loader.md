---
id: "strategy-gltf-loader"
type: "strategy"
title: "glTF 加载器技术规格"
description: "Engine 包 glTF 2.0 加载器的详细技术规格，包括解析流程、资源创建、实体构建和扩展支持"
tags: ["engine", "gltf", "loader", "mesh", "material", "texture", "animation", "draco", "ktx2"]
context_dependency: ["arch-engine-architecture-spec", "architecture-resources"]
related_ids: ["arch-engine-architecture-spec", "strategy-lighting-system"]
last_updated: "2026-01-05"
---

# glTF 加载器技术规格

> **Context**: Engine 包需要支持 glTF 2.0 模型加载以导入外部 3D 资源。
> **Goal**: 实现完整的 glTF 2.0 加载器，支持网格、材质、纹理、动画和常用扩展。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| glTF JSON | 解析 .gltf 文件 | P1 |
| GLB 二进制 | 解析 .glb 文件 | P1 |
| 网格数据 | 顶点、法线、UV、索引 | P1 |
| PBR 材质 | 金属度-粗糙度工作流 | P1 |
| 纹理加载 | 嵌入式和外部纹理 | P1 |
| 场景层级 | 节点父子关系 | P1 |
| 骨骼动画 | Skinning 数据 | P2 |
| 变形动画 | Morph Targets | P2 |
| Draco 压缩 | KHR_draco_mesh_compression | P2 |
| KTX2 纹理 | KHR_texture_basisu | P2 |
| 光源 | KHR_lights_punctual | P2 |

### 1.2 性能目标

- 异步加载，不阻塞主线程
- 支持加载进度回调
- 资源缓存和复用
- 延迟纹理加载选项

---

## 2. 接口定义

### 2.1 加载结果接口

```typescript
/**
 * glTF 加载结果
 */
interface GLTFResult {
  /** 默认场景根实体 */
  scene: EntityId;
  /** 所有场景 */
  scenes: EntityId[];
  /** 网格数据映射 */
  meshes: Map<number, MeshData[]>;
  /** 材质映射 */
  materials: Map<number, PBRMaterial>;
  /** 纹理映射 */
  textures: Map<number, IRHITexture>;
  /** 动画片段 */
  animations: AnimationClip[];
  /** 相机实体 */
  cameras: EntityId[];
  /** 光源实体 */
  lights: EntityId[];
  /** 骨骼数据 */
  skins: SkinData[];
  /** 原始 glTF JSON */
  json: GLTFDocument;
}

/**
 * 网格数据
 */
interface MeshData {
  /** 顶点位置 */
  positions: Float32Array;
  /** 法线 */
  normals?: Float32Array;
  /** 纹理坐标 */
  uvs?: Float32Array;
  /** 第二套 UV */
  uvs2?: Float32Array;
  /** 顶点颜色 */
  colors?: Float32Array;
  /** 切线 */
  tangents?: Float32Array;
  /** 索引 */
  indices?: Uint16Array | Uint32Array;
  /** 骨骼权重 */
  weights?: Float32Array;
  /** 骨骼索引 */
  joints?: Uint16Array;
  /** 变形目标 */
  morphTargets?: MorphTarget[];
}

/**
 * 动画片段
 */
interface AnimationClip {
  name: string;
  duration: number;
  channels: AnimationChannel[];
}

/**
 * 动画通道
 */
interface AnimationChannel {
  targetNode: number;
  targetPath: 'translation' | 'rotation' | 'scale' | 'weights';
  sampler: AnimationSampler;
}

/**
 * 动画采样器
 */
interface AnimationSampler {
  input: Float32Array;   // 时间关键帧
  output: Float32Array;  // 值关键帧
  interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}
```

### 2.2 加载器接口

```typescript
/**
 * glTF 加载器配置
 */
interface GLTFLoaderConfig {
  /** 是否立即加载纹理 默认 true */
  loadTextures?: boolean;
  /** 是否生成切线 默认 true */
  generateTangents?: boolean;
  /** 是否计算包围盒 默认 true */
  computeBounds?: boolean;
  /** Draco 解码器路径 */
  dracoDecoderPath?: string;
  /** KTX2 转码器路径 */
  ktx2TranscoderPath?: string;
}

/**
 * 加载进度回调
 */
interface GLTFLoadProgress {
  loaded: number;
  total: number;
  stage: 'json' | 'buffers' | 'textures' | 'meshes' | 'materials' | 'scene';
}

/**
 * glTF 加载器
 */
interface IGLTFLoader {
  /**
   * 加载 glTF 文件
   * @param url 文件 URL
   * @param onProgress 进度回调
   */
  load(url: string, onProgress?: (progress: GLTFLoadProgress) => void): Promise<GLTFResult>;
  
  /**
   * 解析 glTF JSON
   * @param json glTF JSON 对象
   * @param baseUrl 基础 URL
   */
  parse(json: GLTFDocument, baseUrl: string): Promise<GLTFResult>;
  
  /**
   * 设置 Draco 解码器
   */
  setDracoDecoder(decoder: DracoDecoder): void;
  
  /**
   * 设置 KTX2 转码器
   */
  setKTX2Transcoder(transcoder: KTX2Transcoder): void;
  
  /**
   * 释放资源
   */
  dispose(): void;
}
```

---

## 3. 解析流程

### 3.1 主加载流程

```pseudocode
FUNCTION GLTFLoader.load(url: string, onProgress?): Promise<GLTFResult>
  // 1. 判断文件类型
  IF url.endsWith('.glb'):
    data = await loadGLB(url, onProgress)
  ELSE:
    data = await loadGLTF(url, onProgress)
  
  // 2. 解析 JSON
  onProgress?.({ stage: 'json', loaded: 1, total: 1 })
  json = data.json
  
  // 3. 加载二进制缓冲区
  onProgress?.({ stage: 'buffers', loaded: 0, total: json.buffers?.length || 0 })
  buffers = await loadBuffers(json, data.baseUrl, onProgress)
  
  // 4. 加载纹理
  IF config.loadTextures:
    onProgress?.({ stage: 'textures', loaded: 0, total: json.textures?.length || 0 })
    textures = await loadTextures(json, data.baseUrl, onProgress)
  
  // 5. 创建材质
  onProgress?.({ stage: 'materials', loaded: 0, total: json.materials?.length || 0 })
  materials = createMaterials(json, textures)
  
  // 6. 创建网格
  onProgress?.({ stage: 'meshes', loaded: 0, total: json.meshes?.length || 0 })
  meshes = createMeshes(json, buffers, onProgress)
  
  // 7. 构建场景
  onProgress?.({ stage: 'scene', loaded: 0, total: 1 })
  result = buildScene(json, meshes, materials)
  
  RETURN result
```

### 3.2 GLB 解析

```pseudocode
FUNCTION loadGLB(url: string): Promise<{ json: GLTFDocument, buffers: ArrayBuffer[] }>
  // 1. 加载二进制数据
  arrayBuffer = await fetch(url).then(r => r.arrayBuffer())
  
  // 2. 解析 GLB 头部
  dataView = new DataView(arrayBuffer)
  magic = dataView.getUint32(0, true)
  
  IF magic != 0x46546C67:  // 'glTF'
    THROW Error('Invalid GLB magic')
  
  version = dataView.getUint32(4, true)
  length = dataView.getUint32(8, true)
  
  // 3. 解析 chunks
  offset = 12
  json = null
  binaryBuffer = null
  
  WHILE offset < length:
    chunkLength = dataView.getUint32(offset, true)
    chunkType = dataView.getUint32(offset + 4, true)
    chunkData = arrayBuffer.slice(offset + 8, offset + 8 + chunkLength)
    
    IF chunkType == 0x4E4F534A:  // 'JSON'
      json = JSON.parse(new TextDecoder().decode(chunkData))
    ELSE IF chunkType == 0x004E4942:  // 'BIN'
      binaryBuffer = chunkData
    
    offset += 8 + chunkLength
  
  RETURN { json, buffers: [binaryBuffer] }
```

### 3.3 Accessor 数据读取

```pseudocode
FUNCTION readAccessor(json: GLTFDocument, accessorIndex: number, buffers: ArrayBuffer[]): TypedArray
  accessor = json.accessors[accessorIndex]
  bufferView = json.bufferViews[accessor.bufferView]
  buffer = buffers[bufferView.buffer]
  
  // 计算偏移
  byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0)
  
  // 确定元素大小
  componentSize = getComponentSize(accessor.componentType)
  elementCount = getElementCount(accessor.type)
  stride = bufferView.byteStride || (componentSize * elementCount)
  
  // 创建类型化数组
  TypedArrayClass = getTypedArrayClass(accessor.componentType)
  
  IF stride == componentSize * elementCount:
    // 紧密排列，直接创建视图
    RETURN new TypedArrayClass(buffer, byteOffset, accessor.count * elementCount)
  ELSE:
    // 交错排列，需要复制数据
    result = new TypedArrayClass(accessor.count * elementCount)
    FOR i = 0 TO accessor.count - 1:
      srcOffset = byteOffset + i * stride
      FOR j = 0 TO elementCount - 1:
        result[i * elementCount + j] = readComponent(buffer, srcOffset + j * componentSize, accessor.componentType)
    RETURN result

FUNCTION getComponentSize(componentType: number): number
  SWITCH componentType:
    CASE 5120: RETURN 1   // BYTE
    CASE 5121: RETURN 1   // UNSIGNED_BYTE
    CASE 5122: RETURN 2   // SHORT
    CASE 5123: RETURN 2   // UNSIGNED_SHORT
    CASE 5125: RETURN 4   // UNSIGNED_INT
    CASE 5126: RETURN 4   // FLOAT

FUNCTION getElementCount(type: string): number
  SWITCH type:
    CASE 'SCALAR': RETURN 1
    CASE 'VEC2': RETURN 2
    CASE 'VEC3': RETURN 3
    CASE 'VEC4': RETURN 4
    CASE 'MAT2': RETURN 4
    CASE 'MAT3': RETURN 9
    CASE 'MAT4': RETURN 16
```

---

## 4. 资源创建

### 4.1 网格创建

```pseudocode
FUNCTION createMeshes(json: GLTFDocument, buffers: ArrayBuffer[]): Map<number, MeshData[]>
  meshMap = new Map()
  
  FOR meshIndex = 0 TO json.meshes.length - 1:
    mesh = json.meshes[meshIndex]
    primitives = []
    
    FOR primitive IN mesh.primitives:
      meshData = new MeshData()
      
      // 读取顶点属性
      IF primitive.attributes.POSITION != undefined:
        meshData.positions = readAccessor(json, primitive.attributes.POSITION, buffers)
      
      IF primitive.attributes.NORMAL != undefined:
        meshData.normals = readAccessor(json, primitive.attributes.NORMAL, buffers)
      
      IF primitive.attributes.TEXCOORD_0 != undefined:
        meshData.uvs = readAccessor(json, primitive.attributes.TEXCOORD_0, buffers)
      
      IF primitive.attributes.TEXCOORD_1 != undefined:
        meshData.uvs2 = readAccessor(json, primitive.attributes.TEXCOORD_1, buffers)
      
      IF primitive.attributes.COLOR_0 != undefined:
        meshData.colors = readAccessor(json, primitive.attributes.COLOR_0, buffers)
      
      IF primitive.attributes.TANGENT != undefined:
        meshData.tangents = readAccessor(json, primitive.attributes.TANGENT, buffers)
      ELSE IF config.generateTangents AND meshData.normals AND meshData.uvs:
        meshData.tangents = generateTangents(meshData)
      
      IF primitive.attributes.JOINTS_0 != undefined:
        meshData.joints = readAccessor(json, primitive.attributes.JOINTS_0, buffers)
      
      IF primitive.attributes.WEIGHTS_0 != undefined:
        meshData.weights = readAccessor(json, primitive.attributes.WEIGHTS_0, buffers)
      
      // 读取索引
      IF primitive.indices != undefined:
        meshData.indices = readAccessor(json, primitive.indices, buffers)
      
      // 读取变形目标
      IF primitive.targets:
        meshData.morphTargets = []
        FOR target IN primitive.targets:
          morphTarget = {}
          IF target.POSITION != undefined:
            morphTarget.positions = readAccessor(json, target.POSITION, buffers)
          IF target.NORMAL != undefined:
            morphTarget.normals = readAccessor(json, target.NORMAL, buffers)
          meshData.morphTargets.push(morphTarget)
      
      primitives.push(meshData)
    
    meshMap.set(meshIndex, primitives)
  
  RETURN meshMap
```

### 4.2 材质创建

```pseudocode
FUNCTION createMaterials(json: GLTFDocument, textures: Map<number, IRHITexture>): Map<number, PBRMaterial>
  materialMap = new Map()
  
  FOR materialIndex = 0 TO json.materials.length - 1:
    gltfMaterial = json.materials[materialIndex]
    
    config = {
      baseColor: [1, 1, 1, 1],
      metallic: 1,
      roughness: 1,
      doubleSided: gltfMaterial.doubleSided || false,
      alphaMode: gltfMaterial.alphaMode || 'OPAQUE',
      alphaCutoff: gltfMaterial.alphaCutoff || 0.5
    }
    
    // PBR 金属度-粗糙度
    IF gltfMaterial.pbrMetallicRoughness:
      pbr = gltfMaterial.pbrMetallicRoughness
      
      IF pbr.baseColorFactor:
        config.baseColor = pbr.baseColorFactor
      
      IF pbr.metallicFactor != undefined:
        config.metallic = pbr.metallicFactor
      
      IF pbr.roughnessFactor != undefined:
        config.roughness = pbr.roughnessFactor
      
      IF pbr.baseColorTexture:
        textureIndex = pbr.baseColorTexture.index
        config.baseColorTexture = textures.get(textureIndex)
      
      IF pbr.metallicRoughnessTexture:
        textureIndex = pbr.metallicRoughnessTexture.index
        config.metallicRoughnessTexture = textures.get(textureIndex)
    
    // 法线贴图
    IF gltfMaterial.normalTexture:
      config.normalTexture = textures.get(gltfMaterial.normalTexture.index)
      config.normalScale = gltfMaterial.normalTexture.scale || 1
    
    // 遮蔽贴图
    IF gltfMaterial.occlusionTexture:
      config.occlusionTexture = textures.get(gltfMaterial.occlusionTexture.index)
      config.occlusionStrength = gltfMaterial.occlusionTexture.strength || 1
    
    // 自发光
    IF gltfMaterial.emissiveFactor:
      config.emissiveColor = gltfMaterial.emissiveFactor
    
    IF gltfMaterial.emissiveTexture:
      config.emissiveTexture = textures.get(gltfMaterial.emissiveTexture.index)
    
    material = new PBRMaterial(device, config)
    materialMap.set(materialIndex, material)
  
  RETURN materialMap
```

### 4.3 纹理加载

```pseudocode
FUNCTION loadTextures(json: GLTFDocument, baseUrl: string): Promise<Map<number, IRHITexture>>
  textureMap = new Map()
  
  FOR textureIndex = 0 TO json.textures.length - 1:
    gltfTexture = json.textures[textureIndex]
    image = json.images[gltfTexture.source]
    
    // 确定图像数据来源
    IF image.uri:
      // 外部图像
      IF image.uri.startsWith('data:'):
        // Data URI
        imageData = await loadDataURI(image.uri)
      ELSE:
        // 外部文件
        imageUrl = resolveUrl(baseUrl, image.uri)
        imageData = await loadImage(imageUrl)
    ELSE IF image.bufferView != undefined:
      // 嵌入式图像
      bufferView = json.bufferViews[image.bufferView]
      buffer = buffers[bufferView.buffer]
      imageData = await decodeImage(buffer, bufferView, image.mimeType)
    
    // 获取采样器设置
    sampler = gltfTexture.sampler != undefined ? json.samplers[gltfTexture.sampler] : {}
    
    // 创建 RHI 纹理
    texture = device.createTexture({
      width: imageData.width,
      height: imageData.height,
      format: RGBA8_UNORM,
      usage: SAMPLED,
      initialData: imageData.data
    })
    
    // 设置采样器
    texture.setSampler({
      minFilter: convertFilter(sampler.minFilter),
      magFilter: convertFilter(sampler.magFilter),
      wrapS: convertWrap(sampler.wrapS),
      wrapT: convertWrap(sampler.wrapT)
    })
    
    textureMap.set(textureIndex, texture)
  
  RETURN textureMap
```

---

## 5. 场景构建

### 5.1 节点层级构建

```pseudocode
FUNCTION buildScene(json: GLTFDocument, meshes: Map, materials: Map): GLTFResult
  result = new GLTFResult()
  nodeEntityMap = new Map()  // glTF 节点索引 -> EntityId
  
  // 1. 创建所有节点实体
  FOR nodeIndex = 0 TO json.nodes.length - 1:
    node = json.nodes[nodeIndex]
    entity = scene.createEntity(node.name || `Node_${nodeIndex}`)
    nodeEntityMap.set(nodeIndex, entity)
    
    // 添加 Transform 组件
    transform = createTransformFromNode(node)
    scene.world.addComponent(entity, LocalTransform, transform)
    scene.world.addComponent(entity, WorldTransform, new WorldTransform())
    
    // 添加 Mesh 组件
    IF node.mesh != undefined:
      meshDataList = meshes.get(node.mesh)
      materialIndex = json.meshes[node.mesh].primitives[0].material
      material = materials.get(materialIndex) || defaultMaterial
      
      // 为每个 primitive 创建 MeshInstance
      FOR primitiveIndex = 0 TO meshDataList.length - 1:
        meshData = meshDataList[primitiveIndex]
        
        // 创建 GPU 缓冲区
        meshInstance = createMeshInstance(meshData)
        scene.world.addComponent(entity, MeshInstance, meshInstance)
        
        // 创建材质实例
        materialInstance = new MaterialInstance()
        materialInstance.material = material
        scene.world.addComponent(entity, MaterialInstance, materialInstance)
    
    // 添加 Camera 组件
    IF node.camera != undefined:
      camera = createCameraFromGLTF(json.cameras[node.camera])
      scene.world.addComponent(entity, Camera, camera)
      result.cameras.push(entity)
    
    // 添加 Light 组件 KHR_lights_punctual
    IF node.extensions?.KHR_lights_punctual:
      lightIndex = node.extensions.KHR_lights_punctual.light
      light = createLightFromGLTF(json.extensions.KHR_lights_punctual.lights[lightIndex])
      scene.world.addComponent(entity, Light, light)
      result.lights.push(entity)
  
  // 2. 建立父子关系
  FOR nodeIndex = 0 TO json.nodes.length - 1:
    node = json.nodes[nodeIndex]
    IF node.children:
      parentEntity = nodeEntityMap.get(nodeIndex)
      FOR childIndex IN node.children:
        childEntity = nodeEntityMap.get(childIndex)
        scene.setParent(childEntity, parentEntity)
  
  // 3. 创建场景根节点
  FOR sceneIndex = 0 TO json.scenes.length - 1:
    gltfScene = json.scenes[sceneIndex]
    sceneRoot = scene.createEntity(gltfScene.name || `Scene_${sceneIndex}`)
    
    FOR nodeIndex IN gltfScene.nodes:
      nodeEntity = nodeEntityMap.get(nodeIndex)
      scene.setParent(nodeEntity, sceneRoot)
    
    result.scenes.push(sceneRoot)
  
  // 4. 设置默认场景
  defaultSceneIndex = json.scene || 0
  result.scene = result.scenes[defaultSceneIndex]
  
  RETURN result

FUNCTION createTransformFromNode(node: GLTFNode): LocalTransform
  transform = new LocalTransform()
  
  IF node.matrix:
    // 从矩阵分解 TRS
    { translation, rotation, scale } = decomposeMatrix(node.matrix)
    transform.position = { x: translation[0], y: translation[1], z: translation[2] }
    transform.rotation = { x: rotation[0], y: rotation[1], z: rotation[2], w: rotation[3] }
    transform.scale = { x: scale[0], y: scale[1], z: scale[2] }
  ELSE:
    IF node.translation:
      transform.position = { x: node.translation[0], y: node.translation[1], z: node.translation[2] }
    IF node.rotation:
      transform.rotation = { x: node.rotation[0], y: node.rotation[1], z: node.rotation[2], w: node.rotation[3] }
    IF node.scale:
      transform.scale = { x: node.scale[0], y: node.scale[1], z: node.scale[2] }
  
  RETURN transform
```

---

## 6. 扩展支持

### 6.1 支持的扩展列表

| 扩展 | 描述 | 优先级 |
|------|------|:------:|
| KHR_draco_mesh_compression | Draco 几何压缩 | P2 |
| KHR_texture_basisu | KTX2/Basis 纹理 | P2 |
| KHR_materials_unlit | 无光照材质 | P1 |
| KHR_lights_punctual | 光源定义 | P2 |
| KHR_mesh_quantization | 网格量化 | P2 |
| KHR_texture_transform | 纹理变换 | P2 |

### 6.2 Draco 解压

```pseudocode
FUNCTION decodeDracoMesh(bufferView: ArrayBuffer, extension: DracoExtension): MeshData
  // 初始化 Draco 解码器
  decoder = new DracoDecoder()
  
  // 创建解码缓冲区
  buffer = new DecoderBuffer()
  buffer.Init(new Int8Array(bufferView), bufferView.byteLength)
  
  // 获取几何类型
  geometryType = decoder.GetEncodedGeometryType(buffer)
  
  IF geometryType == TRIANGULAR_MESH:
    mesh = new Mesh()
    status = decoder.DecodeBufferToMesh(buffer, mesh)
    
    IF NOT status.ok():
      THROW Error('Draco decode failed')
    
    // 读取属性
    meshData = new MeshData()
    
    // 位置
    posAttr = mesh.GetAttributeByUniqueId(extension.attributes.POSITION)
    meshData.positions = readDracoAttribute(decoder, mesh, posAttr)
    
    // 法线
    IF extension.attributes.NORMAL != undefined:
      normalAttr = mesh.GetAttributeByUniqueId(extension.attributes.NORMAL)
      meshData.normals = readDracoAttribute(decoder, mesh, normalAttr)
    
    // UV
    IF extension.attributes.TEXCOORD_0 != undefined:
      uvAttr = mesh.GetAttributeByUniqueId(extension.attributes.TEXCOORD_0)
      meshData.uvs = readDracoAttribute(decoder, mesh, uvAttr)
    
    // 索引
    meshData.indices = readDracoIndices(decoder, mesh)
    
    RETURN meshData
```

---

## 7. 实现步骤

### 7.1 Step 1: 创建 GLTFLoader 类

**文件**: `packages/engine/src/loaders/gltf-loader.ts`

### 7.2 Step 2: 实现 GLB 解析

**文件**: `packages/engine/src/loaders/glb-parser.ts`

### 7.3 Step 3: 实现 Accessor 读取

**文件**: `packages/engine/src/loaders/gltf-accessor.ts`

### 7.4 Step 4: 实现资源创建

**文件**: `packages/engine/src/loaders/gltf-resources.ts`

### 7.5 Step 5: 实现场景构建

**文件**: `packages/engine/src/loaders/gltf-scene.ts`

### 7.6 Step 6: 集成到 Engine

**文件**: `packages/engine/src/engine/engine.ts`

---

## 8. 验证标准

- [ ] 正确加载 .gltf 文件
- [ ] 正确加载 .glb 文件
- [ ] 网格顶点数据正确
- [ ] PBR 材质属性正确
- [ ] 纹理正确显示
- [ ] 节点层级关系正确
- [ ] 动画数据正确解析

---

## 9. 禁止事项

- 🚫 **同步加载** - 必须使用异步 API
- 🚫 **忽略 bufferView 偏移** - 必须正确计算偏移
- 🚫 **假设紧密排列** - 必须处理交错数据
- 🚫 **忽略采样器设置** - 必须应用纹理采样器
- 🚫 **硬编码坐标系** - glTF 使用右手坐标系

---

## 10. 相关文档

- [Engine 架构规格](../architecture/engine-architecture-spec.md)
- [资源管理](../architecture/resources.md)
- [glTF 2.0 规范](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
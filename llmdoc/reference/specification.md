---
id: "ref-specification"
type: "reference"
title: "Specification Package Reference"
description: "Complete reference for @maxellabs/specification package including core interfaces, scene data formats, and type definitions"
tags: ["specification", "interfaces", "types", "scene-data", "material", "camera", "light"]
context_dependency: ["constitution-core-runtime"]
related_ids: ["architecture-components", "architecture-scene-systems", "architecture-resources"]
---

## 📋 Context & Goal

**Context**: This document provides complete reference for the `@maxellabs/specification` package, which defines all interfaces and type contracts used across the Max runtime ecosystem.

**Goal**: Serve as the single source of truth for all type definitions, ensuring consistency between editor, engine, and runtime.

**Design Principle**: Specification package contains ONLY interface definitions and enums - no implementation code.

---

## 🏗️ Package Structure

```
@maxellabs/specification/
├── src/
│   ├── core/
│   │   ├── enums.ts          # Enums (ResourceType, LightType, etc.)
│   │   ├── generics.ts       # Generic types (Vector3Like, etc.)
│   │   ├── interfaces.ts     # Core interfaces (IDisposable, IReferable)
│   │   ├── material.ts       # Material types
│   │   ├── resources.ts      # Resource interfaces
│   │   └── scene.ts          # Scene data formats
│   │
│   ├── common/
│   │   ├── elements.ts       # Common element types
│   │   ├── layout.ts         # Layout interfaces
│   │   ├── material.ts       # Material properties
│   │   └── texture.ts        # Texture interfaces
│   │
│   ├── rendering/
│   │   ├── camera.ts         # Camera interfaces
│   │   ├── light.ts          # Light interfaces
│   │   └── material.ts       # Material specifications
│   │
│   └── index.ts              # Main exports
```

---

## 🔌 Core Interfaces

### IDisposable

```typescript
interface IDisposable {
  /** Check if resource is disposed */
  isDisposed(): boolean;

  /** Dispose resource and release all references */
  dispose(): void;
}
```

**Purpose**: Base interface for any resource that needs explicit cleanup.

**Usage**:
```typescript
class MyResource implements IDisposable {
  private _disposed = false;

  isDisposed(): boolean {
    return this._disposed;
  }

  dispose(): void {
    if (this._disposed) return;
    // Cleanup logic
    this._disposed = true;
  }
}
```

### IReferable

```typescript
interface IReferable {
  /** Reference count */
  refCount: number;

  /** Add reference */
  addRef(): void;

  /** Release reference */
  release(): void;
}
```

**Purpose**: Base interface for reference-counted resources.

**Usage**:
```typescript
class GPUBuffer implements IReferable {
  refCount: number = 0;

  addRef(): void {
    this.refCount++;
  }

  release(): void {
    this.refCount--;
    if (this.refCount <= 0) {
      this.destroy();
    }
  }
}
```

---

## 📐 Math Types

### Vector3Like

```typescript
interface Vector3Like {
  x: number;
  y: number;
  z: number;
}
```

**Usage**: Position, scale, velocity, etc.

### Vector2Like

```typescript
interface Vector2Like {
  x: number;
  y: number;
}
```

**Usage**: UV coordinates, 2D positions, etc.

### QuaternionLike

```typescript
interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}
```

**Usage**: Rotation (always normalized).

### Matrix4Like

```typescript
interface Matrix4Like {
  m00: number; m01: number; m02: number; m03: number;
  m10: number; m11: number; m12: number; m13: number;
  m20: number; m21: number; m22: number; m23: number;
  m30: number; m31: number; m32: number; m33: number;
}
```

**⚠️ Row-major naming convention** (per Constitution).

### ColorLike

```typescript
interface ColorLike {
  r: number;
  g: number;
  b: number;
  a: number;
}
```

**Usage**: RGBA colors, normalized [0-1].

---

## 🎬 Scene Data Types

### ISceneData

```typescript
interface ISceneData {
  version: ISceneVersion;
  metadata: ISceneMetadata;
  entities: IEntityData[];
  assets?: IAssetRefData[];
  environment?: IEnvironmentData;
  renderSettings?: IRenderSettingsData;
}
```

**Purpose**: Root structure for serialized scene data from editor.

**Example**:
```json
{
  "version": { "major": 1, "minor": 0, "patch": 0 },
  "metadata": {
    "name": "MainScene",
    "id": "scene_123",
    "modifiedAt": "2024-12-23T10:00:00Z"
  },
  "entities": [
    {
      "id": 1,
      "name": "Cube",
      "components": [
        { "type": "LocalTransform", "data": { "position": { "x": 0, "y": 0, "z": 0 } } },
        { "type": "MeshRef", "data": { "assetId": "cube-mesh" } }
      ]
    }
  ]
}
```

### ISceneVersion

```typescript
interface ISceneVersion {
  major: number;
  minor: number;
  patch: number;
}
```

**Purpose**: Version tracking for format compatibility.

### ISceneMetadata

```typescript
interface ISceneMetadata {
  name: string;
  id?: string;
  description?: string;
  createdAt?: string;
  modifiedAt?: string;
  author?: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
}
```

### IEntityData

```typescript
interface IEntityData {
  id: number;
  name?: string;
  tag?: string;
  active?: boolean;
  parent?: number | null;
  components: IComponentData[];
}
```

**Purpose**: Single entity in scene hierarchy.

### IComponentData

```typescript
interface IComponentData {
  type: string;        // Component type identifier
  data: Record<string, unknown>;  // Component data (POD)
  enabled?: boolean;   // Component enabled state
}
```

**Example**:
```json
{
  "type": "Camera",
  "data": {
    "projectionType": "perspective",
    "fov": 1.047,
    "near": 0.1,
    "far": 1000
  },
  "enabled": true
}
```

---

## 🎨 Component Data Types

### ITransformData

```typescript
interface ITransformData {
  position?: Vector3Like;
  rotation?: QuaternionLike;
  scale?: Vector3Like;
}
```

**Purpose**: Transform component data for scene serialization.

 **
 I I I I I scene I I I scene I I I I I I** I
 {
 camera  八卦igh
ighigh ryigh igh igh ighigh IGH igh 魏igh Igh ry
igh  / I    igh
   /  "
 camera  I (
   data, /    I (   in,  I I I I, the . I,   I is I **  I** I**:,**,,,,,,,**,, ,,,,,,,,,,,,  I,,,,,,,,,,,,,,,,,,,,,,,,,,,,., to.,,,,.,,,,,,,,,,, ,,,,,, and,,,,. , ,,, ,,,   the ,
 I ,, , to,  ", ICameraData {
```typescripttypescripttypescriptinterface ICameraData {
  projection projectionType: ProjectionType;  //  fov?: number;
  aspect?: number;
  orthographicSize?: number;
  near: number;
  far: number;
  isMain?: boolean;
  priority?: number;
  clearFlags?: CameraClearFlags;
  backgroundColor?: ColorLike;
  viewport?: [number, number, number, number];
  cullingMask?: number;
}
```

**Types**:
```typescript
type ProjectionType = 'perspective' | 'orthographic';
type CameraClearFlags = 'color' | 'depth' | 'stencil' | 'skybox';
```

**Usage**: Camera component data.

### Light Data Types

```typescript
// Base
interface ILightDataBase {
  color: ColorLike;
  intensity: number;
  castShadow: boolean;
  shadow?: IShadowConfig;
  cullingMask?: number;
}

// Directional
interface IDirectionalLightData extends ILightDataBase {
  lightType: LightType.Directional;
  shadow?: IShadowConfig & { cascadeCount?: number };
}

// Point
interface IPointLightData extends ILightDataBase {
  lightType: LightType.Point;
  range: number;
}

// Spot
interface ISpotLightData extends ILightDataBase {
  lightType: LightType.Spot;
  range: number;
  innerConeAngle: number;
  outerConeAngle: number;
}

type ILightData = IDirectionalLightData | IPointLightData | ISpotLightData;
```

**Shadow Config**:
```typescript
interface IShadowConfig {
  enabled: boolean;
  type: ShadowType;
  resolution: number;
  bias: number;
  normalBias: number;
  strength: number;
  distance: number;
  cascadeCount?: number;
}

type ShadowType = 'hard' | 'soft' | 'pcf';
```

### Visual Data Types

```typescript
interface IMeshRef {
  assetId: string;
  meshName?: string;
  submeshIndex?: number;
}

interface IMaterialRef {
  assetId: string;
  overrides?: Record<string, unknown>;
  materialEnabled?: boolean;
}

interface BaseTextureRef {
  assetId: string;
  slot?: string;
  uvChannel?: number;
  transform?: TextureTransform;
  sampler?: TextureSampler;
  intensity?: number;
}

interface TextureTransform {
  scale?: Vector2Like;
  offset?: Vector2Like;
  rotation?: number;
}

interface TextureSampler {
  wrapS: number;
  wrapT: number;
  minFilter: number;
  magFilter: number;
}

interface IVisible {
  value: boolean;
}

interface ILayer {
  value: number;
}

interface ICastShadow {
  value: boolean;
}

interface IReceiveShadow {
  value: boolean;
}
```

### Layout Data Types

```typescript
interface IAnchor {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

interface IFlexContainer {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: FlexJustify;
  alignItems: FlexAlign;
  alignContent: FlexAlign;
  gap: number;
}

interface IFlexItem {
  grow: number;
  shrink: number;
  basis: number | 'auto';
  alignSelf: FlexAlign;
}

interface ILayoutResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ISizeConstraint {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface IMargin {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface IPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
```

**Types**:
```typescript
type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
```

### Animation Data Types

```typescript
interface IAnimationState {
  currentTime: number;
  speed: number;
  isPlaying: boolean;
  loop: boolean;
  clipName?: string;
}

interface IAnimationClipRef {
  assetId: string;
}

interface ITimeline {
  tracks: ITimelineTrack[];
}

interface ITimelineTrack {
  target: string;  // Entity path
  property: string;
  keyframes: IKeyframe[];
}

interface IKeyframe {
  time: number;
  value: number | number[];
  interpolation: 'linear' | 'step' | 'cubic';
}

interface ITweenState {
  from: number | number[];
  to: number | number[];
  duration: number;
  elapsed: number;
  easing: EasingFunction;
}

type EasingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
```

### Data Component Types

```typescript
interface IName {
  value: string;
}

interface ITag {
  value: string;
}

interface ITags {
  values: string[];
}

interface IMetadata {
  data: Record<string, unknown>;
}

interface IDisabled {
  // Marker - no fields
}

interface IStatic {
  // Marker - no fields
}
```

---

## 📦 Resource Types

### Resource Enums

```typescript
enum ResourceType {
  Mesh = 'mesh',
  Texture = 'texture',
  Material = 'material',
  Shader = 'shader'
}

enum ResourceState {
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed',
  Released = 'released'
}
```

### Resource Interfaces

```typescript
interface IResourceHandle {
  id: string;
  type: ResourceType;
  uri: string;
}

interface IMeshResource {
  vertexBuffer: IRHIBuffer | null;
  indexBuffer: IRHIBuffer | null;
  indexCount: number;
  vertexCount: number;
  primitiveType: 'triangles' | 'lines' | 'points';
}

interface ITextureResource {
  texture: IRHITexture | null;
  width: number;
  height: number;
  hasMipmaps: boolean;
}

interface IMaterialResource {
  shaderId: string;
  properties: Record<string, unknown>;
  textures: Record<string, string>;
}

interface IResourceLoader<T> {
  load(uri: string, device: IRHIDevice): Promise<T>;
}
```

### RHI Interfaces (Minimal)

```typescript
interface IRHIDevice {
  // RHI device interface
  // Implementation provided by RHI package
}

interface IRHIBuffer {
  destroy(): void;
}

interface IRHITexture {
  destroy(): void;
}
```

---

## 🌍 Environment & Render Settings

### IEnvironmentData

```typescript
interface IEnvironmentData {
  skyboxType?: SkyboxType;
  skyboxTexture?: string;
  skyboxColor?: ColorLike;
  ambientColor?: ColorLike;
  ambientIntensity?: number;
  environmentMap?: string;
  fog?: IFogData;
}

type SkyboxType = 'color' | 'cubemap' | 'procedural' | 'hdri';

interface IFogData {
  enabled: boolean;
  type: 'linear' | 'exponential' | 'exponential2';
  color: ColorLike;
  density?: number;
  near?: number;
  far?: number;
}
```

### IRenderSettingsData

```typescript
interface IRenderSettingsData {
  antiAliasing?: 'none' | 'fxaa' | 'msaa' | 'taa';
  msaaSamples?: number;
  hdr?: boolean;
  toneMapping?: 'none' | 'aces' | 'reinhard' | 'filmic';
  exposure?: number;
  gamma?: number;
  shadows?: IShadowSettingsData;
}

interface IShadowSettingsData {
  enabled: boolean;
  resolution: number;
  distance: number;
  bias: number;
  softShadows?: boolean;
}
```

---

## 🎬 Animation Data (Scene Format)

### IAnimationKeyframe

```typescript
interface IAnimationKeyframe {
  time: number;
  value: number | number[];
  inTangent?: number | number[];
  outTangent?: number | number[];
  interpolation?: 'linear' | 'step' | 'bezier' | 'hermite';
}
```

### IAnimationCurve

```typescript
interface IAnimationCurve {
  name?: string;
  targetEntity: number;
  targetComponent: string;
  targetProperty: string;
  keyframes: IAnimationKeyframe[];
}
```

### IAnimationClipData

```typescript
interface IAnimationClipData {
  name: string;
  duration: number;
  curves: IAnimationCurve[];
  loop?: boolean;
  speed?: number;
}
```

### IStateMachineData

```typescript
interface IStateMachineData {
  name: string;
  states: IStateMachineState[];
  transitions: IStateMachineTransition[];
  parameters: IStateMachineParameter[];
}

interface IStateMachineState {
  name: string;
  clipName?: string;
  isDefault?: boolean;
  onEnter?: string;
  onExit?: string;
}

interface IStateMachineTransition {
  from: string;
  to: string;
  conditions?: ITransitionCondition[];
  duration?: number;
  hasExitTime?: boolean;
  exitTime?: number;
}

interface ITransitionCondition {
  parameter: string;
  operator: 'equals' | 'notEquals' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';
  value: number | boolean | string;
}

interface IStateMachineParameter {
  name: string;
  type: 'float' | 'int' | 'bool' | 'trigger';
  defaultValue: number | boolean;
}
```

---

## 📊 Asset References

### IAssetRefData

```typescript
interface IAssetRefData {
  id: string;
  type: SceneAssetType;
  uri: string;
  name?: string;
  preload?: boolean;
}

type SceneAssetType =
  | 'mesh'
  | 'texture'
  | 'material'
  | 'shader'
  | 'animation'
  | 'audio'
  | 'script'
  | 'custom';
```

**Purpose**: Declares external assets referenced by the scene.

---

## 🏷️ Component Type Registry

### ComponentTypeIds

```typescript
export const ComponentTypeIds = {
  // Transform
  LocalTransform: 'LocalTransform',
  WorldTransform: 'WorldTransform',
  Parent: 'Parent',
  Children: 'Children',

  // Data
  Name: 'Name',
  Tag: 'Tag',
  Tags: 'Tags',
  Disabled: 'Disabled',
  Static: 'Static',
  Metadata: 'Metadata',

  // Visual
  Visible: 'Visible',
  Layer: 'Layer',
  MeshRef: 'MeshRef',
  MaterialRef: 'MaterialRef',
  TextureRef: 'TextureRef',
  CastShadow: 'CastShadow',
  ReceiveShadow: 'ReceiveShadow',

  // Camera
  Camera: 'Camera',
  CameraTarget: 'CameraTarget',

  // Light
  DirectionalLight: 'DirectionalLight',
  PointLight: 'PointLight',
  SpotLight: 'SpotLight',
  AmbientLight: 'AmbientLight',

  // Animation
  AnimationState: 'AnimationState',
  AnimationClipRef: 'AnimationClipRef',
  Timeline: 'Timeline',
  TweenState: 'TweenState',

  // Layout
  Anchor: 'Anchor',
  FlexContainer: 'FlexContainer',
  FlexItem: 'FlexItem',
  LayoutResult: 'LayoutResult',
  SizeConstraint: 'SizeConstraint',
  Margin: 'Margin',
  Padding: 'Padding',
} as const;

export type ComponentTypeId = (typeof ComponentTypeIds)[keyof typeof ComponentTypeIds];
```

**Purpose**: String identifiers for serialization/deserialization.

---

## 🔧 Utility Types

### PartialDeep

```typescript
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};
```

**Purpose**: Make all properties optional recursively.

### RequiredExcept

```typescript
type RequiredExcept<T, K extends keyof T> = Partial<Pick<T, K>> & Required<Omit<T, K>>;
```

**Purpose**: Make all properties required except specified ones.

---

## 📐 Type Organization Rules

### 1. Location Priority

```
1. @maxellabs/specification (Cross-package)
   ↓
2. @maxellabs/core (Internal types)
   ↓
3. Application packages (App-specific)
```

### 2. When to Define in Specification

✅ **DO** define in specification:
- Cross-package interfaces
- Data serialization formats
- Component data interfaces
- Resource interfaces
- RHI interfaces

❌ **DON'T** define in specification:
- Implementation details
- Internal state types
- Package-specific utilities
- Concrete classes

### 3. When to Re-export

```typescript
// Core package re-exports for convenience
export type { Vector3Like, QuaternionLike } from '@maxellabs/specification';
export type { ICameraData, ILightData } from '@maxellabs/specification';
```

---

## 🎯 Usage Examples

### Scene Data Creation

```typescript
// Editor creates scene data
const sceneData: ISceneData = {
  version: { major: 1, minor: 0, patch: 0 },
  metadata: {
    name: 'MyScene',
    createdAt: new Date().toISOString()
  },
  entities: [
    {
      id: 1,
      name: 'Camera',
      components: [
        {
          type: 'Camera',
          data: {
            projectionType: 'perspective',
            fov: Math.PI / 3,
            near: 0.1,
            far: 1000,
            isMain: true
          }
        },
        {
          type: 'LocalTransform',
          data: {
            position: { x: 0, y: 5, z: 10 },
            rotation: { x: 0, y: 0, z: 0, w: 1 }
          }
        }
      ]
    },
    {
      id: 2,
      name: 'Cube',
      parent: 0,
      components: [
        {
          type: 'LocalTransform',
          data: {
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          }
        },
        {
          type: 'MeshRef',
          data: { assetId: 'cube-mesh' }
        },
        {
          type: 'MaterialRef',
          data: { assetId: 'default-material' }
        }
      ]
    }
  ],
  assets: [
    {
      id: 'cube-mesh',
      type: 'mesh',
      uri: 'models/cube.glb',
      preload: true
    },
    {
      id: 'default-material',
      type: 'material',
      uri: 'materials/default.json',
      preload: true
    }
  ]
};
```

### Component Data Usage

```typescript
// Camera component data
const cameraData: ICameraData = {
  projectionType: 'perspective',
  fov: Math.PI / 3,
  aspect: 16 / 9,
  near: 0.1,
  far: 1000,
  isMain: true,
  priority: 0,
  clearFlags: 'color',
  backgroundColor: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
  viewport: [0, 0, 1, 1],
  cullingMask: 0xffffffff
};

// Light component data
const directionalLight: IDirectionalLightData = {
  lightType: LightType.Directional,
  color: { r: 1, g: 1, b: 1, a: 1 },
  intensity: 1,
  castShadow: true,
  shadow: {
    enabled: true,
    type: 'soft',
    resolution: 1024,
    bias: 0.005,
    normalBias: 0.02,
    strength: 1,
    distance: 50,
    cascadeCount: 4
  },
  cullingMask: 0xffffffff
};

// Material reference
const materialRef: IMaterialRef = {
  assetId: 'pbr-material',
  overrides: {
    metallic: 0.5,
    roughness: 0.2
  },
  materialEnabled: true
};
```

---

## 🚫 Negative Constraints

### Interface Design

```typescript
// ❌ FORBIDDEN: Implementation in specification
interface ITransform {
  position: Vector3Like;
  calculateMatrix(): Matrix4Like {  // ❌ No implementation!
    // ...
  }
}

// ✅ CORRECT: Pure data interface
interface ITransform {
  position: Vector3Like;
  rotation?: QuaternionLike;
  scale?: Vector3Like;
  matrix?: Matrix4Like;
}
```

### Type Safety

```typescript
// ❌ FORBIDDEN: Any types
interface BadComponent {
  data: any;  // ❌ Too loose
}

// ✅ CORRECT: Specific types
interface GoodComponent {
  data: Record<string, unknown>;  // ✅ Type-safe
}
```

### Naming

```typescript
// ❌ FORBIDDEN: Inconsistent naming
interface ITransformData { ... }
interface CameraData { ... }  // Missing 'I'
interface ILight { ... }      // Missing 'Data'

// ✅ CORRECT: Consistent naming
interface ITransformData { ... }
interface ICameraData { ... }
interface ILightData { ... }
```

---

## ✅ Compliance Checklist

### Interface Design
- [ ] All interfaces prefixed with `I`
- [ ] All enums use PascalCase
- [ ] All types use PascalCase
- [ ] No implementation code
- [ ] No default values in interfaces
- [ ] Optional fields marked with `?`

### Type Safety
- [ ] No `any` types
- [ ] Use specific primitives (number, string, boolean)
- [ ] Use union types for flexibility
- [ ] Use enums for fixed sets
- [ ] Document complex types

### Organization
- [ ] Core types in `core/`
- [ ] Common types in `common/`
- [ ] Rendering types in `rendering/`
- [ ] Scene types in `core/scene.ts`
- [ ] Resource types in `core/resources.ts`

### Documentation
- [ ] JSDoc for all interfaces
- [ ] Purpose comments for complex types
- [ ] Usage examples in comments
- [ ] Cross-references between related types

---

## 📚 Related Documents

- **Component Architecture**: `architecture-components` - How interfaces are implemented
- **Scene Architecture**: `architecture-scene-systems` - Scene data usage
- **Resource Architecture**: `architecture-resources` - Resource interfaces
- **Constitution**: `constitution-core-runtime` - Type definition rules
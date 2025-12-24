---
id: "llmdoc-index"
type: "reference"
title: "Documentation Index"
description: "Complete navigation index for all LLM-friendly documentation in the Max runtime engine, organized by layer and priority"
tags: ["documentation", "navigation", "index", "llm-friendly", "constitution"]
context_dependency: []
related_ids: ["doc-standard", "constitution-core-runtime"]
---

## 🎯 Quick Start

**最近更新** (2025-12-24):
- ✅ **Scene 与 ResourceManager 集成完成** - Scene 现在拥有资源管理能力
  - 参见: `llmdoc/agent/strategy-scene-resource-integration.md`
  - 参见: `llmdoc/architecture/scene-systems.md` (Resource Management Integration)
  - 参见: `llmdoc/architecture/resources.md` (Scene Integration)

**First Read**: Start with the **Constitution** to understand all rules and constraints.

```
1. Read: llmdoc/reference/constitution.md (MANDATORY)
2. Reference: llmdoc/reference/data-models.md (Component specs)
3. Architecture: llmdoc/architecture/system-overview.md (System design)
4. Tech Stack: llmdoc/reference/tech-stack.md (Build tools)
5. Utilities: llmdoc/reference/shared-utilities.md (Common tools)
```

---

## 📚 Documentation Layers

### 🔥 **CRITICAL: Constitution Layer** (Read First)

**The absolute law - all code must comply**

| Document | ID | Purpose | Priority |
|----------|----|---------|----------|
| **Core Runtime Constitution** | `constitution-core-runtime` | Coordinate systems, precision standards, component design rules, forbidden patterns | **CRITICAL** |
| **LLM Documentation Standard** | `doc-standard` | How to write documentation (frontmatter, structure, patterns) | **CRITICAL** |

**Key Rules from Constitution:**
- ✅ **Type-First**: Interfaces defined before implementations
- ✅ **Deep Copy**: All objects/arrays use spread operator `{...obj}`, `[...arr]`
- ✅ **Null Safety**: All `fromData()` methods handle optional fields with `??` defaults
- ✅ **fromData() Pattern**: All components must implement `static fromData(data)`
- ✅ **clone() Pattern**: All components must implement `clone()` method
- 🚫 **NO** `any` types in component interfaces
- 🚫 **NO** shallow copies (reference sharing)
- 🚫 **NO** missing null checks
- 🚫 **NO** inconsistent naming (`fromData` vs `fromSpec`)

---

### 📋 **Reference Layer** (Specifications & Contracts)

**Type definitions, interfaces, and data models**

| Document | ID | Content | Use Case |
|----------|----|---------|----------|
| **Specification Package** | `ref-specification` | Complete @maxellabs/specification reference (interfaces, enums, types) | **Type Reference** |
| **Data Models & Components** | `data-models-core` | Complete ECS component implementations with interfaces (ITransform, IMeshRef, etc.) | **Component Reference** |
| **Shared Utilities** | `reference-shared-utilities` | BitSet, ObjectPool, SparseSet, Time, GLUtils, Std140Layout | **Utility Reference** |
| **Tech Stack** | `tech-stack-monorepo` | Build system (Rollup+SWC), testing (Jest), TypeScript config, PNPM workspace | **Build Reference** |

**Core Component Categories:**
- **Transform**: LocalTransform, WorldTransform, Parent, Children
- **Visual**: MeshRef, MaterialRef, TextureRef, Color, Visible, Layer, CastShadow, ReceiveShadow
- **Camera**: Camera, CameraTarget
- **Light**: DirectionalLight, PointLight, SpotLight, AmbientLight
- **Data**: Name, Tag, Tags, Metadata, Disabled, Static
- **Animation**: AnimationState, AnimationClipRef, Timeline, TweenState
- **Layout**: Anchor, FlexContainer, FlexItem, LayoutResult, SizeConstraint, Margin, Padding

---

### 🏗️ **Architecture Layer** (System Design)

**High-level system structure and data flow**

| Document | ID | Content | Use Case |
|----------|----|---------|----------|
| **System Overview** | `architecture-system-overview` | Monorepo structure, initialization flow, ECS architecture, API exposure, design patterns | **System Design** |
| **Core Architecture** | `arch-core-unified` | Core 包统一架构，统合 Engine/Effects/Charts/Design 四大应用的共享能力 | **Core 开发** |
| **Component Architecture** | `architecture-components` | Complete component system (Transform, Visual, Camera, Light, Layout, Animation, Data) with fromData() patterns | **Component Reference** |
| **Scene & Systems** | `architecture-scene-systems` | Scene class, ComponentRegistry, SystemScheduler, execution flow (CameraSystem, RenderSystem) | **System Design** |
| **Resource Management** | `architecture-resources` | ResourceManager, lifecycle, reference counting, loader system | **Resource Reference** |
| **Logic Systems** | `architecture-logic-systems` | System execution stages (FrameStart/Update/PostUpdate), dependencies, TransformSystem/LayoutSystem/AnimationSystem flow | **System Scheduling** |

**Key Architecture Patterns:**
1. **Specification-First**: Interface → Implementation → Factory
2. **Deep Copy & Reference Isolation**: Prevent shared references
3. **Null-Safe Field Handling**: Defensive fromData with defaults
4. **SoA Memory Layout**: Structure of Arrays for cache efficiency
5. **Unified fromData()**: All components use same pattern

---

### 📖 **Guides Layer** (Procedures & Standards)

**Step-by-step procedures and standards**

| Document | ID | Content | Use Case |
|----------|----|---------|----------|
| **Doc Standard** | `doc-standard` | LLM-Native documentation guidelines, frontmatter requirements, type-first structure | **Writing Docs** |

---

### 🧠 **Agent Strategy Layer** (Completed Plans)

**Strategic documentation for completed architectural decisions**

| Document | ID | Status | Content | Use Case |
|----------|----|----|---------|----------|
| **Scene-Resource Integration** | `strategy-scene-resource-integration` | ✅ Completed | Scene 与 ResourceManager 集成实施方案，包括 API 设计、生命周期管理、测试策略 | **Integration Reference** |
| **Scene Architecture Refactoring** | `strategy-scene-refactoring` | 🚧 Draft | Scene 类重构为模块化架构（EntityManager, HierarchyManager, EventBus, ResourceFacade, Serializer） | **Refactoring Reference** |

---

## 🌳 Navigation Tree

```
llmdoc/
├── index.md                          ← You are here
│
├── reference/                        ← Specifications & Contracts
│   ├── constitution.md               ← CRITICAL: Read first
│   ├── specification.md              ← @maxellabs/specification reference
│   ├── data-models-core.md           ← Component specs & implementations
│   ├── shared-utilities.md           ← Utility reference
│   └── tech-stack.md                 ← Build & tooling
│
├── architecture/                     ← System Design
│   ├── system-overview.md            ← High-level architecture
│   ├── core-architecture.md          ← Core package unified architecture
│   ├── components.md                 ← Component system reference
│   ├── scene-systems.md              ← Scene & system architecture
│   ├── resources.md                  ← Resource management
│   └── logic-systems.md              ← System execution stages & dependencies
│
├── agent/                            ← Strategic Memory
│   ├── strategy-scene-resource-integration.md  ← Scene + ResourceManager 集成 (✅ Completed)
│   └── strategy-scene-refactoring.md           ← Scene 重构策略 (🚧 Draft)
│
└── guides/                           ← Procedures
    └── doc-standard.md               ← Documentation standards
```

---

## 🔗 Cross-Reference Graph

**Dependencies (Must Read First → Later):**

```
constitution-core-runtime
    ↓ (defines rules for)
ref-specification
    ↓ (provides interfaces)
architecture-components
    ↓ (implements)
architecture-scene-systems
    ↓ (uses)
architecture-resources
    ↓ (provides)
tech-stack-monorepo
    ↓ (follows)
doc-standard
```

**Component Data Flow:**

```
Editor/JSON (ISceneData)
    ↓
Specification Interfaces (ICameraData, ILightData, etc.)
    ↓
Component.fromData() (Camera.fromData, DirectionalLight.fromData)
    ↓
Scene/World (addComponent, entity management)
    ↓
Systems (CameraSystem, RenderSystem, LayoutSystem)
    ↓
RHI Device (WebGL/WebGPU rendering)
```

**Type Definition Hierarchy:**

```
@maxellabs/specification (Source of Truth)
    ├─ Core interfaces (IDisposable, IReferable)
    ├─ Math types (Vector3Like, QuaternionLike)
    ├─ Component data (ICameraData, ILightData)
    ├─ Scene format (ISceneData, IEntityData)
    └─ Resource types (IMeshResource, ITextureResource)
         ↓
@maxellabs/core (Implementation)
    ├─ Components (Camera, DirectionalLight, etc.)
    ├─ Scene (Scene class)
    ├─ Systems (CameraSystem, RenderSystem)
    └─ Resources (ResourceManager)
         ↓
Application Packages (Usage)
    ├─ Engine (3D rendering)
    ├─ Effects (Animation/particles)
    ├─ Charts (Data visualization)
    └─ Design (UI tools)
```

---

## 🎯 Use Case Matrix

| Task | Primary Document | Secondary Documents |
|------|------------------|---------------------|
| **Implement new component** | `architecture-components` | `ref-specification`, `constitution-core-runtime` |
| **Understand ECS architecture** | `architecture-system-overview` | `architecture-scene-systems` |
| **Implement new System** | `architecture-scene-systems` | `architecture-logic-systems` |
| **UI Layout with Anchor/Flex** | `architecture-components` | `architecture-scene-systems` |
| **Add Camera/Light components** | `architecture-components` | `ref-specification` |
| **Build the project** | `tech-stack-monorepo` | - |
| **Write documentation** | `doc-standard` | `llmdoc/index.md` |
| **Debug component issues** | `constitution-core-runtime` | `architecture-components` |
| **Optimize performance** | `reference-shared-utilities` | `architecture-scene-systems` |
| **Add utility functions** | `reference-shared-utilities` | `doc-standard` |
| **Load scene from JSON** | `architecture-scene-systems` | `ref-specification` |
| **Manage GPU resources** | `architecture-resources` | `architecture-scene-systems` |
| **Create custom loaders** | `architecture-resources` | `ref-specification` |
| **Integrate Scene + Resources** | `strategy-scene-resource-integration` | `architecture-scene-systems`, `architecture-resources` |

---

## ✅ Compliance Checklist

Before writing code or documentation, verify:

**For Code:**
- [ ] Read `constitution-core-runtime` for relevant rules
- [ ] Check `ref-specification` for existing interfaces
- [ ] Check `architecture-components` for existing patterns
- [ ] Implement `fromData()` with `Partial<T>` parameter
- [ ] Use deep copy: `{...obj}`, `[...arr]`
- [ ] Add null checks with `??` defaults
- [ ] Implement `clone()` method
- [ ] Mark `dirty` flag on changes
- [ ] No `any` types
- [ ] No shallow copies
- [ ] Follow `fromData()` pattern consistently

**For Documentation:**
- [ ] Read `doc-standard` for format requirements
- [ ] Add YAML frontmatter (id, type, title, description, tags)
- [ ] Use Type-First structure (interfaces before logic)
- [ ] Use pseudocode instead of prose
- [ ] List Negative Constraints
- [ ] Include cross-references (related_ids)
- [ ] Update `llmdoc/index.md` if adding new docs

---

## ⚠️ Negative Constraints Summary

### Absolute Forbiddens (From Constitution)
1. **NO** `any` type in component interfaces
2. **NO** shallow copies in fromData/clone methods
3. **NO** missing null checks for optional fields
4. **NO** column-major matrix naming (use row-major)
5. **NO** inconsistent method naming (fromData only)
6. **NO** shared references between instances
7. **NO** hardcoded precision values (use constants)
8. **NO** ignored parameters in fromData
9. **NO** mutable default configurations
10. **NO** documentation without JSDoc for public methods
11. **NO** `fromSpec()` method (use `fromData()` only)
12. **NO** empty fromData for marker components (use simplified version)

### Component Architecture (From Components Doc)
1. **NO** components without `fromData()` static method
2. **NO** `fromData()` without `Partial<T>` parameter
3. **NO** missing deep copy for nested objects
4. **NO** missing default values for required fields
5. **NO** components that don't extend Component base
6. **NO** inconsistent interface implementation

### Scene & Systems (From Scene-Systems Doc)
1. **NO** Scene directly manipulating RHI (delegate to systems)
2. **NO** circular dependencies between systems
3. **NO** systems without metadata
4. **NO** systems without proper stage/priority
5. **NO** missing ComponentRegistry registration

### Resource Management (From Resources Doc)
1. **NO** resources without reference counting
2. **NO** missing error handling in loaders
3. **NO** GPU resources without proper cleanup
4. **NO** concurrent loads without promise sharing

### Documentation Standards (From Doc Standard)
1. **NO** missing YAML frontmatter
2. **NO** prose without type definitions
3. **NO** "In this document we will..." fluff
4. **NO** relative file paths in documentation
5. **NO** audience/read_time fields (use id/type)
6. **NO** documentation without cross-references

---

## 🚀 Next Steps

1. **New to the project?** → Start with `constitution-core-runtime`
2. **Understanding architecture?** → Read `architecture-core-unified` then `architecture-components`
3. **Building components?** → Follow `architecture-components` patterns
4. **Implementing Scene/Systems?** → Read `architecture-scene-systems`
5. **Managing resources?** → Check `architecture-resources`
6. **Working with types?** → Reference `ref-specification`
7. **Writing docs?** → Follow `doc-standard` strictly
8. **Optimizing?** → Review `reference-shared-utilities`

---

## 📞 Contact & Support

All documentation follows the **LLM-Friendly Standard**:
- Machine-readable (RAG optimized)
- Token-efficient
- Hallucination-resistant
- Type-first structure
- Negative constraints explicit

**Remember**: This documentation is the source of truth. Code must comply.
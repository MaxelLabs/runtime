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
| **Data Models & Components** | `data-models-core` | Complete ECS component implementations with interfaces (ITransform, IMeshRef, etc.) | **Component Reference** |
| **Shared Utilities** | `reference-shared-utilities` | BitSet, ObjectPool, SparseSet, Time, GLUtils, Std140Layout | **Utility Reference** |
| **Tech Stack** | `tech-stack-monorepo` | Build system (Rollup+SWC), testing (Jest), TypeScript config, PNPM workspace | **Build Reference** |

**Core Component Categories:**
- **Transform**: LocalTransform, WorldTransform, Parent, Children
- **Visual**: MeshRef, MaterialRef, TextureRef, Color, Visible, Layer, CastShadow, ReceiveShadow
- **Data**: Name, Tag, Tags, Metadata, Disabled, Static
- **Physics**: Velocity, Acceleration, AngularVelocity, Mass, Gravity, Damping
- **Animation**: AnimationState, AnimationClipRef, Timeline, TweenState

---

### 🏗️ **Architecture Layer** (System Design)

**High-level system structure and data flow**

| Document | ID | Content | Use Case |
|----------|----|---------|----------|
| **System Overview** | `architecture-system-overview` | Monorepo structure, initialization flow, ECS architecture, API exposure, design patterns | **System Design** |

**Key Architecture Patterns:**
1. **Specification-First**: Interface → Implementation → Factory
2. **Deep Copy & Reference Isolation**: Prevent shared references
3. **Null-Safe Field Handling**: Defensive fromData with defaults
4. **SoA Memory Layout**: Structure of Arrays for cache efficiency

---

### 📖 **Guides Layer** (Procedures & Standards)

**Step-by-step procedures and standards**

| Document | ID | Content | Use Case |
|----------|----|---------|----------|
| **Doc Standard** | `doc-standard` | LLM-Native documentation guidelines, frontmatter requirements, type-first structure | **Writing Docs** |

---

## 🌳 Navigation Tree

```
llmdoc/
├── index.md                          ← You are here
│
├── reference/                        ← Specifications & Contracts
│   ├── constitution.md               ← CRITICAL: Read first
│   ├── data-models-core.md           ← Component specs & implementations
│   ├── shared-utilities.md           ← Utility reference
│   └── tech-stack.md                 ← Build & tooling
│
├── architecture/                     ← System Design
│   └── system-overview.md            ← High-level architecture
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
data-models-core
    ↓ (implements)
architecture-system-overview
    ↓ (uses)
tech-stack-monorepo
    ↓ (provides)
reference-shared-utilities
    ↓ (follows)
doc-standard
```

**Related Component Flows:**

```
Specification Interface (ITransform)
    ↓
Data Models & Components (LocalTransform.fromData)
    ↓
Architecture (World.addComponent)
    ↓
Utilities (ObjectPool, SparseSet for optimization)
```

---

## 🎯 Use Case Matrix

| Task | Primary Document | Secondary Documents |
|------|------------------|---------------------|
| **Implement new component** | `data-models-core` | `constitution-core-runtime` |
| **Understand ECS architecture** | `architecture-system-overview` | `data-models-core` |
| **Build the project** | `tech-stack-monorepo` | - |
| **Write documentation** | `doc-standard` | `llmdoc/index.md` |
| **Debug component issues** | `constitution-core-runtime` | `data-models-core` |
| **Optimize performance** | `reference-shared-utilities` | `architecture-system-overview` |
| **Add utility functions** | `reference-shared-utilities` | `doc-standard` |

---

## ✅ Compliance Checklist

Before writing code or documentation, verify:

**For Code:**
- [ ] Read `constitution-core-runtime` for relevant rules
- [ ] Check `data-models-core` for existing patterns
- [ ] Implement `fromData()` with proper typing
- [ ] Use deep copy: `{...obj}`, `[...arr]`
- [ ] Add null checks with `??` defaults
- [ ] Implement `clone()` method
- [ ] Mark `dirty` flag on changes
- [ ] No `any` types
- [ ] No shallow copies

**For Documentation:**
- [ ] Read `doc-standard` for format requirements
- [ ] Add YAML frontmatter (id, type, title, description, tags)
- [ ] Use Type-First structure (interfaces before logic)
- [ ] Use pseudocode instead of prose
- [ ] List Negative Constraints
- [ ] Include cross-references (related_ids)

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

### Documentation Standards (From Doc Standard)
1. **NO** missing YAML frontmatter
2. **NO** prose without type definitions
3. **NO** "In this document we will..." fluff
4. **NO** relative file paths in documentation
5. **NO** audience/read_time fields (use id/type)

---

## 🚀 Next Steps

1. **New to the project?** → Start with `constitution-core-runtime`
2. **Building components?** → Check `data-models-core` for patterns
3. **Writing docs?** → Follow `doc-standard` strictly
4. **Optimizing?** → Review `reference-shared-utilities`
5. **System design?** → Read `architecture-system-overview`

---

## 📞 Contact & Support

All documentation follows the **LLM-Friendly Standard**:
- Machine-readable (RAG optimized)
- Token-efficient
- Hallucination-resistant
- Type-first structure
- Negative constraints explicit

**Remember**: This documentation is the source of truth. Code must comply.
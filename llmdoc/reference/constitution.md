---
id: "constitution-core-runtime"
type: "reference"
title: "Core Runtime Constitution"
description: "Constitutional rules for coordinate systems, precision standards, component design, and forbidden patterns in the runtime engine"
tags: ["constitution", "coordinate-system", "precision", "component-pattern", "typescript", "error-handling"]
context_dependency: []
related_ids: ["doc-standard", "architecture-ecs"]
---

## 🎯 Context & Goal

### Context
This document defines the **Constitutional Standard** for the runtime engine. All code MUST adhere to these rules. Violations are forbidden.

### Goal
Enforce consistency in coordinate systems, precision handling, component architecture, and error management across the entire codebase.

---

## 🔌 Type Definitions

### Coordinate System
```typescript
enum CoordinateSystem {
  LeftHanded = 0,  // X=Right, Y=Up, Z=Forward
  RightHanded = 1  // X=Right, Y=Up, Z=Backward
}
```

### Precision Configuration
```typescript
interface PrecisionConfig {
  epsilon: number;      // 1e-6 (default) - User-facing comparisons
  internal: number;     // 1e-10 - Internal algorithmic precision
}
```

### Component Interface
```typescript
interface ComponentSpecification<TData> {
  id: string;
  type: string;
  data: TData;
}

interface Component {
  id: string;
  type: string;
  dirty: boolean;
  fromData(data: any): this;
  clone(): this;
}
```

---

## 📐 Coordinate Systems & Matrix Conventions

### Matrix Storage
**Rule**: Row-major naming convention for all matrix elements.

```typescript
// CORRECT: Row-major naming
interface Matrix4 {
  m00: number; m01: number; m02: number; m03: number;
  m10: number; m11: number; m12: number; m13: number;
  m20: number; m21: number; m22: number; m23: number;
  m30: number; m31: number; m32: number; m33: number;
}

// WRONG: Column-major naming
interface Matrix4Wrong {
  m00: number; m10: number; m20: number; m30: number;  // ❌ Forbidden
}
```

### Coordinate System Default
**Rule**: All transforms default to LeftHanded (0).

```typescript
// Default transform values
const DEFAULT_TRANSFORM = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },  // Quaternion identity
  scale: { x: 1, y: 1, z: 1 },
  space: CoordinateSystem.LeftHanded  // Default
};
```

---

## ⚙️ Precision & Epsilon Standards

### Comparison Thresholds
```typescript
// User-facing comparisons (loose)
const EPSILON = 1e-6;

// Internal algorithms (strict)
const NUMBER_EPSILON = 1e-10;

// Usage examples
function equals(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;  // User tolerance
}

function strictEquals(a: number, b: number): boolean {
  return Math.abs(a - b) < NUMBER_EPSILON;  // Internal precision
}
```

### Configuration
**Rule**: Precision MUST be configurable but defaults must be immutable.

```typescript
interface EngineConfig {
  precision: {
    epsilon: 1e-6,
    internal: 1e-10
  },
  coordinateSystem: CoordinateSystem.LeftHanded
}
```

---

## 🧩 Component Design Rules

### fromData() Method Standard
**Rule**: All components MUST implement fromData() with strict type safety.

```typescript
class ComponentName implements Component {
  id: string;
  type: string;
  dirty: boolean = false;

  // ✅ CORRECT: Full interface, deep copy, null checks
  static fromData(data: Partial<ComponentNameData>): ComponentName {
    const instance = new ComponentName();

    // Required fields with defaults
    instance.id = data.id ?? generateId();
    instance.type = data.type ?? 'component-name';

    // Deep copy for objects
    if (data.position) {
      instance.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0
      };
    }

    // Handle optional fields
    if (data.space !== undefined) {
      instance.space = data.space;
    }

    return instance;
  }

  clone(): this {
    // Deep clone implementation
    return ComponentName.fromData({ ...this }) as this;
  }
}
```

### Deep Copy Requirements
**Rule**: All object references MUST be deep copied in fromData() and clone().

```typescript
// ✅ CORRECT: Deep copy all nested objects
class TextureRef {
  transform: {
    scale: { x: number; y: number };
    offset: { x: number; y: number };
    rotation: number;  // Not an object, direct assignment OK
  };

  static fromData(data: TextureRefData): TextureRef {
    const ref = new TextureRef();
    ref.transform = {
      scale: { ...data.transform.scale },
      offset: { ...data.transform.offset },
      rotation: data.transform.rotation  // Direct copy for primitives
    };
    return ref;
  }
}

// ❌ WRONG: Shallow copy
ref.transform = data.transform;  // Shared reference!
```

### Dirty Flag Management
**Rule**: Components MUST mark dirty when data changes.

```typescript
class TransformComponent {
  private _position: Vector3;

  set position(value: Vector3) {
    this._position = value;
    this.dirty = true;  // ✅ Always mark dirty
  }
}
```

---

## 🚫 Forbidden Patterns

### 1. Type Safety Violations
```typescript
// ❌ FORBIDDEN: Non-strict parameter types
fromData(data: any) { }  // ❌ No 'any'

// ✅ REQUIRED: Strict typing
fromData(data: Partial<ITransform>) { }
```

### 2. Missing Null Checks
```typescript
// ❌ FORBIDDEN: Direct property access without checks
fromData(data: ITransform) {
  this.x = data.position.x;  // ❌ Crashes if data.position is null
}

// ✅ REQUIRED: Safe access
fromData(data: Partial<ITransform>) {
  this.x = data.position?.x ?? 0;
}
```

### 3. Reference Sharing
```typescript
// ❌ FORBIDDEN: Shared references
clone() {
  return this;  // ❌ Returns same instance
}

// ✅ REQUIRED: New instance
clone() {
  return Component.fromData({ ...this });
}
```

### 4. Inconsistent Naming
```typescript
// ❌ FORBIDDEN: Mixed naming conventions
fromData() { }
fromSpec() { }  // ❌ Inconsistent

// ✅ REQUIRED: Unified naming
fromData() { }
```

### 5. Redundant Implementations
```typescript
// ❌ FORBIDDEN: Empty fromData for marker interfaces
fromData(_data: IStatic) { }  // ❌ Ignored parameter

// ✅ REQUIRED: Simplified or factory pattern
static fromData(): Static {
  return new Static();
}
```

---

## 🔧 Import/Export Conventions

### Type Consolidation
**Rule**: Centralize type exports to reduce duplication.

```typescript
// ✅ CORRECT: Single source of truth
// packages/core/src/components/index.ts
export * from './transform/types';
export * from './visual/types';
export * from './animation/types';

// Usage
import { Vector3Like, QuaternionLike } from '@max/core/components';
```

### Module Resolution
```typescript
// tsconfig.json compliance
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

---

## ⚠️ Error Handling Standards

### Validation Layers
```typescript
// Layer 1: Type validation (compile-time)
interface ITransform {
  position: Vector3Like;
  rotation?: QuaternionLike;
  scale?: Vector3Like;
  space?: CoordinateSystem;
}

// Layer 2: Runtime validation
function validateTransform(data: Partial<ITransform>): boolean {
  return (
    data.position !== undefined &&
    typeof data.position.x === 'number' &&
    typeof data.position.y === 'number' &&
    typeof data.position.z === 'number'
  );
}

// Layer 3: Error reporting
class ComponentError extends Error {
  constructor(
    public component: string,
    public data: any,
    message: string
  ) {
    super(`[${component}] ${message}`);
  }
}
```

---

## 📋 Testing Requirements

### Mandatory Test Categories
```typescript
// 1. Boundary conditions
describe('Boundary Conditions', () => {
  test('null/undefined inputs', () => { });
  test('empty objects', () => { });
  test('extreme values', () => { });
});

// 2. Reference independence
describe('Reference Independence', () => {
  test('deep copy verification', () => {
    const original = Component.fromData(data);
    const clone = original.clone();
    clone.data.value = 999;
    expect(original.data.value).not.toBe(999);  // ✅ Must pass
  });
});

// 3. Type compatibility
describe('Type Compatibility', () => {
  test('interface implementation', () => { });
  test('partial data handling', () => { });
});
```

---

## 🎓 Documentation Standards

### JSDoc Requirements
```typescript
/**
 * Transform component for 3D spatial representation.
 *
 * @param {Partial<ITransform>} data - Partial transform data
 * @param {Vector3Like} data.position - Position vector (default: 0,0,0)
 * @param {QuaternionLike} data.rotation - Rotation quaternion (default: 0,0,0,1)
 * @param {Vector3Like} data.scale - Scale vector (default: 1,1,1)
 * @param {CoordinateSystem} data.space - Coordinate space (default: LeftHanded)
 * @returns {TransformComponent} New component instance
 *
 * @throws {ComponentError} If required position data is invalid
 *
 * @example
 * const transform = TransformComponent.fromData({
 *   position: { x: 10, y: 5, z: 0 }
 * });
 */
static fromData(data: Partial<ITransform>): TransformComponent {
  // Implementation
}
```

---

## 🚫 Negative Constraints Summary

### Absolute Forbiddens
1. **NO** `any` type in component interfaces
2. **NO** shallow copies in fromData/clone methods
3. **NO** missing null checks for optional fields
4. **NO** column-major matrix naming
5. **NO** inconsistent method naming (fromData vs fromSpec)
6. **NO** shared references between instances
7. **NO** hardcoded precision values (use constants)
8. **NO** ignored parameters in fromData
9. **NO** mutable default configurations
10. **NO** documentation without JSDoc for public methods

### Code Quality
- **NO** console.log in production code
- **NO** magic numbers (use named constants)
- **NO** complex logic in fromData (keep it simple)
- **NO** circular dependencies in component imports

---

## 🎯 Compliance Checklist

Before committing code, verify:

- [ ] All components implement fromData() with proper typing
- [ ] All object references are deep copied
- [ ] All optional fields have null checks with defaults
- [ ] Coordinate system uses LeftHanded default
- [ ] Matrix naming follows row-major convention
- [ ] Precision constants are used (not hardcoded)
- [ ] Dirty flags are set on data changes
- [ ] Types are centralized in index.ts
- [ ] JSDoc exists for all public methods
- [ ] Tests cover boundaries, references, and types
- [ ] No `any` types in component interfaces
- [ ] No shallow copy patterns
- [ ] No missing null checks

This constitution is **immutable**. All code must comply.
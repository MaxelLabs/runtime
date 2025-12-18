---
id: "core-hierarchy-utils"
type: "reference"
title: "Hierarchy Utils - Common Hierarchy Operations"
description: "Generic utility functions for hierarchy operations including circular reference detection, ancestor checking, and common ancestor finding."
context_dependency: []
related_ids: ["core-entity", "core-transform-component", "core-object-pool"]
---

## 🔌 Interface First

### Node Interface
```typescript
interface HierarchyNode<T> {
  /** Get parent node */
  getParent(): T | null;
}
```

### Core Utility Functions
```typescript
// Circular reference detection
function checkCircularReference<T>(
  node: T,
  potentialAncestor: T,
  getParent: (node: T) => T | null
): boolean;

// Ancestor checking
function isAncestorOf<T>(
  potentialAncestor: T,
  node: T,
  getParent: (node: T) => T | null
): boolean;

// Get all ancestors
function getAncestors<T>(
  node: T,
  getParent: (node: T) => T | null
): T[];

// Get hierarchy depth
function getHierarchyDepth<T>(
  node: T,
  getParent: (node: T) => T | null
): number;

// Find common ancestor
function findCommonAncestor<T>(
  nodeA: T,
  nodeB: T,
  getParent: (node: T) => T | null
): T | null;
```

## ⚙️ Implementation Logic

### Pseudocode: Circular Reference Detection
```typescript
FUNCTION checkCircularReference(node, potentialAncestor, getParent):
  // Direct self-reference
  IF node === potentialAncestor:
    RETURN true

  // Traverse potentialAncestor's ancestry
  current = getParent(potentialAncestor)

  WHILE current !== null:
    IF current === node:
      RETURN true
    current = getParent(current)

  RETURN false
```

### Pseudocode: Ancestor Checking
```typescript
FUNCTION isAncestorOf(potentialAncestor, node, getParent):
  current = getParent(node)

  WHILE current !== null:
    IF current === potentialAncestor:
      RETURN true
    current = getParent(current)

  RETURN false
```

### Pseudocode: Get All Ancestors
```typescript
FUNCTION getAncestors(node, getParent):
  ancestors = []
  current = getParent(node)

  WHILE current !== null:
    ancestors.push(current)
    current = getParent(current)

  RETURN ancestors  // [directParent, ..., root]
```

### Pseudocode: Hierarchy Depth
```typescript
FUNCTION getHierarchyDepth(node, getParent):
  depth = 0
  current = getParent(node)

  WHILE current !== null:
    depth++
    current = getParent(current)

  RETURN depth  // Root = 0, DirectChild = 1, etc.
```

### Pseudocode: Common Ancestor
```typescript
FUNCTION findCommonAncestor(nodeA, nodeB, getParent):
  // Collect all ancestors of A (including A)
  ancestorsA = new Set()
  ancestorsA.add(nodeA)
  current = getParent(nodeA)

  WHILE current !== null:
    ancestorsA.add(current)
    current = getParent(current)

  // Check if B is in A's ancestry
  IF ancestorsA.has(nodeB):
    RETURN nodeB

  // Traverse B's ancestry
  current = getParent(nodeB)

  WHILE current !== null:
    IF ancestorsA.has(current):
      RETURN current
    current = getParent(current)

  RETURN null
```

## 📚 Usage Examples

### Basic Circular Reference Check
```typescript
import { checkCircularReference } from '@maxellabs/core';

class TreeNode {
  private parent: TreeNode | null = null;

  constructor(public name: string) {}

  getParent(): TreeNode | null {
    return this.parent;
  }

  setParent(newParent: TreeNode | null): void {
    if (newParent && checkCircularReference(this, newParent, (n) => ngetParent())) {
      console.error(`Cannot set ${newParent.name} as parent of ${this.name}: circular reference`);
      return;
    }
    this.parent = newParent;
  }
}

// Usage
const root = new TreeNode('Root');
const child = new TreeNode('Child');

child.setParent(root);  // OK
root.setParent(child);  // Error detected!
```

### Entity Hierarchy Validation
```typescript
import { checkCircularReference } from '@maxellabs/core';

class Entity {
  private parent: Entity|null = null;

  constructor(public name: string) {}

  getParent(): Entity|null {
    return this.parent;
  }

  setParent(parent: Entity|null): void {
    if (parent && checkCircularReference(this, parent, (e) => e.parent)) {
      console.error(`Cycle detected: cannot set ${parent.name} as parent of ${this.name}`);
      return;
    }
    this.parent = parent;
  }
}

// Verify ancestors
const grandparent = new Entity('Grandparent');
const parent = new Entity('Parent');
const child = new Entity('Child');

parent.setParent(grandparent);
child.setParent(parent);

console.log(isAncestorOf(grandparent, child, (e) => e.getParent())); // true
console.log(getAncestors(child, (e) => e.getParent())); // [parent, grandparent]
console.log(getHierarchyDepth(child, (e) => e.getParent())); // 2
```

### Find Common Ancestor in Scene Graph
```typescript
import { findCommonAncestor } from '@maxellabs/core';

class SceneNode {
  constructor(
    public name: string,
    private parent: SceneNode | null = null
  ) {}

  getParent(): SceneNode | null {
    return this.parent;
  }
}

// Complex hierarchy
//        Root
//       /    \
//      A      B
//     / \    / \
//    C   D  E   F

const root = new SceneNode('Root');
const a = new SceneNode('A', root);
const b = new SceneNode('B', root);
const c = new SceneNode('C', a);
const d = new SceneNode('D', a);
const e = new SceneNode('E', b);
const f = new SceneNode('F', b);

// Find common ancestors
console.log(findCommonAncestor(c, d, (n) => n.getParent())?.name); // 'A'
console.log(findCommonAncestor(c, e, (n) => n.getParent())?.name); // 'Root'
console.log(findCommonAncestor(a, b, (n) => n.getParent())?.name); // 'Root'
console.log(findCommonAncestor(c, f, (n) => n.getParent())?.name); // 'Root'
```

### Hierarchy Analysis
```typescript
import {
  getAncestors,
  getHierarchyDepth,
  isAncestorOf
} from '@maxellabs/core';

type NodeWithParent = {
  name: string;
  parent?: NodeWithParent;
  getParent(): NodeWithParent | null;
};

function analyzeHierarchy(node: NodeWithParent): string {
  const depth = getHierarchyDepth(node, (n) => n.getParent());
  const ancestors = getAncestors(node, (n) => n.getParent());

  return `${node.name} (depth: ${depth}, ancestors: ${ancestors.map(a => a.name).join(' > ') || 'none'})`;
}

// Usage
const root = { name: 'Root', getParent() { return null; } };
const child = { name: 'Child', parent: root, getParent() { return this.parent; } };
const grandchild = { name: 'Grandchild', parent: child, getParent() { return this.parent; } };

console.log(analyzeHierarchy(grandchild));
// Output: "Grandchild (depth: 2, ancestors: Child > Root)"
```

### Transform Hierarchy Validation
```typescript
import { checkCircularReference, isAncestorOf } from '@maxellabs/core';

class Transform {
  private parent: Transform | null = null;
  private children: Transform[] = [];

  setParent(newParent: Transform | null): void {
    // Check for cycles
    if (newParent && checkCircularReference(this, newParent, (t) => t.parent)) {
      console.error('Transform would create circular reference!');
      return;
    }

    // Remove from old parent
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index > -1) this.parent.children.splice(index, 1);
    }

    // Add to new parent
    this.parent = newParent;
    if (newParent) newParent.children.push(this);
  }

  getParent(): Transform | null {
    return this.parent;
  }

  isDescendantOf(other: Transform): boolean {
    return isAncestorOf(other, this, (t) => t.parent);
  }
}

// Usage
const parent = new Transform();
const child = new Transform();
const grandchild = new Transform();

child.setParent(parent);
grandchild.setParent(child);

console.log(child.isDescendantOf(parent)); // true
console.log(grandchild.isDescendantOf(parent)); // true
console.log(parent.isDescendantOf(child)); // false
```

### Getting Root and Finding Path
```typescript
import { getAncestors } from '@maxellabs/core';

interface HierarchicalNode {
  id: string;
  getParent(): HierarchicalNode | null;
}

function getRoot<T extends HierarchicalNode>(node: T): T {
  let current: T = node;
  let parent: T | null;

  while ((parent = current.getParent() as T | null)) {
    current = parent;
  }

  return current;
}

function getPath<T extends HierarchicalNode>(node: T): string[] {
  const ancestors = getAncestors(node, (n) => n.getParent());
  return [node.id, ...ancestors.map(a => a.id)].reverse();
}

// Usage
const nodes = [
  { id: 'root', getParent() { return null; } },
  { id: 'a', getParent() { return nodes[0]; } },
  { id: 'b', getParent() { return nodes[1]; } },
  { id: 'c', getParent() { return nodes[2]; } }
];

console.log(getRoot(nodes[3]).id); // 'root'
console.log(getPath(nodes[3])); // ['root', 'a', 'b', 'c']
```

### Deprecated Path Detection
```typescript
import { getHierarchyDepth } from '@maxellabs/core';

interface Node {
  parent: Node | null;
  getParent(): Node | null;
}

function validateHierarchyDepth<T extends Node>(root: T, maxDepth: number = 1000): void {
  function checkDepth(node: T, depth: number = 0): void {
    if (depth > maxDepth) {
      console.warn(`Hierarchy depth exceeded at ${depth} (max: ${maxDepth})`);
      return;
    }

    const children = node.parent ? [node.parent] : [];
    children.forEach(child => checkDepth(child as T, depth + 1));
  }

}

// Usage in Transform
const MAX_HIERARCHY_DEPTH = 1000;

function onTransformChanged(node: Transform, depth: number = 0): void {
  if (depth >= MAX_HIERARCHY_DEPTH) {
    console.warn(`Transform hierarchy too deep: ${depth}`);
    return;
  }

  for (const child of node.children) {
    child.worldMatrixDirty = true;
    onTransformChanged(child, depth + 1);
  }
}
```

### Utility Function Composition
```typescript
import {
  checkCircularReference,
  getAncestors,
  isAncestorOf,
  getHierarchyDepth,
  findCommonAncestor
} from '@maxellabs/core';

// Build reusable validation helpers
class HierarchyValidator<T> {
  constructor(private getParent: (node: T) => T | null) {}

  canSetParent(node: T, parent: T): boolean {
    return !checkCircularReference(node, parent, this.getParent);
  }

  getDepth(node: T): number {
    return getHierarchyDepth(node, this.getParent);
  }

  isRoot(node: T): boolean {
    return this.getParent(node) === null;
  }

  getAncestors(node: T): T[] {
    return getAncestors(node, this.getParent);
  }

  findDistance(nodeA: T, nodeB: T): number | null {
    const common = findCommonAncestor(nodeA, nodeB, this.getParent);
    if (!common) return null;

    return this.getDepth(nodeA) + this.getDepth(nodeB) - 2 * this.getDepth(common);
  }
}

// Usage
type Entity = { id: string; parent?: Entity };
const validator = new HierarchyValidator<Entity>((e) => e.parent || null);

const entities = [
  { id: 'root' },
  { id: 'child', parent: undefined as Entity | undefined }
];

entities[1].parent = entities[0];

console.log(validator.canSetParent(entities[1], entities[0])); // false (would cycle)
console.log(validator.getDepth(entities[1])); // 1
console.log(validator.isRoot(entities[0])); // true
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** modify the hierarchy during traversal
- 🚫 **DO NOT** use these utilities without bounds checking on recursion depth
- 🚫 **DO NOT** assume parent functions are O(1) - could be O(n) for some implementations
- 🚫 **DO NOT** mutate the nodes passed to these functions

### Common Mistakes
```typescript
// ❌ WRONG: Modifying hierarchy during check
function badExample(node: Node, parent: Node) {
  // Setting parent during circular check
  if (!checkCircularReference(node, parent, (n) => n.parent)) {
    node.parent = parent; // Side effect during check!
  }
}

// ✅ CORRECT: Check first, modify after
function goodExample(node: Node, parent: Node) {
  const wouldCycle = checkCircularReference(node, parent, (n) => n.parent);
  if (wouldCycle) {
    throw new Error('Circular reference detected');
  }
  // Safe to modify now
  node.parent = parent;
}
```

```typescript
// ❌ WRONG: Unbounded depth destroying stack
function flameStack(node: Node) {
  if (node.parent) {
    return 1 + flameStack(node.parent); // Can blow stack on deep trees
  }
  return 1;
}

// ✅ CORRECT: Use utility function
const depth = getHierarchyDepth(node, (n) => n.parent); // Iterative internally
```

```typescript
// ❌ WRONG: Assuming O(1) parent access
function slowGetDepth(node: Node) {
  let depth = 0;
  let current = node.parent;
  while (current) {
    // If getParent() does expensive work, this becomes expensive
    current = current.getParent(); // O(n) for some implementations!
    depth++;
  }
  return depth;
}

// ✅ CORRECT: Use provided utility
const depth = getHierarchyDepth(node, (n) => n.getParent());
```

## 📊 Performance Analysis

### Function Complexity

| Function | Time Complexity | Space Complexity | Notes |
|----------|----------------|------------------|-------|
| `checkCircularReference` | O(d) | O(1) | d = depth of potentialAncestor |
| `isAncestorOf` | O(d) | O(1) | d = depth of node |
| `getAncestors` | O(d) | O(d) | d = depth of node |
| `getHierarchyDepth` | O(d) | O(1) | d = depth of node |
| `findCommonAncestor` | O(d1 + d2) | O(d1) | d1, d2 = depths of nodes |

### Memory Usage
```
Simple nodes (depth < 10):
  - checkCircularReference: ~50 bytes function call overhead
  - getAncestors: ~8 * depth bytes for result array

Deep hierarchy (depth = 100):
  - getAncestors: ~800 bytes array allocation
  - findCommonAncestor: ~800 bytes Set + iterations
```

### Optimization Strategies
1. **Caching**: For frequently accessed hierarchy properties, consider caching
2. **Batch Operations**: Process multiple nodes in single traversal when possible
3. **Early Exit**: `checkCircularReference` returns early on first match

## 🔗 Integration Patterns

### With Entity System
```typescript
// Entity.ts
import { checkCircularReference } from '@maxellabs/core';

class Entity {
  private parent: Entity | null = null;
  private children: Entity[] = [];

  setParent(parent: Entity | null): this {
    if (parent && checkCircularReference(this, parent, (e) => e.parent)) {
      console.error('Cycle detected in parent assignment');
      return this;
    }

    // Rest of implementation...
    return this;
  }
}
```

### With Transform System
```typescript
// Transform.ts
import { checkCircularReference, getHierarchyDepth } from '@maxellabs/core';

class Transform {
  private parent: Transform | null = null;

  setParent(parent: Transform | null): void {
    if (parent && checkCircularReference(this, parent, (t) => t.parent)) {
      console.error('Circular reference in transform hierarchy');
      return;
    }

    const depth = getHierarchyDepth(parent, (t) => t.parent);
    if (depth > 1000) {
      console.warn('Transform hierarchy too deep');
    }

    // Set parent...
  }
}
```

### Generic Graph Validation
```typescript
type GraphEdge<T> = { from: T; to: T };

function validateGraph<T>(
  edges: GraphEdge<T>[],
  getParent: (node: T) => T | null
): { valid: boolean; cycles: T[][] } {

  const cycles: T[][] = [];

  for (const edge of edges) {
    if (checkCircularReference(edge.from, edge.to, getParent)) {
      cycles.push([edge.from, edge.ts]);
    }
  }

  return { valid: cycles.length === 0, cycles };
}
```

## 🔍 Debugging Utilities

### Trace Ancestry
```typescript
import { getAncestors } from '@maxellabs/core';

function traceAncestry<T>(node: T, getParent: (n: T) => T | null): string {
  const ancestors = getAncestors(node, getParent);
  return ancestors.map((a, i) => `  ${'  '.repeat(i)}└─ ${a}`).join('\n');
}
```

### Validate Hierarchy Integrity
```typescript
import { isAncestorOf } from '@maxellabs/core';

function validateHierarchyConsistency<T>(root: T, getParent: (n: T) => T | null): boolean {
  // Check that parents are properly linked
  const stack: T[] = [root];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = getDirectChildren(current); // Would need separate function

    for (const child of children) {
      if (!isAncestorOf(current, child, getParent)) {
        return false;
      }
      stack.push(child);
    }
  }

  return true;
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
**Size**: ~15KB
**Line Count**: 421

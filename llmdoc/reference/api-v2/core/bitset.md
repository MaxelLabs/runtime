---
id: "core-bitset"
type: "reference"
title: "BitSet - Efficient Bit Collection"
description: "High-performance bit set implementation using Uint32Array for ECS component masks, set operations, and compact boolean storage."

context_dependency: []
related_ids: ["core-sparse-set"]
---

## 🔌 Interface First

### Core Interface
```typescript
class BitSet {
  constructor(capacity: number = 64);

  // Basic operations
  set(index: number): this;
  clear(index: number): this;
  has(index: number): boolean;
  get(index: number): 0 | 1;
  flip(index: number): this;

  // Bulk operations
  clearAll(): this;
  setAll(): this;

  // Query operations
  count(): number;
  isEmpty(): boolean;
  contains(other: BitSet): boolean;
  intersects(other: BitSet): boolean;
  equals(other: BitSet): boolean;

  // Set operations
  and(other: BitSet): BitSet;
  or(other: BitSet): BitSet;
  xor(other: BitSet): BitSet;
  not(): BitSet;
  andNot(other: BitSet): BitSet;

  // Optimization
  andInPlace(other: BitSet): this;
  orInPlace(other: BitSet): this;
  clone(): BitSet;

  // Iteration
  toArray(): number[];
  *[Symbol.iterator](): Iterator<number>;

  // Utilities
  toString(): string;
  static fromArray(indices: number[]): BitSet;
}
```

## ⚙️ Implementation Logic

### Storage Architecture
```typescript
Pseudocode:
class BitSet:
  BITS_PER_WORD: 32

  words: Uint32Array  // Each 32-bit element stores 32 boolean flags
  _capacity: number   // Total bit capacity (rounded up to 32 multiple)

// Example: 64-bit capacity
// [word0: bits 0-31] [word1: bits 32-63]
```

### Core Operations
```typescript
// Set bit
FUNCTION set(index):
  wordIndex = floor(index / 32)
  bitIndex = index % 32
  words[wordIndex] |= (1 << bitIndex)

// Check bit
FUNCTION has(index):
  wordIndex = floor(index / 32)
  bitIndex = index % 32
  RETURN (words[wordIndex] & (1 << bitIndex)) != 0

// Clear bit
FUNCTION clear(index):
  wordIndex = floor(index / 32)
  bitIndex = index % 32
  words[wordIndex] &= ~(1 << bitIndex)
```

### Set Operations
```typescript
// Intersection (AND)
FUNCTION and(other):
  result = new BitSet(max(other.capacity, this.capacity))
  minLength = min(words.length, other.words.length)

  FOR i < minLength:
    result.words[i] = this.words[i] & other.words[i]

  RETURN result

// Union (OR)
FUNCTION or(other):
  result = new BitSet(max(other.capacity, this.capacity))
  maxLength = max(words.length, other.words.length)

  FOR i < maxLength:
    a = this.words[i] || 0
    b = other.words[i] || 0
    result.words[i] = a | b

  RETURN result
```

## 📚 Usage Examples

### Basic Usage
```typescript
import { BitSet } from '@maxellabs/core';

const bitset = new BitSet(64); // Supports bits 0-63

bitset.set(5);
bitset.set(10);
bitset.set(100);

console.log(bitset.has(5));   // true
console.log(bitset.has(6));   // false
console.log(bitset.count());  // 3

// Iteration
for (const bit of bitset) {
  console.log(`Bit ${bit} is set`);
}
```

### ECS Component Masking
```typescript
// Define component IDs
const TRANSFORM_ID = 0;
const PHYSICS_ID = 1;
const RENDER_ID = 2;

// Create entity signature
const entityMask = new BitSet(32);
entityMask.set(TRANSFORM_ID);
entityMask.set(PHYSICS_ID);

// System query: entities with TRANSFORM + PHYSICS
const queryMask = new BitSet(32);
queryMask.set(TRANSFORM_ID);
queryMask.set(PHYSICS_ID);

// Check if entity matches query
if (entityMask.contains(queryMask)) {
  // Process entity
}
```

### Set Operations
```typescript
const setA = BitSet.fromArray([1, 3, 5, 7]);
const setB = BitSet.fromArray([2, 3, 6, 7]);

const intersection = setA.and(setB);   // 3, 7
const union = setA.or(setB);           // 1, 2, 3, 5, 6, 7
const difference = setA.andNot(setB);  // 1, 5
const symmetric = setA.xor(setB);      // 1, 2, 5, 6
```

### Efficient Storage
```typescript
// Store flags for 1000 items using ~125 bytes
// vs. boolean[] uses ~1000 bytes
const flags = new BitSet(1000);

// Bulk operations
flags.setAll();     // Enable all
flags.clearAll();   // Disable all

// Check if any flag set
if (!flags.isEmpty()) {
  // Process
}
```

### Bitwise Operations with Chaining
```typescript
const result = new BitSet(256)
  .set(1).set(5).set(10)           // Add bits
  .or(other)                        // Union
  .and(complement)                  // Intersection
  .clone();                         // Create copy
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** use sparse sets for non-integer keys (use objects/maps instead)
- 🚫 **DO NOT** assume uniform memory layout across different WASM targets
- 🚫 **DO NOT** overgrow capacity initially - grow dynamically instead
- 🚫 **DO NOT** forget to check bounds in tight loops

### Common Mistakes
```typescript
// ❌ WRONG: Unbounded growth
const bitset = new BitSet(1); // Small initial
for (let i = 0; i < 10000; i++) {
  bitset.set(i); // Grows many times!
}

// ✅ CORRECT: Pre-size appropriately
const bitset = new BitSet(10000); // Right size from start
```

```typescript
// ❌ WRONG: Manual iteration with has()
const size = bitset.capacity;
for (let i = 0; i < size; i++) {
  if (bitset.has(i)) { // O(n) iteration!
    // ...
  }
}

// ✅ CORRECT: Use iterator
for (const bit of bitset) { // O(k) where k = set bits
  // ...
}
```

```typescript
// ❌ WRONG: Creating large temporary sets
const hugeSet = new BitSet(1000000);

// ✅ CORRECT: Use sparse-set for large sparse domains
import { SparseSet } from '@maxellabs/core';
const set = new SparseSet(1000000);
```

## 📊 Performance Analysis

### Time Complexity
| Operation | Complexity | Notes |
|-----------|------------|-------|
| `set/clear/has` | O(1) | Direct bit operations |
| `and/or/xor` | O(n/32) | n = max capacity, vectorized |
| `count/isEmpty` | O(n/32) | Must scan all words |
| `contains` | O(n/32) | Set containment check |
| `clone` | O(n/32) | Memory copy |
| `toArray` | O(k) | k = number of set bits |

### Memory Usage
```
BitSet with capacity 64:
- Words array: 2 * 4 bytes = 8 bytes
- _capacity field: 4 bytes
- Total: ~16 bytes

BitSet with capacity 1,024:
- Words array: 32 * 4 bytes = 128 bytes
- Total: ~136 bytes
```

### Comparison with Alternatives
```
Capacity: 1,000,000 items

BitSet (compressed):
- Memory: ~125KB
- Set/Check: O(1)
- Iteration: O(k) where k = set bits

Boolean Array:
- Memory: ~1MB
- Set/Check: O(1)
- Iteration: O(n)

Object Set:
- Memory: ~32MB + overhead
- Set/Check: O(1) average
- Iteration: O(n)
```

### Optimization Tips
1. **Pre-size**: Initialize with expected capacity
2. **Batch ops**: Use `setAll()`, `clearAll()` for bulk changes
3. **In-place**: Use `andInPlace()`, `orInPlace()` to avoid allocations
4. **Minimize clone**: Clone only when necessary
5. **Use contains**: For superset checks instead of manual iteration

## 🔗 Integration Patterns

### Combining with SparseSet for ECS
```typescript
// Use SparseSet for entity IDs, BitSet for component masks
class EntityRegistry {
  private entities = new SparseSet(10000);
  private masks = new Map<number, BitSet>();

  createEntity(): number {
    const id = this.entities.nextId();
    this.entities.add(id);
    this.masks.set(id, new BitSet(32));
    return id;
  }

  addComponent(entity: number, componentType: number): void {
    this.masks.get(entity)?.set(componentType);
  }

  query(components: number[]): number[] {
    const queryMask = BitSet.fromArray(components);
    const results: number[] = [];

    for (const entity of this.entities) {
      const mask = this.masks.get(entity)!;
      if (mask.contains(queryMask)) {
        results.push(entity);
      }
    }

    return results;
  }
}
```

### Event System Filtering
```typescript
class EventFilter {
  private subscriptions = new SparseMap<BitSet>();

  // Subscribe to specific event types
  subscribe(entityId: number, eventTypes: number[]): void {
    const mask = BitSet.fromArray(eventTypes);
    this.subscriptions.set(entityId, mask);
  }

  // Publish to subscribed entities
  publish(eventType: number, data: any): void {
    const interested = new BitSet(1000);
    interested.set(eventType);

    for (const [entityId, mask] of this.subscriptions) {
      if (mask.intersects(interested)) {
        this.dispatchTo(entityId, data);
      }
    }
  }
}
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0
**Performance**: O(1) bit operations, ~4x memory savings vs. boolean arrays
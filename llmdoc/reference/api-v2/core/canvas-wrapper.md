---
# Identity
id: "core-canvas-wrapper"
type: "reference"
title: "Canvas Wrapper - Browser Environment Guardian"

# Semantics
description: "HTML5 Canvas wrapper with strict browser environment validation and responsive sizing utilities."

# Graph
context_dependency: []
related_ids: ["core-ioc-container", "core-event-dispatcher", "core-transform-component"]
---

## 🔌 Interface First

### Core Interface
```typescript
interface CanvasWrapper {
  // Construction & Validation
  constructor(canvas: HTMLCanvasElement | string);

  // Dimension Management
  getWidth(): number;
  setWidth(value: number): void;
  getHeight(): number;
  setHeight(value: number): void;

  // Client Sizing
  getClientWidth(): number;
  getClientHeight(): number;

  // Auto-Resize
  resizeByClientSize(width?: number, height?: number): boolean;
}
```

### Browser Detection Interface
```typescript
interface BrowserEnvironment {
  hasWindow(): boolean;
  hasDocument(): boolean;
  validateEnvironment(): void;
}
```

## ⚙️ Implementation Logic

### Environment Validation Flow
```typescript
Pseudocode:
CONSTRUCTOR(canvas):
  // Browser environment check
  IF typeof window === undefined OR typeof document === undefined:
    THROW Error("Canvas class only available in browser environment")

  // Parameter type handling
  IF canvas IS string:
    element = document.getElementById(canvas)
    VALIDATE element exists
    VALIDATE element IS HTMLCanvasElement
  ELSE:
    element = canvas

  STORE element reference
```

### Client Size Sizing Algorithm
```typescript
Pseudocode:
FUNCTION resizeByClientSize(width?, height?):
  clientWidth = width ?? this.getClientWidth()
  clientHeight = height ?? this.getClientHeight()

  currentWidth = this.getWidth()
  currentHeight = this.getHeight()

  IF (currentWidth ≠ clientWidth OR currentHeight ≠ clientHeight):
    this.setWidth(clientWidth)
    this.setHeight(clientHeight)
    RETURN true // Resize performed

  RETURN false // No resize needed
```

## 📚 Usage Examples

### Basic Creation
```typescript
// Method 1: From DOM element ID
const canvas = new Canvas('myCanvas');

// Method 2: From existing element
const element = document.getElementById('render') as HTMLCanvasElement;
const canvas = new Canvas(element);

// Get dimensions
const width = canvas.getWidth();
const height = canvas.getHeight();
```

### Responsive Canvas
```typescript
const canvas = new Canvas('gameCanvas');

// Manual resize
canvas.setWidth(1920);
canvas.setHeight(1080);

// Automatic resize to client size
const resized = canvas.resizeByClientSize();
if (resized) {
  console.log('Canvas resized to fit container');
}

// Custom client dimensions
canvas.resizeByClientSize(800, 600);
```

### Dynamic Responsive System
```typescript
class ResponsiveRenderer {
  private canvas: Canvas;

  constructor(elementId: string) {
    this.canvas = new Canvas(elementId);
  }

  // Call on window resize
  handleResize(): void {
    const didResize = this.canvas.resizeByClientSize();

    if (didResize) {
      // Recreate render buffers
      this.updateViewport();
      this.handleProjectionMatrix();
    }
  }

  private updateViewport(): void {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    gl.viewport(0, 0, width, height);
  }
}
```

## 🚫 Negative Constraints

### Environment Restrictions
- 🚫 **DO NOT** use outside browser context (Node.js, SSR will fail)
- 🚫 **DO NOT** create Canvas in server-side code
- 🚫 **DO NOT** bypass constructor validation
- 🚫 **DO NOT** assign non-canvas HTML elements
- 🚫 **DO NOT** call methods after element removal from DOM

### Common Mistakes
- ❌ Using Canvas in Node.js/SSR environments
- ❌ Passing canvas ID string that doesn't exist
- ❌ Passing non-canvas HTML elements (divs, spans)
- ❌ Forgetting to handle resize events
- ❌ Not checking return value of `resizeByClientSize()`

### Error Patterns
```typescript
// ❌ WRONG: Node.js environment
const canvas = new Canvas('test'); // Throws error

// ❌ WRONG: Wrong element type
const div = document.createElement('div');
const canvas = new Canvas(div as any); // Runtime error

// ❌ WRONG: Non-existent ID
const canvas = new Canvas('missing-canvas'); // Throws error
```

## 📊 Browser Compatibility

### Supported Environments
| Environment | Status | Notes |
|-------------|--------|-------|
| Modern Browsers | ✅ Full | Chrome, Firefox, Safari, Edge |
| Mobile Browsers | ✅ Full | iOS Safari, Chrome Mobile |
| Web Workers | ⚠️ Not Recommended | No DOM access |
| Node.js | ❌ Not Supported | Server-side |
| SSR (Next.js, etc) | ❌ Not Supported | Hydration needed |

### Feature Detection
```typescript
function isBrowser(): boolean {
  return typeof window !== 'undefined' &&
         typeof document !== 'undefined';
}

// Alternative usage pattern for SSR compatibility
let canvas: Canvas | null = null;

if (isBrowser()) {
  canvas = new Canvas('myCanvas');
  // Safe to use canvas methods here
}
```

## 🔗 Integration Patterns

### With IOC Container
```typescript
const container = Container.getInstance();

// Register browser-safe factory
container.registerFactory('canvas', () => {
  return new Canvas('mainCanvas');
});

// Resolve with error handling
try {
  const canvas = container.resolve<Canvas>('canvas');
  canvas.resizeByClientSize();
} catch (error) {
  // Running in non-browser environment
  console.warn('Canvas not available:', error.message);
}
```

### With Event System
```typescript
class CanvasInputHandler {
  constructor(private canvas: Canvas) {
    this.bindResize();
    this.bindPointerEvents();
  }

  private bindResize(): void {
    window.addEventListener('resize', () => {
      const resized = this.canvas.resizeByClientSize();
      if (resized) {
        this.emit('canvas-resized', {
          width: this.canvas.getWidth(),
          height: this.canvas.getHeight()
        });
      }
    });
  }
}
```

### Error Recovery Pattern
```typescript
function createSafeCanvas(elementId: string): Canvas | null {
  try {
    return new Canvas(elementId);
  } catch (error) {
    if (error.message.includes('browser environment')) {
      console.warn('Running outside browser, creating dummy canvas');
      return null;
    }

    if (error.message.includes('not found')) {
      console.error(`Canvas element '${elementId}' not found in DOM`);
      return null;
    }

    throw error; // Unexpected error
  }
}
```

## 🎯 Performance Considerations

### Memory Optimization
- Canvas wrapper holds only one DOM reference
- No additional memory overhead vs direct element access
- Garbage collection automatically cleans up on scope end

### Operation Cost
| Method | Time Complexity | Notes |
|--------|----------------|-------|
| `constructor()` | O(1) | DOM lookup |
| `getWidth/setWidth` | O(1) | DOM property access |
| `resizeByClientSize()` | O(1) | 2 DOM reads, 2 DOM writes |
| `clientWidth/Height` | O(1) | DOM property access |

### DOM Access Minimization
```typescript
// ❌ Inefficient: Multiple DOM reads
for (let i = 0; i < 100; i++) {
  canvas.getClientWidth(); // Each causes layout thrashing
}

// ✅ Efficient: Store local reference
const width = canvas.getClientWidth();
const height = canvas.getClientHeight();

for (let i = 0; i < 100; i++) {
  // Use local variables
  process(width, height);
}
```

## 🔍 Debugging & Testing

### Mocking in Tests
```typescript
// Test wrapper for browser environment
class TestCanvas extends Canvas {
  constructor() {
    const mockElement = {
      width: 800,
      height: 600,
      clientWidth: 800,
      clientHeight: 600
    } as HTMLCanvasElement;

    super(mockElement);
  }
}

// Unit test example
test('canvas resizes correctly', () => {
  const canvas = new TestCanvas();
  const resized = canvas.resizeByClientSize(1024, 768);

  expect(resized).toBe(true);
  expect(canvas.getWidth()).toBe(1024);
  expect(canvas.getHeight()).toBe(768);
});
```

### Debugging Tips
```typescript
// Check if canvas is responsive
function debugCanvas(canvas: Canvas): void {
  console.log('Current size:', canvas.getWidth(), 'x', canvas.getHeight());
  console.log('Client size:', canvas.getClientWidth(), 'x', canvas.getClientHeight());

  // Detect mutual sizing issues
  if (canvas.getWidth() !== canvas.getClientWidth()) {
    console.warn('Canvas width differs from client width - check CSS');
  }
}
```

## 📋 Summary Checklist

### Creation Validation
- [ ] Element exists in DOM
- [ ] Element is HTMLCanvasElement
- [ ] Running in browser environment
- [ ] Has access to document APIs

### Runtime Safety
- [ ] Handle resize events
- [ ] Check client dimensions before rendering
- [ ] Provide fallback for missing elements
- [ ] Wrap in try-catch for SSR scenarios

---
**Last Updated**: 2025-12-18
**Version**: 1.0.0 (Reflecting browser validation enhancement)

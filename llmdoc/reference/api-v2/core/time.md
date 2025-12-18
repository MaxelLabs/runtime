---
# Identity
id: "core-time"
type: "reference"
title: "Time - Game Time Management System"

# Semantics
description: "Game time manager providing delta time, time scaling, fixed timestep, and frame tracking."

# Graph
context_dependency: []
related_ids: ["core-event-dispatcher", "core-entity"]
---

## 🔌 Interface First

### Time Class Interface
```typescript
class Time {
  // Real-time properties (seconds)
  deltaTime: number;              // Scaled delta (timeScale affected)
  fixedDeltaTime: number;         // Fixed physics step (default 0.02s)
  maximumDeltaTime: number;       // Frame time cap (default 0.333s)

  // Time scaling
  timeScale: number;              // Speed multiplier (default 1.0)

  // Read-only properties
  readonly currentTime: number;           // Scaled elapsed time
  readonly timeSinceStartup: number;      // Unscaled elapsed time
  readonly frame: number;                 // Frame count
  readonly unscaledDelta: number;         // Raw delta (no scaling)
  readonly fps: number;                   // Current frames per second

  // Fixed timestep
  fixedTimeAccumulator: number;   // Accumulates unscaled delta
  needFixedUpdate(): boolean;     // Time for fixed step?
  performFixedUpdate(): void;     // Consume accumulator
}
```

## ⚙️ Implementation Logic

### Frame Update Flow
```typescript
Pseudocode:
FUNCTION update(rawDeltaMs):
  // Convert to seconds
  deltaSeconds = rawDeltaMs / 1000

  // Clamp to prevent huge jumps
  this.unscaledDeltaTime = min(deltaSeconds, maximumDeltaTime)

  // Apply time scale
  this.deltaTime = this.unscaledDeltaTime * timeScale

  // Update tracking
  this.time += this.deltaTime
  this.sinceStartup += this.unscaledDeltaTime

  // Fixed timestep accumulation
  this.fixedTimeAccumulator += this.deltaTime

  // Frame count
  this.frame++
```

### Fixed Timestep Management
```typescript
Pseudocode:
FUNCTION needFixedUpdate():
  RETURN this.fixedTimeAccumulator >= this.fixedDeltaTime

FUNCTION performFixedUpdate():
  // Called when needFixedUpdate() == true
  // Physics should run at fixed intervals
  runPhysics(this.fixedDeltaTime)

  // Consume accumulator
  this.fixedTimeAccumulator -= this.fixedDeltaTime

  // May need multiple steps if accumulated a lot
  WHILE this.needFixedUpdate():
    runPhysics(this.fixedDeltaTime)
    this.performFixedUpdate()
```

### Time Scale Effects
```typescript
Pseudocode:
// Frame delta: 16ms (60fps)
timeScale = 1.0:
  deltaTime = 0.016s  // Normal speed

timeScale = 2.0:
  deltaTime = 0.032s  // 2x speed (game runs faster)

timeScale = 0.5:
  deltaTime = 0.008s  // 0.5x speed (slow motion)

timeScale = 0.0:
  deltaTime = 0.0s    // Paused
```

### FPS Calculation
```typescript
Pseudocode:
fps = deltaTime > 0 ? 1 / deltaTime : 0

// Examples:
// 16ms (60fps): 1/0.016 = 62.5 fps
// 33ms (30fps): 1/0.033 = 30.3 fps
// 8ms (120fps): 1/0.008 = 125 fps
```

## 📚 Usage Examples

### Basic Game Loop
```typescript
class GameEngine {
  private time = new Time();
  private lastFrameTime = performance.now();

  loop(): void {
    const now = performance.now();
    const rawDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Update time manager
    this.time.update(rawDelta);

    // Log FPS
    if (this.time.frame % 60 === 0) {
      console.log(`FPS: ${this.time.fps.toFixed(1)}`);
    }

    // Update game logic
    this.update(this.time.deltaTime);

    // Fixed updates (physics)
    while (this.time.needFixedUpdate()) {
      this.fixedUpdate(this.time.fixedDeltaTime);
      this.time.performFixedUpdate();
    }

    // Render
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update(dt: number): void {
    // Elastic update - runs every frame
    // Compatible with time scaling
  }

  fixedUpdate(dt: number): void {
    // Deterministic physics step
    // Always runs at fixed intervals
  }
}
```

### Time Scaling System
```typescript
class GameManager {
  private time: Time = new Time();

  // Slow motion for dramatic moments
  slowMotion(duration: number, scale: number = 0.3): void {
    this.time.timeScale = scale;
    setTimeout(() => {
      this.time.timeScale = 1.0;
    }, duration * 1000); // Duration in real seconds
  }

  // Pause game
  pause(): void {
    this.time.timeScale = 0.0;
  }

  // Resume
  resume(normalSpeed: number = 1.0): void {
    this.time.timeScale = normalSpeed;
  }

  // Boost gameplay (2x speed)
  boost(): void {
    this.time.timeScale = 2.0;
  }
}

// Usage
const game = new GameManager();

// Player hit trigger slow motion
game.slowMotion(2.0); // 2 seconds real time at 0.3x speed

// Boss fight boost
game.boost();

// Pause menu
game.pause();
```

### Fixed Physics Integration
```typescript
class PhysicsEngine {
  private time: Time;
  private bodies: RigidBody[] = [];

  constructor(time: Time) {
    this.time = time;
  }

  update(): void {
    // Variable time step for non-physics
    // Or: Skip if using fixed-only

    // Fixed timestep physics
    this.stepPhysics();
  }

  private stepPhysics(): void {
    // Check if physics step needed
    while (this.time.needFixedUpdate()) {
      // Step with fixed delta
      this.integrate(this.time.fixedDeltaTime);
      this.solveConstraints();
      this.resolveCollisions();

      // Consume accumulator
      this.time.performFixedUpdate();

      // May loop if accumulated multiple steps
    }
  }

  private integrate(dt: number): void {
    for (const body of this.bodies) {
      // Deterministic physics equation
      // F = ma, p = mv, x = x0 + vt
      body.velocity.addScaled(
        body.force.multiplyScalar(1 / body.mass * dt)
      );
      body.position.addScaled(body.velocity.multiplyScalar(dt));
    }
  }

  // Collision and constraints...
}

// Usage in game loop
const game = new GameEngine();
const physics = new PhysicsEngine(game.time);

game.fixedUpdate = (dt) => {
  physics.stepPhysics(); // Uses time.accumulator
};
```

### Time-based Animation
```typescript
class Animator {
  private time: Time;

  constructor(time: Time) {
    this.time = time;
  }

  playAnimation(duration: number): void {
    const startTime = this.time.currentTime;
    const endTime = startTime + duration;

    const update = () => {
      const elapsed = this.time.currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Apply animation
      this.applyProgress(progress);

      if (this.time.currentTime < endTime) {
        requestAnimationFrame(update);
      }
    };

    update();
  }

  // Smooth interpolation independent of framerate
  lerp(start: number, end: number, speed: number): number {
    // Delta-based interpolation
    const delta = (end - start) * this.time.deltaTime * speed;
    return start + delta;
  }
}
```

## 🚫 Negative Constraints

### Critical Restrictions
- 🚫 **DO NOT** call update() multiple times per frame
- 🚫 **DO NOT** modify deltaTime directly
- 🚫 **DO NOT** use delta for critical physics without fixed timestep
- 🚫 **DO NOT** change timeScale frequently in update()
- 🚫 **DO NOT** ignore maximumDeltaTime in lag spikes

### Common Mistakes
```typescript
// ❌ WRONG: Call update twice
time.update(rawDelta1);
time.update(rawDelta2); // Accumulates time twice
// Result: for frame runs fast

// ❌ WRONG: Use unscaled delta for game logic
const movement = unscaledDelta * speed;
// Ignores timeScale - player still moves at normal speed during pause

// ✅ CORRECT: Use scaled delta
const movement = time.deltaTime * speed;
// Respects pause (timeScale=0) and slow motion
```

```typescript
// ❌ WRONG: Frame-based movement
const velocity = 5; // Units per second?
const thisFrame = velocity; // Wrong! Should be per-frame

for (let i = 0; i < 60; i++) {
  position += velocity; // Different speed on 30fps vs 60fps
}

// ✅ CORRECT: Delta-based movement
const speed = 5; // Units per second
for (let i = 0; i < 60; i++) {
  position += speed * time.deltaTime; // Always correct
}
```

```typescript
// ❌ WRONG: Ignoring fixed timestep in physics
updatePhysics(dt) {
  // Using variable dt causes:
  // - Different outcome on different framerates
  // - Tunneling at low FPS
  // - Explosions at high FPS

  this.velocity += this.force * dt;
  this.position += this.velocity * dt;
}

// ✅ CORRECT: Use fixed physics
fixedUpdatePhysics(dt) {
  // dt is always 0.02s (50Hz)
  // Deterministic across hardware
  this.velocity += this.force * dt;
  this.position += this.velocity * dt;
}
```

### Maximum Delta Time Pitfalls
```typescript
// ❌ WRONG: Let huge delta corrupt simulation
// User tabs out for 5 seconds, comes back
// delta = 5.0 seconds
// Movement = speed * 5.0 = HUGE distance
// Physics explodes

time.maximumDeltaTime = 0.333; // Default
// If delta > 0.333s, clamp to 0.333
// Movement = speed * 0.333 = controlled

// Custom setting for slow games:
time.maximumDeltaTime = 0.1; // Max 100ms
// Prevents huge jumps even when lag spike
```

## 📊 Performance Analysis

### Per-Frame Overhead
```
update():
  - Time.now(): ~50ns
  - Division / 1000: ~10ns
  - Min operation: ~5ns
  - Multiplication (timeScale): ~5ns
  - Increment operations: ~5ns
Total: ~75ns per frame (negligible)
```

### Memory Usage
```
Time object:
  - time: 8 bytes (number)
  - lastTime: 8 bytes
  - sinceStartup: 8 bytes
  - deltaTime: 8 bytes
  - unscaledDelta: 8 bytes
  - timeScale: 8 bytes
  - frameCount: 8 bytes (but might be 32-bit, 4 bytes)
  - fixedDeltaTime: 8 bytes
  - maximumDeltaTime: 8 bytes
  - fixedTimeAccumulator: 8 bytes
Total: ~72 bytes (one instance per engine)
```

### Accumulator Behavior
```typescript
// Fixed timestep running at 50Hz (0.02s)

// 60fps (16.6ms updates):
// Frame 1: accumulator += 0.016 → 0.016 (< 0.02)
// Frame 2: accumulator += 0.016 → 0.032 (≥ 0.02)
//   → Physics step (0.012 left)
// Frame 3: accumulator += 0.016 → 0.028 (≥ 0.02)
//   → Physics step (0.008 left)
// ... steady state: 1 physics every 1.2 frames

// 30fps (33ms updates):
// Frame: accumulator += 0.033 → 0.033 (≥ 0.02)
//   → Physics step (0.013 left)
// Next frame also spins 2x physics
// Result: Still runs at 50Hz internally
```

## 🔗 Integration Patterns

### Scene System Integration
```typescript
class Scene {
  private time = new Time();

  update(rawDeltaMs: number): void {
    this.time.update(rawDeltaMs);

    // Update entities
    for (const entity of this.entities) {
      entity.update(this.time.deltaTime);
    }

    // Physics (fixed)
    while (this.time.needFixedUpdate()) {
      this.updatePhysics(this.time.fixedDeltaTime);
      this.time.performFixedUpdate();
    }

    // Events (if using event-based timing)
    this.eventSystem.emit('scene-updated', {
      frame: this.time.frame,
      fps: this.time.fps
    });
  }
}
```

### UI System with Time
```typescript
class UIRoot {
  private time: Time;

  constructor(time: Time) {
    this.time = time;
  }

  // Frame-rate independent animations
  updateUI(): void {
    // Smooth progress bars
    this.progress += this.time.deltaTime * this.speed;

    // Pulse effect - FPS independent frequency
    const pulse = Math.sin(this.time.currentTime * 2 * Math.PI) * 0.5 + 0.5;
    this.setOpacity(pulse);
  }

  // FPS counter
  updateFPS(): void {
    const fps = Math.round(this.time.fps);
    this.fpsText.text = `${fps} FPS`;
  }

  // Delta vs Unscaled for pause menu
  animateIn(): void {
    // Should work even when paused (unscaled)
    this.position.y += this.time.unscaledDelta * 500;
  }
}
```

### Profiler Integration
```typescript
class Profiler {
  private time: Time;
  private frameStart: number = 0;

  constructor(time: Time) {
    this.time = time;
  }

  beginFrame(): void {
    this.frameStart = performance.now();
  }

  endFrame(): void {
    const realDelta = performance.now() - this.frameStart;

    // Time system metrics
    console.table({
      'Time Frame': this.time.frame,
      'Real Delta': realDelta,
      'Time Delta': this.time.deltaTime * 1000,
      'Time Scale': this.time.timeScale,
      'Simulated FPS': this.time.fps,
      'Updates/Frame': this.time.needFixedUpdate() ? 'Physics' : 'None',
      'Accumulator': this.time.fixedTimeAccumulator
    });
  }
}

// Use:
profiler.beginFrame();
gameLoop();
profiler.endFrame();
```

## 🔍 Debugging & Monitoring

### Time State Log
```typescript
function debugTime(time: Time): string {
  return [
    `Frame: ${time.frame}`,
    `Scaled Delta: ${(time.deltaTime * 1000).toFixed(2)}ms`,
    `Unscaled Delta: ${(time.unscaledDelta * 1000).toFixed(2)}ms`,
    `Time Scale: ${time.timeScale}`,
    `Current Time: ${time.currentTime.toFixed(2)}s`,
    `Startup: ${time.timeSinceStartup.toFixed(2)}s`,
    `FPS: ${time.fps.toFixed(1)}`,
    `Fixed Accum: ${(time.fixedTimeAccumulator * 1000).toFixed(2)}ms`,
    `Needs Fixed: ${time.needFixedUpdate()}`
  ].join('\n  ');
}

// Every 1000 frames
if (time.frame % 1000 === 0) {
  console.log(debugTime(time));
}
```

### Detect Lag
```typescript
class LagMonitor {
  private maxExpectedDelta: number;
  private threshold: number;

  constructor(time: Time, fps: number) {
    this.maxExpectedDelta = 1 / fps;
    this.threshold = this.maxExpectedDelta * 2; // 2x expected
  }

  check(time: Time): boolean {
    const isLagging = time.unscaledDelta > this.threshold;

    if (isLagging) {
      console.warn(`LAG DETECTED!`);
      console.warn(`  Expected: ${this.maxExpectedDelta * 1000}ms`);
      console.warn(`  Actual: ${time.unscaledDelta * 1000}ms`);
      console.warn(`  Frame: ${time.frame}`);
    }

    return isLagging;
  }
}

// Detect when frame time exceeds 33ms (less than 30fps)
const monitor = new LagMonitor(time, 60);

// Call in update()
if (monitor.check(time)) {
    // Trigger quality reduction
    // Reduce particles, lower resolution, etc.
}
```

### Time Scale Validation
```typescript
function safeSetTimeScale(time: Time, newScale: number): void {
  if (isNaN(newScale) || !isFinite(newScale)) {
    console.error(`Invalid time scale: ${newScale}`);
    return;
  }

  if (newScale === time.timeScale) return;

  const oldValue = time.timeScale;
  time.timeScale = Math.max(0, Math.min(10, newScale)); // Clamp 0-10x

  if (oldValue !== time.timeScale) {
    console.log(`Time Scale changed: ${oldValue} → ${time.timeScale}x`);
  }
}

// Usage:
safeSetTimeScale(time, 100); // Clamped to 10
safeSetTimeScale(time, -1);  // Clamped to 0
```

---

**Last Updated**: 2025-12-18
**Version**: 1.0.0

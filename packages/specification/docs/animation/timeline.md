# 动画时间轴模块文档

动画时间轴模块定义了Maxellabs中的时间轴系统，支持复杂的动画时序控制、同步和分层管理。

## 1. 概览与背景

时间轴系统是Maxellabs动画系统的高级组件，负责管理动画的播放时序、同步关系和分层控制。它类似于视频编辑软件的时间轴，支持轨道、关键帧、事件和复杂的时序逻辑。

## 2. API 签名与类型定义

### TimelineTrack

时间轴轨道定义。

```typescript
interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  startTime: number;
  duration: number;
  endTime: number;
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
  color: string;
  zIndex: number;
}
```

### TimelineClip

时间轴剪辑定义。

```typescript
interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  loop: boolean;
  reverse: boolean;
  animation: string;
  events: TimelineEvent[];
}
```

### TimelineEvent

时间轴事件定义。

```typescript
interface TimelineEvent {
  id: string;
  type: EventType;
  time: number;
  data: any;
  target: string;
}
```

### TrackType

轨道类型枚举。

```typescript
enum TrackType {
  Animation = 'animation',
  Audio = 'audio',
  Video = 'video',
  Effect = 'effect',
  Marker = 'marker',
}
```

### EventType

事件类型枚举。

```typescript
enum EventType {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Seek = 'seek',
  Trigger = 'trigger',
  Marker = 'marker',
}
```

### Timeline

时间轴顶层定义。

```typescript
interface Timeline {
  id: string;
  name: string;
  duration: number;
  frameRate: number;
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
  settings: TimelineSettings;
}
```

### TimelineMarker

时间轴标记定义。

```typescript
interface TimelineMarker {
  id: string;
  name: string;
  time: number;
  color: string;
  note: string;
}
```

### TimelineSettings

时间轴设置定义。

```typescript
interface TimelineSettings {
  autoSnap: boolean;
  snapInterval: number;
  showWaveform: boolean;
  showGrid: boolean;
  gridInterval: number;
}
```

## 3. 参数与返回值详细说明

### Timeline 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 时间轴唯一标识符 |
| name | string | 是 | - | 时间轴显示名称 |
| duration | number | 是 | 0 | 总持续时间（秒） |
| frameRate | number | 是 | 30 | 帧率（fps） |
| tracks | TimelineTrack[] | 是 | [] | 轨道列表 |
| markers | TimelineMarker[] | 否 | [] | 标记列表 |
| settings | TimelineSettings | 否 | {} | 时间轴设置 |

### TimelineTrack 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 轨道唯一标识符 |
| name | string | 是 | - | 轨道显示名称 |
| type | TrackType | 是 | - | 轨道类型 |
| startTime | number | 是 | 0 | 轨道开始时间（秒） |
| duration | number | 是 | 0 | 轨道持续时间（秒） |
| endTime | number | 是 | 0 | 轨道结束时间（秒） |
| clips | TimelineClip[] | 是 | [] | 剪辑列表 |
| muted | boolean | 否 | false | 是否静音 |
| locked | boolean | 否 | false | 是否锁定 |
| color | string | 否 | '#000000' | 轨道颜色 |
| zIndex | number | 否 | 0 | 层级顺序 |

### TimelineClip 属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string | 是 | - | 剪辑唯一标识符 |
| name | string | 是 | - | 剪辑显示名称 |
| startTime | number | 是 | 0 | 剪辑开始时间（秒） |
| duration | number | 是 | 0 | 剪辑持续时间（秒） |
| endTime | number | 是 | 0 | 剪辑结束时间（秒） |
| trimStart | number | 否 | 0 | 剪辑开始修剪时间（秒） |
| trimEnd | number | 否 | 0 | 剪辑结束修剪时间（秒） |
| speed | number | 否 | 1 | 播放速度倍率 |
| loop | boolean | 否 | false | 是否循环播放 |
| reverse | boolean | 否 | false | 是否反向播放 |
| animation | string | 是 | - | 关联的动画ID |
| events | TimelineEvent[] | 否 | [] | 事件列表 |

## 4. 使用场景与代码示例

### 基础时间轴配置

```typescript
const characterTimeline: Timeline = {
  id: 'character_intro',
  name: 'Character Introduction',
  duration: 10,
  frameRate: 30,
  tracks: [
    {
      id: 'walk_track',
      name: 'Walk Animation',
      type: TrackType.Animation,
      startTime: 0,
      duration: 5,
      endTime: 5,
      clips: [
        {
          id: 'walk_clip',
          name: 'Walking',
          startTime: 0,
          duration: 5,
          endTime: 5,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          loop: true,
          reverse: false,
          animation: 'walk_cycle',
          events: [
            {
              id: 'footstep1',
              type: EventType.Trigger,
              time: 1.2,
              data: { foot: 'left', sound: 'footstep' },
              target: 'audio_system',
            },
            {
              id: 'footstep2',
              type: EventType.Trigger,
              time: 2.4,
              data: { foot: 'right', sound: 'footstep' },
              target: 'audio_system',
            },
          ],
        },
      ],
      muted: false,
      locked: false,
      color: '#ff6b6b',
      zIndex: 1,
    },
    {
      id: 'wave_track',
      name: 'Wave Animation',
      type: TrackType.Animation,
      startTime: 3,
      duration: 2,
      endTime: 5,
      clips: [
        {
          id: 'wave_clip',
          name: 'Waving Hand',
          startTime: 3,
          duration: 2,
          endTime: 5,
          trimStart: 0,
          trimEnd: 0,
          speed: 1.2,
          loop: false,
          reverse: false,
          animation: 'wave_gesture',
          events: [],
        },
      ],
      muted: false,
      locked: false,
      color: '#4ecdc4',
      zIndex: 2,
    },
  ],
  markers: [
    {
      id: 'start_marker',
      name: 'Start',
      time: 0,
      color: '#00ff00',
      note: 'Animation starts here',
    },
    {
      id: 'wave_start',
      name: 'Wave Start',
      time: 3,
      color: '#ffff00',
      note: 'Character starts waving',
    },
    {
      id: 'end_marker',
      name: 'End',
      time: 10,
      color: '#ff0000',
      note: 'Animation ends here',
    },
  ],
  settings: {
    autoSnap: true,
    snapInterval: 0.1,
    showWaveform: false,
    showGrid: true,
    gridInterval: 0.5,
  },
};
```

### 复杂时间轴场景

```typescript
const cinematicTimeline: Timeline = {
  id: 'opening_scene',
  name: 'Opening Scene',
  duration: 30,
  frameRate: 24,
  tracks: [
    {
      id: 'camera_shot1',
      name: 'Camera Shot 1',
      type: TrackType.Video,
      startTime: 0,
      duration: 10,
      endTime: 10,
      clips: [
        {
          id: 'establishing_shot',
          name: 'Establishing Shot',
          startTime: 0,
          duration: 8,
          endTime: 8,
          trimStart: 5,
          trimEnd: 2,
          speed: 0.8,
          loop: false,
          reverse: false,
          animation: 'camera_flythrough',
          events: [
            {
              id: 'fade_in',
              type: EventType.Trigger,
              time: 0,
              data: { effect: 'fade_in', duration: 2 },
              target: 'post_processing',
            },
          ],
        },
      ],
      color: '#9b59b6',
      zIndex: 1,
    },
    {
      id: 'character_animations',
      name: 'Character Animations',
      type: TrackType.Animation,
      startTime: 0,
      duration: 30,
      endTime: 30,
      clips: [
        {
          id: 'idle_to_walk',
          name: 'Idle to Walk',
          startTime: 2,
          duration: 3,
          endTime: 5,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          loop: false,
          reverse: false,
          animation: 'idle_walk_transition',
          events: [],
        },
        {
          id: 'walk_cycle',
          name: 'Walking Loop',
          startTime: 5,
          duration: 10,
          endTime: 15,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          loop: true,
          reverse: false,
          animation: 'walk_cycle',
          events: [],
        },
        {
          id: 'wave_gesture',
          name: 'Wave Gesture',
          startTime: 12,
          duration: 2,
          endTime: 14,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          loop: false,
          reverse: false,
          animation: 'hand_wave',
          events: [
            {
              id: 'play_sound',
              type: EventType.Trigger,
              time: 0.5,
              data: { sound: 'hello', volume: 0.8 },
              target: 'audio_system',
            },
          ],
        },
      ],
      color: '#3498db',
      zIndex: 2,
    },
    {
      id: 'audio_track',
      name: 'Background Music',
      type: TrackType.Audio,
      startTime: 0,
      duration: 30,
      endTime: 30,
      clips: [
        {
          id: 'background_music',
          name: 'Background Music',
          startTime: 0,
          duration: 30,
          endTime: 30,
          trimStart: 0,
          trimEnd: 0,
          speed: 1,
          loop: true,
          reverse: false,
          animation: 'background_score',
          events: [
            {
              id: 'fade_music',
              type: EventType.Trigger,
              time: 28,
              data: { volume: 0, duration: 2 },
              target: 'audio_mixer',
            },
          ],
        },
      ],
      color: '#e74c3c',
      zIndex: 3,
    },
  ],
  markers: [
    { id: 'scene_start', name: 'Scene Start', time: 0, color: '#00ff00', note: 'Scene begins' },
    { id: 'character_enters', name: 'Character Enters', time: 2, color: '#ffff00', note: 'Character walks in' },
    { id: 'wave_moment', name: 'Wave Moment', time: 12, color: '#ff00ff', note: 'Character waves' },
    { id: 'scene_end', name: 'Scene End', time: 30, color: '#ff0000', note: 'Scene ends' },
  ],
  settings: {
    autoSnap: true,
    snapInterval: 0.25,
    showWaveform: true,
    showGrid: true,
    gridInterval: 1,
  },
};
```

### 动态时间轴生成

```typescript
function createDynamicTimeline(
  duration: number,
  clipCount: number
): Timeline {
  const tracks: TimelineTrack[] = [];
  
  for (let i = 0; i < clipCount; i++) {
    const track: TimelineTrack = {
      id: `track_${i}`,
      name: `Track ${i + 1}`,
      type: TrackType.Animation,
      startTime: 0,
      duration: duration,
      endTime: duration,
      clips: [
        {
          id: `clip_${i}`,
          name: `Clip ${i + 1}`,
          startTime: (duration / clipCount) * i,
          duration: duration / clipCount,
          endTime: (duration / clipCount) * (i + 1),
          trimStart: 0,
          trimEnd: 0,
          speed: 1 + Math.random() * 0.5,
          loop: false,
          reverse: Math.random() > 0.5,
          animation: `animation_${i}`,
          events: [
            {
              id: `event_${i}`,
              type: EventType.Trigger,
              time: 0,
              data: { index: i },
              target: 'event_handler',
            },
          ],
        },
      ],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      zIndex: i + 1,
    };
    tracks.push(track);
  }

  return {
    id: 'dynamic_timeline',
    name: 'Generated Timeline',
    duration: duration,
    frameRate: 30,
    tracks: tracks,
    markers: [
      {
        id: 'start',
        name: 'Start',
        time: 0,
        color: '#00ff00',
        note: 'Timeline starts',
      },
      {
        id: 'end',
        name: 'End',
        time: duration,
        color: '#ff0000',
        note: 'Timeline ends',
      },
    ],
    settings: {
      autoSnap: true,
      snapInterval: 0.1,
      showWaveform: false,
      showGrid: true,
      gridInterval: 1,
    },
  };
}
```

### 时间轴合并

```typescript
function mergeTimelines(...timelines: Timeline[]): Timeline {
  const mergedDuration = Math.max(...timelines.map(t => t.duration));
  const allTracks = timelines.flatMap((timeline, index) => 
    timeline.tracks.map(track => ({
      ...track,
      id: `${timeline.id}_${track.id}`,
      name: `${timeline.name} - ${track.name}`,
      zIndex: track.zIndex + index * 1000,
    }))
  );

  return {
    id: 'merged_timeline',
    name: 'Merged Timeline',
    duration: mergedDuration,
    frameRate: Math.max(...timelines.map(t => t.frameRate)),
    tracks: allTracks,
    markers: timelines.flatMap((timeline, index) => 
      timeline.markers.map(marker => ({
        ...marker,
        id: `${timeline.id}_${marker.id}`,
        name: `${timeline.name} - ${marker.name}`,
        time: marker.time + (index * timeline.duration),
      }))
    ),
    settings: timelines[0]?.settings || {
      autoSnap: true,
      snapInterval: 0.25,
      showWaveform: false,
      showGrid: true,
      gridInterval: 1,
    },
  };
}
```

## 5. 内部实现与算法剖析

### 时间轴播放器

```typescript
class TimelinePlayer {
  private currentTime: number;
  private isPlaying: boolean;
  private playbackSpeed: number;
  private startTime: number;

  constructor(private timeline: Timeline) {
    this.currentTime = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.startTime = 0;
  }

  play(): void {
    this.isPlaying = true;
    this.startTime = Date.now() - (this.currentTime * 1000);
    this.startPlayback();
  }

  pause(): void {
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.timeline.duration));
    this.updatePlayback();
  }

  private startPlayback(): void {
    const update = () => {
      if (!this.isPlaying) return;

      const elapsed = (Date.now() - this.startTime) / 1000;
      this.currentTime = elapsed * this.playbackSpeed;

      if (this.currentTime >= this.timeline.duration) {
        this.currentTime = this.timeline.duration;
        this.isPlaying = false;
      }

      this.updatePlayback();
      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  private updatePlayback(): void {
    // 更新所有活动的轨道和剪辑
    const activeTracks = this.getActiveTracks();
    const activeClips = this.getActiveClips();
    
    this.triggerEvents(activeClips);
    this.updateAnimations(activeClips);
  }

  private getActiveTracks(): TimelineTrack[] {
    return this.timeline.tracks.filter(track => 
      this.currentTime >= track.startTime && 
      this.currentTime <= track.endTime && 
      !track.muted
    );
  }

  private getActiveClips(): Array<{ clip: TimelineClip; track: TimelineTrack }> {
    const activeClips: Array<{ clip: TimelineClip; track: TimelineTrack }> = [];
    
    for (const track of this.getActiveTracks()) {
      for (const clip of track.clips) {
        if (this.currentTime >= clip.startTime && this.currentTime <= clip.endTime) {
          activeClips.push({ clip, track });
        }
      }
    }
    
    return activeClips;
  }

  private triggerEvents(activeClips: Array<{ clip: TimelineClip; track: TimelineTrack }>): void {
    for (const { clip } of activeClips) {
      for (const event of clip.events) {
        const clipTime = this.currentTime - clip.startTime;
        if (Math.abs(clipTime - event.time) < 0.01) {
          this.executeEvent(event);
        }
      }
    }
  }

  private executeEvent(event: TimelineEvent): void {
    // 执行事件逻辑
    console.log(`Executing event: ${event.type} at ${event.time}`);
  }

  private updateAnimations(activeClips: Array<{ clip: TimelineClip; track: TimelineTrack }>): void {
    for (const { clip, track } of activeClips) {
      const clipTime = this.currentTime - clip.startTime;
      const normalizedTime = clipTime / clip.duration;
      
      // 应用修剪、速度和循环
      let effectiveTime = normalizedTime * clip.duration;
      effectiveTime += clip.trimStart;
      
      if (clip.loop) {
        effectiveTime = effectiveTime % (clip.duration - clip.trimStart - clip.trimEnd);
      }
      
      if (clip.reverse) {
        effectiveTime = (clip.duration - clip.trimStart - clip.trimEnd) - effectiveTime;
      }
      
      // 更新动画
      this.updateAnimation(clip.animation, effectiveTime, clip.speed);
    }
  }

  private updateAnimation(animationId: string, time: number, speed: number): void {
    // 更新特定动画
    console.log(`Updating animation ${animationId} at time ${time} with speed ${speed}`);
  }
}
```

### 时间轴优化算法

```typescript
class TimelineOptimizer {
  static optimizeOverlaps(timeline: Timeline): Timeline {
    const optimized = { ...timeline };
    
    for (const track of optimized.tracks) {
      const optimizedClips = this.resolveOverlaps(track.clips);
      track.clips = optimizedClips;
    }
    
    return optimized;
  }

  private static resolveOverlaps(clips: TimelineClip[]): TimelineClip[] {
    const sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
    const resolved: TimelineClip[] = [];
    
    for (const clip of sorted) {
      let adjustedClip = { ...clip };
      
      // 检查与已解决剪辑的重叠
      for (const resolvedClip of resolved) {
        if (this.overlaps(adjustedClip, resolvedClip)) {
          adjustedClip.startTime = resolvedClip.endTime;
          adjustedClip.endTime = adjustedClip.startTime + adjustedClip.duration;
        }
      }
      
      resolved.push(adjustedClip);
    }
    
    return resolved;
  }

  private static overlaps(clip1: TimelineClip, clip2: TimelineClip): boolean {
    return clip1.startTime < clip2.endTime && clip1.endTime > clip2.startTime;
  }

  static calculateFrameAtTime(timeline: Timeline, time: number): number {
    return Math.floor(time * timeline.frameRate);
  }

  static calculateTimeAtFrame(timeline: Timeline, frame: number): number {
    return frame / timeline.frameRate;
  }

  static findClosestMarker(timeline: Timeline, time: number): TimelineMarker | null {
    if (timeline.markers.length === 0) return null;
    
    return timeline.markers.reduce((closest, marker) => {
      if (!closest) return marker;
      
      const closestDistance = Math.abs(closest.time - time);
      const currentDistance = Math.abs(marker.time - time);
      
      return currentDistance < closestDistance ? marker : closest;
    });
  }
}
```

### 时间轴序列化

```typescript
class TimelineSerializer {
  static serialize(timeline: Timeline): string {
    return JSON.stringify(timeline, null, 2);
  }

  static deserialize(json: string): Timeline {
    const parsed = JSON.parse(json);
    
    // 验证和修复数据结构
    return this.validateTimeline(parsed);
  }

  private static validateTimeline(timeline: any): Timeline {
    const validated: Timeline = {
      id: timeline.id || `timeline_${Date.now()}`,
      name: timeline.name || 'Untitled Timeline',
      duration: Math.max(0, timeline.duration || 0),
      frameRate: Math.max(1, timeline.frameRate || 30),
      tracks: Array.isArray(timeline.tracks) ? timeline.tracks : [],
      markers: Array.isArray(timeline.markers) ? timeline.markers : [],
      settings: {
        autoSnap: Boolean(timeline.settings?.autoSnap),
        snapInterval: Math.max(0.01, timeline.settings?.snapInterval || 0.25),
        showWaveform: Boolean(timeline.settings?.showWaveform),
        showGrid: Boolean(timeline.settings?.showGrid),
        gridInterval: Math.max(0.01, timeline.settings?.gridInterval || 1),
      },
    };

    // 验证轨道
    validated.tracks = validated.tracks.map(track => this.validateTrack(track));
    
    // 验证标记
    validated.markers = validated.markers.map(marker => this.validateMarker(marker));
    
    return validated;
  }

  private static validateTrack(track: any): TimelineTrack {
    return {
      id: track.id || `track_${Date.now()}`,
      name: track.name || 'Untitled Track',
      type: Object.values(TrackType).includes(track.type) ? track.type : TrackType.Animation,
      startTime: Math.max(0, track.startTime || 0),
      duration: Math.max(0, track.duration || 0),
      endTime: Math.max(0, track.endTime || track.startTime + track.duration || 0),
      clips: Array.isArray(track.clips) ? track.clips.map(clip => this.validateClip(clip)) : [],
      muted: Boolean(track.muted),
      locked: Boolean(track.locked),
      color: track.color || '#000000',
      zIndex: Math.max(0, track.zIndex || 0),
    };
  }

  private static validateClip(clip: any): TimelineClip {
    return {
      id: clip.id || `clip_${Date.now()}`,
      name: clip.name || 'Untitled Clip',
      startTime: Math.max(0, clip.startTime || 0),
      duration: Math.max(0, clip.duration || 0),
      endTime: Math.max(0, clip.endTime || clip.startTime + clip.duration || 0),
      trimStart: Math.max(0, clip.trimStart || 0),
      trimEnd: Math.max(0, clip.trimEnd || 0),
      speed: Math.max(0.1, clip.speed || 1),
      loop: Boolean(clip.loop),
      reverse: Boolean(clip.reverse),
      animation: clip.animation || '',
      events: Array.isArray(clip.events) ? clip.events.map(event => this.validateEvent(event)) : [],
    };
  }

  private static validateEvent(event: any): TimelineEvent {
    return {
      id: event.id || `event_${Date.now()}`,
      type: Object.values(EventType).includes(event.type) ? event.type : EventType.Trigger,
      time: Math.max(0, event.time || 0),
      data: event.data || {},
      target: event.target || '',
    };
  }

  private static validateMarker(marker: any): TimelineMarker {
    return {
      id: marker.id || `marker_${Date.now()}`,
      name: marker.name || 'Untitled Marker',
      time: Math.max(0, marker.time || 0),
      color: marker.color || '#ffffff',
      note: marker.note || '',
    };
  }
}
```

## 6. 边界条件、错误码与异常处理

### 错误码定义

| 错误码 | 描述 | 触发条件 | 处理策略 |
|--------|------|----------|----------|
| INVALID_TIME | 无效时间 | 时间为负或NaN | 限制到[0, duration]范围 |
| OVERLAPPING_CLIPS | 重叠剪辑 | 剪辑时间重叠 | 自动调整时间或报错 |
| TRACK_OVERFLOW | 轨道溢出 | 剪辑超出轨道范围 | 裁剪或扩展轨道 |
| INVALID_DURATION | 无效持续时间 | 负的持续时间 | 使用最小值0.01 |
| MISSING_ANIMATION | 缺失动画 | 引用的动画不存在 | 使用默认动画 |
| INVALID_FRAMERATE | 无效帧率 | 帧率小于等于0 | 使用默认值30 |
| CYCLE_DETECTED | 循环依赖 | 事件触发循环 | 限制触发深度 |

### 验证函数

```typescript
class TimelineError extends Error {
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TimelineError';
    this.message = `[${code}] ${message}`;
  }
}

function validateTimeline(timeline: Timeline): ValidationResult {
  const errors: string[] = [];

  if (!timeline.id) {
    errors.push('Timeline must have an ID');
  }

  if (!timeline.name) {
    errors.push('Timeline must have a name');
  }

  if (timeline.duration <= 0) {
    errors.push('Timeline duration must be positive');
  }

  if (timeline.frameRate <= 0) {
    errors.push('Frame rate must be positive');
  }

  for (const track of timeline.tracks) {
    const trackValidation = validateTrack(track, timeline.duration);
    if (!trackValidation.valid) {
      errors.push(...trackValidation.errors.map(e => `Track ${track.name}: ${e}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateTrack(track: TimelineTrack, maxDuration: number): ValidationResult {
  const errors: string[] = [];

  if (track.startTime < 0) {
    errors.push('Start time must be non-negative');
  }

  if (track.duration < 0) {
    errors.push('Duration must be non-negative');
  }

  if (track.startTime + track.duration > maxDuration) {
    errors.push('Track exceeds timeline duration');
  }

  for (const clip of track.clips) {
    const clipValidation = validateClip(clip, track.duration);
    if (!clipValidation.valid) {
      errors.push(...clipValidation.errors.map(e => `Clip ${clip.name}: ${e}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateClip(clip: TimelineClip, maxDuration: number): ValidationResult {
  const errors: string[] = [];

  if (clip.startTime < 0) {
    errors.push('Start time must be non-negative');
  }

  if (clip.duration <= 0) {
    errors.push('Duration must be positive');
  }

  if (clip.startTime + clip.duration > maxDuration) {
    errors.push('Clip exceeds track duration');
  }

  if (clip.trimStart < 0 || clip.trimEnd < 0) {
    errors.push('Trim values must be non-negative');
  }

  if (clip.trimStart + clip.trimEnd >= clip.duration) {
    errors.push('Trim values exceed clip duration');
  }

  if (clip.speed <= 0) {
    errors.push('Speed must be positive');
  }

  if (!clip.animation) {
    errors.push('Clip must reference an animation');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## 7. 变更记录与未来演进

### v2.7.0 (2024-08-15)

- 添加时间轴系统支持
- 支持多轨道管理
- 添加事件系统
- 支持标记功能

### v2.0.0 (2024-08-01)

- 重构时间轴架构
- 支持实时预览
- 添加性能优化
- 支持序列化

### v1.9.0 (2024-07-25)

- 初始时间轴实现
- 基础轨道支持
- 简单剪辑管理
- 基础事件系统

### 路线图

- **v3.0.0**: 支持实时协作编辑
- **v3.1.0**: 添加时间轴版本控制
- **v3.2.0**: 支持云端同步
- **v3.3.0**: 添加AI辅助编辑
---
title: "内存泄漏检测器"
description: "实时监控内存使用、检测内存泄漏模式和可疑对象，提供详细的分析报告和修复建议"
tags: ["memory-leak", "memory-management", "performance-monitoring", "garbage-collection", "resource-tracking", "debugging"]
category: "reference"
audience: "developer"
version: "1.0.0"
last_updated: "2025-12-17"
related_docs: ["performance-analyzer.md", "math-object-pool-optimization.md", "performance-optimization-demo.md"]
prerequisites: ["performance-optimization.md", "../rhi/performance/index.md"]
complexity: "advanced"
estimated_read_time: 25
---

# 内存泄漏检测器

## 概述

内存泄漏检测器实时监控系统内存使用情况，自动检测内存泄漏模式和可疑对象，提供详细的分析报告和修复建议。支持WebGL资源追踪、循环引用检测和性能影响分析。

## 核心实现

### 1. 内存追踪系统

```typescript
/**
 * memory-tracker.ts
 * 内存追踪和监控系统
 */

export interface MemoryTracker {
    objectId: string;
    type: string;
    size: number;
    createdAt: number;
    lastAccessed: number;
    stackTrace: string;
    refCount: number;
    location: string;    // 创建位置
    tags: string[];      // 自定义标签
}

export interface MemorySnapshot {
    timestamp: number;
    totalObjects: number;
    totalMemory: number;
    byType: Map<string, { count: number; size: number }>;
    byLocation: Map<string, { count: number; size: number }>;
}

export interface MemoryLeakDetectorOptions {
    interval?: number;              // 检测间隔(ms)
    maxTrackedObjects?: number;     // 最大追踪对象数
    autoStart?: boolean;            // 自动开始
    enableStackTrace?: boolean;     // 启用堆栈追踪
    memoryThreshold?: number;       // 内存警告阈值(MB)
}

/**
 * 内存追踪器
 */
export class MemoryTracker {
    private trackers: Map<string, MemoryTracker> = new Map();
    private objectCounter: number = 0;
    private snapshots: MemorySnapshot[] = [];
    private maxSnapshots: number = 100;

    constructor(
        private options: MemoryLeakDetectorOptions = {}
    ) {}

    /**
     * 追踪对象
     */
    public trackObject(obj: any, type: string, size?: number): string {
        const objectId = this.generateObjectId();

        const tracker: MemoryTracker = {
            objectId,
            type,
            size: size || this.estimateObjectSize(obj),
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            stackTrace: this.options.enableStackTrace ? this.captureStackTrace() : '',
            refCount: 1,
            location: this.getObjectLocation(obj),
            tags: []
        };

        this.trackers.set(objectId, tracker);

        // 设置弱引用监听
        this.setupWeakReference(obj, objectId);

        return objectId;
    }

    /**
     * 取消追踪对象
     */
    public untrackObject(objectId: string): void {
        this.trackers.delete(objectId);
    }

    /**
     * 访问对象
     */
    public accessObject(objectId: string): void {
        const tracker = this.trackers.get(objectId);
        if (tracker) {
            tracker.lastAccessed = Date.now();
        }
    }

    /**
     * 添加标签
     */
    public addTag(objectId: string, tag: string): void {
        const tracker = this.trackers.get(objectId);
        if (tracker && !tracker.tags.includes(tag)) {
            tracker.tags.push(tag);
        }
    }

    /**
     * 生成内存快照
     */
    public takeSnapshot(): MemorySnapshot {
        const now = Date.now();
        const byType = new Map<string, { count: number; size: number }>();
        const byLocation = new Map<string, { count: number; size: number }>();

        let totalObjects = 0;
        let totalMemory = 0;

        // 按类型统计
        for (const tracker of this.trackers.values()) {
            totalObjects++;
            totalMemory += tracker.size;

            const typeStats = byType.get(tracker.type) || { count: 0, size: 0 };
            typeStats.count++;
            typeStats.size += tracker.size;
            byType.set(tracker.type, typeStats);

            const locationStats = byLocation.get(tracker.location) || { count: 0, size: 0 };
            locationStats.count++;
            locationStats.size += tracker.size;
            byLocation.set(tracker.location, locationStats);
        }

        const snapshot: MemorySnapshot = {
            timestamp: now,
            totalObjects,
            totalMemory,
            byType,
            byLocation
        };

        this.snapshots.push(snapshot);

        // 限制快照数量
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }

        return snapshot;
    }

    /**
     * 获取内存快照历史
     */
    public getSnapshots(): MemorySnapshot[] {
        return [...this.snapshots];
    }

    /**
     * 分析内存增长趋势
     */
    public analyzeMemoryTrend(): {
        isGrowing: boolean;
        growthRate: number;    // MB/minute
        projectedUsage: number; // 1小时后预估
    } {
        if (this.snapshots.length < 2) {
            return { isGrowing: false, growthRate: 0, projectedUsage: 0 };
        }

        const recent = this.snapshots.slice(-10); // 最近10个快照
        let totalGrowth = 0;
        let timeSpan = 0;

        for (let i = 1; i < recent.length; i++) {
            const current = recent[i];
            const previous = recent[i - 1];
            const memoryGrowth = (current.totalMemory - previous.totalMemory) / 1024 / 1024; // MB
            const timeDiff = (current.timestamp - previous.timestamp) / 1000 / 60; // 分钟

            totalGrowth += memoryGrowth;
            timeSpan += timeDiff;
        }

        const growthRate = timeSpan > 0 ? totalGrowth / timeSpan : 0;
        const currentUsage = this.snapshots[this.snapshots.length - 1].totalMemory / 1024 / 1024;
        const projectedUsage = currentUsage + (growthRate * 60); // 1小时后

        return {
            isGrowing: growthRate > 1, // 每分钟增长超过1MB
            growthRate,
            projectedUsage
        };
    }

    /**
     * 获取内存统计信息
     */
    public getStatistics(): {
        totalObjects: number;
        totalMemory: number;
        averageSize: number;
        oldestObject: number;
        byType: Map<string, number>;
    } {
        let totalMemory = 0;
        let oldestObject = Date.now();
        const byType = new Map<string, number>();

        for (const tracker of this.trackers.values()) {
            totalMemory += tracker.size;
            oldestObject = Math.min(oldestObject, tracker.createdAt);

            const count = byType.get(tracker.type) || 0;
            byType.set(tracker.type, count + 1);
        }

        return {
            totalObjects: this.trackers.size,
            totalMemory,
            averageSize: this.trackers.size > 0 ? totalMemory / this.trackers.size : 0,
            oldestObject: this.trackers.size > 0 ? oldestObject : 0,
            byType
        };
    }

    /**
     * 生成唯一对象ID
     */
    private generateObjectId(): string {
        return `obj_${++this.objectCounter}_${Date.now()}`;
    }

    /**
     * 估算对象大小
     */
    private estimateObjectSize(obj: any): number {
        if (obj === null || obj === undefined) return 8;

        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                return obj.length * 8 + 24; // 数组元素 + 数组开销
            } else if (obj instanceof Float32Array) {
                return obj.byteLength + 24;
            } else if (obj instanceof Uint8Array || obj instanceof Uint16Array || obj instanceof Uint32Array) {
                return obj.byteLength + 24;
            } else {
                // 简化的对象大小估算
                return Object.keys(obj).length * 8 + 24;
            }
        }

        return 8; // 基本类型
    }

    /**
     * 捕获堆栈追踪
     */
    private captureStackTrace(): string {
        try {
            throw new Error();
        } catch (e) {
            const stack = (e as Error).stack;
            return stack ? stack.substring(0, 500) : '';
        }
    }

    /**
     * 获取对象创建位置
     */
    private getObjectLocation(obj: any): string {
        try {
            const constructor = obj.constructor;
            if (constructor && constructor.name) {
                return constructor.name;
            }
            return typeof obj;
        } catch {
            return 'unknown';
        }
    }

    /**
     * 设置弱引用监听
     */
    private setupWeakReference(obj: any, objectId: string): void {
        if (typeof FinalizationRegistry !== 'undefined') {
            const registry = new FinalizationRegistry((heldValue: string) => {
                this.trackers.delete(heldValue);
            });
            registry.register(obj, objectId);
        }
    }

    /**
     * 清理过期追踪器
     */
    public cleanupExpiredTrackers(maxAge: number = 60000): void {
        const now = Date.now();
        const expiredObjects: string[] = [];

        for (const [id, tracker] of this.trackers.entries()) {
            const age = now - tracker.createdAt;
            const timeSinceAccess = now - tracker.lastAccessed;

            // 超过最大年龄且长时间未访问的对象
            if (age > maxAge && timeSinceAccess > maxAge / 2) {
                expiredObjects.push(id);
            }
        }

        expiredObjects.forEach(id => this.trackers.delete(id));

        if (expiredObjects.length > 0) {
            console.log(`清理了 ${expiredObjects.length} 个过期的追踪器`);
        }
    }
}
```

### 2. 内存泄漏检测器

```typescript
/**
 * memory-leak-detector.ts
 * 内存泄漏检测和分析系统
 */

export interface MemoryLeakPattern {
    type: 'circular_reference' | 'event_listener' | 'timer' | 'closure' | 'dom_reference' | 'webgl_resource';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    objects: MemoryTracker[];
    location: string;
    fix: string;
}

export interface MemoryLeakReport {
    timestamp: number;
    summary: {
        totalObjects: number;
        totalMemory: number;
        suspiciousObjects: number;
        leaksDetected: number;
        memoryTrend: {
            isGrowing: boolean;
            growthRate: number;
            projectedUsage: number;
        };
    };
    patterns: MemoryLeakPattern[];
    topLeakers: {
        type: string;
        count: number;
        memory: number;
        location: string;
    }[];
    recommendations: string[];
}

/**
 * 内存泄漏检测器
 */
export class MemoryLeakDetector {
    private tracker: MemoryTracker;
    private detectionInterval: number = 30000; // 30秒
    private enabled: boolean = false;
    private detectionTimer: number | null = null;
    private leakThresholds = {
        maxObjectAge: 60000,      // 最大对象年龄(ms)
        maxInactivityTime: 30000, // 最大不活动时间(ms)
        memoryGrowthRate: 5,      // 内存增长率(MB/min)
        suspiciousCount: 100      // 可疑对象数量阈值
    };

    constructor(options: MemoryLeakDetectorOptions = {}) {
        this.tracker = new MemoryTracker(options);
        this.detectionInterval = options.interval || 30000;

        if (options.autoStart) {
            this.start();
        }
    }

    /**
     * 开始监控
     */
    public start(): void {
        if (this.enabled) return;

        this.enabled = true;
        this.tracker.takeSnapshot();

        this.detectionTimer = window.setInterval(() => {
            this.performDetection();
        }, this.detectionInterval);

        console.log('内存泄漏检测器已启动');
    }

    /**
     * 停止监控
     */
    public stop(): void {
        this.enabled = false;
        if (this.detectionTimer) {
            clearInterval(this.detectionTimer);
            this.detectionTimer = null;
        }
        console.log('内存泄漏检测器已停止');
    }

    /**
     * 执行泄漏检测
     */
    public performDetection(): MemoryLeakReport {
        const now = Date.now();

        // 生成内存快照
        const currentSnapshot = this.tracker.takeSnapshot();

        // 分析内存趋势
        const memoryTrend = this.tracker.analyzeMemoryTrend();

        // 获取统计信息
        const stats = this.tracker.getStatistics();

        // 检测可疑对象
        const suspiciousObjects = this.detectSuspiciousObjects();

        // 检测泄漏模式
        const patterns: MemoryLeakPattern[] = [];
        patterns.push(...this.detectCircularReferences());
        patterns.push(...this.detectEventListeners());
        patterns.push(...this.detectTimers());
        patterns.push(...this.detectClosures());
        patterns.push(...this.detectWebGLResources());

        // 生成top泄漏者
        const topLeakers = this.identifyTopLeakers();

        // 生成报告
        const report: MemoryLeakReport = {
            timestamp: now,
            summary: {
                totalObjects: stats.totalObjects,
                totalMemory: stats.totalMemory,
                suspiciousObjects: suspiciousObjects.length,
                leaksDetected: patterns.length,
                memoryTrend
            },
            patterns,
            topLeakers,
            recommendations: this.generateRecommendations(patterns, memoryTrend)
        };

        // 输出警告
        this.outputWarnings(report);

        return report;
    }

    /**
     * 检测可疑对象
     */
    private detectSuspiciousObjects(): MemoryTracker[] {
        const now = Date.now();
        const suspicious: MemoryTracker[] = [];

        for (const tracker of this.tracker['trackers'].values()) {
            const age = now - tracker.createdAt;
            const timeSinceAccess = now - tracker.lastAccessed;

            // 长期存活且长时间未访问的对象
            if (age > this.leakThresholds.maxObjectAge &&
                timeSinceAccess > this.leakThresholds.maxInactivityTime) {
                suspicious.push(tracker);
            }

            // 引用计数过高的对象
            if (tracker.refCount > 10) {
                suspicious.push(tracker);
            }

            // 大对象长时间存活
            if (tracker.size > 1024 * 1024 && age > this.leakThresholds.maxObjectAge) {
                suspicious.push(tracker);
            }
        }

        return suspicious;
    }

    /**
     * 检测循环引用
     */
    private detectCircularReferences(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];
        const visited = new Set<any>();

        // 简化的循环引用检测
        for (const tracker of this.tracker['trackers'].values()) {
            if (tracker.type === 'Object' && tracker.refCount > 1) {
                const objects = [tracker];
                const pattern: MemoryLeakPattern = {
                    type: 'circular_reference',
                    severity: 'medium',
                    description: `检测到可能的循环引用，引用计数: ${tracker.refCount}`,
                    objects,
                    location: tracker.location,
                    fix: '检查对象引用关系，使用WeakMap或WeakRef避免循环引用'
                };
                patterns.push(pattern);
            }
        }

        return patterns;
    }

    /**
     * 检测事件监听器泄漏
     */
    private detectEventListeners(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        // 检查长期存活的事件相关对象
        for (const tracker of this.tracker['trackers'].values()) {
            if (tracker.tags.includes('event-listener')) {
                const age = Date.now() - tracker.createdAt;
                if (age > this.leakThresholds.maxObjectAge) {
                    const objects = [tracker];
                    const pattern: MemoryLeakPattern = {
                        type: 'event_listener',
                        severity: 'high',
                        description: `事件监听器长期存活，可能未正确移除`,
                        objects,
                        location: tracker.location,
                        fix: '确保在组件销毁时移除所有事件监听器'
                    };
                    patterns.push(pattern);
                }
            }
        }

        return patterns;
    }

    /**
     * 检测定时器泄漏
     */
    private detectTimers(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        for (const tracker of this.tracker['trackers'].values()) {
            if (tracker.tags.includes('timer')) {
                const objects = [tracker];
                const pattern: MemoryLeakPattern = {
                    type: 'timer',
                    severity: 'medium',
                    description: `定时器可能未正确清理`,
                    objects,
                    location: tracker.location,
                    fix: '使用clearTimeout/clearInterval清理定时器'
                };
                patterns.push(pattern);
            }
        }

        return patterns;
    }

    /**
     * 检测闭包泄漏
     */
    private detectClosures(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        for (const tracker of this.tracker['trackers'].values()) {
            if (tracker.type === 'Function' && tracker.size > 1000) {
                const objects = [tracker];
                const pattern: MemoryLeakPattern = {
                    type: 'closure',
                    severity: 'low',
                    description: `大型闭包可能导致内存泄漏`,
                    objects,
                    location: tracker.location,
                    fix: '避免在闭包中捕获大量外部变量'
                };
                patterns.push(pattern);
            }
        }

        return patterns;
    }

    /**
     * 检测WebGL资源泄漏
     */
    private detectWebGLResources(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        for (const tracker of this.tracker['trackers'].values()) {
            if (tracker.tags.includes('webgl')) {
                const age = Date.now() - tracker.createdAt;
                if (age > this.leakThresholds.maxObjectAge * 2) { // WebGL资源存活时间更长
                    const objects = [tracker];
                    const pattern: MemoryLeakPattern = {
                        type: 'webgl_resource',
                        severity: 'critical',
                        description: `WebGL资源未正确释放`,
                        objects,
                        location: tracker.location,
                        fix: '调用WebGL资源的delete方法释放GPU内存'
                    };
                    patterns.push(pattern);
                }
            }
        }

        return patterns;
    }

    /**
     * 识别主要泄漏者
     */
    private identifyTopLeakers(): {
        type: string;
        count: number;
        memory: number;
        location: string;
    }[] {
        const stats = this.tracker.getStatistics();
        const leakers: {
            type: string;
            count: number;
            memory: number;
            location: string;
        }[] = [];

        // 按类型统计
        for (const [type, count] of stats.byType.entries()) {
            // 计算该类型的总内存使用
            let typeMemory = 0;
            let location = '';

            for (const tracker of this.tracker['trackers'].values()) {
                if (tracker.type === type) {
                    typeMemory += tracker.size;
                    if (!location) location = tracker.location;
                }
            }

            leakers.push({
                type,
                count,
                memory: typeMemory,
                location
            });
        }

        // 按内存使用排序
        leakers.sort((a, b) => b.memory - a.memory);

        return leakers.slice(0, 10); // 返回前10个
    }

    /**
     * 生成修复建议
     */
    private generateRecommendations(patterns: MemoryLeakPattern[], memoryTrend: any): string[] {
        const recommendations: string[] = [];

        // 基于泄漏模式的建议
        if (patterns.some(p => p.type === 'event_listener')) {
            recommendations.push('确保在组件销毁时移除所有事件监听器，可以使用AbortController管理监听器');
        }

        if (patterns.some(p => p.type === 'timer')) {
            recommendations.push('使用clearTimeout/clearInterval清理未使用的定时器，考虑使用requestAnimationFrame代替setInterval');
        }

        if (patterns.some(p => p.type === 'webgl_resource')) {
            recommendations.push('及时调用WebGL资源的delete方法，使用资源管理器统一管理WebGL对象生命周期');
        }

        if (patterns.some(p => p.type === 'circular_reference')) {
            recommendations.push('使用WeakMap或WeakRef避免循环引用，考虑重构对象关系');
        }

        // 基于内存趋势的建议
        if (memoryTrend.isGrowing) {
            recommendations.push(`内存增长率较高 (${memoryTrend.growthRate.toFixed(2)} MB/min)，建议检查对象生命周期管理`);
        }

        if (memoryTrend.projectedUsage > 500) {
            recommendations.push(`预计1小时后内存使用将达到 ${memoryTrend.projectedUsage.toFixed(1)} MB，建议立即优化`);
        }

        // 通用建议
        recommendations.push('定期调用垃圾回收进行内存清理（如果可用）');
        recommendations.push('使用对象池重用对象，减少频繁的内存分配');
        recommendations.push('启用生产环境的内存监控，及时发现异常内存增长');

        return recommendations;
    }

    /**
     * 输出警告信息
     */
    private outputWarnings(report: MemoryLeakReport): void {
        if (report.summary.leaksDetected > 0) {
            console.warn(`🚨 检测到 ${report.summary.leaksDetected} 个内存泄漏模式`);
        }

        if (report.summary.suspiciousObjects > this.leakThresholds.suspiciousCount) {
            console.warn(`⚠️ 发现 ${report.summary.suspiciousObjects} 个可疑对象`);
        }

        if (report.summary.memoryTrend.isGrowing) {
            console.warn(`📈 内存正在增长，增长率: ${report.summary.memoryTrend.growthRate.toFixed(2)} MB/min`);
        }

        // 输出关键模式
        report.patterns
            .filter(p => p.severity === 'critical' || p.severity === 'high')
            .forEach(pattern => {
                console.error(`🔴 ${pattern.description} (位置: ${pattern.location})`);
            });
    }

    /**
     * 公共API - 追踪对象
     */
    public trackObject(obj: any, type: string, size?: number): string {
        return this.tracker.trackObject(obj, type, size);
    }

    /**
     * 公共API - 取消追踪
     */
    public untrackObject(objectId: string): void {
        this.tracker.untrackObject(objectId);
    }

    /**
     * 公共API - 添加标签
     */
    public addTag(objectId: string, tag: string): void {
        this.tracker.addTag(objectId, tag);
    }

    /**
     * 公共API - 获取内存统计
     */
    public getStatistics() {
        return this.tracker.getStatistics();
    }

    /**
     * 公共API - 获取内存快照
     */
    public getSnapshots() {
        return this.tracker.getSnapshots();
    }
}
```

## 使用示例

### 基本使用

```typescript
/**
 * memory-leak-detector-usage.ts
 * 内存泄漏检测器使用示例
 */

import { MemoryLeakDetector } from './memory-leak-detector';

// 创建检测器
const detector = new MemoryLeakDetector({
    interval: 30000,        // 30秒检测一次
    autoStart: true,        // 自动开始
    enableStackTrace: true, // 启用堆栈追踪
    memoryThreshold: 100    // 100MB警告阈值
});

/**
 * 追踪WebGL资源
 */
export function trackWebGLResources(gl: WebGLRenderingContext): void {
    // 追踪纹理
    const textureId = detector.trackObject(gl.createTexture(), 'WebGLTexture');
    detector.addTag(textureId, 'webgl');

    // 追踪缓冲区
    const bufferId = detector.trackObject(gl.createBuffer(), 'WebGLBuffer');
    detector.addTag(bufferId, 'webgl');

    // 追踪着色器
    const shaderId = detector.trackObject(gl.createShader(gl.VERTEX_SHADER), 'WebGLShader');
    detector.addTag(shaderId, 'webgl');

    // 在适当时机清理资源
    // gl.deleteTexture(texture);
    // detector.untrackObject(textureId);
}

/**
 * 追踪事件监听器
 */
export function trackEventListeners(element: HTMLElement): void {
    const handler = () => console.log('Event handled');

    // 追踪事件监听器
    const listenerId = detector.trackObject(handler, 'EventListener');
    detector.addTag(listenerId, 'event-listener');

    element.addEventListener('click', handler);

    // 在适当时机移除监听器
    // element.removeEventListener('click', handler);
    // detector.untrackObject(listenerId);
}

/**
 * 追踪定时器
 */
export function trackTimers(): void {
    const timer = setInterval(() => {
        console.log('Timer tick');
    }, 1000);

    // 追踪定时器
    const timerId = detector.trackObject(timer, 'Timer');
    detector.addTag(timerId, 'timer');

    // 在适当时机清理定时器
    // clearInterval(timer);
    // detector.untrackObject(timerId);
}

/**
 * 追踪大型对象
 */
export function trackLargeObjects(): void {
    const largeArray = new Float32Array(1000000);

    // 追踪大型数组
    const arrayId = detector.trackObject(largeArray, 'Float32Array', largeArray.byteLength);

    // 追踪复杂对象
    const complexObject = {
        data: new Array(10000).fill(0).map(() => ({ value: Math.random() })),
        metadata: { created: Date.now(), version: '1.0' }
    };

    const objectId = detector.trackObject(complexObject, 'ComplexObject');

    return { arrayId, objectId };
}

/**
 * 手动执行泄漏检测
 */
export function performLeakCheck(): void {
    const report = detector.performDetection();

    console.group('内存泄漏检测报告');
    console.log('检测时间:', new Date(report.timestamp));
    console.log('总对象数:', report.summary.totalObjects);
    console.log('总内存使用:', (report.summary.totalMemory / 1024 / 1024).toFixed(2) + ' MB');
    console.log('可疑对象:', report.summary.suspiciousObjects);
    console.log('检测到的泄漏:', report.summary.leaksDetected);

    if (report.patterns.length > 0) {
        console.log('泄漏模式:');
        report.patterns.forEach(pattern => {
            console.log(`- ${pattern.type}: ${pattern.description}`);
        });
    }

    if (report.recommendations.length > 0) {
        console.log('修复建议:');
        report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }

    console.groupEnd();
}

/**
 * 监控内存趋势
 */
export function monitorMemoryTrend(): void {
    const snapshots = detector.getSnapshots();

    if (snapshots.length >= 2) {
        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots[snapshots.length - 2];

        const memoryGrowth = (latest.totalMemory - previous.totalMemory) / 1024 / 1024;
        const timeDiff = (latest.timestamp - previous.timestamp) / 1000 / 60;
        const growthRate = memoryGrowth / timeDiff;

        console.log(`内存增长率: ${growthRate.toFixed(2)} MB/min`);

        if (growthRate > 5) {
            console.warn('内存增长率过高，建议检查是否存在内存泄漏');
        }
    }
}
```

### 高级配置和监控

```typescript
/**
 * advanced-memory-monitoring.ts
 * 高级内存监控配置
 */

// 自定义检测阈值
const customDetector = new MemoryLeakDetector({
    interval: 15000,           // 15秒检测间隔
    maxTrackedObjects: 20000,   // 最大追踪对象数
    autoStart: false,           // 手动启动
    enableStackTrace: true,     // 启用详细堆栈
    memoryThreshold: 200        // 200MB警告阈值
});

// 设置自定义检测逻辑
class CustomMemoryLeakDetector extends MemoryLeakDetector {
    private customChecks: Array<() => MemoryLeakPattern[]> = [];

    /**
     * 添加自定义检测规则
     */
    public addCustomCheck(check: () => MemoryLeakPattern[]): void {
        this.customChecks.push(check);
    }

    /**
     * 执行自定义检测
     */
    protected performDetection(): MemoryLeakReport {
        const baseReport = super.performDetection();

        // 执行自定义检测
        for (const check of this.customChecks) {
            try {
                const patterns = check();
                baseReport.patterns.push(...patterns);
            } catch (error) {
                console.error('自定义检测规则执行失败:', error);
            }
        }

        return baseReport;
    }
}

// 使用自定义检测器
const customDetector = new CustomMemoryLeakDetector();

// 添加特定应用的检测规则
customDetector.addCustomCheck(() => {
    const patterns: MemoryLeakPattern[] = [];

    // 检测特定类型对象的泄漏
    // 这里可以添加应用特定的检测逻辑

    return patterns;
});

// 启动检测
customDetector.start();
```

## 最佳实践

### 1. 资源生命周期管理

```typescript
/**
 * resource-lifecycle-manager.ts
 * 资源生命周期管理器
 */

class ResourceManager {
    private detector: MemoryLeakDetector;
    private resources: Map<string, any> = new Map();

    constructor(detector: MemoryLeakDetector) {
        this.detector = detector;
    }

    /**
     * 注册资源
     */
    public registerResource(id: string, resource: any, type: string): void {
        const trackerId = this.detector.trackObject(resource, type);
        this.resources.set(id, { resource, trackerId, type });
    }

    /**
     * 释放资源
     */
    public releaseResource(id: string): void {
        const resourceInfo = this.resources.get(id);
        if (resourceInfo) {
            // 执行特定类型的清理逻辑
            this.cleanupResource(resourceInfo.resource, resourceInfo.type);

            // 取消追踪
            this.detector.untrackObject(resourceInfo.trackerId);

            // 从管理器中移除
            this.resources.delete(id);
        }
    }

    /**
     * 清理特定类型的资源
     */
    private cleanupResource(resource: any, type: string): void {
        switch (type) {
            case 'WebGLTexture':
                // (resource as WebGLTexture).delete();
                break;
            case 'WebGLBuffer':
                // (resource as WebGLBuffer).delete();
                break;
            case 'Timer':
                clearInterval(resource);
                break;
            // 其他类型的清理逻辑
        }
    }

    /**
     * 释放所有资源
     */
    public releaseAll(): void {
        for (const id of this.resources.keys()) {
            this.releaseResource(id);
        }
    }
}
```

### 2. 内存使用监控仪表板

```typescript
/**
 * memory-dashboard.ts
 * 内存使用监控仪表板
 */

class MemoryDashboard {
    private detector: MemoryLeakDetector;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(detector: MemoryLeakDetector, canvas: HTMLCanvasElement) {
        this.detector = detector;
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取2D渲染上下文');
        this.ctx = ctx;
    }

    /**
     * 更新仪表板
     */
    public update(): void {
        const report = this.detector.performDetection();
        this.renderDashboard(report);
    }

    /**
     * 渲染仪表板
     */
    private renderDashboard(report: MemoryLeakReport): void {
        const { width, height } = this.canvas;

        // 清空画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);

        // 绘制内存使用图表
        this.renderMemoryChart(report);

        // 绘制泄漏模式
        this.renderLeakPatterns(report);

        // 绘制统计信息
        this.renderStatistics(report);
    }

    /**
     * 渲染内存使用图表
     */
    private renderMemoryChart(report: MemoryLeakReport): void {
        const snapshots = this.detector.getSnapshots();
        if (snapshots.length < 2) return;

        const chartX = 20;
        const chartY = 20;
        const chartWidth = this.canvas.width - 40;
        const chartHeight = 150;

        // 绘制图表背景
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);

        // 绘制内存曲线
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const maxMemory = Math.max(...snapshots.map(s => s.totalMemory)) / 1024 / 1024;

        for (let i = 0; i < snapshots.length; i++) {
            const snapshot = snapshots[i];
            const memoryMB = snapshot.totalMemory / 1024 / 1024;
            const x = chartX + (i / (snapshots.length - 1)) * chartWidth;
            const y = chartY + chartHeight - (memoryMB / maxMemory) * chartHeight;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // 绘制标签
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`内存使用 (MB): ${maxMemory.toFixed(1)}`, chartX, chartY - 5);
    }

    /**
     * 渲染泄漏模式
     */
    private renderLeakPatterns(report: MemoryLeakReport): void {
        const startY = 200;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('检测到的泄漏模式:', 20, startY);

        report.patterns.forEach((pattern, index) => {
            const y = startY + 25 + index * 20;
            const color = this.getSeverityColor(pattern.severity);

            this.ctx.fillStyle = color;
            this.ctx.fillText(`• ${pattern.type}: ${pattern.description}`, 30, y);
        });
    }

    /**
     * 渲染统计信息
     */
    private renderStatistics(report: MemoryLeakReport): void {
        const statsY = 350;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px monospace';

        const stats = [
            `总对象数: ${report.summary.totalObjects}`,
            `总内存: ${(report.summary.totalMemory / 1024 / 1024).toFixed(2)} MB`,
            `可疑对象: ${report.summary.suspiciousObjects}`,
            `增长率: ${report.summary.memoryTrend.growthRate.toFixed(2)} MB/min`
        ];

        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, 20, statsY + index * 20);
        });
    }

    /**
     * 获取严重程度颜色
     */
    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical': return '#ff0000';
            case 'high': return '#ff6600';
            case 'medium': return '#ffaa00';
            case 'low': return '#ffff00';
            default: return '#ffffff';
        }
    }
}
```

## 相关文档

- [性能分析器](./performance-analyzer.md) - 监控性能指标
- [Math对象池优化](./math-object-pool-optimization.md) - 减少内存分配
- [性能优化完整演示](./performance-optimization-demo.md) - 综合应用示例
- [WebGL性能指南](../rhi/performance/index.md) - WebGL资源优化
/**
 * TypedComponentStorage 测试
 * 测试 TypedArray 组件存储的功能
 */
import { describe, it, expect } from '@jest/globals';

import {
  TypedComponentStorage,
  NumericComponentTypes,
  createNumericStorage,
} from '../../../src/ecs/typed-component-storage';
import { EntityId } from '../../../src/ecs/entity-id';

describe('TypedComponentStorage', () => {
  describe('构造函数', () => {
    it('应该使用默认容量创建存储', () => {
      const storage = new TypedComponentStorage(Float32Array, 3);
      expect(storage.getCapacity()).toBe(1024);
      expect(storage.getCount()).toBe(0);
      expect(storage.getStride()).toBe(3);
    });

    it('应该使用指定容量创建存储', () => {
      const storage = new TypedComponentStorage(Float32Array, 4, 100);
      expect(storage.getCapacity()).toBe(100);
      expect(storage.getStride()).toBe(4);
    });

    it('应该支持不同的 TypedArray 类型', () => {
      const float32Storage = new TypedComponentStorage(Float32Array, 3, 10);
      const int32Storage = new TypedComponentStorage(Int32Array, 2, 10);
      const uint8Storage = new TypedComponentStorage(Uint8Array, 4, 10);

      expect(float32Storage.getFullBuffer()).toBeInstanceOf(Float32Array);
      expect(int32Storage.getFullBuffer()).toBeInstanceOf(Int32Array);
      expect(uint8Storage.getFullBuffer()).toBeInstanceOf(Uint8Array);
    });
  });

  describe('add 方法', () => {
    it('应该添加实体并返回索引', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      const index = storage.add(entity, [10, 20, 30]);

      expect(index).toBe(0);
      expect(storage.getCount()).toBe(1);
      expect(storage.has(entity)).toBe(true);
    });

    it('应该正确存储数据', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const view = storage.getView(entity);

      expect(view).toBeDefined();
      expect(view![0]).toBe(10);
      expect(view![1]).toBe(20);
      expect(view![2]).toBe(30);
    });

    it('应该在没有初始值时清零', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity);
      const view = storage.getView(entity);

      expect(view![0]).toBe(0);
      expect(view![1]).toBe(0);
      expect(view![2]).toBe(0);
    });

    it('应该更新已存在实体的数据', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const index = storage.add(entity, [100, 200, 300]);

      expect(index).toBe(0);
      expect(storage.getCount()).toBe(1);

      const view = storage.getView(entity);
      expect(view![0]).toBe(100);
      expect(view![1]).toBe(200);
      expect(view![2]).toBe(300);
    });

    it('应该支持多个实体', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);
      storage.add(entity3, [7, 8, 9]);

      expect(storage.getCount()).toBe(3);
      expect(storage.getView(entity1)![0]).toBe(1);
      expect(storage.getView(entity2)![0]).toBe(4);
      expect(storage.getView(entity3)![0]).toBe(7);
    });
  });

  describe('remove 方法', () => {
    it('应该移除实体', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const result = storage.remove(entity);

      expect(result).toBe(true);
      expect(storage.getCount()).toBe(0);
      expect(storage.has(entity)).toBe(false);
    });

    it('应该返回 false 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      const result = storage.remove(entity);

      expect(result).toBe(false);
    });

    it('应该使用 swap-remove 策略', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);
      storage.add(entity3, [7, 8, 9]);

      // 移除中间的实体
      storage.remove(entity2);

      expect(storage.getCount()).toBe(2);
      expect(storage.has(entity1)).toBe(true);
      expect(storage.has(entity2)).toBe(false);
      expect(storage.has(entity3)).toBe(true);

      // entity3 应该被移动到 entity2 的位置
      expect(storage.getIndex(entity3)).toBe(1);
    });
  });

  describe('has 方法', () => {
    it('应该返回 true 如果实体存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);

      expect(storage.has(entity)).toBe(true);
    });

    it('应该返回 false 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      expect(storage.has(entity)).toBe(false);
    });
  });

  describe('getIndex 方法', () => {
    it('应该返回实体的索引', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);

      expect(storage.getIndex(entity)).toBe(0);
    });

    it('应该返回 -1 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      expect(storage.getIndex(entity)).toBe(-1);
    });
  });

  describe('getView 方法', () => {
    it('应该返回数据视图', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const view = storage.getView(entity);

      expect(view).toBeInstanceOf(Float32Array);
      expect(view!.length).toBe(3);
    });

    it('应该返回 undefined 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      expect(storage.getView(entity)).toBeUndefined();
    });

    it('视图应该是原始数据的引用', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const view = storage.getView(entity)!;

      // 修改视图应该影响原始数据
      view[0] = 100;

      const newView = storage.getView(entity)!;
      expect(newView[0]).toBe(100);
    });
  });

  describe('getViewByIndex 方法', () => {
    it('应该通过索引返回数据视图', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const view = storage.getViewByIndex(0);

      expect(view[0]).toBe(10);
      expect(view[1]).toBe(20);
      expect(view[2]).toBe(30);
    });
  });

  describe('set 方法', () => {
    it('应该设置实体数据', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const result = storage.set(entity, [100, 200, 300]);

      expect(result).toBe(true);
      expect(storage.getView(entity)![0]).toBe(100);
    });

    it('应该返回 false 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      const result = storage.set(entity, [100, 200, 300]);

      expect(result).toBe(false);
    });
  });

  describe('setValues 方法', () => {
    it('应该通过索引设置数据', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      storage.setValues(0, [100, 200, 300]);

      expect(storage.getView(entity)![0]).toBe(100);
    });

    it('应该只设置提供的值数量', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      storage.setValues(0, [100, 200]); // 只提供 2 个值

      expect(storage.getView(entity)![0]).toBe(100);
      expect(storage.getView(entity)![1]).toBe(200);
      expect(storage.getView(entity)![2]).toBe(30); // 保持原值
    });
  });

  describe('getElement 方法', () => {
    it('应该获取单个元素值', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);

      expect(storage.getElement(entity, 0)).toBe(10);
      expect(storage.getElement(entity, 1)).toBe(20);
      expect(storage.getElement(entity, 2)).toBe(30);
    });

    it('应该返回 undefined 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      expect(storage.getElement(entity, 0)).toBeUndefined();
    });
  });

  describe('setElement 方法', () => {
    it('应该设置单个元素值', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [10, 20, 30]);
      const result = storage.setElement(entity, 1, 200);

      expect(result).toBe(true);
      expect(storage.getElement(entity, 1)).toBe(200);
    });

    it('应该返回 false 如果实体不存在', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      const result = storage.setElement(entity, 0, 100);

      expect(result).toBe(false);
    });
  });

  describe('getRawBuffer 方法', () => {
    it('应该返回包含所有有效数据的缓冲区', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      const buffer = storage.getRawBuffer();

      expect(buffer.length).toBe(6); // 2 entities * 3 stride
      expect(buffer[0]).toBe(1);
      expect(buffer[3]).toBe(4);
    });
  });

  describe('getFullBuffer 方法', () => {
    it('应该返回完整的数据数组', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity = EntityId.create(1, 0);

      storage.add(entity, [1, 2, 3]);

      const buffer = storage.getFullBuffer();

      expect(buffer.length).toBe(30); // 10 capacity * 3 stride
    });
  });

  describe('forEach 方法', () => {
    it('应该遍历所有实体数据', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      const results: Array<{ entity: number; data: number[] }> = [];
      storage.forEach((entity, data, index) => {
        results.push({ entity, data: Array.from(data) });
      });

      expect(results.length).toBe(2);
      expect(results[0].data).toEqual([1, 2, 3]);
      expect(results[1].data).toEqual([4, 5, 6]);
    });
  });

  describe('forEachRaw 方法', () => {
    it('应该提供原始数组访问', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      let capturedData: Float32Array | null = null;
      let capturedCount = 0;
      let capturedStride = 0;

      storage.forEachRaw((data, count, stride) => {
        capturedData = data as Float32Array;
        capturedCount = count;
        capturedStride = stride;
      });

      expect(capturedCount).toBe(2);
      expect(capturedStride).toBe(3);
      expect(capturedData).not.toBeNull();
    });
  });

  describe('clear 方法', () => {
    it('应该清空存储', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      storage.clear();

      expect(storage.getCount()).toBe(0);
      expect(storage.has(entity1)).toBe(false);
      expect(storage.has(entity2)).toBe(false);
    });
  });

  describe('自动扩容', () => {
    it('应该在容量不足时自动扩容', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 2);

      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);
      const entity3 = EntityId.create(3, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      expect(storage.getCapacity()).toBe(2);

      storage.add(entity3, [7, 8, 9]);

      expect(storage.getCapacity()).toBe(4); // 扩容为 2 倍
      expect(storage.getCount()).toBe(3);
      expect(storage.getView(entity3)![0]).toBe(7);
    });
  });

  describe('getStats 方法', () => {
    it('应该返回统计信息', () => {
      const storage = new TypedComponentStorage(Float32Array, 3, 10);
      const entity1 = EntityId.create(1, 0);
      const entity2 = EntityId.create(2, 0);

      storage.add(entity1, [1, 2, 3]);
      storage.add(entity2, [4, 5, 6]);

      const stats = storage.getStats();

      expect(stats.count).toBe(2);
      expect(stats.capacity).toBe(10);
      expect(stats.stride).toBe(3);
      expect(stats.memoryBytes).toBe(10 * 3 * 4); // Float32 = 4 bytes
      expect(stats.utilizationRate).toBe(0.2);
    });
  });
});

describe('NumericComponentTypes', () => {
  it('应该定义 Position 类型', () => {
    expect(NumericComponentTypes.Position.stride).toBe(3);
    expect(NumericComponentTypes.Position.type).toBe(Float32Array);
  });

  it('应该定义 Velocity 类型', () => {
    expect(NumericComponentTypes.Velocity.stride).toBe(3);
    expect(NumericComponentTypes.Velocity.type).toBe(Float32Array);
  });

  it('应该定义 Scale 类型', () => {
    expect(NumericComponentTypes.Scale.stride).toBe(3);
    expect(NumericComponentTypes.Scale.type).toBe(Float32Array);
  });

  it('应该定义 Rotation 类型', () => {
    expect(NumericComponentTypes.Rotation.stride).toBe(4);
    expect(NumericComponentTypes.Rotation.type).toBe(Float32Array);
  });

  it('应该定义 Matrix4 类型', () => {
    expect(NumericComponentTypes.Matrix4.stride).toBe(16);
    expect(NumericComponentTypes.Matrix4.type).toBe(Float32Array);
  });

  it('应该定义 Color 类型', () => {
    expect(NumericComponentTypes.Color.stride).toBe(4);
    expect(NumericComponentTypes.Color.type).toBe(Float32Array);
  });

  it('应该定义 UV 类型', () => {
    expect(NumericComponentTypes.UV.stride).toBe(2);
    expect(NumericComponentTypes.UV.type).toBe(Float32Array);
  });

  it('应该定义 Normal 类型', () => {
    expect(NumericComponentTypes.Normal.stride).toBe(3);
    expect(NumericComponentTypes.Normal.type).toBe(Float32Array);
  });
});

describe('createNumericStorage', () => {
  it('应该创建 Position 存储', () => {
    const storage = createNumericStorage('Position', 100);

    expect(storage.getStride()).toBe(3);
    expect(storage.getCapacity()).toBe(100);
  });

  it('应该创建 Matrix4 存储', () => {
    const storage = createNumericStorage('Matrix4', 50);

    expect(storage.getStride()).toBe(16);
    expect(storage.getCapacity()).toBe(50);
  });

  it('应该使用默认容量', () => {
    const storage = createNumericStorage('Position');

    expect(storage.getCapacity()).toBe(1024);
  });
});

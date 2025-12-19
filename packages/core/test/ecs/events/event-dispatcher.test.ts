/**
 * EventDispatcher 模块测试
 * 测试事件分发系统
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { EventListener } from '../../../src/ecs/events/event-dispatcher';
import { EventDispatcher } from '../../../src/ecs/events/event-dispatcher';
import type { Event } from '../../../src/ecs/events/event';

describe('EventDispatcher - 事件分发器', () => {
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
  });

  describe('on - 添加事件监听', () => {
    it('应该添加事件监听器', () => {
      const callback = jest.fn();
      const listener: EventListener = {
        callback,
        priority: 0,
        once: false,
      };

      dispatcher.on('test', listener);
      dispatcher.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('应该支持多个监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      dispatcher.on('test', { callback: callback1, priority: 0, once: false });
      dispatcher.on('test', { callback: callback2, priority: 0, once: false });
      dispatcher.on('test', { callback: callback3, priority: 0, once: false });

      dispatcher.emit('test');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('应该支持监听不同事件', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      dispatcher.on('event1', { callback: callback1, priority: 0, once: false });
      dispatcher.on('event2', { callback: callback2, priority: 0, once: false });

      dispatcher.emit('event1');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });

    it('应该支持优先级', () => {
      const executionOrder: number[] = [];

      dispatcher.on('test', {
        callback: () => executionOrder.push(1),
        priority: 1,
        once: false,
      });
      dispatcher.on('test', {
        callback: () => executionOrder.push(3),
        priority: 3,
        once: false,
      });
      dispatcher.on('test', {
        callback: () => executionOrder.push(2),
        priority: 2,
        once: false,
      });

      dispatcher.emit('test');

      expect(executionOrder).toEqual([3, 2, 1]); // 优先级高的先执行
    });

    it('应该支持一次性监听器', () => {
      const callback = jest.fn();

      dispatcher.once('test', callback);

      dispatcher.emit('test');
      dispatcher.emit('test');
      dispatcher.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('off - 移除事件监听', () => {
    it('应该移除指定监听器', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const listener1: EventListener = { callback: callback1, priority: 0, once: false };
      const listener2: EventListener = { callback: callback2, priority: 0, once: false };

      dispatcher.on('test', listener1);
      dispatcher.on('test', listener2);

      dispatcher.off('test', listener1);

      dispatcher.emit('test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('移除不存在的监听器应该不报错', () => {
      const listener: EventListener = {
        callback: jest.fn(),
        priority: 0,
        once: false,
      };

      expect(() => {
        dispatcher.off('test', listener);
      }).not.toThrow();
    });
  });

  describe('emit - 派发事件', () => {
    it('应该派发事件给所有监听器', () => {
      const callback = jest.fn();

      dispatcher.on('test', { callback, priority: 0, once: false });

      dispatcher.emit('test');

      expect(callback).toHaveBeenCalled();
    });

    it('应该支持事件数据', () => {
      const callback = jest.fn();

      dispatcher.on('test', { callback, priority: 0, once: false });

      dispatcher.emit('test', { value: 123 });

      expect(callback).toHaveBeenCalled();
      const event = callback.mock.calls[0][0] as Event;
      expect(event.data.value).toBe(123);
    });

    it('没有监听器时应该不报错', () => {
      expect(() => {
        dispatcher.emit('test');
      }).not.toThrow();
    });

    it('应该支持停止传播', () => {
      const callback1 = jest.fn((event: Event) => {
        event.stopImmediatePropagation(); // 使用stopImmediatePropagation阻止当前级别的其他监听器
      });
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      dispatcher.on('test', { callback: callback1, priority: 3, once: false });
      dispatcher.on('test', { callback: callback2, priority: 2, once: false });
      dispatcher.on('test', { callback: callback3, priority: 1, once: false });

      dispatcher.emit('test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });

  // 注意：hasListener方法在当前实现中不存在，已注释
  // describe('hasListener - 检查监听器', () => {
  //   it('应该检测已添加的监听器', () => {
  //     const callback = jest.fn();
  //     dispatcher.on('test', { callback, priority: 0, once: false });
  //     expect(dispatcher.hasListener('test')).toBe(true);
  //   });
  //   it('未添加监听器应该返回false', () => {
  //     expect(dispatcher.hasListener('test')).toBe(false);
  //   });
  // });

  // 注意：removeAllListeners方法在当前实现中不存在，已注释
  // describe('removeAllListeners - 移除所有监听器', () => {
  //   it('应该移除所有事件的所有监听器', () => {
  //     const callback1 = jest.fn();
  //     const callback2 = jest.fn();
  //     const callback3 = jest.fn();
  //     dispatcher.on('event1', { callback: callback1, priority: 0, once: false });
  //     dispatcher.on('event2', { callback: callback2, priority: 0, once: false });
  //     dispatcher.on('event3', { callback: callback3, priority: 0, once: false });
  //     dispatcher.removeAllListeners();
  //     dispatcher.emit('event1');
  //     dispatcher.emit('event2');
  //     dispatcher.emit('event3');
  //     expect(callback1).not.toHaveBeenCalled();
  //     expect(callback2).not.toHaveBeenCalled();
  //     expect(callback3).not.toHaveBeenCalled();
  //   });
  // });

  describe('事件冒泡和捕获', () => {
    it('应该支持事件冒泡', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      child.setParent(parent);

      const parentCallback = jest.fn();
      const childCallback = jest.fn();

      parent.on('test', { callback: parentCallback, priority: 0, once: false });
      child.on('test', { callback: childCallback, priority: 0, once: false });

      child.emit('test', undefined, true); // 第三个参数设置为true启用冒泡

      expect(childCallback).toHaveBeenCalled();
      expect(parentCallback).toHaveBeenCalled();
    });

    it('非冒泡事件不应该传播到父级', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      child.setParent(parent);

      const parentCallback = jest.fn();
      const childCallback = jest.fn();

      parent.on('test', { callback: parentCallback, priority: 0, once: false });
      child.on('test', { callback: childCallback, priority: 0, once: false });

      child.emit('test', undefined, false); // 不冒泡

      expect(childCallback).toHaveBeenCalled();
      expect(parentCallback).not.toHaveBeenCalled();
    });

    it('应该支持停止冒泡', () => {
      const grandparent = new EventDispatcher();
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      parent.setParent(grandparent);
      child.setParent(parent);

      const grandparentCallback = jest.fn();
      const parentCallback = jest.fn((event: Event) => {
        event.stopPropagation();
      });
      const childCallback = jest.fn();

      grandparent.on('test', { callback: grandparentCallback, priority: 0, once: false });
      parent.on('test', { callback: parentCallback, priority: 0, once: false });
      child.on('test', { callback: childCallback, priority: 0, once: false });

      child.emit('test', undefined, true);

      expect(childCallback).toHaveBeenCalled();
      expect(parentCallback).toHaveBeenCalled();
      expect(grandparentCallback).not.toHaveBeenCalled();
    });
  });

  describe('hasEventListener 方法', () => {
    it('应该检测已添加的监听器', () => {
      const callback = jest.fn();
      dispatcher.on('test', { callback, priority: 0, once: false });

      expect(dispatcher.hasEventListener('test')).toBe(true);
    });

    it('未添加监听器应该返回 false', () => {
      expect(dispatcher.hasEventListener('test')).toBe(false);
    });

    it('移除监听器后应该返回 false', () => {
      const callback = jest.fn();
      const listener: EventListener = { callback, priority: 0, once: false };

      dispatcher.on('test', listener);
      dispatcher.off('test', listener);

      expect(dispatcher.hasEventListener('test')).toBe(false);
    });
  });

  describe('getEventListenerCount 方法', () => {
    it('应该返回指定类型的监听器数量', () => {
      dispatcher.on('test', { callback: jest.fn(), priority: 0, once: false });
      dispatcher.on('test', { callback: jest.fn(), priority: 0, once: false });
      dispatcher.on('test', { callback: jest.fn(), priority: 0, once: false });

      expect(dispatcher.getEventListenerCount('test')).toBe(3);
    });

    it('应该返回 0 对于没有监听器的事件类型', () => {
      expect(dispatcher.getEventListenerCount('nonexistent')).toBe(0);
    });

    it('不传参数应该返回所有监听器总数', () => {
      dispatcher.on('event1', { callback: jest.fn(), priority: 0, once: false });
      dispatcher.on('event1', { callback: jest.fn(), priority: 0, once: false });
      dispatcher.on('event2', { callback: jest.fn(), priority: 0, once: false });

      expect(dispatcher.getEventListenerCount()).toBe(3);
    });
  });

  describe('pauseEvents 和 resumeEvents 方法', () => {
    it('暂停后应该不派发事件', () => {
      const callback = jest.fn();
      dispatcher.on('test', { callback, priority: 0, once: false });

      dispatcher.pauseEvents();
      dispatcher.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('恢复后应该正常派发事件', () => {
      const callback = jest.fn();
      dispatcher.on('test', { callback, priority: 0, once: false });

      dispatcher.pauseEvents();
      dispatcher.emit('test');
      expect(callback).not.toHaveBeenCalled();

      dispatcher.resumeEvents();
      dispatcher.emit('test');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('enableCapture 和 enableBubbling 方法', () => {
    it('应该可以禁用事件冒泡', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      child.setParent(parent);
      child.enableBubbling(false);

      const parentCallback = jest.fn();
      const childCallback = jest.fn();

      parent.on('test', { callback: parentCallback, priority: 0, once: false });
      child.on('test', { callback: childCallback, priority: 0, once: false });

      child.emit('test', undefined, true);

      expect(childCallback).toHaveBeenCalled();
      expect(parentCallback).not.toHaveBeenCalled();
    });

    it('应该可以禁用事件捕获', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      child.setParent(parent);
      child.enableCapture(false);

      const captureCallback = jest.fn();
      parent.on('test_capture', { callback: captureCallback, priority: 0, once: false });

      child.emit('test', undefined, true);

      expect(captureCallback).not.toHaveBeenCalled();
    });
  });

  describe('addChild 和 removeChild 方法', () => {
    it('应该添加子分发器', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      parent.addChild(child);

      const parentCallback = jest.fn();
      parent.on('test', { callback: parentCallback, priority: 0, once: false });

      child.emit('test', undefined, true);

      expect(parentCallback).toHaveBeenCalled();
    });

    it('应该移除子分发器', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      parent.addChild(child);
      parent.removeChild(child);

      const parentCallback = jest.fn();
      parent.on('test', { callback: parentCallback, priority: 0, once: false });

      child.emit('test', undefined, true);

      expect(parentCallback).not.toHaveBeenCalled();
    });

    it('应该防止自引用', () => {
      const dispatcher = new EventDispatcher();

      dispatcher.addChild(dispatcher);

      // 不应该抛出错误，但也不应该添加自己为子级
      expect(() => dispatcher.emit('test')).not.toThrow();
    });
  });

  describe('释放', () => {
    it('释放后应该移除所有监听器', () => {
      const callback = jest.fn();

      dispatcher.on('test', { callback, priority: 0, once: false });
      dispatcher.dispose();

      dispatcher.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('释放后应该断开父子关系', () => {
      const parent = new EventDispatcher();
      const child = new EventDispatcher();

      child.setParent(parent);
      child.dispose();

      const parentCallback = jest.fn();
      parent.on('test', { callback: parentCallback, priority: 0, once: false });

      // 子级已释放，不应该触发父级事件
      child.emit('test', undefined, true);

      expect(parentCallback).not.toHaveBeenCalled();
    });

    it('多次释放应该是安全的', () => {
      dispatcher.dispose();
      dispatcher.dispose();
      dispatcher.dispose();

      expect(dispatcher.isDisposed()).toBe(true);
    });
  });

  describe('on 方法的简化调用', () => {
    it('应该支持直接传入回调函数', () => {
      const callback = jest.fn();

      dispatcher.on('test', callback);
      dispatcher.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('应该支持传入回调函数和上下文', () => {
      const context = { value: 42 };
      const callback = jest.fn(function (this: typeof context) {
        expect(this.value).toBe(42);
      });

      dispatcher.on('test', callback, context);
      dispatcher.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('应该支持传入回调函数、上下文和优先级', () => {
      const executionOrder: number[] = [];

      dispatcher.on('test', () => executionOrder.push(1), undefined, 1);
      dispatcher.on('test', () => executionOrder.push(3), undefined, 3);
      dispatcher.on('test', () => executionOrder.push(2), undefined, 2);

      dispatcher.emit('test');

      expect(executionOrder).toEqual([3, 2, 1]);
    });
  });

  describe('off 方法的简化调用', () => {
    it('应该支持通过回调函数移除监听器', () => {
      const callback = jest.fn();

      dispatcher.on('test', callback);
      dispatcher.off('test', callback);
      dispatcher.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('应该支持通过回调函数和上下文精确移除监听器', () => {
      const callback = jest.fn();
      const context1 = { id: 1 };
      const context2 = { id: 2 };

      dispatcher.on('test', callback, context1);
      dispatcher.on('test', callback, context2);

      dispatcher.off('test', callback, context1);
      dispatcher.emit('test');

      // 只有 context2 的监听器应该被调用
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('性能特性', () => {
    it('应该高效处理大量监听器', () => {
      const callbacks: Array<jest.Mock> = [];

      for (let i = 0; i < 100; i++) {
        const callback = jest.fn();
        callbacks.push(callback);
        dispatcher.on('test', { callback, priority: 0, once: false });
      }

      dispatcher.emit('test');

      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it('应该高效处理高频事件', () => {
      const callback = jest.fn();
      dispatcher.on('test', { callback, priority: 0, once: false });

      for (let i = 0; i < 1000; i++) {
        dispatcher.emit('test');
      }

      expect(callback).toHaveBeenCalledTimes(1000);
    });
  });
});

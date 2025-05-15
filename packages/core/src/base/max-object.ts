/**
 * 引擎对象基类
 * 作为引擎中大多数对象的基类，提供唯一标识符、名称管理等基础功能
 */
export abstract class MaxObject {
  /** 对象的唯一标识 */
  readonly tag: string;

  /** 对象的名称 */
  name: string = '';

  /** 对象的类型 */
  protected type: string;

  /** 对象的创建时间(毫秒时间戳) */
  readonly createTime: number;

  /** 对象是否已销毁 */
  protected destroyed: boolean = false;

  constructor () {
    this.createTime = Date.now();
    this.type = this.constructor.name;
    this.tag = this.generateId();
  }

  /**
   * 检查对象是否已被销毁
   * @returns 是否已被销毁
   */
  isDestroyed (): boolean {
    return this.destroyed;
  }

  /** 生成唯一ID */
  protected generateId (): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 销毁对象，释放资源
   * 子类应该重写onDestroy方法进行资源清理
   */
  destroy (): void {
    if (this.destroyed) {return;}
    this.destroyed = true;
    this.onDestroy();
  }

  /**
   * 销毁时的回调，子类应该重写此方法清理自身资源
   * @protected
   */
  protected onDestroy (): void {}
}

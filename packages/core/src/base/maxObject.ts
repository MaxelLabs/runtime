export abstract class MaxObject {
  /** 对象的唯一标识 */
  id: string;

  /** 对象的名称 */
  name: string;

  /** 对象的类型 */
  type: string;

  /** 对象的创建时间 */
  createTime: number;

  /** 对象是否已销毁 */
  destroyed: boolean = false;

  constructor () {
    this.createTime = Date.now();
    this.id = this.generateId();
    this.type = this.constructor.name;
  }

  /** 生成唯一ID */
  protected generateId (): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 销毁对象 */
  destroy (): void {
    if (this.destroyed) {return;}
    this.destroyed = true;
    this.onDestroy();
  }

  /** 销毁时的回调 */
  protected onDestroy (): void {}
}

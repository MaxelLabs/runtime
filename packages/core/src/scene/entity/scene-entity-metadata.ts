/**
 * SceneEntityMetadata - 场景实体元数据组件
 * 用于存储实体的场景相关信息
 */
export class SceneEntityMetadata {
  /** 所属场景 ID */
  sceneId: string = '';
  /** 是否激活 */
  active: boolean = true;

  static fromData(data: Partial<SceneEntityMetadata>): SceneEntityMetadata {
    const component = new SceneEntityMetadata();
    if (data.sceneId !== undefined) {
      component.sceneId = data.sceneId;
    }
    if (data.active !== undefined) {
      component.active = data.active;
    }
    return component;
  }

  clone(): SceneEntityMetadata {
    const cloned = new SceneEntityMetadata();
    cloned.sceneId = this.sceneId;
    cloned.active = this.active;
    return cloned;
  }
}

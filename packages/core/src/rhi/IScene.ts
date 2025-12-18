import type { Entity, EventDispatcher, Component } from '../base';

export interface IScene extends EventDispatcher {
  name: string;

  addEntity(entity: Entity): this;
  removeEntity(entity: Entity | string): this;

  findEntity(id: string): Entity | null;
  findEntityByName(name: string): Entity | null;

  createEntity(name?: string): Entity;

  getAllEntities(): Entity[];
  releaseEntityArray(array: Entity[]): void;

  onLoad(): this;
  onUnload(): this;

  update(deltaTime: number): void;

  getRoot(): Entity;
  getEntityCount(): number;

  clear(): this;
  dispose(): void;

  getEntitiesByTag(tag: string): Entity[];
  findEntitiesByComponent<T extends Component>(componentType: new (...args: any[]) => T): Entity[];

  isActive(): boolean;

  activateEntitiesByTag(tag: string): this;
  deactivateEntitiesByTag(tag: string): this;

  // createGameObject(name?: string): GameObject;
  // addGameObject(gameObject: GameObject): this;
  // removeGameObject(gameObject: GameObject): this;

  // findGameObject(id: string): GameObject | null;
  // findGameObjectByName(name: string): GameObject | null;

  // disposeGameObject(gameObject: GameObject): void;

  // getAllGameObjects(): GameObject[];
  // findGameObjectsByTag(tag: string): GameObject[];

  // traverseHierarchy(callback: (gameObject: GameObject) => void): void;
}

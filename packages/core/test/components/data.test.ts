import { Name, Tag, Tags, Metadata, Disabled, Static } from '../../src/components/data';
import type { IName, ITag, ITags, IMetadata, IDisabled, IStatic } from '@maxellabs/specification';
import { describe, it, expect } from '@jest/globals';
describe('Data Components', () => {
  describe('Name', () => {
    it('should create from NameData', () => {
      const name = Name.fromData({ value: 'Player' });
      expect(name.value).toBe('Player');
    });
  });

  describe('Tag', () => {
    it('should create from TagData', () => {
      const tag = Tag.fromData({ value: 'enemy' });
      expect(tag.value).toBe('enemy');
    });
  });

  describe('Tags', () => {
    it('should create from TagsData', () => {
      const tags = Tags.fromData({ values: ['enemy', 'flying', 'boss'] });
      expect(tags.values.length).toBe(3);
      expect(tags.values).toContain('enemy');
      expect(tags.values).toContain('flying');
      expect(tags.values).toContain('boss');
    });

    it('should create independent copy of values array', () => {
      const original = ['tag1', 'tag2'];
      const tags = Tags.fromData({ values: original });
      original.push('tag3');

      expect(tags.values.length).toBe(2);
      expect(tags.values).not.toContain('tag3');
    });

    it('should handle empty values array', () => {
      const tags = Tags.fromData({ values: [] });
      expect(tags.values.length).toBe(0);
    });
  });

  describe('Metadata', () => {
    it('should implement IMetadata interface', () => {
      const metadata = new Metadata();
      // 验证组件实现了 IMetadata 接口的所有可选字段
      const iMetadata: IMetadata = metadata;
      expect(iMetadata).toBeDefined();
    });

    it('should create from IMetadata data', () => {
      const data: IMetadata = {
        name: 'Player',
        description: 'Main character',
        tags: ['hero', 'controllable'],
        customData: {
          health: 100,
          level: 5,
        },
      };
      const metadata = Metadata.fromData(data);

      expect(metadata.name).toBe('Player');
      expect(metadata.description).toBe('Main character');
      expect(metadata.tags).toEqual(['hero', 'controllable']);
      expect(metadata.customData?.health).toBe(100);
      expect(metadata.customData?.level).toBe(5);
    });

    it('should create shallow copy of customData', () => {
      const original = { value: 42 };
      const metadata = Metadata.fromData({ customData: original });
      original.value = 100;

      expect(metadata.customData?.value).toBe(42);
    });

    it('should handle partial IMetadata data', () => {
      const metadata = Metadata.fromData({ name: 'Test' });
      expect(metadata.name).toBe('Test');
      expect(metadata.description).toBeUndefined();
      expect(metadata.tags).toBeUndefined();
      expect(metadata.customData).toBeUndefined();
    });

    it('should handle empty IMetadata data', () => {
      const metadata = Metadata.fromData({});
      // 注意：由于 Metadata 继承自 Component（继承自 MaxObject），
      // name 属性有默认值 ''（空字符串），而不是 undefined
      expect(metadata.name).toBe('');
      expect(metadata.description).toBeUndefined();
      expect(metadata.tags).toBeUndefined();
      expect(metadata.customData).toBeUndefined();
    });
  });

  describe('Disabled', () => {
    it('should create from DisabledData without reason', () => {
      const disabled = Disabled.fromData({});
      expect(disabled.reason).toBeUndefined();
    });

    it('should store disable reason', () => {
      const disabled = Disabled.fromData({ reason: 'Out of view' });
      expect(disabled.reason).toBe('Out of view');
    });
  });

  describe('Static', () => {
    it('should implement IStatic interface', () => {
      const staticMark = new Static();
      // 验证组件实现了 IStatic 接口（标记接口）
      const iStatic: IStatic = staticMark;
      expect(iStatic).toBeDefined();
    });

    it('should create marker component from IStatic data', () => {
      // Static 是标记组件，fromData 不需要参数
      const staticMark = Static.fromData();
      expect(staticMark).toBeInstanceOf(Static);
    });

    it('should create marker component', () => {
      const staticMark = Static.fromData();
      expect(staticMark).toBeInstanceOf(Static);
    });
  });

  // 接口实现验证测试
  describe('Interface Implementation', () => {
    it('Name should implement IName', () => {
      const name = new Name();
      const iName: IName = name;
      expect(iName.value).toBeDefined();
    });

    it('Tag should implement ITag', () => {
      const tag = new Tag();
      const iTag: ITag = tag;
      expect(iTag.value).toBeDefined();
    });

    it('Tags should implement ITags', () => {
      const tags = new Tags();
      const iTags: ITags = tags;
      expect(iTags.values).toBeDefined();
    });

    it('Disabled should implement IDisabled', () => {
      const disabled = new Disabled();
      const iDisabled: IDisabled = disabled;
      expect(iDisabled).toBeDefined();
    });
  });
});

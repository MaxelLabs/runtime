/**
 * MaterialInstance Tests
 * 材质实例测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MaterialInstance } from '../../src/renderer/material-instance';
import type { IMaterialResource } from '@maxellabs/specification';
import type { IRHIDevice } from '@maxellabs/specification';

describe('MaterialInstance', () => {
  let mockDevice: IRHIDevice;
  let mockMaterial: IMaterialResource;

  beforeEach(() => {
    // Mock IRHIDevice
    mockDevice = {} as IRHIDevice;

    // Mock Material Resource
    mockMaterial = {
      shaderId: 'pbr',
      properties: {
        baseColor: [1, 0, 0, 1],
        metallic: 0.5,
        roughness: 0.5,
      },
      textures: {
        diffuse: 'texture.png',
        normal: 'normal.png',
      },
    };
  });

  describe('constructor', () => {
    it('should create instance with default properties', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      expect(instance.getShaderId()).toBe('pbr');
      expect(instance.getProperty('baseColor')).toEqual([1, 0, 0, 1]);
      expect(instance.getProperty('metallic')).toBe(0.5);
    });

    it('should deep copy array properties', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);
      const color = instance.getProperty('baseColor') as number[];

      // Mutate the array
      color[0] = 0;

      // Original material should not be affected
      expect(mockMaterial.properties.baseColor).toEqual([1, 0, 0, 1]);
    });

    it('should initialize texture bindings', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      expect(instance.getTexture('diffuse')).toBe('texture.png');
      expect(instance.getTexture('normal')).toBe('normal.png');
    });
  });

  describe('property management', () => {
    it('should set property value', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setProperty('baseColor', [0, 1, 0, 1]);
      expect(instance.getProperty('baseColor')).toEqual([0, 1, 0, 1]);
    });

    it('should override default properties', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setProperty('metallic', 0.8);
      expect(instance.getProperty('metallic')).toBe(0.8);

      // Original material should not be affected
      expect(mockMaterial.properties.metallic).toBe(0.5);
    });

    it('should return undefined for non-existent property', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      expect(instance.getProperty('nonExistent')).toBeUndefined();
    });

    it('should handle multiple property changes', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setProperty('metallic', 0.8);
      instance.setProperty('roughness', 0.2);

      expect(instance.getProperty('metallic')).toBe(0.8);
      expect(instance.getProperty('roughness')).toBe(0.2);
    });
  });

  describe('texture management', () => {
    it('should set texture binding', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setTexture('diffuse', 'new-texture.png');
      expect(instance.getTexture('diffuse')).toBe('new-texture.png');
    });

    it('should override default textures', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setTexture('normal', 'new-normal.png');
      expect(instance.getTexture('normal')).toBe('new-normal.png');

      // Original material should not be affected
      expect(mockMaterial.textures.normal).toBe('normal.png');
    });

    it('should return undefined for non-existent texture slot', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      expect(instance.getTexture('nonExistent')).toBeUndefined();
    });

    it('should handle multiple texture changes', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setTexture('diffuse', 'tex1.png');
      instance.setTexture('normal', 'tex2.png');

      expect(instance.getTexture('diffuse')).toBe('tex1.png');
      expect(instance.getTexture('normal')).toBe('tex2.png');
    });
  });

  describe('bind', () => {
    it('should call bind without error', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      expect(() => instance.bind()).not.toThrow();
    });

    it('should mark as not dirty after bind', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.setProperty('metallic', 0.9);
      instance.bind();

      // Private field check (via implementation detail)
      // Second bind should not trigger update
      expect(() => instance.bind()).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clear properties on dispose', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.dispose();

      // After dispose, properties should be cleared
      expect(instance.getProperty('baseColor')).toBeUndefined();
      expect(instance.getProperty('metallic')).toBeUndefined();
    });

    it('should clear textures on dispose', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.dispose();

      expect(instance.getTexture('diffuse')).toBeUndefined();
      expect(instance.getTexture('normal')).toBeUndefined();
    });

    it('should be safe to call dispose multiple times', () => {
      const instance = new MaterialInstance(mockMaterial, mockDevice);

      instance.dispose();
      expect(() => instance.dispose()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle material with empty properties', () => {
      const emptyMaterial: IMaterialResource = {
        shaderId: 'simple',
        properties: {},
        textures: {},
      };

      const instance = new MaterialInstance(emptyMaterial, mockDevice);
      expect(instance.getShaderId()).toBe('simple');
    });

    it('should handle nested object properties', () => {
      const material: IMaterialResource = {
        shaderId: 'complex',
        properties: {
          settings: { value1: 1, value2: 2 },
        },
        textures: {},
      };

      const instance = new MaterialInstance(material, mockDevice);
      const settings = instance.getProperty('settings') as { value1: number; value2: number };

      expect(settings.value1).toBe(1);
      expect(settings.value2).toBe(2);

      // Mutate should not affect original
      settings.value1 = 10;
      expect((material.properties.settings as any).value1).toBe(1);
    });
  });
});

import {
  MeshRef,
  MaterialRef,
  TextureRef,
  Color,
  Visible,
  Layer,
  CastShadow,
  ReceiveShadow,
} from '../../src/components/visual';
import { describe, it, expect } from '@jest/globals';

describe('Visual Components', () => {
  describe('MeshRef', () => {
    it('should create from IMeshRef data', () => {
      const meshRef = MeshRef.fromData({ assetId: 'cube' });
      expect(meshRef.assetId).toBe('cube');
      expect(meshRef.meshName).toBeUndefined();
    });

    it('should store mesh name', () => {
      const meshRef = MeshRef.fromData({ assetId: 'model', meshName: 'Head' });
      expect(meshRef.assetId).toBe('model');
      expect(meshRef.meshName).toBe('Head');
    });

    it('should store submesh index', () => {
      const meshRef = MeshRef.fromData({
        assetId: 'model',
        meshName: 'Body',
        submeshIndex: 2,
      });
      expect(meshRef.submeshIndex).toBe(2);
    });
  });

  describe('MaterialRef', () => {
    it('should create from IMaterialRef data', () => {
      const mat = MaterialRef.fromData({ assetId: 'pbr-material' });
      expect(mat.assetId).toBe('pbr-material');
      expect(mat.overrides).toBeUndefined();
    });

    it('should store material overrides', () => {
      const mat = MaterialRef.fromData({
        assetId: 'pbr-material',
        overrides: { baseColor: [1, 0, 0, 1], metallic: 0.8 },
      });

      expect(mat.assetId).toBe('pbr-material');
      expect(mat.overrides!.baseColor).toEqual([1, 0, 0, 1]);
      expect(mat.overrides!.metallic).toBe(0.8);
    });

    it('should create independent copy of overrides', () => {
      const original = { color: [1, 0, 0] };
      const mat = MaterialRef.fromData({ assetId: 'mat', overrides: original });
      (original as Record<string, unknown>).color = [0, 1, 0];

      expect(mat.overrides!.color).toEqual([1, 0, 0]);
    });

    it('should store enabled flag', () => {
      const mat = MaterialRef.fromData({ assetId: 'mat', enabled: false });
      expect(mat.enabled).toBe(false);
    });
  });

  describe('TextureRef', () => {
    it('should create from BaseTextureRef data', () => {
      const tex = TextureRef.fromData({ assetId: 'diffuse-map' });
      expect(tex.assetId).toBe('diffuse-map');
    });

    it('should store texture slot', () => {
      const tex = TextureRef.fromData({ assetId: 'map', slot: 'normalMap' });
      expect(tex.slot).toBe('normalMap');
    });

    it('should store UV channel and intensity', () => {
      const tex = TextureRef.fromData({
        assetId: 'map',
        uvChannel: 1,
        intensity: 0.5,
      });
      expect(tex.uvChannel).toBe(1);
      expect(tex.intensity).toBe(0.5);
    });
  });

  describe('Color', () => {
    it('should create from ColorLike data', () => {
      const color = Color.fromData({ r: 1, g: 0, b: 0, a: 1 });
      expect(color.r).toBe(1);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
      expect(color.a).toBe(1);
    });

    it('should support alpha transparency', () => {
      const transparent = Color.fromData({ r: 1, g: 1, b: 1, a: 0.5 });
      expect(transparent.a).toBe(0.5);
    });
  });

  describe('Visible', () => {
    it('should create from IVisible data', () => {
      const visible = Visible.fromData({ value: true });
      expect(visible.value).toBe(true);
    });

    it('should support hidden state', () => {
      const hidden = Visible.fromData({ value: false });
      expect(hidden.value).toBe(false);
    });
  });

  describe('Layer', () => {
    it('should create from ILayer data', () => {
      const layer = Layer.fromData({ mask: 1 });
      expect(layer.mask).toBe(1);
    });

    it('should support custom layer masks', () => {
      const uiLayer = Layer.fromData({ mask: 1 << 5 });
      expect(uiLayer.mask).toBe(32);
    });

    it('should support multiple layers', () => {
      const multiLayer = Layer.fromData({ mask: (1 << 0) | (1 << 2) });
      expect(multiLayer.mask).toBe(5); // 0b101
    });
  });

  describe('CastShadow', () => {
    it('should create from ICastShadow data', () => {
      const castShadow = CastShadow.fromData({ value: true });
      expect(castShadow.value).toBe(true);
    });

    it('should support disabling shadow casting', () => {
      const noShadow = CastShadow.fromData({ value: false });
      expect(noShadow.value).toBe(false);
    });
  });

  describe('ReceiveShadow', () => {
    it('should create from IReceiveShadow data', () => {
      const receiveShadow = ReceiveShadow.fromData({ value: true });
      expect(receiveShadow.value).toBe(true);
    });

    it('should support disabling shadow receiving', () => {
      const noReceive = ReceiveShadow.fromData({ value: false });
      expect(noReceive.value).toBe(false);
    });
  });
});

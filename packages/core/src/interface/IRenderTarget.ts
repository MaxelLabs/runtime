import { ITexture } from './ITexture';

export interface IRenderTarget {
    width: number;
    height: number;
    colorTextures: ITexture[];
    depthTexture?: ITexture;
    stencilTexture?: ITexture;
    dispose(): void;
} 
export interface ITexture {
    width: number;
    height: number;
    format: number;
    type: number;
    dispose(): void;
}
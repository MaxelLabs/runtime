export interface IShader {
    vertexSource: string;
    fragmentSource: string;
    dispose(): void;
} 
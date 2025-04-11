export interface IRenderPass {
    begin(): void;
    end(): void;
    dispose(): void;
} 
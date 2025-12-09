### 纹理Mipmap使用设计决策调查报告

### Code Sections (The Evidence)

1. **GLTexture类** (`packages/rhi/src/webgl/resources/GLTexture.ts`)
   - 在第55行：`this.mipLevelCount = descriptor.mipLevelCount || 1;`
   - 在第165-168行：如果mipLevelCount > 1且不是压缩纹理，则自动生成mipmap
   - 纹理创建时默认使用1个mip level（即不生成mipmap）

2. **GLSampler类** (`packages/rhi/src/webgl/resources/GLSampler.ts`)
   - 在第54行：`this.useMipmap = descriptor.useMipmap !== undefined ? descriptor.useMipmap : true;`
   - 在`getMinFilterValue`方法中（第275-288行），根据useMipmap值决定是否使用mipmap过滤
   - 默认开启mipmap（值为true）

3. **GLUtils.filterModeToGL方法** (`packages/rhi/src/webgl/utils/GLUtils.ts`)
   - 在第503-511行：根据第二个参数useMipmap决定返回mipmap相关的过滤模式
   - 注意：这个函数的useMipmap参数不是从GLSampler传递的

4. **旋转立方体演示** (`packages/rhi/demo/src/rotating-cube.ts`)
   - 在第269行：`useMipmap: false, // 明确禁用mipmap`
   - 演示代码中明确禁用了mipmap的使用

5. **纹理描述符** (`packages/specification/src/common/rhi/types/descriptors.ts`)
   - 在第83行：`mipLevelCount?: number;` - 可选属性，默认未提供
   - 纹理创建时没有mipmap相关的直接配置

6. **ProceduralTexture类** (`packages/rhi/demo/src/utils/texture/ProceduralTexture.ts`)
   - 生成程序化纹理的工具类，没有特别的mipmap处理
   - 生成的是基础纹理数据，需要时可以通过update方法重新生成

### Report (The Answers)

#### result
通过调查发现，项目中关于纹理mipmap的使用确实存在设计不一致的情况：

1. **纹理创建默认不启用mipmap**：GLTexture类中`mipLevelCount`默认为1，这意味着不会生成额外的mipmap级别。这是合理的，因为mipmap会占用额外的显存和生成时间。

2. **采样器默认启用mipmap**：GLSampler类中`useMipmap`默认为true，但这只是采样器的一个设置，不会影响纹理本身的mipmap生成。

3. **演示代码明确禁用mipmap**：旋转立方体演示中，采样器配置明确设置了`useMipmap: false`，说明开发者在演示场景中选择了不使用mipmap。

4. **mipmap生成条件**：只有在`mipLevelCount > 1`且纹理不是压缩纹理时，才会调用`gl.generateMipmap()`。

#### conclusions
1. **默认设计策略**：项目采用了一种保守的策略：
   - 纹理默认不生成mipmap（节省显存和生成时间）
   - 采样器默认允许mipmap（提供灵活性）

2. **使用场景分离**：
   - 开发/演示场景：明确禁用mipmap（快速迭代，节省资源）
   - 生产环境：根据需要手动配置mipmap参数

3. **性能考虑**：
   - 程序化纹理（如棋盘格、渐变）通常不需要mipmap
   - 动态生成的纹理使用update方法，可以事后生成mipmap

4. **API设计一致性问题**：纹理描述符中没有直接控制是否生成mipmap的选项，只能通过设置`mipLevelCount`来实现。

#### relations
1. **GLTexture和GLSampler的分离设计**：纹理生成和采样设置是分离的，纹理本身决定是否有mipmap数据，采样器决定是否使用mipmap过滤。

2. **演示代码反映设计意图**：演示中明确禁用mipmap，说明项目的默认策略是避免不必要的mipmap生成。

3. **潜在的性能陷阱**：如果用户不了解这种设计，可能会发现采样器配置允许mipmap，但实际纹理并没有mipmap数据，导致渲染质量不如预期。

4. **扩展机制**：通过extension属性和GLUtils工具类，提供了灵活的配置选项，但增加了使用复杂度。
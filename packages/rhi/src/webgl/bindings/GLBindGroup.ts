import type { IRHIBindGroup, IRHIBindGroupLayout, IRHIBindGroupEntry } from '@maxellabs/core';
import { GLBuffer, UniformType } from '../resources/GLBuffer';
import { GLSampler } from '../resources/GLSampler';
import { WebGLTextureView } from '../resources/GLTextureView';
import { WebGLBindGroupLayout } from './GLBindGroupLayout';

// Helper function to apply uniform data based on name (temporary solution)
function applyKnownUniformFromBufferData(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  data: ArrayBuffer,
  uniformName: string,
  glBuffer?: GLBuffer
) {
  if (!location) {
    console.warn(`无法设置uniform ${uniformName}：location为null`);

    return;
  }

  if (data.byteLength === 0) {
    console.warn(`无法设置uniform ${uniformName}：数据为空`);

    return;
  }

  try {
    // 检查GLBuffer是否提供了类型信息
    const typeInfo = glBuffer?.getTypeInfo?.();

    if (typeInfo && typeInfo.uniformType) {
      // 使用类型信息设置uniform
      const type = typeInfo.uniformType;

      // 处理string类型的uniformType（新的格式）
      if (typeof type === 'string') {
        switch (type) {
          case 'float':
            gl.uniform1f(location, new Float32Array(data, 0, 1)[0]);
            return;
          case 'vec2':
            gl.uniform2fv(location, new Float32Array(data, 0, 2));
            return;
          case 'vec3':
            gl.uniform3fv(location, new Float32Array(data, 0, 3));
            return;
          case 'vec4':
            gl.uniform4fv(location, new Float32Array(data, 0, 4));
            return;
          case 'mat2':
            gl.uniformMatrix2fv(location, false, new Float32Array(data, 0, 4));
            return;
          case 'mat3':
            gl.uniformMatrix3fv(location, false, new Float32Array(data, 0, 9));
            return;
          case 'mat4':
            gl.uniformMatrix4fv(location, false, new Float32Array(data, 0, 16));
            return;
          case 'int':
            gl.uniform1i(location, new Int32Array(data, 0, 1)[0]);
            return;
          default:
            console.warn(`未知的string类型uniformType: ${type} 用于 ${uniformName}`);
        }
      } else {
        // 处理enum类型的uniformType（旧的格式）
        switch (type) {
          // 矩阵类型
          case UniformType.FLOAT_MAT2:
            gl.uniformMatrix2fv(location, false, new Float32Array(data, 0, 4));
            return;
          case UniformType.FLOAT_MAT3:
            gl.uniformMatrix3fv(location, false, new Float32Array(data, 0, 9));
            return;
          case UniformType.FLOAT_MAT4:
            gl.uniformMatrix4fv(location, false, new Float32Array(data, 0, 16));
            return;
          // 向量类型
          case UniformType.FLOAT:
            gl.uniform1f(location, new Float32Array(data, 0, 1)[0]);
            return;
          case UniformType.FLOAT_VEC2:
            gl.uniform2fv(location, new Float32Array(data, 0, 2));
            return;
          case UniformType.FLOAT_VEC3:
            gl.uniform3fv(location, new Float32Array(data, 0, 3));
            return;
          case UniformType.FLOAT_VEC4:
            gl.uniform4fv(location, new Float32Array(data, 0, 4));
            return;
          // 整数类型
          case UniformType.INT:
            gl.uniform1i(location, new Int32Array(data, 0, 1)[0]);
            return;
          case UniformType.INT_VEC2:
            gl.uniform2iv(location, new Int32Array(data, 0, 2));
            return;
          case UniformType.INT_VEC3:
            gl.uniform3iv(location, new Int32Array(data, 0, 3));
            return;
          case UniformType.INT_VEC4:
            gl.uniform4iv(location, new Int32Array(data, 0, 4));
            return;
          default:
            console.warn(`未处理的enum类型uniformType: ${type} 用于 ${uniformName}`);
        }
      }
    }

    // 基于名称的自动检测 (向后兼容)
    const isMatrix = uniformName.includes('Matrix');
    const isFloat = uniformName === 'uTime' || uniformName === 'uMixFactor' || uniformName.includes('Factor');

    if (isMatrix) {
      // 矩阵uniform处理 - 假设是4x4矩阵
      if (data.byteLength >= 64) {
        const matrixData = new Float32Array(data, 0, 16);
        gl.uniformMatrix4fv(location, false, matrixData);
        return;
      } else {
        console.error(`矩阵${uniformName}的缓冲区数据过小: ${data.byteLength} 字节`);
        return;
      }
    }

    if (isFloat) {
      // 浮点数uniform处理
      if (data.byteLength >= 4) {
        const floatData = new Float32Array(data, 0, 1);
        gl.uniform1f(location, floatData[0]);
        return;
      } else {
        console.error(`浮点数${uniformName}的缓冲区数据过小: ${data.byteLength} 字节`);
        return;
      }
    }

    // 如果以上都不匹配，尝试基于数据大小猜测类型
    if (data.byteLength >= 64) {
      // 可能是4x4矩阵
      const matrixData = new Float32Array(data, 0, 16);
      gl.uniformMatrix4fv(location, false, matrixData);
    } else if (data.byteLength >= 36) {
      // 可能是3x3矩阵
      const matrixData = new Float32Array(data, 0, 9);
      gl.uniformMatrix3fv(location, false, matrixData);
    } else if (data.byteLength >= 16) {
      // 可能是vec4
      const vecData = new Float32Array(data, 0, 4);
      gl.uniform4fv(location, vecData);
    } else if (data.byteLength >= 12) {
      // 可能是vec3
      const vecData = new Float32Array(data, 0, 3);
      gl.uniform3fv(location, vecData);
    } else if (data.byteLength >= 8) {
      // 可能是vec2
      const vecData = new Float32Array(data, 0, 2);
      gl.uniform2fv(location, vecData);
    } else if (data.byteLength >= 4) {
      // 可能是float
      const floatData = new Float32Array(data, 0, 1);
      gl.uniform1f(location, floatData[0]);
    } else {
      console.warn(`无法从缓冲区应用uniform: 数据大小过小 ${data.byteLength} 字节，uniform名称: '${uniformName}'`);
    }
  } catch (e) {
    console.error(`设置uniform ${uniformName} 时出错:`, e);
  }
}

/**
 * WebGL绑定组实现
 */
export class WebGLBindGroup implements IRHIBindGroup {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  layout: WebGLBindGroupLayout;
  entries: IRHIBindGroupEntry[];
  label?: string;
  private isDestroyed = false;

  /**
   * 创建WebGL绑定组
   *
   * @param gl WebGL上下文
   * @param layout 绑定组布局 (expected to be an instance of WebGLBindGroupLayout)
   * @param entries 绑定资源条目 (IRHIBindGroupEntry[])
   * @param label 可选标签
   */
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    layout: IRHIBindGroupLayout,
    entries: IRHIBindGroupEntry[],
    label?: string
  ) {
    this.gl = gl;
    if (!(layout instanceof WebGLBindGroupLayout)) {
      throw new Error(
        `[${label || 'WebGLBindGroup'}] Constructor expects layout to be an instance of WebGLBindGroupLayout.`
      );
    }
    this.layout = layout;
    this.entries = entries;
    this.label = label;

    this.validateResourcesAgainstLayout();
  }

  getLayout(): IRHIBindGroupLayout {
    return this.layout;
  }

  getEntries(): IRHIBindGroupEntry[] {
    return this.entries;
  }

  /**
   * 验证绑定资源条目与布局的兼容性
   */
  private validateResourcesAgainstLayout(): void {
    for (const entry of this.entries) {
      const layoutEntry = this.layout.getDetailedBindingEntry(entry.binding);

      if (!layoutEntry) {
        throw new Error(`[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding}: No layout definition found.`);
      }

      const resource = entry.resource;
      let actualResourceObject = resource;

      if (resource && (resource as any).buffer instanceof GLBuffer) {
        actualResourceObject = (resource as any).buffer;
      }

      if (layoutEntry.buffer) {
        if (!(actualResourceObject instanceof GLBuffer)) {
          throw new Error(
            `[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding} (${layoutEntry.name || 'Buffer'}): Layout expects a Buffer, but got ${actualResourceObject?.constructor?.name}.`
          );
        }
      } else if (layoutEntry.texture) {
        if (!(actualResourceObject instanceof WebGLTextureView)) {
          throw new Error(
            `[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding} (${layoutEntry.name || 'Texture'}): Layout expects a TextureView, but got ${actualResourceObject?.constructor?.name}.`
          );
        }
      } else if (layoutEntry.sampler) {
        if (!(actualResourceObject instanceof GLSampler)) {
          throw new Error(
            `[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding} (${layoutEntry.name || 'Sampler'}): Layout expects a Sampler, but got ${actualResourceObject?.constructor?.name}.`
          );
        }
      } else if (layoutEntry.storageTexture) {
        console.warn(
          `[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding} (${layoutEntry.name || 'StorageTexture'}): 'storageTexture' validation is minimal as it's not standard in WebGL.`
        );
      } else {
        throw new Error(
          `[${this.label || 'WebGLBindGroup'}] Binding ${entry.binding}: Layout definition is unclear (no buffer, texture, or sampler specified).`
        );
      }
    }
  }

  /**
   * 应用所有绑定
   * 在WebGL渲染通道中使用
   *
   * @param program WebGL程序对象
   * @param dynamicOffsets (Currently not fully implemented for UBO dynamic offsets here)
   */
  public applyBindings(program: WebGLProgram, dynamicOffsets?: Uint32Array | number[]): void {
    if (this.isDestroyed) {
      console.error(`[${this.label || 'WebGLBindGroup'}] Attempting to use a destroyed bind group.`);

      return;
    }

    const gl = this.gl;

    for (const entry of this.entries) {
      const binding = entry.binding;
      const layoutEntry = this.layout.getDetailedBindingEntry(binding);

      if (!layoutEntry) {
        console.warn(
          `[${this.label || 'WebGLBindGroup'}] Binding ${binding}: No detailed layout entry found. Skipping.`
        );
        continue;
      }

      const uniformName = layoutEntry.name;
      let uniformLocation: WebGLUniformLocation | null = null;

      if (uniformName) {
        uniformLocation = gl.getUniformLocation(program, uniformName);
      }

      const boundResourceItem = entry.resource;
      let actualResource: any = boundResourceItem;
      let bufferBindOffset: number = 0;
      let bufferBindSize: number | undefined;

      if (
        boundResourceItem &&
        (boundResourceItem as any).buffer &&
        (boundResourceItem as any).buffer instanceof GLBuffer
      ) {
        actualResource = (boundResourceItem as any).buffer as GLBuffer;
        bufferBindOffset = (boundResourceItem as any).offset || 0;
        bufferBindSize = (boundResourceItem as any).size;
      }

      if (layoutEntry.buffer && actualResource instanceof GLBuffer) {
        if (!uniformName) {
          console.warn(
            `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Buffer): Layout entry missing 'name' for uniform/UBO. Skipping.`
          );
          continue;
        }
        const glBuffer = actualResource;

        let uboPathSuccess = false;

        // Try WebGL2 UBO Path first if applicable
        if (gl instanceof WebGL2RenderingContext && layoutEntry.buffer.type === 'uniform') {
          const blockIndex = gl.getUniformBlockIndex(program, uniformName);

          if (blockIndex !== gl.INVALID_INDEX) {
            // This IS a UBO block
            gl.uniformBlockBinding(program, blockIndex, binding);
            const bufferActualSize = glBuffer.getSize() ? glBuffer.getSize() : glBuffer.size; // Adapt based on GLBuffer API

            if (typeof bufferActualSize !== 'number') {
              throw new Error('Cannot get buffer size for UBO binding');
            }
            const effectiveSize = bufferBindSize !== undefined ? bufferBindSize : bufferActualSize - bufferBindOffset;

            if (bufferBindOffset !== 0 || bufferBindSize !== undefined) {
              gl.bindBufferRange(gl.UNIFORM_BUFFER, binding, glBuffer.getGLBuffer(), bufferBindOffset, effectiveSize);
            } else {
              gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, glBuffer.getGLBuffer());
            }
            uboPathSuccess = true; // Mark UBO path as successful
          } else {
            // Not a UBO block, warning was already printed by previous check or will be handled below
          }
        }

        // Fallback: If not a successful UBO path, treat as source for standard uniform(s)
        if (!uboPathSuccess) {
          if (!uniformLocation) {
            console.warn(
              `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Buffer '${uniformName}'): Could not find location for standard uniform. Skipping manual update.`
            );
            continue; // Skip if we can't find the uniform location
          }
          // console.warn(`[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Buffer '${uniformName}'): Applying as standard uniform(s). Mapping buffer to read data. Consider using UBOs if possible.`);

          // Determine size to map
          const bufferActualSize = glBuffer.getSize ? glBuffer.getSize() : glBuffer.size;

          if (typeof bufferActualSize !== 'number') {
            console.error(
              `[${this.label || 'WebGLBindGroup'}] Cannot get buffer size for uniform '${uniformName}'. Skipping manual update.`
            );
            continue;
          }
          const sizeToMap = bufferBindSize !== undefined ? bufferBindSize : bufferActualSize - bufferBindOffset;

          if (sizeToMap <= 0) {
            console.warn(
              `[${this.label || 'WebGLBindGroup'}] Calculated size to map for uniform '${uniformName}' is <= 0. Skipping.`
            );
            continue;
          }

          // 尝试直接从GLBuffer获取数据
          try {
            // 直接映射缓冲区（不使用异步API）
            if (typeof glBuffer.getData === 'function') {
              // 如果GLBuffer有getData方法，直接用它
              const data = glBuffer.getData(bufferBindOffset, sizeToMap);

              if (data) {
                applyKnownUniformFromBufferData(gl, uniformLocation, data, uniformName, glBuffer);
              }
            } else {
              // 如果没有getData方法，回退到异步map（但可能会导致时序问题）
              console.warn(
                `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Buffer '${uniformName}'): 使用异步map方法，这可能导致uniform设置时序问题。`
              );
              glBuffer
                .map('read', bufferBindOffset, sizeToMap)
                .then((mappedData) => {
                  applyKnownUniformFromBufferData(gl, uniformLocation, mappedData, uniformName, glBuffer);
                  glBuffer.unmap();
                })
                .catch((error) => {
                  console.error(
                    `[${this.label || 'WebGLBindGroup'}] Failed to map buffer for uniform '${uniformName}':`,
                    error
                  );
                });
            }
          } catch (err) {
            console.error(`[${this.label || 'WebGLBindGroup'}] 无法访问uniform缓冲区数据 '${uniformName}':`, err);
          }
        }
      } else if (layoutEntry.texture && actualResource instanceof WebGLTextureView) {
        if (!uniformName || !uniformLocation) {
          console.warn(
            `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Texture '${uniformName || 'Unnamed'}'): Missing uniform name in layout or location not found. Skipping.`
          );
          continue;
        }
        const textureView = actualResource;
        const textureUnit = this.layout.getTextureUnitForBinding(binding);

        if (textureUnit !== undefined) {
          gl.activeTexture(gl.TEXTURE0 + textureUnit);
          gl.bindTexture(textureView.getGLTextureTarget(), textureView.getGLTexture());
          gl.uniform1i(uniformLocation, textureUnit);
        } else {
          console.warn(
            `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Texture '${uniformName}'): No texture unit assigned in layout.`
          );
        }
      } else if (layoutEntry.sampler && actualResource instanceof GLSampler) {
        const sampler = actualResource;
        const associatedTextureBinding = this.layout.getAssociatedTextureBindingForSampler(binding);

        if (associatedTextureBinding !== undefined) {
          const textureUnitForSampler = this.layout.getTextureUnitForBinding(associatedTextureBinding);

          if (textureUnitForSampler !== undefined) {
            const associatedTextureEntry = this.entries.find((e) => e.binding === associatedTextureBinding);

            if (associatedTextureEntry?.resource instanceof WebGLTextureView) {
              const associatedTextureView = associatedTextureEntry.resource as WebGLTextureView;

              gl.activeTexture(gl.TEXTURE0 + textureUnitForSampler);
              if (typeof sampler.applyToTexture === 'function') {
                sampler.applyToTexture(associatedTextureView.getGLTextureTarget());
              } else {
                console.error(
                  `[${this.label || 'WebGLBindGroup'}] Sampler@${binding}: Missing 'applyToTexture' method on WebGLSampler instance.`
                );
              }
            } else {
              console.warn(
                `[${this.label || 'WebGLBindGroup'}] Sampler@${binding}: Could not find associated TextureView for binding ${associatedTextureBinding} to apply sampler parameters.`
              );
            }

            if (uniformName && uniformLocation) {
              gl.uniform1i(uniformLocation, textureUnitForSampler);
            }
          } else {
            console.warn(
              `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Sampler '${uniformName || 'Unnamed'}'): Could not get texture unit for associated texture binding ${associatedTextureBinding}.`
            );
          }
        } else {
          console.warn(
            `[${this.label || 'WebGLBindGroup'}] Binding ${binding} (Sampler '${uniformName || 'Unnamed'}'): No associated texture binding found in layout. Sampler parameters may not be applied correctly.`
          );
        }
      } else if (layoutEntry.storageTexture) {
        console.warn(
          `[${this.label || 'WebGLBindGroup'}] Binding ${binding}: 'storageTexture' is not standard in WebGL and its binding behavior is undefined here.`
        );
      }
    }
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.entries = [];
    this.isDestroyed = true;
  }
}

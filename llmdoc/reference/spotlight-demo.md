# Spotlight Demo

This demo showcases a spotlight implementation, featuring a cone of light with soft edges and distance-based attenuation.

## Key Concepts

The spotlight effect is achieved by combining the logic of a point light (position and attenuation) with directional constraints.

1.  **Directional Cone**: The light is confined to a cone defined by a direction vector and two angles: an inner cone angle (`innerAngle`) and an outer cone angle (`outerAngle`).
2.  **Smooth Edges**: Anything inside the inner cone is fully lit. Between the inner and outer cone, the light intensity smoothly fades to zero. This prevents a harsh, unrealistic edge.
3.  **Calculation**: This is done in the fragment shader by calculating the dot product between the light's direction vector and the vector from the light to the fragment.

## Core Implementation

### GLSL Fragment Shader

The core logic resides in the fragment shader. We calculate a `spotIntensity` factor and use it to modulate the final light contribution.

```glsl
// Uniforms provided to the shader
uniform Spotlight {
  vec3 uLightPosition;
  // ... other light properties
  vec3 uLightDirection;
  float uInnerCutoff;      // cos(innerAngle)
  float uOuterCutoff;      // cos(outerAngle)
};

// Input from vertex shader
in vec3 vPosition;

void main() {
  // --- Standard lighting calculations (ambient, diffuse, specular) ---

  // Spotlight Calculation
  vec3 lightDir = normalize(uLightPosition - vPosition);
  float theta = dot(lightDir, normalize(-uLightDirection));

  // Calculate the smooth transition factor
  float epsilon = uInnerCutoff - uOuterCutoff; // Difference between cosines
  float spotIntensity = clamp((theta - uOuterCutoff) / epsilon, 0.0, 1.0);

  // Apply attenuation and spotIntensity to the final color
  // ...
  vec3 result = (ambient + diffuse + specular) * attenuation * spotIntensity * objectColor;
  fragColor = vec4(result, 1.0);
}
```

### TypeScript: Angle to Cosine Conversion

In the main application, the GUI controls the inner and outer angles in degrees. These must be converted to radians and then to their cosine values before being sent to the shader uniform buffer. This is a crucial pre-calculation step.

-   **Why cosine?** Using the dot product of two normalized vectors gives the cosine of the angle between them. Comparing cosines directly in the shader is more efficient than calculating `acos` on every fragment.
-   **Important**: `cos` is a decreasing function for angles in `[0, 180]`. Therefore, a smaller angle results in a larger cosine value. `cos(innerAngle)` will be greater than `cos(outerAngle)`.

```typescript
// GUI parameters in degrees
const params = {
  innerAngle: 12.5,
  outerAngle: 17.5,
  // ...
};

// In the render loop, before writing to the uniform buffer
const uniformBufferData = new Float32Array(/* ... */);

// Convert angles to radians, then to cosine
uniformBufferData[16] = Math.cos(MMath.degToRad(params.innerAngle));
uniformBufferData[17] = Math.cos(MMath.degToRad(params.outerAngle));

// Write to the GPU buffer
spotlightUniformBuffer.write(uniformBufferData);
```

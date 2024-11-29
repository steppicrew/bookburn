// Vertex shader (vortex.vertex.fx)
precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform float time;

// Varyings
varying vec2 vUV;

void main() {
    vec4 p = vec4(position, 1.0);

    // Compute vortex effect based on time
    float angle = length(uv - vec2(0.5, 0.5)) * 10.0 * time;
    float s = sin(angle);
    float c = cos(angle);

    // Rotate around center (0.5, 0.5)
    vec2 centeredUV = uv - vec2(0.5, 0.5);
    vec2 rotatedUV = vec2(
        centeredUV.x * c - centeredUV.y * s,
        centeredUV.x * s + centeredUV.y * c
    );

    vUV = rotatedUV + vec2(0.5, 0.5); // Adjust back to normal UV space

    gl_Position = worldViewProjection * p;
}

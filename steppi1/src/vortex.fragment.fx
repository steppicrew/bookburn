// Fragment shader (vortex.fragment.fx)
precision highp float;

// Varyings
varying vec2 vUV;

// Uniforms
uniform sampler2D textureSampler;

void main() {
    gl_FragColor = texture2D(textureSampler, vUV);
}

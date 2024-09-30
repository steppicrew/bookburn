#version 300 es
precision highp float;

// Standard transformation matrices
uniform mat4 worldViewProjection;

// Position of the vertex
attribute vec3 position;

varying vec3 vUv;

void main(void) {
    vUv = normalize(position); 
    gl_Position = worldViewProjection * vec4(position, 1.0);
}

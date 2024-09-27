precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;

uniform float time;
uniform float floppyness;
uniform float orientation;
uniform vec2 dimensions;

varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vPosition;

float PI = 3.1415926536;

vec3 getBend(void) {
    // rInverse: 1/r
    float rInverse = -2.0 * floppyness * (0.5 - abs(0.5 - abs(time))) * sign(time);
    
    float uvX;
    if (orientation > 0.0) {
        uvX = uv.x;
    }
    else {
        uvX = 1.0 - uv.x;
    }
    
    if (rInverse == 0.0) {
        vNormal = normalize(vec3(0, 0, -orientation));
        return vec3(uvX * dimensions.x, uv.y * dimensions.y, 0.0);
    }
    float r = 1.0 / rInverse;
    
    float theta = dimensions.x / r;
    float x_c = sin(theta / 2.0) * r;
    float z_c = cos(theta / 2.0) * r;
    float theta_ = theta * (uvX - 0.5);
    vec3 newPosition = vec3(
        (sin(theta_) * r + x_c),
        uv.y * dimensions.y,
        (cos(theta_) * r - z_c));
    
    vNormal = normalize(
        orientation *
        vec3(
            sin(theta_),
            0,
            -cos(theta_)));
    
    return newPosition;
}

void main(void) {
    vUV = uv; // Pass UV coordinates to the fragment shader
    
    vec3 bended = getBend();
    
    gl_Position = worldViewProjection * vec4(bended, 1.0);
    vPosition = bended;
}

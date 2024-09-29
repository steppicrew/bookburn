precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform float time; // a float between 0 and 2. 0 and 2 means original position, 0<time<=1 means turning from right to left, 1<time<=2 means turning from left to right
uniform float floppyness; // 0 means not floppy at all, 1 means floppy
uniform float orientation; // 1: front side, 2: back side
uniform vec2 dimensions; // page's width and height
uniform vec3 offset; // page's offset

varying vec2 vUV;
varying vec3 vPositionW;
varying vec3 vNormalW;

vec3 vNormal;

const float PI = 3.1415926535897932384626433832795;

vec3 getBend(void) {
    // rInverse: 1/r
    float normTime = 1.0 - time;
    float rInverse = -2.0 * floppyness * (0.5 - abs(0.5 - abs(normTime))) * sign(normTime);
    
    float uvX;
    if (orientation > 0.0) {
        uvX = uv.x;
    }
    else {
        uvX = 1.0 - uv.x;
    }
    
    if (rInverse == 0.0) {
        vNormal = normalize(vec3(0, orientation, 0));
        return vec3(uvX * dimensions.x, 0.0, uv.y * dimensions.y);
    }
    
    // Circle's radius
    float r = 1.0 / rInverse;
    
    // Angle the page equals on the circle
    float theta = dimensions.x / r;
    
    // Coordinates of the circle's center
    float x_c = sin(theta / 2.0) * r;
    float y_c = cos(theta / 2.0) * r;
    
    // Angle from the the lot (+- theta/2)
    float theta_ = theta * (uvX - 0.5);
    
    vec3 newPosition = vec3(
        (sin(theta_) * r + x_c),
        -(cos(theta_) * r - y_c),
        uv.y * dimensions.y);
    
    vNormal = normalize(
        orientation *
        vec3(
            -sin(theta_),
            cos(theta_),
            0));
    
    return newPosition;
}

vec3 rotate(vec3 position, float theta) {
    // Create the rotation matrix
    mat3 rotationMatrix = mat3(
        cos(theta), -sin(theta), 0.0,
        sin(theta), cos(theta), 0.0,
        0.0, 0.0, 1.0);
    
    return rotationMatrix * position;
}

void main(void) {
    vUV = uv; // Pass UV coordinates to the fragment shader
    
    vec3 newPosition = getBend();
    
    float theta = -time * PI;
    if (time > 1.0) {
        theta = - theta;
    }
    newPosition = rotate(newPosition + offset, theta);
    
    vNormal = rotate(vNormal, theta);
    
    // newPosition = newPosition + parentPosition;
    
    gl_Position = worldViewProjection * vec4(newPosition, 1.0);
    
    vPositionW = vec3(world * vec4(newPosition, 1.0));
    vNormalW = normalize(vec3(world * vec4(vNormal, 0.0)));
}

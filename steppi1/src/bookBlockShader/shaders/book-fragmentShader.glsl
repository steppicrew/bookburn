precision highp float;

in vec2 vUV; // Receive UV coordinates from the vertex shader
in vec3 vNormalW;    // World normal vector from the vertex shader
in vec3 vPositionW;    // World position vector from vertex shader

uniform sampler2D bookTexture; // Texture sampler

const bool lights = true;

layout(std140) uniform Lights {
    vec4 lightPositions[10];
    vec4 lightPositionsColors[10];
    float lightPositionsIntensities[10];
    int lightPositionsNum;
    
    vec4 lightDirections[10];
    vec4 lightDirectionsColors[10];
    float lightDirectionsIntensities[10];
    int lightDirectionsNum;
};

vec3 colorContribution(vec3 normal, vec3 lightDir, vec3 lightColor, float lightIntensity) {
    lightDir = normalize(lightDir);
    
    // Compute the diffuse intensity (Lambertian reflection)
    float diffuseIntensity = max(dot(normal, lightDir), 0.0);
    
    // Accumulate the light contribution
    return lightColor * diffuseIntensity * lightIntensity;
}

void main(void) {
    // Debug normale
    // gl_FragColor = vec4(normalize(vNormalW) / 2.0 + vec3(0.5, 0.5, 0.5), 1.0);
    // return;

    if (dot(vNormalW, vNormalW) == 0.0) {
        discard;
        return;
    }
    
    // Sample the texture at the fragment's UV coordinate
    vec4 textureColor = texture2D(bookTexture, vUV);

    if (!lights) {
        gl_FragColor = textureColor;
        return;
    }
    
    // Initialize final color to the sampled texture color
    vec3 finalColor = vec3(0.0);
    
    // Define the fragment's normal (assuming the surface is facing up in Y direction)
    vec3 normal = normalize(vNormalW);
    
    // Define the fragment's position in world space (assuming flat plane at y = 0)
    vec3 fragmentPosition = vPositionW;
    
    // Calculate light contributions
    for (int i = 0; i < lightDirectionsNum; i++) {
        // For directional light: use light direction directly
        finalColor += colorContribution(normal, lightDirections[i].xyz, lightDirectionsColors[i].xyz, lightDirectionsIntensities[i]);
    }
    for (int i = 0; i < lightPositionsNum; i++) {
        // For point light: compute direction from light to the fragment
        finalColor += colorContribution(normal, lightPositions[i].xyz - fragmentPosition, lightPositionsColors[i].xyz, lightPositionsIntensities[i]);
    }
    
    // Multiply the final light color with the texture color for the final output
    vec3 shadedColor = finalColor * textureColor.rgb;
    
    // Output the color with the alpha from the texture
    gl_FragColor = vec4(shadedColor, textureColor.a);
}

void main_old(void) {
    vec4 color = texture2D(bookTexture, vUV);
    gl_FragColor = color;
    // gl_FragColor= vec4(1., 1., 1., 1.);
}


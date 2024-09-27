precision highp float;

varying vec2 vUV; // Receive UV coordinates from the vertex shader
varying vec3 vNormal;    // Normal from the vertex shader
varying vec3 vPosition;

uniform sampler2D bookTexture; // Texture sampler

uniform vec3 lightPositions[10];    // Array of light positions (for point lights)
uniform vec3 lightPositionsColors[10];       // Array of light colors (diffuse)
uniform float lightPositionsIntensities[10]; // Array of light intensities
uniform int numLightsPositions;              // Number of lights in the scene

uniform vec3 lightDirections[10];   // Array of light directions (for directional/hemispheric lights)
uniform vec3 lightDirectionsColors[10];       // Array of light colors (diffuse)
uniform float lightDirectionsIntensities[10]; // Array of light intensities
uniform int numLightsDirections;              // Number of lights in the scene

vec3 colorContribution(vec3 normal, vec3 lightDir, vec3 lightColor, float lightIntensity) {
    lightDir = normalize(lightDir);
    
    // Compute the diffuse intensity (Lambertian reflection)
    float diffuseIntensity = max(dot(normal, lightDir), 0.0);
    
    // Accumulate the light contribution
    return lightColor * diffuseIntensity * lightIntensity;
}

void main(void) {
    // Sample the texture at the fragment's UV coordinate
    vec4 textureColor = texture2D(bookTexture, vUV);
    
    // Initialize final color to the sampled texture color
    vec3 finalColor = vec3(0.0);
    
    // Define the fragment's normal (assuming the surface is facing up in Y direction)
    vec3 normal = normalize(vNormal);
    
    // Define the fragment's position in world space (assuming flat plane at y = 0)
    vec3 fragmentPosition = vPosition;
    
    // Calculate light contributions
    for (int i = 0; i < numLightsDirections; i++) {
        // For directional light: use light direction directly
        finalColor += colorContribution(normal, lightDirections[i], lightDirectionsColors[i], lightDirectionsIntensities[i]);
    }
    for (int i = 0; i < numLightsPositions; i++) {
        // For point light: compute direction from light to the fragment
        finalColor += colorContribution(normal, lightPositions[i] - fragmentPosition, lightPositionsColors[i], lightPositionsIntensities[i]);
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


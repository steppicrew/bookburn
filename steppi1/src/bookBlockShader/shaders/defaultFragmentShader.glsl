#define WEBGL2 
#define NUM_BONE_INFLUENCERS 0
#define NUM_MORPH_INFLUENCERS 0
#define SHADER_NAME fragment:default
precision highp float;
layout(std140,column_major) uniform;

uniform Material {
    vec4 diffuseLeftColor;
    vec4 diffuseRightColor;
    vec4 opacityParts;
    vec4 reflectionLeftColor;
    vec4 reflectionRightColor;
    vec4 refractionLeftColor;
    vec4 refractionRightColor;
    vec4 emissiveLeftColor;
    vec4 emissiveRightColor;
    vec2 vDiffuseInfos;
    vec2 vAmbientInfos;
    vec2 vOpacityInfos;
    vec2 vReflectionInfos;
    vec3 vReflectionPosition;
    vec3 vReflectionSize;
    vec2 vEmissiveInfos;
    vec2 vLightmapInfos;
    vec2 vSpecularInfos;
    vec3 vBumpInfos;
    mat4 diffuseMatrix;
    mat4 ambientMatrix;
    mat4 opacityMatrix;
    mat4 reflectionMatrix;
    mat4 emissiveMatrix;
    mat4 lightmapMatrix;
    mat4 specularMatrix;
    mat4 bumpMatrix;
    vec2 vTangentSpaceParams;
    float pointSize;
    float alphaCutOff;
    mat4 refractionMatrix;
    vec4 vRefractionInfos;
    vec3 vRefractionPosition;
    vec3 vRefractionSize;
    vec4 vSpecularColor;
    vec3 vEmissiveColor;
    vec4 vDiffuseColor;
    vec3 vAmbientColor;
#define ADDITIONAL_UBO_DECLARATION
};

layout(std140,column_major) uniform;

uniform Scene {
    mat4 viewProjection;
    mat4 view;
    mat4 projection;
    vec4 vEyePosition;
};

uniform mat4 world;
uniform float visibility;

#define WORLD_UBO
#define CUSTOM_FRAGMENT_BEGIN

in vec3 vPositionW;

const float PI=3.1415926535897932384626433832795;
const float RECIPROCAL_PI=0.3183098861837907;
const float RECIPROCAL_PI2=0.15915494309189535;
const float HALF_MIN=5.96046448e-08;
const float LinearEncodePowerApprox=2.2;
const float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;
const vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);
const float Epsilon=0.0000001;

#define saturate(x) clamp(x,0.0,1.0)
#define absEps(x) abs(x)+Epsilon
#define maxEps(x) max(x,Epsilon)
#define saturateEps(x) clamp(x,Epsilon,1.0)

mat3 transposeMat3(mat3 inMatrix) {
    vec3 i0=inMatrix[0];
    vec3 i1=inMatrix[1];
    vec3 i2=inMatrix[2];
    mat3 outMatrix=mat3(
        vec3(i0.x,i1.x,i2.x),
        vec3(i0.y,i1.y,i2.y),
        vec3(i0.z,i1.z,i2.z));
    return outMatrix;
}

mat3 inverseMat3(mat3 inMatrix) {
    float a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];
    float a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];
    float a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];
    float b01=a22*a11-a12*a21;
    float b11=-a22*a10+a12*a20;
    float b21=a21*a10-a11*a20;
    float det=a00*b01+a01*b11+a02*b21;
    return mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),
        b11,(a22*a00-a02*a20),(-a12*a00+a02*a10),
        b21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;
}

float toLinearSpace(float color) {
    return pow(color,LinearEncodePowerApprox);
}

vec3 toLinearSpace(vec3 color) {
    return pow(color,vec3(LinearEncodePowerApprox));
}

vec4 toLinearSpace(vec4 color) {
    return vec4(pow(color.rgb,vec3(LinearEncodePowerApprox)),color.a);
}

float toGammaSpace(float color) {
    return pow(color,GammaEncodePowerApprox);
}

vec3 toGammaSpace(vec3 color) {
    return pow(color,vec3(GammaEncodePowerApprox));
}

vec4 toGammaSpace(vec4 color) {
    return vec4(pow(color.rgb,vec3(GammaEncodePowerApprox)),color.a);
}

float square(float value) {
    return value*value;
}

vec3 square(vec3 value) {
    return value*value;
}

float pow5(float value) {
    float sq=value*value;
    return sq*sq*value;
}

float getLuminance(vec3 color) {
    return clamp(dot(color,LuminanceEncodeApprox),0.,1.);
}

float getRand(vec2 seed) {
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);
}

float dither(vec2 seed,float varianceAmount) {
    float rand=getRand(seed);
    float normVariance=varianceAmount/255.0;
    float dither=mix(-normVariance,normVariance,rand);
    return dither;
}

const float rgbdMaxRange=255.0;

vec4 toRGBD(vec3 color) {
    float maxRGB=maxEps(max(color.r,max(color.g,color.b)));
    float D =max(rgbdMaxRange/maxRGB,1.);
    D =clamp(floor(D)/255.0,0.,1.);
    vec3 rgb=color.rgb*D;
    rgb=toGammaSpace(rgb);
    return vec4(clamp(rgb,0.,1.),D);
}

vec3 fromRGBD(vec4 rgbd) {
    rgbd.rgb=toLinearSpace(rgbd.rgb);
    return rgbd.rgb/rgbd.a;
}

vec3 parallaxCorrectNormal(vec3 vertexPos,vec3 origVec,vec3 cubeSize,vec3 cubePos) {
    vec3 invOrigVec=vec3(1.0,1.0,1.0)/origVec;
    vec3 halfSize=cubeSize*0.5;
    vec3 intersecAtMaxPlane=(cubePos+halfSize-vertexPos)*invOrigVec;
    vec3 intersecAtMinPlane=(cubePos-halfSize-vertexPos)*invOrigVec;
    vec3 largestIntersec=max(intersecAtMaxPlane,intersecAtMinPlane);
    float distance=min(min(largestIntersec.x,largestIntersec.y),largestIntersec.z);
    vec3 intersectPositionWS=vertexPos+origVec*distance;
    return intersectPositionWS-cubePos;
}

struct lightingInfo {
    vec3 diffuse;
};

lightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {
    lightingInfo result;
    vec3 lightVectorW;
    float attenuation=1.0;
    if (lightData.w==0.) {
        vec3 direction=lightData.xyz-vPositionW;
        attenuation=max(0.,1.0-length(direction)/range);
        lightVectorW=normalize(direction);
    }
    else {
        lightVectorW=normalize(-lightData.xyz);
    }
    float ndl=max(0.,dot(vNormal,lightVectorW));
    result.diffuse=ndl*diffuseColor*attenuation;
    return result;
}

lightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {
    lightingInfo result;
    vec3 direction=lightData.xyz-vPositionW;
    vec3 lightVectorW=normalize(direction);
    float attenuation=max(0.,1.0-length(direction)/range);
    float cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));
    if (cosAngle>=lightDirection.w) {
        cosAngle=max(0.,pow(cosAngle,lightData.w));
        attenuation*=cosAngle;
        float ndl=max(0.,dot(vNormal,lightVectorW));
        result.diffuse=ndl*diffuseColor*attenuation;
        return result;
    }
    result.diffuse=vec3(0.);
    return result;
}

lightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {
    lightingInfo result;
    float ndl=dot(vNormal,lightData.xyz)*0.5+0.5;
    result.diffuse=mix(groundColor,diffuseColor,ndl);
    return result;
}

#define inline

vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler,mat4 textureProjectionMatrix,vec3 posW) {
    vec4 strq=textureProjectionMatrix*vec4(posW,1.0);
    strq/=strq.w;
    vec3 textureColor=texture(projectionLightSampler,strq.xy).rgb;
    return textureColor;
}

#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS

vec4 applyImageProcessing(vec4 result) {
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATSTART
    result.rgb=toGammaSpace(result.rgb);
    result.rgb=saturate(result.rgb);
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATEND
    return result;
}

#define CUSTOM_FRAGMENT_DEFINITIONS

layout(location = 0) out vec4 glFragColor;

void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
    vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
    vec4 baseColor=vec4(1.,1.,1.,1.);
    vec3 diffuseColor=vDiffuseColor.rgb;
    float alpha=vDiffuseColor.a;
    vec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));
    vec2 uvOffset=vec2(0.0,0.0);
#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE
    vec3 baseAmbientColor=vec3(1.,1.,1.);
#define CUSTOM_FRAGMENT_BEFORE_LIGHTS
    float glossiness=0.;
    vec3 diffuseBase=vec3(0.,0.,0.);
    lightingInfo info;
    float shadow=1.;
    float aggShadow=0.;
    float numLights=0.;
    aggShadow=aggShadow/numLights;
    vec4 refractionColor=vec4(0.,0.,0.,1.);
    vec4 reflectionColor=vec4(0.,0.,0.,1.);
    vec3 emissiveColor=vEmissiveColor;
    vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
    vec3 finalSpecular=vec3(0.0);
    vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+refractionColor.rgb,alpha);
#define CUSTOM_FRAGMENT_BEFORE_FOG
    color.rgb=max(color.rgb,0.);
    color.a*=visibility;
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
    glFragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}

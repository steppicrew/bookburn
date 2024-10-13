precision highp float;

// color contains [u, v, (body + side)/64, pageNum/64 ]
attribute vec4 color;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform float time; // a float between 0 and 2. 0 and 2 means original position, 0<time<=1 means turning from right to left, 1<time<=2 means turning from left to right
uniform float floppyness; // 0 means not floppy at all, 1 means floppy
uniform int maxFlipPages; // max number of pages to flip
uniform int flipPages; // max number of pages to flip
uniform vec3 dimensions; // page's width, height, and depth
uniform float pageDepth; // Depth of one page
uniform float coverDepth; // Depth of one page
uniform vec3 vertices; // Number of vertices for width, height, and depth
uniform vec4 textureUVs[20]; // Texture clippings
uniform int textureCount; // Number of textures

varying vec2 vUV;
varying vec3 vPositionW;
varying vec3 vNormalW;

vec3 vNormal; // local normal vector
bool bHide = false; // to hide this vertex
int pageCount; // number of pages (excl. cover)
float timePerPage; // time to flip one page
float deltaPageTime; // time difference between two pages start flipping

const float PI = 3.1415926535897932384626433832795;

// Body definitions
const int FrontBody = 1;
const int PageBody = 2;
const int BackBody = 3;

// Side definitions
const int TopSide = 1;
const int BottomSide = 2;
const int NorthSide = 3;
const int PagesSide = 4;
const int SouthSide = 5;
const int BinderSide = 6;

// Texture indexes
const int TextureIndexFrontTop = 0;
const int TextureIndexFrontBottom = 1;
const int TextureIndexFrontNorth = 2;
const int TextureIndexFrontSouth = 3;
const int TextureIndexFrontBinder = 4;
const int TextureIndexFrontPages = 5;

const int TextureIndexBackTop = 6;
const int TextureIndexBackBottom = 7;
const int TextureIndexBackNorth = 8;
const int TextureIndexBackSouth = 9;
const int TextureIndexBackBinder = 10;
const int TextureIndexBackPages = 11;

const int TextureIndexPagesOffest = 12;

/*
vec3 getBend(vec3 position) {
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
            0.0));
    
    return newPosition;
}
*/

vec3 rotate(vec3 position, float theta) {
    // Create the rotation matrix
    mat3 rotationMatrix = mat3(
        cos(theta), -sin(theta), 0.0,
        sin(theta), cos(theta), 0.0,
        0.0, 0.0, 1.0);
    
    return rotationMatrix * position;
}

int floatToInt(float number, float basis) {
    return int(round(number * basis));
}

int getPageIndex(int pageNum, bool front) {
    int pageTextureCount = textureCount - TextureIndexPagesOffest + 1;
    int index = 2*pageNum + (front ? 0 : 1);
    return index % pageTextureCount + TextureIndexPagesOffest;
}

vec2 mapUV(vec2 uv, int index) {
    vec4 boundingBox = textureUVs[index];
    float width = boundingBox.z - boundingBox.x;
    float height = boundingBox.w - boundingBox.y;
    return vec2(uv.x * width + boundingBox.x, uv.y * height + boundingBox.y);
}

vec3 renderFrontBody(int side) {
    bHide = true;
    return vec3(0.0);
    
    if (side == TopSide) {
        vUV = mapUV(color.xy, TextureIndexFrontTop);
        vNormal = vec3(0.0, 1.0, 0.0);
        return vec3(color.x * dimensions.x, dimensions.y, color.y * dimensions.z);
    }
    
    float singleTime = timePerPage * 1.5; // time the cover is shown without a page
    int bottomPageIndex;
    float depth;
    if (time == 0.0 || time == 1.0 || time == 2.0) {
        bottomPageIndex = TextureIndexBackBottom;
        depth = dimensions.y;
    }
    else  if (time < singleTime || time > 2.0 - deltaPageTime - timePerPage) {
        bottomPageIndex = TextureIndexFrontBottom;
        depth = coverDepth;
    }
    else {
        int pagesOnCover;
        if (time < 1.0) {
            pagesOnCover = int((time - singleTime) / deltaPageTime);
        }
        else {
            pagesOnCover = int((2.0 - time - timePerPage) / deltaPageTime);
        }
        bottomPageIndex = getPageIndex(pagesOnCover, false);
        depth = coverDepth + float(pagesOnCover) * pageDepth;
    }
    float bottom = dimensions.y - depth;
    
    if (side == BottomSide) {
        vUV = mapUV(color.xy, bottomPageIndex);
        vNormal = vec3(0.0, -1.0, 0.0);
        return vec3(color.x * dimensions.x, bottom, color.y * dimensions.z);
    }
    if (side == NorthSide) {
        vUV = mapUV(color.xy, TextureIndexFrontNorth);
        vNormal = vec3(0.0, 0.0, 1.0);
        return vec3(color.x * dimensions.x, color.y * depth + bottom, dimensions.z);
    }
    if (side == SouthSide) {
        vUV = mapUV(color.xy, TextureIndexFrontSouth);
        vNormal = vec3(0.0, 0.0, -1.0);
        return vec3(color.x * dimensions.x, color.y * depth + bottom, 0);
    }
    if (side == PagesSide) {
        vUV = mapUV(color.xy, TextureIndexFrontPages);
        vNormal = vec3(1.0, 0.0, 0.0);
        return vec3(dimensions.x, color.x * depth + bottom, color.y * dimensions.z);
    }
    if (side == BinderSide) {
        vUV = mapUV(color.xy, TextureIndexFrontBinder);
        vNormal = vec3(-1.0, 0.0, 0.0);
        return vec3(0, color.x * depth + bottom, color.y * dimensions.z);
    }
}

vec3 renderPageBody(int side, int pageNum) {
    if (time == 0.0 || time == 1.0 || time == 2.0) {
        bHide = true;
    }
    bHide = true;
    return vec3(0.0);
}

vec3 renderBackBody(int side) {
    if (time == 0.0 || time == 1.0 || time == 2.0) {
        bHide = true;
        return vec3(0.0);
    }
    // bHide = true;
    // return vec3(0.0);
    
    if (side == BottomSide) {
        vUV = mapUV(color.xy, TextureIndexBackBottom);
        vNormal = vec3(0.0, -1.0, 0.0);
        return vec3(color.x * dimensions.x, 0, color.y * dimensions.z);
    }
    
    float singleTime = timePerPage * 1.5; // time the cover is shown without a page
    int frontPageIndex;
    float depth;
    if (time > 1.0 - deltaPageTime - timePerPage && time < 1.0 + singleTime) {
        frontPageIndex = TextureIndexBackTop;
        depth = coverDepth;
    }
    else {
        int pagesOnCover;
        if (time < 1.0) {
            pagesOnCover = min(int((1.0 - time) / deltaPageTime), pageCount);
        }
        else {
            pagesOnCover = min(int((time + singleTime - 1.0) / deltaPageTime), pageCount);
        }
        frontPageIndex = getPageIndex(pageCount - pagesOnCover, true);
        depth = coverDepth + float(pagesOnCover) * pageDepth;
    }
    
    if (side == TopSide) {
        vUV = mapUV(color.xy, frontPageIndex);
        vNormal = vec3(0.0, 1.0, 0.0);
        return vec3(color.x * dimensions.x, depth, color.y * dimensions.z);
    }
    if (side == NorthSide) {
        vUV = mapUV(color.xy, TextureIndexFrontNorth);
        vNormal = vec3(0.0, 0.0, 1.0);
        return vec3(color.x * dimensions.x, color.y * depth, dimensions.z);
    }
    if (side == SouthSide) {
        vUV = mapUV(color.xy, TextureIndexFrontSouth);
        vNormal = vec3(0.0, 0.0, -1.0);
        return vec3(color.x * dimensions.x, color.y * depth, 0);
    }
    if (side == PagesSide) {
        vUV = mapUV(color.xy, TextureIndexFrontPages);
        vNormal = vec3(1.0, 0.0, 0.0);
        return vec3(dimensions.x, color.x * depth, color.y * dimensions.z);
    }
    if (side == BinderSide) {
        vUV = mapUV(color.xy, TextureIndexFrontBinder);
        vNormal = vec3(-1.0, 0.0, 0.0);
        return vec3(0, color.x * depth, color.y * dimensions.z);
    }
}

void main(void) {
    int bodySide = floatToInt(color[2], 64.0);
    int body = int(bodySide / 8);
    int side = bodySide - body * 8;
    int pageNum = floatToInt(color[3], 64.0);
    
    pageCount = int(round((dimensions.y - 2.0 * coverDepth) / pageDepth));
    timePerPage = 1.0 / (float(pageCount - flipPages) + 3.5);
    deltaPageTime = timePerPage / float(flipPages);
    
    vec3 newPosition;
    
    vUV = vec2(0.0, 0.0); // Pass UV coordinates to the fragment shader
    
    if (body == FrontBody) {
        newPosition = renderFrontBody(side);
    }
    else if (body == PageBody) {
        newPosition = renderPageBody(side, pageNum);
    }
    else if (body == BackBody) {
        newPosition = renderBackBody(side);
    }
    
    /*
    newPosition = getBend(newPosition);
    
    float theta = -time * PI;
    if (time > 1.0) {
        theta = - theta;
    }
    newPosition = rotate(newPosition + offset, theta);
    
    vNormal = rotate(vNormal, theta);
    */
    
    gl_Position = worldViewProjection * vec4(newPosition, 1.0);
    
    vPositionW = vec3(world * vec4(newPosition, 1.0));
    
    if (bHide) {
        vNormalW = vec3(0.0);
    }
    else {
        vNormalW = normalize(vec3(world * vec4(vNormal, 0.0)));
    }
}

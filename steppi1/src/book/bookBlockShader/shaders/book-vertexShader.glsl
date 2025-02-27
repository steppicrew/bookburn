precision highp float;

// color contains [u, v, (body + side)/64, pageNum/64 ]
attribute vec4 color;

uniform mat4 world;
uniform mat4 worldViewProjection;

uniform float time; // a float between 0 and 2. 0 and 2 means original position, 0<time1<=1 means turning from right to left, 1<time1<=2 means turning from left to right
uniform float floppyness; // 0 means not floppy at all, 1 means floppy
uniform int pageCount; // Number of pages (excluding covers)
uniform int flipPages; // max number of pages to flip
uniform vec2 dimensions; // page's width, height, and depth
uniform float pageDepth; // Depth of one page
uniform float coverDepth; // Depth of one page
uniform vec2 coverOverlap; // The width of the cover overlapping the pages
uniform vec4 textureUVs[30]; // Texture clippings
uniform float textureIndexes[30]; // TextureIndexes
uniform int textureCount; // Number of textures
uniform float flipAngle;

out vec2 vUV;
out vec3 vPositionW;
out vec3 vNormalW;

struct MyResult {
    vec3 position; // local position
    vec3 normal; // local normal vector
    vec2 uv;
    vec3 rotationOffset;
    float theta;
    bool hide;
};

struct MyInput {
    vec2 uv;
    int side;
    int pageNum;
};

float frontCoverHeadStart; // time after head cover's flip start to start first page
float timePerPage; // time to flip one page
float deltaPageTime; // time difference between two pages start flipping
int minFlipPageIndex; // index of smallest page to flip (may be < 0 or > pageCount - 1)
int maxFlipPageIndex; // index of largest page to flip (may be < 0 or > pageCount - 1)
int realMinPageIndex; // index of smallest page to flip (clipped between 0 and pageCount - 1)
int realMaxPageIndex; // index of largest page to flip (clipped between 0 and pageCount - 1)
float bookDepth; // depth of book incl. covers
float frontBlockDepth; // depth of pages on front cover
float backBlockDepth; // depth of pages on back cover
float centerY; // point to rotate around
float easedTime;
float binderFactor;
float maxAngle;
float binderTop;
float flippingPagesRadius;
float realTime;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = PI / 2.0;

const bool renderFrontCover = true;
const bool renderFrontBlock = true;
const bool renderPages = true;
const bool renderBackBlock = true;
const bool renderBackCover = true;
const bool renderBinder = true;

// Body definitions
const int FrontCoverBody = 1;
const int FrontBlockBody = 2;
const int PageBody = 3;
const int BackBlockBody = 4;
const int BackCoverBody = 5;
const int BinderBody = 6;

// Side definitions
const int TopSide = 1;
const int BottomSide = 2;
const int NorthSide = 3;
const int EastSide = 4;
const int SouthSide = 5;
const int BinderSide = 6;

// Texture indexes
const int TextureIndexFrontCoverTop = 0;
const int TextureIndexFrontCoverBottom = 1;
const int TextureIndexFrontCoverNorth = 2;
const int TextureIndexFrontCoverEast = 3;
const int TextureIndexFrontCoverSouth = 4;

const int TextureIndexBlockNorth = 5;
const int TextureIndexBlockEast = 6;
const int TextureIndexBlockSouth = 7;

const int TextureIndexBackCoverTop = 8;
const int TextureIndexBackCoverBottom = 9;
const int TextureIndexBackCoverNorth = 10;
const int TextureIndexBackCoverEast = 11;
const int TextureIndexBackCoverSouth = 12;

const int TextureIndexBinderInner = 13;
const int TextureIndexBinderOuter = 14;
const int TextureIndexBinderNorth = 15;
const int TextureIndexBinderSouth = 16;

const int TextureIndexPagesOffest = 17;

float ease(float x) {
    return x;
    return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 5.0) / 2.0;
}

// Initialize global variables
void init(void) {
    maxAngle = flipAngle; // == 0.0 ? PI : flipAngle;
    realTime = time;
    if (maxAngle < 0.075) {
        maxAngle = PI;
        realTime = 0.0;
    }
    if (realTime < 0.0 || realTime >= 2.0) {
        realTime = 0.0;
    }
    

    /*
    tp: time1 to turn one page
    td: time1 between two ordniary pages
    pf: pages flipped simltainiously
    pc: total number of pages (excl. cover)
    1. After tp/2 (the front cover is at 90°) the first page starts it's turn.
    Then starts every td one of pc pages (incl. back cover). The cover needs tp to finish it's turn.
        => 1 = tp/2 + pc * td + tp          td = tp / pf
        => 1 = tp * (1.5 + pc / pf)
        => tp = 1 / (1.5 + pc / pf)
    */
    if (flipPages > 1) {
        timePerPage = 1.0 / (1.5 + float(pageCount) / float(flipPages));
        frontCoverHeadStart = timePerPage / 2.0;
    }
    else {
        timePerPage = 1.0 / (2.0 + float(pageCount) / float(flipPages));
        frontCoverHeadStart = timePerPage;
    }
    deltaPageTime = timePerPage / float(flipPages);
    
    if (realTime <= 1.0) {
        easedTime = ease(realTime);
        float timeLeft = 1.0 - easedTime - (timePerPage - deltaPageTime);
        maxFlipPageIndex = pageCount - int(floor(timeLeft / deltaPageTime));
        minFlipPageIndex = maxFlipPageIndex - (flipPages - 1);
    }
    else {
        easedTime = 1.0 + ease(realTime - 1.0);
        float timeLeft = 2.0 - easedTime - (timePerPage);
        minFlipPageIndex = int(floor(timeLeft / deltaPageTime));
        maxFlipPageIndex = minFlipPageIndex + (flipPages - 1);
    }
    
    bookDepth = 2.0 * coverDepth + float(pageCount) * pageDepth;
    realMinPageIndex = min(max(minFlipPageIndex, 0), pageCount - 1);
    realMaxPageIndex = min(max(maxFlipPageIndex, 0), pageCount - 1);
    frontBlockDepth = float(min(max(minFlipPageIndex, 0), pageCount)) * pageDepth;
    backBlockDepth = float(pageCount - realMaxPageIndex - 1) * pageDepth;
    
    // Front cover + front block
    float leftBlock = coverDepth + frontBlockDepth;

    // Back cover + back block
    float rightBlock = coverDepth + backBlockDepth;

    // Number of pages currently flipping
    float flippingPagesDepth = float(realMaxPageIndex - realMinPageIndex + 1) * pageDepth;
    flippingPagesRadius = flippingPagesDepth / maxAngle;

    centerY = max(leftBlock, rightBlock);
    binderFactor = 0.5 - abs(abs(1.0 - easedTime) - 0.5);
    binderFactor *= 0.4 * bookDepth;

    // centerY: global flip axis
    // flippingPagesDepth / maxAngle: radius of flipping pages circle
    binderTop = (centerY + flippingPagesRadius + coverDepth) * PI / maxAngle;
}

float binderFnRaw(float y) {
    // x = PI - arcsin(y / centerY + coverDepth) - PI/2
    return PI_2 - asin(y / binderTop);
}

float binderFn(float y) {
    if (realTime == 0.0 || realTime == 1.0) {
        return 0.0;
    }
    return binderFnRaw(y) * binderFactor;
}

// Normal vector on binderFn
vec3 binderFnNorm(float y) {
    if (realTime == 0.0 || realTime == 1.0) {
        return vec3(-1.0, 0.0, 0.0);
    }
    /*
        x(y) = (PI/2 - asin(y / (centerY + coverDepth))) * binderFactor
        x(y) = PI/2 * binderFactor - asin(y / (centerY + coverDepth)) * binderFactor
                    a(b) = asin(b) => a'(b) = 1/sqrt(1 - b²)
        x'(y) = -1/sqrt(1 - y²/(centerY + coverDepth)²) / (centerY + coverDepth) * binderFactor;
        => tangent(x) = (-1/sqrt(1 - y²/(centerY + coverDepth)²) * binderFactor, centerY + coverDepth)
        => normal(x) = (-centerY - coverDepth, -1/sqrt(1 - y²/(centerY + coverDepth)²) * binderFactor)
    */
    return normalize(vec3(
        -centerY - coverDepth,
        -1.0 / sqrt(1.0 - y * y/(binderTop * binderTop)) * binderFactor,
        0.0
    ));
}

float scew(float y) {
    float xMin = binderFn(centerY);
    float x = binderFn(y);
    x = x - xMin + flippingPagesRadius;
    return x;
}

MyResult newResult(void) {
    return MyResult(
        vec3(0.0), // position
        vec3(0.0), // normal
        vec2(0.0), // uv
        vec3(0.0, centerY, 0.0), // rotation offset
        0.0, // theta
        false); // hide
}

mat4 getRotationMatrix(float theta, vec3 axisPosition, vec3 axisDirection) {
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    vec3 u = normalize(axisDirection);  // Normalize the axis direction just in case
    
    // Outer product of the axis direction
    mat3 outer = outerProduct(u, u);
    
    // Skew-symmetric matrix for cross product
    mat3 crossProduct = mat3(0.0, -u.z, u.y, u.z, 0.0, -u.x, -u.y, u.x, 0.0);
    
    // Construct the rotation matrix
    mat3 rotationMatrix3x3 = cosTheta * mat3(1.0) + (1.0 - cosTheta) * outer + sinTheta * crossProduct;
    
    // Step 4: Convert the 3x3 rotation matrix into a 4x4 matrix
    mat4 rotationMatrix = mat4(vec4(rotationMatrix3x3[0], 0.0), vec4(rotationMatrix3x3[1], 0.0), vec4(rotationMatrix3x3[2], 0.0), vec4(0.0, 0.0, 0.0, 1.0));
    
    // Step 5: Build the translation matrices
    mat4 translateToOrigin = mat4(1.0);  // Identity matrix
    translateToOrigin[3] = vec4(-axisPosition, 1.0);  // Set the translation to -axisPos
    
    mat4 translateBack = mat4(1.0);  // Identity matrix
    translateBack[3] = vec4(axisPosition, 1.0);  // Set the translation to +axisPos
    
    // Step 6: Combine all matrices into one
    return translateBack * rotationMatrix * translateToOrigin;
}

vec3 rotatePosition(vec3 position, mat4 transformMatrix) {
    return (transformMatrix * vec4(position, 1.0)).xyz;
}

vec3 rotateNormal(vec3 normal, mat4 transformMatrix) {
    // Step 1: Compute the normal matrix (inverse transpose of the model matrix)
    mat3 normalMatrix = transpose(inverse(mat3(transformMatrix)));  // Convert mat4 to mat3 for normal transformation
    
    // Step 2: Transform the normal using the normal matrix
    return normalize(normalMatrix * normal);  // Apply the normal matrix and normalize the result
}

int getPageIndex(int pageNum, bool front) {
    int pageTextureCount = textureCount - TextureIndexPagesOffest;
    int index = 2 * pageNum + (front ? 0 : 1);
    return index % pageTextureCount + TextureIndexPagesOffest;
}

vec2 mapUV(vec2 uv, int index) {
    vec4 boundingBox = textureUVs[int(textureIndexes[index])];
    float width = boundingBox.z - boundingBox.x;
    float height = boundingBox.w - boundingBox.y;
    return vec2(uv.x * width + boundingBox.x, uv.y * height + boundingBox.y);
}

vec2 mapUVMirror(vec2 uv, int index) {
    vec4 boundingBox = textureUVs[int(textureIndexes[index])];
    float width = boundingBox.z - boundingBox.x;
    float height = boundingBox.w - boundingBox.y;
    return vec2(boundingBox.z - uv.x * width, uv.y * height + boundingBox.y);
}

float getFrontCoverAngle(void) {
    if (easedTime > timePerPage && easedTime < 2.0 - timePerPage) {
        return maxAngle;
    } else {
        float t = easedTime < 1.0 ? easedTime : (2.0 - easedTime);
        return maxAngle * t / timePerPage;
    }
}

MyResult renderFrontCoverBody(MyInput data) {
    MyResult result = newResult();
    
    if(!renderFrontCover) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;
    
    if (side == TopSide) {
        result.uv = mapUV(uv, TextureIndexFrontCoverTop);
        result.normal = vec3(0.0, 1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, coverDepth, uv.y * dimensions.y);
    }
    else if (side == BottomSide) {
        result.uv = mapUVMirror(uv, TextureIndexFrontCoverBottom);
        result.normal = vec3(0.0, -1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, 0.0, uv.y * dimensions.y);
    }
    else if (side == NorthSide) {
        result.uv = mapUV(uv, TextureIndexFrontCoverNorth);
        result.normal = vec3(0.0, 0.0, 1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * coverDepth, dimensions.y);
    }
    else if (side == SouthSide) {
        result.uv = mapUVMirror(uv, TextureIndexFrontCoverSouth);
        result.normal = vec3(0.0, 0.0, -1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * coverDepth, 0);
    }
    else if (side == EastSide) {
        result.uv = mapUV(uv, TextureIndexFrontCoverEast);
        result.normal = vec3(1.0, 0.0, 0.0);
        result.position = vec3(dimensions.x, uv.x * coverDepth, uv.y * dimensions.y);
    }
    result.position.y += centerY + frontBlockDepth;
    
    result.theta = getFrontCoverAngle();
    
    return result;
}

MyResult renderFrontBlockBody(MyInput data) {
    MyResult result = newResult();
    
    if (!renderFrontBlock || minFlipPageIndex <= 0) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;

    vec2 pageDimensions = dimensions - coverOverlap - vec2(0.0, coverOverlap.y);

    float yPart = frontBlockDepth / (bookDepth - 2.0 * coverDepth);
    vec2 UV = uv;
    if (side == EastSide) {
        UV = UV.yx;
    }

    if (side == BottomSide) {
        if (realTime == 0.0 || realTime == 1.0) {
            result.hide = true;
            return result;
        }
        int topPageIndex = getPageIndex(minFlipPageIndex < 0 ? 0 : realMinPageIndex - 1, false);
        result.uv = mapUVMirror(UV, topPageIndex);
        result.normal = vec3(0.0, -1.0, 0.0);
        result.position = vec3(uv.x * pageDimensions.x, 0.0, uv.y * pageDimensions.y);
    }
    else {
        UV.y = 1.0 - (1.0 - UV.y) * yPart;
        if (side == NorthSide) {
            result.uv = mapUV(UV, TextureIndexBlockNorth);
            result.normal = vec3(0.0, 0.0, 1.0);
            result.position = vec3(uv.x * pageDimensions.x, uv.y * frontBlockDepth, pageDimensions.y);
        }
        else if (side == SouthSide) {
            result.uv = mapUVMirror(UV, TextureIndexBlockSouth);
            result.normal = vec3(0.0, 0.0, -1.0);
            result.position = vec3(uv.x * pageDimensions.x, uv.y * frontBlockDepth, 0);
        }
        else if (side == EastSide) {
            result.uv = mapUV(UV, TextureIndexBlockEast);
            result.normal = vec3(1.0, 0.0, 0.0);
            result.position = vec3(pageDimensions.x, uv.x * frontBlockDepth, uv.y * pageDimensions.y);
        }
    }
    result.position.y += centerY;
    result.position.z += coverOverlap.y;

    result.theta = maxAngle;

    return result;
}

MyResult renderPageBody(MyInput data) {
    MyResult result = newResult();
    
    if(!renderPages || realTime == 0.0 || realTime == 1.0 || data.pageNum >= flipPages) {
        result.hide = true;
        return result;
    }
    
    int index = minFlipPageIndex + data.pageNum;
    
    if(index < 0 || index >= pageCount) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;
    
    int pageNum = minFlipPageIndex + data.pageNum;

    vec2 pageDimensions = dimensions - coverOverlap - vec2(0.0, coverOverlap.y);

    // Start bending page
    {
        float t = realTime < 1.0 ? (easedTime - frontCoverHeadStart) : ((2.0 - easedTime) - deltaPageTime);
        float time = (t / deltaPageTime - float(pageNum)) / float(flipPages);
        
        // k: 1/r
        float normTime = 1.0 - time;
        float k = -2.0 * floppyness * (0.5 - abs(0.5 - normTime)) * sign(1.0 - realTime);

        k *= maxAngle / PI;
        
        // k = 0.0;
        
        // There are floating point errors for too small k
        if (abs(k) < 0.001) {
            result.position = vec3(uv.x * pageDimensions.x, 0.0, uv.y * pageDimensions.y);
            result.normal = vec3(0.0, 1.0, 0.0);
        } else {
            // Circle's radius
            float r = 1.0 / k;
            
            // Angle the page equals on the circle
            float theta = dimensions.x / r;
            
            // Coordinates of the circle's center
            float x_c = sin(theta / 2.0) * r;
            float y_c = cos(theta / 2.0) * r;
            
            // Angle from the the lot (+- theta/2)
            float theta_ = theta * (uv.x - 0.5);
            
            result.position = vec3(
                (sin(theta_) * r + x_c),
                -(cos(theta_) * r - y_c),
                uv.y * pageDimensions.y);
            
            result.normal = normalize(vec3(
                    -sin(theta_),
                    cos(theta_),
                    0.0));
        }
        result.position.x += flippingPagesRadius;
        result.position.y += centerY;
        result.position.z += coverOverlap.y;
    }
    // End bendng page
    
    if (side == TopSide) {
        result.uv = mapUV(uv, getPageIndex(pageNum, true));
    } else if(side == BottomSide) {
        result.uv = mapUVMirror(uv, getPageIndex(pageNum, false));
        result.normal = -result.normal;
    }
    
    float t = time < 1.0 ? (easedTime - frontCoverHeadStart) : ((2.0 - easedTime) - deltaPageTime);
    result.theta = (t / deltaPageTime - float(index)) / float(flipPages) * maxAngle;
    
    return result;
}

MyResult renderBackBlockBody(MyInput data) {
    MyResult result = newResult();
    
    if(!renderBackBlock || realMaxPageIndex == pageCount - 1) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;
    
    vec2 pageDimensions = dimensions - coverOverlap - vec2(0.0, coverOverlap.y);

    float yPart = backBlockDepth / (bookDepth - 2.0 * coverDepth);
    vec2 UV = uv;
    if (side == EastSide) {
        UV = UV.yx;
    }

    if (side == TopSide) {
        if (time == 0.0 || time == 1.0 || time == 2.0) {
            result.hide = true;
            return result;
        }
        int topPageIndex = getPageIndex(maxFlipPageIndex < 0 ? 0 : maxFlipPageIndex + 1, true);
        result.uv = mapUV(UV, topPageIndex);
        result.normal = vec3(0.0, 1.0, 0.0);
        result.position = vec3(uv.x * pageDimensions.x, backBlockDepth, uv.y * pageDimensions.y);
    }
    else {
        UV.y = UV.y * yPart;
        if (side == NorthSide) {
            result.uv = mapUV(UV, TextureIndexBlockNorth);
            result.normal = vec3(0.0, 0.0, 1.0);
            result.position = vec3(uv.x * pageDimensions.x, uv.y * backBlockDepth, pageDimensions.y);
        }
        else if (side == SouthSide) {
            result.uv = mapUVMirror(UV, TextureIndexBlockSouth);
            result.normal = vec3(0.0, 0.0, -1.0);
            result.position = vec3(uv.x * pageDimensions.x, uv.y * backBlockDepth, 0);
        }
        else if (side == EastSide) {
            result.uv = mapUV(UV, TextureIndexBlockEast);
            result.normal = vec3(1.0, 0.0, 0.0);
            result.position = vec3(pageDimensions.x, uv.x * backBlockDepth, uv.y * pageDimensions.y);
        }
    }
    result.position.y += centerY - backBlockDepth;
    result.position.z += coverOverlap.y;
    
    return result;
}

float getBackCoverAngle(void) {
    if (easedTime < 1.0 - timePerPage || easedTime > 1.0 + timePerPage) {
        return 0.0;
    }
    float t = timePerPage - abs(easedTime - 1.0);
    return maxAngle * t / timePerPage;
}

MyResult renderBackCoverBody(MyInput data) {
    MyResult result = newResult();
    
    if(!renderBackCover) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;
    
    if (side == TopSide) {
        result.uv = mapUV(uv, TextureIndexBackCoverTop);
        result.normal = vec3(0.0, 1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, coverDepth, uv.y * dimensions.y);
    }
    else if (side == BottomSide) {
        result.uv = mapUVMirror(uv, TextureIndexBackCoverBottom);
        result.normal = vec3(0.0, -1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, 0.0, uv.y * dimensions.y);
    }
    else if (side == NorthSide) {
        result.uv = mapUV(uv, TextureIndexBackCoverNorth);
        result.normal = vec3(0.0, 0.0, 1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * coverDepth, dimensions.y);
    }
    else if (side == SouthSide) {
        result.uv = mapUVMirror(uv, TextureIndexBackCoverSouth);
        result.normal = vec3(0.0, 0.0, -1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * coverDepth, 0);
    }
    else if (side == EastSide) {
        result.uv = mapUV(uv, TextureIndexBackCoverEast);
        result.normal = vec3(1.0, 0.0, 0.0);
        result.position = vec3(dimensions.x, uv.x * coverDepth, uv.y * dimensions.y);
    }
    else if (side == BinderSide) {
        result.uv = mapUV(vec2((uv.x * coverDepth) / bookDepth, uv.y), TextureIndexBinderOuter);
        result.normal = vec3(-1.0, 0.0, 0.0);
        result.position = vec3(0.0, uv.x * coverDepth, uv.y * dimensions.y);
    }
    result.position.y += centerY - backBlockDepth - coverDepth;
    
    result.theta = getBackCoverAngle();
    
    return result;
}

MyResult renderBinderBody(MyInput data) {
    MyResult result = newResult();
    
    if(!renderBinder) {
        result.hide = true;
        return result;
    }
    
    vec2 uv = data.uv;
    int side = data.side;

    float frontCoverMaxX = coverDepth / bookDepth;
    float frontBlockMaxX = (frontBlockDepth + coverDepth) / bookDepth;
    float backBlockMinX = 1.0 - (backBlockDepth + coverDepth) / bookDepth;
    float backCoverMinX = 1.0 - coverDepth / bookDepth;

    vec3 normal;
    if (uv.x <= frontCoverMaxX) {
        // Binder on front cover
        result.position.y = centerY + coverDepth + frontBlockDepth - uv.x * bookDepth;
        result.theta = getFrontCoverAngle();
        normal = vec3(-1.0, 0.0, 0.0);
    }
    else if (uv.x < frontBlockMaxX) {
        // Binder on front block (left)
        float y = centerY - (frontBlockMaxX - uv.x) * bookDepth;
        result.position.y = 2.0 * centerY - y;

        result.theta = maxAngle;

        normal = binderFnNorm(y);
    }
    else if (uv.x >= frontBlockMaxX && uv.x <= backBlockMinX) {
        // Binder on flipping pages (middle)
        result.position.y = centerY;
        result.position.x = 0.0;

        normal = vec3(-1.0, 0.0, 0.0);

        float frontCoverAngle = getFrontCoverAngle();
        float backCoverAngle = getBackCoverAngle();
        float thetaMax = frontCoverAngle - backCoverAngle;

        float width = backBlockMinX - frontBlockMaxX;

        result.theta = (backBlockMinX - uv.x) / width * thetaMax + backCoverAngle;
    }
    else  if (uv.x <= backCoverMinX) {
        // Binder on back block (right)
        result.position.y = centerY - (uv.x - backBlockMinX) * bookDepth;

        normal = binderFnNorm(result.position.y);
    }
    else {
        // Binder on back cover
        result.position.y = centerY - backBlockDepth - (uv.x - backCoverMinX) * bookDepth;
        result.theta = getBackCoverAngle();
        normal = vec3(-1.0, 0.0, 0.0);
    }


    if (side == TopSide) {
        result.uv = mapUV(vec2(uv.x, uv.y), TextureIndexBinderInner);
        result.position -= normal * coverDepth;
        result.position.z = uv.y * dimensions.y;
        result.normal = -normal;
    }
    else if (side == BottomSide) {
        result.uv = mapUVMirror(vec2(uv.x, uv.y), TextureIndexBinderOuter);
        result.position.z = uv.y * dimensions.y;
        result.normal = normal;
    }
    else if (side == NorthSide) {
        result.uv = mapUV(uv, TextureIndexBinderNorth);
        result.normal = vec3(0.0, 0.0, 1.0);
        if (uv.x == 0.0 || uv.x == 1.0) {
            normal.y = 0.0;
            normal = normalize(normal);
        }
        result.position -= uv.y * normal * coverDepth;
        result.position.z = dimensions.y;
    }
    else if (side == SouthSide) {
        result.uv = mapUVMirror(uv, TextureIndexBinderSouth);
        result.normal = vec3(0.0, 0.0, -1.0);
        if (uv.x == 0.0 || uv.x == 1.0) {
            normal.y = 0.0;
            normal = normalize(normal);
        }
        result.position -= uv.y * normal * coverDepth;
    }
    
    return result;
}

void main(void) {
    init();
    
    int bodySide = int(round(color[2]));
    int body = bodySide / 8;
    MyInput data = MyInput(color.xy, bodySide - body * 8, int(round(color[3])));
    
    MyResult result;
    
    if (body == FrontCoverBody) {
        result = renderFrontCoverBody(data);
    } else if (body == FrontBlockBody) {
        result = renderFrontBlockBody(data);
    } else if (body == PageBody) {
        result = renderPageBody(data);
    } else if (body == BackBlockBody) {
        result = renderBackBlockBody(data);
    } else if (body == BackCoverBody) {
        result = renderBackCoverBody(data);
    } else if (body == BinderBody) {
        result = renderBinderBody(data);
    }
    
    float y = result.position.y;
    if (result.theta == maxAngle) {
        y = 2.0 * centerY - y;
    }
    if (body != PageBody) {
        result.position.x += scew(y);
    }
    
    if(!result.hide && result.theta != 0.0) {
        mat4 modelMatrix = getRotationMatrix(-result.theta, result.rotationOffset, vec3(0.0, 0.0, 1.0));
        result.position = rotatePosition(result.position, modelMatrix);
        result.normal = rotateNormal(result.normal, modelMatrix);
    }
    
    /*
    newPosition = getBend(newPosition);
    
    float theta = -time1 * PI;
    if (time1 > 1.0) {
        theta = - theta;
    }
    newPosition = rotate(newPosition + offset, theta);
    
    vNormal = rotate(vNormal, theta);
    */
    
    gl_Position = worldViewProjection * vec4(result.position, 1.0);
    vUV = result.uv;
    
    vPositionW = rotatePosition(result.position, world);
    if(result.hide) {
        vNormalW = vec3(0.0);
    } else {
        vNormalW = rotateNormal(result.normal, world);
    }
}

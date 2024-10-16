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
uniform vec4 textureUVs[20]; // Texture clippings
uniform int textureCount; // Number of textures

varying vec2 vUV;
varying vec3 vPositionW;
varying vec3 vNormalW;

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
int minFlipPageIndex;
int maxFlipPageIndex;
float bookDepth;
vec3 frontCoverOffset;
vec3 backCoverOffset;
float topY;
float time1;

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = PI / 2.0;

const bool renderFront = true;
const bool renderPages = true;
const bool renderBack = true;

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

float ease(float x) {
    return x < 0.5 ? 16.0 * x * x * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 5.0) / 2.0;
}

// Initialize global variables
void init(void) {
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
    if(flipPages > 1) {
        timePerPage = 1.0 / (1.5 + float(pageCount) / float(flipPages));
        frontCoverHeadStart = timePerPage / 2.0;
    } else {
        timePerPage = 1.0 / (2.0 + float(pageCount) / float(flipPages));
        frontCoverHeadStart = timePerPage;
    }
    deltaPageTime = timePerPage / float(flipPages);
    
    if(time <= 1.0) {
        time1 = ease(time);
        float timeLeft = 1.0 - time1 - (timePerPage - deltaPageTime);
        maxFlipPageIndex = pageCount - int(floor(timeLeft / deltaPageTime));
        minFlipPageIndex = maxFlipPageIndex - (flipPages - 1);
    } else {
        time1 = 1.0 + ease(time - 1.0);
        float timeLeft = 2.0 - time1 - (timePerPage);
        minFlipPageIndex = int(floor(timeLeft / deltaPageTime));
        maxFlipPageIndex = minFlipPageIndex + (flipPages - 1);
    }
    bookDepth = 2.0 * coverDepth + float(pageCount) * pageDepth;
    
    if (time == 0.0 || time == 2.0) {
        frontCoverOffset = vec3(0.0);
        backCoverOffset = vec3(0.0);
    }
    else if (time == 1.0) {
        frontCoverOffset = vec3(0.0, bookDepth, 0.0);
        backCoverOffset = vec3(0.0);
    }
    else {
        int minPageIndex = max(minFlipPageIndex, 0);
        int maxPageIndex = min(maxFlipPageIndex, pageCount);
        float frontBlockDepth = coverDepth + float(minPageIndex) * pageDepth;
        float backBlockDepth = coverDepth + float(pageCount - maxFlipPageIndex - 1) * pageDepth;
        frontCoverOffset = vec3(-float(maxPageIndex - minPageIndex + 1) * pageDepth / PI_2, max(backBlockDepth, frontBlockDepth), 0.0);
        backCoverOffset = vec3(0.0, max(frontBlockDepth - backBlockDepth, 0.0), 0.0);
    }
    topY = frontCoverOffset.y;
}

float binderFn(vec3 position) {
    if (time == 0.0 || time == 1.0 || time == 2.0) {
        return 0.0;
    }
    float x = sqrt((topY - position.y) / 3.0) * (0.5 - abs(abs(1.0 - time1) - 0.5));
    if (position.x < 0.0) {
        return -x;
    }
    return x;
}

vec3 scew(vec3 position) {
    return vec3(position.x + binderFn(position), position.yz);
}

MyResult newResult(void) {
    return MyResult(
        vec3(0.0), // position
        vec3(0.0), // normal
        vec2(0.0), // uv
        vec3((frontCoverOffset.x + backCoverOffset.x) / 2.0, frontCoverOffset.y, 0.0), // rotation offset
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

int floatToInt(float number, float basis) {
    return int(round(number * basis));
}

int getPageIndex(int pageNum, bool front) {
    int pageTextureCount = textureCount - TextureIndexPagesOffest;
    int index = 2 * pageNum + (front ? 0 : 1);
    return index % pageTextureCount + TextureIndexPagesOffest;
}

vec2 mapUV(vec2 uv, int index) {
    vec4 boundingBox = textureUVs[index];
    float width = boundingBox.z - boundingBox.x;
    float height = boundingBox.w - boundingBox.y;
    return vec2(uv.x * width + boundingBox.x, uv.y * height + boundingBox.y);
}

vec2 mapUVMirror(vec2 uv, int index) {
    vec4 boundingBox = textureUVs[index];
    float width = boundingBox.z - boundingBox.x;
    float height = boundingBox.w - boundingBox.y;
    return vec2(boundingBox.z - uv.x * width, uv.y * height + boundingBox.y);
}

MyResult positionFrontBody(MyInput data) {
    MyResult result = newResult();
    vec2 uv = data.uv;
    int side = data.side;
    
    // result.hide = true;
    // return result;
    
    // Calculate bottom page's texture and box's depth
    float singleTime = timePerPage + frontCoverHeadStart; // time1 the cover is shown without a page
    int bottomPageIndex;
    float depth;
    if(time == 0.0 || time == 1.0 || time == 2.0) {
        bottomPageIndex = TextureIndexBackBottom;
        depth = bookDepth;
    }
    else if(minFlipPageIndex <= 0) {
        bottomPageIndex = TextureIndexFrontBottom;
        depth = coverDepth;
    } else {
        int index = min(minFlipPageIndex, pageCount) - 1;
        bottomPageIndex = getPageIndex(index, false);
        depth = coverDepth + float(max(index, 0) + 1) * pageDepth;
    }
    
    if (side == TopSide) {
        result.uv = mapUV(uv, TextureIndexFrontTop);
        result.normal = vec3(0.0, 1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, depth, uv.y * dimensions.y);
    }
    else if (side == BottomSide) {
        result.uv = mapUVMirror(uv, bottomPageIndex);
        result.normal = vec3(0.0, -1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, 0, uv.y * dimensions.y);
    }
    else if (side == NorthSide) {
        result.uv = mapUV(uv, TextureIndexFrontNorth);
        result.normal = vec3(0.0, 0.0, 1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * depth, dimensions.y);
    }
    else if (side == SouthSide) {
        result.uv = mapUV(uv, TextureIndexFrontSouth);
        result.normal = vec3(0.0, 0.0, -1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * depth, 0);
    }
    else if (side == PagesSide) {
        result.uv = mapUV(uv, TextureIndexFrontPages);
        result.normal = vec3(1.0, 0.0, 0.0);
        result.position = vec3(dimensions.x, uv.x * depth, uv.y * dimensions.y);
    }
    if(side == BinderSide) {
        result.uv = mapUV(uv, TextureIndexFrontBinder);
        result.normal = vec3(-1.0, 0.0, 0.0);
        result.position = vec3(0.0, uv.x * depth, uv.y * dimensions.y);
    }
    result.position += frontCoverOffset;
    result.rotationOffset = frontCoverOffset;
    
    return result;
}

MyResult renderFrontBody(MyInput data) {
    MyResult result = positionFrontBody(data);
    
    if(!renderFront) {
        result.hide = true;
        return result;
    }
    
    if(time == 0.0 || time == 2.0) {
        return result;
    }
    
    if(time1 > timePerPage && time1 < 2.0 - timePerPage) {
        result.theta = PI;
    } else {
        float t = time1 < 1.0 ? time1 : (2.0 - time1);
        result.theta = PI * t / timePerPage;
    }
    
    return result;
}

/*
int floor(float num) {
    int result = int(num);
    if (result >= 0) {
        return result;
    }
    if (num == float(result)) {
        return result;
    }
    return result - 1;
}
*/

float frac(float num) {
    return num - floor(num);
}

MyResult positionPageBody(MyInput data) {
    MyResult result = newResult();
    vec2 uv = data.uv;
    int side = data.side;
    
    int pageNum = minFlipPageIndex + data.pageNum;
    
    // Start bending page
    {
        float t = time < 1.0 ? (time1 - frontCoverHeadStart) : ((2.0 - time1) - deltaPageTime);
        float _time = (t / deltaPageTime - float(pageNum)) / float(flipPages);
        
        // k: 1/r
        float normTime = 1.0 - _time;
        float k = -2.0 * floppyness * (0.5 - abs(0.5 - abs(normTime))) * sign(normTime);
        
        // k = 0.0;
        
        if (k == 0.0) {
            result.position = vec3(uv.x * dimensions.x, 0.0, uv.y * dimensions.y);
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
                uv.y * dimensions.y);
            
            result.normal = normalize(vec3(
                    -sin(theta_),
                    cos(theta_),
                    0.0));
        }
        result.position += vec3(0.0, frontCoverOffset.y, 0);
    }
    // End bendng page
    
    if (side == TopSide) {
        result.uv = mapUV(uv, getPageIndex(pageNum, true));
    } else if(side == BottomSide) {
        result.uv = mapUVMirror(uv, getPageIndex(pageNum, false));
        result.normal = -result.normal;
    }
    
    return result;
}

MyResult renderPageBody(MyInput data) {
    if(!renderPages || time == 0.0 || time == 1.0 || time == 2.0 || data.pageNum >= flipPages) {
        MyResult result = newResult();
        result.hide = true;
        return result;
    }
    
    int index = minFlipPageIndex + data.pageNum;
    
    if(index < 0 || index >= pageCount) {
        MyResult result = newResult();
        result.hide = true;
        return result;
    }
    
    MyResult result = positionPageBody(data);
    
    float t = time < 1.0 ? (time1 - frontCoverHeadStart) : ((2.0 - time1) - deltaPageTime);
    result.theta = (t / deltaPageTime - float(index)) / float(flipPages) * PI;
    
    return result;
}

MyResult positionBackBody(MyInput data) {
    MyResult result = newResult();
    vec2 uv = data.uv;
    int side = data.side;
    
    // Calculate top page's texture and box's depth
    float singleTime = timePerPage * 1.5; // time1 the cover is shown without a page
    int topPageIndex;
    float depth;
    
    if(maxFlipPageIndex >= pageCount - 1) {
        topPageIndex = TextureIndexBackTop;
        depth = coverDepth;
    } else {
        int index = max(min(maxFlipPageIndex + 1, pageCount - 1), 0);
        topPageIndex = getPageIndex(index, true);
        depth = coverDepth + float(max(pageCount - index, 0)) * pageDepth;
    }
    
    if (side == TopSide) {
        result.uv = mapUV(uv, topPageIndex);
        result.normal = vec3(0.0, 1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, depth, uv.y * dimensions.y);
    } else if(side == BottomSide) {
        result.uv = mapUVMirror(uv, TextureIndexBackBottom);
        result.normal = vec3(0.0, -1.0, 0.0);
        result.position = vec3(uv.x * dimensions.x, 0.0, uv.y * dimensions.y);
    }
    else if (side == NorthSide) {
        result.uv = mapUV(uv, TextureIndexBackNorth);
        result.normal = vec3(0.0, 0.0, 1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * depth, dimensions.y);
    }
    else if (side == SouthSide) {
        result.uv = mapUV(uv, TextureIndexBackSouth);
        result.normal = vec3(0.0, 0.0, -1.0);
        result.position = vec3(uv.x * dimensions.x, uv.y * depth, 0);
    }
    else if (side == PagesSide) {
        result.uv = mapUV(uv, TextureIndexBackPages);
        result.normal = vec3(1.0, 0.0, 0.0);
        result.position = vec3(dimensions.x, uv.x * depth, uv.y * dimensions.y);
    }
    else if (side == BinderSide) {
        result.uv = mapUV(uv, TextureIndexBackBinder);
        result.normal = vec3(-1.0, 0.0, 0.0);
        result.position = vec3(0, uv.x * depth, uv.y * dimensions.y);
    }
    result.position += backCoverOffset;
    result.rotationOffset.y += coverDepth;
    return result;
}

MyResult renderBackBody(MyInput data) {
    if(time == 0.0 || time == 1.0 || time == 2.0) {
        MyResult result = newResult();
        result.hide = true;
        return result;
    }
    
    if(!renderBack) {
        MyResult result = newResult();
        result.hide = true;
        return result;
    }
    
    MyResult result = positionBackBody(data);
    
    float theta;
    if(time1 > 1.0 - timePerPage && time1 < 1.0 + timePerPage) {
        float t = timePerPage - abs(1.0 - time1);
        result.theta = PI * t / timePerPage;
    }
    
    return result;
}

void main(void) {
    init();
    
    int bodySide = floatToInt(color[2], 64.0);
    int body = int(bodySide / 8);
    MyInput data = MyInput(color.xy, bodySide - body * 8, floatToInt(color[3], 64.0));
    
    MyResult result;
    
    if(body == FrontBody) {
        result = renderFrontBody(data);
    } else if(body == PageBody) {
        result = renderPageBody(data);
    } else if(body == BackBody) {
        result = renderBackBody(data);
    }
    
    if(!result.hide && result.theta != 0.0) {
        mat4 modelMatrix = getRotationMatrix(-result.theta, result.rotationOffset, vec3(0.0, 0.0, 1.0));
        result.position = rotatePosition(result.position, modelMatrix);
        result.normal = rotateNormal(result.normal, modelMatrix);
    }
    
    if((result.theta == 0.0 || result.theta == PI) && (body == FrontBody || body == BackBody)) {
        result.position = scew(result.position);
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

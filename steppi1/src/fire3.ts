import * as BABYLON from "babylonjs";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

// @from https://medium.com/@dirkk/campfire-vr-fa654d15e92a

// @from https://www.shadertoy.com/view/XsXSWS

export function makeCreateFire(
    scene: BABYLON.Scene
): (particles?: number, size?: number) => BABYLON.Mesh {
    const VERTEX_SHADER = `
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
    `;

    const FRAGMENT_SHADER = `
        precision highp float;

        uniform float time;

        // UV coordinates passed from the vertex shader
        varying vec3 vUv;

        vec2 hash( vec2 p )
        {
            p = vec2( dot(p,vec2(127.1,311.7)),
                    dot(p,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        float noise( in vec2 p )
        {
            const float K1 = 0.366025404; // (sqrt(3)-1)/2;
            const float K2 = 0.211324865; // (3-sqrt(3))/6;
            
            vec2 i = floor( p + (p.x+p.y)*K1 );
            
            vec2 a = p - i + (i.x+i.y)*K2;
            vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
            vec2 b = a - o + K2;
            vec2 c = a - 1.0 + 2.0*K2;
            
            vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
            
            vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
            
            return dot( n, vec3(70.0) );
        }

        float fbm(vec2 uv)
        {
            float f;
            mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
            f  = 0.5000*noise( uv ); uv = m*uv;
            f += 0.2500*noise( uv ); uv = m*uv;
            f += 0.1250*noise( uv ); uv = m*uv;
            f += 0.0625*noise( uv ); uv = m*uv;
            f = 0.5 + 0.5*f;
            return f;
        }

        void main(void)
        {
            vec2 uv = vUv.xy;
            vec2 q = uv;
            q.x *= 1.;
            q.y *= 2.;
            float strength = floor(q.x+1.);
            float T3 = max(3.,1.25*strength)*time;
            q.x = mod(q.x,1.)-0.5;
            q.y -= 0.25;
            float n = fbm(strength*q - vec2(0,T3));
            float c = 1. - 16. * pow( max( 0., length(q*vec2(1.8+q.y*1.5,.75) ) - n * max( 0., q.y+.25 ) ),1.2 );
            float c1 = n * c * (1.5-pow(1.25*uv.y,4.));
        //	float c1 = n * c * (1.5-pow(2.50*uv.y,4.));
            c1=clamp(c1,0.,1.);

            vec3 col = vec3(1.5*c1, 1.5*c1*c1*c1, c1*c1*c1*c1*c1*c1);
                        
            float a = c * (1.-pow(uv.y,3.));
            gl_FragColor = vec4( mix(vec3(0.),col,a), a);
        }

        void main_old(void) {
            // Use the UV coordinates to create a gradient (e.g., from red to blue)
            gl_FragColor = vec4(vUv.x, vUv.y, 1.0 - vUv.x, 1.0);
        }
    `;

    const shader = "shader" + Date.now() + Math.random();

    BABYLON.Effect.ShadersStore[`${shader}VertexShader`] = VERTEX_SHADER;
    BABYLON.Effect.ShadersStore[`${shader}FragmentShader`] = FRAGMENT_SHADER;

    const materials: BABYLON.ShaderMaterial[] = [];

    scene.registerBeforeRender(() => {
        const time = performance.now() * 0.0005;
        materials.forEach((material) => {
            material.setFloat("time", time);
        });
    });

    const createMaterial = (mesh: BABYLON.Mesh) => {
        // Create a shared shader material
        const shaderMaterial = new BABYLON.ShaderMaterial(
            `fireShaderInstance_${mesh.uniqueId}`,
            scene,
            shader,
            {
                attributes: ["position"],
                uniforms: ["time", "worldViewProjection"],
            }
        );

        // Configure material properties
        shaderMaterial.backFaceCulling = false;
        // FIXME shaderMaterial.transparent = true;
        shaderMaterial.needDepthPrePass = true;

        // shaderMaterial.alphaBlending = true;

        // Set the blend mode to additive
        // shaderMaterial.alphaMode =
        //     BABYLON.Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA;

        // Clone the shared shader material for this mesh instance
        const material = shaderMaterial.clone(
            `fireShaderInstance_${mesh.uniqueId}`
        );

        materials.push(material);

        // meshMaterial.setFloat("size", size);
        // meshMaterial.setFloat("yMax", 0.3 + Math.PI * size);

        return material;
    };

    return function createFireNode(
        particles: number = 1,
        size: number = 0.5
    ): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreatePlane("fire3", {}, scene);

        scene.addMesh(mesh);

        mesh.material = createMaterial(mesh);
        mesh.material.alpha = 0.5;

        mesh.position.y += 1;
        mesh.scaling = new BABYLON.Vector3(5, 5, 5);

        return mesh;
    };

    /* FIXME: Dispose:
            mesh.dispose();
            mesh.material.dispose();
        */
}

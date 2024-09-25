import * as BABYLON from "babylonjs";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

// @from https://medium.com/@dirkk/campfire-vr-fa654d15e92a

const fireMat = (scene: BABYLON.Scene, mesh: BABYLON.Mesh) => {
    `
    precision highp float;
    uniform float time;
    uniform vec3 c1;
    uniform vec3 c2;
    uniform vec3 c3;
    uniform vec3 c4;
    uniform vec3 c5;
    uniform vec3 c6;
    uniform vec2 speed;
    uniform float shift;
    uniform float alphaThreshold;
    varying vec2 vUV;
    float rand(vec2 n) {
        return fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);
    }
    float noise(vec2 n) {
        const vec2 d=vec2(0.0,1.0);
        vec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));
        return mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);
    }
    float fbm(vec2 n) {
        float total=0.0,amplitude=1.0;
        for (int i=0; i<4; i++) {
            total+=noise(n)*amplitude;n+=n;amplitude*=0.5;
        }
        return total;
    }
    void main() {
        vec2 p=vUV*8.0;
        float q=fbm(p-time*0.1);
        vec2 r=vec2(fbm(p+q+time*speed.x-p.x-p.y),fbm(p+q-time*speed.y));
        vec3 c=mix(c1,c2,fbm(p+r))+mix(c3,c4,r.x)-mix(c5,c6,r.y);
        vec3 color=c*cos(shift*vUV.y);
        float luminance=dot(color.rgb,vec3(0.3,0.59,0.11));
        gl_FragColor=vec4(color,luminance*alphaThreshold+(1.0-alphaThreshold));
    }`;

    var shader1 =
        "precision highp float;uniform float time;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform vec3 c4;uniform vec3 c5;uniform vec3 c6;uniform vec2 speed;uniform float shift;uniform float alphaThreshold;varying vec2 vUV;float rand(vec2 n) {return fract(cos(dot(n,vec2(12.9898,4.1414)))*43758.5453);}\nfloat noise(vec2 n) {const vec2 d=vec2(0.0,1.0);vec2 b=floor(n),f=smoothstep(vec2(0.0),vec2(1.0),fract(n));return mix(mix(rand(b),rand(b+d.yx),f.x),mix(rand(b+d.xy),rand(b+d.yy),f.x),f.y);}\nfloat fbm(vec2 n) {float total=0.0,amplitude=1.0;for (int i=0; i<4; i++) {total+=noise(n)*amplitude;n+=n;amplitude*=0.5;}\nreturn total;}\nvoid main() {vec2 p=vUV*8.0;float q=fbm(p-time*0.1);vec2 r=vec2(fbm(p+q+time*speed.x-p.x-p.y),fbm(p+q-time*speed.y));vec3 c=mix(c1,c2,fbm(p+r))+mix(c3,c4,r.x)-mix(c5,c6,r.y);vec3 color=c*cos(shift*vUV.y);float luminance=dot(color.rgb,vec3(0.3,0.59,0.11));gl_FragColor=vec4(color,luminance*alphaThreshold+(1.0-alphaThreshold));}";
    BABYLON.Effect.ShadersStore["fireProceduralTexturePixelShader"] = shader1;
    var fireTexture = new BABYLON.ProceduralTexture(
        "fire",
        256,
        "fireProceduralTexturePixelShader",
        scene
    );

    ///
    var fireMaterial = new BABYLON.StandardMaterial("fontainSculptur2", scene);
    fireMaterial.diffuseTexture = fireTexture;
    fireMaterial.opacityTexture = fireTexture;
    mesh.material = fireMaterial;
    ///
};

export function makeCreateFire(
    scene: BABYLON.Scene
): (particles?: number, size?: number) => BABYLON.Mesh {
    // One-time setup: Register shaders in the shader store
    const VERTEX_SHADER = `
        precision highp float;

        uniform mat4 worldViewProjection;
        uniform float time;
        uniform float size;

        attribute vec3 position;
        attribute vec3 direction;
        attribute float offset;

        varying vec3 vUv;

        // Include a 3D noise function (e.g., Simplex noise)
        // Here, we provide a simple placeholder function
        float noise(vec3 p) {
            // Simplex noise function implementation or a placeholder
            return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453);
        }

        void main() {
            float sawTime = mod(time * offset, 3.1415);
            float sineTime = (sawTime * abs(sin(time * offset)));
            vec3 timeVec = vec3(sineTime, sawTime, sineTime);

            // Apply noise for turbulence
            float n = noise(position + time * 0.0000005);
            vec3 displacement = direction * n * 0.2;
            // vec3 displacement = direction * 0.0;

            vUv = ((normalize(position) * 0.2) + (timeVec * direction) + displacement) * size;
            gl_Position = worldViewProjection * vec4(vUv, 1.0);
        }
    `;

    const FRAGMENT_SHADER = `
        precision highp float;

        uniform float time;
        uniform float yMax;

        varying vec3 vUv;

        void main() {
            float t = vUv.y / yMax;

            // Color gradient from red to yellow to white
            vec3 color = mix(
                vec3(1.0, 0.0, 0.0),             // Red at the base
                vec3(1.0, 1.0, 0.0),             // Yellow in the middle
                smoothstep(0.0, 0.5, t)
            );

            color = mix(
                color,
                vec3(1.0, 1.0, 1.0),             // White at the top
                smoothstep(0.5, 1.0, t)
            );

            // Opacity gradient
            float alpha = (1.0 - t) * 0.8;

            gl_FragColor = vec4(color, alpha);
        }
    `;

    const shader = "fire" + Date.now();

    BABYLON.Effect.ShadersStore[`${shader}VertexShader`] = VERTEX_SHADER;
    BABYLON.Effect.ShadersStore[`${shader}FragmentShader`] = FRAGMENT_SHADER;

    const fireMaterials: BABYLON.ShaderMaterial[] = [];

    // Animate the time uniform
    scene.registerBeforeRender(() => {
        const time = performance.now() * 0.0005;
        fireMaterials.forEach((material) => {
            material.setFloat("time", time);
        });
    });

    // Function to create sparks geometry
    function createSparks(count: number): BABYLON.Mesh {
        const positions: number[] = [];
        const directions: number[] = [];
        const offsets: number[] = [];
        const indices: number[] = [];

        for (let i = 0; i < count; i++) {
            const direction = [
                Math.random() - 0.5,
                Math.random() + 0.3,
                Math.random() - 0.5,
            ];
            const offset = Math.random() * Math.PI;

            for (let j = 0; j < 3; j++) {
                const x = Math.random() - 0.5;
                const y = Math.random() - 0.2;
                const z = Math.random() - 0.5;

                positions.push(x, y, z);
                directions.push(...direction);
                offsets.push(offset);

                indices.push(indices.length);
            }
        }

        const customMesh = new BABYLON.Mesh("fireMesh", scene);

        // Apply vertex data to mesh
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.applyToMesh(customMesh);

        // Set custom attributes
        customMesh.setVerticesData("direction", directions, false, 3);
        customMesh.setVerticesData("offset", offsets, false, 1);

        return customMesh;
    }

    // Return a function to create and add fire nodes
    return function createFireNode(
        particles: number = 1,
        size: number = 0.5
    ): BABYLON.Mesh {
        // Create the mesh with sparks geometry
        const mesh = createSparks(particles);

        // Create a shared shader material
        const shaderMaterial = new BABYLON.ShaderMaterial(
            `fireShaderInstance_${mesh.uniqueId}`,
            scene,
            shader,
            {
                attributes: ["position", "direction", "offset"],
                uniforms: ["worldViewProjection", "time", "size", "yMax"],
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
        const meshMaterial = shaderMaterial.clone(
            `fireShaderInstance_${mesh.uniqueId}`
        );

        fireMaterials.push(meshMaterial);

        meshMaterial.setFloat("size", size);
        meshMaterial.setFloat("yMax", 0.3 + Math.PI * size);

        // mesh.visibility = 0.0000000000000001;

        // Assign material to mesh
        mesh.material = meshMaterial;

        const fireLight = new BABYLON.PointLight(
            "fireLight",
            new BABYLON.Vector3(0, 0.5, 0),
            scene
        );
        fireLight.parent = mesh;
        fireLight.diffuse = new BABYLON.Color3(1, 0.5, 0);
        fireLight.specular = new BABYLON.Color3(1, 0.5, 0);
        fireLight.intensity = 1;
        fireLight.range = 1;

        // Add flickering effect
        scene.registerBeforeRender(() => {
            fireLight.intensity = 2 + Math.sin(performance.now() * 0.01) * 0.5;
        });

        scene.addMesh(mesh);

        return mesh;
    };

    /* FIXME: Dispose:
            mesh.dispose();
            mesh.material.dispose();
        */
}

import * as BABYLON from "babylonjs";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

// @from https://medium.com/@dirkk/campfire-vr-fa654d15e92a
export function makeCreateFire3(
    scene: BABYLON.Scene
): (particles?: number, size?: number) => BABYLON.Mesh {
    // One-time setup: Register shaders in the shader store
    const VERTEX_SHADER = `
        precision highp float;
        #define PI 3.1415926535897932384626433832795

        uniform mat4 worldViewProjection;
        uniform float time;
        uniform float size;

        attribute vec3 position;
        attribute vec3 direction;
        attribute float offset;

        varying vec3 vUv;

        void main() {
            float sawTime = mod(time * offset, PI);
            float sineTime = (sawTime * abs(sin(time * offset)));
            vec3 timeVec = vec3(sineTime, sawTime, sineTime);
            vUv = ((normalize(position) * 0.2) + (timeVec * direction)) * size;
            gl_Position = worldViewProjection * vec4(vUv, 1.0);
        }
    `;

    const FRAGMENT_SHADER = `
        precision highp float;

        uniform float time;
        uniform float yMax;

        varying vec3 vUv;

        float random(vec2 ab) {
            float f = (cos(dot(ab, vec2(21.9898, 78.233))) * 43758.5453);
            return fract(f);
        }

        void main() {
            float alpha = (yMax - vUv.y) * 0.8;
            float red = 1.0;
            float green = 1.0 - (0.7 * mix(((yMax - vUv.y) * 0.5) + 0.5, 0.5 - abs(max(vUv.x, vUv.y)), 0.5));
            float blueMin = abs(max(max(vUv.x, vUv.z), (vUv.y / yMax)));
            float blue = (1.0 / (blueMin + 0.5)) - 1.0;
            gl_FragColor = vec4(red, green, 0.0, alpha);
        }
    `;

    BABYLON.Effect.ShadersStore["fireVertexShader"] = VERTEX_SHADER;
    BABYLON.Effect.ShadersStore["fireFragmentShader"] = FRAGMENT_SHADER;

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
            "fire",
            {
                attributes: ["position", "direction", "offset"],
                uniforms: ["worldViewProjection", "time", "size", "yMax"],
            }
        );

        // Configure material properties
        shaderMaterial.backFaceCulling = false;
        // FIXME shaderMaterial.transparent = true;
        shaderMaterial.needDepthPrePass = true;

        // Clone the shared shader material for this mesh instance
        const meshMaterial = shaderMaterial.clone(
            `fireShaderInstance_${mesh.uniqueId}`
        );

        fireMaterials.push(meshMaterial);

        meshMaterial.setFloat("size", size);
        meshMaterial.setFloat("yMax", 0.3 + Math.PI * size);

        // Assign material to mesh
        mesh.material = meshMaterial;
        mesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);

        scene.addMesh(mesh);

        return mesh;
    };

    /* FIXME: Dispose:
            mesh.dispose();
            mesh.material.dispose();
        */
}

import * as BABYLON from "babylonjs";
import vertexShader from "./shaders/fire3-vertexShader.glsl";
import fragmentShader from "./shaders/fire3-fragmentShader.glsl";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

// @from https://medium.com/@dirkk/campfire-vr-fa654d15e92a

// @from https://www.shadertoy.com/view/XsXSWS

/*
const xx = () => {
    var createScene = function () {
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.UniversalCamera(
            "UniversalCamera",
            new BABYLON.Vector3(0, 3, -12),
            scene
        );
        camera.setTarget(
            new BABYLON.Vector3(
                camera.position.x,
                camera.position.y,
                camera.position.z + 5
            )
        );
        camera.attachControl(canvas, false);

        scene.clearColor = new BABYLON.Color3(0, 0, 0);

        camera.wheelDeltaPercentage = 0.01;
        camera.attachControl(canvas, true);

        // To prevent limitations of lights per mesh
        // engine.disableUniformBuffers = true;

        // Material
        var groundMat = new BABYLON.PBRMaterial("groundMat", scene);
        groundMat.albedoColor = new BABYLON.Color4(0.7968, 0.3685, 0.1105, 1);
        groundMat.metallic = 0;
        groundMat.roughness = 0.6;
        groundMat.environmentIntensity = 0;
        groundMat.maxSimultaneousLights = 16;

        // Ground
        var ground = BABYLON.Mesh.CreatePlane("ground", 500.0, scene);
        ground.position = new BABYLON.Vector3(0, -1.5, 0);
        ground.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        ground.material = groundMat;

        // Lights
        var light = new BABYLON.PointLight(
            "pointLight",
            new BABYLON.Vector3(0, 8, 0),
            scene
        );
        light.intensity = 0;
        light.includedOnlyMeshes.push(ground);

        // Environment
        var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/DDS/Runyon_Canyon_A_2k_cube_specular.dds",
            scene
        );
        hdrTexture.name = "envTex";
        hdrTexture.gammaSpace = false;
        scene.environmentTexture = hdrTexture;

        // Set up new rendering pipeline
        var pipeline = new BABYLON.DefaultRenderingPipeline(
            "default",
            true,
            scene
        );

        // Anti-aliasing
        pipeline.samples = 4;
        pipeline.grainEnabled = true;
        pipeline.grain.intensity = 3;

        // Tone mapping
        scene.imageProcessingConfiguration.toneMappingEnabled = true;
        scene.imageProcessingConfiguration.toneMappingType =
            BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        scene.imageProcessingConfiguration.exposure = 1;

        // Bloom
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.1;
        pipeline.bloomWeight = 1;
        pipeline.bloomKernel = 64;
        pipeline.bloomScale = 0.5;

        // Actions on key press
        document.addEventListener("keydown", Action);
        document.addEventListener("keydown", ShowInspector);

        // Remove listeners when scene disposed
        scene.onDisposeObservable.add(function () {
            document.removeEventListener("keydown", Action);
            document.removeEventListener("keydown", ShowInspector);
        });

        //Animation
        var lightOn = new BABYLON.Animation(
            "lightOn",
            "intensity",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        var lightOff = new BABYLON.Animation(
            "lightOff",
            "intensity",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        var lightFlash = new BABYLON.Animation(
            "lightFlash",
            "intensity",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        var lightHold = new BABYLON.Animation(
            "lightHold",
            "intensity",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        var flicker = new BABYLON.Animation(
            "flicker",
            "intensity",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation._ANIMATIONLOOPMODE_CYCLE
        );

        // Animation keys and values
        var keysLightOn = [];
        keysLightOn.push({ frame: 0, value: 0 });
        keysLightOn.push({ frame: 5, value: 0 });
        keysLightOn.push({ frame: 40, value: 25 });

        var lightOffLengh = 180;
        var keysLightOff = [];
        keysLightOff.push({ frame: 0, value: 25 });
        keysLightOff.push({ frame: 120, value: 25 });
        keysLightOff.push({ frame: lightOffLengh, value: 0 });

        var keyslightFlash = [];
        keyslightFlash.push({ frame: 0, value: 0 });
        keyslightFlash.push({ frame: 5, value: 10 });
        // keyslightFlash.push({frame: 50, value: 16});
        keyslightFlash.push({ frame: 120, value: 0 });

        var keyslightHold = [];
        keyslightHold.push({ frame: 0, value: 0 });
        keyslightHold.push({ frame: 15, value: 10 });
        keyslightHold.push({ frame: 170, value: 10 });
        keyslightHold.push({ frame: 230, value: 0 });

        // var keysConeRotation = [];
        // keysConeRotation.push({frame: 0, value: Math.PI/2});
        // keysConeRotation.push({frame: 120, value: -Math.PI/2});

        // Procedural keys for light flicker
        var min = 10;
        var max = 25;
        var iterations = 7;
        var frames = 30;
        var loopValue;
        var keysFlicker = [];
        for (var i = 0; i < iterations; i++) {
            var randIntensity = Math.random() * (max - min) + min;
            if (i == 0) {
                loopValue = randIntensity;
            }

            keysFlicker.push({
                frame: (frames / iterations) * i,
                value: randIntensity,
            });
            console.info("keysFlicker: " + JSON.stringify(keysFlicker[i]));
        }
        keysFlicker.push({ frame: frames, value: loopValue });
        console.info("keysFlicker: " + JSON.stringify(keysFlicker[iterations]));

        // Adding keys to the animation
        lightOn.setKeys(keysLightOn);
        lightOff.setKeys(keysLightOff);
        lightFlash.setKeys(keyslightFlash);
        lightHold.setKeys(keyslightHold);
        flicker.setKeys(keysFlicker);

        var easingFunction = new BABYLON.QuarticEase();

        // For each easing function, you can choose between EASEIN (default), EASEOUT, EASEINOUT
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

        // Adding the easing function to the animation
        lightOn.setEasingFunction(easingFunction);
        lightOff.setEasingFunction(easingFunction);
        lightFlash.setEasingFunction(easingFunction);
        lightHold.setEasingFunction(easingFunction);
        // coneRotation.setEasingFunction(easingFunction);

        // Assign animation
        light.animations.push(flicker);

        // Particle parent
        var particleSource = new BABYLON.AbstractMesh("", scene);
        particleSource.position = new BABYLON.Vector3(0, -0.5, 0);

        // var coneSource = new BABYLON.AbstractMesh("", scene);
        // coneSource.position = new BABYLON.Vector3(0, -0.5, 0);
        // coneSource.rotation.z = Math.PI/2;

        // Set up animation sheet
        var setupAnimationSheet = function (
            system,
            texture,
            width,
            height,
            numSpritesWidth,
            numSpritesHeight,
            animationSpeed,
            isRandom,
            loop
        ) {
            // Assign animation parameters
            system.isAnimationSheetEnabled = true;
            system.particleTexture = new BABYLON.Texture(
                texture,
                scene,
                false,
                false
            );
            system.spriteCellWidth = width / numSpritesWidth;
            system.spriteCellHeight = height / numSpritesHeight;
            var numberCells = numSpritesWidth * numSpritesHeight;
            system.startSpriteCellID = 0;
            system.endSpriteCellID = numberCells - 1;
            system.spriteCellChangeSpeed = animationSpeed;
            system.spriteRandomStartCell = isRandom;
            system.updateSpeed = 1 / 60;
            system.spriteCellLoop = loop;
        };

        // Particle color
        var colorParticles = function (system) {
            system.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0));
            system.addColorGradient(0.1, new BABYLON.Color4(1, 1, 1, 0.6));
            system.addColorGradient(0.9, new BABYLON.Color4(1, 1, 1, 0.6));
            system.addColorGradient(1.0, new BABYLON.Color4(1, 1, 1, 0));

            // Defines the color ramp to apply
            system.addRampGradient(0.0, new BABYLON.Color3(1, 1, 1));
            system.addRampGradient(
                1.0,
                new BABYLON.Color3(0.7968, 0.3685, 0.1105)
            );
            system.useRampGradients = true;

            system.addColorRemapGradient(0, 0.2, 1);
            system.addColorRemapGradient(1.0, 0.2, 1.0);
        };

        var colorSparks = function (system) {
            system.addColorGradient(
                0.0,
                new BABYLON.Color4(0.9245, 0.654, 0.0915, 0)
            );
            system.addColorGradient(
                0.04,
                new BABYLON.Color4(0.9062, 0.6132, 0.0942, 0.1)
            );
            system.addColorGradient(
                0.4,
                new BABYLON.Color4(0.7968, 0.3685, 0.1105, 1)
            );
            system.addColorGradient(
                0.7,
                new BABYLON.Color4(0.6886, 0.1266, 0.1266, 1)
            );
            system.addColorGradient(
                0.9,
                new BABYLON.Color4(0.3113, 0.0367, 0.0367, 0.6)
            );
            system.addColorGradient(
                1.0,
                new BABYLON.Color4(0.3113, 0.0367, 0.0367, 0)
            );

            // Defines the color ramp to apply
            system.addRampGradient(0.0, new BABYLON.Color3(1, 1, 1));
            system.addRampGradient(
                1.0,
                new BABYLON.Color3(0.7968, 0.63685, 0.4105)
            );
            system.useRampGradients = true;

            system.addColorRemapGradient(0, 0, 0.1);
            system.addColorRemapGradient(0.2, 0.1, 0.8);
            system.addColorRemapGradient(0.3, 0.2, 0.85);
            system.addColorRemapGradient(0.35, 0.4, 0.85);
            system.addColorRemapGradient(0.4, 0.5, 0.9);
            system.addColorRemapGradient(0.5, 0.95, 1.0);
            system.addColorRemapGradient(1.0, 0.95, 1.0);
        };

        // Noise
        var noiseTexture = new BABYLON.NoiseProceduralTexture(
            "perlin",
            256,
            scene
        );
        noiseTexture.animationSpeedFactor = 5;
        noiseTexture.persistence = 0.2;
        noiseTexture.brightness = 0.5;
        noiseTexture.octaves = 4;

        var noiseTexture2 = new BABYLON.NoiseProceduralTexture(
            "perlin",
            256,
            scene
        );
        noiseTexture2.animationSpeedFactor = 3;
        noiseTexture2.persistence = 1;
        noiseTexture2.brightness = 0.5;
        noiseTexture2.octaves = 8;

        // Fire
        var fireSystem = BABYLON.ParticleHelper.CreateDefault(
            new BABYLON.Vector3(0, 3.25, 0),
            5
        );
        fireSystem.createBoxEmitter(
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(-0.5, 0, -0.5),
            new BABYLON.Vector3(0.5, 0, 0.5)
        );
        setupAnimationSheet(
            fireSystem,
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet1_8x8.png",
            1024,
            1024,
            8,
            8,
            1,
            true,
            true
        );
        fireSystem.minLifeTime = 2;
        fireSystem.maxLifeTime = 3;
        fireSystem.emitRate = 2;
        fireSystem.minSize = 6;
        fireSystem.maxSize = 8;
        fireSystem.minInitialRotation = -0.1;
        fireSystem.maxInitialRotation = 0.1;
        colorParticles(fireSystem);
        fireSystem.minEmitPower = 0;
        fireSystem.maxEmitPower = 0;
        fireSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
        fireSystem.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;

        var fireSystem2 = BABYLON.ParticleHelper.CreateDefault(
            new BABYLON.Vector3(0, 2.25, 0),
            3
        );
        fireSystem2.createBoxEmitter(
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(-0.5, 0, -0.5),
            new BABYLON.Vector3(0.5, 0, 0.5)
        );
        setupAnimationSheet(
            fireSystem2,
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet2_8x8.png",
            1024,
            1024,
            8,
            8,
            0.9,
            true,
            true
        );
        fireSystem2.minLifeTime = 2;
        fireSystem2.maxLifeTime = 3;
        fireSystem2.emitRate = 2;
        fireSystem2.minSize = 5;
        fireSystem2.maxSize = 6;
        fireSystem2.minInitialRotation = -0.1;
        fireSystem2.maxInitialRotation = 0.1;
        colorParticles(fireSystem2);
        fireSystem2.minEmitPower = 0.0;
        fireSystem2.maxEmitPower = 0.0;
        fireSystem2.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
        fireSystem2.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;

        var fireSystem3 = BABYLON.ParticleHelper.CreateDefault(
            new BABYLON.Vector3(0, 2.25, 0),
            3
        );
        fireSystem3.createBoxEmitter(
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(0, 1, 0),
            new BABYLON.Vector3(-0.5, 0, -0.5),
            new BABYLON.Vector3(0.5, 0, 0.5)
        );
        setupAnimationSheet(
            fireSystem3,
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet3_8x8.png",
            1024,
            1024,
            8,
            8,
            0.9,
            true,
            true
        );
        fireSystem3.minLifeTime = 2;
        fireSystem3.maxLifeTime = 3;
        fireSystem3.emitRate = 2;
        fireSystem3.minSize = 5;
        fireSystem3.maxSize = 6;
        fireSystem3.minInitialRotation = -0.1;
        fireSystem3.maxInitialRotation = 0.1;
        colorParticles(fireSystem3);
        fireSystem3.minEmitPower = 0.0;
        fireSystem3.maxEmitPower = 0.0;
        fireSystem3.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
        fireSystem3.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;

        var sparksEdge = BABYLON.ParticleHelper.CreateDefault(
            new BABYLON.Vector3(0, 0, 0),
            20
        );
        sparksEdge.createConeEmitter(1, 0.8); //(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(-1, 0, -1), new BABYLON.Vector3(1, 0, 1));
        sparksEdge.particleTexture = new BABYLON.Texture(
            "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Sparks/sparks.png",
            scene
        );
        sparksEdge.minLifeTime = 1.5;
        sparksEdge.maxLifeTime = 2.5;
        sparksEdge.minSize = 0.2;
        sparksEdge.maxSize = 0.3;
        sparksEdge.emitRate = 20;
        sparksEdge.minEmitPower = 15;
        sparksEdge.maxEmitPower = 20;
        sparksEdge.addLimitVelocityGradient(0.0, 7.0);
        sparksEdge.addLimitVelocityGradient(1.0, 1);
        sparksEdge.limitVelocityDamping = 0.5;

        sparksEdge.noiseTexture = noiseTexture2;
        sparksEdge.noiseStrength = new BABYLON.Vector3(2, 1, 1);
        sparksEdge.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        colorSparks(sparksEdge);

        var i = 0;

        function Action() {
            if (event.keyCode == 32) {
                var flickerAnim;
                if (i == 0) {
                    scene.beginDirectAnimation(
                        light,
                        [lightOn],
                        0,
                        40,
                        false,
                        1,
                        function () {}
                    );
                    // flickerAnim = scene.beginAnimation(light, 0, frames, true)
                    fireSystem.start();
                    sparksEdge.start();
                    fireSystem2.start();
                    fireSystem3.start();
                    i++;
                } else {
                    fireSystem.stop();
                    sparksEdge.stop();
                    fireSystem2.stop();
                    fireSystem3.stop();
                    // flickerAnim.stop();
                    scene.beginDirectAnimation(
                        light,
                        [lightOff],
                        0,
                        lightOffLengh,
                        false,
                        1
                    );
                    i = 0;
                }
            }
        }

        var showInspector = false;
        function ShowInspector() {
            if (event.keyCode == 78) {
                if (!showInspector) {
                    scene.debugLayer.show();
                    showInspector = !showInspector;
                } else {
                    scene.debugLayer.hide();
                    showInspector = !showInspector;
                }
            }
        }
        var envRotation = 0;
        scene.registerBeforeRender(function () {
            hdrTexture.setReflectionTextureMatrix(
                BABYLON.Matrix.RotationY(envRotation)
            );
        });

        engine.displayLoadingUI();

        scene.executeWhenReady(function () {
            engine.hideLoadingUI();
        });
        return scene;
    };
};
*/

// const shader = "shader" + Date.now() + Math.random();

const createFireSystem = (
    scene: BABYLON.Scene,
    parent: BABYLON.Node,
    texture: string,
    scale: number
) => {
    // Create an invisible box mesh as the emitter and set its parent
    const emitter = BABYLON.MeshBuilder.CreateBox(
        "fireEmitter",
        { size: 0.1 },
        scene
    );
    emitter.isVisible = true; // Make the mesh invisible
    emitter.parent = parent; // Parent it to the provided node
    emitter.position = new BABYLON.Vector3(0, scale * 0.7, 0); // Set its position to the center

    const system = BABYLON.ParticleHelper.CreateDefault(
        emitter.position,
        5,
        scene,
        false
    );
    system.emitter = emitter; // Use the box mesh as the emitter

    if (false) {
        system.createBoxEmitter(
            new BABYLON.Vector3(0, 0.1, 0),
            new BABYLON.Vector3(0, 0.2, 0),
            new BABYLON.Vector3(-0.1, 0, 0),
            new BABYLON.Vector3(0.1, 0, 0)
        );
    }

    system.emitRate = 2;
    system.updateSpeed = 1 / 60;
    system.minLifeTime = 2;
    system.maxLifeTime = 3;

    system.minSize = 1;
    system.maxSize = 2;
    system.minInitialRotation = -0.1;
    system.maxInitialRotation = 0.1;

    if (true) {
        system.minScaleX = scale;
        system.minScaleY = scale;
        system.maxScaleX = scale;
        system.maxScaleY = scale;
    }

    if (true) {
        const width = 1024;
        const height = 1024;
        const numSpritesWidth = 8;
        const numSpritesHeight = 8;
        const numberCells = numSpritesWidth * numSpritesHeight;

        system.isAnimationSheetEnabled = true;
        system.particleTexture = new BABYLON.Texture(
            texture,
            scene,
            false,
            false
        );
        system.spriteCellWidth = width / numSpritesWidth;
        system.spriteCellHeight = height / numSpritesHeight;
        system.startSpriteCellID = 0;
        system.endSpriteCellID = numberCells - 1;
        // system.spriteCellChangeSpeed = 1;
        system.spriteRandomStartCell = true;
        system.spriteCellLoop = true;
    }
    if (false) {
        system.minInitialRotation = -0.1;
        system.maxInitialRotation = 0.1;
        system.minEmitPower = 0;
        system.maxEmitPower = 0;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
        system.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;
    }

    if (true) {
        system.minInitialRotation = -0.1;
        system.maxInitialRotation = 0.1;

        system.minEmitPower = 0;
        system.maxEmitPower = 0;

        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_MULTIPLYADD;
        system.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;

        system.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0));
        system.addColorGradient(0.1, new BABYLON.Color4(1, 1, 1, 0.6));
        system.addColorGradient(0.9, new BABYLON.Color4(1, 1, 1, 0.6));
        system.addColorGradient(1.0, new BABYLON.Color4(1, 1, 1, 0));

        // Defines the color ramp to apply
        system.addRampGradient(0.0, new BABYLON.Color3(1, 1, 1));
        system.addRampGradient(1.0, new BABYLON.Color3(0.7968, 0.3685, 0.1105));
        system.useRampGradients = true;

        system.addColorRemapGradient(0, 0.2, 1);
        system.addColorRemapGradient(1.0, 0.2, 1.0);
    }

    return system;
};

const createFireSystem1 = (
    scene: BABYLON.Scene,
    parent: BABYLON.Node,
    scale: number
) => {
    const system = createFireSystem(
        scene,
        parent,
        "assets/Fire_SpriteSheet1_8x8.png",
        scale
    );
    return system;
};

export function makeCreateFire(
    scene: BABYLON.Scene
): (particles?: number, size?: number) => BABYLON.Mesh {
    return function createFireNode(
        particles: number = 1,
        size: number = 0.5
    ): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreatePlane("fire3", {}, scene);

        scene.addMesh(mesh);

        //const particleSource = new BABYLON.Mesh("particleSource", scene);
        //particleSource.position = new BABYLON.Vector3(0, -0.5, 0);
        //particleSource.parent = mesh;

        const scale = 5;

        const fireSystem1 = createFireSystem1(scene, mesh, scale);
        fireSystem1.start();

        // mesh.material = createMaterial(mesh);
        // mesh.material.alpha = 0.5;

        // mesh.material = new BABYLON.StandardMaterial("dummy", scene);
        // mesh.material.

        mesh.isVisible = false;
        // mesh.position.y += scale * 0.5;
        // mesh.scaling = new BABYLON.Vector3(scale, scale, scale);

        return mesh;
    };

    /* FIXME: Dispose:
            mesh.dispose();
            mesh.material.dispose();
        */
}

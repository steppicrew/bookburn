import * as BABYLON from "babylonjs";

// https://www.babylonjs-playground.com/#1KWR9W#1
// Simpler:
// https://www.babylonjs-playground.com/#7IM02G#0

const createAnimation = (name: string, keys: BABYLON.IAnimationKey[]) => {
    const animation = new BABYLON.Animation(
        name,
        "intensity",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    animation.setKeys(keys);
    return animation;
};

const easingFunction = new BABYLON.QuarticEase();
easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

const withEasing = (animation: BABYLON.Animation) => {
    animation.setEasingFunction(easingFunction);
    return animation;
};

const createLightOnAnimation = () =>
    withEasing(
        createAnimation("lightOn", [
            { frame: 0, value: 0 },
            { frame: 5, value: 0 },
            { frame: 40, value: 25 },
        ])
    );

const createLightOffAnimation = () =>
    withEasing(
        createAnimation("lightOff", [
            { frame: 0, value: 25 },
            { frame: 120, value: 25 },
            { frame: 180, value: 0 },
        ])
    );

const createLightFlashAnimation = () =>
    withEasing(
        createAnimation("lightFlash", [
            { frame: 0, value: 0 },
            { frame: 5, value: 10 },
            { frame: 50, value: 16 },
            { frame: 120, value: 0 },
        ])
    );

const createLightHoldAnimation = () =>
    withEasing(
        createAnimation("lightHold", [
            { frame: 0, value: 0 },
            { frame: 15, value: 10 },
            { frame: 170, value: 10 },
            { frame: 230, value: 0 },
        ])
    );

const createFlickerAnimation = () => {
    const flicker = createAnimation("flicker", []);
    const min = 10;
    const max = 25;
    const iterations = 7;
    const frames = 30;
    let loopValue;
    const keys: BABYLON.IAnimationKey[] = [];
    for (let i = 0; i < iterations; i++) {
        const randIntensity = Math.random() * (max - min) + min;
        if (i == 0) {
            loopValue = randIntensity;
        }

        keys.push({
            frame: (frames / iterations) * i,
            value: randIntensity,
        });
        console.info("keysFlicker: " + JSON.stringify(keys[i]));
    }
    keys.push({ frame: frames, value: loopValue });
    console.info("keysFlicker: " + JSON.stringify(keys[iterations]));
    flicker.setKeys(keys);
    return flicker;
};

const createNoiseTexture = (scene: BABYLON.Scene) => {
    const noiseTexture = new BABYLON.NoiseProceduralTexture(
        "perlin",
        256,
        scene
    );
    return noiseTexture;
};

const createFireSystem = (
    scene: BABYLON.Scene,
    center: BABYLON.Vector3,
    texture: string
) => {
    const setupAnimationSheet = function (
        system: BABYLON.IParticleSystem,
        texture: string,
        width: number,
        height: number,
        numSpritesWidth: number,
        numSpritesHeight: number,
        animationSpeed: number,
        isRandom: boolean,
        loop: boolean
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
        const numberCells = numSpritesWidth * numSpritesHeight;
        system.startSpriteCellID = 0;
        system.endSpriteCellID = numberCells - 1;
        system.spriteCellChangeSpeed = animationSpeed;
        system.spriteRandomStartCell = isRandom;
        system.updateSpeed = 1 / 60;
        system.spriteCellLoop = loop;
    };

    const colorParticles = function (system: BABYLON.IParticleSystem) {
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
    };

    const fireSystem = BABYLON.ParticleHelper.CreateDefault(center, 5);
    fireSystem.createBoxEmitter(
        new BABYLON.Vector3(0, 1, 0),
        new BABYLON.Vector3(0, 1, 0),
        new BABYLON.Vector3(-0.5, 0, -0.5),
        new BABYLON.Vector3(0.5, 0, 0.5)
    );
    setupAnimationSheet(fireSystem, texture, 1024, 1024, 8, 8, 1, true, true);
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
    return fireSystem;
};

const createSparsEdge = (scene: BABYLON.Scene) => {
    const colorSparks = function (system: BABYLON.IParticleSystem) {
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

    const sparksEdge = BABYLON.ParticleHelper.CreateDefault(
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
    sparksEdge.noiseStrength = new BABYLON.Vector3(2, 1, 1);
    sparksEdge.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    colorSparks(sparksEdge);
    return sparksEdge;
};

export const createFire1 = (scene: BABYLON.Scene, light: BABYLON.Light) => {
    const pipeline = new BABYLON.DefaultRenderingPipeline(
        "default",
        true,
        scene
    );
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

    // const keysConeRotation = [];
    // keysConeRotation.push({frame: 0, value: Math.PI/2});
    // keysConeRotation.push({frame: 120, value: -Math.PI/2});

    const lightAnimation = createFlickerAnimation();

    // Assign animation
    light.animations.push(lightAnimation);

    // Particle parent
    const particleSource = new BABYLON.Mesh("particleSource", scene);
    particleSource.position = new BABYLON.Vector3(0, -0.5, 0);

    // const coneSource = new BABYLON.AbstractMesh("", scene);
    // coneSource.position = new BABYLON.Vector3(0, -0.5, 0);
    // coneSource.rotation.z = Math.PI/2;

    const noiseTexture1 = createNoiseTexture(scene);
    noiseTexture1.animationSpeedFactor = 5;
    noiseTexture1.persistence = 0.2;
    noiseTexture1.brightness = 0.5;
    noiseTexture1.octaves = 4;

    const noiseTexture2 = createNoiseTexture(scene);
    noiseTexture2.animationSpeedFactor = 3;
    noiseTexture2.persistence = 1;
    noiseTexture2.brightness = 0.5;
    noiseTexture2.octaves = 8;

    const fireSystem1 = createFireSystem(
        scene,
        new BABYLON.Vector3(0, 3.25, 0),
        "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet1_8x8.png"
    );

    const fireSystem2 = createFireSystem(
        scene,
        new BABYLON.Vector3(0, 2.25, 0),
        "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet2_8x8.png"
    );
    fireSystem2.minSize = 5;
    fireSystem2.maxSize = 6;

    const fireSystem3 = createFireSystem(
        scene,
        new BABYLON.Vector3(0, 2.25, 0),
        "https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/ParticleSystems/Fire/Fire_SpriteSheet3_8x8.png"
    );
    fireSystem3.minSize = 5;
    fireSystem3.maxSize = 6;

    const sparksEdge = createSparsEdge(scene);
    sparksEdge.noiseTexture = noiseTexture2;

    const start = () => {
        scene.beginDirectAnimation(light, [], 0, 40, false);
        fireSystem1.start();
        sparksEdge.start();
        fireSystem2.start();
        fireSystem3.start();
    };

    const stop = () => {
        fireSystem1.stop();
        sparksEdge.stop();
        fireSystem2.stop();
        fireSystem3.stop();
        scene.beginDirectAnimation(light, [], 0, 180, false);
    };

    let started = false;
    const keyboardHandler = (event: KeyboardEvent) => {
        if (event.keyCode === 32) {
            if (started) {
                stop();
            } else {
                start();
            }
            started = !started;
        }
    };

    start();
};

/*
// UNUSED
const inspector = (scene: BABYLON.Scene) => {
    let showInspector = false;
    const keyboardHandler = (event: KeyboardEvent) => {
        if (event.keyCode === 78) {
            if (!showInspector) {
                scene.debugLayer.show();
            } else {
                scene.debugLayer.hide();
            }
            showInspector = !showInspector;
        }
    };
    return keyboardHandler;
};

// UNUSED
export const setup1 = (engine: BABYLON.Engine, canvas: HTMLCanvasElement) => {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.UniversalCamera(
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
    camera.attachControl(canvas, true);
};

// UNUSED
export const stuff1 = () => {
    engine.displayLoadingUI();
    scene.executeWhenReady(() => {
        engine.hideLoadingUI();
    });
};

// UNUSED
export const makeEnvironment = (scene: BABYLON.Scene) => {
    let hdrTexture: BABYLON.CubeTexture;
    let light: BABYLON.PointLight;
    let envRotation = 0;

    return {
        setup: () => {
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
            // FIXME: gibts nicht: camera.wheelDeltaPercentage = 0.01;

            // Ground material
            const groundMat = new BABYLON.PBRMaterial("groundMat", scene);
            groundMat.albedoColor = new BABYLON.Color3(0.7968, 0.3685, 0.1105);
            groundMat.metallic = 0;
            groundMat.roughness = 0.6;

            // Ground
            const ground = BABYLON.Mesh.CreatePlane("ground", 500.0, scene);
            ground.position = new BABYLON.Vector3(0, -1.5, 0);
            ground.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
            ground.material = groundMat;

            // Lights
            light = new BABYLON.PointLight(
                "pointLight",
                new BABYLON.Vector3(0, 8, 0),
                scene
            );
            light.intensity = 0;
            light.includedOnlyMeshes.push(ground);
        },

        update: () => {},
    };
};
*/

import * as BABYLON from "babylonjs";

export const createHand = (scene: BABYLON.Scene, handName: string) => {
    const handRoot = new BABYLON.TransformNode(`${handName}-root`, scene);

    const fingers = Array.from({ length: 5 }, (_, i) => {
        const finger = BABYLON.MeshBuilder.CreateSphere(
            `${handName}-finger-${i}`,
            { diameter: 0.1 },
            scene
        );
        finger.parent = handRoot;
        return finger;
    });

    return { root: handRoot, fingers };
};

export const simulateHandMovement = (hand: any, scene: BABYLON.Scene) => {
    let time = 0;
    scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.001;

        hand.fingers.forEach((finger: any, index: number) => {
            const offset = index * 0.2;
            finger.position = new BABYLON.Vector3(
                Math.sin(time + offset) * 0.5,
                Math.cos(time + offset) * 0.5,
                0
            ).add(new BABYLON.Vector3(0, 1, 0));
        });
    });
};

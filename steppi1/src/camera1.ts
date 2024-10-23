import * as BABYLON from "babylonjs";

// Old, broken return type
export const createCamera1 = (
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene
) => {
    let camera: BABYLON.UniversalCamera;
    return {
        setup: async () => {
            camera = new BABYLON.UniversalCamera(
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
        },
        update: () => {},
    };
};

export type CreateCamera1 = Awaited<ReturnType<typeof createCamera1>>;

export const createCamera2 = async (
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene
) => {
    const node = new BABYLON.ArcRotateCamera(
        "camera",
        (3 * Math.PI) / 2,
        Math.PI / 4,
        8,
        BABYLON.Vector3.Zero(),
        scene
    );
    node.attachControl(canvas, true);
    node.useNaturalPinchZoom = false; // Disable smooth zoom
    node.zoomToMouseLocation = true; // Enable zoom to the mouse location
    node.wheelDeltaPercentage = 0.02; // Slow down the zoom speed (lower values = slower zoom)

    return {
        node,
        update: () => {},
    };
};

export type CreateCamera2 = Awaited<ReturnType<typeof createCamera2>>;

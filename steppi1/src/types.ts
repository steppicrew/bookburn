interface MakeParams {
    engine: BABYLON.Engine;
    canvas: HTMLCanvasElement;
    scene: BABYLON.Scene;
    camera: BABYLON.UniversalCamera;
}

interface SetupParams {
    // engine: BABYLON.Engine,
    // canvas: HTMLCanvasElement
    // scene: BABYLON.Scene;
    // camera: BABYLON.UniversalCamera;
}

interface UpdateParams {
    // engine: BABYLON.Engine,
    // canvas: HTMLCanvasElement
    // scene: BABYLON.Scene;
    // camera: BABYLON.UniversalCamera;
}

export type Make = (params: MakeParams) => {
    setup: (params: SetupParams) => void;
    update: (params: UpdateParams) => void;
};

export const dummy = 1;

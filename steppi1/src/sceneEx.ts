import * as BABYLON from "babylonjs";

// Optional: if you're loading external assets like glTF models
// import "babylonjs-loaders";

import { CreateCamera2, createCamera2 } from "./camera1";
import { disposeScene } from "./sceneUtils";

export type CreateSceneFn = (
    scene: BABYLON.Scene,
    camera: CreateCamera2,
    xrHelper: BABYLON.WebXRDefaultExperience
) => Promise<() => void>;

export class SceneEx {
    private _update: () => void = () => undefined;

    private constructor(
        private scene: BABYLON.Scene,
        private camera: CreateCamera2,
        private xrHelper: BABYLON.WebXRDefaultExperience
    ) {}

    public static async create(
        engine: BABYLON.Engine,
        canvas: HTMLCanvasElement
    ) {
        const scene = new BABYLON.Scene(engine);
        const camera = await createCamera2(canvas, scene);
        const xrHelper = await scene.createDefaultXRExperienceAsync();
        return new SceneEx(scene, camera, xrHelper);
    }

    public async setup(createSceneFn: CreateSceneFn) {
        // Save current camera parameters
        const cameraPosition = this.camera.node.position.clone();
        const cameraRotation = this.camera.node.rotation.clone();
        const cameraFov = this.camera.node.fov;

        console.log("camera.position=", JSON.stringify(cameraPosition));

        console.log(
            "camera.node.position = new BABYLON.Vector3(" +
                cameraPosition.x +
                "," +
                cameraPosition.y +
                "," +
                cameraPosition.z +
                ");\n" +
                "camera.node.rotation = new BABYLON.Vector3(" +
                cameraRotation.x +
                "," +
                cameraRotation.y +
                "," +
                cameraRotation.z +
                ");\n" +
                "camera.node.fov = " +
                cameraFov +
                ";\n"
        );

        // Dispose of existing scene content
        disposeScene(this.scene, this.xrHelper);

        // Recreate Scene
        this._update = await createSceneFn(
            this.scene,
            this.camera,
            this.xrHelper
        );

        // Restore camera parameters
        this.camera.node.position = cameraPosition;
        this.camera.node.rotation = cameraRotation;
        this.camera.node.fov = cameraFov;

        // Force an update to ensure Babylon recognizes the changes
        // Force the camera to update its view matrix
        this.camera.node.getViewMatrix(true);
    }

    public update() {
        this._update();
    }

    public render() {
        this.scene.render();
    }
}
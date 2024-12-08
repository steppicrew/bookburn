import * as BABYLON from "babylonjs";

const floorMeshes: BABYLON.AbstractMesh[] = [];

function getFloorHeightUsingMeshes(ray: BABYLON.Ray): number {
    let closestFloorHeight = 0;
    let closestDistance = Infinity;

    for (const mesh of floorMeshes) {
        const pickInfo = ray.intersectsMesh(mesh, false); // false: no bounding box check
        if (pickInfo.hit && pickInfo.pickedPoint) {
            const distance = BABYLON.Vector3.Distance(
                ray.origin,
                pickInfo.pickedPoint
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestFloorHeight = pickInfo.pickedPoint.y;
            }
        }
    }

    return closestFloorHeight;
}

function getFloorHeightUnderCamera(xrHelper: BABYLON.WebXRDefaultExperience) {
    const position = xrHelper.baseExperience.camera.position;
    return getFloorHeightUsingMeshes(
        new BABYLON.Ray(
            position,
            new BABYLON.Vector3(0, -1, 0),
            Math.max(position.y, 2)
        )
    );
}

let gravityEnabled = true;

export function enableGravity(enable: boolean) {
    gravityEnabled = enable;
    console.log(`Gravity ${enable ? "enabled" : "disabled"}.`);
}

export function setupPlayerGravity(
    scene: BABYLON.Scene,
    xrHelper?: BABYLON.WebXRDefaultExperience
) {
    if (!xrHelper) return;

    const teleportation = xrHelper.teleportation;

    const originalAddFloorMesh = teleportation.addFloorMesh.bind(teleportation);
    teleportation.addFloorMesh = (mesh: BABYLON.AbstractMesh) => {
        floorMeshes.push(mesh);
        originalAddFloorMesh(mesh);
    };

    const originalRemoveFloorMesh =
        teleportation.removeFloorMesh.bind(teleportation);
    teleportation.removeFloorMesh = (mesh: BABYLON.AbstractMesh) => {
        const index = floorMeshes.indexOf(mesh);
        if (index < 0) {
            throw new Error(
                `setupTeleportationWithTracking: removeFloorMesh failed. Mesh ${mesh.name} not found in floorMeshes array.`
            );
        }
        floorMeshes.splice(index, 1);
        originalRemoveFloorMesh(mesh);
    };

    const xrCamera = xrHelper.baseExperience.camera;

    const INITIAL_GRAVITY = -0.2;
    let gravity = INITIAL_GRAVITY;
    let lastFloorHeight = 0;

    scene.onBeforeRenderObservable.add(() => {
        if (!gravityEnabled) {
            return;
        }

        const userHeightOffset = xrCamera.realWorldHeight || 1.6;

        const floorHeight = getFloorHeightUnderCamera(xrHelper);

        if (lastFloorHeight !== floorHeight) {
            console.log("FH", floorHeight);
            lastFloorHeight = floorHeight;
        }

        const minH = floorHeight + userHeightOffset;
        if (xrCamera.position.y > minH) {
            xrCamera.position.y = Math.max(minH, xrCamera.position.y + gravity);
            gravity *= 1.04;
        } else {
            gravity = INITIAL_GRAVITY;
        }
    });
}

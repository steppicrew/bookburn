import * as BABYLON from "babylonjs";
import { getCollisionTracker } from "../lib/collisionTracker";

const SHOW_WIRE_FRAME = true;

export const getPhysicsMesh = (
    scene: BABYLON.Scene,
    width: number,
    height: number,
    depth: number
) => {
    // Box 1: Define the first box
    const backMesh = BABYLON.MeshBuilder.CreateBox(
        "box1",
        { width, depth: depth / 2, height },
        scene
    );
    backMesh.position = new BABYLON.Vector3(0, 0, 0);
    backMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        backMesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.5 },
        scene
    );

    // Box 2: Define the second box
    const frontMesh = BABYLON.MeshBuilder.CreateBox(
        "box2",
        { width, depth: depth / 2, height },
        scene
    );
    frontMesh.position = new BABYLON.Vector3(0, depth / 2, 0);
    frontMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        frontMesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.5 },
        scene
    );

    [frontMesh, backMesh].forEach((mesh) => {
        if (SHOW_WIRE_FRAME) {
            mesh.material = new BABYLON.StandardMaterial("bookHull", scene);
            mesh.material.wireframe = true;
        } else {
            mesh.isVisible = false;
        }
    });

    // Create a hinge joint to connect the two boxes
    const hingeJoint = new BABYLON.PhysicsJoint(
        BABYLON.PhysicsJoint.HingeJoint,
        {
            mainPivot: new BABYLON.Vector3(0, depth / 2, 0), // Pivot at the edge of box1
            connectedPivot: new BABYLON.Vector3(0, depth / 2, 0), // Pivot at the edge of box2
            mainAxis: new BABYLON.Vector3(0, 0, height), // Axis of rotation for box1
            connectedAxis: new BABYLON.Vector3(0, 0, height), // Axis of rotation for box2
        }
    );

    // Add the joint between the two physics impostors
    backMesh.physicsImpostor.addJoint(frontMesh.physicsImpostor, hingeJoint);

    let enabled = true;
    const setEnabled = (newState: boolean) => {
        enabled = newState;
        console.log("setEnabled", enabled);
    };

    const collisionTracker = getCollisionTracker({});

    const getUpdate = (() => {
        return (maxAngle: number) => {
            return (time: number) => {
                collisionTracker.onPreEnd();
            };
        };
    })();

    return { mesh: backMesh, getUpdate, collisionTracker, setEnabled };
};

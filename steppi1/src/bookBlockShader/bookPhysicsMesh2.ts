import * as BABYLON from "babylonjs";
import { getCollisionTracker } from "../lib/collisionTracker";

const SHOW_WIRE_FRAME = true;

export const getPhysicsMesh = (
    scene: BABYLON.Scene,
    width: number,
    height: number,
    depth: number
) => {
    depth = 1;

    // Box 1: Define the first box
    const backMesh = BABYLON.MeshBuilder.CreateBox(
        "back",
        { width, height: depth / 2, depth: height },
        scene
    );
    backMesh.position = new BABYLON.Vector3(width / 2, depth / 4, height / 2);
    const backPhysics = new BABYLON.PhysicsAggregate(
        backMesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.3 },
        scene
    );

    // Box 2: Define the second box
    const frontMesh = BABYLON.MeshBuilder.CreateBox(
        "front",
        { width, height: depth / 2, depth: height },
        scene
    );
    frontMesh.position = new BABYLON.Vector3(
        width / 2,
        (3 * depth) / 4,
        height / 2
    );
    const frontPhysics = new BABYLON.PhysicsAggregate(
        frontMesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.3 },
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

    // Define hinge constraints
    const constraintParams: BABYLON.PhysicsConstraintParameters = {
        pivotA: new BABYLON.Vector3(0, depth / 2, 0), // Pivot at the edge of box1
        pivotB: new BABYLON.Vector3(0, depth / 2, 0), // Pivot at the edge of box2
        axisA: new BABYLON.Vector3(0, 0, height), // Axis of rotation for box1
        axisB: new BABYLON.Vector3(0, 0, height), // Axis of rotation for box2
    };

    const angularLimits: BABYLON.Physics6DoFLimit[] = [
        // Restrict rotation around the hinge axis
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, // Axis around which the hinge rotates
            minLimit: -Math.PI / 4, // Minimum rotation angle (-45 degrees)
            maxLimit: Math.PI / 4, // Maximum rotation angle (+45 degrees)
        },
        // Free rotation on other axes (unconstrained)
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
            minLimit: 0,
            maxLimit: 0,
        },
        {
            axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
            minLimit: 0,
            maxLimit: 0,
        },
    ];

    // Create the hinge joint
    new BABYLON.Physics6DoFConstraint(constraintParams, angularLimits, scene);

    /*
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

    backImpostor.addJoint(frontImpostor, hingeJoint);
    */

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

    const node = new BABYLON.TransformNode("book-physics-node", scene);
    backMesh.parent = node;
    frontMesh.parent = node;

    node.position.y = 0.3;

    return { mesh: node, getUpdate, collisionTracker, setEnabled };
};

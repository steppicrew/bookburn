import * as BABYLON from "babylonjs";
import { getCollisionTracker } from "../lib/collisionTracker";

const SHOW_WIRE_FRAME = true;
const RESTITUTION = 1;
const MASS = 1;

const boxPositions: [x: number, y: number, z: number][] = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
];
const boxIndexes = [
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 5, 6, 1, 6, 2, 4,
    5, 1, 4, 1, 0, 3, 2, 6, 3, 6, 7,
];

const getBoxMesh = ({
    scene,
    name,
    width,
    height,
    depth,
}: {
    scene: BABYLON.Scene;
    name: string;
    width: number;
    height: number;
    depth: number;
}) => {
    const mesh = new BABYLON.Mesh(name, scene);

    // Build vertexData
    {
        const vertexData = new BABYLON.VertexData();
        vertexData.indices = boxIndexes;
        vertexData.positions = boxPositions
            .map((p) => [p[0] * width, p[1] * depth, p[2] * height])
            .flat();
        vertexData.applyToMesh(mesh);
    }

    return mesh;
};

export const getPhysicsMesh = (
    scene: BABYLON.Scene,
    width: number,
    height: number,
    depth: number
) => {
    // Box 1: Define the first box
    const backMesh = getBoxMesh({
        name: "back",
        width,
        height,
        depth: depth / 2,
        scene,
    });
    backMesh.position = new BABYLON.Vector3(0, 0, 0);

    // Box 2: Define the second box
    const frontMesh = getBoxMesh({
        name: "front",
        width,
        height,
        depth: depth / 2,
        scene,
    });
    frontMesh.position = new BABYLON.Vector3(0, depth / 2, 0);
    frontMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 4);

    const enablePhysics = () => {
        const backPhysics = new BABYLON.PhysicsAggregate(
            backMesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: MASS, restitution: RESTITUTION },
            scene
        );
        const frontPhysics = new BABYLON.PhysicsAggregate(
            frontMesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: MASS, restitution: RESTITUTION },
            scene
        );

        const joint = new BABYLON.HingeConstraint(
            new BABYLON.Vector3(0, depth / 2, 0),
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, 1),
            scene
        );

        let angleConstraint: BABYLON.Physics6DoFConstraint | undefined;

        const setMaxAngle = (angle: number) => {
            if (angleConstraint) {
                angleConstraint.dispose();
            }

            angleConstraint = new BABYLON.Physics6DoFConstraint(
                {
                    pivotA: new BABYLON.Vector3(0, depth / 2, 0),
                    pivotB: new BABYLON.Vector3(0, 0, 0),
                    axisA: new BABYLON.Vector3(0, 0, 1),
                    axisB: new BABYLON.Vector3(0, 0, 1),
                },
                [
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                        minLimit: 0,
                        maxLimit: angle,
                    },
                    /*
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    */
                ],
                scene
            );
            backPhysics.body.addConstraint(frontPhysics.body, angleConstraint);
        };

        backPhysics.body.addConstraint(frontPhysics.body, joint);
        setMaxAngle(Math.PI);

        return setMaxAngle;
    };

    [frontMesh, backMesh].forEach((mesh) => {
        if (SHOW_WIRE_FRAME) {
            mesh.material = new BABYLON.StandardMaterial("bookHull", scene);
            mesh.material.wireframe = true;
        } else {
            mesh.isVisible = false;
        }
    });

    /*
    scene,
        backMesh,
        new BABYLON.Vector3(0, depth / 2, 0),
        frontMesh,
        new BABYLON.Vector3(0, depth / 2, 0),
        new BABYLON.Vector3(0, 0, 1)
    );
    */

    /*
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
    */

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

    const getPositionAngle = () => {
        const position = backMesh.getAbsolutePosition();
        const rotation =
            backMesh.rotationQuaternion?.clone() ||
            backMesh.rotation.toQuaternion();

        const frontRotation =
            frontMesh.rotationQuaternion || frontMesh.rotation.toQuaternion();

        const relativeRotation = rotation.conjugate().multiply(frontRotation);

        const angle = 2 * Math.acos(Math.min(Math.abs(relativeRotation.w), 1)); // Clamp to avoid NaN

        return { position, rotation, angle };
    };

    const getUpdate = (() => {
        return (maxAngle: number) => {
            setMaxAngle(maxAngle);
            return (time: number) => {
                collisionTracker.onPreEnd();
            };
        };
    })();

    const node = new BABYLON.TransformNode("book-physics-node", scene);
    backMesh.parent = node;
    frontMesh.parent = node;

    node.position = new BABYLON.Vector3(0.5, 2, 0.5);
    // node.rotation = new BABYLON.Vector3(1, 0, 0);

    const setMaxAngle = enablePhysics();

    // setMetadatas(node, { getPositionAngle });

    return {
        mesh: node,
        getUpdate,
        getPositionAngle,
        collisionTracker,
        setEnabled,
    };
};

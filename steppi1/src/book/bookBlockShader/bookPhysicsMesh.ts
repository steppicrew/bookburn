import * as BABYLON from "babylonjs";
import { getCollisionTracker } from "../../lib/collisionTracker";
import { MASS_BACK, MASS_FRONT, RESTITUTION } from "../types";

const SHOW_WIRE_FRAME = true;

const boxPositions: [x: number, y: number, z: number][] = [
    [0, 0, 0], // 0
    [1, 0, 0], // 1
    [1, 1, 0], // 2
    [0, 1, 0], // 3
    [0, 0, 1], // 4
    [1, 0, 1], // 5
    [1, 1, 1], // 6
    [0, 1, 1], // 7
] as const;
const boxIndexes = [
    [0, 1, 2, 0, 2, 3], // front plane
    [4, 5, 6, 4, 6, 7], // back plane
    [0, 4, 7, 0, 7, 3], // left plane
    [1, 5, 6, 1, 6, 2], // right plane
    [4, 5, 1, 4, 1, 0], // bottom plane
    [3, 2, 6, 3, 6, 7], // top plane
] as const;

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
        vertexData.indices = boxIndexes.flat();
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
    const frontBackDepth = depth / 2;
    const frontOffset = frontBackDepth; // + 0.0000001;

    // Box 1: Define the first box
    const backMesh = getBoxMesh({
        name: "back physical Hull",
        width,
        height,
        depth: frontBackDepth,
        scene,
    });
    backMesh.position = new BABYLON.Vector3(0, 0, 0);

    // Box 2: Define the second box
    const frontMesh = getBoxMesh({
        name: "front physical Hull",
        width,
        height,
        depth: frontBackDepth,
        scene,
    });
    frontMesh.position = new BABYLON.Vector3(0, frontOffset, 0);
    frontMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 4);

    const enablePhysics = () => {
        const backPhysics = new BABYLON.PhysicsAggregate(
            backMesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: MASS_BACK, restitution: RESTITUTION },
            scene
        );
        const frontPhysics = new BABYLON.PhysicsAggregate(
            frontMesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: MASS_FRONT, restitution: RESTITUTION },
            scene
        );
        /*
        const joint = new BABYLON.HingeConstraint(
            new BABYLON.Vector3(0, frontBackDepth, 0),
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, 1),
            scene
        );
        */
        const constratintParams: BABYLON.PhysicsConstraintParameters = {
            pivotA: new BABYLON.Vector3(0, frontBackDepth, 0),
            pivotB: new BABYLON.Vector3(0, 0, 0),
            axisA: new BABYLON.Vector3(0, 0, 1),
            axisB: new BABYLON.Vector3(0, 0, 1),
        } as const;

        const joint = new BABYLON.Physics6DoFConstraint(
            constratintParams,
            [
                {
                    axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, // Lock movement along X-axis
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, // Lock movement along Y-axis
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, // Lock movement along Z-axis
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.LINEAR_DISTANCE, // Lock distance between the two boxes
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, // Lock rotation around X-axis
                    minLimit: 0,
                    maxLimit: Math.PI,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, // Lock rotation around Y-axis
                    minLimit: 0,
                    maxLimit: 0,
                },
                {
                    axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, // Lock rotation around Z-axis
                    minLimit: 0,
                    maxLimit: 0,
                },
            ],
            scene
        );

        let angleConstraint: BABYLON.Physics6DoFConstraint | undefined =
            undefined;

        const setMaxAngle = (angle: number) => {
            if (angleConstraint) {
                angleConstraint.dispose();
            }
            if (backMesh.isDisposed() || frontMesh.isDisposed()) {
                return;
            }

            if (angle < 0) angle = 0;
            if (angle > Math.PI) angle = Math.PI;

            // console.log("setMaxAngle", angle);

            angleConstraint = new BABYLON.Physics6DoFConstraint(
                constratintParams,
                [
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                        minLimit: 0,
                        maxLimit: angle,
                    },
                ],
                scene
            );
            backPhysics.body.addConstraint(frontPhysics.body, angleConstraint);
        };

        const _setPosition = (
            box: BABYLON.Mesh,
            newPosition: BABYLON.Vector3
        ) => {
            box.physicsImpostor?.setLinearVelocity(BABYLON.Vector3.Zero());
            box.physicsImpostor?.setAngularVelocity(BABYLON.Vector3.Zero());
            box.position = newPosition;
            box.physicsImpostor?.setDeltaPosition(
                newPosition.subtract(box.position)
            );
        };

        const setPosition = (newPosition: BABYLON.Vector3) => {
            _setPosition(backMesh, newPosition);
            _setPosition(
                frontMesh,
                newPosition.add(new BABYLON.Vector3(0, frontOffset, 0))
            );
        };
        backPhysics.body.addConstraint(frontPhysics.body, joint);
        setMaxAngle(Math.PI);

        return { setMaxAngle, setPosition } as const;
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

    // node.position = new BABYLON.Vector3(0, 2, 0);
    // node.rotation = new BABYLON.Vector3(1, 0, 0);

    const { setMaxAngle, setPosition } = enablePhysics();

    // setMetadatas(node, { getPositionAngle });

    return {
        mesh: node,
        getUpdate,
        getPositionAngle,
        collisionTracker,
        setEnabled,
        setPosition,
    };
};

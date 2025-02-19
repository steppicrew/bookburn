import * as BABYLON from "babylonjs";
import { Book } from "../book/types";
import { XrPhysicsBody } from "../lib/xrTypes";

// TODO: Move to lib/nodeUtils.ts

interface NodeMetadata {
    // If a body has no physics itself but has a physics body assigned, that's it
    physicsBody?: XrPhysicsBody;

    book?: Book;

    // Stop a body's physics
    stopPhysics?: () => void;

    // (Re)Start a body's physics
    startPhysics?: (
        physicsParameters?: BABYLON.PhysicsAggregateParameters
    ) => void;

    getPositionAngle?: () => {
        position: BABYLON.Vector3;
        rotation: BABYLON.Quaternion;
        angle: number;
    };
}

export const getMetadata = (node: BABYLON.Node): NodeMetadata | undefined => {
    if (node.metadata) {
        return node.metadata as NodeMetadata;
    }
    if (node.parent) {
        return getMetadata(node.parent);
    }
    return undefined;
};

export const setMetadata = <T extends keyof NodeMetadata>(
    node: BABYLON.Node,
    key: T,
    value: NodeMetadata[T]
) => {
    const metadata: NodeMetadata = getMetadata(node) || {};
    metadata[key] = value;
    if (!node.metadata) {
        node.metadata = metadata;
    }
};

export const setMetadatas = (node: BABYLON.Node, metadata: NodeMetadata) => {
    node.metadata = { ...getMetadata(node), ...metadata };
};

import * as BABYLON from "babylonjs";

interface NodeMetadata {
    // If a body has no physics itself but has a physics body assigned, that's it
    physicsBody?: BABYLON.Node;

    // Stop a body's physics
    stopPhysics?: () => void;

    // (Re)Start a body's physics
    startPhysics?: () => void;
}

export const getMetadata = (node: BABYLON.Node): NodeMetadata | undefined => {
    return node.metadata ? (node.metadata as NodeMetadata) : undefined;
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

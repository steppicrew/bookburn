import * as BABYLON from "babylonjs";
import { updateWrapper } from "../lib/updateWrapper";
import { setMetadata } from "../nodeLib/nodeTools";
import { setupBook } from "./bookBlockShader/book";
import { Book, BookState, MASS, RESTITUTION } from "./types";

const DefaultPageCount = 200;
const DefaultPageDepth = 0.01;
const DefaultCoverDepth = 0.1;
const DefaultMaxFlipPageCount = 50;

interface BookProperties {
    scene: BABYLON.Scene;
    xrHelper: BABYLON.WebXRDefaultExperience;
    width: number;
    height: number;
    pageCount?: number;
    pageDepth?: number;
    coverDepth?: number;
    maxFlipPageCount?: number;
    texture: string;
}

const createIdleBook = (
    scene: BABYLON.Scene,
    xrHelper: BABYLON.WebXRDefaultExperience,
    book: Book,
    {
        width,
        height,
        depth,
    }: {
        width: number;
        height: number;
        depth: number;
        texture: string;
    }
): {
    node: BABYLON.TransformNode;
    startPhysics: () => void;
    stopPhysics: () => void;
    moveWithCollisions: (moveBy: BABYLON.Vector3) => void;
} => {
    const idleBook = new BABYLON.TransformNode("idleBook", scene);
    const mesh = BABYLON.MeshBuilder.CreateBox(
        "idleBookMesh",
        { width, height, depth },
        scene
    );
    mesh.material = new BABYLON.StandardMaterial("idelBook", scene);
    mesh.material.wireframe = true;

    let physicsAggregates: BABYLON.PhysicsAggregate | undefined = undefined;
    const stopPhysics = () => {
        if (physicsAggregates) {
            physicsAggregates.dispose();
            physicsAggregates = undefined;
        }
    };
    const startPhysics = () => {
        if (physicsAggregates) {
            stopPhysics();
        }
        physicsAggregates = new BABYLON.PhysicsAggregate(
            mesh,
            BABYLON.PhysicsShapeType.BOX,
            { mass: MASS, restitution: RESTITUTION },
            scene
        );
    };

    const moveWithCollisions = (moveBy: BABYLON.Vector3) => {
        mesh.moveWithCollisions(moveBy);
    };

    mesh.parent = idleBook;
    mesh.position = new BABYLON.Vector3(width / 2, depth / 2, height / 2);
    setMetadata(mesh, "book", book);
    return { node: idleBook, startPhysics, stopPhysics, moveWithCollisions };
};

export const makeBook = ({
    scene,
    xrHelper,
    width,
    height,
    pageCount,
    pageDepth,
    coverDepth,
    maxFlipPageCount,
    texture,
}: BookProperties): Book => {
    if (!pageCount) pageCount = DefaultPageCount;
    if (!pageDepth) pageDepth = DefaultPageDepth;
    if (!coverDepth) coverDepth = DefaultCoverDepth;
    if (!maxFlipPageCount) maxFlipPageCount = DefaultMaxFlipPageCount;

    let state: BookState = "idle" as BookState;

    const updates = updateWrapper();

    const getNode = (): BABYLON.Node => {
        switch (state) {
            case "idle":
                return idleBook.node;
            case "open":
                return flippingBook.node;
            case "flipping":
                return flippingBook.node;
        }
    };

    const getAbsolutePosition = (): BABYLON.Vector3 => {
        const node = getNode();
        const worldMatrix = node.getWorldMatrix();
        return worldMatrix.getTranslation();
    };

    const setAbsolutePosition = (position: BABYLON.Vector3) => {
        switch (state) {
            case "idle":
                idleBook.node.setAbsolutePosition(position);
                break;
            case "open":
            case "flipping":
                flippingBook.node.setAbsolutePosition(position);
                break;
        }
    };

    const stopPhysics = () => {
        switch (state) {
            case "idle":
                idleBook.stopPhysics();
                break;
            case "open":
            case "flipping":
                // flippingBook.physicsBody?.stopPhysics();
                break;
        }
    };

    const startPhysics = () => {
        switch (state) {
            case "idle":
                idleBook.startPhysics();
                break;
            case "open":
            case "flipping":
                // flippingBook.physicsBody?.startPhysics();
                break;
        }
    };

    const moveWithCollisions = (moveBy: BABYLON.Vector3) => {
        switch (state) {
            case "idle":
                idleBook.moveWithCollisions(moveBy);
                break;
            case "open":
            case "flipping":
                // flippingBook.physicsBody?.moveWithCollisions(moveBy);
                break;
        }
    };

    const book: Book = {
        name: "book",
        getState: () => state,
        // Todo: Implement setState
        setState: () => {},
        getAbsolutePosition,
        setAbsolutePosition,
        stopPhysics,
        startPhysics,
        moveWithCollisions,
        updates,
    };

    const idleBook = createIdleBook(scene, xrHelper, book, {
        width,
        height,
        depth: 2 * coverDepth + pageCount * pageDepth,
        texture,
    });

    const flippingBook = setupBook(scene, xrHelper, book, {
        width,
        height,
        pageCount,
        pageDepth,
        coverDepth,
        maxFlipPageCount,
        texture,
    });

    updates.addUpdates(flippingBook.updates);

    return book;
};

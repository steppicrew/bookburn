import * as BABYLON from "babylonjs";

export const createBook2 = (scene: BABYLON.Scene) => {
    // Materials for book cover and pages
    const coverMaterial = new BABYLON.StandardMaterial("coverMaterial", scene);
    coverMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.1); // Reddish brown for cover

    const frontPageMaterial = new BABYLON.StandardMaterial(
        "frontPageMaterial",
        scene
    );
    frontPageMaterial.diffuseColor = new BABYLON.Color3(1, 0.9, 0.8); // Slightly off-white for pages
    /*
    frontPageMaterial.diffuseTexture = new BABYLON.Texture(
        "assets/front.jpg",
        scene
    );
    */
    frontPageMaterial.backFaceCulling = false; // Ensure both sides of the page are rendered

    const backPageMaterial = new BABYLON.StandardMaterial(
        "backPageMaterial",
        scene
    );
    backPageMaterial.diffuseColor = new BABYLON.Color3(1, 0.9, 0.8); // Slightly off-white for pages
    /*
    backPageMaterial.diffuseTexture = new BABYLON.Texture(
        "assets/back.jpg",
        scene
    );
    */
    backPageMaterial.backFaceCulling = false;

    // Create an empty parent mesh (book holder)
    const bookHolder = new BABYLON.TransformNode("bookHolder", scene);

    // Create book components

    // Book cover (front and back)
    const bookWidth = 4,
        bookHeight = 6,
        coverDepth = 0.2,
        pageDepth = 0.01,
        pageCount = 100;

    const bookDepth = 2 * coverDepth + pageCount * pageDepth;

    const pivotOffset = new BABYLON.Vector3(-bookWidth / 2, 0, 0); // Move pivot to the left edge

    const frontCover = BABYLON.MeshBuilder.CreateBox(
        "frontCover",
        { width: bookWidth, height: bookHeight, depth: coverDepth },
        scene
    );

    frontCover.material = coverMaterial;
    frontCover.position.z = -(bookDepth / 2 - coverDepth / 2); // Front cover is slightly in front of pages
    frontCover.setPivotPoint(
        new BABYLON.Vector3(
            -bookWidth / 2 + frontCover.position.z,
            0,
            -frontCover.position.z
        )
    );

    const backCover = BABYLON.MeshBuilder.CreateBox(
        "backCover",
        { width: bookWidth, height: bookHeight, depth: coverDepth },
        scene
    );
    backCover.material = coverMaterial;
    backCover.position.z = bookDepth / 2 - coverDepth / 2; // Back cover slightly behind pages
    backCover.setPivotPoint(
        new BABYLON.Vector3(
            -bookWidth / 2 + frontCover.position.z,
            0,
            -backCover.position.z
        )
    );

    // Set front and back covers as children of the book holder
    frontCover.parent = bookHolder;
    backCover.parent = bookHolder;

    // Interactivity: Flip pages
    let currentPage = 0;
    const flipPage = (dir: 1 | -1 = 1) => {
        if (dir === 1 && currentPage > pageCount) {
            return;
        }
        if (dir === -1 && currentPage < 1) {
            return;
        }
        const page = currentPage ? backCover : frontCover;
        BABYLON.Animation.CreateAndStartAnimation(
            "flip",
            page,
            "rotation.y",
            30,
            30,
            0,
            Math.PI,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        currentPage += dir;
    };

    return {
        book: bookHolder,
        flipPage,
    };
};

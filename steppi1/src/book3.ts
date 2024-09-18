import * as BABYLON from "babylonjs";

export const createBook = (scene: BABYLON.Scene) => {
    // Vortex shader
    const vortexShader = new BABYLON.ShaderMaterial(
        "vortexShader",
        scene,
        {
            vertex: "vortex", // Refers to vortex.vertex.fx
            fragment: "vortex", // Refers to vortex.fragment.fx
        },
        {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "time"],
        }
    );

    // Set a texture to the vortex shader
    vortexShader.setTexture(
        "textureSampler",
        new BABYLON.Texture("assets/front.jpg", scene)
    );

    // Time uniform for animation
    let time = 0;
    scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.001;
        vortexShader.setFloat("time", time);
    });

    // Create an empty parent mesh (book node)
    const node = new BABYLON.TransformNode("book", scene);

    // Book dimensions and settings
    const bookWidth = 4,
        bookHeight = 6,
        coverDepth = 0.2,
        pageDepth = 0.01,
        pageCount = 10;

    const bookDepth = 2 * coverDepth + pageCount * pageDepth;

    // Materials for cover
    const coverMaterial = new BABYLON.StandardMaterial("coverMaterial", scene);
    coverMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.2, 0.1); // Reddish brown

    const frontCover = BABYLON.MeshBuilder.CreateBox(
        "frontCover",
        { width: bookWidth, height: bookHeight, depth: coverDepth },
        scene
    );
    frontCover.material = coverMaterial;
    frontCover.position.z = -(bookDepth / 2 - coverDepth / 2);

    const backCover = BABYLON.MeshBuilder.CreateBox(
        "backCover",
        { width: bookWidth, height: bookHeight, depth: coverDepth },
        scene
    );
    backCover.material = coverMaterial;
    backCover.position.z = bookDepth / 2 - coverDepth / 2;

    frontCover.parent = node;
    backCover.parent = node;

    // Create pages with vortex shader
    const pages: BABYLON.Mesh[] = [];
    const pageOffsetZ = frontCover.position.z + coverDepth / 2;
    const pivotOffsetX = bookWidth / 2 + (bookDepth / 2 - coverDepth / 2);

    for (let i = 0; i < pageCount; i++) {
        const page = BABYLON.MeshBuilder.CreatePlane(
            `page${i}`,
            { width: bookWidth, height: bookHeight },
            scene
        );

        page.position.z = pageOffsetZ + i * pageDepth;
        page.setPivotPoint(
            new BABYLON.Vector3(-pivotOffsetX, 0, -page.position.z)
        );

        // Apply vortex shader material to each page
        page.material = vortexShader;

        page.parent = node;
        pages.push(page);
    }

    // Interactivity: Flip pages
    let currentPage = 0;
    const flipPage = (dir: 1 | -1 = 1) => {
        if (dir === 1 && currentPage >= pageCount) {
            return;
        }
        if (dir === -1 && currentPage <= 0) {
            return;
        }
        const page = pages[currentPage];
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
        node,
        flipPage,
    };
};

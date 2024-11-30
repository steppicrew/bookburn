const fs = require("fs");
const path = require("path");

// Array of paths
const paths = [
    "../downloads/kenney_building-kit/Models/GLB format",
    "../downloads/kenney_furniture-kit/Models/GLTF format",
];

// Function to extract group name from path
const extractGroupName = (inputPath) => {
    const match = inputPath.match(/(?:kenney_)?([^\/]+)?(?:-[^\/]+)\/Models/);
    return match ? match[1] : "unknown";
};

// Process each path
const assets = [];
paths.forEach((currentPath) => {
    const groupName = extractGroupName(currentPath);
    const dirPath = path.resolve(currentPath);

    // Read all filenames from the directory
    const files = fs.readdirSync(dirPath);

    // Filter and process filenames
    files.forEach((file) => {
        if (file.endsWith(".glb")) {
            const fileName = file.replace(".glb", "");
            assets.push(`${groupName}/${fileName}`);
        }
    });
});

// Generate TypeScript file
const generateTypescriptFile = (assets) => {
    const assetKeys = assets.map((asset) => `"${asset}"`).join("\n    | ");
    return (
        "// Generated with ../../makeAssetKey.cjs\n\n" +
        `export type AssetKey =\n    ${assetKeys};\n`
    );
};

const typescriptContent = generateTypescriptFile(assets);
const outputPath = path.resolve(__dirname, "src/lib/AssetKey.ts");
fs.writeFile(outputPath, typescriptContent, (writeErr) => {
    if (writeErr) {
        console.error("Error writing TypeScript file:", writeErr);
        return;
    }
    console.log("TypeScript file generated successfully at", outputPath);
});

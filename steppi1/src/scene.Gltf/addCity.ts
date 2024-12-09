import * as BABYLON from "babylonjs";

import { makeRandom } from "../lib/makeRandom";
import { addHouse1 } from "../nodeLib/houseNode";
import { makeWalls, WallFeatures } from "../nodeLib/makeWalls";
import { makeRandomOutline } from "./makeRandomOutline";

export const addCity = async (
    scene: BABYLON.Scene,
    shadowGenerator?: BABYLON.ShadowGenerator
) => {
    const random = makeRandom(201);

    const cityWidth = 150;
    const cityContour = new Array(cityWidth).fill(0);

    for (let i = 0; i <= 100; ++i) {
        // const outline = [3, -3, -4, 1];
        const outline = makeRandomOutline(random);
        if (!outline) {
            continue;
        }

        // console.log("walls", bestX, bestY, cityContour);

        const features: WallFeatures = [];

        let floors = random() % 7;
        if (floors == 0) {
            floors = (random() % 25) + 1;
            if (floors > 15) {
                features.push({ type: "elevator", index: random() % 20 });
            }
        } else {
            floors = (random() % 12) + 1;
        }

        // console.log(outline);
        const walls = makeWalls(outline, features);

        let bestScore = Infinity;
        let bestX = 0;
        let bestY = 0;
        for (let j = 0; j < cityWidth - walls.width; ++j) {
            //
            let score1 = 0;
            let score = 0;
            for (let k = 0; k < walls.width; ++k) {
                const diff =
                    cityContour[j + k] - walls.contourMinX[k - walls.x];
                if (diff > score1) {
                    score1 = diff;
                }
                score -= diff;
            }
            score += score1 * walls.width;
            if (score1 < bestScore) {
                bestScore = score1;
                bestX = j;
                bestY = score1;
            }
        }
        for (let k = 0; k < walls.width; ++k) {
            cityContour[bestX + k] =
                bestY + walls.contourMaxX[k - walls.x] + (random() % 6);
        }
        const r = random() % 6;
        for (let k = 0; k < r; ++k) {
            if (bestX - k - 1 >= 0) {
                cityContour[bestX - k - 1] = Math.max(
                    cityContour[bestX - k - 1],
                    cityContour[bestX - k]
                );
            }
            if (bestX + walls.width + k < cityContour.length) {
                cityContour[bestX + walls.width + k] = Math.max(
                    cityContour[bestX + walls.width + k],
                    cityContour[bestX + walls.width + k - 1]
                );
            }
        }

        await addHouse1(scene, walls, bestX, bestY, random, {
            floors,
            shadowGenerator,
        });
    }
    // debugger;
    // console.log("OUTLINE", outline);

    return;
};

import * as BABYLON from "babylonjs";
import { makeGui } from "./guiUtils";

// TODO: Make this a GUI Library:

export const initBookDebugGui = (
    scene: BABYLON.Scene,
    onUseManualTime: (manual: boolean) => void,
    onTimeChanged: (time: number) => void
) => {
    const gui = makeGui(scene);

    const useTimeCheckbox = gui.addCheckbox({
        name: "UseTimeSlider",
        label: "Set time manually",
        onChecked: (value) => {
            timeSlider.setEnabled(value);
            onUseManualTime(value);
        },
    });
    const timeSlider = gui.addSlider({
        name: "TimeSlider",
        maximum: 2,
        onValueChanged: function (this, value) {
            if (this.isEnabled) {
                onTimeChanged(value);
            }
        },
        keyLeft: ",",
        keyRight: ".",
    });
};

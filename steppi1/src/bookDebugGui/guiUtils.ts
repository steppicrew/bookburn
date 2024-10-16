import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

const setControlPadding = (control: GUI.Control) => {
    control.paddingTop = "10px";
    control.paddingRight = "10px";
    control.paddingBottom = "10px";
    control.paddingLeft = "10px";
};

interface SliderProps {
    name: string;
    onValueChanged: (this: GUI.Slider, value: number) => void;
    minimum?: number;
    maximum?: number;
}

interface CheckboxProps {
    name: string;
    label: string;
    onChecked: (checked: boolean) => void;
}

export const makeGui = (scene: BABYLON.Scene) => {
    // Create a fullscreen UI for the slider and checkbox
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "UI",
        true,
        scene
    );

    const makeSlider = ({
        name,
        onValueChanged,
        minimum = 0,
        maximum = 1,
    }: SliderProps) => {
        // Create a slider for time control (0 to 2 seconds)
        const slider = new GUI.Slider();
        slider.name = name;
        slider.minimum = minimum;
        slider.maximum = maximum;
        slider.value = minimum;
        slider.height = "40px";
        slider.color = "gray";
        slider.background = "gray";
        slider.isEnabled = false;
        // Action for when the slider value changes
        slider.onValueChangedObservable.add(onValueChanged.bind(slider));

        setControlPadding(slider);

        const setEnabled = (isEnabled: boolean) => {
            slider.isEnabled = isEnabled;
            slider.color = isEnabled ? "green" : "gray";
        };

        return { node: slider, slider, setEnabled };
    };

    const makeCheckbox = ({ name, onChecked, label }: CheckboxProps) => {
        const panel1 = new GUI.StackPanel();
        panel1.name = name;
        panel1.isVertical = false; // This arranges the elements in a row (horizontal stack)
        panel1.width = "100%";
        panel1.height = "40px"; // Moves the panel 10px up from the bottom
        setControlPadding(panel1);

        const checkbox = new GUI.Checkbox();
        checkbox.name = name + "Checkbox";
        checkbox.width = "30px";
        checkbox.height = "20px";
        checkbox.isChecked = false;
        checkbox.color = "green";
        checkbox.paddingRight = "10px";
        checkbox.onIsCheckedChangedObservable.add(onChecked.bind(checkbox));

        const checkboxLabel = new GUI.TextBlock();
        checkboxLabel.name = name + "Label";
        checkboxLabel.text = label;
        checkboxLabel.height = "20px";
        checkboxLabel.width = "150px";
        checkboxLabel.textHorizontalAlignment =
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

        panel1.addControl(checkbox);
        panel1.addControl(checkboxLabel);

        return { node: panel1 };
    };

    // Create a stack panel to hold the checkbox and label
    const panel = new GUI.StackPanel();
    panel.name = "GuiPanel";
    panel.width = "400px";
    panel.height = "100px"; // TODO: Make this a param
    panel.isVertical = true;
    panel.background = "#FFFFFF20";
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;

    let height = 20;

    const addControl = <T extends { node: GUI.Control }>(result: T): T => {
        panel.addControl(result.node);
        if (typeof result.node.height === "number") {
            height += result.node.height;
            panel.height = height + "px";
        } else {
            height += parseInt(result.node.height, 10);
            panel.height = height + "px";
        }
        return result;
    };

    const addSlider = (props: SliderProps) => addControl(makeSlider(props));
    const addCheckbox = (props: CheckboxProps) =>
        addControl(makeCheckbox(props));

    // Add panel to the UI
    advancedTexture.addControl(panel);

    return {
        addSlider,
        addCheckbox,
    };
};

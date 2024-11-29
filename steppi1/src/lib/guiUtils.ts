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
    keyLeft?: string;
    keyRight?: string;
}

interface CheckboxProps {
    name: string;
    label: string;
    onChecked: (checked: boolean) => void;
}

export const makeGui = (scene: BABYLON.Scene) => {
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
        keyLeft,
        keyRight,
    }: SliderProps) => {
        const grid = new GUI.Grid();
        grid.width = "100%";
        grid.height = "40px";

        grid.addColumnDefinition(0.7);
        grid.addColumnDefinition(0.2);
        grid.addColumnDefinition(0.1);

        const slider = new GUI.Slider();
        slider.name = name;
        slider.minimum = minimum;
        slider.maximum = maximum;
        slider.value = minimum;
        slider.width = "100%";
        slider.height = "40px";
        slider.color = "gray";
        slider.background = "gray";
        slider.isEnabled = false;

        const keyText = new GUI.TextBlock();
        keyText.text =
            keyLeft && keyRight ? `[ ${keyLeft} ]/[ ${keyRight} ]` : "";
        keyText.width = "100%";
        keyText.textHorizontalAlignment =
            GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        keyText.color = "white";

        const valueText = new GUI.TextBlock();
        valueText.text = slider.value.toFixed(2);
        valueText.width = "100%";
        valueText.textHorizontalAlignment =
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        valueText.color = "white";

        grid.addControl(slider, 0, 0);
        grid.addControl(keyText, 0, 1);
        grid.addControl(valueText, 0, 2);

        const step = 0.05;

        let insideSetValue = false;
        const _setValue = (value: number) => {
            if (!insideSetValue) {
                insideSetValue = true;
                slider.value = value;
                onValueChanged.call(slider, slider.value);
                valueText.text = slider.value.toFixed(2);
                insideSetValue = false;
            }
        };

        slider.onValueChangedObservable.add((value) => {
            _setValue(Math.floor(value / step) * step);
        });

        setControlPadding(slider);
        setControlPadding(valueText);

        const setEnabled = (isEnabled: boolean) => {
            slider.isEnabled = isEnabled;
            slider.color = isEnabled ? "white" : "gray";
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (!slider.isEnabled) return;

            const _step = event.shiftKey ? step / 10 : step;

            if (
                keyLeft &&
                (event.key === keyLeft || event.key === keyLeft.toUpperCase())
            ) {
                _setValue(slider.value - _step);
            }
            if (
                keyRight &&
                (event.key === keyRight || event.key === keyRight.toUpperCase())
            ) {
                _setValue(slider.value + _step);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        grid.onDisposeObservable.add(() =>
            window.removeEventListener("keydown", onKeyDown)
        );

        return { node: grid, slider, setEnabled };
    };

    const makeCheckbox = ({ name, onChecked, label }: CheckboxProps) => {
        const panel = new GUI.StackPanel();
        panel.name = name;
        panel.isVertical = false;
        panel.width = "100%";
        panel.height = "40px";
        setControlPadding(panel);

        const checkbox = new GUI.Checkbox();
        checkbox.name = name + "Checkbox";
        checkbox.width = "30px";
        checkbox.height = "20px";
        checkbox.isChecked = false;
        checkbox.background = "#406040";
        checkbox.color = "white";
        checkbox.paddingRight = "10px";
        checkbox.onIsCheckedChangedObservable.add(onChecked.bind(checkbox));

        const checkboxLabel = new GUI.TextBlock();
        checkboxLabel.name = name + "Label";
        checkboxLabel.text = label;
        checkboxLabel.height = "20px";
        checkboxLabel.width = "150px";
        checkboxLabel.textHorizontalAlignment =
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        checkboxLabel.color = "white";

        checkboxLabel.onPointerDownObservable.add(() => {
            checkbox.isChecked = !checkbox.isChecked;
            checkbox.onIsCheckedChangedObservable.notifyObservers(
                checkbox.isChecked
            );
        });

        panel.addControl(checkbox);
        panel.addControl(checkboxLabel);

        return { node: panel };
    };

    const panel = new GUI.StackPanel();
    panel.name = "GuiPanel";
    panel.width = "600px";
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

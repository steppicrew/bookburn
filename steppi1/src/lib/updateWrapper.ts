import * as BABYLON from "babylonjs";

export type UpdateFn = (remove: () => void) => void;
export interface UpdateWrapper {
    add: (update: UpdateFn) => void;
    onRemove: (update: UpdateFn, onRemove: () => void) => void;
    remove: (update: UpdateFn) => void;
    update: () => void;
    dispose: () => void;
    addUpdates: (childWrapper: UpdateWrapper) => void;
}

export const updateWrapper = (): UpdateWrapper => {
    const updates: Map<UpdateFn, (() => void)[]> = new Map();

    const add = (update: UpdateFn) => updates.set(update, []);
    const onRemove = (update: UpdateFn, onRemove: () => void) =>
        updates.get(update)?.push(onRemove);
    const remove = (update: UpdateFn) => {
        updates.get(update)?.forEach((onRemove) => onRemove());
        updates.delete(update);
    };
    const update = () => {
        updates.keys().forEach((update) => update(() => remove(update)));
    };

    const dispose = () => {
        updates.forEach((update) => {
            update.forEach((onRemove) => onRemove());
        });
        updates.clear();
    };

    const addWrapper = (childWrapper: UpdateWrapper) => {
        add(childWrapper.update);
        onRemove(childWrapper.update, childWrapper.dispose);
    };

    return {
        add,
        onRemove,
        remove,
        update,
        dispose,
        addUpdates: addWrapper,
    };
};

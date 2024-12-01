import * as BABYLON from "babylonjs";

type CollisionState = "started" | "continued" | "ended" | "pre-ended" | "idle";
type CollisionEventHandler = (event: {
    collides: boolean;
    state: CollisionState;
    event?: BABYLON.IPhysicsCollisionEvent;
}) => void;

export const getCollisionTracker = ({
    body,
    usePreEnded: _usePreEnded,
}: {
    body?: BABYLON.PhysicsBody;
    usePreEnded?: boolean;
}) => {
    const usePreEnded = _usePreEnded === undefined ? true : _usePreEnded;
    let state: CollisionState = "idle";

    const eventListeners: Set<CollisionEventHandler> = new Set();

    const addEventListerner = (handler: CollisionEventHandler) =>
        eventListeners.add(handler);

    const removeEventListener = (handler: CollisionEventHandler) =>
        eventListeners.delete(handler);

    const _onEvent = (
        newState: CollisionState,
        event?: BABYLON.IPhysicsCollisionEvent
    ) => {
        if (newState === "pre-ended") {
            switch (state) {
                case "ended":
                    return;
                case "pre-ended":
                    newState = "ended";
            }
        } else if (newState === "started") {
            switch (state) {
                case "pre-ended":
                case "started":
                case "continued":
                    newState = "continued";
            }
        }
        state = newState;
        if (state === "pre-ended") {
            return;
        }
        const collides = state === "started" || state === "continued";
        eventListeners.forEach((handler) =>
            handler({ collides, state, event })
        );
    };

    const onEvent = (event: BABYLON.IPhysicsCollisionEvent) => {
        switch (event.type) {
            case BABYLON.PhysicsEventType.COLLISION_STARTED:
                return _onEvent("started", event);
            case BABYLON.PhysicsEventType.COLLISION_CONTINUED:
                return _onEvent("continued", event);
            case BABYLON.PhysicsEventType.COLLISION_FINISHED:
                return _onEvent("ended", event);
        }
    };

    const onPreEnd = () => _onEvent("pre-ended");

    if (body) {
        body.setCollisionCallbackEnabled(true);
        const observable = body.getCollisionObservable();
        observable.add(onEvent);
    }

    return {
        addEventListerner,
        removeEventListener,
        onEvent,
        onPreEnd,
    } as const;
};

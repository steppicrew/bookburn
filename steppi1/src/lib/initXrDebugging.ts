// Corresponds with logger() in vite.config.ts

export const initXrDebugging = () => {
    if (!import.meta.hot) {
        return;
    }

    const sendLog = (type: string, ...message: any[]) => {
        import.meta.hot?.send(
            JSON.stringify({
                event: "log-message",
                data: { type, message },
            })
        );
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console methods
    console.log = (...args) => {
        sendLog("log", ...args);
        originalLog(...args);
    };

    console.warn = (...args) => {
        sendLog("warn", ...args);
        originalWarn(...args);
    };

    console.error = (...args) => {
        sendLog("error", ...args);
        originalError(...args);
    };

    window.addEventListener("error", (e: ErrorEvent) => {
        const errorDetails = {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error?.stack || "No stack trace available",
        };
        sendLog(
            "error",
            `Uncaught error: ${e.message}`,
            JSON.stringify(errorDetails)
        );
        originalError(e);
    });

    window.addEventListener(
        "unhandledrejection",
        (e: PromiseRejectionEvent) => {
            sendLog(
                "error",
                `Unhandled promise rejection: ${e.reason}`,
                JSON.stringify(e)
            );
            originalError(e);
        }
    );
};

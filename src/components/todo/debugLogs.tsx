"use client";

interface DebugLogsProps {
    logs: string[];
    onCopy: () => void;
}

export default function DebugLogs({ logs, onCopy }: DebugLogsProps) {
    if (process.env.NODE_ENV !== "development") return null;

    return (
        <div className="mt-4 max-h-64 overflow-auto rounded bg-gray-100">
            <div className="sticky left-0 top-0 z-10 flex items-center justify-between border-b bg-gray-100">
                <h3 className="text-md p-2 font-semibold">Debug Logs</h3>
                <button
                    onClick={onCopy}
                    className="m-2 rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                >
                    Copy Logs
                </button>
            </div>
            <pre className="whitespace-pre-wrap break-words p-4 text-sm">
                {logs.length === 0 ? "No logs yet." : logs.join("\n")}
            </pre>
        </div>
    );
}

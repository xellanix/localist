"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initPeer, connectToPeer, streamList, PeerConnection } from "&/peer";
import { useStore, subscribeToStore } from "&/store";
import { TodoList, areTasksEqual } from "~/types";
import TaskForm from "~/components/todo/taskForm";
import SharePopup from "~/components/todo/sharePopup";

const TaskList = dynamic(() => import("~/components/todo/taskList"), {
    ssr: false,
});

export default function Home() {
    const { list, setList } = useStore();
    const [peerConnection, setPeerConnection] = useState<PeerConnection | null>(
        null,
    );
    const [peerId, setPeerId] = useState<string>("");
    const [lastSentList, setLastSentList] = useState<TodoList>(list);
    const [logs, setLogs] = useState<string[]>([]);
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
    const [isPeersPanelOpen, setIsPeersPanelOpen] = useState(true);

    // Capture logs in development
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            console.log = (...args) => {
                const logMessage = args.map((arg) => String(arg)).join(" ");
                setLogs((prev) => [...prev, logMessage].slice(-50));
                originalConsoleLog(...args);
            };
            console.error = (...args) => {
                const logMessage = `[ERROR] ${args.map((arg) => String(arg)).join(" ")}`;
                setLogs((prev) => [...prev, logMessage].slice(-50));
                originalConsoleError(...args);
            };
            return () => {
                console.log = originalConsoleLog;
                console.error = originalConsoleError;
            };
        }
    }, []);

    useEffect(() => {
        const pc = initPeer((data) => {
            console.log("Received peer data, version:", data.version);
            setList(data);
        });
        setPeerConnection(pc);
        pc.peer.on("open", (id: string) => {
            setPeerId(id);
            console.log("Peer opened with ID:", id);
        });

        const unsubscribe = subscribeToStore((updatedList) => {
            if (
                !areTasksEqual(lastSentList.tasks, updatedList.tasks) ||
                lastSentList.version !== updatedList.version
            ) {
                console.log(
                    "Tasks or version changed, streaming version:",
                    updatedList.version,
                );
                streamList(pc, updatedList);
                setLastSentList({ ...updatedList });
            } else {
                console.log(
                    "No meaningful change, skipping stream, version:",
                    updatedList.version,
                );
            }
        });

        return () => {
            pc.peer.destroy();
            unsubscribe();
        };
    }, [setList]);

    const copyLogs = () => {
        navigator.clipboard.writeText(logs.join("\n"));
        alert("Logs copied to clipboard!");
    };

    const disconnectPeer = (peerIdToDisconnect: string) => {
        const connData = peerConnection?.connections.get(peerIdToDisconnect);
        if (connData) {
            connData.conn.close();
            peerConnection?.connections.delete(peerIdToDisconnect);
            console.log(`Disconnected from peer: ${peerIdToDisconnect}`);
        }
    };

    const connectedPeers: string[] = peerConnection
        ? Array.from(peerConnection.connections.keys())
        : [];

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">
                Collaborative To-Do List
            </h1>
            <TaskForm />
            <TaskList />

            {/* Share Button */}
            {peerId && peerConnection && (
                <button
                    onClick={() => setIsSharePopupOpen(true)}
                    className="mt-4 rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                >
                    Share Your List
                </button>
            )}
            {isSharePopupOpen && peerConnection && (
                <SharePopup
                    peerId={peerId}
                    onShare={(id) =>
                        connectToPeer(peerConnection, id, list, setList)
                    }
                    onClose={() => setIsSharePopupOpen(false)}
                />
            )}

            {/* Connected Peers Collapsible Panel */}
            {peerConnection && (
                <div className="mt-4 rounded bg-gray-100 p-4">
                    <button
                        onClick={() => setIsPeersPanelOpen(!isPeersPanelOpen)}
                        className="text-md flex w-full items-center justify-between text-left font-semibold"
                    >
                        Connected Peers
                        <span>{isPeersPanelOpen ? "▼" : "▶"}</span>
                    </button>
                    {isPeersPanelOpen && (
                        <div className="mt-2">
                            {connectedPeers.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No peers connected yet.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {connectedPeers.map((id) => {
                                        const connData =
                                            peerConnection.connections.get(id);
                                        const isSource =
                                            connData?.isSource ?? false; // Use explicit isSource flag
                                        return (
                                            <li
                                                key={id}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <span>
                                                    {id} (
                                                    {isSource
                                                        ? "Source"
                                                        : "Target"}
                                                    ){" "}
                                                    {connData?.conn.open
                                                        ? "(Active)"
                                                        : "(Inactive)"}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        disconnectPeer(id)
                                                    }
                                                    className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                                                >
                                                    Disconnect
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Debug Logs Panel */}
            {process.env.NODE_ENV === "development" && (
                <div className="mt-4 max-h-64 overflow-auto rounded bg-gray-100">
                    <div className="sticky left-0 top-0 z-10 flex items-center justify-between border-b bg-gray-100">
                        <h3 className="text-md p-2 font-semibold">
                            Debug Logs
                        </h3>
                        <button
                            onClick={copyLogs}
                            className="m-2 rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                        >
                            Copy Logs
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words p-4 text-sm">
                        {logs.length === 0 ? "No logs yet." : logs.join("\n")}
                    </pre>
                </div>
            )}
        </div>
    );
}

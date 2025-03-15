"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initPeer, connectToPeer, streamList, PeerConnection } from "&/peer";
import { useStore, subscribeToStore, getStore } from "&/store";
import { TodoList, TaskUpdate, areTasksEqual } from "~/types";
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
    const [isSyncing, setIsSyncing] = useState(false);

    const mergeLists = (
        localList: TodoList,
        remoteList: TodoList,
    ): TodoList | null => {
        if (remoteList.version < localList.version) {
            console.log(
                "Remote list is outdated, rejecting:",
                remoteList.version,
                "<",
                localList.version,
            );
            return null;
        }
        if (remoteList.version > localList.version) {
            console.log(
                "Remote list is newer, adopting remote:",
                remoteList.version,
            );
            return remoteList;
        }
        if (areTasksEqual(localList.tasks, remoteList.tasks)) {
            console.log("Lists are equal, keeping local:", localList.version);
            return null;
        }
        console.log(
            "Versions equal but tasks differ, adopting remote:",
            remoteList.version,
        );
        return remoteList;
    };

    const handleData = (data: TodoList | TaskUpdate) => {
        if (isSyncing) {
            console.log("Sync in progress, ignoring data:", data);
            return;
        }
        setIsSyncing(true);
        try {
            const currentList = getStore().list;
            console.log(
                "Current tasks before update:",
                currentList.tasks.map((t) => t.title),
            );
            if ("type" in data && data.type === "taskUpdate") {
                const { taskId, updates } = data as TaskUpdate;
                const updatedTasks = currentList.tasks.map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task,
                );
                const newList = {
                    ...currentList,
                    tasks: updatedTasks,
                    version: currentList.version,
                };
                console.log(
                    "Applying task update, new tasks:",
                    newList.tasks.map((t) => t.title),
                );
                setList(newList, true); // Remote update
                console.log(
                    "Task update applied, version unchanged:",
                    newList.version,
                );
            } else {
                const remoteList = data as TodoList;
                console.log("Received full list, version:", remoteList.version);
                const mergedList = mergeLists(currentList, remoteList);
                if (mergedList) {
                    console.log(
                        "Adopting tasks:",
                        mergedList.tasks.map((t) => t.title),
                    );
                    setList(mergedList, true); // Remote update
                    console.log(
                        "Remote update applied, version:",
                        mergedList.version,
                    );
                } else {
                    console.log(
                        "Remote update ignored: incoming version",
                        remoteList.version,
                        "<= current",
                        currentList.version,
                        "or tasks unchanged",
                    );
                }
            }
        } finally {
            setTimeout(() => setIsSyncing(false), 100);
        }
    };

    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            console.log = (...args) => {
                const timestamp = new Date().toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 3,
                }); // e.g., 14:35:12.345
                const logMessage = `[${timestamp}] ${args.map((arg) => String(arg)).join(" ")}`;
                setLogs((prev) => [...prev, logMessage].slice(-50));
                originalConsoleLog(...args);
            };
            console.error = (...args) => {
                const timestamp = new Date().toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 3,
                });
                const logMessage = `[${timestamp}] [ERROR] ${args.map((arg) => String(arg)).join(" ")}`;
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
        const pc = initPeer(handleData, () => getStore().list);
        setPeerConnection(pc);
        pc.peer.on("open", (id: string) => {
            setPeerId(id);
            console.log("Peer opened with ID:", id);
        });

        const unsubscribe = subscribeToStore((updatedList, isRemoteUpdate) => {
            console.log(
                "Subscribe triggered, version:",
                updatedList.version,
                "isRemoteUpdate:",
                isRemoteUpdate,
                "tasks:",
                updatedList.tasks.map((t) => t.title),
            );
            if (
                !areTasksEqual(lastSentList.tasks, updatedList.tasks) ||
                lastSentList.version !== updatedList.version
            ) {
                if (
                    !isRemoteUpdate &&
                    updatedList.version > lastSentList.version
                ) {
                    console.log(
                        "Local change detected, streaming full list, version:",
                        updatedList.version,
                    );
                    streamList(pc, updatedList);
                    setLastSentList({ ...updatedList });
                } else {
                    console.log(
                        "Remote update or no local change, skipping stream, version:",
                        updatedList.version,
                    );
                }
            }
        });

        return () => {
            console.log("Cleaning up peer connection, current ID:", pc.peer.id);
            pc.peer.destroy();
            unsubscribe();
            console.log("Peer destroyed");
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
            console.log(
                `Manually disconnected from peer: ${peerIdToDisconnect}`,
            );
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
            <TaskList peerConnection={peerConnection} />

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
                        connectToPeer(peerConnection, id, list, handleData)
                    }
                    onClose={() => setIsSharePopupOpen(false)}
                />
            )}

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
                                            connData?.isSource ?? false;
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

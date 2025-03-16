"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initPeer, connectToPeer, streamList, PeerConnection } from "&/peer";
import { useStore, subscribeToStore, getStore } from "&/store";
import { TodoList, TaskUpdate, areTasksEqual } from "~/types";
import TaskForm from "~/components/todo/taskForm";
import SharePopup from "~/components/todo/sharePopup";
import CreateAccountPopup from "~/components/todo/createAccountPopup";
import PeersPanel from "~/components/todo/peersPanel";
import DebugLogs from "~/components/todo/debugLogs";

const TaskList = dynamic(() => import("~/components/todo/taskList"), {
    ssr: false,
});

export default function Home() {
    const { list, setList, user } = useStore();
    const [peerConnection, setPeerConnection] = useState<PeerConnection | null>(
        null,
    );
    const [randomPeerId, setRandomPeerId] = useState<string>("");
    const [permanentPeerId, setPermanentPeerId] = useState<string>("");
    const [lastSentList, setLastSentList] = useState<TodoList>(list);
    const [logs, setLogs] = useState<string[]>([]);
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
    const [isCreateAccountPopupOpen, setIsCreateAccountPopupOpen] =
        useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const mergeLists = (
        localList: TodoList,
        remoteList: TodoList,
    ): TodoList | null => {
        if (remoteList.version < localList.version) return null;
        if (remoteList.version > localList.version) return remoteList;
        if (areTasksEqual(localList.tasks, remoteList.tasks)) return null;
        return remoteList;
    };

    const handleData = (data: TodoList | TaskUpdate) => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const currentList = getStore().list;
            if ("type" in data && data.type === "taskUpdate") {
                const { taskId, updates } = data as TaskUpdate;
                const updatedTasks = currentList.tasks.map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task,
                );
                setList(
                    {
                        ...currentList,
                        tasks: updatedTasks,
                        version: currentList.version,
                    },
                    true,
                );
            } else {
                const remoteList = data as TodoList;
                const mergedList = mergeLists(currentList, remoteList);
                if (mergedList) setList(mergedList, true);
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
                });
                setLogs((prev) =>
                    [...prev, `[${timestamp}] ${args.join(" ")}`].slice(-50),
                );
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
                setLogs((prev) =>
                    [...prev, `[${timestamp}] [ERROR] ${args.join(" ")}`].slice(
                        -50,
                    ),
                );
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
        pc.randomPeer.on("open", (id: string) => {
            setRandomPeerId(id);
            console.log("Random Peer opened with ID:", id);
        });
        if (pc.permanentPeer) {
            pc.permanentPeer.on("open", (id: string) => {
                setPermanentPeerId(id);
                console.log("Permanent Peer opened with ID:", id);
            });
        }

        const unsubscribe = subscribeToStore((updatedList, isRemoteUpdate) => {
            if (
                !areTasksEqual(lastSentList.tasks, updatedList.tasks) ||
                lastSentList.version !== updatedList.version
            ) {
                if (
                    !isRemoteUpdate &&
                    updatedList.version > lastSentList.version
                ) {
                    streamList(pc, updatedList);
                    setLastSentList({ ...updatedList });
                }
            }
        });

        return () => {
            pc.randomPeer.destroy();
            pc.permanentPeer?.destroy();
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
            console.log(
                `Manually disconnected from peer: ${peerIdToDisconnect}`,
            );
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">
                Collaborative To-Do List
            </h1>
            {!user && (
                <button
                    onClick={() => setIsCreateAccountPopupOpen(true)}
                    className="mb-4 rounded bg-green-500 p-2 text-white hover:bg-green-600"
                >
                    Create Account
                </button>
            )}
            {isCreateAccountPopupOpen && (
                <CreateAccountPopup
                    onClose={() => setIsCreateAccountPopupOpen(false)}
                />
            )}
            <TaskForm />
            <TaskList peerConnection={peerConnection} />

            {randomPeerId && peerConnection && (
                <button
                    onClick={() => setIsSharePopupOpen(true)}
                    className="mt-4 rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                >
                    Share Your List
                </button>
            )}
            {isSharePopupOpen && peerConnection && (
                <SharePopup
                    peerId={randomPeerId} // Pass random ID as default
                    onShare={(id) =>
                        connectToPeer(peerConnection!, id, list, handleData)
                    }
                    onClose={() => setIsSharePopupOpen(false)}
                />
            )}

            {peerConnection && (
                <PeersPanel
                    peerConnection={peerConnection}
                    onDisconnect={disconnectPeer}
                />
            )}
            <DebugLogs logs={logs} onCopy={copyLogs} />
        </div>
    );
}

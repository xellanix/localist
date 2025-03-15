"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initPeer, connectToPeer, streamList } from "&/peer";
import { useStore, subscribeToStore } from "&/store";
import { TodoList, areTasksEqual } from "~/types";
import TaskForm from "@/todo/taskForm";
import ShareButton from "@/todo/shareButton";

const TaskList = dynamic(() => import("@/todo/taskList"), { ssr: false });

export default function Home() {
    const { list, setList } = useStore();
    const [peerConnection, setPeerConnection] = useState<any>(null);
    const [peerId, setPeerId] = useState<string>("");
    const [lastSentList, setLastSentList] = useState<TodoList>(list);

    useEffect(() => {
        const pc = initPeer((data) => {
            console.log("Received peer data, version:", data.version);
            setList(data); // Remote update
        });
        setPeerConnection(pc);
        pc.peer.on("open", (id: string) => {
            setPeerId(id);
            console.log("Peer opened with ID:", id);
        });

        const unsubscribe = subscribeToStore((updatedList) => {
            // Only stream if tasks or version have meaningfully changed
            if (
                !areTasksEqual(lastSentList.tasks, updatedList.tasks) ||
                lastSentList.version !== updatedList.version
            ) {
                console.log(
                    "Tasks or version changed, streaming version:",
                    updatedList.version,
                );
                streamList(pc, updatedList);
                setLastSentList({ ...updatedList }); // Deep copy to avoid reference issues
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
    }, [setList]); // Remove lastSentList from deps to avoid re-subscription

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">
                Collaborative To-Do List
            </h1>
            <TaskForm />
            <TaskList />
            {peerId && peerConnection && (
                <ShareButton
                    peerId={peerId}
                    onShare={(id) =>
                        connectToPeer(peerConnection, id, list, setList)
                    }
                />
            )}
        </div>
    );
}

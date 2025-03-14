"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initPeer, connectToPeer, streamList } from "&/peer";
import { useStore, subscribeToStore } from "&/store";
import TaskForm from "@/todo/taskForm";
import ShareButton from "@/todo/shareButton";

const TaskList = dynamic(() => import("@/todo/taskList"), {
    ssr: false,
});

export default function Home() {
    const { list, setList } = useStore();
    const [peerConnection, setPeerConnection] = useState<any>(null);
    const [peerId, setPeerId] = useState<string>("");

    useEffect(() => {
        const pc = initPeer((data) => setList(data));
        setPeerConnection(pc);
        pc.peer.on("open", (id: string) => setPeerId(id));

        // Subscribe to store changes and stream updates
        const unsubscribe = subscribeToStore((updatedList) => {
            streamList(pc, updatedList);
        });

        return () => {
            pc.peer.destroy();
            unsubscribe();
        };
    }, [setList]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">
                Collaborative To-Do List
            </h1>
            <TaskForm />
            <TaskList tasks={list.tasks} />
            {peerId && peerConnection && (
                <ShareButton
                    peerId={peerId}
                    onShare={(id) => connectToPeer(peerConnection, id, list)}
                />
            )}
        </div>
    );
}

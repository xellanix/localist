"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic"; // Import dynamic
import { initPeer, shareList } from "&/peer";
import { useStore } from "&/store";
import TaskForm from "@/todo/taskForm";
import ShareButton from "@/todo/shareButton";

// Dynamically import TaskList with SSR disabled
const TaskList = dynamic(() => import("@/todo/taskList"), {
    ssr: false,
});

export default function Home() {
    const { list, setList } = useStore();
    const [peer, setPeer] = useState<any>(null);
    const [peerId, setPeerId] = useState<string>("");

    useEffect(() => {
        const p = initPeer((data) => setList(data));
        setPeer(p);
        p.on("open", (id: string) => setPeerId(id));
        return () => p.destroy();
    }, [setList]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="mb-4 text-2xl font-bold">
                Collaborative To-Do List
            </h1>
            <TaskForm />
            <TaskList tasks={list.tasks} />
            {peerId && (
                <ShareButton
                    peerId={peerId}
                    onShare={(id) => shareList(peer, id, list)}
                />
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { useStore } from "&/store";
import { Task } from "~/types";

export default function TaskForm() {
    const { addTask } = useStore();
    const [title, setTitle] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            description: "",
            priority: "medium",
            completed: false,
        };
        addTask(newTask);
        setTitle("");
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mr-2 border p-2"
                placeholder="Add a task"
            />
            <button type="submit" className="bg-blue-500 p-2 text-white">
                Add
            </button>
        </form>
    );
}

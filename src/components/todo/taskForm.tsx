"use client";

import { useState } from "react";
import { useStore } from "&/store";
import { v4 as uuidv4 } from "uuid"; // Should now resolve

export default function TaskForm() {
    const [title, setTitle] = useState("");
    const { addTask } = useStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            addTask({ id: uuidv4(), title: title.trim(), completed: false });
            setTitle("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a new task"
                className="flex-1 rounded border p-2"
            />
            <button
                type="submit"
                className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
            >
                Add
            </button>
        </form>
    );
}

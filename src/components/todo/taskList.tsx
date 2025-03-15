"use client";

import { useState } from "react";
import { useStore } from "&/store";
import { streamList } from "&/peer";

export default function TaskList({ peerConnection }: { peerConnection?: any }) {
    const { list, toggleComplete, deleteTask } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState<string>("");

    const handleToggle = (id: string) => {
        toggleComplete(id);
        if (peerConnection) {
            const newList = useStore.getState().list;
            console.log(
                "Toggling task, streaming list, version:",
                newList.version,
            );
            streamList(peerConnection, newList);
        }
    };

    const handleEditStart = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const handleEditSave = (id: string) => {
        if (
            editTitle.trim() &&
            editTitle !== list.tasks.find((t) => t.id === id)?.title
        ) {
            const updatedTasks = list.tasks.map((task) =>
                task.id === id ? { ...task, title: editTitle.trim() } : task,
            );
            const newList = {
                ...list,
                tasks: updatedTasks,
                version: list.version + 1,
            };
            useStore.getState().setList(newList, false);
            if (peerConnection) {
                console.log(
                    "Streaming updated list after edit, version:",
                    newList.version,
                );
                streamList(peerConnection, newList);
            }
        }
        setEditingId(null);
        setEditTitle("");
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle("");
    };

    return (
        <ul className="mt-4 space-y-2">
            {list.tasks.map((task) => (
                <li
                    key={task.id}
                    className="flex items-center justify-between rounded bg-gray-100 p-2"
                >
                    <div className="flex flex-1 items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggle(task.id)}
                            className="h-4 w-4"
                        />
                        {editingId === task.id ? (
                            <div className="flex flex-1 items-center space-x-2">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleEditSave(task.id)
                                    }
                                    className="flex-1 rounded border p-1"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleEditSave(task.id)}
                                    className="rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleEditCancel}
                                    className="rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <span
                                className={
                                    task.completed
                                        ? "flex-1 text-gray-500 line-through"
                                        : "flex-1"
                                }
                            >
                                {task.title}
                            </span>
                        )}
                    </div>
                    {editingId !== task.id && ( // Hide buttons during edit mode
                        <div className="flex space-x-2">
                            <button
                                onClick={() =>
                                    handleEditStart(task.id, task.title)
                                }
                                className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

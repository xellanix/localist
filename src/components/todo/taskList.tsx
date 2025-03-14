"use client";

import { useStore } from "&/store";
import { Task } from "types";

interface TaskListProps {
    tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
    const { setList } = useStore();

    const toggleComplete = (id: string) => {
        const updatedTasks = tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task,
        );
        setList({ tasks: updatedTasks, lastUpdated: Date.now() });
    };

    const deleteTask = (id: string) => {
        const updatedTasks = tasks.filter((task) => task.id !== id);
        setList({ tasks: updatedTasks, lastUpdated: Date.now() });
    };

    return (
        <ul className="space-y-2">
            {tasks.length === 0 ? (
                <li className="text-gray-500">No tasks yet.</li>
            ) : (
                tasks.map((task) => (
                    <li
                        key={task.id}
                        className="flex items-center justify-between rounded border p-2"
                    >
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleComplete(task.id)}
                                className="mr-2"
                            />
                            <span
                                className={`${
                                    task.completed
                                        ? "text-gray-500 line-through"
                                        : ""
                                }`}
                            >
                                {task.title}{" "}
                                {task.dueDate && (
                                    <span className="text-sm text-gray-400">
                                        (Due: {task.dueDate})
                                    </span>
                                )}
                            </span>
                        </div>
                        <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            Delete
                        </button>
                    </li>
                ))
            )}
        </ul>
    );
}

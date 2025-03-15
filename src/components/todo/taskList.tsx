"use client";

import { useStore } from "&/store";

export default function TaskList() {
    const { list, toggleComplete, deleteTask } = useStore();

    return (
        <ul className="space-y-2">
            {list.tasks.length === 0 ? (
                <li className="text-gray-500">No tasks yet.</li>
            ) : (
                list.tasks.map((task) => (
                    <li
                        key={task.id} // Ensure stable keys
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

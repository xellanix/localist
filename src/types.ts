export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
    completed: boolean;
}

export interface TodoList {
    tasks: Task[];
    version: number; // Add version field
}

// Helper to compare task arrays
export const areTasksEqual = (tasksA: Task[], tasksB: Task[]): boolean => {
    if (tasksA.length !== tasksB.length) return false;
    return tasksA.every((taskA, i) => {
        const taskB = tasksB[i];
        if (!taskB) return false; // Explicitly handle undefined case
        return (
            taskA.id === taskB.id &&
            taskA.title === taskB.title &&
            taskA.dueDate === taskB.dueDate &&
            taskA.priority === taskB.priority &&
            taskA.completed === taskB.completed
        );
    });
};

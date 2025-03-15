export interface Task {
    id: string;
    title: string;
    completed: boolean;
}

export interface TodoList {
    version: number;
    tasks: Task[];
}

// New type for incremental task updates
export interface TaskUpdate {
    type: "taskUpdate";
    taskId: string;
    updates: Partial<Task>; // Allows updating specific fields (e.g., title, completed)
}

export const areTasksEqual = (tasksA: Task[], tasksB: Task[]): boolean => {
    if (tasksA.length !== tasksB.length) return false;
    return tasksA.every((taskA, i) => {
        const taskB = tasksB[i];
        if (!taskB) return false; // Explicitly handle undefined case
        return (
            taskA.id === taskB.id &&
            taskA.title === taskB.title &&
            taskA.completed === taskB.completed
        );
    });
};

export interface Task {
    id: string;
    title: string;
    completed: boolean;
}

export interface TodoList {
    version: number;
    tasks: Task[];
}

export interface TaskUpdate {
    type: "taskUpdate";
    taskId: string;
    updates: Partial<Task>;
}

export const areTasksEqual = (
    tasksA: Task[] | undefined,
    tasksB: Task[] | undefined,
): boolean => {
    if (!tasksA || !tasksB) return tasksA === tasksB; // Both undefined/null or one is
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

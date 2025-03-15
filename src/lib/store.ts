import { create } from "zustand";
import { TodoList, Task, areTasksEqual } from "~/types";
import { loadList, saveList } from "&/storage";

interface TodoState {
    list: TodoList;
    setList: (list: TodoList, isLocalUpdate?: boolean) => void;
    addTask: (task: Task) => void;
    toggleComplete: (id: string) => void;
    deleteTask: (id: string) => void;
}

export const useStore = create<TodoState>((set) => ({
    list: loadList(),
    setList: (newList, isLocalUpdate = false) =>
        set((state) => {
            const currentVersion = state.list.version ?? 0;
            const incomingVersion = newList.version ?? 0;
            const currentTasks = state.list.tasks;
            const newTasks = newList.tasks || [];

            if (isLocalUpdate) {
                const updatedList = {
                    tasks: newTasks,
                    version: currentVersion + 1,
                };
                saveList(updatedList);
                console.log("Local update, new version:", updatedList.version);
                return { list: updatedList };
            } else {
                if (incomingVersion > currentVersion) {
                    if (!areTasksEqual(currentTasks, newTasks)) {
                        saveList(newList);
                        console.log(
                            "Remote update applied, version:",
                            incomingVersion,
                        );
                        return {
                            list: { tasks: newTasks, version: incomingVersion },
                        };
                    } else {
                        console.log(
                            "Remote update ignored: tasks unchanged, version:",
                            incomingVersion,
                        );
                        return state;
                    }
                } else if (
                    incomingVersion === currentVersion &&
                    !areTasksEqual(currentTasks, newTasks)
                ) {
                    // Merge if tasks differ at same version
                    const mergedTasks = [
                        ...currentTasks,
                        ...newTasks.filter((newTask) =>
                            currentTasks.every(
                                (task) => task.id !== newTask.id,
                            ),
                        ),
                    ];
                    const mergedList = {
                        tasks: mergedTasks,
                        version: currentVersion + 1,
                    };
                    saveList(mergedList);
                    console.log(
                        "Merged conflicting lists, new version:",
                        mergedList.version,
                    );
                    return { list: mergedList };
                } else {
                    console.log(
                        `Remote update ignored: incoming version ${incomingVersion} <= current ${currentVersion}, tasks unchanged`,
                    );
                    return state;
                }
            }
        }),
    addTask: (task) =>
        set((state) => {
            const newTasks = [...state.list.tasks, task];
            const newList = {
                tasks: newTasks,
                version: (state.list.version ?? 0) + 1,
            };
            saveList(newList);
            console.log("Task added, new version:", newList.version);
            return { list: newList };
        }),
    toggleComplete: (id) =>
        set((state) => {
            const newTasks = state.list.tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task,
            );
            const newList = {
                tasks: newTasks,
                version: (state.list.version ?? 0) + 1,
            };
            saveList(newList);
            console.log("Task toggled, new version:", newList.version);
            return { list: newList };
        }),
    deleteTask: (id) =>
        set((state) => {
            const newTasks = state.list.tasks.filter((task) => task.id !== id);
            const newList = {
                tasks: newTasks,
                version: (state.list.version ?? 0) + 1,
            };
            saveList(newList);
            console.log("Task deleted, new version:", newList.version);
            return { list: newList };
        }),
}));

export const subscribeToStore = (callback: (list: TodoList) => void) => {
    return useStore.subscribe((state) => callback(state.list));
};

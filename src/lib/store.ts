import { create } from "zustand";
import { Task, TodoList } from "types";
import { loadList, saveList } from "&/storage";

interface TodoState {
    list: TodoList;
    setList: (list: TodoList) => void;
    addTask: (task: Task) => void;
}

export const useStore = create<TodoState>((set) => ({
    list: loadList(),
    setList: (list) => {
        saveList(list);
        set({ list });
    },
    addTask: (task) =>
        set((state) => {
            const newList = {
                ...state.list,
                tasks: [...state.list.tasks, task],
                lastUpdated: Date.now(),
            };
            saveList(newList);
            return { list: newList };
        }),
}));

// Export a function to subscribe to store changes
export const subscribeToStore = (callback: (list: TodoList) => void) => {
    return useStore.subscribe((state) => callback(state.list));
};

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Task, TodoList } from "~/types";

interface User {
    name: string;
    email: string;
    password: string; // Auto-generated
}

interface TodoState {
    list: TodoList;
    user: User | null;
    setList: (list: TodoList, isRemoteUpdate?: boolean) => void;
    setUser: (user: User) => void;
    addTask: (task: Task) => void;
    toggleComplete: (id: string) => void;
    deleteTask: (id: string) => void;
}

const initialList: TodoList = { version: 0, tasks: [] };

const useStore = create<TodoState>()(
    persist(
        (set) => ({
            list: initialList,
            user: null,
            setList: (list, isRemoteUpdate = false) => {
                console.log(
                    "setList called, version:",
                    list.version,
                    "isRemoteUpdate:",
                    isRemoteUpdate,
                );
                set({ list }, false);
            },
            setUser: (user) => set({ user }),
            addTask: (task) =>
                set((state) => ({
                    list: {
                        ...state.list,
                        tasks: [...state.list.tasks, task],
                        version: state.list.version + 1,
                    },
                })),
            toggleComplete: (id) =>
                set((state) => ({
                    list: {
                        ...state.list,
                        tasks: state.list.tasks.map((task) =>
                            task.id === id
                                ? { ...task, completed: !task.completed }
                                : task,
                        ),
                        version: state.list.version + 1,
                    },
                })),
            deleteTask: (id) =>
                set((state) => ({
                    list: {
                        ...state.list,
                        tasks: state.list.tasks.filter(
                            (task) => task.id !== id,
                        ),
                        version: state.list.version + 1,
                    },
                })),
        }),
        {
            name: "todo-list",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

const getStore = () => useStore.getState();

const subscribers = new Set<
    (list: TodoList, isRemoteUpdate: boolean) => void
>();
const subscribeToStore = (
    callback: (list: TodoList, isRemoteUpdate: boolean) => void,
) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
};

let lastUpdateWasRemote = false;
useStore.subscribe((state, prevState) => {
    const isRemoteUpdate =
        lastUpdateWasRemote || state.list.version <= prevState.list.version;
    lastUpdateWasRemote = false;
    subscribers.forEach((callback) => callback(state.list, isRemoteUpdate));
});

const originalSetList = useStore.getState().setList;
useStore.setState({
    setList: (list: TodoList, isRemoteUpdate = false) => {
        lastUpdateWasRemote = isRemoteUpdate;
        originalSetList(list, isRemoteUpdate);
    },
});

export { useStore, subscribeToStore, getStore };

import { TodoList } from "~/types";

export const loadList = (): TodoList => {
    if (typeof window === "undefined") return { tasks: [], version: 0 }; // SSR safety
    const data = localStorage.getItem("todoList");
    const parsed = data ? JSON.parse(data) : { tasks: [], version: 0 };
    // Ensure version is always a number
    return { tasks: parsed.tasks || [], version: parsed.version ?? 0 };
};

export const saveList = (list: TodoList) => {
    if (typeof window === "undefined") return; // SSR safety
    localStorage.setItem("todoList", JSON.stringify(list));
};

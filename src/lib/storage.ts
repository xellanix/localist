import { TodoList } from "types";

export const loadList = (): TodoList => {
    if (typeof window === "undefined")
        return { tasks: [], lastUpdated: Date.now() };

    console.log("Load list");

    const data = localStorage.getItem("todoList");
    return data ? JSON.parse(data) : { tasks: [], lastUpdated: Date.now() };
};

export const saveList = (list: TodoList) => {
    if (typeof window === "undefined") return;

    console.log("Save list");

    localStorage.setItem("todoList", JSON.stringify(list));
};

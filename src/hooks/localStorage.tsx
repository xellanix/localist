"use client";

import { useEffect, useState } from "react";

const useLocalStorage = (key: string, initialValue: string | null): [string | null, Function] => {
    const [state, setState] = useState<string | null>(initialValue);

    const setValue = (value: string | Function) => {
        try {
            const valueToStore =
                value instanceof Function ? value(state) : value;
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            setState(valueToStore);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        try {
            const value = window.localStorage.getItem(key);
            setState(value ? JSON.parse(value) : initialValue);
        } catch (error) {
            console.log(error);
            setState(null);
        }
    }, []);

    return [state, setValue];
};

export default useLocalStorage;

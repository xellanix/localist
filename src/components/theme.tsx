"use client";

import { memo, useEffect } from "react";
import useLocalStorage from "~/hooks/localStorage";

const ThemeLoader = memo(function ThemeLoader() {
    const [theme, setTheme] = useLocalStorage("theme", "dark");

    useEffect(() => {
        const isDark =
            theme === "dark" ||
            (theme === null &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        document.documentElement.dataset.mode = isDark ? "dark" : "light";
    }, [theme]);

    return <></>;
});

export default ThemeLoader;

import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
    content: ["./src/**/*.tsx"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Figtree", "sans-serif", ...fontFamily.sans],
            },
            spacing: {
                "8xl": "90rem",
            },
            margin: {
                "8xl/2": "max(calc((100dvw - 90rem) / 2), 0px)",
            },
            colors: {
                xellanix: {
                    "50": "#f1f7fe",
                    "100": "#e2effc",
                    "200": "#bfdef8",
                    "300": "#86c3f3",
                    "400": "#46a4ea",
                    "500": "#1d88da",
                    "600": "#0f65af",
                    "700": "#0e5596",
                    "800": "#10497c",
                    "900": "#133e67",
                    "950": "#0d2744",
                },
            },
        },
    },
    darkMode: ["selector", '[data-mode="dark"]'],
    plugins: [],
} satisfies Config;

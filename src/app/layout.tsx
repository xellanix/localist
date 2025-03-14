import "~/styles/globals.css";

import { type Metadata } from "next";
import { cn } from "&/utils";
import { NavGroup, NavItem } from "@/navigation";
import ThemeLoader from "@/theme";

export const metadata: Metadata = {
    title: "LocaList",
    description:
        "Manage your to-do list locally in the browser across your devices.",
    icons: [{ rel: "icon", url: "/icon-sq.svg" }],
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={cn("antialiased")}>
            <body className="flex bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <ThemeLoader />
                <div
                    id="root"
                    className="flex flex-col min-w-full bg-inherit text-inherit h-dvh overflow-hidden"
                >
                    <div className="flex h-full flex-col bg-inherit text-inherit">
                        <header
                            className={cn(
                                "flex flex-none flex-row",
                                "z-50 w-full",
                                "lg:border-b",
                                "lg:border-gray-600/10 lg:dark:border-gray-100/10",
                                "transition-colors duration-300 ease-out",
                                "bg-inherit",
                            )}
                        >
                            <div className="max-w-8xl mx-auto w-full">
                                <div
                                    className={cn(
                                        "flex items-center",
                                        "border-gray-900/10",
                                        "border-b lg:border-0",
                                        "py-4",
                                        "px-4 sm:px-6 md:px-8",
                                    )}
                                >
                                    <a
                                        href="/"
                                        className="flex flex-grow-0 select-none items-center gap-2 outline-2 outline-offset-4"
                                    >
                                        <img
                                            src="/icon-sq.svg"
                                            className="h-8 w-8"
                                            alt="Xellanix logo"
                                            title="Xellanix"
                                        />
                                        <span className="text-3xl font-extrabold">
                                            LocaList
                                        </span>
                                    </a>
                                    <div className="flex-grow" />
                                    <a
                                        href="https://github.com/xellanix/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="outline-2 outline-offset-4"
                                    >
                                        <img
                                            src="/github-mark.svg"
                                            className="h-5 w-5"
                                            alt="GitHub logo"
                                            title="GitHub"
                                        />
                                    </a>
                                </div>
                            </div>
                        </header>
                        <main
                            className={cn(
                                "flex flex-row",
                                "h-full overflow-y-hidden",
                                "ml-8xl/2",
                                "bg-inherit",
                            )}
                        >
                            <section
                                className={cn(
                                    "flex flex-col",
                                    "relative",
                                    "h-full w-72",
                                    "mb-4 lg:mb-6",
                                    "pl-4 pr-4 sm:pl-6 md:pl-8",
                                    "overflow-y-auto",
                                    "bg-inherit",
                                )}
                            >
                                <div className="curtain t"></div>
                                {/* <nav>
                                    <ul className="flex flex-col gap-4 font-bold">
                                        <NavGroup name="Buttons">
                                            <NavItem href="/">Button</NavItem>
                                            <NavItem href="/toggle-buttons">
                                                Toggle Button
                                            </NavItem>
                                            <NavItem href="/check-boxs">
                                                Check Box
                                            </NavItem>
                                        </NavGroup>
                                    </ul>
                                </nav> */}
                                <div className="curtain b"></div>
                            </section>
                            <section
                                className={cn(
                                    "flex flex-1 flex-col",
                                    "relative",
                                    "ml-8",
                                    "overflow-y-auto",
                                    "pr-[calc(theme(margin.8xl/2)+theme(padding.4))]",
                                    "sm:pr-[calc(theme(margin.8xl/2)+theme(padding.6))]",
                                    "md:pr-[calc(theme(margin.8xl/2)+theme(padding.8))]",
                                    "bg-inherit",
                                )}
                            >
                                <div className="curtain t"></div>
                                {children}
                                <div className="curtain b"></div>
                            </section>
                        </main>
                    </div>
                </div>
            </body>
        </html>
    );
}

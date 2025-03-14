"use client";

import Link from "next/link";
import { Button } from "@/buttons/button";
import { usePathname } from "next/navigation";

export function NavGroup({
    name,
    children,
}: {
    name: string;
    children: React.ReactNode;
}) {
    return (
        <li className="text-xellanix-600 dark:text-xellanix-300 flex flex-col gap-1">
            {name}
            <ul className="border-l-2 border-gray-400/20 font-normal text-gray-700 dark:text-gray-200">
                {children}
            </ul>
        </li>
    );
}

export function NavItem({
    href,
    children,
}: {
    href: string;
    children?: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <li className={"flex flex-col"}>
            <Link
                href={href}
                className="flex size-full flex-col rounded-md outline-2 outline-offset-4"
            >
                <Button
                    className={{ base: "text-left" }}
                    tabIndex={-1}
                    styleType={pathname === href ? "primary" : "secondary"}
                >
                    {children}
                </Button>
            </Link>
        </li>
    );
}

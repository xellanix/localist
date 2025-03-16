"use client";

import { useState } from "react";
import { useStore } from "&/store";

interface CreateAccountPopupProps {
    onClose: () => void;
}

export default function CreateAccountPopup({
    onClose,
}: CreateAccountPopupProps) {
    const { setUser } = useStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const generatePassword = () => {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
    };

    const handleCreateUser = () => {
        if (name && email) {
            const newPassword = password || generatePassword();
            setUser({ name, email, password: newPassword });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold">Create Account</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full rounded border p-2"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your Email"
                        className="w-full rounded border p-2"
                    />
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={password}
                            readOnly
                            placeholder="Generated Password"
                            className="w-full rounded border bg-gray-100 p-2"
                        />
                        <button
                            onClick={() => setPassword(generatePassword())}
                            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            Generate
                        </button>
                    </div>
                    <button
                        onClick={handleCreateUser}
                        className="w-full rounded bg-green-500 p-2 text-white hover:bg-green-600"
                    >
                        Create Account
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full rounded bg-gray-500 p-2 text-white hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

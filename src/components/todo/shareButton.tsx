"use client";

import { useState } from "react";

interface ShareButtonProps {
    peerId: string; // Your Peer ID
    onShare: (remotePeerId: string) => void; // Function to share list with another peer
}

export default function ShareButton({ peerId, onShare }: ShareButtonProps) {
    const [remotePeerId, setRemotePeerId] = useState("");
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(peerId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    const handleShare = () => {
        if (remotePeerId) {
            onShare(remotePeerId);
            setRemotePeerId(""); // Clear input after sharing
        }
    };

    return (
        <div className="mt-4">
            <h2 className="text-lg font-semibold">Share Your List</h2>
            <div className="flex items-center space-x-2">
                <span className="text-sm">Your Peer ID: {peerId}</span>
                <button
                    onClick={copyToClipboard}
                    className="rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <div className="mt-2">
                <input
                    type="text"
                    value={remotePeerId}
                    onChange={(e) => setRemotePeerId(e.target.value)}
                    placeholder="Enter friend's Peer ID"
                    className="mr-2 border p-2"
                />
                <button
                    onClick={handleShare}
                    className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                >
                    Connect & Share
                </button>
            </div>
        </div>
    );
}

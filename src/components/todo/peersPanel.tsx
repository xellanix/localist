"use client";

import { useState } from "react";
import { PeerConnection } from "&/peer";
import { useStore } from "&/store";
import { sha256 } from "js-sha256";

interface PeersPanelProps {
    peerConnection: PeerConnection | null;
    onDisconnect: (peerId: string) => void;
}

export default function PeersPanel({
    peerConnection,
    onDisconnect,
}: PeersPanelProps) {
    const { user } = useStore();
    const [isOpen, setIsOpen] = useState(true);
    const connectedPeers: string[] = peerConnection
        ? Array.from(peerConnection.connections.keys())
        : [];

    const getPeerDisplayName = (id: string) => {
        const connData = peerConnection?.connections.get(id);
        const remoteName = connData?.remoteName || "Unknown";
        const isSource = connData?.isSource ?? false; // True = Source (incoming), False = Target (outgoing)
        const isPermanent = connData?.isPermanent ?? false;
        const lastFour = id.slice(-4);
        const isActive = connData?.conn.open ? "Active" : "Inactive";
        const type = isPermanent ? "Permanent" : "Session";
        return `${remoteName} (${lastFour}) (${isSource ? "Source" : "Target"}) (${isActive}) (${type})`;
    };

    return (
        <div className="mt-4 rounded bg-gray-100 p-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-md flex w-full items-center justify-between text-left font-semibold"
            >
                Connected Peers
                <span>{isOpen ? "▼" : "▶"}</span>
            </button>
            {isOpen && (
                <div className="mt-2">
                    {connectedPeers.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No peers connected yet.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {connectedPeers.map((id) => (
                                <li
                                    key={id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span>{getPeerDisplayName(id)}</span>
                                    <button
                                        onClick={() => onDisconnect(id)}
                                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                                    >
                                        Disconnect
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

import Peer from "peerjs";
import { TodoList } from "types";

interface PeerConnection {
    peer: Peer;
    connections: Map<string, any>; // Map of peerId -> connection
}

export const initPeer = (onData: (data: TodoList) => void): PeerConnection => {
    const peer = new Peer();
    const connections = new Map<string, any>();

    peer.on("open", (id) => {
        console.log("Your Peer ID:", id);
    });

    peer.on("connection", (conn) => {
        const peerId = conn.peer;
        connections.set(peerId, conn); // Store the connection

        conn.on("data", (data) => {
            onData(data as TodoList);
        });

        conn.on("close", () => {
            connections.delete(peerId); // Clean up when connection closes
        });
    });

    return { peer, connections };
};

export const connectToPeer = (
    { peer, connections }: PeerConnection,
    peerId: string,
    list: TodoList,
) => {
    if (connections.has(peerId)) {
        // Already connected, send the list immediately
        const conn = connections.get(peerId);
        conn.send(list);
    } else {
        // Establish a new connection
        const conn = peer.connect(peerId);
        conn.on("open", () => {
            connections.set(peerId, conn);
            conn.send(list); // Send initial list
        });
        conn.on("close", () => {
            connections.delete(peerId); // Clean up
        });
    }
};

export const streamList = ({ connections }: PeerConnection, list: TodoList) => {
    // Send the updated list to all connected peers
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send(list);
        }
    });
};

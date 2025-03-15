import Peer from "peerjs";
import { TodoList } from "~/types";

export interface PeerConnection {
    peer: Peer;
    connections: Map<string, { conn: any; isSource: boolean }>; // Track direction
}

export const initPeer = (onData: (data: TodoList) => void): PeerConnection => {
    const peer = new Peer();
    const connections = new Map<string, { conn: any; isSource: boolean }>();

    peer.on("open", (id) => {
        console.log("Your Peer ID:", id);
    });

    peer.on("connection", (conn) => {
        const peerId = conn.peer;
        console.log(`Incoming connection from ${peerId}`);

        conn.on("open", () => {
            connections.set(peerId, { conn, isSource: true }); // Incoming = Source
            console.log(`Connection to ${peerId} opened (incoming)`);
        });

        conn.on("data", (data) => {
            const version = (data as TodoList).version ?? 0;
            console.log(
                `Received data from ${peerId} (incoming), version:`,
                version,
            );
            onData(data as TodoList);
        });

        conn.on("close", () => {
            connections.delete(peerId);
            console.log(`Disconnected from ${peerId} (incoming)`);
        });
    });

    return { peer, connections };
};

export const connectToPeer = (
    { peer, connections }: PeerConnection,
    peerId: string,
    list: TodoList,
    onData: (data: TodoList) => void,
) => {
    if (connections.has(peerId)) {
        const { conn } = connections.get(peerId)!;
        if (conn.open) {
            conn.send(list);
            console.log(`Sent list to ${peerId}, version:`, list.version);
        }
    } else {
        const conn = peer.connect(peerId);
        conn.on("open", () => {
            connections.set(peerId, { conn, isSource: false }); // Outgoing = Target
            conn.send(list);
            console.log(
                `Connected to ${peerId} (outgoing), sent version:`,
                list.version,
            );
        });
        conn.on("data", (data) => {
            const version = (data as TodoList).version ?? 0;
            console.log(
                `Received data from ${peerId} (outgoing), version:`,
                version,
            );
            onData(data as TodoList);
        });
        conn.on("close", () => {
            connections.delete(peerId);
            console.log(`Disconnected from ${peerId} (outgoing)`);
        });
        conn.on("error", (err) => {
            console.error(`Connection error with ${peerId}:`, err);
        });
    }
};

export const streamList = ({ connections }: PeerConnection, list: TodoList) => {
    console.log("Streaming list, version:", list.version);
    if (connections.size === 0) {
        console.log("No connections to stream to");
        return;
    }
    connections.forEach(({ conn }, peerId) => {
        if (conn.open) {
            conn.send(list);
            console.log(`Sent to ${peerId}, version:`, list.version);
        }
    });
};

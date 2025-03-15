import Peer from "peerjs";
import { TodoList, TaskUpdate } from "~/types";

export interface PeerConnection {
    peer: Peer;
    connections: Map<string, { conn: any; isSource: boolean }>;
}

export const initPeer = (
    onData: (data: TodoList | TaskUpdate) => void,
    getCurrentList: () => TodoList, // Still a callback, but will be tied to store
): PeerConnection => {
    const peer = new Peer();
    const connections = new Map<string, { conn: any; isSource: boolean }>();

    peer.on("open", (id) => {
        console.log("Your Peer ID:", id);
    });

    peer.on("connection", (conn) => {
        const peerId = conn.peer;
        console.log(`Incoming connection from ${peerId}`);

        conn.on("open", () => {
            if (connections.has(peerId)) {
                console.log(
                    `Duplicate connection from ${peerId}, closing old one`,
                );
                connections.get(peerId)!.conn.close();
            }
            connections.set(peerId, { conn, isSource: true });
            console.log(`Connection to ${peerId} opened (incoming)`);
            const currentList = getCurrentList(); // Fetch latest list here
            conn.send(currentList);
            console.log(
                `Sent current list to ${peerId} (incoming), version:`,
                currentList.version,
            );
        });

        conn.on("data", (data: unknown) => {
            if (
                data &&
                typeof data === "object" &&
                "type" in data &&
                data.type === "taskUpdate"
            ) {
                console.log(`Received task update from ${peerId}:`, data);
                onData(data as TaskUpdate);
            } else {
                const todoList = data as TodoList;
                if (todoList && "version" in todoList) {
                    console.log(
                        `Received full list from ${peerId}, version:`,
                        todoList.version,
                    );
                    onData(todoList);
                } else {
                    console.error(
                        `Received invalid data from ${peerId}:`,
                        data,
                    );
                }
            }
        });

        conn.on("close", () => {
            connections.delete(peerId);
            console.log(`Disconnected from ${peerId} (incoming)`);
        });

        conn.on("error", (err) => {
            console.error(`Connection error with ${peerId}:`, err);
        });
    });

    return { peer, connections };
};

export const connectToPeer = (
    { peer, connections }: PeerConnection,
    peerId: string,
    list: TodoList,
    onData: (data: TodoList | TaskUpdate) => void,
) => {
    console.log(
        `Attempting to connect to ${peerId} with list version:`,
        list.version,
    );
    if (connections.has(peerId)) {
        const { conn } = connections.get(peerId)!;
        if (conn.open) {
            console.log(`Already connected to ${peerId}, sending list`);
            conn.send(list);
            console.log(
                `Sent existing connection list to ${peerId}, version:`,
                list.version,
            );
        } else {
            console.log(
                `Connection to ${peerId} exists but is not open, reconnecting`,
            );
            connections.delete(peerId); // Clean up stale connection
            connectToPeer({ peer, connections }, peerId, list, onData); // Retry
        }
    } else {
        const conn = peer.connect(peerId);
        conn.on("open", () => {
            connections.set(peerId, { conn, isSource: false });
            console.log(`Connection to ${peerId} opened (outgoing)`);
            conn.send(list);
            console.log(
                `Sent initial list to ${peerId} (outgoing), version:`,
                list.version,
            );
        });
        conn.on("data", (data: unknown) => {
            if (
                data &&
                typeof data === "object" &&
                "type" in data &&
                data.type === "taskUpdate"
            ) {
                console.log(`Received task update from ${peerId}:`, data);
                onData(data as TaskUpdate);
            } else {
                const todoList = data as TodoList;
                if (todoList && "version" in todoList) {
                    console.log(
                        `Received full list from ${peerId} (outgoing), version:`,
                        todoList.version,
                    );
                    onData(todoList);
                } else {
                    console.error(
                        `Received invalid data from ${peerId}:`,
                        data,
                    );
                }
            }
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
    console.log("Streaming full list, version:", list.version);
    if (connections.size === 0) {
        console.log("No connections to stream to");
        return;
    }
    connections.forEach(({ conn }, peerId) => {
        if (conn.open) {
            conn.send(list);
            console.log(`Sent full list to ${peerId}, version:`, list.version);
        }
    });
};

export const streamTaskUpdate = (
    { connections }: PeerConnection,
    update: TaskUpdate,
) => {
    console.log("Streaming task update:", update);
    if (connections.size === 0) {
        console.log("No connections to stream to");
        return;
    }
    connections.forEach(({ conn }, peerId) => {
        if (conn.open) {
            conn.send(update);
            console.log(`Sent task update to ${peerId}:`, update);
        }
    });
};

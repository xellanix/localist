import Peer from "peerjs";
import { TodoList } from "~/types";

interface PeerConnection {
    peer: Peer;
    connections: Map<string, any>;
}

export const initPeer = (onData: (data: TodoList) => void): PeerConnection => {
    const peer = new Peer();
    const connections = new Map<string, any>();

    peer.on("open", (id) => {
        console.log("Your Peer ID:", id);
    });

    peer.on("connection", (conn) => {
        const peerId = conn.peer;
        console.log(`Incoming connection from ${peerId}`);

        conn.on("open", () => {
            connections.set(peerId, conn);
            console.log(`Connection to ${peerId} opened`);
        });

        conn.on("data", (data) => {
            console.log(
                `Received data from ${peerId} (incoming), version:`,
                (data as TodoList).version,
            );
            onData(data as TodoList);
        });

        conn.on("close", () => {
            connections.delete(peerId);
            console.log(`Disconnected from ${peerId}`);
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
        const conn = connections.get(peerId);
        if (conn.open) {
            conn.send(list);
            console.log(`Sent list to ${peerId}, version:`, list.version);
        }
    } else {
        const conn = peer.connect(peerId);
        conn.on("open", () => {
            connections.set(peerId, conn);
            conn.send(list);
            console.log(`Connected to ${peerId}, sent version:`, list.version);
        });
        conn.on("data", (data) => {
            console.log(
                `Received data from ${peerId} (outgoing), version:`,
                (data as TodoList).version,
            );
            onData(data as TodoList);
        });
        conn.on("close", () => {
            connections.delete(peerId);
            console.log(`Disconnected from ${peerId}`);
        });
    }
};

export const streamList = ({ connections }: PeerConnection, list: TodoList) => {
    console.log("Streaming list, version:", list.version);
    if (connections.size === 0) {
        console.log("No connections to stream to");
        return;
    }
    connections.forEach((conn, peerId) => {
        if (conn.open) {
            conn.send(list);
            console.log(`Sent to ${peerId}, version:`, list.version);
        }
    });
};

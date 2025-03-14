import Peer from "peerjs";
import { TodoList } from "types";

export const initPeer = (onData: (data: TodoList) => void) => {
    const peer = new Peer();

    peer.on("open", (id) => {
        console.log("Your Peer ID:", id);
    });

    peer.on("connection", (conn) => {
        conn.on("data", (data) => {
            onData(data as TodoList);
        });
    });

    return peer;
};

export const shareList = (peer: Peer, peerId: string, list: TodoList) => {
    const conn = peer.connect(peerId);
    conn.on("open", () => {
        conn.send(list);
    });
};

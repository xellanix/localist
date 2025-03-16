import PeerJs from "peerjs";
import { Peer, DataConnection } from "peerjs";
import { TodoList, TaskUpdate } from "~/types";
import { getStore } from "&/store";
import { sha256 } from "js-sha256";

export type PeerConnection = {
    randomPeer: Peer;
    permanentPeer?: Peer;
    connections: Map<
        string,
        {
            conn: DataConnection;
            isSource: boolean;
            isPermanent: boolean;
            remoteName?: string;
        }
    >;
};

export const initPeer = (
    onData: (data: TodoList | TaskUpdate) => void,
    getList: () => TodoList,
): PeerConnection => {
    const user = getStore().user;
    const randomPeer = new PeerJs({ debug: 2 });
    const permanentPeer = user
        ? new PeerJs(sha256(user.email + user.password), { debug: 2 })
        : undefined;
    const connections = new Map<
        string,
        {
            conn: DataConnection;
            isSource: boolean;
            isPermanent: boolean;
            remoteName?: string;
        }
    >();

    const setupPeer = (peer: Peer, isPermanent: boolean) => {
        peer.on("connection", (conn) => {
            console.log(
                `[${isPermanent ? "Permanent" : "Random"}] Incoming connection from ${conn.peer}`,
            );
            conn.on("open", () => {
                const remoteName = user?.name;
                connections.set(conn.peer, {
                    conn,
                    isSource: true, // Incoming = Source (data provider)
                    isPermanent: false, // Default to Session; update based on data
                    remoteName,
                });
                console.log(
                    `[${isPermanent ? "Permanent" : "Random"}] Connection opened with ${conn.peer} (Source)`,
                );
                conn.send({
                    list: getList(),
                    userName: remoteName,
                    isPermanent: !!permanentPeer,
                });
            });
            conn.on("data", (data: any) => {
                if (data.list && data.userName !== undefined) {
                    connections.set(conn.peer, {
                        conn,
                        isSource: true, // Incoming = Source
                        isPermanent: data.isPermanent === true, // True if source is permanent
                        remoteName: data.userName || "Unknown",
                    });
                    console.log(
                        `[${isPermanent ? "Permanent" : "Random"}] Updated connection ${conn.peer}: isSource=true, isPermanent=${data.isPermanent}`,
                    );
                    onData(data.list);
                } else {
                    onData(data);
                }
            });
            conn.on("close", () => {
                connections.delete(conn.peer);
                console.log(
                    `[${isPermanent ? "Permanent" : "Random"}] Connection closed with ${conn.peer}`,
                );
            });
        });
    };

    setupPeer(randomPeer, false);
    if (permanentPeer) setupPeer(permanentPeer, true);

    return { randomPeer, permanentPeer, connections };
};

export const connectToPeer = (
    pc: PeerConnection,
    peerId: string,
    list: TodoList,
    onData: (data: TodoList | TaskUpdate) => void,
) => {
    const user = getStore().user;
    const isPermanentTarget =
        user && peerId === sha256(user.email + user.password);
    const targetPeer = isPermanentTarget ? pc.permanentPeer : pc.randomPeer;
    if (!targetPeer) return;

    const conn = targetPeer.connect(peerId);
    conn.on("open", () => {
        console.log(
            `[${targetPeer === pc.permanentPeer ? "Permanent" : "Random"}] Connection to ${peerId} opened (Target)`,
        );
        const remoteName = user?.name;
        const isPermanentConnection =
            peerId === (user ? sha256(user.email + user.password) : "") ||
            (!user && peerId.length > 36);
        pc.connections.set(peerId, {
            conn,
            isSource: false, // Outgoing = Target (data consumer)
            isPermanent: isPermanentConnection, // True if connecting to permanent ID
            remoteName,
        });
        console.log(
            `[${targetPeer === pc.permanentPeer ? "Permanent" : "Random"}] Set connection ${peerId}: isSource=false, isPermanent=${isPermanentConnection}`,
        );
        conn.send({
            list,
            userName: remoteName,
            isPermanent: !!pc.permanentPeer,
        });
    });
    conn.on("data", (data: any) => {
        if (data.list && data.userName !== undefined) {
            const isPermanentConnection =
                peerId === (user ? sha256(user.email + user.password) : "") ||
                (!user && peerId.length > 36);
            pc.connections.set(peerId, {
                conn,
                isSource: false, // Outgoing = Target
                isPermanent: isPermanentConnection,
                remoteName: data.userName || "Unknown",
            });
            console.log(
                `[${targetPeer === pc.permanentPeer ? "Permanent" : "Random"}] Updated connection ${peerId}: isSource=false, isPermanent=${isPermanentConnection}`,
            );
            onData(data.list);
        } else {
            onData(data);
        }
    });
    conn.on("close", () => {
        pc.connections.delete(peerId);
        console.log(
            `[${targetPeer === pc.permanentPeer ? "Permanent" : "Random"}] Connection to ${peerId} closed (Target)`,
        );
    });
};

export const streamList = (pc: PeerConnection, list: TodoList) => {
    console.log(`Streaming full list, version: ${list.version}`);
    pc.connections.forEach(({ conn }) => {
        if (conn.open) {
            conn.send(list);
            console.log(
                `Sent full list to ${conn.peer}, version: ${list.version}`,
            );
        }
    });
};

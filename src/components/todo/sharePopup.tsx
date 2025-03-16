"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useStore } from "&/store";
import { sha256 } from "js-sha256";
import { BrowserMultiFormatReader } from "@zxing/library";

interface SharePopupProps {
    peerId: string; // Random ID
    onShare: (id: string) => void;
    onClose: () => void;
}

export default function SharePopup({
    peerId,
    onShare,
    onClose,
}: SharePopupProps) {
    const { user } = useStore();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [connectId, setConnectId] = useState("");
    const [activeTab, setActiveTab] = useState<"random" | "permanent">(
        "random",
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (activeTab === "random") {
            generateQRCodeForRandom(peerId);
        } else if (user) {
            generateQRCodeForPermanent();
        } else {
            setQrCodeUrl("");
        }
    }, [activeTab, peerId, user]);

    const generateQRCodeForRandom = async (id: string) => {
        const data = JSON.stringify({ peerId: id });
        const url = await QRCode.toDataURL(data);
        setQrCodeUrl(url);
    };

    const generateQRCodeForPermanent = async () => {
        const permanentId = sha256(user!.email + user!.password);
        const data = JSON.stringify({ peerId: permanentId });
        const url = await QRCode.toDataURL(data);
        setQrCodeUrl(url);
    };

    const saveQrCode = () => {
        if (qrCodeUrl) {
            const link = document.createElement("a");
            link.href = qrCodeUrl;
            link.download = `qr-code-${activeTab}.png`;
            link.click();
        }
    };

    const connectViaQrCamera = async () => {
        let stream: MediaStream | null = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load before playing
                await new Promise<void>((resolve) => {
                    videoRef.current!.onloadedmetadata = () => resolve();
                });
                await videoRef.current.play();

                const codeReader = new BrowserMultiFormatReader();
                codeReader.decodeFromVideoDevice(
                    null,
                    videoRef.current,
                    (result, err) => {
                        if (result) {
                            const qrData = JSON.parse(result.getText());
                            onShare(qrData.peerId);
                            stream
                                ?.getTracks()
                                .forEach((track) => track.stop());
                            if (videoRef.current)
                                videoRef.current.srcObject = null;
                            codeReader.reset();
                        }
                        if (err && err.name !== "NotFoundException") {
                            console.error("QR scan error:", err);
                            alert("Error scanning QR code from camera.");
                            stream
                                ?.getTracks()
                                .forEach((track) => track.stop());
                            if (videoRef.current)
                                videoRef.current.srcObject = null;
                            codeReader.reset();
                        }
                    },
                );
            }
        } catch (err) {
            console.error("Camera access denied or playback failed:", err);
            alert("Failed to access camera or start video.");
            stream?.getTracks().forEach((track) => track.stop());
        }
    };

    const connectViaQrFile = async () => {
        fileInputRef.current?.click();
    };

    const handleFileConnect = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const codeReader = new BrowserMultiFormatReader();
            try {
                const result = await codeReader.decodeFromImage(
                    undefined,
                    URL.createObjectURL(file),
                );
                const qrData = JSON.parse(result.getText());
                onShare(qrData.peerId);
            } catch (err) {
                console.error("Failed to decode QR from file:", err);
                alert("Could not decode QR code from uploaded file.");
            }
        }
    };

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        alert(
            `${activeTab === "random" ? "Random" : "Permanent"} ID copied to clipboard!`,
        );
    };

    const handleConnect = () => {
        if (connectId) {
            onShare(connectId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold">Share Your List</h2>
                <div className="mb-4 flex">
                    <button
                        onClick={() => setActiveTab("random")}
                        className={`flex-1 p-2 ${activeTab === "random" ? "bg-blue-500 text-white" : "bg-gray-200"} rounded-l`}
                    >
                        Random Peer ID
                    </button>
                    <button
                        onClick={() => setActiveTab("permanent")}
                        className={`flex-1 p-2 ${activeTab === "permanent" ? "bg-blue-500 text-white" : "bg-gray-200"} rounded-r`}
                    >
                        Permanent ID
                    </button>
                </div>

                {activeTab === "random" ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="font-semibold">Manual Connect</p>
                            <div className="flex items-center space-x-2">
                                <p className="flex-1 truncate">
                                    <strong>Your Random ID:</strong>{" "}
                                    {peerId.slice(0, 20)}...
                                </p>
                                <button
                                    onClick={() => copyId(peerId)}
                                    className="rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                                >
                                    Copy
                                </button>
                            </div>
                            <input
                                type="text"
                                value={connectId}
                                onChange={(e) => setConnectId(e.target.value)}
                                placeholder="Enter Random Peer ID"
                                className="w-full rounded border p-2"
                            />
                            <button
                                onClick={handleConnect}
                                className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                            >
                                Connect
                            </button>
                        </div>
                        {qrCodeUrl && (
                            <>
                                <hr className="border-gray-300" />
                                <div className="space-y-2">
                                    <p className="font-semibold">QR Connect</p>
                                    <img
                                        src={qrCodeUrl}
                                        alt="Random QR Code"
                                        className="mx-auto h-32 w-32"
                                    />
                                    <p className="text-center text-sm text-gray-600">
                                        Share this QR for temporary session
                                        sharing.
                                    </p>
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={saveQrCode}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Save as Image
                                        </button>
                                        <button
                                            onClick={connectViaQrCamera}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Connect via QR Camera
                                        </button>
                                        <button
                                            onClick={connectViaQrFile}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Connect via QR File
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="font-semibold">Manual Connect</p>
                            {user ? (
                                <div className="flex items-center space-x-2">
                                    <p className="flex-1 truncate">
                                        <strong>Your Permanent ID:</strong>{" "}
                                        {sha256(
                                            user.email + user.password,
                                        ).slice(0, 20)}
                                        ...
                                    </p>
                                    <button
                                        onClick={() =>
                                            copyId(
                                                sha256(
                                                    user.email + user.password,
                                                ),
                                            )
                                        }
                                        className="rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    No account created yet.
                                </p>
                            )}
                            <input
                                type="text"
                                value={connectId}
                                onChange={(e) => setConnectId(e.target.value)}
                                placeholder="Enter Permanent Peer ID"
                                className="w-full rounded border p-2"
                            />
                            <button
                                onClick={handleConnect}
                                className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                            >
                                Connect
                            </button>
                        </div>
                        <hr className="border-gray-300" />
                        <div className="space-y-2">
                            <p className="font-semibold">QR Connect</p>
                            {user && qrCodeUrl ? (
                                <>
                                    <img
                                        src={qrCodeUrl}
                                        alt="Permanent QR Code"
                                        className="mx-auto h-32 w-32"
                                    />
                                    <p className="text-center text-sm text-gray-600">
                                        Share this QR to connect with your
                                        permanent ID.
                                    </p>
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={saveQrCode}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Save as Image
                                        </button>
                                        <button
                                            onClick={connectViaQrCamera}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Connect via QR Camera
                                        </button>
                                        <button
                                            onClick={connectViaQrFile}
                                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                        >
                                            Connect via QR File
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-center space-x-2">
                                    <button
                                        onClick={connectViaQrCamera}
                                        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                    >
                                        Connect via QR Camera
                                    </button>
                                    <button
                                        onClick={connectViaQrFile}
                                        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                    >
                                        Connect via QR File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileConnect}
                    className="hidden"
                    accept="image/*"
                />
                <video ref={videoRef} className="hidden" />
                <button
                    onClick={onClose}
                    className="mt-4 w-full rounded bg-gray-500 p-2 text-white hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

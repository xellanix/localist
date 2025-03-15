"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";

interface SharePopupProps {
    peerId: string;
    onShare: (remotePeerId: string) => void;
    onClose: () => void;
}

export default function SharePopup({
    peerId,
    onShare,
    onClose,
}: SharePopupProps) {
    const [remotePeerId, setRemotePeerId] = useState("");
    const [copied, setCopied] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [codeReader, setCodeReader] =
        useState<BrowserMultiFormatReader | null>(null);

    // Generate QR code
    useEffect(() => {
        if (peerId) {
            QRCode.toDataURL(peerId, { width: 200, margin: 1 }, (err, url) => {
                if (err) {
                    console.error("QR code generation failed:", err);
                    return;
                }
                console.log("Generated QR code for Peer ID:", peerId);
                setQrCodeUrl(url);
            });
        }
    }, [peerId]);

    // Initialize code reader
    useEffect(() => {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, ["QR_CODE"]);
        const reader = new BrowserMultiFormatReader(hints);
        setCodeReader(reader);

        return () => {
            reader.reset();
            console.log("Code reader reset on popup unmount");
        };
    }, []);

    // Copy Peer ID
    const copyToClipboard = () => {
        navigator.clipboard.writeText(peerId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Manual connect
    const handleShare = () => {
        if (remotePeerId) {
            console.log("Manually connecting to:", remotePeerId);
            onShare(remotePeerId);
            setRemotePeerId("");
        }
    };

    // Start camera scanning
    const startScanning = async () => {
        if (isScanning || !codeReader) {
            console.log(
                "Scanning already in progress or code reader not initialized",
            );
            return;
        }

        const videoElement = videoRef.current;
        if (!videoElement) {
            console.error("Video element not available before scanning starts");
            return;
        }

        setIsScanning(true);
        console.log("Starting camera QR code scan");

        try {
            await codeReader.decodeFromVideoDevice(
                null,
                videoElement,
                (result, err) => {
                    if (result) {
                        console.log(
                            "Scanned QR code from camera:",
                            result.getText(),
                        );
                        onShare(result.getText());
                        stopScanning();
                    }
                    if (err && err.name !== "NotFoundException") {
                        console.error("Camera scan error:", err);
                    }
                },
            );
        } catch (err) {
            console.error("Failed to start camera scanning:", err);
            setIsScanning(false);
        }
    };

    // Stop scanning
    const stopScanning = () => {
        if (codeReader) {
            codeReader.reset();
            console.log("Camera scanning stopped");
        }
        setIsScanning(false);
    };

    // Handle QR code from uploaded image
    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file || !codeReader) {
            console.log("No file selected or code reader not initialized");
            return;
        }

        console.log("Processing uploaded image:", file.name);
        try {
            const result = await codeReader.decodeFromImageUrl(
                URL.createObjectURL(file),
            );
            console.log("Decoded QR code from image:", result.getText());
            onShare(result.getText());
        } catch (err) {
            console.error("Failed to decode QR code from image:", err);
            alert("No QR code found in the image or decoding failed.");
        }
    };

    // Save QR code
    const saveQrCode = () => {
        if (!qrCodeUrl) return;
        const link = document.createElement("a");
        link.href = qrCodeUrl;
        link.download = `peer-id-${peerId}.png`;
        link.click();
        console.log("QR code saved as image");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-50">
            <div className="m-4 flex max-h-[90dvh] w-[90dvw] flex-col rounded-lg bg-white shadow-lg">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">Share Your List</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-4 flex items-center space-x-2">
                        <span className="text-sm">Your Peer ID: {peerId}</span>
                        <button
                            onClick={copyToClipboard}
                            className="rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    {/* QR Code Display */}
                    {qrCodeUrl && (
                        <div className="mb-4">
                            <p className="text-sm">Your Peer ID as QR Code:</p>
                            <img
                                src={qrCodeUrl}
                                alt="Peer ID QR Code"
                                className="mx-auto h-32 w-32"
                            />
                            <button
                                onClick={saveQrCode}
                                className="mx-auto mt-1 block rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                            >
                                Save QR Code
                            </button>
                        </div>
                    )}

                    {/* Manual Peer ID Input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={remotePeerId}
                            onChange={(e) => setRemotePeerId(e.target.value)}
                            placeholder="Enter friend's Peer ID"
                            className="mb-2 w-full border p-2"
                        />
                        <button
                            onClick={handleShare}
                            className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                        >
                            Connect & Share
                        </button>
                    </div>

                    {/* QR Code Scanning Options */}
                    <div className="mb-4">
                        <button
                            onClick={isScanning ? stopScanning : startScanning}
                            className={`${
                                isScanning ? "bg-red-500" : "bg-purple-500"
                            } mb-2 w-full rounded p-2 text-white hover:bg-opacity-80`}
                        >
                            {isScanning
                                ? "Stop Scanning"
                                : "Scan QR Code with Camera"}
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="qr-upload"
                        />
                        <button
                            onClick={() =>
                                document.getElementById("qr-upload")?.click()
                            }
                            className="w-full rounded bg-purple-500 p-2 text-white hover:bg-purple-600"
                        >
                            Upload QR Code Image
                        </button>
                    </div>

                    {/* Video for Scanning */}
                    <div className="mb-4">
                        <video
                            ref={videoRef}
                            className={`mx-auto w-full max-w-[80dvw] border ${isScanning ? "block" : "hidden"}`}
                            muted
                            playsInline
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

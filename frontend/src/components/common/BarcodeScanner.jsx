import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning || isInitialized || !scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      },
      false
    );

    const onScanSuccess = (decodedText) => {
      console.log("Barcode/QR scanned:", decodedText);
      toast.success(`Barcode scanned: ${decodedText}`);
      onScan(decodedText);
      setScanning(false);
      html5QrcodeScanner.clear().catch((error) => {
        console.log("Scanner cleanup error:", error);
      });
    };

    const onScanFailure = (error) => {
      // Ignore scanning errors as they occur continuously
      console.debug("Scan failure:", error);
    };

    try {
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setIsInitialized(true);
    } catch (err) {
      console.error("Scanner initialization error:", err);
      toast.error("Camera access denied or not available");
      onClose();
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch((error) => {
          console.log("Cleanup error:", error);
        });
      }
    };
  }, [isInitialized, scanning, onScan, onClose]);

  const handleClose = () => {
    setScanning(false);
    onClose();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📷 Scan Barcode/QR Code</h2>
        <p style={styles.subtitle}>
          Point camera at barcode to scan item
        </p>
      </div>

      <div id="qr-reader" ref={scannerRef} style={styles.scannerBox} />

      <div style={styles.buttonContainer}>
        <button onClick={handleClose} style={styles.closeButton}>
          ✕ Close Scanner
        </button>
      </div>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          💡 <strong>Tip:</strong> Make sure the barcode is well-lit and in focus
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: "0",
  },
  scannerBox: {
    width: "100%",
    aspectRatio: "1 / 1",
    marginBottom: "20px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  buttonContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  closeButton: {
    flex: 1,
    padding: "12px 20px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    border: "1px solid #2196F3",
    borderRadius: "4px",
    padding: "12px",
    marginTop: "15px",
  },
  infoText: {
    fontSize: "13px",
    color: "#1976d2",
    margin: "0",
  },
};

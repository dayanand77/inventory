import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

function BarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const controlsRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const stopScanner = () => {
    if (controlsRef.current && typeof controlsRef.current.stop === "function") {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  };

  useEffect(() => {
    scannerRef.current = new BrowserMultiFormatReader();
    return () => {
      stopScanner();
      if (scannerRef.current && typeof scannerRef.current.dispose === "function") {
        scannerRef.current.dispose();
      }
    };
  }, []);

  const startScan = async () => {
    setError("");

    try {
      setActive(true);
      stopScanner();

      controlsRef.current = await scannerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
        if (result) {
          onDetected(result.getText());
          stopScanner();
          setActive(false);
        }
        }
      );
    } catch {
      setError("Unable to access camera for scanning.");
      setActive(false);
    }
  };

  const stopScan = () => {
    stopScanner();
    setActive(false);
  };

  return (
    <div className="scanner-card">
      <div className="button-row">
        <button type="button" className="outline-button" onClick={startScan} disabled={active}>
          Start Scan
        </button>
        <button type="button" className="ghost-button" onClick={stopScan} disabled={!active}>
          Stop
        </button>
      </div>
      <video ref={videoRef} className="scanner-video" muted />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default BarcodeScanner;

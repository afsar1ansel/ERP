import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: any) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<"camera" | "file">("camera");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // 1. Manage Camera Logic
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      // Only run if in camera mode and video element exists
      if (scanMode === "camera" && videoRef.current) {
        try {
          // Initialize scanner
          scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              if (isMounted) {
                onScanSuccess(result.data);
                scannerRef.current?.stop();
              }
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: "environment",
            }
          );

          await scannerRef.current.start();
          // Clear error if camera starts successfully
          if (isMounted) setError(null);
        } catch (err) {
          console.error("Camera failed:", err);

          if (isMounted) {
            // --- THE FIX: Auto-switch to file mode ---
            setError("Camera not found. Switched to upload mode.");
            setScanMode("file");
            if (onScanError) onScanError(err);
          }
        }
      }
    };

    if (scanMode === "camera") {
      startCamera();
    }

    // Cleanup
    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [scanMode, onScanSuccess]); // Re-run when mode changes

  // 2. Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await QrScanner.scanImage(file);
      onScanSuccess(result);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Could not read QR code. Please ensure the image is clear.");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mode Switcher Buttons */}
      <div className="flex gap-2 justify-center pb-2">
        <Button
          variant={scanMode === "camera" ? "default" : "outline"}
          onClick={() => {
            setError(null); // Clear error when manually retrying camera
            setScanMode("camera");
          }}
          size="sm"
        >
          <Camera className="mr-2 h-4 w-4" />
          Camera
        </Button>
        <Button
          variant={scanMode === "file" ? "default" : "outline"}
          onClick={() => setScanMode("file")}
          size="sm"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="destructive"
          className="py-2 bg-destructive/10 text-destructive border-destructive/20"
        >
          <AlertDescription className="text-xs font-medium text-center">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Camera View */}
      {scanMode === "camera" && (
        <div className="relative overflow-hidden rounded-lg border bg-black aspect-square flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute inset-0 border-2 border-white/30 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg opacity-50"></div>
          </div>
          {/* Loading / Waiting text */}
          <div className="absolute text-white/50 text-xs bottom-2">
            Initializing Camera...
          </div>
        </div>
      )}

      {/* File Upload View */}
      {scanMode === "file" && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors h-[250px]">
          <div className="bg-background p-4 rounded-full mb-3 shadow-sm">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <label htmlFor="qr-upload" className="cursor-pointer">
            <span className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium shadow transition-colors focus-visible:outline-none">
              Choose Image
            </span>
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-3 text-center px-4">
            Upload a clear image containing a QR code.
          </p>
        </div>
      )}
    </div>
  );
}

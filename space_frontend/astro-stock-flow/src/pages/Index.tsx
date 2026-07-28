import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { QRScanner } from "@/components/QRScanner/QRScanner";
import { useState, useEffect } from "react";
import { BASE_URL } from "@/hooks/baseUrls";

const Index = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [scannedPOId, setScannedPOId] = useState<string | null>(null);
  const [existingMaterials, setExistingMaterials] = useState<any[]>([]);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/raw-materials/get-all/${token}`
        );
        const data = await response.json();
        setExistingMaterials(
          Array.isArray(data) ? data : data?.result || data?.data || []
        );
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, []);

  const handleScanResult = (result: string) => {
    console.log("Scanned Result:", result);

    try {
      const scannedData = JSON.parse(result);

      if (scannedData.t === "PO" && scannedData.id) {
        console.log("Purchase Order detected:", scannedData.id);
        setIsScannerOpen(false);
        setScannedPOId(String(scannedData.id));
        setTimeout(() => {
          setIsReceiveStockOpen(true);
        }, 300);
      } else {
        console.warn("Unknown QR code type:", scannedData.t);
      }
    } catch (error) {
      console.error("Failed to parse QR code result:", error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to Space Luggage Inventory Management System
            </p>
          </div>
          <div>
            <Popover open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-accent/40 hover:bg-accent/100 transition-colors"
                  title="Open Scanner"
                >
                  <QrCode className="h-5 w-5" />
                  Upload Received Stock
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-[22rem] rounded-xl shadow-lg border border-border/60 p-4 bg-background"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Scan QR Code</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Use camera or upload an image to scan
                    </p>
                  </div>

                  <QRScanner
                    onScanSuccess={handleScanResult}
                    onScanError={(err) => console.log("Scanner error:", err)}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Dashboard
          isReceiveStockOpen={isReceiveStockOpen}
          setIsReceiveStockOpen={setIsReceiveStockOpen}
          scannedPOId={scannedPOId}
          existingMaterials={existingMaterials}
        />
      </div>
    </MainLayout>
  );
};

export default Index;

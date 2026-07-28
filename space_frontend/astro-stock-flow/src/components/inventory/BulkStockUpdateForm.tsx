import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";

interface BulkUpdateItem {
  id: string;
  name: string;
  sku?: string;
  currentStock: number;
  newStock: number;
  unit: string;
  minLevel?: number;
  maxLevel?: number;
  hasWarning?: boolean;
  warningMessage?: string;
}

interface BulkStockUpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  type: "raw-materials" | "finished-goods";
  onUpdate: (updates: BulkUpdateItem[]) => void;
}

export const BulkStockUpdateForm: React.FC<BulkStockUpdateFormProps> = ({
  open,
  onOpenChange,
  data,
  type,
  onUpdate
}) => {
  const [step, setStep] = useState<"upload" | "preview" | "processing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<BulkUpdateItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateTemplate = () => {
    const csvContent = type === "raw-materials" 
      ? "ID,Name,Current Stock,Unit,Min Level,Max Level,New Stock\n" +
        data.map(item => 
          `${item.id},"${item.name}",${item.stockQuantity},${item.unitOfMeasure || "units"},${item.minStockLevel || 0},${item.maxStockLevel || 0},${item.stockQuantity}`
        ).join("\n")
      : "ID,Name,SKU,Current Stock,Unit,Min Level,Max Level,New Stock\n" +
        data.map(item => 
          `${item.id},"${item.name}","${item.sku || ""}",${item.stockQuantity || item.currentStock || 0},${item.unit || "units"},${item.minLevel || 0},${item.maxLevel || 0},${item.stockQuantity || item.currentStock || 0}`
        ).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${type}-bulk-update-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Template Downloaded",
      description: "Fill in the 'New Stock' column and upload the file.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv') && !uploadedFile.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    processFile(uploadedFile);
  };

  const processFile = async (file: File) => {
    setStep("processing");
    setUploadProgress(0);
    setErrors([]);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      // Simulate processing progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const requiredColumns = ['ID', 'New Stock'];
      const missingColumns = requiredColumns.filter(col => 
        !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
      );

      if (missingColumns.length > 0) {
        setErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
        setStep("upload");
        return;
      }

      const updates: BulkUpdateItem[] = [];
      const newErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const id = values[0];
        const newStockStr = values[headers.findIndex(h => h.toLowerCase().includes('new stock'))];
        
        if (!id || !newStockStr) continue;

        const newStock = parseFloat(newStockStr);
        if (isNaN(newStock) || newStock < 0) {
          newErrors.push(`Row ${i + 1}: Invalid stock quantity "${newStockStr}"`);
          continue;
        }

        const existingItem = data.find(item => item.id === id);
        if (!existingItem) {
          newErrors.push(`Row ${i + 1}: Item with ID "${id}" not found`);
          continue;
        }

        const currentStock = type === "raw-materials" 
          ? existingItem.stockQuantity 
          : (existingItem.stockQuantity || existingItem.currentStock || 0);

        const update: BulkUpdateItem = {
          id,
          name: existingItem.name,
          sku: type === "finished-goods" ? existingItem.sku : undefined,
          currentStock,
          newStock,
          unit: existingItem.unitOfMeasure || existingItem.unit || "units",
          minLevel: existingItem.minStockLevel || existingItem.minLevel,
          maxLevel: existingItem.maxStockLevel || existingItem.maxLevel,
        };

        // Check for warnings
        if (update.minLevel && newStock < update.minLevel) {
          update.hasWarning = true;
          update.warningMessage = `Below minimum level (${update.minLevel})`;
        } else if (update.maxLevel && newStock > update.maxLevel) {
          update.hasWarning = true;
          update.warningMessage = `Above maximum level (${update.maxLevel})`;
        } else if (Math.abs(newStock - currentStock) / currentStock > 0.5) {
          update.hasWarning = true;
          update.warningMessage = "Large stock change (>50%)";
        }

        updates.push(update);
      }

      setErrors(newErrors);
      setPreviewData(updates);
      setStep("preview");

      if (newErrors.length > 0) {
        toast({
          title: "File Processed with Errors",
          description: `${updates.length} valid updates found, ${newErrors.length} errors.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Processed Successfully",
          description: `${updates.length} updates ready for review.`,
        });
      }
    } catch (error) {
      setErrors(["Failed to process file. Please check the format."]);
      setStep("upload");
      toast({
        title: "Processing Failed",
        description: "Please check your file format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmUpdate = () => {
    onUpdate(previewData);
    onOpenChange(false);
    setStep("upload");
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setUploadProgress(0);
    
    toast({
      title: "Stock Updated",
      description: `${previewData.length} items updated successfully.`,
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep("upload");
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Stock Update - {type === "raw-materials" ? "Raw Materials" : "Finished Goods"}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Step 1: Download Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the Excel template with current stock data pre-filled.
                  </p>
                  <Button onClick={generateTemplate} className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Step 2: Upload File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your completed CSV or Excel file with updated stock quantities.
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Processing File...</h3>
              <p className="text-muted-foreground">Please wait while we validate your data.</p>
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">{uploadProgress}% complete</p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review Changes</h3>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {previewData.length} updates
                </Badge>
                {previewData.some(item => item.hasWarning) && (
                  <Badge variant="destructive">
                    {previewData.filter(item => item.hasWarning).length} warnings
                  </Badge>
                )}
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Processing Errors:</p>
                    {errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm">{error}</div>
                    ))}
                    {errors.length > 5 && (
                      <div className="text-sm">...and {errors.length - 5} more errors</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {type === "finished-goods" && <TableHead>SKU</TableHead>}
                    <TableHead>Current</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((item) => {
                    const change = item.newStock - item.currentStock;
                    const changePercent = item.currentStock > 0 
                      ? ((change / item.currentStock) * 100).toFixed(1)
                      : "N/A";
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        {type === "finished-goods" && <TableCell>{item.sku}</TableCell>}
                        <TableCell>{item.currentStock} {item.unit}</TableCell>
                        <TableCell>{item.newStock} {item.unit}</TableCell>
                        <TableCell>
                          <span className={change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"}>
                            {change > 0 ? "+" : ""}{change} ({changePercent}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.hasWarning ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmUpdate}
                disabled={previewData.length === 0}
              >
                Apply Updates ({previewData.length} items)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
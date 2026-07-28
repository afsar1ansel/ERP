import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StorageLocationMultiSelect from "@/pages/StorageLocationMultiSelect ";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Minus } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/hooks/baseUrls";
import { receiveFromProduction } from "@/pages/FinishedGoods";

interface ReceiveFromProductionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  mode: "add" | "edit";
  editData?: any;

  onSuccess: () => void;
}

interface ProductionBatch {
  id: string;
  production_code: string;
  product_name: string;
  sku: string;
  quantity: number;
  completed_quantity: number;
  status: string;
  batch_status: string;
  completed_qty: number;
  planned_qty: number;
}

interface StockLocation {
  id: string;
  location_name: string;
  location_label?: string;
  rack_number: string;
  shelf_number: string;
  warehouse_name: string;
}

export function ReceiveFromProductionForm({
  open,
  onOpenChange,
  token,
  mode,
  editData,
  onSuccess,
}: ReceiveFromProductionFormProps) {
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [receivedQuantity, setReceivedQuantity] = useState<number>(0);
  const [storageLocation, setStorageLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast();

  const [status, setStatus] = useState<string>("");

  const selectedBatchData = batches.find((batch) => batch.id == selectedBatch);

  // ✅ Fetch production batches
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/production-batches/get-all/${token}`
        );

        // Adjust if response.data.data exists
        setBatches(response.data?.data || response.data || []);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch production batches.",
          variant: "destructive",
        });
      } finally {
        setLoadingBatches(false);
      }
    };

    if (open) fetchBatches();
  }, [open, token, toast]);

  // ✅ Fetch storage locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/locations/get-all/${token}`
        );
        setLocations(response.data || []);
        console.log(response.data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch storage locations.",
          variant: "destructive",
        });
      } finally {
        setLoadingLocations(false);
      }
    };

    if (open) fetchLocations();
  }, [open, token, toast]);

  console.log(editData);

  // ✅ Load edit data
  useEffect(() => {
    if (mode === "edit" && editData) {
      setSelectedBatch(editData.productionBatchId);
      setReceivedQuantity(editData.stock_qty);
      setStorageLocation(editData.storage_location_id);
      setNotes(editData.notes);
      setStatus(editData.goods_status);
    } else {
      setSelectedBatch("");
      setReceivedQuantity(0);
      setStorageLocation("");
      setNotes("");
    }
  }, [mode, editData, open]);

  // ✅ Validation
  const validateForm = () => {
    if (!selectedBatch) return "Please select a production batch.";
    if (receivedQuantity <= 0)
      return "Received quantity must be greater than 0.";
    if (!storageLocation) return "Please select a storage location.";
    // if (
    //   selectedBatchData &&
    //   receivedQuantity > (selectedBatchData.completed_quantity || 0)
    // )
    //   return "Received quantity exceeds available completed units.";
    return "";
  };

  // ✅ Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        productionBatchId: selectedBatch,
        quantity: receivedQuantity,
        storageLocationId: storageLocation,
        notes,
        token,
      };

      if (mode === "add") {
        const res = await receiveFromProduction(payload);

        if (res.errFlag !== 0) {
          toast({
            title: "Error",
            description: res.message,
            variant: "destructive",
          });
          return;
        }

        onSuccess();
        toast({
          title: "Success",
          description: `Received ${receivedQuantity} units from batch ${selectedBatchData?.production_code}`,
        });
      } else {
        await axios.post(`${BASE_URL}/production-receipts/update`, {
          id: editData?.id,
          ...payload,
        });
        toast({
          title: "Updated",
          description: `Updated receipt for batch ${selectedBatchData?.production_code}`,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while saving data.",
        variant: "destructive",
      });
    }
  };

  const handleInputChangeLocation = (field, value) => {
    setStorageLocation(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === "add" ? "Receive from Production" : "Edit Received Stock"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Production Batch */}
          <div>
            <Label>Production Batch *</Label>
            <Select
              value={selectedBatch}
              onValueChange={(value) => setSelectedBatch(value)}
              disabled={mode === "edit"}
              required
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingBatches ? "Loading batches..." : "Select batch"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>
                    {batch.production_code} - {batch.product_name} (
                    {batch.quantity} units)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Batch Details */}
          {/* Batch Details */}
          {selectedBatchData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Batch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <div className="font-medium">
                      {selectedBatchData.product_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <div className="font-mono">
                      {selectedBatchData.production_code}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Planned:</span>
                    <div>{selectedBatchData.planned_qty} units</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completed:</span>
                    <div className="flex items-center gap-2">
                      {selectedBatchData.completed_qty} units
                      <Badge
                        className={`
                ${
                  selectedBatchData.batch_status === "completed"
                    ? "bg-green-100 text-green-800"
                    : selectedBatchData.batch_status === "inprogress"
                    ? "bg-blue-100 text-blue-800"
                    : selectedBatchData.batch_status === "scheduled"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedBatchData.batch_status === "on_hold"
                    ? "bg-orange-100 text-orange-800"
                    : selectedBatchData.batch_status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
                      >
                        Completed
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quantity & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Received Quantity *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setReceivedQuantity(Math.max(0, receivedQuantity - 1))
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  max={selectedBatchData?.completed_quantity || 999}
                  value={receivedQuantity}
                  onChange={(e) =>
                    setReceivedQuantity(parseInt(e.target.value) || 0)
                  }
                  className="text-center"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setReceivedQuantity(
                      Math.min(
                        selectedBatchData?.completed_quantity || 999,
                        receivedQuantity + 1
                      )
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedBatchData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max available: {selectedBatchData.completed_quantity} units
                </p>
              )}
            </div>
            <StorageLocationMultiSelect
              locations={locations.map((loc) => {
                return {
                  id: loc.id,
                  name: `${loc.location_label}`,
                };
              })}
              formData={{
                storageLocation: storageLocation,

              }}
              handleInputChange={handleInputChangeLocation}
            />

            {/* <div>
              <Label>Storage Location *</Label>
              <Select
                value={storageLocation}
                onValueChange={setStorageLocation}
                required
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingLocations
                        ? "Loading locations..."
                        : "Select location"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.warehouse_name} - Rack {loc.rack_number} - Shelf{" "}
                      {loc.shelf_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this receipt..."
              rows={3}
            />
          </div>

          {mode == "edit" && (
            <div className="space-y-2">
              <Label htmlFor="goodsStatus">Goods Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goods status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Receive Stock" : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

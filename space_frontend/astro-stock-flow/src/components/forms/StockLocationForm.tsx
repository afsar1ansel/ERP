import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addStockLocation,
  getAllStockLocations,
  updateStockLocation,
} from "@/pages/master/MasterStockLocations";

interface StockLocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: {
    id: number;
    aisle: string;
    rack_number: string;
    shelf_number: string;
    storage_capacity_units: number;
    status?: number | string;
    aisle_no?: string;
    rack_no?: string;
    row_no?: string;
    capacity?: number;
  } | null;
  mode?: "add" | "edit";
  setMockStockLocations: React.Dispatch<React.SetStateAction<any[]>>;
}

export const StockLocationForm = ({
  open,
  onOpenChange,
  location,
  mode = "add",
  setMockStockLocations,
}: StockLocationFormProps) => {
  const { toast } = useToast();
  
  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    aisle: "",
    rackNumber: "",
    shelfNumber: "",
    capacity: "",
    status: "Active",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ aisle: "", rackNumber: "", shelfNumber: "", capacity: "" });
  const [loading, setLoading] = useState(false);
  const authToken = localStorage.getItem("token") || "";

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData({
        aisle: location.aisle ?? location.aisle_no ?? "",
        rackNumber: location.rack_no ?? "",
        shelfNumber: location.row_no ?? "",
        capacity: location.capacity?.toString() ?? location.storage_capacity_units?.toString() ?? "",
        status: location.status === 1 || location.status === "Active" ? "Active" : "Inactive",
      });
    } else {
      // Reset form for add mode
      setFormData({ aisle: "", rackNumber: "", shelfNumber: "", capacity: "", status: "Active" });
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ aisle: "", rackNumber: "", shelfNumber: "", capacity: "" });
  }, [location, mode, open]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { aisle: "", rackNumber: "", shelfNumber: "", capacity: "" };

    // Aisle: e.g., A-01, Aisle 1
    if (!/^[A-Za-z]+[- ]?\d+$/.test(formData.aisle)) {
      newErrors.aisle = "Aisle must be in the format 'A-01' or 'Aisle 1'.";
    }
    // Rack Number: Must be a positive integer
    if (!/^[1-9]\d*$/.test(formData.rackNumber)) {
      newErrors.rackNumber = "Rack Number must be a positive number.";
    }
    // Shelf Number: Must be a positive integer
    if (!/^[1-9]\d*$/.test(formData.shelfNumber)) {
      newErrors.shelfNumber = "Shelf Number must be a positive number.";
    }
    // Capacity: Must be a positive integer
    if (!/^[1-9]\d*$/.test(formData.capacity)) {
      newErrors.capacity = "Capacity must be a positive number.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        toast({
            title: "Validation Error",
            description: "Please fill all required fields correctly.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true);
    try {
      let response;
      const payload = {
        aisle: formData.aisle,
        rack_number: formData.rackNumber,
        shelf_number: formData.shelfNumber,
        storage_capacity_units: Number(formData.capacity),
        token: authToken,
      };

      if (mode === "add") {
        response = await addStockLocation(payload);
      } else if (location) {
        response = await updateStockLocation({
          ...payload,
          location_id: location.id,
          status: formData.status === "Active" ? "1" : "0",
          current_occupancy_units: 0, // Assuming this is reset or handled by backend
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(response?.message || `Failed to ${mode} stock location.`);
      }

      const updatedLocations = await getAllStockLocations(authToken);
      setMockStockLocations(updatedLocations || []);

      toast({
        title: "Success",
        description: `Stock location has been ${mode === 'edit' ? 'updated' : 'added'} successfully.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for the specific field when the user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field as keyof typeof errors]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit" : "Add New"} Stock Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aisle">Aisle *</Label>
            <Input
              id="aisle"
              value={formData.aisle}
              onChange={(e) => handleInputChange("aisle", e.target.value)}
              placeholder="e.g., A-01 or Aisle 1"
            />
            {errors.aisle && <p className="text-red-500 text-sm mt-1">{errors.aisle}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rackNumber">Rack Number *</Label>
            <Input
              id="rackNumber"
              type="number"
              value={formData.rackNumber}
              onChange={(e) => handleInputChange("rackNumber", e.target.value)}
              placeholder="e.g., 10"
            />
             {errors.rackNumber && <p className="text-red-500 text-sm mt-1">{errors.rackNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shelfNumber">Shelf Number *</Label>
            <Input
              id="shelfNumber"
              type="number"
              value={formData.shelfNumber}
              onChange={(e) => handleInputChange("shelfNumber", e.target.value)}
              placeholder="e.g., 5"
            />
             {errors.shelfNumber && <p className="text-red-500 text-sm mt-1">{errors.shelfNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Storage Capacity (Units) *</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleInputChange("capacity", e.target.value)}
              placeholder="e.g., 100"
            />
             {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update Location" : "Add Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

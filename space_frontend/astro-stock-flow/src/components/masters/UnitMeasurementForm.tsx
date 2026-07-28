import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addUnitMeasurement,
  updateUnitMeasurement,
  fetchUnitMeasurements,
  UnitMeasurement,
} from "@/pages/master/MasterUnitMeasurment";

interface UnitMeasurementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitMeasurement?: UnitMeasurement | null; // Optional prop for edit mode
  mode?: "add" | "edit";
  setUnitMeasurements: React.Dispatch<React.SetStateAction<UnitMeasurement[]>>;
}

export const UnitMeasurementForm = ({
  open,
  onOpenChange,
  unitMeasurement,
  mode = "add",
  setUnitMeasurements,
}: UnitMeasurementFormProps) => {
  const { toast } = useToast();

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (unitMeasurement && mode === "edit") {
      setFormData({
        name: unitMeasurement.unit_name,
        // code: unitMeasurement.unit_code,
      });
    } else {
      // Reset form for add mode
      setFormData({ name: ""});
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: ""});
  }, [unitMeasurement, mode, open]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: ""};

    // Unit Name: At least 2 characters, allows letters, numbers, and spaces.
    if (!/^[A-Za-z0-9\s&-]{1,}$/.test(formData.name)) {
      newErrors.name = "Unit Name must be at least 2 characters long.";
    }


    setErrors(newErrors);
    // Return true if all error messages are empty strings
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("token") || "";
      let response;

      if (mode === "add") {
        // console.log(formData.name, formData.code);
        response = await addUnitMeasurement({
          unitName: formData.name,
        //   unitCode: formData.code,
          token: authToken,
        });
      } else if (unitMeasurement) {
        response = await updateUnitMeasurement({
          unitMeasurementId: unitMeasurement.id,
          unitName: formData.name,
        //   unitCode: formData.code,
          token: authToken,
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(
          response?.message ||
            `Failed to ${mode === "edit" ? "update" : "add"} unit measurement.`
        );
      }

      // Refresh the unit measurement list in the parent component
      const unitMeasurementsData = await fetchUnitMeasurements(authToken);
      setUnitMeasurements(unitMeasurementsData);

      toast({
        title:
          mode === "edit"
            ? "Unit Measurement Updated"
            : "Unit Measurement Added",
        description: `${
          formData.name || unitMeasurement?.unit_name
        } has been saved successfully.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INPUT HANDLER ---
  const handleInputChange = (field: "name" | "code", value: string) => {
    // Convert code to uppercase as the user types
    const processedValue = field === "code" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    // Clear the error for the specific field when the user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Unit Measurement"
              : "Add New Unit Measurement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="unitMeasurementName">Unit Name *</Label>
              <Input
                id="unitMeasurementName"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Kilogram"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Unit"
                : "Add Unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

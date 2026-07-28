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
  addClientType,
  updateClientType,
  fetchClientTypes,
  ClientType,
} from "@/pages/master/MasterClientType";

interface ClientTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientType?: ClientType | null; // Optional prop for edit mode
  mode?: "add" | "edit";
  setClientTypes: React.Dispatch<React.SetStateAction<ClientType[]>>;
}

export const ClientTypeForm = ({
  open,
  onOpenChange,
  clientType,
  mode = "add",
  setClientTypes,
}: ClientTypeFormProps) => {
  const { toast } = useToast();

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: ""});
  const [loading, setLoading] = useState(false);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (clientType && mode === "edit") {
      setFormData({
        name: clientType.type_name,
        // code: clientType.client_type_code || "",
      });
    } else {
      // Reset form for add mode
      setFormData({ name: ""});
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: ""});
  }, [clientType, mode, open]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: ""};

    // Client Type Name: At least 2 characters, allows letters, numbers, and spaces.
    if (!/^[A-Za-z0-9\s&-]{2,}$/.test(formData.name)) {
      newErrors.name = "Client Type name must be at least 2 characters long.";
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
        console.log(formData.name);
        response = await addClientType({
          clientTypeName: formData.name,
          token: authToken,
        });
      } else if (clientType) {
        response = await updateClientType({
          clientTypeId: clientType.id,
          clientTypeName: formData.name,
          token: authToken,
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(
          response?.message ||
            `Failed to ${mode === "edit" ? "update" : "add"} client type.`
        );
      }

      // Refresh the client type list in the parent component
      const clientTypesData = await fetchClientTypes(authToken);
      setClientTypes(clientTypesData);

      toast({
        title: mode === "edit" ? "Client Type Updated" : "Client Type Added",
        description: `${
          formData.name || clientType?.type_name
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
            {mode === "edit" ? "Edit Client Type" : "Add New Client Type"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientTypeName">Client Type Name *</Label>
              <Input
                id="clientTypeName"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Distributor"
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
                ? "Update Client Type"
                : "Add Client Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";

interface AddDefectTypeFormProps {
  onSuccess: () => void;
  defect?: any; // The defect object being edited
}

export function AddDefectTypeForm({
  onSuccess,
  defect,
}: AddDefectTypeFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    defectId: "",
    name: "",
    category: "",
    description: "",
    severity: "",
    correctiveAction: "",
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (defect) {
      setFormData({
        defectId: defect.defect_code || "",
        name: defect.defect_name || "",
        category: defect.category || "",
        description: defect.description || "",
        severity: defect.severity || "",
        correctiveAction: defect.corrective_action || "",
      });
    } else {
      // Reset form when adding a new defect
      setFormData({ defectId: "", name: "", category: "", description: "", severity: "", correctiveAction: "" });
    }
    // Clear validation errors whenever the mode changes
    setErrors({});
  }, [defect]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors: any = {};

    // Defect ID: e.g., DT-001
    if (!/^[A-Z]{2,}-\d{3,}$/i.test(formData.defectId)) newErrors.defectId = "ID must be in the format 'DT-001'.";
    // Defect Name: at least 3 characters, allows letters, numbers, spaces
    if (!/^[A-Za-z0-9\s]{3,}$/.test(formData.name)) newErrors.name = "Name must be at least 3 characters long.";
    // Dropdown selections
    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.severity) newErrors.severity = "Please select a severity level.";
    // Text areas: must be descriptive, at least 15 characters
    if (!/^.{15,}$/.test(formData.description.trim())) newErrors.description = "Description must be at least 15 characters long.";
    if (!/^.{15,}$/.test(formData.correctiveAction.trim())) newErrors.correctiveAction = "Corrective action must be at least 15 characters long.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        toast({
            title: "Validation Error",
            description: "Please fill all required fields correctly.",
            variant: "destructive"
        });
        return;
    }

    setLoading(true);
    const apiForm = new FormData();
    apiForm.append("defect_code", formData.defectId);
    apiForm.append("defect_name", formData.name);
    apiForm.append("category", formData.category);
    apiForm.append("severity", formData.severity);
    apiForm.append("description", formData.description);
    apiForm.append("corrective_action", formData.correctiveAction);
    apiForm.append("token", token);

    try {
        let response;
        if (defect) {
            // Update logic
            apiForm.append("defect_type_id", defect.id);
            response = await fetch(`${BASE_URL}/defect-types/update-defect-type`, {
                method: "POST",
                body: apiForm,
            });
        } else {
            // Add logic
            response = await fetch(`${BASE_URL}/defect-types/add-defect-type`, {
                method: "POST",
                body: apiForm,
            });
        }
        
        const data = await response.json();
        if (data.errFlag !== 0) {
            throw new Error(data.message || "An error occurred.");
        }

        toast({
            title: `Defect Type ${defect ? 'Updated' : 'Added'}`,
            description: `${formData.name} has been successfully saved.`,
        });
        onSuccess();

    } catch (err: any) {
        console.error(err);
        toast({
            title: "Error",
            description: err.message || "An unexpected error occurred.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for the specific field when the user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <>
      <DialogDescription>
        {defect ? "Edit defect type details." : "Create a new defect type to categorize quality issues."}
      </DialogDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defectId">Defect ID *</Label>
            <Input id="defectId" placeholder="e.g., DT-001" value={formData.defectId} onChange={(e) => handleInputChange("defectId", e.target.value)} />
            {errors.defectId && <p className="text-red-500 text-sm mt-1">{errors.defectId}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Defect Name *</Label>
            <Input id="name" placeholder="e.g., Stitching Defect" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Raw Material">Raw Material</SelectItem>
                <SelectItem value="Component">Component</SelectItem>
                <SelectItem value="Packaging">Packaging</SelectItem>
                <SelectItem value="Assembly">Assembly</SelectItem>
                <SelectItem value="Finishing">Finishing</SelectItem>
              </SelectContent>
            </Select>
             {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Severity *</Label>
            <Select value={formData.severity} onValueChange={(value) => handleInputChange("severity", value)}>
              <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" placeholder="Detailed description of what this defect type entails" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} />
           {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="correctiveAction">Corrective Action *</Label>
          <Textarea id="correctiveAction" placeholder="Standard corrective actions for this defect type" value={formData.correctiveAction} onChange={(e) => handleInputChange("correctiveAction", e.target.value)} />
          {errors.correctiveAction && <p className="text-red-500 text-sm mt-1">{errors.correctiveAction}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : defect ? "Update Defect Type" : "Add Defect Type"}
          </Button>
        </div>
      </form>
    </>
  );
}

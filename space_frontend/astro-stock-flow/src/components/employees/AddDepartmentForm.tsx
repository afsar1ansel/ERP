import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AddDepartmentFormProps {
  onSuccess: () => void;
}

export function AddDepartmentForm({ onSuccess }: AddDepartmentFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    departmentId: "",
    name: "",
    description: "",
    head: "",
    location: "",
    budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the data to your backend
    console.log("Adding department:", formData);
    
    toast({
      title: "Department Added",
      description: `${formData.name} department has been successfully created.`,
    });
    
    onSuccess();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department ID</Label>
          <Input
            id="departmentId"
            placeholder="DEPT001"
            value={formData.departmentId}
            onChange={(e) => handleInputChange("departmentId", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Department Name</Label>
          <Input
            id="name"
            placeholder="e.g., Production"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of department functions"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="head">Department Head</Label>
          <Input
            id="head"
            placeholder="Employee name"
            value={formData.head}
            onChange={(e) => handleInputChange("head", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Floor 1, Building A"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Annual Budget</Label>
        <Input
          id="budget"
          placeholder="₹25,00,000"
          value={formData.budget}
          onChange={(e) => handleInputChange("budget", e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit">Add Department</Button>
      </div>
    </form>
  );
}
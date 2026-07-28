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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import {
  addRawMaterialCategory,
  getRawMaterialCategories,
  updateRawMaterialCategory,
} from "@/pages/master/MasterRawMaterialCategories";

interface RawMaterialCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit";
  category?: {
    id: number;
    category_name: string;
    category_description: string;
    active: boolean;
    category_image: string | null;
  } | null;
  setMockRawMaterialCategories: React.Dispatch<React.SetStateAction<any[]>>;
}

export const RawMaterialCategoryForm = ({
  open,
  onOpenChange,
  category,
  mode = "add",
  setMockRawMaterialCategories,
}: RawMaterialCategoryFormProps) => {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    image: null as File | null | string,
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: "", description: "", image: "" });
  const [loading, setLoading] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.category_name || "",
        description: category.category_description || "",
        active: category.active,
        image: category.category_image || null,
      });
    } else {
      // Reset form for add mode
      setFormData({ name: "", description: "", active: true, image: null });
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: "", description: "", image: "" });
  }, [category, mode, open]);


  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: "", description: "", image: "" };
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

    // Category Name: At least 3 characters, allows letters, numbers, and spaces
    if (!/^[A-Za-z0-9\s]{3,}$/.test(formData.name)) {
      newErrors.name = "Category name must be at least 3 characters long.";
    }
    // Description: Must be descriptive, at least 15 characters
    if (!/^.{15,}$/.test(formData.description.trim())) {
      newErrors.description = "Description must be at least 15 characters long.";
    }
    // Image: Required for new categories
    if (mode === "add" && !formData.image) {
      newErrors.image = "Category image is required.";
    }
    // File type validation if a new image is selected
    if (formData.image instanceof File && !allowedTypes.includes(formData.image.type)) {
      newErrors.image = "Invalid file type. Please use PNG, JPG, GIF, or WEBP.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === "");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        toast({
            title: "Validation Error",
            description: "Please correct the errors before submitting.",
            variant: "destructive"
        });
        return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === "add") {
        response = await addRawMaterialCategory({
          categoryName: formData.name,
          categoryDescription: formData.description,
          categoryImage: formData.image as File, // Already validated it's a file
          token,
        });
      } else if (category) {
        response = await updateRawMaterialCategory({
          categoryId: category.id,
          categoryName: formData.name,
          categoryDescription: formData.description,
          categoryImage: formData.image instanceof File ? formData.image : undefined, // Only send if it's a new file
          token,
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(response?.message || "Failed to save category.");
      }

      // Refresh the category list in the parent component
      const updatedCategories = await getRawMaterialCategories(token);
      setMockRawMaterialCategories(updatedCategories || []);

      toast({
        title: mode === "edit" ? "Category Updated" : "Category Added",
        description: `${formData.name} has been saved successfully.`,
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


  // --- INPUT & FILE HANDLERS ---
  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      if (errors.image) setErrors((prev) => ({ ...prev, image: "" }));
    }
  };
  
  const removeImage = () => {
      setFormData(prev => ({ ...prev, image: null}));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? "Edit" : "Add New"} Raw Material Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Fabrics, Hardware"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the material category"
              rows={3}
            />
             {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryImage">Category Image {mode === 'add' && '*'}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {formData.image ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate pr-2">
                    {formData.image instanceof File ? formData.image.name : 'Current Image'}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload category image</span>
                  <input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
             {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === "edit" ? "Update Category" : "Add Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { addProductCategory, fetchAllProductCategories, updateProductCategory } from "@/pages/master/MasterProductCategories";
import { Token as authToken } from "@/hooks/baseUrls";

export interface ProductCategory {
  id: number;
  product_category_name: string;
  product_description: string;
  product_category_image: string;
  product_category_image_public_id: string;
  status: number;
  created_admin_id: number;
  updated_admin_id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

interface ProductCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ProductCategory | null;
  mode?: "add" | "edit";
  setMockProductCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
}

export const ProductCategoryForm = ({ open, onOpenChange, category, mode = "add", setMockProductCategories }: ProductCategoryFormProps) => {
  const { toast } = useToast();

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null | string,
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: "", description: "", image: "" });
  const [loading, setLoading] = useState(false);

  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"];

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.product_category_name || "",
        description: category.product_description || "",
        image: category.product_category_image || null,
      });
    } else {
      // Reset form for add mode
      setFormData({ name: "", description: "", image: null });
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: "", description: "", image: "" });
  }, [category, mode, open]);

  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: "", description: "", image: "" };

    // Category Name: At least 3 characters, allows letters, numbers, spaces, and ampersands
    if (!/^[A-Za-z0-9\s&]{3,}$/.test(formData.name)) {
      newErrors.name = "Name must be at least 3 characters long.";
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
        response = await addProductCategory({
          productCategoryName: formData.name,
          productDescription: formData.description,
          productCategoryImage: formData.image as File, // Validated to be a file
          token: authToken,
        });
      } else if (category) {
        response = await updateProductCategory({
          categoryId: category.id,
          productCategoryName: formData.name,
          productDescription: formData.description,
          // Only send the image if it's a new file upload
          productCategoryImage: formData.image instanceof File ? formData.image : undefined,
          token: authToken,
        });
      }
      
      if (response?.errFlag !== 0) {
        throw new Error(response?.message || "Failed to save the category.");
      }

      // Refresh parent state
      const updatedCategories = await fetchAllProductCategories(authToken);
      setMockProductCategories(updatedCategories);

      toast({
        title: mode === "edit" ? "Category Updated" : "Category Added",
        description: `${formData.name} has been saved successfully.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
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
      setFormData(prev => ({...prev, [field]: value}));
      if(errors[field]) {
          setErrors(prev => ({...prev, [field]: ""}));
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      if(errors.image) setErrors(prev => ({...prev, image: ""}));
    }
  };
  
  const removeImage = () => {
      setFormData(prev => ({...prev, image: null}));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add New'} Product Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Backpacks, Handbags"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the product category"
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
                      {typeof formData.image === 'string' ? 'Current Image' : formData.image.name}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload category image</span>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
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
                {loading ? 'Saving...' : `${mode === 'edit' ? 'Update' : 'Add'} Category`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

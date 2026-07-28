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
import { Upload, X } from "lucide-react";
import { addBrand, fetchBrands, updateBrand } from "@/pages/master/MasterBrands";
// import { Token as authToken } from "@/hooks/baseUrls";

interface Brand {
  id: number;
  brand_name: string;
  brand_logo: string;
  brand_logo_public_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  created_admin_id: number;
  updated_admin_id: number | null;
  brand_code?: string;
}

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
  mode?: "add" | "edit";
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
}

export const BrandForm = ({
  open,
  onOpenChange,
  brand,
  mode = "add",
  setBrands,
}: BrandFormProps) => {
  const { toast } = useToast();
  
  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    logo: null as File | null,
  });

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState({ name: "", code: "", logo: "" });
  const [loading, setLoading] = useState(false);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"];

  // Pre-fill form in edit mode
  useEffect(() => {
    if (brand && mode === "edit") {
      setFormData({
        name: brand.brand_name,
        code: brand.brand_code || "",
        logo: null,
      });
      setExistingLogoUrl(brand.brand_logo);
    } else {
      // Reset form for add mode
      setFormData({ name: "", code: "", logo: null });
      setExistingLogoUrl(null);
    }
    // Clear validation errors when the dialog opens or mode changes
    setErrors({ name: "", code: "", logo: "" });
  }, [brand, mode, open]);


  // --- VALIDATION LOGIC WITH REGEX ---
  const validateForm = () => {
    const newErrors = { name: "", code: "", logo: "" };

    // Brand Name: At least 2 characters, allows letters, numbers, spaces, and some symbols.
    if (!/^[A-Za-z0-9\s&-]{2,}$/.test(formData.name)) {
      newErrors.name = "Brand name must be at least 2 characters long.";
    }
    // Brand Code: 2 to 5 uppercase letters only.
    if (!/^[A-Z]{2,5}$/.test(formData.code)) {
      newErrors.code = "Brand code must be 2-5 uppercase letters (e.g., UE, NIKE).";
    }
    // Logo: Required for new brands.
    if (mode === "add" && !formData.logo) {
      newErrors.logo = "Brand logo is required.";
    }
    // File type validation if a new logo is selected
    if (formData.logo && !allowedTypes.includes(formData.logo.type)) {
      newErrors.logo = "Invalid file type. Please use PNG, JPG, GIF, or WEBP.";
    }

    setErrors(newErrors);
    // Return true if all error messages are empty strings
    return Object.values(newErrors).every(error => error === "");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        toast({
            title: "Validation Error",
            description: "Please check the form for errors and try again.",
            variant: "destructive"
        });
        return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("token");
      let response;
      if (mode === "add") {
        response = await addBrand({
          brandName: formData.name,
          brandLogo: formData.logo!, // Not null due to validation
          brandCode: formData.code,
          token: authToken,
        });
      } else if (brand) {
        response = await updateBrand({
          brandId: brand.id,
          brandName: formData.name,
          brandLogo: formData.logo, // Send new file or null if not changed
          brandCode: formData.code,
          token: authToken,
        });
      }

      if (response?.errFlag !== 0) {
        throw new Error(response?.message || "Failed to save brand.");
      }

      // Refresh the brand list in the parent component
      const brandsData = await fetchBrands(authToken);
      setBrands(brandsData);

      toast({
        title: mode === "edit" ? "Brand Updated" : "Brand Added",
        description: `${formData.name || brand?.brand_name} has been saved successfully.`,
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
  const handleInputChange = (field: 'name' | 'code', value: string) => {
    // Convert brand code to uppercase as the user types
    const processedValue = field === 'code' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    // Clear the error for the specific field when the user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
      if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({...prev, logo: null}));
    setExistingLogoUrl(null); // Also remove existing logo preview if present
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input id="brandName" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter brand name" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandCode">Brand Code *</Label>
              <Input id="brandCode" value={formData.code} maxLength={5} onChange={(e) => handleInputChange("code", e.target.value)} placeholder="e.g., UE, NIKE" />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandLogo">Brand Logo {mode === 'add' && '*'}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {formData.logo || existingLogoUrl ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate pr-2">
                    {formData.logo?.name || 'Current Logo'}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="logoUpload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload brand logo</span>
                  <input id="logoUpload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
            {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update Brand" : "Add Brand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

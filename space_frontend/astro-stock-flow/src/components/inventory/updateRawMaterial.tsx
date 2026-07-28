import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactSelect from "react-select";
import StorageLocationMultiSelect from "@/pages/StorageLocationMultiSelect ";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Image } from "lucide-react";
import axios from "axios";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";
import { getAllRawMaterials, updateRawMaterial } from "@/pages/RawMaterials";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type OptionType = {
  id: number | string;
  name: string;
};

interface UpdateRawMaterialFormProps {
  rawMaterial: any; // object of the material to update
  onSuccess: () => void;
  setMockRawMaterials: React.Dispatch<React.SetStateAction<any[]>>;
  isEditMaterialDialogOpen: boolean;
  setIsEditMaterialDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function UpdateRawMaterialForm({
  rawMaterial,
  onSuccess,
  setMockRawMaterials,
  isEditMaterialDialogOpen,
  setIsEditMaterialDialogOpen,
}: UpdateRawMaterialFormProps) {
  console.log(rawMaterial);
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // Component States
  const [formData, setFormData] = useState({
    materialId: "",
    name: "",
    category: "",
    vendorIds: [] as string[],
    unitOfMeasure: "",
    unitCost: "",
    minStockLevel: "",
    maxStockLevel: "",
    storageLocation: "",
    description: "",
    specifications: "",
    stockQty: "",
  });

  // ✅ State to hold validation error messages for each field
  const [errors, setErrors] = useState({
    materialId: "",
    name: "",
    category: "",
    vendorIds: "",
    unitOfMeasure: "",
    unitCost: "",
    minStockLevel: "",
    maxStockLevel: "",
    storageLocation: "",
    description: "",
    specifications: "",
    stockQty: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [locations, setLocations] = useState<OptionType[]>([]);
  const [vendors, setVendors] = useState<OptionType[]>([]);
  const [units, setUnits] = useState<OptionType[]>([]);

  console.log(rawMaterial);

  // Effect to pre-fill form data when the dialog opens or the material data changes
  useEffect(() => {
    if (rawMaterial) {
      setFormData({
        materialId: rawMaterial?.material_code || "",
        name: rawMaterial?.material_name || "",
        category: rawMaterial?.raw_material_category_id || "",
        // Parse existing vendor_ids string into array
        vendorIds: rawMaterial?.vendor_ids
          ? rawMaterial.vendor_ids.split(",").map((s: string) => s.trim())
          : [],
        unitOfMeasure: rawMaterial?.unit_of_measure || "",
        unitCost: rawMaterial?.unit_cost || "",
        minStockLevel: rawMaterial?.min_stock_level || "",
        maxStockLevel: rawMaterial?.max_stock_level || "",
        storageLocation: rawMaterial?.storage_location_id || "",
        description: rawMaterial?.material_description || "",
        specifications: rawMaterial?.specification || "",
        stockQty: rawMaterial?.stock_qty || "0",
      });
      // Clear any previous images and validation errors when a new material is loaded
      setSelectedImages([]);
      setErrors({
        materialId: "",
        name: "",
        category: "",
        vendorIds: "",
        unitOfMeasure: "",
        unitCost: "",
        minStockLevel: "",
        maxStockLevel: "",
        storageLocation: "",
        description: "",
        specifications: "",
        stockQty: "",
      });
    }
  }, [rawMaterial, isEditMaterialDialogOpen]);

  // console.log(formData);

  // ✅ Centralized validation function with Regex
  const validateForm = () => {
    const newErrors: any = {};

    // Material ID: Must be 1-10 chars, starting with letters followed by numbers (e.g., RM001 or RM-001).
    // This regex checks for a pattern like 'RM-002' or 'RM002'.
    if (!/^(?=.{1,10}$)[A-Z]+-?\d+$/i.test(formData.materialId.trim())) {
      newErrors.materialId = "ID must be 1-10 chars, like 'RM001' or 'RM-001'.";
    }
    // Material Name: Must not be empty.
    if (!formData.name.trim()) {
      newErrors.name = "Material Name is required.";
    }
    // Dropdown selections: Must have a value.
    if (!formData.category) newErrors.category = "Please select a Category.";
    // if (!formData.vendorIds || formData.vendorIds.length === 0) newErrors.vendorIds = "Please select at least one Vendor.";
    if (!formData.unitOfMeasure)
      newErrors.unitOfMeasure = "Please select a Unit of Measure.";
    if (!formData.storageLocation)
      newErrors.storageLocation = "Please select a Storage Location.";
    // Unit Cost: Must be a positive number.
    if (Number(formData.unitCost) <= 0) {
      newErrors.unitCost = "Unit Cost must be a positive number.";
    }
    // Min Stock Level: Must be a non-negative number.
    if (Number(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = "Minimum Stock cannot be negative.";
    }
    // Max Stock Level: Must be a positive number and greater than or equal to the minimum.
    if (Number(formData.maxStockLevel) <= 0) {
      newErrors.maxStockLevel = "Maximum Stock must be a positive number.";
    } else if (
      Number(formData.minStockLevel) > Number(formData.maxStockLevel)
    ) {
      newErrors.maxStockLevel =
        "Maximum must be greater than or equal to Minimum Stock.";
    }
    // Text areas: Must not be empty.
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }
    if (!formData.specifications.trim()) {
      newErrors.specifications = "Specifications are required.";
    }
    // Stock Qty: Must be a non-negative number.
    if (Number(formData.stockQty) < 0) {
      newErrors.stockQty = "Stock Quantity cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Run validation before proceeding
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
      const res = await updateRawMaterial({
        materialId: rawMaterial.id,
        materialCode: formData.materialId,
        materialName: formData.name,
        materialDescription: formData.description,
        rawMaterialCategoryId: formData.category,
        vendorIds: formData.vendorIds.join(","), // Join array back to string for API
        specification: formData.specifications,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        unitOfMeasure: formData.unitOfMeasure,
        storageLocation: formData.storageLocation,
        unitCost: formData.unitCost,
        stockQty: formData.stockQty,
        // If new images are selected, send the first one. Otherwise, send the existing image URL.
        materialImage:
          selectedImages.length > 0
            ? selectedImages[0]
            : rawMaterial.raw_material_image,
        token,
      });

      if (res.errFlag !== 0) {
        throw new Error(res.message || "Failed to update raw material.");
      }

      // On success, refresh the main list, show a toast, and close the dialog.
      const updatedMaterials = await getAllRawMaterials(token);
      setMockRawMaterials(updatedMaterials);

      toast({
        title: "Updated Successfully",
        description: `${formData.name} has been updated.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Generic input handler that also clears errors on change
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for the field being edited
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field as keyof typeof errors]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch dropdown data when the component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, locRes, vendorRes, unitRes] = await Promise.all([
          axios.get(
            `${API_BASE}/raw-material-categories/get-categories/${token}`,
          ),
          axios.get(`${API_BASE}/locations/get-all/${token}`),
          axios.get(`${API_BASE}/vendors/get-vendors/${token}`),
          axios.get(`${API_BASE}/units/get-units/${token}`),
        ]);
        setCategories(
          catRes.data?.map((c: any) => ({ id: c.id, name: c.category_name })) ||
            [],
        );
        setLocations(
          locRes.data?.map((l: any) => ({
            id: l.id,
            name: l.location_label,
          })) || [],
        );
        setVendors(
          vendorRes.data
            // First, filter to only include items where status is 1
            ?.filter((v: any) => v.status === 1)
            // Then, map the filtered array to the desired shape
            .map((v: any) => ({
              id: v.id,
              name: v.vendor_name,
              // You can also include status if you need it later
              status: v.status,
            })) || [],
        );
        setUnits(
          unitRes.data?.map((u: any) => ({ id: u.id, name: u.unit_name })) ||
            [],
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch required data for dropdowns.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [token, toast]);

  return (
    <Dialog
      open={isEditMaterialDialogOpen}
      onOpenChange={setIsEditMaterialDialogOpen}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Raw Material</DialogTitle>
          <DialogDescription>
            Update the details for "{rawMaterial?.material_name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* --- JSX with conditional error rendering for each field --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materialId">Material ID *</Label>
              <Input
                id="materialId"
                placeholder="e.g., RM-001"
                value={formData.materialId}
                onChange={(e) =>
                  handleInputChange("materialId", e.target.value)
                }
              />
              {errors.materialId && (
                <p className="text-red-500 text-sm mt-1">{errors.materialId}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Genuine Leather"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category?.toString()}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <ReactSelect
                isMulti
                options={vendors.map((v) => ({
                  value: v.id.toString(),
                  label: v.name,
                }))}
                value={vendors
                  .filter((v) => formData.vendorIds.includes(v.id.toString()))
                  .map((v) => ({ value: v.id.toString(), label: v.name }))}
                onChange={(selectedOptions) =>
                  handleInputChange(
                    "vendorIds",
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [],
                  )
                }
                placeholder="Select vendors"
              />
              {errors.vendorIds && (
                <p className="text-red-500 text-sm mt-1">{errors.vendorIds}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
              <Select
                value={formData.unitOfMeasure?.toString()}
                onValueChange={(value) =>
                  handleInputChange("unitOfMeasure", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.name.toString()}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitOfMeasure && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.unitOfMeasure}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g., 450"
                value={formData.unitCost}
                onChange={(e) => handleInputChange("unitCost", e.target.value)}
              />
              {errors.unitCost && (
                <p className="text-red-500 text-sm mt-1">{errors.unitCost}</p>
              )}
            </div>
            <div className="space-y-2">
              <StorageLocationMultiSelect
                locations={locations}
                formData={formData}
                handleInputChange={handleInputChange}
              />
              {errors.storageLocation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.storageLocation}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Minimum Stock Level *</Label>
              <Input
                type="number"
                placeholder="e.g., 50"
                value={formData.minStockLevel}
                onChange={(e) =>
                  handleInputChange("minStockLevel", e.target.value)
                }
              />
              {errors.minStockLevel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.minStockLevel}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStockLevel">Maximum Stock Level *</Label>
              <Input
                type="number"
                placeholder="e.g., 300"
                value={formData.maxStockLevel}
                onChange={(e) =>
                  handleInputChange("maxStockLevel", e.target.value)
                }
              />
              {errors.maxStockLevel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.maxStockLevel}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQty">Current Stock *</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g., 100"
                value={formData.stockQty}
                onChange={(e) => handleInputChange("stockQty", e.target.value)}
              />
              {errors.stockQty && (
                <p className="text-red-500 text-sm mt-1">{errors.stockQty}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              placeholder="Brief description of the raw material"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications *</Label>
            <Textarea
              placeholder="Technical specs, quality standards, etc."
              value={formData.specifications}
              onChange={(e) =>
                handleInputChange("specifications", e.target.value)
              }
            />
            {errors.specifications && (
              <p className="text-red-500 text-sm mt-1">
                {errors.specifications}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Update Material Images (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <label
                htmlFor="images-update"
                className="cursor-pointer text-center block"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload new images to replace the existing one
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2" />
                    Choose Images
                  </span>
                </Button>
                <Input
                  id="images-update"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedImages.map((file, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg p-2 bg-muted/50 flex items-center gap-2"
                  >
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length === 0 && rawMaterial?.raw_material_image && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Current Image:
                </p>
                <div className="h-32 w-32 relative rounded-md overflow-hidden border">
                  <img
                    src={rawMaterial.raw_material_image}
                    alt="Current Material"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Raw Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

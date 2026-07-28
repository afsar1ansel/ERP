import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactSelect from "react-select";
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
import { addRawMaterial, getAllRawMaterials } from "@/pages/RawMaterials";
import StorageLocationMultiSelect from "@/pages/StorageLocationMultiSelect ";

interface AddRawMaterialFormProps {
  onSuccess: () => void;
  setMockRawMaterials: React.Dispatch<React.SetStateAction<any[]>>;
}

type OptionType = {
  id: number | string;
  name: string;
};

export function AddRawMaterialForm({
  onSuccess,
  setMockRawMaterials,
}: AddRawMaterialFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // State for form data
  const [formData, setFormData] = useState({
    materialId: "",
    name: "",
    category: "",
    vendorIds: [] as string[],
    unitOfMeasure: "",
    unitCost: "",
    stockQty: "",
    minStockLevel: "",
    maxStockLevel: "",
    storageLocation: "",
    description: "",
    specifications: "",
  });

  // ✅ State to hold validation error messages for each field
  const [errors, setErrors] = useState({
    materialId: "",
    name: "",
    category: "",
    vendorIds: "",
    stockQty: "",
    unitOfMeasure: "",
    unitCost: "",
    minStockLevel: "",
    maxStockLevel: "",
    storageLocation: "",
    description: "",
    specifications: "",
    images: "",
  });

  // State for dropdown options and other UI elements
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [locations, setLocations] = useState<OptionType[]>([]);
  const [vendors, setVendors] = useState<OptionType[]>([]);
  const [units, setUnits] = useState<OptionType[]>([]);

  // ✅ Centralized validation function
  const validateForm = () => {
    const newErrors: any = {};

    // Material ID: Must be like RM-001, RM001. Allows letters, numbers, hyphens.
    if (!/^[A-Z0-9-]{3,}$/i.test(formData.materialId)) {
      newErrors.materialId =
        "Material ID must be at least 3 characters long and can contain letters, numbers, and hyphens.";
    }
    // Material Name: Cannot be empty.
    if (!formData.name.trim()) {
      newErrors.name = "Material Name is required.";
    }
    // Selections: Must choose an option.
    if (!formData.category) newErrors.category = "Please select a Category.";
    // if (!formData.vendor) newErrors.vendor = "Please select a Vendor.";
    if (!formData.unitOfMeasure)
      newErrors.unitOfMeasure = "Please select a Unit of Measure.";
    if (!formData.storageLocation)
      newErrors.storageLocation =
        "Please select at least one Storage Location.";

    // Regex to ensure only positive numbers (including decimals)
    const positiveNumberRegex = /^(?!0\d)\d*(\.\d+)?$/;

    // Numerical fields with regex validation
    if (!positiveNumberRegex.test(formData.unitCost)) {
      newErrors.unitCost = "Unit Cost must be a valid positive number.";
    }

    if (!positiveNumberRegex.test(formData.stockQty)) {
      newErrors.stockQty = "Stock Quantity must be a valid positive number.";
    }

    if (!positiveNumberRegex.test(formData.minStockLevel)) {
      newErrors.minStockLevel = "Minimum Stock cannot be negative or invalid.";
    }

    if (!positiveNumberRegex.test(formData.maxStockLevel)) {
      newErrors.maxStockLevel =
        "Maximum Stock must be a valid positive number.";
    }

    // Logical validation
    if (Number(formData.minStockLevel) > Number(formData.maxStockLevel)) {
      newErrors.maxStockLevel =
        "Maximum Stock must be greater than or equal to Minimum Stock.";
    }

    // Text areas
    if (!formData.description.trim())
      newErrors.description = "Description is required.";
    if (!formData.specifications.trim())
      newErrors.specifications = "Specifications are required.";

    // Image Upload
    if (selectedImages.length === 0) {
      newErrors.images = "Please upload at least one image.";
    }

    setErrors(newErrors);
    // Return true if the newErrors object is empty (meaning no errors)
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Run validation before submitting
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description:
          "Please review the form and correct the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await addRawMaterial({
        materialCode: formData.materialId,
        materialName: formData.name,
        materialDescription: formData.description,
        rawMaterialCategoryId: formData.category,
        // Send the vendor IDs as a comma-separated string if that's what your backend expects
        // OR as an array if your backend handles JSON arrays.
        // Based on the user prompt: "vendorIds_str = request.form.get('vendorIds', '')"
        // and "vendorIds = [int(v_id.strip()) for v_id in vendorIds_str.split(',') if v_id.strip()]"
        // we should send a comma-separated string.
        vendorIds: formData.vendorIds.join(","),
        specification: formData.specifications,
        stockQty: formData.stockQty,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        unitOfMeasure: formData.unitOfMeasure,
        storageLocation: formData.storageLocation,
        unitCost: formData.unitCost,
        materialImage: selectedImages[0], // Sending the first image as per API
        token,
      });

      if (res.errFlag !== 0) {
        throw new Error(res.message || "Failed to add raw material.");
      }

      // Refresh the materials list on success
      const updatedMaterials = await getAllRawMaterials(token);
      setMockRawMaterials(updatedMaterials);

      toast({
        title: "Raw Material Added",
        description: `${formData.name} has been successfully added.`,
      });

      // Reset form and images after successful submission
      setFormData({
        materialId: "",
        name: "",
        category: "",
        vendorIds: [],
        unitOfMeasure: "",
        unitCost: "",
        stockQty: "",
        minStockLevel: "",
        maxStockLevel: "",
        storageLocation: "",
        description: "",
        specifications: "",
      });
      setSelectedImages([]);
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

  // ✅ Updated input handler to clear errors on change
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for the specific field when the user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field as keyof typeof errors]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages((prev) => [...prev, ...files]);
    // Clear image error when a new image is selected
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch data for dropdowns
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
        setUnits(
          unitRes.data?.map((u: any) => ({ id: u.id, name: u.unit_name })) ||
            [],
        );
        // setVendors(
        //   vendorRes.data?.map((v: any) => ({
        //     id: v.id,
        //     name: v.vendor_name,
        //   })) || []
        // );
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
    <>
      <DialogDescription>
        Add a new raw material to your inventory with specifications and stock
        levels.
      </DialogDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* --- JSX with conditional error rendering --- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="materialId">Material ID *</Label>
            <Input
              id="materialId"
              placeholder="RM001"
              value={formData.materialId}
              onChange={(e) => handleInputChange("materialId", e.target.value)}
            />
            {errors.materialId && (
              <p className="text-red-500 text-sm mt-1">{errors.materialId}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Material Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Genuine Leather Sheets"
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
              id="vendor"
              isMulti
              options={vendors.map((v) => ({
                value: v.id.toString(),
                label: v.name,
              }))}
              onChange={(selectedOptions) =>
                handleInputChange(
                  "vendorIds",
                  selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [],
                )
              }
              placeholder="Select vendor"
              isClearable
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
              id="unitCost"
              type="number"
              placeholder="450"
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
            <Label htmlFor="stockQty">Current Stock Qty</Label>
            <Input
              id="stockQty"
              type="number"
              placeholder="0"
              value={formData.stockQty}
              onChange={(e) => handleInputChange("stockQty", e.target.value)}
            />
            {errors.stockQty && (
              <p className="text-red-500 text-sm mt-1">{errors.stockQty}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStockLevel">Minimum Stock Level *</Label>
            <Input
              id="minStockLevel"
              type="number"
              placeholder="50"
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
              id="maxStockLevel"
              type="number"
              placeholder="300"
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
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
            id="specifications"
            placeholder="Technical specifications, quality standards, etc."
            value={formData.specifications}
            onChange={(e) =>
              handleInputChange("specifications", e.target.value)
            }
          />
          {errors.specifications && (
            <p className="text-red-500 text-sm mt-1">{errors.specifications}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Material Images *</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <label
              htmlFor="images"
              className="cursor-pointer text-center block"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload images of the raw material
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Image className="h-4 w-4 mr-2" />
                  Choose Images
                </span>
              </Button>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">{errors.images}</p>
          )}

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
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Raw Material"}
          </Button>
        </div>
      </form>
    </>
  );
}

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, X, Plus, Minus, Check, ChevronsUpDown, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/hooks/baseUrls";
import {
  addProductSku,
  getAllProductSKUs,
  updateProductSku,
} from "@/pages/master/MasterProductSKUs";

// --- INTERFACES ---
interface RawMaterial {
  material_name: string;
  quantity: number | string;
  unit: string;
  rawMaterialId?: string;
}
interface ProductSKU {
  id: number;
  product_name: string;
  product_description: string;
  product_image: string;
  brand_id: number;
  product_category_id: number;
  min_stock_level: number; // Added min_stock_level
  labour_freight_charge?: number;
  rawMaterials?: RawMaterial[];
}
interface ProductSKUFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductSKU | null;
  mode?: "add" | "edit" | "duplicate";
  setMockProductSKUs: React.Dispatch<React.SetStateAction<ProductSKU[]>>;
}

export const ProductSKUForm = ({
  open,
  onOpenChange,
  product,
  mode = "add",
  setMockProductSKUs,
}: ProductSKUFormProps) => {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    minStockLevel: 0, // Added minStockLevel
    productDescription: "", // Added productDescription
    labourFreightCharge: 0,
    rawMaterials: [] as RawMaterial[],
    image: null as File | null | string,
  });
  const [isMaximized, setIsMaximized] = useState(false);

  // --- VALIDATION & UI STATES ---
  const [errors, setErrors] = useState<any>({ rawMaterials: [] });
  const [loading, setLoading] = useState(false);

  // --- DROPDOWN DATA STATES ---
  const [brands, setBrands] = useState<{ id: string; brand: string }[]>([]);
  const [categories, setCategories] = useState<
    { id: string; category: string }[]
  >([]);
  const [materialCategories, setMaterialCategories] = useState<
    { id: string; materialCategory: string; stockQty: number }[]
  >([]);
  const [units, setUnits] = useState<{ unit: string }[]>([]);
  const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (product && (mode === "edit" || mode === "duplicate")) {
      const productName =
        mode === "duplicate"
          ? `${product.product_name} (Copy)`
          : product.product_name;

      setFormData({
        name: product.product_name || "",
        brand: String(product.brand_id || ""),
        category: String(product.product_category_id || ""),
        minStockLevel: product.min_stock_level || 0,
        productDescription: product.product_description || "",
        rawMaterials:
          product.rawMaterials?.map((rm: any) => ({
            material_name: rm.material_name,
            quantity: rm.quantity,
            rawMaterialId: String(rm.raw_material_id || ""),
            unit: rm.unit,
          })) || [],
        labourFreightCharge: product.labour_freight_charge || 0,
        image: mode === "duplicate" ? null : product.product_image || null,
      });
    } else {
      // Reset for add mode
      setFormData({
        name: "",
        brand: "",
        category: "",
        minStockLevel: 0,
        productDescription: "",
        rawMaterials: [
          { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
        ],
        labourFreightCharge: 0,
        image: null,
      });
    }
    // Clear errors when dialog opens or mode changes
    setErrors({ rawMaterials: [] });
  }, [product, mode, open]);

  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    const newErrors: any = { rawMaterials: [] };

    if (formData.name.trim().length < 3)
      newErrors.name = "Product name must be at least 3 characters.";
    if (!formData.brand) newErrors.brand = "Please select a brand.";
    if (!formData.category) newErrors.category = "Please select a category.";
    if (formData.minStockLevel < 0)
      newErrors.minStockLevel = "Cannot be negative.";
    if (!formData.image) newErrors.image = "Product image is required.";
    if (formData.rawMaterials.length === 0)
      newErrors.rawMaterialsError = "At least one raw material is required.";

    formData.rawMaterials.forEach((rm, index) => {
      const itemErrors: any = {};
      if (!rm.rawMaterialId) itemErrors.rawMaterialId = "Required.";
      const qtyValue = Number(rm.quantity);
      if (!rm.quantity || qtyValue <= 0) itemErrors.quantity = "Must be > 0.";
      if (!rm.unit) itemErrors.unit = "Required.";

      const selectedMaterial = materialCategories.find(
        (m) => m.id === rm.rawMaterialId,
      );
      if (selectedMaterial && qtyValue > selectedMaterial.stockQty) {
        itemErrors.quantity = `Max stock: ${selectedMaterial.stockQty}`;
      }
      if (Object.keys(itemErrors).length > 0)
        newErrors.rawMaterials[index] = itemErrors;
    });

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 1 &&
      newErrors.rawMaterials.every((e: any) => !e)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productName: formData.name,
        brandId: formData.brand,
        productCategoryId: formData.category,
        minStockLevel: formData.minStockLevel,
        productDescription: formData.productDescription,
        labourFreightCharge: formData.labourFreightCharge,
        productImage: formData.image,
        rawMaterials: formData.rawMaterials.map((rm) => ({
          ...rm,
          quantity: Number(rm.quantity),
        })),
        token,
      };

      if (mode === "add" || mode === "duplicate") {
        await addProductSku(payload);
        toast({
          title: "Success",
          description:
            mode === "duplicate"
              ? "Product SKU duplicated successfully."
              : "Product SKU added successfully.",
        });
      } else if (mode === "edit" && product) {
        await updateProductSku({ ...payload, productId: product.id });
        toast({
          title: "Success",
          description: "Product SKU updated successfully.",
        });
      }

      const updatedSKUs = await getAllProductSKUs(token);
      setMockProductSKUs(updatedSKUs);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting SKU:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to submit SKU.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async (url: string, processor: (data: any) => any) => {
      try {
        const res = await fetch(`${BASE_URL}${url}/${token}`);
        const data = await res.json();
        return processor(data);
      } catch (err) {
        console.error(`Error fetching from ${url}`, err);
        return [];
      }
    };
    Promise.all([
      fetchData("/brands/get-brands", (d) =>
        d.map((b: any) => ({ id: String(b.id), brand: b.brand_name })),
      ),
      fetchData("/product-categories/get-categories", (d) =>
        d.map((c: any) => ({
          id: String(c.id),
          category: c.product_category_name,
        })),
      ),
      fetchData("/raw-materials/get-all", (d) =>
        d.map((m: any) => ({
          id: String(m.id),
          materialCategory: m.material_name,
          stockQty: Number(m.stock_qty),
        })),
      ),
      fetchData("/units/get-units", (d) =>
        d.map((u: any) => ({ unit: u.unit_name })),
      ),
    ]).then(([brandsData, categoriesData, materialsData, unitsData]) => {
      setBrands(brandsData);
      setCategories(categoriesData);
      setMaterialCategories(materialsData);
      setUnits(unitsData);
    });
  }, [token]);

  // --- HANDLERS ---
  const handleInputChange = (
    field: "name" | "brand" | "category" | "productDescription",
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  const handleNumberInputChange = (field: "minStockLevel" | "labourFreightCharge", value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      if (errors.image) setErrors((prev: any) => ({ ...prev, image: "" }));
    }
  };
  const handleMaterialChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedMaterials = [...formData.rawMaterials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setFormData((prev) => ({ ...prev, rawMaterials: updatedMaterials }));

    if (errors.rawMaterials[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors.rawMaterials[index][field];
      if (Object.keys(newErrors.rawMaterials[index]).length === 0)
        newErrors.rawMaterials[index] = undefined;
      setErrors(newErrors);
    }
  };
  const handleMaterialAdd = () =>
    setFormData((prev) => ({
      ...prev,
      rawMaterials: [
        ...prev.rawMaterials,
        { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
      ],
    }));
  const handleMaterialRemove = (index: number) => {
    if (formData.rawMaterials.length > 1) {
      setFormData((prev) => ({
        ...prev,
        rawMaterials: prev.rawMaterials.filter((_, i) => i !== index),
      }));
    }
  };

  const getAvailableMaterials = (currentIndex: number) => {
    const selectedMaterialIds = formData.rawMaterials
      .map((material, index) =>
        index !== currentIndex ? material.rawMaterialId : null,
      )
      .filter(Boolean);

    return materialCategories.filter(
      (material) => !selectedMaterialIds.includes(material.id),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setIsMaximized(false);
    }}>
      <DialogContent 
        className={cn(
          "transition-all duration-300 ease-in-out overflow-y-auto",
          isMaximized 
            ? "sm:max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh]" 
            : "sm:max-w-4xl max-h-[90vh]"
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit"
              : mode === "duplicate"
                ? "Duplicate"
                : "Add New"}
            Product SKU
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-12 top-4 h-8 w-8"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isMaximized ? "Restore" : "Maximize"}
            </span>
          </Button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => handleInputChange("brand", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                value={formData.minStockLevel}
                onChange={(e) =>
                  handleNumberInputChange(
                    "minStockLevel",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="e.g., 10"
              />
              {errors.minStockLevel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.minStockLevel}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description</Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) =>
                handleInputChange("productDescription", e.target.value)
              }
              placeholder="Enter a short description for the product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labourFreightCharge">Freight Charge</Label>
              <Input
                id="labourFreightCharge"
                type="number"
                value={formData.labourFreightCharge}
                onChange={(e) =>
                  handleNumberInputChange(
                    "labourFreightCharge",
                    parseFloat(e.target.value) || 0,
                  )
                }
                placeholder="0.00"
                step="any"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Raw Materials Consumed *</Label>
              <Button
                type="button"
                onClick={handleMaterialAdd}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <ScrollArea 
              className={cn(
                "border rounded-md transition-all duration-300",
                isMaximized ? "h-[calc(100vh-450px)]" : "h-72"
              )}
            >
              <div className="p-3 space-y-3">
                {formData.rawMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No materials added.
                  </p>
                ) : (
                  formData.rawMaterials.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Material</Label>
                        <Popover
                          open={openRowIndex === index}
                          onOpenChange={(open) =>
                            setOpenRowIndex(open ? index : null)
                          }
                          modal={true}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openRowIndex === index}
                              className="w-full justify-between font-normal"
                            >
                              {item.rawMaterialId
                                ? materialCategories.find(
                                    (m) => m.id === item.rawMaterialId,
                                  )?.materialCategory
                                : "Select material..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search material..." />
                              <CommandList className="max-h-[200px] overflow-y-auto">
                                <CommandEmpty>No material found.</CommandEmpty>
                                <CommandGroup>
                                  {getAvailableMaterials(index).map((m) => (
                                    <CommandItem
                                      key={m.id}
                                      value={m.materialCategory}
                                      onSelect={() => {
                                        handleMaterialChange(
                                          index,
                                          "rawMaterialId",
                                          m.id,
                                        );
                                        setOpenRowIndex(null);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.rawMaterialId === m.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {m.materialCategory}
                                    </CommandItem>
                                  ))}
                                  {getAvailableMaterials(index).length ===
                                    0 && (
                                    <CommandItem disabled>
                                      No materials available
                                    </CommandItem>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors.rawMaterials[index]?.rawMaterialId && (
                          <p className="text-red-500 text-xs">
                            {errors.rawMaterials[index].rawMaterialId}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleMaterialChange(
                              index,
                              "quantity",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          min="0"
                          step="any"
                        />
                        {errors.rawMaterials[index]?.quantity && (
                          <p className="text-red-500 text-xs">
                            {errors.rawMaterials[index].quantity}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) =>
                            handleMaterialChange(index, "unit", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u, idx) => (
                              <SelectItem key={idx} value={u.unit}>
                                {u.unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.rawMaterials[index]?.unit && (
                          <p className="text-red-500 text-xs">
                            {errors.rawMaterials[index].unit}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMaterialRemove(index)}
                          disabled={formData.rawMaterials.length <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {errors.rawMaterialsError && (
              <p className="text-red-500 text-sm mt-1">
                {errors.rawMaterialsError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productImage">Product Image *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {formData.image ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground truncate pr-2">
                    {typeof formData.image === "string"
                      ? "Current Image"
                      : formData.image.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: null }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Upload product image
                  </span>
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
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
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
                : `${mode === "edit" ? "Update" : "Add"} Product SKU`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

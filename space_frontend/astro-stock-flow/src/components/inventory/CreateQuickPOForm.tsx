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
import { Minus, Plus } from "lucide-react";
import axios from "axios";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";

interface CreateQuickPOFormProps {
  materialName: string;
  materialId: string;
  vendor: string;
  currentStock: number;
  minStock: number;
  onSuccess: () => void;
}

// 1. UPDATED INTERFACE
interface PurchaseOrderItem {
  rawMaterialId: string;
  alias: string; // <-- ADDED
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Vendor {
  id: string;
  name: string;
}

interface RawMaterial {
  id: string;
  name: string;
}

// 2. UPDATED INITIAL STATE
const initialFormState = {
  vendorId: "",
  expectedDispatchDate: "",
  notes: "",
  items: [
    {
      rawMaterialId: "",
      alias: "", // <-- ADDED
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ],
};

export function CreateQuickPOForm({
  materialName,
  materialId,
  vendor,
  currentStock,
  minStock,
  onSuccess,
}: CreateQuickPOFormProps) {
  const { toast } = useToast();
  const suggestedQuantity = Math.max(minStock * 2 - currentStock, minStock);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("token");
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [formData, setFormData] = useState(initialFormState);

  // 3. UPDATED USE-EFFECT (Added alias)
  // Initialize form with the material that triggered the Quick PO
  useEffect(() => {
    if (materialId) {
      setFormData((prev) => ({
        ...prev,
        items: [
          {
            rawMaterialId: materialId,
            alias: materialName, // <-- ADDED (pre-filled with material name)
            quantity: suggestedQuantity,
            unitPrice: 0,
            total: 0,
          },
        ],
      }));
    }
  }, [materialId, materialName, suggestedQuantity]); // <-- Added materialName dependency

  // Fetch vendors and raw materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Vendors
        const vendorsResponse = await axios.get(
          `${API_BASE}/vendors/get-vendors/${token}`
        );
        const mappedVendors = vendorsResponse.data
          .filter((vendor: any) => vendor.status === 1)
          .map((vendor: any) => ({
            id: String(vendor.id),
            name: vendor.vendor_name.trim(),
          }));
        setVendors(mappedVendors);

        // Fetch Raw Materials
        const materialsResponse = await axios.get(
          `${API_BASE}/raw-materials/get-all/${token}`
        );
        const mappedMaterials = materialsResponse.data
          .filter((material: any) => material.status === 1)
          .map((material: any) => ({
            id: String(material.id),
            name: material.material_name.trim(),
          }));
        setRawMaterials(mappedMaterials);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load required data.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [token, toast]);

  // 4. UPDATED HANDLE ADD ITEM
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          rawMaterialId: "",
          alias: "", // <-- ADDED
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  // This function already supports the 'alias' field dynamically
  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            const qty = field === "quantity" ? Number(value) : item.quantity;
            const price =
              field === "unitPrice" ? Number(value) : item.unitPrice;
            updatedItem.total = qty * price;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - same as CreatePurchaseOrderForm
    if (!formData.vendorId) {
      toast({
        title: "Validation Error",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }
    if (!formData.expectedDispatchDate) {
      toast({
        title: "Validation Error",
        description: "Please select an expected dispatch date",
        variant: "destructive",
      });
      return;
    }

    const invalidItem = formData.items.find(
      (item) => !item.rawMaterialId || item.quantity <= 0 || item.unitPrice < 0
    );
    if (invalidItem) {
      toast({
        title: "Validation Error",
        description:
          "Please ensure all items are selected and have a valid quantity/price.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const payload = new FormData();
    payload.append("vendorId", formData.vendorId);
    payload.append("expectedDispatchDate", formData.expectedDispatchDate);
    payload.append("notes", formData.notes);
    payload.append("token", token || "");

    // 5. UPDATED PAYLOAD
    payload.append(
      "poItems",
      JSON.stringify(
        formData.items.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          alias: item.alias, // <-- ADDED
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total,
        }))
      )
    );

    try {
      const response = await fetch(`${API_BASE}/purchase-orders/add`, {
        method: "POST",
        body: payload,
      });

      const result = await response.json();
      console.log("Create Quick PO response:", result);

      if (!response.ok || result.errFlag === 1) {
        throw new Error(result.message || "An unknown error occurred");
      }

      toast({
        title: "Success",
        description: `Purchase Order created successfully!`,
      });
      setFormData(initialFormState);
      onSuccess();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create purchase order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogDescription>
        Create a quick purchase order for {materialName} (ID: {materialId}) to
        replenish low stock.
      </DialogDescription>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm space-y-1">
            <div>
              <strong>Material:</strong> {materialName}
            </div>
            <div>
              <strong>Current Stock:</strong> {currentStock}
            </div>
            <div>
              <strong>Minimum Level:</strong> {minStock}
            </div>
            <div className="text-destructive">
              <strong>Stock Status:</strong> Below Minimum
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, vendorId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDate">Expected Dispatch Date *</Label>
            <Input
              id="expectedDate"
              type="date"
              value={formData.expectedDispatchDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  expectedDispatchDate: e.target.value,
                }))
              }
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Items</Label>
            <Button
              type="button"
              onClick={handleAddItem}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              // 6. UPDATED JSX AND GRID LAYOUT
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg"
              >
                {/* ====== RAW MATERIAL (GRID UPDATED) ====== */}
                <div className="col-span-3">
                  {" "}
                  {/* <-- WAS col-span-5 */}
                  <Label className="text-xs">Raw Material *</Label>
                  <Select
                    value={item.rawMaterialId}
                    onValueChange={(value) =>
                      handleItemChange(index, "rawMaterialId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ====== ALIAS (NEW FIELD) ====== */}
                <div className="col-span-3">
                  {" "}
                  {/* <-- NEW */}
                  <Label className="text-xs">Alias</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 'Main Zipper'"
                    value={item.alias}
                    onChange={(e) =>
                      handleItemChange(index, "alias", e.target.value)
                    }
                  />
                </div>

                {/* ====== QUANTITY (GRID UPDATED) ====== */}
                <div className="col-span-2">
                  {" "}
                  {/* <-- WAS col-span-2 */}
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    required
                  />
                </div>

                {/* ====== UNIT PRICE (GRID UPDATED) ====== */}
                <div className="col-span-2">
                  {" "}
                  {/* <-- WAS col-span-2 */}
                  <Label className="text-xs">Unit Price *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>

                {/* ====== TOTAL (GRID UPDATED) ====== */}
                <div className="col-span-1">
                  {" "}
                  {/* <-- WAS col-span-2 */}
                  <Label className="text-xs">Total</Label>
                  <Input
                    value={`₹${item.total.toFixed(2)}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                {/* ====== REMOVE BUTTON (GRID UPDATED) ====== */}
                <div className="col-span-1 flex items-center">
                  {" "}
                  {/* <-- WAS col-span-1 */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={
                      formData.items.length === 1 &&
                      item.rawMaterialId === materialId
                    }
                    className="p-2 h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <div className="text-lg font-semibold">
              Grand Total: ₹{calculateGrandTotal().toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes or special instructions..."
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()} // Changed this to just call onSuccess to close dialog
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </>
  );
}

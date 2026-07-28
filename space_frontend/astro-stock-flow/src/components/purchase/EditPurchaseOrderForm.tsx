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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import { format } from "date-fns";

// Interface for the data passed into the form
interface PurchaseOrderProp {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  expectedDispatchDate: string;
  actualDispatchDate?: string;
  totalAmount: number;
  status: "pending" | "partial" | "completed" | "overdue";
  notes?: string;
  items: {
    id: string;
    description: string;
    alias?: string;
    quantity: number;
    receivedQuantity: number;
    unitPrice: number;
    status: "pending" | "partial" | "completed";
  }[];
}

// Interface for the form's internal state, using IDs
interface FormData {
  id: string;
  poNumber: string;
  vendorId: string;
  expectedDispatchDate: string;
  notes: string;
  items: {
    rawMaterialId: string;
    alias: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface EditPurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrderProp | null;
  onSuccess: () => void;
}

interface Vendor {
  id: string;
  name: string;
}
interface RawMaterial {
  id: string;
  name: string;
}

export const EditPurchaseOrderForm = ({
  open,
  onOpenChange,
  purchaseOrder,
  onSuccess,
}: EditPurchaseOrderFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("token");
  console.log(purchaseOrder);

  // Fetch vendors and raw materials when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [vendorsRes, materialsRes] = await Promise.all([
            fetch(`${BASE_URL}/vendors/get-vendors/${token}`),
            fetch(`${BASE_URL}/raw-materials/get-all/${token}`),
          ]);
          if (!vendorsRes.ok) throw new Error("Failed to fetch vendors");
          if (!materialsRes.ok)
            throw new Error("Failed to fetch raw materials");

          const vendorsData = await vendorsRes.json();
          const materialsData = await materialsRes.json();

          setVendors(
            vendorsData
              .filter((v: any) => v.status === 1)
              .map((v: any) => ({
                id: String(v.id),
                name: v.vendor_name.trim(),
              }))
          );
          setRawMaterials(
            materialsData
              .filter((m: any) => m.status === 1)
              .map((m: any) => ({
                id: String(m.id),
                name: m.material_name.trim(),
              }))
          );
        } catch (error) {
          toast({
            title: "Error",
            description: "Could not load required data.",
            variant: "destructive",
          });
        }
      };
      fetchData();
    }
  }, [open, toast, token]);

  // Effect to map incoming purchaseOrder prop to formData with IDs
  useEffect(() => {
    if (purchaseOrder && vendors.length > 0 && rawMaterials.length > 0) {
      // Find the vendor ID from the name
      const vendor = vendors.find((v) => v.name === purchaseOrder.vendorName);

      const initialFormData: FormData = {
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        vendorId: vendor ? vendor.id : "",
        expectedDispatchDate: purchaseOrder.expectedDispatchDate
          ? format(new Date(purchaseOrder.expectedDispatchDate), "yyyy-MM-dd")
          : "",
        notes: purchaseOrder.notes || "",
        items: purchaseOrder.items.map((item) => {
          // Find the raw material ID from the description
          const material = rawMaterials.find((m) => m.id === item.id);
          return {
            rawMaterialId: material ? material.id : "",
            alias: item.alias || "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          };
        }),
      };
      setFormData(initialFormData);
    }
  }, [purchaseOrder, vendors, rawMaterials]);

  const handleItemChange = (
    index: number,
    field: keyof FormData["items"][0],
    value: string | number
  ) => {
    if (!formData) return;
    setFormData((prev) => {
      if (!prev) return null;
      const newItems = [...prev.items];
      (newItems[index] as any)[field] = value;
      return { ...prev, items: newItems };
    });
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;
  const calculateGrandTotal = () =>
    formData?.items.reduce(
      (sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice),
      0
    ) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // --- Validation ---
    if (!formData.vendorId) {
      toast({
        title: "Validation Error",
        description: "Please select a vendor.",
        variant: "destructive",
      });
      return;
    }
    if (
      formData.items.some((item) => !item.rawMaterialId || item.quantity <= 0)
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please select a material and enter a valid quantity for all items.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // --- Construct API Payload ---
    // const payload = {
    //   poId: formData.id,
    //   vendorId: formData.vendorId,
    //   expectedDispatchDate: formData.expectedDispatchDate,
    //   notes: formData.notes,
    //   poItems: formData.items.map((item) => ({
    //     description: item.rawMaterialId, // Send ID as description
    //     quantity: item.quantity,
    //     unitPrice: item.unitPrice,
    //     totalPrice: calculateItemTotal(item.quantity, item.unitPrice),
    //   })),
    //   token: token,
    // };
    const payload = new FormData();
    payload.append("poId", formData.id);
    payload.append("vendorId", formData.vendorId);
    payload.append("expectedDispatchDate", formData.expectedDispatchDate);
    payload.append("notes", formData.notes);
    payload.append("token", token || "");
    payload.append(
      "poItems",
      JSON.stringify(
        formData.items.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          alias: item.alias,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: calculateItemTotal(item.quantity, item.unitPrice),
        }))
      )
    );
    console.log(Object.fromEntries(payload));
    payload.forEach((value, key) => {
      console.log(key + ": " + value);
    });

    try {
      const response = await fetch(`${BASE_URL}/purchase-orders/update`, {
        method: "POST",
        body: payload,
      });
      const result = await response.json();
      console.log(result)
      if (!response.ok || result.errFlag === 1) {
        throw new Error(result.message || "Failed to update purchase order");
      }
      toast({
        title: "Success",
        description: `PO ${formData.poNumber} updated successfully!`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) return null; // Render nothing until form data is ready

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Purchase Order - {formData.poNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) =>
                  setFormData((prev) =>
                    prev ? { ...prev, vendorId: value } : null
                  )
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
                  setFormData((prev) =>
                    prev
                      ? { ...prev, expectedDispatchDate: e.target.value }
                      : null
                  )
                }
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg"
              >
                <div className="col-span-3">
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
                <div className="col-span-3">
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
                <div className="col-span-2">
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
                <div className="col-span-2">
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
                <div className="col-span-1">
                  <Label className="text-xs">Total</Label>
                  <Input
                    value={`₹${calculateItemTotal(
                      item.quantity,
                      item.unitPrice
                    ).toFixed(2)}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-1 flex items-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {}}
                    disabled
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) =>
                  prev ? { ...prev, notes: e.target.value } : null
                )
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Purchase Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

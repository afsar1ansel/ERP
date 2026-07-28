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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import { Form } from "react-router-dom";

// 1. UPDATED INTERFACE
interface PurchaseOrderItem {
  rawMaterialId: string;
  alias: string; // <-- ADDED
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreatePurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback to refresh the table data after success
}

interface Vendor {
  id: string;
  name: string;
}

// New interface for Raw Materials
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
    { rawMaterialId: "", alias: "", quantity: 1, unitPrice: 0, total: 0 }, // <-- UPDATED
  ],
};

export const CreatePurchaseOrderForm = ({
  open,
  onOpenChange,
  onSuccess,
}: CreatePurchaseOrderFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormState);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]); // State for raw materials
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  // Fetch vendors and raw materials when the dialog is opened
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          // Fetch Vendors
          const vendorsResponse = await fetch(
            `${BASE_URL}/vendors/get-vendors/${token}`,
          );
          if (!vendorsResponse.ok) throw new Error("Failed to fetch vendors");
          const vendorsData = await vendorsResponse.json();
          const mappedVendors = vendorsData
            .filter((vendor: any) => vendor.status === 1)
            .map((vendor: any) => ({
              id: String(vendor.id),
              name: vendor.vendor_name.trim(),
            }));
          setVendors(mappedVendors);

          // Fetch Raw Materials
          const materialsResponse = await fetch(
            `${BASE_URL}/raw-materials/get-all/${token}`,
          );
          if (!materialsResponse.ok)
            throw new Error("Failed to fetch raw materials");
          const materialsData = await materialsResponse.json();
          const mappedMaterials = materialsData
            .filter((material: any) => material.status === 1)
            .map((material: any) => ({
              id: String(material.id),
              name: material.material_name.trim(),
            }));
          setRawMaterials(mappedMaterials);
        } catch (error) {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Could not load required data.",
            variant: "destructive",
          });
        }
      };
      fetchData();
    }
  }, [open, toast, token]);

  // 3. UPDATED HANDLE ADD ITEM
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { rawMaterialId: "", alias: "", quantity: 1, unitPrice: 0, total: 0 }, // <-- UPDATED
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
    value: string | number,
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

    // --- Validation ---
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
    // Updated validation to check for rawMaterialId
    const invalidItem = formData.items.find(
      (item) => !item.rawMaterialId || item.quantity <= 0 || item.unitPrice < 0,
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
    // console.log(typeof formData.vendorId);
    payload.append("vendorId", formData.vendorId);
    payload.append("expectedDispatchDate", formData.expectedDispatchDate);
    payload.append("notes", formData.notes);
    payload.append("token", token || "");

    // 4. UPDATED PAYLOAD
    payload.append(
      "poItems",
      JSON.stringify(
        formData.items.map((item) => ({
          rawMaterialId: item.rawMaterialId,
          alias: item.alias, // <-- ADDED
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total,
        })),
      ),
    );
    // console.log({ payload });
    // payload.forEach((value, key) => {
    //   console.log(key + ": " + value);
    // });

    try {
      const response = await fetch(`${BASE_URL}/purchase-orders/add`, {
        method: "POST",
        body: payload,
      });

      const result = await response.json();
      console.log("Create PO response:", result);
      if (!response.ok || result.errFlag === 1) {
        throw new Error(result.message || "An unknown error occurred");
      }

      toast({
        title: "Success",
        description: `Purchase Order created successfully!`,
      });
      setFormData(initialFormState);
      onSuccess();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                // 5. UPDATED JSX AND GRID LAYOUT
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg"
                >
                  <div className="col-span-3">
                    <Label className="text-xs">Raw Material *</Label>
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
                            ? rawMaterials.find(
                                (material) =>
                                  material.id === item.rawMaterialId,
                              )?.name
                            : "Select a material"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search material..." />
                          <CommandList className="max-h-[200px] overflow-y-auto">
                            <CommandEmpty>No material found.</CommandEmpty>
                            <CommandGroup>
                              {rawMaterials.map((material) => (
                                <CommandItem
                                  key={material.id}
                                  value={material.name}
                                  onSelect={() => {
                                    handleItemChange(
                                      index,
                                      "rawMaterialId",
                                      material.id,
                                    );
                                    setOpenRowIndex(null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      item.rawMaterialId === material.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {material.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      required
                    />
                  </div>

                  {/* ====== UNIT PRICE (GRID UPDATED) ====== */}
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
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      required
                    />
                  </div>

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
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

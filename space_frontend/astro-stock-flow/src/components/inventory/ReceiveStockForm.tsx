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
import { X, Upload, Image, Plus, Minus } from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";

interface ReceiveStockFormProps {
  onSuccess: () => void;
  existingMaterials: any[];
  scannedPOId?: string | null; // Add this
}

interface StockItem {
  materialId: string;
  materialName: string;
  currentStock: number;
  receivedQuantity: string;
  unitCost: string;
  batchNumber: string;
  expiryDate: string;
}

interface Vendor {
  id: string | number;
  vendor_name: string;
}

interface Employee {
  id: string | number;
  name: string;
}

export function ReceiveStockForm({
  existingMaterials,
  onSuccess,
  scannedPOId, // Add this
}: ReceiveStockFormProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("token") || "";
  console.log(existingMaterials);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    grnNumber: "",
    vendor: "",
    purchaseOrder: "", // Will store only the ID of the PO
    invoiceNumber: "",
    invoiceDate: "",
    receivedDate: new Date().toISOString().split("T")[0],
    transportDetails: "",
    receivedBy: "",
    notes: "",
  });

  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      materialId: "",
      materialName: "",
      currentStock: 0,
      receivedQuantity: "",
      unitCost: "",
      batchNumber: "",
      expiryDate: "",
    },
  ]);

  // --- VALIDATION AND UI STATES ---
  const [errors, setErrors] = useState<any>({ stockItems: [] });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoOrder, setSelectedPoOrder] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);

  // --- VALIDATION LOGIC ---
  const validate = () => {
    const newErrors: any = { stockItems: [] };
    const today = new Date().toISOString().split("T")[0];

    // Main form validation
    if (!/^[A-Z]{3,}-\d{4}-\d{3,}$/i.test(formData.grnNumber))
      newErrors.grnNumber = "GRN must be in the format 'GRN-YYYY-NNN'.";
    if (!formData.vendor) newErrors.vendor = "Please select a vendor.";
    if (!/^[A-Z0-9-]+$/i.test(formData.invoiceNumber))
      newErrors.invoiceNumber =
        "Invoice number can only contain letters, numbers, and hyphens.";
    if (!formData.invoiceDate)
      newErrors.invoiceDate = "Invoice date is required.";
    else if (formData.invoiceDate > today)
      newErrors.invoiceDate = "Invoice date cannot be in the future.";
    if (!formData.receivedDate)
      newErrors.receivedDate = "Received date is required.";
    else if (formData.receivedDate > today)
      newErrors.receivedDate = "Received date cannot be in the future.";
    if (!formData.receivedBy)
      newErrors.receivedBy = "Please select who received the stock.";

    // Stock items validation
    stockItems.forEach((item, index) => {
      const itemErrors: any = {};
      if (!item.materialId) itemErrors.materialId = "Material is required.";
      if (Number(item.receivedQuantity) <= 0)
        itemErrors.receivedQuantity = "Must be > 0.";
      if (Number(item.unitCost) <= 0) itemErrors.unitCost = "Must be > 0.";
      if (!/^[A-Z0-9-]+$/i.test(item.batchNumber))
        itemErrors.batchNumber = "Invalid batch format.";
      if (item.expiryDate && item.expiryDate < today)
        itemErrors.expiryDate = "Expiry date cannot be in the past.";
      if (Object.keys(itemErrors).length > 0)
        newErrors.stockItems[index] = itemErrors;
    });

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 1 && newErrors.stockItems.length === 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("vendorId", formData.vendor);
    if (selectedPoOrder) {
      formDataToSend.append("poId", selectedPoOrder.id);
      formDataToSend.append("poNumber", selectedPoOrder.po_number);
    }
    formDataToSend.append("grnNumber", formData.grnNumber);
    formDataToSend.append("invoiceNumber", formData.invoiceNumber);
    formDataToSend.append("invoiceDate", formData.invoiceDate);
    formDataToSend.append("receivedDate", formData.receivedDate);
    formDataToSend.append("transportDetails", formData.transportDetails);
    formDataToSend.append("receivedByEmployeeId", formData.receivedBy);
    formDataToSend.append("notes", formData.notes);
    formDataToSend.append("token", token);

    const itemsJson = stockItems.map((item) => ({
      raw_material_id: parseInt(item.materialId, 10),
      received_qty: parseFloat(item.receivedQuantity),
      unit_cost: parseFloat(item.unitCost),
      batch_number: item.batchNumber,
      expiry_date: item.expiryDate || null,
    }));
    formDataToSend.append("items", JSON.stringify(itemsJson));

    if (selectedImages.length > 0) {
      formDataToSend.append("supportingFile", selectedImages[0]);
    }

    try {
      const response = await fetch(`${BASE_URL}/vendor-stock-receipts/add`, {
        method: "POST",
        body: formDataToSend,
      });
      const data = await response.json();
      console.log(data);

      if (!response.ok || data.errFlag !== 0) {
        throw new Error(data.message || "Failed to receive stock.");
      }

      toast({ title: "Success", description: "Stock received successfully." });
      onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INPUT HANDLERS ---
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  // Dedicated handler for Purchase Order selection
  const handlePurchaseOrderChange = (poId: string) => {
    const selectedOrder = purchaseOrders.find((po) => String(po.id) === poId);
    setSelectedPoOrder(selectedOrder || null);

    setErrors((prev: any) => ({ ...prev, stockItems: [] }));

    if (selectedOrder) {
      setFormData((prev) => ({
        ...prev,
        purchaseOrder: poId,
        vendor: String(selectedOrder.vendor_id),
      }));

      if (selectedOrder.items && selectedOrder.items.length > 0) {
        const newStockItems = selectedOrder.items.map((poItem: any) => {
          let materialDetails = existingMaterials.find(
            (m) => m.id === poItem.raw_material_id
          );

          if (!materialDetails) {
            materialDetails = existingMaterials.find(
              (m) =>
                m.material_name.trim().toLowerCase() ===
                poItem.raw_material_name.trim().toLowerCase()
            );
          }

          const remainingQty =
            parseFloat(poItem.ordered_qty) - parseFloat(poItem.received_qty);

          return {
            materialId: materialDetails ? String(materialDetails.id) : "",
            materialName: materialDetails
              ? materialDetails.material_name
              : poItem.raw_material_name,
            currentStock: materialDetails ? materialDetails.stock_qty || 0 : 0,
            receivedQuantity: String(remainingQty > 0 ? remainingQty : 0),
            unitCost: String(poItem.unit_price),
            batchNumber: "",
            expiryDate: "",
          };
        });

        setStockItems(newStockItems);
      } else {
        setStockItems([
          {
            materialId: "",
            materialName: "",
            currentStock: 0,
            receivedQuantity: "",
            unitCost: "",
            batchNumber: "",
            expiryDate: "",
          },
        ]);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        purchaseOrder: "",
        vendor: "",
      }));
      setStockItems([
        {
          materialId: "",
          materialName: "",
          currentStock: 0,
          receivedQuantity: "",
          unitCost: "",
          batchNumber: "",
          expiryDate: "",
        },
      ]);
    }
  };

  const handleStockItemChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedItems = [...stockItems];
    const currentItem = { ...updatedItems[index], [field]: value };

    if (field === "materialId") {
      const selected = existingMaterials.find((m) => String(m.id) === value);
      currentItem.materialName = selected?.material_name || "";
      currentItem.currentStock = selected?.stock_qty || 0;
    }
    updatedItems[index] = currentItem;
    setStockItems(updatedItems);

    if (errors.stockItems[index] && errors.stockItems[index][field]) {
      const newErrors = { ...errors };
      delete newErrors.stockItems[index][field];
      if (Object.keys(newErrors.stockItems[index]).length === 0) {
        newErrors.stockItems.splice(index, 1);
      }
      setErrors(newErrors);
    }
  };

  // --- DYNAMIC ROW HANDLERS ---
  const addStockItem = () => {
    setStockItems((prev) => [
      ...prev,
      {
        materialId: "",
        materialName: "",
        currentStock: 0,
        receivedQuantity: "",
        unitCost: "",
        batchNumber: "",
        expiryDate: "",
      },
    ]);
  };

  const removeStockItem = (index: number) => {
    if (stockItems.length > 1) {
      setStockItems((prev) => prev.filter((_, i) => i !== index));
      setErrors((prev: any) => {
        const newStockItemErrors = [...prev.stockItems];
        newStockItemErrors.splice(index, 1);
        return { ...prev, stockItems: newStockItemErrors };
      });
    }
  };

  // --- FILE HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages((prev) => [...prev, ...files]);
  };
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async (url: string, setter: Function) => {
      try {
        const response = await fetch(`${BASE_URL}${url}/${token}`);
        const data = await response.json();
        // setter(data);
        if (url === "/vendors/get-vendors") {
          setVendors(
            data
              ?.filter((v: any) => v.status === 1)
              .map((v: any) => ({
                id: v.id,
                vendor_name: v.vendor_name,
                status: v.status,
              })) || []
          );
        } else {
          setter(data);
        }
        console.log(data);
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
      }
    };
    fetchData("/vendors/get-vendors", setVendors);
    fetchData("/employees/get-all", setEmployees);
    fetchData("/purchase-orders/get-all", setPurchaseOrders);
    console.log(employees);
  }, [token]);

  // Add this useEffect to auto-select the PO when scannedPOId is provided
  useEffect(() => {
    if (scannedPOId && purchaseOrders.length > 0) {
      console.log("Auto-selecting PO:", scannedPOId);
      handlePurchaseOrderChange(scannedPOId);
    }
  }, [scannedPOId, purchaseOrders]);

  return (
    <>
      <DialogDescription>
        Record incoming stock from vendors with GRN details and update inventory
        levels.
      </DialogDescription>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* --- JSX WITH ERROR DISPLAY --- */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="purchaseOrder">Purchase Order (Optional)</Label>
          <Select
            value={formData.purchaseOrder}
            onValueChange={handlePurchaseOrderChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Purchase Order" />
            </SelectTrigger>
            <SelectContent>
              {purchaseOrders.map((po) => (
                <SelectItem key={po.id} value={String(po.id)}>
                  {po.po_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grnNumber">GRN Number *</Label>
            <Input
              id="grnNumber"
              placeholder="GRN-2024-001"
              value={formData.grnNumber}
              onChange={(e) => handleInputChange("grnNumber", e.target.value)}
            />
            {errors.grnNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.grnNumber}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Select
              value={formData.vendor}
              onValueChange={(value) => handleInputChange("vendor", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vendor && (
              <p className="text-red-500 text-sm mt-1">{errors.vendor}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              placeholder="INV-12345"
              value={formData.invoiceNumber}
              onChange={(e) =>
                handleInputChange("invoiceNumber", e.target.value)
              }
            />
            {errors.invoiceNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errors.invoiceNumber}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Invoice Date *</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleInputChange("invoiceDate", e.target.value)}
            />
            {errors.invoiceDate && (
              <p className="text-red-500 text-sm mt-1">{errors.invoiceDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedDate">Received Date *</Label>
            <Input
              id="receivedDate"
              type="date"
              value={formData.receivedDate}
              onChange={(e) =>
                handleInputChange("receivedDate", e.target.value)
              }
            />
            {errors.receivedDate && (
              <p className="text-red-500 text-sm mt-1">{errors.receivedDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="transportDetails">Transport Details</Label>
            <Input
              id="transportDetails"
              placeholder="Vehicle no, driver details"
              value={formData.transportDetails}
              onChange={(e) =>
                handleInputChange("transportDetails", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedBy">Received By *</Label>
            <Select
              value={formData.receivedBy}
              onValueChange={(value) => handleInputChange("receivedBy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.receivedBy && (
              <p className="text-red-500 text-sm mt-1">{errors.receivedBy}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Materials Received
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStockItem}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Material
            </Button>
          </div>
          {stockItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Material #{index + 1}
                </span>
                {stockItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStockItem(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Select Material *</Label>
                  <Select
                    value={item.materialId}
                    onValueChange={(value) =>
                      handleStockItemChange(index, "materialId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingMaterials.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.material_name} (Current: {m.stock_qty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stockItems[index]?.materialId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.stockItems[index].materialId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Received Quantity *</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={item.receivedQuantity}
                    onChange={(e) =>
                      handleStockItemChange(
                        index,
                        "receivedQuantity",
                        e.target.value
                      )
                    }
                  />
                  {errors.stockItems[index]?.receivedQuantity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.stockItems[index].receivedQuantity}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Unit Cost (₹) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 450"
                    value={item.unitCost}
                    onChange={(e) =>
                      handleStockItemChange(index, "unitCost", e.target.value)
                    }
                  />
                  {errors.stockItems[index]?.unitCost && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.stockItems[index].unitCost}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch Number *</Label>
                  <Input
                    placeholder="BATCH-001"
                    value={item.batchNumber}
                    onChange={(e) =>
                      handleStockItemChange(
                        index,
                        "batchNumber",
                        e.target.value
                      )
                    }
                  />
                  {errors.stockItems[index]?.batchNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.stockItems[index].batchNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) =>
                      handleStockItemChange(index, "expiryDate", e.target.value)
                    }
                  />
                  {errors.stockItems[index]?.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.stockItems[index].expiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes about the stock receipt"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label>Supporting Documents (Optional)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <label
              htmlFor="images-upload"
              className="cursor-pointer text-center block"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload invoice, delivery notes, etc.
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Image className="h-4 w-4 mr-2" />
                  Choose Files
                </span>
              </Button>
              <Input
                id="images-upload"
                type="file"
                multiple
                accept="image/*,.pdf"
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
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Receiving..." : "Receive Stock"}
          </Button>
        </div>
      </form>
    </>
  );
}

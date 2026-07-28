import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CreatePurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockVendors = [
  { id: "V001", name: "ABC Leather Suppliers" },
  { id: "V002", name: "XYZ Hardware Co." },
  { id: "V003", name: "Best Zipper Merchants" },
  { id: "V004", name: "Quality Fabric Mills" }
];

export const CreatePurchaseOrderForm = ({ open, onOpenChange }: CreatePurchaseOrderFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vendorId: "",
    expectedDispatchDate: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as PurchaseOrderItem[]
  });

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.vendorId) {
      toast({
        title: "Error",
        description: "Please select a vendor",
        variant: "destructive"
      });
      return;
    }

    if (!formData.expectedDispatchDate) {
      toast({
        title: "Error", 
        description: "Please select expected dispatch date",
        variant: "destructive"
      });
      return;
    }

    if (formData.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast({
        title: "Error",
        description: "Please fill all item details correctly",
        variant: "destructive"
      });
      return;
    }

    // Generate PO number (in real app, this would come from backend)
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    console.log("Creating PO:", {
      poNumber,
      ...formData,
      orderDate: new Date().toISOString(),
      totalAmount: calculateGrandTotal()
    });

    toast({
      title: "Success",
      description: `Purchase Order ${poNumber} created successfully!`
    });

    // Reset form
    setFormData({
      vendorId: "",
      expectedDispatchDate: "",
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select value={formData.vendorId} onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {mockVendors.map(vendor => (
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
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDispatchDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
                  <div className="col-span-5">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={`₹${item.total.toFixed(2)}`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                      className="p-2"
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
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Purchase Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
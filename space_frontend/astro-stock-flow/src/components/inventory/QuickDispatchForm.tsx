import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Minus } from "lucide-react";

interface QuickDispatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockProducts = [
  { id: "FG001", name: "Urban Explorer Backpack Pro", sku: "UEB-PRO-001", currentStock: 45 },
  { id: "FG002", name: "Travel Pro Laptop Bag", sku: "TPL-BAG-002", currentStock: 12 },
  { id: "FG004", name: "Executive Briefcase Deluxe", sku: "EBD-BFC-004", currentStock: 28 },
  { id: "FG005", name: "Casual Day Pack", sku: "CDP-BAG-005", currentStock: 67 }
];

export function QuickDispatchForm({ open, onOpenChange }: QuickDispatchFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [dispatchQuantity, setDispatchQuantity] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [orderReference, setOrderReference] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast();

  const selectedProductData = mockProducts.find(product => product.id === selectedProduct);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || dispatchQuantity <= 0 || !customerName || !shippingAddress || !priority) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProductData && dispatchQuantity > selectedProductData.currentStock) {
      toast({
        title: "Error",
        description: "Dispatch quantity cannot exceed current stock.",
        variant: "destructive",
      });
      return;
    }

    const dispatchId = `DISP-${Date.now().toString().slice(-6)}`;

    toast({
      title: "Success",
      description: `Dispatch ${dispatchId} created for ${dispatchQuantity} units of ${selectedProductData?.name}`,
    });

    // Reset form
    setSelectedProduct("");
    setDispatchQuantity(0);
    setCustomerName("");
    setOrderReference("");
    setShippingAddress("");
    setPriority("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Quick Dispatch
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Product *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Available: {product.currentStock} units
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Available Stock:</span>
                  <div className="font-medium text-lg">{selectedProductData.currentStock} units</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Dispatch Quantity *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDispatchQuantity(Math.max(0, dispatchQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    max={selectedProductData?.currentStock || 999}
                    value={dispatchQuantity}
                    onChange={(e) => setDispatchQuantity(parseInt(e.target.value) || 0)}
                    className="text-center"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDispatchQuantity(Math.min(selectedProductData?.currentStock || 999, dispatchQuantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedProductData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Max available: {selectedProductData.currentStock} units
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={priority} onValueChange={setPriority} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer Name *</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="order-ref">Order Reference</Label>
                <Input
                  id="order-ref"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  placeholder="Order #, Invoice #, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Shipping Address *</Label>
              <Textarea
                id="address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter complete shipping address..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Dispatch Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special handling instructions, delivery notes, etc..."
                rows={2}
              />
            </div>

            {dispatchQuantity > 0 && selectedProductData && (
              <div className="bg-primary/5 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Dispatch Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <div className="font-medium">{selectedProductData.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <div className="font-medium">{dispatchQuantity} units</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{customerName || "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <div className="font-medium capitalize">{priority || "Not specified"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Dispatch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
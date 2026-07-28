import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, Plus, Minus } from "lucide-react";

interface TransferStockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockProducts = [
  { id: "FG001", name: "Urban Explorer Backpack Pro", sku: "UEB-PRO-001", currentStock: 45 },
  { id: "FG002", name: "Travel Pro Laptop Bag", sku: "TPL-BAG-002", currentStock: 12 },
  { id: "FG004", name: "Executive Briefcase Deluxe", sku: "EBD-BFC-004", currentStock: 28 },
  { id: "FG005", name: "Casual Day Pack", sku: "CDP-BAG-005", currentStock: 67 }
];

const storageLocations = [
  "FG-Warehouse A - R001 - S1",
  "FG-Warehouse B - R002 - S1", 
  "FG-Warehouse A - R003 - S2",
  "FG-Warehouse B - R001 - S3",
  "FG-Warehouse C - R001 - S1",
  "FG-Warehouse A - R002 - S1"
];

export function TransferStockForm({ open, onOpenChange }: TransferStockFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [fromLocation, setFromLocation] = useState<string>("");
  const [toLocation, setToLocation] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast();

  const selectedProductData = mockProducts.find(product => product.id === selectedProduct);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !fromLocation || !toLocation || transferQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (fromLocation === toLocation) {
      toast({
        title: "Error",
        description: "Source and destination locations cannot be the same.",
        variant: "destructive",
      });
      return;
    }

    if (selectedProductData && transferQuantity > selectedProductData.currentStock) {
      toast({
        title: "Error",
        description: "Transfer quantity cannot exceed current stock.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Transferred ${transferQuantity} units of ${selectedProductData?.name} from ${fromLocation} to ${toLocation}`,
    });

    // Reset form
    setSelectedProduct("");
    setFromLocation("");
    setToLocation("");
    setTransferQuantity(0);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Stock
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
                <Label htmlFor="from-location">From Location *</Label>
                <Select value={fromLocation} onValueChange={setFromLocation} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="to-location">To Location *</Label>
                <Select value={toLocation} onValueChange={setToLocation} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations.filter(loc => loc !== fromLocation).map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="quantity">Transfer Quantity *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setTransferQuantity(Math.max(0, transferQuantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  max={selectedProductData?.currentStock || 999}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                  className="text-center"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setTransferQuantity(Math.min(selectedProductData?.currentStock || 999, transferQuantity + 1))}
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transfer..."
                rows={3}
              />
            </div>

            {fromLocation && toLocation && transferQuantity > 0 && (
              <div className="bg-primary/5 p-4 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Transfer Summary:</span>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Moving <span className="font-medium">{transferQuantity} units</span> of{" "}
                  <span className="font-medium">{selectedProductData?.name}</span>
                  <br />
                  From: <span className="font-medium">{fromLocation}</span>
                  <br />
                  To: <span className="font-medium">{toLocation}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Transfer Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
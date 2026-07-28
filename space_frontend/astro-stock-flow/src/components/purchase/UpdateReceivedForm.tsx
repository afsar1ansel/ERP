import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  status: "pending" | "partial" | "completed";
}

interface UpdateReceivedFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PurchaseOrderItem | null;
  poNumber: string;
  onUpdate: (itemId: string, newReceivedQuantity: number) => void;
}

export const UpdateReceivedForm = ({ open, onOpenChange, item, poNumber, onUpdate }: UpdateReceivedFormProps) => {
  const { toast } = useToast();
  const [receivedQuantity, setReceivedQuantity] = useState(item?.receivedQuantity || 0);

  // Update received quantity when item prop changes
  useEffect(() => {
    setReceivedQuantity(item?.receivedQuantity || 0);
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;

    // Validation
    if (receivedQuantity < 0) {
      toast({
        title: "Error",
        description: "Received quantity cannot be negative",
        variant: "destructive"
      });
      return;
    }

    if (receivedQuantity > item.quantity) {
      toast({
        title: "Warning",
        description: "Received quantity exceeds ordered quantity. Please confirm if this is correct.",
        variant: "destructive"
      });
      return;
    }

    const previousQuantity = item.receivedQuantity;
    const difference = receivedQuantity - previousQuantity;
    
    console.log("Updating received quantity:", {
      itemId: item.id,
      poNumber,
      previousQuantity,
      newQuantity: receivedQuantity,
      difference
    });
    
    onUpdate(item.id, receivedQuantity);

    // Show success toast with details
    if (difference > 0) {
      toast({
        title: "Stock Updated Successfully!",
        description: `Added ${difference} units to ${item.description}. Total received: ${receivedQuantity}/${item.quantity}`,
        variant: "default"
      });
    } else if (difference < 0) {
      toast({
        title: "Stock Updated Successfully!",
        description: `Reduced ${Math.abs(difference)} units from ${item.description}. Total received: ${receivedQuantity}/${item.quantity}`,
        variant: "default"
      });
    } else {
      toast({
        title: "No Change",
        description: "Received quantity remains the same",
        variant: "default"
      });
    }

    onOpenChange(false);
  };

  if (!item) return null;

  const remainingQuantity = item.quantity - receivedQuantity;
  const completionPercentage = Math.round((receivedQuantity / item.quantity) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Received Stock</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordered Quantity</Label>
              <Input value={item.quantity} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unit Price</Label>
              <Input value={`₹${item.unitPrice}`} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedQuantity">Received Quantity *</Label>
            <Input
              id="receivedQuantity"
              type="number"
              min="0"
              max={item.quantity + 10} // Allow some buffer for overdelivery
              value={receivedQuantity}
              onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <span className={`ml-2 font-medium ${remainingQuantity > 0 ? 'text-warning' : 'text-success'}`}>
                {remainingQuantity}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Completion:</span>
              <span className={`ml-2 font-medium ${completionPercentage === 100 ? 'text-success' : 'text-primary'}`}>
                {completionPercentage}%
              </span>
            </div>
          </div>

          {receivedQuantity > item.quantity && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                ⚠️ Received quantity exceeds ordered quantity by {receivedQuantity - item.quantity} units
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
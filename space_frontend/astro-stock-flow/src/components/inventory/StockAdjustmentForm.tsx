import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { FileEdit, Plus, Minus } from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";

interface StockAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any[];
  token: string;
  onSuccess: () => void;
}

export function StockAdjustmentForm({
  open,
  onOpenChange,
  data,
  token,
  onSuccess,
}: StockAdjustmentFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">(
    "increase"
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const selectedProductData = data?.find(
    (product) => product.id == selectedProduct
  );

  console.log(selectedProductData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || adjustmentQuantity <= 0 || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("token", token);
      formData.append("finishedGoodId", selectedProduct);
      formData.append("adjustmentType", adjustmentType);
      formData.append("adjustmentQty", adjustmentQuantity.toString());
      formData.append("reason", reason);
      formData.append("notes", notes);

      const res = await fetch(`${BASE_URL}/finished-goods/stock-adjust`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to adjust stock");
      }

      toast({
        title: "Stock Adjusted",
        description: `Stock adjusted successfully for ${selectedProductData?.product_name}.`,
      });

      onSuccess();

      // Reset form
      setSelectedProduct("");
      setAdjustmentType("increase");
      setAdjustmentQuantity(0);
      setReason("");
      setNotes("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Something went wrong while adjusting stock.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Stock Adjustment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Product Select */}
            <div>
              <Label htmlFor="product">Product *</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {data?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.product_name} ({product.sku}) - Current:{" "}
                      {product.stock_qty} units
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData && (
              <div className="bg-muted/50 p-4 rounded-lg">
                {" "}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {" "}
                  <div>
                    {" "}
                    <span className="text-muted-foreground">
                      Current Stock:
                    </span>{" "}
                    <div className="font-medium text-lg">
                      {selectedProductData.stock_qty} units
                    </div>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <span className="text-muted-foreground">
                      Adjustment:
                    </span>{" "}
                    <div className="font-medium text-lg text-primary">
                      {" "}
                      {adjustmentType === "increase" ? "+" : "-"}
                      {adjustmentQuantity} units{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            )}

            {/* Adjustment Type */}
            <div>
              <Label>Adjustment Type *</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(value) =>
                  setAdjustmentType(value as "increase" | "decrease")
                }
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase">Increase Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <Label htmlFor="decrease">Decrease Stock</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Adjustment Quantity *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setAdjustmentQuantity(Math.max(0, adjustmentQuantity - 1))
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) =>
                    setAdjustmentQuantity(parseInt(e.target.value) || 0)
                  }
                  className="text-center"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustmentQuantity(adjustmentQuantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cycle-count">
                    Cycle Count Correction
                  </SelectItem>
                  <SelectItem value="damaged">Damaged Goods</SelectItem>
                  <SelectItem value="expired">Expired/Obsolete</SelectItem>
                  <SelectItem value="found">Found Stock</SelectItem>
                  <SelectItem value="theft">Theft/Loss</SelectItem>
                  <SelectItem value="system-error">
                    System Error Correction
                  </SelectItem>
                  <SelectItem value="quality-issue">Quality Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this adjustment..."
                rows={3}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Applying..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

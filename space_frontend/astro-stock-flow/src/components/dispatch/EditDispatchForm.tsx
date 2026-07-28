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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";

interface DispatchOrder {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_id: number;
  customerAddress: string;
  items: {
    productName: string;
    productId: number;
    sku: string;
    orderedQuantity: number;
    unitPrice: number;
    total: number;
  }[];
  grand_total: number;
  priority: "high" | "medium" | "low";
  dispatch_status: "pending" | "packed" | "shipped" | "delivered";
  createdDate: string;
  shippedDate?: string;
  estimatedDelivery?: string;
  tracking?: string;
  notes?: string;
  // dispatchOrderId: number;
}

interface EditDispatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DispatchOrder | null;
  fetchDispatches: () => void; // add this
}

export function EditDispatchForm({
  open,
  onOpenChange,
  order,
  fetchDispatches, // add this
}: EditDispatchFormProps) {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    dispatchOrderId: "",
    orderReference: "",
    shippingAddress: "",
    grandTotal: 0,
    itemsToDispatch: [],
    customer_id: "",
    customerAddress: "",
    priority: "medium" as "high" | "medium" | "low",
    status: "pending" as "pending" | "packed" | "shipped" | "delivered",
    estimatedDelivery: "",
    tracking: "",
    notes: "",
  });
  // console.log(order);
  useEffect(() => {
    if (order) {
      setFormData({
        dispatchOrderId: order.id,
        orderReference: order.order_reference,
        shippingAddress: order.customerAddress,
        grandTotal: order.grand_total,
        itemsToDispatch: order.items,
        customer_id: String(order.customer_id), // <-- set id as string
        customerAddress: order.customerAddress,
        priority: order.priority,
        status: order.dispatch_status,
        estimatedDelivery: order.estimatedDelivery || "",
        tracking: order.tracking || "",
        notes: order.notes || "",
      });
    }
    getCustomers();
  }, [order]);

  const getCustomers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/clients/get-all/${token}`);
      const data = await response.json();
      setCustomers(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Dispatch form submitted:", formData);
    const newForm = new FormData();
    newForm.append("dispatchOrderId", formData.dispatchOrderId);
    newForm.append("orderReference", formData.orderReference);
    newForm.append("customerName", formData.customer_id);
    newForm.append("shippingAddress", formData.shippingAddress);
    newForm.append("priority", formData.priority);
    newForm.append("notes", formData.notes);
    newForm.append("grandTotal", formData.grandTotal.toString());
    newForm.append("dispatchStatus", formData.status);
    newForm.append("dispatchDate", formData.estimatedDelivery);
    newForm.append("itemsToDispatch", JSON.stringify(formData.itemsToDispatch));
    newForm.append("token", token);
    console.log(Object.fromEntries(newForm));

    try {
      const response = await fetch(`${BASE_URL}/dispatch-orders/update`, {
        method: "POST",
        body: newForm,
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }

    toast({
      title: "Dispatch Order Updated",
      description: `Order ${order?.id} has been successfully updated.`,
    });

    fetchDispatches(); // add this
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dispatch Order - {order?.id}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Order Reference</Label>
                <div className="text-sm text-muted-foreground font-mono">
                  {order?.order_reference}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Value</Label>
                <div className="text-sm text-muted-foreground font-medium">
                  ₹{order?.grand_total.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <Label className="text-sm font-medium">Items</Label>
              <div className="mt-2 space-y-2">
                {order?.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.productName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sku}
                      </div>
                    </div>
                    <div className="text-sm">
                      {item.orderedQuantity} × ₹
                      {item.unitPrice.toLocaleString()} = ₹
                      {(item.orderedQuantity * item.unitPrice).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  handleInputChange("customer_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) =>
                  handleInputChange("customerAddress", e.target.value)
                }
                rows={3}
                required
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "high" | "medium" | "low") =>
                  handleInputChange("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "pending" | "packed" | "shipped" | "delivered"
                ) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) =>
                  handleInputChange("estimatedDelivery", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={formData.tracking}
                onChange={(e) => handleInputChange("tracking", e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes or special instructions..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Order</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

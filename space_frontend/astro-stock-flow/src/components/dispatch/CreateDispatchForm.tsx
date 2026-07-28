import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import { set } from "date-fns";

interface CreateDispatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchDispatches: () => void;
}

interface DispatchItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  unitPrice: number;
  availableUnit: number;
  total: number;
}

export const CreateDispatchForm = ({
  open,
  onOpenChange,
  fetchDispatches,
}: CreateDispatchFormProps) => {
  const [orderReference, setOrderReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [noOfBoxes, setNoOfBoxes] = useState(""); 
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [errors, setErrors] = useState({
    orderReference: "",
    customerName: "",
    customerAddress: "",
    items: "",
    noOfBoxes: "",
    notes: "",
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  useEffect(() => {
    getProducts();
    getCustomers();
  }, []);

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

  const getProducts = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/finished-goods/get-all/${token}`
      );
      const data = await response.json();
      console.log(data);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addItem = () => {
    const newItem: DispatchItem = {
      productId: "",
      productName: "",
      sku: "",
      orderedQuantity: 1,
      unitPrice: 0,
      availableUnit: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DispatchItem, value: any) => {
    const updatedItems = [...items];
    let updatedItem = { ...updatedItems[index], [field]: value };

    // If productId changes, update product-related fields
    if (field === "productId") {
      const product = products.find((p) => String(p.id) === String(value));
      if (product) {
        updatedItem = {
          ...updatedItem,
          productName: product.product_name,
          sku: product.sku_code,
          unitPrice: product.unit_price,
          availableUnit: product.stock_qty,
        };
      }
    }

    // Always recalculate total
    updatedItem.total = updatedItem.orderedQuantity * updatedItem.unitPrice;

    updatedItems[index] = updatedItem;

    console.log(updatedItems);

    setItems(updatedItems);
  };

  const getTotalValue = () => {
    return items.reduce(
      (total, item) => total + item.orderedQuantity * item.unitPrice,
      0
    );
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.orderedQuantity, 0);
  };

  const validateForm = () => {
    let newErrors = {
      orderReference: "",
      customerName: "",
      customerAddress: "",
      items: "",
      noOfBoxes: "",
      notes: "",
    };
    let isValid = true;

    if (!orderReference.trim()) {
      newErrors.orderReference = "Order Reference is required.";
      isValid = false;
    }

    if (!customerName) {
      newErrors.customerName = "Please select a customer.";
      isValid = false;
    }

    if (!customerAddress.trim()) {
      newErrors.customerAddress = "Shipping Address is required.";
      isValid = false;
    }

    if (!noOfBoxes || parseInt(noOfBoxes) <= 0) {
      newErrors.noOfBoxes = "Number of boxes is required and must be valid.";
      isValid = false;
    }

    if (!notes.trim()) {
      newErrors.notes = "Notes are required.";
      isValid = false;
    }

    if (items.length === 0) {
      newErrors.items = "At least one item must be added.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the highlighted fields.",
      });
      return;
    }

    // Validate stock availability
    const insufficientStock = items.find(
      (item) => item.orderedQuantity > item.availableUnit
    );
    if (insufficientStock) {
      toast({
        title: "Insufficient Stock",
        description: `Not enough stock available for ${insufficientStock.productName}`,
        variant: "destructive",
      });
      return;
    }

    const newForm = new FormData();
    newForm.append("orderReference", orderReference);
    newForm.append("customerId", customerName);
    newForm.append("shippingAddress", customerAddress);
    newForm.append("priority", priority);
    newForm.append("noOfBoxes", noOfBoxes || "0"); 
    newForm.append("notes", notes);
    newForm.append("grandTotal", getTotalValue().toString());
    newForm.append("dispatchDate", new Date().toISOString());
    newForm.append("itemsToDispatch", JSON.stringify(items));
    newForm.append("token", token);
    console.log(Object.fromEntries(newForm));

    try {
      const response = await fetch(`${BASE_URL}/dispatch-orders/add`, {
        method: "POST",
        body: newForm,
      });
      const data = await response.json();
      console.log(data);

      if (data.errFlag === 1) {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      if (data.errFlag === 0) {
        toast({
          title: "Success",
          description: "Dispatch order created successfully!",
        });
        fetchDispatches(); // <-- refresh table
        // Reset form
        setOrderReference("");
        setCustomerName("");
        setCustomerAddress("");
        setPriority("medium");
        setNoOfBoxes(""); // <-- 4. RESET STATE
        setNotes("");
        setItems([]);
        setErrors({
          orderReference: "",
          customerName: "",
          customerAddress: "",
          items: "",
          noOfBoxes: "",
          notes: "",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create dispatch order.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dispatch Order</DialogTitle>
          <DialogDescription>
            Create a new dispatch order for outbound shipment of finished goods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2. UPDATE JSX LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderReference">Order Reference *</Label>
              <Input
                id="orderReference"
                placeholder="e.g., ORD-2024-001"
                value={orderReference}
                onChange={(e) => {
                  setOrderReference(e.target.value);
                  setErrors((prev) => ({ ...prev, orderReference: "" }));
                }}
                className={errors.orderReference ? "border-red-500" : ""}
              />
              {errors.orderReference && (
                <p className="text-red-500 text-sm mt-1">{errors.orderReference}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "high" | "medium" | "low") =>
                  setPriority(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="noOfBoxes">No. of Boxes</Label>
              <Input
                id="noOfBoxes"
                type="number"
                placeholder="e.g., 5"
                value={noOfBoxes}
                onChange={(e) => setNoOfBoxes(e.target.value)}
                min="0"
              />
            </div> */}
          </div>
          {/* END OF UPDATED JSX */}

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Select
              value={customerName}
              onValueChange={(value) => {
                setCustomerName(value);
                setErrors((prev) => ({ ...prev, customerName: "" }));
              }}
            >
              <SelectTrigger className={errors.customerName ? "border-red-500" : ""}>
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
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Shipping Address *</Label>
            <Textarea
              id="customerAddress"
              placeholder="Enter complete shipping address"
              value={customerAddress}
              onChange={(e) => {
                setCustomerAddress(e.target.value);
                setErrors((prev) => ({ ...prev, customerAddress: "" }));
              }}
              rows={3}
              className={errors.customerAddress ? "border-red-500" : ""}
            />
            {errors.customerAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.customerAddress}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Items to Dispatch</Label>
                {errors.items && (
                  <p className="text-red-500 text-sm">{errors.items}</p>
                )}
              </div>
              <Button
                type="button"
                onClick={() => {
                  addItem();
                  setErrors((prev) => ({ ...prev, items: "" }));
                }}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                      <Label>Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) =>
                          updateItem(index, "productId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem
                              key={String(product.id)}
                              value={String(product.id)}
                            >
                              {product.product_name} ({product.sku_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItem(
                              index,
                              "orderedQuantity",
                              Math.max(1, item.orderedQuantity - 1)
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.orderedQuantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "orderedQuantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="text-center h-8"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItem(
                              index,
                              "orderedQuantity",
                              item.orderedQuantity + 1
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Available</Label>
                      <div className="text-sm text-muted-foreground pt-2">
                        {item.availableUnit} units
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Unit Price</Label>
                      <div className="text-sm font-medium pt-2">
                        ₹{item.unitPrice.toLocaleString()}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Label>Total</Label>
                      <div className="text-sm font-medium pt-2">
                        ₹
                        {(
                          item.orderedQuantity * item.unitPrice
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {item.orderedQuantity > item.availableUnit &&
                    item.availableUnit > 0 && (
                      <div className="mt-2 text-sm text-destructive">
                        Insufficient stock available. Maximum quantity:{" "}
                        {item.availableUnit}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="noOfBoxes">No. of Boxes *</Label>
              <Input
                id="noOfBoxes"
                type="number"
                placeholder="e.g., 5"
                value={noOfBoxes}
                onChange={(e) => {
                  setNoOfBoxes(e.target.value);
                  setErrors((prev) => ({ ...prev, noOfBoxes: "" }));
                }}
                min="1"
                className={errors.noOfBoxes ? "border-red-500" : ""}
              />
              {errors.noOfBoxes && (
                <p className="text-red-500 text-sm">{errors.noOfBoxes}</p>
              )}
            </div>

            <Label htmlFor="notes">Notes *</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes or special instructions"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrors((prev) => ({ ...prev, notes: "" }));
              }}
              rows={3}
              className={errors.notes ? "border-red-500" : ""}
            />
            {errors.notes && (
              <p className="text-red-500 text-sm">{errors.notes}</p>
            )}
          </div>

          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dispatch Summary</span>
                  <Badge variant={getPriorityColor(priority)}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}{" "}
                    Priority
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Items:</span>
                    <div className="font-medium">{getTotalItems()} units</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Products:
                    </span>
                    <div className="font-medium">{items.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Value:</span>
                    <div className="font-medium">
                      ₹{getTotalValue().toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">
                      {customerName || "Not specified"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Create Dispatch Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

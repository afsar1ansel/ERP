// src/components/order/OrderForm.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Package,
  User,
  Building2,
  ChevronsUpDown,
  Check,
  Plus,
  Minus,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/hooks/baseUrls";

// --- Interfaces ---
interface RawMaterialItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  rawMaterialId?: string;
}

interface OrderFormData {
  clientId: string;
  expectedDeliveryDate: string;
  productSkuId: string;
  rawMaterials: RawMaterialItem[];
  notes: string;
  orderStatus:
  | "pending"
  | "confirmed"
  | "in_production"
  | "completed"
  | "cancelled";
  totalQuantity: number;
}

interface InitialOrderData {
  id: number;
  order_code: string;
  client_id?: number;
  expected_delivery_date: string;
  quantity: number;
  order_status:
  | "pending"
  | "confirmed"
  | "in_production"
  | "completed"
  | "cancelled";
  product_sku_id?: number;
  raw_materials_json?: any;
  notes?: string;
}

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchOrders: () => void;
  mode: "create" | "edit";
  initialOrder: InitialOrderData | null;
}

// Updated interfaces for new API responses
interface ProductOption {
  id: string;
  product_name: string;
}

interface RawMaterialOption {
  id: string;
  material_name: string;
  material_code?: string;
}

interface ClientOption {
  id: string;
  client_name: string;
  email?: string;
  phone?: string;
}

interface UnitOption {
  unit: string;
  unit_name?: string;
}

export const OrderForm = ({
  open,
  onOpenChange,
  fetchOrders,
  mode,
  initialOrder,
}: OrderFormProps) => {
  const defaultFormState: OrderFormData = {
    clientId: "",
    expectedDeliveryDate: "",
    productSkuId: "",
    rawMaterials: [],
    notes: "",
    orderStatus: "pending",
    totalQuantity: 1,
  };

  const [formData, setFormData] = useState<OrderFormData>(defaultFormState);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [rawMaterialsList, setRawMaterialsList] = useState<RawMaterialOption[]>(
    []
  );
  const [customers, setCustomers] = useState<ClientOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [orderType, setOrderType] = useState<"single" | "custom">("single");
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  // Client search state
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Validation errors for manual materials
  const [materialErrors, setMaterialErrors] = useState<{
    [key: number]: { [field: string]: string };
  }>({});

  console.log(initialOrder)


  // --- Helpers ---
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return "";
    try {
      // Check if it matches YYYY-MM-DD exactly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // If it contains "T" (ISO format), take the first part
      if (dateString.includes("T")) {
        return dateString.split("T")[0];
      }
      // Attempt to parse standard date string
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
      return "";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    if (open) {
      getCustomers();
      getProductsAndMaterials();
      getUnits();
    }
  }, [open]);

  useEffect(() => {
    if (mode === "edit" && initialOrder) {
      const materialsData = initialOrder.raw_materials_json;
      let materials: RawMaterialItem[] = [];

      if (materialsData) {
        try {
          const parsedMaterials =
            typeof materialsData === "string"
              ? JSON.parse(materialsData)
              : materialsData;
          materials = parsedMaterials.map((item: any) => {
            // Support snake_case from backend or camelCase/existing
            const matId = String(
              item.raw_material_id ||
              item.rawMaterialId ||
              item.productSkuId ||
              item.id
            );
            return {
              id: matId,
              sku: item.sku || "N/A",
              productName: item.productName || "N/A",
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit || "",
              rawMaterialId: matId,
            };
          });
        } catch (e) {
          console.error("Failed to process raw_materials_json:", e);
        }
      }

      const isSingleProduct = !!initialOrder.product_sku_id;

      setFormData({
        clientId: String(initialOrder.client_id || ""),
        expectedDeliveryDate: formatDateForInput(
          initialOrder.expected_delivery_date
        ),
        productSkuId: isSingleProduct
          ? String(initialOrder.product_sku_id)
          : "",
        rawMaterials: materials,
        notes: initialOrder.notes || "",
        orderStatus: initialOrder.order_status,
        totalQuantity: initialOrder.quantity || 1,
      });

      setOrderType(isSingleProduct ? "single" : "custom");
    } else if (mode === "create") {
      setFormData(defaultFormState);
      setOrderType("single");
    }
  }, [initialOrder, mode, open]);

  // --- Backfill Material Names ---
  // When rawMaterialsList loads, update any "N/A" names in formData
  useEffect(() => {
    if (
      mode === "edit" &&
      rawMaterialsList.length > 0 &&
      formData.rawMaterials.length > 0
    ) {
      setFormData((prev) => {
        const updatedMaterials = prev.rawMaterials.map((item) => {
          // If name is missing or placeholder, try to find it
          if (
            (!item.productName || item.productName === "N/A") &&
            item.rawMaterialId
          ) {
            const matchedMaterial = rawMaterialsList.find(
              (m) => String(m.id) === String(item.rawMaterialId)
            );
            if (matchedMaterial) {
              return {
                ...item,
                productName: matchedMaterial.material_name,
                sku: matchedMaterial.material_code || item.sku || "N/A",
              };
            }
          }
          return item;
        });

        // Only update state if something actually changed to avoid loop
        const hasChanges = updatedMaterials.some(
          (item, idx) =>
            item.productName !== prev.rawMaterials[idx].productName ||
            item.sku !== prev.rawMaterials[idx].sku
        );

        return hasChanges ? { ...prev, rawMaterials: updatedMaterials } : prev;
      });
    }
  }, [rawMaterialsList, mode]);

  const getCustomers = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`${BASE_URL}/clients/get-all/${token}`);
      const data = await response.json();
      const rawClients = Array.isArray(data) ? data : data?.result || [];

      // Normalize IDs to strings to match form data types
      const processedClients = rawClients.map((client: any) => ({
        ...client,
        id: String(client.id),
      }));

      setCustomers(processedClients);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Failed to load customers",
        description: "Could not fetch customers list.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getProductsAndMaterials = async () => {
    try {
      setLoadingData(true);

      // Fetch products for single product selection
      const productsResponse = await fetch(
        `${BASE_URL}/product-skus/get-all/${token}`
      );
      const productsData = await productsResponse.json();

      // Fetch raw materials for custom order selection
      const rawMaterialsResponse = await fetch(
        `${BASE_URL}/raw-materials/get-all/${token}`
      );
      const rawMaterialsData = await rawMaterialsResponse.json();

      // Process products data - extract only id and product_name
      const processedProducts = (
        Array.isArray(productsData) ? productsData : productsData?.result || []
      ).map((product: any) => ({
        id: String(product.id),
        product_name: product.product_name || "Unnamed Product",
      }));

      // Process raw materials data - extract only id and material_name
      const processedRawMaterials = (
        Array.isArray(rawMaterialsData)
          ? rawMaterialsData
          : rawMaterialsData?.result || []
      ).map((material: any) => ({
        id: String(material.id),
        material_name: material.material_name || "Unnamed Material",
        material_code: material.material_code,
      }));

      setProducts(processedProducts);
      setRawMaterialsList(processedRawMaterials);
    } catch (error) {
      console.error("Error fetching products/materials:", error);
      toast({
        title: "Failed to load products",
        description: "Could not fetch products and materials list.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getUnits = async () => {
    try {
      const response = await fetch(`${BASE_URL}/units/get-units/${token}`);
      const data = await response.json();
      setUnits(Array.isArray(data) ? data : data?.result || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Failed to load units",
        description: "Could not fetch units list.",
        variant: "destructive",
      });
    }
  };

  // --- Client Selection Handler ---
  const handleClientSelect = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId }));
    setClientSearchOpen(false);
    setClientSearchValue("");
  };

  // --- Product Selection Handler ---
  const handleProductChange = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      productSkuId: productId,
    }));
    setProductSearchOpen(false);
    setProductSearchValue("");
  };

  // --- Item Management (for Custom Orders) ---
  const addRawMaterial = () => {
    const newMaterial: RawMaterialItem = {
      id: "",
      sku: "",
      productName: "",
      quantity: 1,
      unit: "",
      rawMaterialId: "",
    };
    setFormData((prev) => ({
      ...prev,
      rawMaterials: [...prev.rawMaterials, newMaterial],
    }));
  };

  const removeRawMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter((_, i) => i !== index),
    }));

    // Clear errors for removed material
    setMaterialErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateRawMaterial = (
    index: number,
    field: keyof RawMaterialItem,
    value: any
  ) => {
    setFormData((prev) => {
      const updatedMaterials = [...prev.rawMaterials];
      let updatedItem = { ...updatedMaterials[index], [field]: value };

      if (field === "id" || field === "rawMaterialId") {
        const material = rawMaterialsList.find(
          (m: any) => String(m.id) === String(value)
        );
        if (material) {
          updatedItem = {
            ...updatedItem,
            id: String(material.id),
            rawMaterialId: String(material.id),
            productName: material.material_name,
            sku: material.material_code || "N/A",
          };
        }

        // Clear error when material is selected
        if (materialErrors[index]?.rawMaterialId) {
          setMaterialErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors[index]) {
              delete newErrors[index].rawMaterialId;
              if (Object.keys(newErrors[index]).length === 0) {
                delete newErrors[index];
              }
            }
            return newErrors;
          });
        }
      }

      if (field === "quantity") {
        const quantityValue = Math.max(0, parseFloat(value) || 0);
        updatedItem.quantity = quantityValue;

        // Validate quantity
        if (quantityValue <= 0 && materialErrors[index]?.quantity) {
          setMaterialErrors((prev) => ({
            ...prev,
            [index]: {
              ...prev[index],
              quantity: "Quantity must be greater than 0",
            },
          }));
        } else if (quantityValue > 0 && materialErrors[index]?.quantity) {
          setMaterialErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors[index]) {
              delete newErrors[index].quantity;
              if (Object.keys(newErrors[index]).length === 0) {
                delete newErrors[index];
              }
            }
            return newErrors;
          });
        }
      }

      if (field === "unit" && value && materialErrors[index]?.unit) {
        // Clear unit error when unit is selected
        setMaterialErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors[index]) {
            delete newErrors[index].unit;
            if (Object.keys(newErrors[index]).length === 0) {
              delete newErrors[index];
            }
          }
          return newErrors;
        });
      }

      updatedMaterials[index] = updatedItem;
      return { ...prev, rawMaterials: updatedMaterials };
    });
  };

  // Get available materials for custom order (excluding already selected ones)
  const getAvailableMaterials = (currentIndex: number) => {
    const selectedMaterialIds = formData.rawMaterials
      .map((material, index) =>
        index !== currentIndex ? material.rawMaterialId : null
      )
      .filter(Boolean);

    return rawMaterialsList.filter(
      (material) => !selectedMaterialIds.includes(String(material.id))
    );
  };

  // Validate custom materials before submission
  const validateCustomMaterials = (): boolean => {
    const errors: { [key: number]: { [field: string]: string } } = {};
    let isValid = true;

    formData.rawMaterials.forEach((material, index) => {
      const itemErrors: { [field: string]: string } = {};

      if (!material.rawMaterialId) {
        itemErrors.rawMaterialId = "Material is required";
        isValid = false;
      }

      if (!material.quantity || material.quantity <= 0) {
        itemErrors.quantity = "Quantity must be greater than 0";
        isValid = false;
      }

      if (!material.unit) {
        itemErrors.unit = "Unit is required";
        isValid = false;
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[index] = itemErrors;
      }
    });

    setMaterialErrors(errors);
    return isValid;
  };

  // --- Submission Handler --
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.clientId || !formData.expectedDeliveryDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (
      orderType === "single" &&
      (!formData.productSkuId || formData.totalQuantity < 1)
    ) {
      toast({
        title: "Error",
        description: "Please select a product and specify quantity.",
        variant: "destructive",
      });
      return;
    }

    if (orderType === "custom") {
      if (formData.rawMaterials.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one material for the custom order.",
          variant: "destructive",
        });
        return;
      }

      // Validate custom materials
      if (!validateCustomMaterials()) {
        toast({
          title: "Error",
          description:
            "Please fix the errors in custom materials before submitting.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    let url =
      mode === "create"
        ? `${BASE_URL}/orders/create`
        : `${BASE_URL}/orders/update`;
    let successMessage =
      mode === "create"
        ? "Order created successfully!"
        : "Order updated successfully!";

    const newForm = new FormData();
    newForm.append("token", token!);
    newForm.append("clientId", formData.clientId);
    newForm.append("expectedDeliveryDate", formData.expectedDeliveryDate);
    newForm.append("notes", formData.notes);

    let submissionQuantity: number = 0;

    if (orderType === "single") {
      // Single product order - send productSkuId and quantity
      submissionQuantity = formData.totalQuantity;
      newForm.append("productSkuId", formData.productSkuId);
      newForm.append("quantity", String(submissionQuantity));
    } else if (orderType === "custom") {
      // Custom order - send rawMaterialsJson and total quantity
      submissionQuantity = formData.rawMaterials.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const rawMaterialsJsonPayload = JSON.stringify(
        formData.rawMaterials.map((item) => ({
          productSkuId: item.rawMaterialId || item.id,
          quantity: item.quantity,
          unit: item.unit,
          sku: item.sku,
          productName: item.productName,
        }))
      );
      newForm.append("rawMaterialsJson", rawMaterialsJsonPayload);
      newForm.append("quantity", String(submissionQuantity));
    }

    if (mode === "edit" && initialOrder) {
      newForm.append("orderId", String(initialOrder.id));
      newForm.append("orderStatus", formData.orderStatus);
    }

    console.log("Submitting Order Form:", Object.fromEntries(newForm));

    try {
      const response = await fetch(url, {
        method: "POST",
        body: newForm,
      });
      const data = await response.json();
      console.log("Submission Response:", data);

      if (data.errFlag === 0) {
        toast({ title: "Success", description: successMessage });
        fetchOrders();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Operation failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during submission.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "create"
      ? "Create New Production Order"
      : `Edit Order #${initialOrder?.id}`;
  const selectedClient = customers.find((c) => c.id === formData.clientId);
  const selectedProduct = products.find((p) => p.id === formData.productSkuId);
  const filteredClients = customers.filter(
    (client) =>
      client.client_name
        ?.toLowerCase()
        .includes(clientSearchValue.toLowerCase()) ||
      client.email?.toLowerCase().includes(clientSearchValue.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Enter details for a new customer production order."
              : "Update the details and status of an existing order."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Expected Delivery Date */}
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">
                    Expected Delivery Date *
                  </Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedDeliveryDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="client">Customer Name *</Label>
                  <Popover
                    open={clientSearchOpen}
                    onOpenChange={setClientSearchOpen}
                    modal={true}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between"
                        disabled={mode === "edit"}
                      >
                        {selectedClient ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">
                              {selectedClient.client_name}
                            </span>
                          </div>
                        ) : (
                          "Search and select client..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search clients..."
                          value={clientSearchValue}
                          onValueChange={setClientSearchValue}
                        />
                        <CommandList className="max-h-60 overflow-y-auto">
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {filteredClients.map((client) => (
                              <CommandItem
                                key={client.id}
                                onSelect={() => handleClientSelect(client.id)}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.clientId === client.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <Building2 className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      {client.client_name}
                                    </div>
                                    {client.email && (
                                      <div className="text-xs text-muted-foreground">
                                        {client.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Order Type Selector */}
                {/* <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select
                    value={orderType}
                    onValueChange={(value: "single" | "custom") => {
                      setOrderType(value);
                      setFormData({
                        ...formData,
                        productSkuId: "",
                        rawMaterials: [],
                        totalQuantity: 1,
                      });
                      setMaterialErrors({});
                    }}
                    disabled={mode === "edit"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Select Product</SelectItem>
                      <SelectItem value="custom">Add Manually</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="productSkuId">Product *</Label>
                  <Popover
                    open={productSearchOpen}
                    onOpenChange={setProductSearchOpen}
                    modal={true}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedProduct ? (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="truncate">
                              {selectedProduct.product_name}
                            </span>
                          </div>
                        ) : (
                          "Select product..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search products..."
                          value={productSearchValue}
                          onValueChange={setProductSearchValue}
                        />
                        <CommandList className="max-h-60 overflow-y-auto">
                          <CommandEmpty>No product found.</CommandEmpty>
                          <CommandGroup>
                            {loadingData ? (
                              <div className="p-2 text-sm text-center text-muted-foreground">
                                Loading...
                              </div>
                            ) : products.length === 0 ? (
                              <div className="p-2 text-sm text-center text-muted-foreground">
                                No products available
                              </div>
                            ) : (
                              products
                                .filter((p) =>
                                  p.product_name
                                    ?.toLowerCase()
                                    .includes(productSearchValue.toLowerCase())
                                )
                                .map((product) => (
                                  <CommandItem
                                    key={String(product.id)}
                                    onSelect={() =>
                                      handleProductChange(String(product.id))
                                    }
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.productSkuId ===
                                          String(product.id)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {product.product_name}
                                  </CommandItem>
                                ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status (Only visible on Edit mode) 
                {mode === "edit" && (
                  <div className="space-y-2">
                    <Label htmlFor="orderStatus">Order Status</Label>
                    <Select
                      value={formData.orderStatus}
                      onValueChange={(value: OrderFormData["orderStatus"]) =>
                        setFormData({ ...formData, orderStatus: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_production">
                          In Production
                        </SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )} */}
              </CardContent>
            </Card>

            {/* Product & Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {orderType === "single"
                    ? "Product Details"
                    : "Custom Materials"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderType === "single" ? (
                  <>
                    {/* Single Product Selection */}
                    {/* <div className="space-y-2">
                      <Label htmlFor="productSkuId">Product *</Label>
                      <Select
                        value={formData.productSkuId}
                        onValueChange={handleProductChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {loadingData ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Loading...
                            </div>
                          ) : products.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No products available
                            </div>
                          ) : (
                            products.map((product) => (
                              <SelectItem
                                key={String(product.id)}
                                value={String(product.id)}
                              >
                                {product.product_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div> */}

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="totalQuantity">Quantity *</Label>
                      <Input
                        id="totalQuantity"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.totalQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalQuantity: parseInt(e.target.value) || 1,
                          })
                        }
                        required
                      />
                    </div>
                  </>
                ) : (
                  /* Custom Materials Selection */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">
                        Raw Materials / Components
                      </Label>
                      <Button
                        type="button"
                        onClick={addRawMaterial}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {formData.rawMaterials.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="grid grid-cols-12 gap-2 items-end">
                            {/* Material Selection */}
                            <div className="col-span-5 space-y-1">
                              <Label className="text-xs">Raw Material *</Label>
                              <Select
                                value={item.rawMaterialId || item.id}
                                onValueChange={(value) =>
                                  updateRawMaterial(
                                    index,
                                    "rawMaterialId",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={
                                    materialErrors[index]?.rawMaterialId
                                      ? "border-red-500"
                                      : ""
                                  }
                                >
                                  <SelectValue placeholder="Select raw material" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {getAvailableMaterials(index).map(
                                    (material) => (
                                      <SelectItem
                                        key={String(material.id)}
                                        value={String(material.id)}
                                      >
                                        {material.material_name}
                                        {material.material_code &&
                                          ` (${material.material_code})`}
                                      </SelectItem>
                                    )
                                  )}
                                  {getAvailableMaterials(index).length ===
                                    0 && (
                                    <SelectItem value="no-materials" disabled>
                                      No materials available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              {materialErrors[index]?.rawMaterialId && (
                                <p className="text-red-500 text-xs mt-1">
                                  {materialErrors[index]?.rawMaterialId}
                                </p>
                              )}
                            </div>

                            {/* Quantity Input */}
                            <div className="col-span-3 space-y-1">
                              <Label className="text-xs">Quantity *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateRawMaterial(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className={
                                  materialErrors[index]?.quantity
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {materialErrors[index]?.quantity && (
                                <p className="text-red-500 text-xs mt-1">
                                  {materialErrors[index]?.quantity}
                                </p>
                              )}
                            </div>

                            {/* Unit Selection */}
                            <div className="col-span-3 space-y-1">
                              <Label className="text-xs">Unit *</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(value) =>
                                  updateRawMaterial(index, "unit", value)
                                }
                              >
                                <SelectTrigger
                                  className={
                                    materialErrors[index]?.unit
                                      ? "border-red-500"
                                      : ""
                                  }
                                >
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {units.map((unit, idx) => (
                                    <SelectItem
                                      key={idx}
                                      value={unit.unit_name || unit.unit}
                                    >
                                      {unit.unit_name || unit.unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {materialErrors[index]?.unit && (
                                <p className="text-red-500 text-xs mt-1">
                                  {materialErrors[index]?.unit}
                                </p>
                              )}
                            </div>

                            {/* Remove Button */}
                            <div className="col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRawMaterial(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={formData.rawMaterials.length <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Material Info Display */}
                          {item.rawMaterialId && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              {item.sku && item.sku !== "N/A" && (
                                <Badge variant="outline" className="text-xs">
                                  Code: {item.sku}
                                </Badge>
                              )}
                              <span>Material: {item.productName}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {formData.rawMaterials.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No materials added yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click "Add Material" to start building your custom
                          order
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes or special instructions"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.clientId ||
                !formData.expectedDeliveryDate ||
                (orderType === "single" &&
                  (!formData.productSkuId || formData.totalQuantity < 1)) ||
                (orderType === "custom" && formData.rawMaterials.length === 0)
              }
            >
              {loading ? (
                <>{mode === "create" ? "Creating..." : "Updating..."}</>
              ) : (
                <>{mode === "create" ? "Create Order" : "Update Order"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

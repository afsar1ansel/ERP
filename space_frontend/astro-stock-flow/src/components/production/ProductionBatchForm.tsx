import React, { useEffect, useState } from "react";
import axios from "axios";
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
  AlertTriangle,
  Plus,
  Minus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ClientSelect from "./ClientSelect";
import { addProductionBatch, updateProductionBatch } from "@/pages/Production";
import ProductionStages from "./ProductionStages";

interface ProductionBatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit";
  batchData?: any;
  prefillOrderData?: any;
  token: string;
  baseUrl: string;
  onSuccess: () => void;
}

interface ProductOption {
  id: string;
  product_name: string;
  product_category_name?: string;
  brand?: string;
  name?: string;
}

interface ClientOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  priority?: string;
  client_name?: string;
}

interface Employee {
  id: string;
  name: string;
  department?: string;
  currentLoad?: number;
}

interface RawMaterial {
  material_name: string;
  quantity: number;
  unit: string;
  rawMaterialId?: string;
}

export function ProductionBatchForm({
  open,
  onOpenChange,
  mode = "add",
  batchData,
  prefillOrderData,
  token,
  baseUrl,
  onSuccess,
}: ProductionBatchFormProps) {
  const { toast } = useToast();

  const [productionStageCategories, setProductionStageCategories] = useState<
    any[]
  >([]);

  const [formData, setFormData] = useState({
    ordersId: "",
    productId: "",
    clientId: "",
    quantity: "",
    priority: 0,
    expectedCompletion: "",
    productionHead: "",
    notes: "",
    status: "",
    productionStages: [] as Array<{ stageId: number; weightage: number; employeeIds: number[] }>,
    stageCategoryId: "manual", // "manual" = choose stages manually, otherwise category id as string
    floor: 0,
    manualProductName: "",
    isManualProduct: false,
    manualRawMaterials: [] as RawMaterial[],
  });

  const [canProceed, setCanProceed] = useState(true);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  // Manual product states
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [materialCategories, setMaterialCategories] = useState<
    { id: string; materialCategory: string; stockQty: number }[]
  >([]);
  const [units, setUnits] = useState<{ unit: string }[]>([]);
  const [manualProductErrors, setManualProductErrors] = useState<any>({
    rawMaterials: [],
  });

  // Client popover/search

  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [productionStages, setProductionStages] = useState<any[]>([]);

  // Fetch all data including material categories and units

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const headers = {};
        const [
          productsRes,
          clientsRes,
          employeesRes,
          rawMaterialsRes,
          materialCategoriesRes,
          unitsRes,
          ordersRes,
          categoriesRes, // added
        ] = await Promise.all([
          axios.get(`${baseUrl}/product-skus/get-all/${token}`, { headers }),
          axios.get(`${baseUrl}/clients/get-all/${token}`, { headers }),
          axios.get(`${baseUrl}/employees/get-all/${token}`, { headers }),
          axios.get(`${baseUrl}/production-stages/get-all/${token}`, {
            headers,
          }),
          axios.get(`${baseUrl}/raw-materials/get-all/${token}`, { headers }),
          axios.get(`${baseUrl}/units/get-units/${token}`, { headers }),
          axios.get(`${baseUrl}/orders/get-all/${token}`, { headers }),
          axios.get(`${baseUrl}/production-stage-categories/get-all/${token}`, {
            headers,
          }), // new
        ]);

        if (cancelled) return;

        setOrders(
          (ordersRes.data?.data && Array.isArray(ordersRes.data.data)
            ? ordersRes.data.data
            : Array.isArray(ordersRes.data)
              ? ordersRes.data
              : ordersRes.data?.result || []
          ).map((o: any) => ({
            ...o,
            id: String(o.id || o.order_id || ""),
          }))
        );

        setProductOptions(
          (Array.isArray(productsRes.data)
            ? productsRes.data
            : productsRes.data?.result || []
          ).map((p: any) => ({
            ...p,
            id: String(p.id || p.product_id || p.product_sku_id || ""),
          }))
        );

        setClients(
          (Array.isArray(clientsRes.data)
            ? clientsRes.data
            : clientsRes.data?.result || []
          ).map((c: any) => ({
            ...c,
            id: String(c.id || c.client_id || ""),
            client_name: c.client_name || c.name || "N/A",
          }))
        );

        setEmployees(
          (Array.isArray(employeesRes.data)
            ? employeesRes.data
            : employeesRes.data?.result || []
          ).map((e: any) => ({
            ...e,
            id: String(e.id || e.employee_id || ""),
          }))
        );

        setProductionStages(
          Array.isArray(rawMaterialsRes.data)
            ? rawMaterialsRes.data
            : rawMaterialsRes.data?.result || []
        );

        // Set material categories and units for manual product

        setMaterialCategories(
          Array.isArray(materialCategoriesRes.data)
            ? materialCategoriesRes.data.map((m: any) => ({
              id: String(m.id),
              materialCategory: m.material_name,
              stockQty: m.stock_qty,
            }))
            : materialCategoriesRes.data?.result?.map((m: any) => ({
              id: String(m.id),
              materialCategory: m.material_name,
              stockQty: m.stock_qty,
            })) || []
        );

        setUnits(
          Array.isArray(unitsRes.data)
            ? unitsRes.data.map((u: any) => ({ unit: u.unit_name }))
            : unitsRes.data?.result?.map((u: any) => ({ unit: u.unit_name })) ||
            []
        );

        // production stage categories
        setProductionStageCategories(
          Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : categoriesRes.data?.data && Array.isArray(categoriesRes.data.data)
              ? categoriesRes.data.data
              : categoriesRes.data?.result || []
        );
      } catch (err) {
        console.error("Failed to fetch lists:", err);
        toast({
          title: "Failed to load data",
          description:
            "Could not fetch products/clients/employees. Check your API and token.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, token, toast]);

  // Prefill in edit mode

  useEffect(() => {
    if (mode === "edit" && batchData) {
      setFormData({
        ordersId: batchData.orderId || batchData.order_id || "",
        productId: batchData.productId || batchData.product_id || "",
        clientId:
          batchData.clientId || batchData.client_id || batchData.clientId || "",
        quantity: String(batchData.planned_qty || batchData.qty || ""),
        priority: batchData.priority !== undefined ? parseInt(batchData.priority) : 0,
        expectedCompletion:
          batchData.expectedCompletionDate ||
          batchData.expected_completion ||
          batchData.expected_completion_date ||
          "",
        productionHead:
          batchData.productionHeadEmployeeId ||
          batchData.production_head_employee_id ||
          batchData.productionHead ||
          "",
        notes:
          batchData.productionNotes ||
          batchData.production_notes ||
          batchData.notes ||
          "",
        productionStages: batchData.stages
          ? batchData.stages.map((st: any) => ({
            stageId: st.stage_id || st.stageId,
            weightage: st.weightage || 0,
            employeeIds: st.assigned_employees
              ? st.assigned_employees.map((e: any) => e.employee_id || e.id)
              : st.employeeIds || [],
          }))
          : [],
        stageCategoryId: "manual", // Add this line
        status: batchData.batch_status,
        floor: batchData.floor,
        manualProductName: "",
        isManualProduct: false,
        manualRawMaterials: [],
      });
    } else if (mode === "add" && prefillOrderData) {
      // Robust mapping for prefill data
      const rawData = Array.isArray(prefillOrderData) ? prefillOrderData[0] : prefillOrderData;
      console.log("Normalizing prefillOrderData:", rawData);

      if (rawData) {
        const orderId = rawData.id || rawData.order_id || "";
        const productId = rawData.product_sku_id || rawData.product_id || "";
        const clientId = rawData.client_id || rawData.clientId || "";
        const quantity = rawData.quantity || rawData.qty || "";
        const notes = rawData.notes || "";
        const rawMaterialsJson = rawData.raw_materials_json || rawData.rawMaterialsJson;

        let isManual = false;
        let manualMaterials: RawMaterial[] = [];

        // Check if it is a custom product (no product sku id)
        if (!productId && rawMaterialsJson) {
          isManual = true;
          try {
            const rawMats = typeof rawMaterialsJson === "string" ? JSON.parse(rawMaterialsJson) : rawMaterialsJson;
            if (Array.isArray(rawMats)) {
              manualMaterials = rawMats.map((rm: any) => ({
                material_name: rm.material_name || rm.materialName || "N/A",
                quantity: parseFloat(rm.quantity) || 0,
                unit: rm.unit || "",
                rawMaterialId: String(rm.raw_material_id || rm.rawMaterialId || ""),
              }));
            }
          } catch (e) {
            console.error("Error parsing raw_materials_json for production prefill:", e);
          }
        }

        let expectedDateStr = "";
        const deliveryDate = rawData.expected_delivery_date || rawData.expectedDeliveryDate;
        if (deliveryDate) {
          try {
            const d = new Date(deliveryDate);
            if (!isNaN(d.getTime())) {
              expectedDateStr = d.toISOString().split("T")[0];
            }
          } catch (e) {
            console.error("Date parse error:", e);
          }
        }

        setFormData({
          ordersId: orderId ? String(orderId) : "",
          productId: isManual ? "" : (productId ? String(productId) : ""),
          clientId: clientId ? String(clientId) : "",
          quantity: String(quantity),
          priority: 0,
          expectedCompletion: expectedDateStr,
          productionHead: "",
          notes: notes,
          productionStages: [],
          stageCategoryId: "manual",
          status: "",
          floor: 0,
          manualProductName: isManual ? (rawData.product_name || "Custom Order Product") : "",
          isManualProduct: isManual,
          manualRawMaterials: isManual ? manualMaterials : [
            { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
          ],
        });
        setShowManualProduct(isManual);
      }
    } else if (mode === "add") {
      // Reset when mode is add
      setFormData({
        ordersId: "",
        productId: "",
        clientId: "",
        quantity: "",
        priority: 0,
        expectedCompletion: "",
        productionHead: "",
        notes: "",
        productionStages: [],
        stageCategoryId: "manual", // Add this line
        status: "",
        floor: 0,
        manualProductName: "",
        isManualProduct: false,
        manualRawMaterials: [
          { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
        ],
      });
    }
  }, [mode, batchData, prefillOrderData]);

  const selectedProduct = productOptions.find(
    (p) => String(p.id) === String(formData.productId)
  );

  const selectedClient = clients.find(
    (c) => String(c.id) === String(formData.clientId)
  );

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
      client.email?.toLowerCase().includes(clientSearchValue.toLowerCase())
  );

  const handleOrderChange = (orderId: string) => {
    if (!orderId) {
      setFormData((prev) => ({ ...prev, ordersId: "" }));
      return;
    }

    const orderData = orders.find((o) => String(o.id) === String(orderId));
    if (!orderData) {
      setFormData((prev) => ({ ...prev, ordersId: orderId }));
      return;
    }

    console.log("Auto-filling from selected order:", orderData);

    // Reuse the same robust normalization logic
    const productId = orderData.product_sku_id || orderData.product_id || "";
    const clientId = orderData.client_id || orderData.clientId || "";
    const quantity = orderData.quantity || orderData.qty || "";
    const notes = orderData.notes || "";
    const rawMaterialsJson = orderData.raw_materials_json || orderData.rawMaterialsJson;

    let isManual = false;
    let manualMaterials: RawMaterial[] = [];

    if (!orderData.product_sku_id && rawMaterialsJson) {
      isManual = true;
      try {
        const rawMats = typeof rawMaterialsJson === "string" ? JSON.parse(rawMaterialsJson) : rawMaterialsJson;
        if (Array.isArray(rawMats)) {
          manualMaterials = rawMats.map((rm: any) => ({
            material_name: rm.material_name || rm.materialName || "N/A",
            quantity: parseFloat(rm.quantity) || 0,
            unit: rm.unit || "",
            rawMaterialId: String(rm.raw_material_id || rm.rawMaterialId || ""),
          }));
        }
      } catch (e) {
        console.error("Error parsing materials for auto-fill:", e);
      }
    }

    let expectedDateStr = "";
    const deliveryDate = orderData.expected_delivery_date || orderData.expectedDeliveryDate;
    if (deliveryDate) {
      try {
        const d = new Date(deliveryDate);
        if (!isNaN(d.getTime())) {
          expectedDateStr = d.toISOString().split("T")[0];
        }
      } catch (e) {
        console.error("Date parse error:", e);
      }
    }

    setFormData((prev) => ({
      ...prev,
      ordersId: String(orderId),
      productId: isManual ? "" : (productId ? String(productId) : ""),
      clientId: clientId ? String(clientId) : "",
      quantity: String(quantity),
      expectedCompletion: expectedDateStr,
      notes: notes,
      manualProductName: isManual ? (orderData.product_name || "Custom Order Product") : "",
      isManualProduct: isManual,
      manualRawMaterials: isManual ? manualMaterials : [
        { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
      ],
    }));
    setShowManualProduct(isManual);
  };

  const handleProductChange = (productId: string) => {
    if (productId === "manual") {
      setShowManualProduct(true);

      setFormData((prev) => ({
        ...prev,

        productId: "",

        isManualProduct: true,

        manualProductName: "",

        manualRawMaterials: [
          { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
        ],
      }));
    } else {
      setShowManualProduct(false);

      setFormData((prev) => ({
        ...prev,

        productId,

        isManualProduct: false,

        manualProductName: "",

        manualRawMaterials: [],
      }));
    }
    setProductSearchOpen(false);
  };

  const handleClientSelect = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId }));

    setClientSearchOpen(false);
  };

  // Manual product handlers

  const handleManualProductNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, manualProductName: value }));
  };

  const handleManualMaterialChange = (
    index: number,

    field: string,

    value: string | number
  ) => {
    const updatedMaterials = [...formData.manualRawMaterials];

    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };

    setFormData((prev) => ({ ...prev, manualRawMaterials: updatedMaterials }));

    if (manualProductErrors.rawMaterials[index]?.[field]) {
      const newErrors = { ...manualProductErrors };

      delete newErrors.rawMaterials[index][field];

      if (Object.keys(newErrors.rawMaterials[index]).length === 0)
        newErrors.rawMaterials[index] = undefined;

      setManualProductErrors(newErrors);
    }
  };

  const handleManualMaterialAdd = () => {
    setFormData((prev) => ({
      ...prev,

      manualRawMaterials: [
        ...prev.manualRawMaterials,

        { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
      ],
    }));
  };

  const handleManualMaterialRemove = (index: number) => {
    if (formData.manualRawMaterials.length > 1) {
      setFormData((prev) => ({
        ...prev,

        manualRawMaterials: prev.manualRawMaterials.filter(
          (_, i) => i !== index
        ),
      }));
    }
  };

  const getAvailableMaterials = (currentIndex: number) => {
    const selectedMaterialIds = formData.manualRawMaterials

      .map((material, index) =>
        index !== currentIndex ? material.rawMaterialId : null
      )

      .filter(Boolean);

    return materialCategories.filter(
      (material) => !selectedMaterialIds.includes(material.id)
    );
  };

  // Validate manual product

  const validateManualProduct = () => {
    const newErrors: any = { rawMaterials: [] };

    if (formData.manualRawMaterials.length === 0) {
      newErrors.rawMaterialsError = "At least one raw material is required.";
    }

    formData.manualRawMaterials.forEach((rm, index) => {
      const itemErrors: any = {};

      if (!rm.rawMaterialId) itemErrors.rawMaterialId = "Required.";

      if (!rm.quantity || rm.quantity <= 0)
        itemErrors.quantity = "Must be > 0.";

      if (!rm.unit) itemErrors.unit = "Required.";

      const selectedMaterial = materialCategories.find(
        (m) => m.id === rm.rawMaterialId
      );

      if (selectedMaterial && rm.quantity > selectedMaterial.stockQty) {
        itemErrors.quantity = `Max stock: ${selectedMaterial.stockQty}`;
      }

      if (Object.keys(itemErrors).length > 0)
        newErrors.rawMaterials[index] = itemErrors;
    });

    setManualProductErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0 ||
      (Object.keys(newErrors).length === 1 &&
        newErrors.rawMaterials.every((e: any) => !e))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate manual product if in manual mode

    if (formData.isManualProduct && !validateManualProduct()) {
      toast({
        title: "Validation Error",

        description:
          "Please correct the manual product errors before submitting.",

        variant: "destructive",
      });

      return;
    }

    // Basic validation

    if (!formData.productId && !formData.isManualProduct) {
      toast({
        title: "Missing product",

        description: "Please select a product or create a manual product.",

        variant: "destructive",
      });

      return;
    }

    if (
      !formData.clientId ||
      !formData.quantity ||
      !formData.expectedCompletion ||
      !formData.productionHead ||
      formData.floor === undefined ||
      formData.floor === null
    ) {
      toast({
        title: "Missing Fields",
        description:
          "Please fill in all required fields: Client, Quantity, Expected Completion Date, Production Head, and Floor.",
        variant: "destructive",
      });

      return;
    }

    if (!canProceed) {
      toast({
        title: "Cannot proceed",

        description: "Raw material validation failed.",

        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    try {
      const payloadBase: any = {
        quantity: formData.quantity,
        clientId: formData.clientId,
        expectedCompletionDate: formData.expectedCompletion,
        productionHeadEmployeeId: formData.productionHead,
        productionNotes: formData.notes,
        stages: formData.productionStages,
        stageCategoryId: formData.stageCategoryId,
        floor: formData.floor,
        ordersId: formData.ordersId,
        priority: formData.priority,
        token,
      };

      // Add product data based on mode
      if (formData.isManualProduct) {
        payloadBase.manualProduct = {
          productName: formData.manualProductName,
          rawMaterials: formData.manualRawMaterials,
        };
      } else {
        payloadBase.productId = formData.productId;
      }

      if (mode === "add") {
        const res = await addProductionBatch(payloadBase);

        if (res.errFlag !== 0) {
          toast({
            title: "Error",
            description: res.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Production Batch Added",
            description: `Batch added successfully. Batch id: ${res.batchId}.`,
          });

          onSuccess();
        }
      } else {
        const batchId =
          (batchData &&
            (batchData.batchId || batchData.id || batchData.batch_id)) ||
          (payloadBase as any).batchId;

        if (!batchId) {
          toast({
            title: "Missing batch id",
            description: "Cannot update: batch id missing in edit mode.",
            variant: "destructive",
          });

          setLoading(false);

          return;
        }

        const res = await updateProductionBatch({
          ...payloadBase,
          batchId,
          batchStatus: formData.status,
        });

        if (res.errFlag !== 0) {
          toast({
            title: "Error",
            description: res.errMsg,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Production Batch Updated",
            description: `Batch updated successfully.`,
          });

          onSuccess();
        }
      }

      onOpenChange(false);

      if (mode === "add") {
        setFormData({
          ordersId: "",
          productId: "",
          clientId: "",
          quantity: "",
          priority: 0,
          expectedCompletion: "",
          productionHead: "",
          notes: "",
          productionStages: [],
          stageCategoryId: "",
          status: "",
          floor: 0,
          manualProductName: "",
          isManualProduct: false,
          manualRawMaterials: [
            { material_name: "", quantity: 0, unit: "", rawMaterialId: "" },
          ],
        });

        setShowManualProduct(false);
      }
    } catch (err: any) {
      console.error("Submit failed:", err);

      toast({
        title: "Submission failed",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong while submitting the batch.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // helper to select a category
  const handleStageCategoryChange = (value: string) => {
    if (value === "manual") {
      // switch to manual mode, keep existing productionStages (or clear if you prefer)
      setFormData((prev) => ({ ...prev, stageCategoryId: "manual" }));
    } else {
      const cat = productionStageCategories.find((c) => String(c.id) === value);
      let stagesArr: any[] = [];
      if (cat) {
        try {
          if (typeof cat.stages === "string") {
            stagesArr = JSON.parse(cat.stages);
          } else if (Array.isArray(cat.stages)) {
            stagesArr = cat.stages;
          }
        } catch (err) {
          console.warn("Failed to parse category.stages", err);
          stagesArr = [];
        }
      }
      setFormData((prev) => ({
        ...prev,
        stageCategoryId: value,
        productionStages: stagesArr.map((s: any) => ({
          stageId: typeof s === "object" ? s.stageId : s,
          weightage: typeof s === "object" ? s.weightage : 0,
          employeeIds: [],
        })),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Create Production Batch"
              : "Edit Production Batch"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Order (optional)</Label>
                  <Select
                    key={`order-select-${orders.length}-${formData.ordersId}`}
                    value={formData.ordersId}
                    onValueChange={(value) => handleOrderChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingData ? (
                        <span className="p-2 text-sm text-muted-foreground">
                          Loading orders...
                        </span>
                      ) : orders && orders.length > 0 ? (
                        orders.map((order: any) => (
                          <SelectItem
                            key={order.id}
                            value={order.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {order.order_code}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({order.client_name})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <span className="p-2 text-sm text-muted-foreground">
                          No orders available
                        </span>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {!showManualProduct ? (
                  <div className="space-y-2">
                    <Label htmlFor="product">Product *</Label>

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
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {selectedProduct.product_name}
                                {selectedProduct.product_category_name
                                  ? ` (${selectedProduct.product_category_name})`
                                  : ""}
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
                              <CommandItem
                                onSelect={() => handleProductChange("manual")}
                                className="font-semibold text-blue-600 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Manually
                                </div>
                              </CommandItem>

                              {loadingData ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  Loading...
                                </div>
                              ) : productOptions.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  No products available
                                </div>
                              ) : (
                                productOptions
                                  .filter((p: any) =>
                                    p.product_name
                                      ?.toLowerCase()
                                      .includes(
                                        productSearchValue.toLowerCase()
                                      )
                                  )
                                  .map((product: any) => (
                                    <CommandItem
                                      key={product.id}
                                      onSelect={() =>
                                        handleProductChange(product.id)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              String(formData.productId) ===
                                                String(product.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <span>{product.product_name}</span>
                                        </div>
                                        {product.product_category_name && (
                                          <span className="text-xs text-muted-foreground">
                                            {product.product_category_name}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Manual Product</Label>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowManualProduct(false);

                          setFormData((prev) => ({
                            ...prev,

                            isManualProduct: false,

                            manualProductName: "",

                            manualRawMaterials: [],
                          }));
                        }}
                      >
                        Select from existing
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Raw Materials Consumed *</Label>

                        <Button
                          type="button"
                          onClick={handleManualMaterialAdd}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>

                      <div className="border rounded-md p-3 space-y-3 max-h-60 overflow-y-auto">
                        {formData.manualRawMaterials.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No materials added.
                          </p>
                        ) : (
                          formData.manualRawMaterials.map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 items-end"
                            >
                              <div className="col-span-5 space-y-1">
                                <Label className="text-xs">Material</Label>

                                <Select
                                  value={item.rawMaterialId || ""}
                                  onValueChange={(value) =>
                                    handleManualMaterialChange(
                                      index,

                                      "rawMaterialId",

                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {getAvailableMaterials(index).map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
                                        {m.materialCategory}
                                      </SelectItem>
                                    ))}

                                    {getAvailableMaterials(index).length ===
                                      0 && (
                                        <SelectItem value="no-materials" disabled>
                                          No materials available
                                        </SelectItem>
                                      )}
                                  </SelectContent>
                                </Select>

                                {manualProductErrors.rawMaterials[index]
                                  ?.rawMaterialId && (
                                    <p className="text-red-500 text-xs">
                                      {
                                        manualProductErrors.rawMaterials[index]
                                          .rawMaterialId
                                      }
                                    </p>
                                  )}
                              </div>

                              <div className="col-span-3 space-y-1">
                                <Label className="text-xs">Quantity</Label>

                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleManualMaterialChange(
                                      index,

                                      "quantity",

                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />

                                {manualProductErrors.rawMaterials[index]
                                  ?.quantity && (
                                    <p className="text-red-500 text-xs">
                                      {
                                        manualProductErrors.rawMaterials[index]
                                          .quantity
                                      }
                                    </p>
                                  )}
                              </div>

                              <div className="col-span-3 space-y-1">
                                <Label className="text-xs">Unit</Label>

                                <Select
                                  value={item.unit}
                                  onValueChange={(value) =>
                                    handleManualMaterialChange(
                                      index,

                                      "unit",

                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {units.map((u, idx) => (
                                      <SelectItem key={idx} value={u.unit}>
                                        {u.unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {manualProductErrors.rawMaterials[index]
                                  ?.unit && (
                                    <p className="text-red-500 text-xs">
                                      {
                                        manualProductErrors.rawMaterials[index]
                                          .unit
                                      }
                                    </p>
                                  )}
                              </div>

                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleManualMaterialRemove(index)
                                  }
                                  disabled={
                                    formData.manualRawMaterials.length <= 1
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {manualProductErrors.rawMaterialsError && (
                        <p className="text-red-500 text-sm mt-1">
                          {manualProductErrors.rawMaterialsError}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="floor">Floor *</Label>

                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,

                        floor: Number(e.target.value),
                      }))
                    }
                    placeholder="Enter floor"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>

                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,

                        quantity: e.target.value,
                      }))
                    }
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client">Client *</Label>

                  <Popover
                    open={clientSearchOpen}
                    onOpenChange={setClientSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedClient ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                              {selectedClient.client_name}
                            </span>
                          </div>
                        ) : (
                          "Search and select client..."
                        )}

                        <ChevronsUpDown className="ml-2 h-4 w-full shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search clients..."
                          value={clientSearchValue}
                          onValueChange={setClientSearchValue}
                        />

                        <CommandEmpty>No client found.</CommandEmpty>

                        <CommandGroup className="max-h-64 overflow-y-auto">
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

                                    String(formData.clientId) ===
                                      String(client.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />

                                <Building2 className="h-4 w-4" />

                                <div>
                                  <div className="font-medium">
                                    {client.client_name}
                                  </div>

                                  <div className="text-xs text-muted-foreground">
                                    {client.email}
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="completion">Expected Completion Date *</Label>

                  <Input
                    id="completion"
                    type="date"
                    value={
                      formData.expectedCompletion
                        ? new Date(formData.expectedCompletion)

                          ?.toISOString()

                          ?.split("T")[0]
                        : ""
                    }
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,

                        expectedCompletion: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Batch Priority</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Medium</SelectItem>
                      <SelectItem value="2">High</SelectItem>
                      <SelectItem value="3">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Production Stages: allow category OR manual selection */}
                <div>
                  <Label>Production Stage Category (optional)</Label>
                  <Select
                    value={formData.stageCategoryId}
                    onValueChange={(value) => handleStageCategoryChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose category or use manual stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        Manual selection (choose stages)
                      </SelectItem>
                      {loadingData ? (
                        <span className="p-2 text-sm text-muted-foreground">
                          Loading...
                        </span>
                      ) : productionStageCategories.length === 0 ? (
                        <span className="p-2 text-sm text-muted-foreground">
                          No categories
                        </span>
                      ) : (
                        productionStageCategories.map((cat: any) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            <div className="flex items-center justify-between">
                              <span>{cat.category_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {Array.isArray(cat.stages)
                                  ? cat.stages.length
                                  : typeof cat.stages === "string"
                                    ? JSON.parse(cat.stages || "[]").length
                                    : 0}{" "}
                                stages
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Render manual stage multi-select only when in manual mode */}
                {formData.stageCategoryId === "manual" && (
                  <ProductionStages
                    formData={formData}
                    setFormData={setFormData}
                    productionStages={productionStages}
                    employees={employees}
                  />
                )}

                {/* When a category is selected, show read-only summary */}
                {formData.stageCategoryId !== "manual" &&
                  formData.stageCategoryId !== "" && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {/* Selected category stages:{" "}
                      {formData.productionStages.length > 0
                        ? formData.productionStages.join(", ")
                        : "None"} */}
                    </div>
                  )}

                {mode == "edit" && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>

                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,

                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>

                        <SelectItem value="inprogress">In Progress</SelectItem>

                        <SelectItem value="completed">Completed</SelectItem>

                        <SelectItem value="on_hold">On Hold</SelectItem>

                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Production Head Assignment */}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assignment & Accountability
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productionHead">Production Head *</Label>

                  <Select
                    value={formData.productionHead}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,

                        productionHead: value,
                      }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign production head" />
                    </SelectTrigger>

                    <SelectContent>
                      {loadingData ? (
                        <span className="p-2 text-sm text-muted-foreground">
                          Loading...
                        </span>
                      ) : employees.length === 0 ? (
                        <span className="p-2 text-sm text-muted-foreground">
                          No employees found
                        </span>
                      ) : (
                        employees.map((head: any) => (
                          <SelectItem key={head.id} value={head.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {head.name}{" "}
                                {head.department_name
                                  ? `- ${head.department_name}`
                                  : ""}
                              </span>

                              {typeof head.currentLoad === "number" && (
                                <Badge
                                  variant={
                                    head.currentLoad > 80
                                      ? "destructive"
                                      : head.currentLoad > 60
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className="ml-2"
                                >
                                  {head.currentLoad}% load
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Production Notes</Label>

                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,

                        notes: e.target.value,
                      }))
                    }
                    placeholder="Special instructions, quality requirements, etc."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading ||
                (!formData.productId && !formData.isManualProduct) ||
                !formData.quantity ||
                !formData.clientId ||
                !formData.expectedCompletion ||
                !formData.productionHead ||
                (formData.isManualProduct &&
                  formData.manualRawMaterials.length == 0)
              }
            >
              {loading
                ? mode === "add"
                  ? "Creating..."
                  : "Updating..."
                : mode === "add"
                  ? "Create Production Batch"
                  : "Update Production Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

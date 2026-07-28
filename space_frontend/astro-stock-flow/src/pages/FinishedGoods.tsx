import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  Search,
  Edit,
  Eye,
  ChevronDown,
  ShoppingBag,
  FileEdit,
  Upload,
  Download,
  X,
} from "lucide-react";
import { PaginationControls } from "../components/ui/pagination-controls";
import { ReceiveFromProductionForm } from "@/components/inventory/ReceiveFromProductionForm";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { TransferStockForm } from "@/components/inventory/TransferStockForm";
import { QuickDispatchForm } from "@/components/inventory/QuickDispatchForm";
import { BulkStockUpdateForm } from "@/components/inventory/BulkStockUpdateForm";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";
export const receiveFromProduction = async ({
  productionBatchId,
  storageLocationId,
  quantity,
  notes,
  token,
}: {
  productionBatchId: string;
  storageLocationId: string;
  quantity: number;
  notes?: string;
  token: string;
}) => {
  const payload = new FormData();
  payload.append("productionBatchId", productionBatchId);
  payload.append("storageLocationId", storageLocationId);
  payload.append("quantity", quantity.toString());
  if (notes) payload.append("notes", notes);
  payload.append("token", token);

  const res = await axios.post(
    `${BASE_URL}/production-receipts/receive`,
    payload,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

// --------------------
// Finished Goods
// --------------------

// Update finished goods
export const updateFinishedGoods = async ({
  fgId,
  productName,
  productImage, // File object
  skuCode,
  brandId,
  productCategoryId,
  minLevel,
  maxLevel,
  storageLocationId,
  unitPrice,
  rawMaterialCost,
  velocity,
  goodsStatus, // 'in-stock' | 'low-stock' | 'out-of-stock'
  lastProduced, // ISO date string
  token,
}: {
  fgId: string;
  productName: string;
  productImage?: File;
  skuCode: string;
  brandId: string;
  productCategoryId: string;
  minLevel: number;
  maxLevel: number;
  storageLocationId: string;
  unitPrice: number;
  rawMaterialCost: number;
  velocity: number;
  goodsStatus: "in-stock" | "low-stock" | "out-of-stock";
  lastProduced: string;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("fgId", fgId);
  formData.append("productName", productName);
  if (productImage) formData.append("productImage", productImage);
  formData.append("skuCode", skuCode);
  formData.append("brandId", brandId);
  formData.append("productCategoryId", productCategoryId);
  formData.append("minLevel", minLevel.toString());
  formData.append("maxLevel", maxLevel.toString());
  formData.append("storageLocationId", storageLocationId);
  formData.append("unitPrice", unitPrice.toString());
  formData.append("rawMaterialCost", rawMaterialCost.toString());
  formData.append("velocity", velocity.toString());
  formData.append("goodsStatus", goodsStatus);
  formData.append("lastProduced", lastProduced);
  formData.append("token", token);

  const res = await axios.post(`${BASE_URL}/finished-goods/update`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get all finished goods
export const getAllFinishedGoods = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/finished-goods/get-all/${token}`);
  console.log(res.data);
  return res.data;
};

// Get finished good details
export const getFinishedGoodDetails = async (fgId: string, token: string) => {
  const res = await axios.get(
    `${BASE_URL}/finished-goods/get-details/${fgId}/${token}`
  );
  return res.data;
};

interface FinishedGood {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  storageLocation: string;
  unitPrice: number;
  totalValue: number;
  lastProduced: string;
  rawMaterialsCost: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  velocity: "fast" | "medium" | "slow";
  image: string;
}

const FinishedGoods = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiveFromProductionOpen, setReceiveFromProductionOpen] =
    useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [transferStockOpen, setTransferStockOpen] = useState(false);
  const [quickDispatchOpen, setQuickDispatchOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [goods, setGoods] = useState([]);
  const { toast } = useToast();
  const token = localStorage.getItem("token");
  const [mockFinishedGoods, setMockFinishedGoods] = useState([]);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState({});
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Image Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Detail Dialog State
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);

  const filteredData = mockFinishedGoods?.filter(
    (item) =>
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_category_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredData.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "default";
      case "low-stock":
        return "secondary";
      case "out-of-stock":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case "fast":
        return "default";
      case "medium":
        return "secondary";
      case "slow":
        return "outline";
      default:
        return "outline";
    }
  };

  const getVelocityLabel = (velocity: string) => {
    switch (velocity) {
      case "fast":
        return "Fast Moving";
      case " medium":
        return "medium";
      case "slow":
        return "Slow Moving";
      default:
        return "unknown";
    }
  };

  const handleBulkUpdate = (updates: any[]) => {
    // In a real app, this would make API calls to update the stock
    console.log("Bulk updating stock:", updates);
    toast({
      title: "Bulk Update Complete",
      description: `Successfully updated ${updates.length} items.`,
    });
  };

  const fetchFinishedGoodsData = async () => {
    const res = await getAllFinishedGoods(token);
    setMockFinishedGoods(res);
    console.log(res);
  };

  const [quickStats, setQuickStats] = useState([]);
  const calculateQuickStats = (goods: any[]) => {
    if (!goods || goods.length === 0) {
      return [
        {
          title: "Total SKUs",
          value: "0",
          icon: Package,
          color: "text-primary",
        },
        {
          title: "Low Stock Items",
          value: "0",
          icon: AlertTriangle,
          color: "text-destructive",
        },
        {
          title: "Storage Locations",
          value: "0",
          icon: Warehouse,
          color: "text-success",
        },
        {
          title: "Fast Moving",
          value: "0",
          icon: TrendingUp,
          color: "text-warning",
        },
      ];
    }

    // Total SKUs - count all finished goods
    const totalSKUs = goods.length;

    // Low Stock Items - count items with low-stock status
    const lowStockItems = goods.filter(
      (item) => item.goods_status?.trim() === "low-stock"
    ).length;

    // Storage Locations - count unique storage locations
    const uniqueStorageLocations = new Set(
      goods.map((item) => item.storage_location_id).filter(Boolean)
    ).size;

    // Fast Moving - count items with 'fast' velocity
    const fastMovingItems = goods.filter(
      (item) => item.velocity?.trim() === "fast"
    ).length;

    return [
      {
        title: "Total SKUs",
        value: totalSKUs.toLocaleString(),
        icon: Package,
        color: "text-primary",
      },
      {
        title: "Low Stock Items",
        value: lowStockItems.toLocaleString(),
        icon: AlertTriangle,
        color: "text-destructive",
      },
      {
        title: "Storage Locations",
        value: uniqueStorageLocations.toLocaleString(),
        icon: Warehouse,
        color: "text-success",
      },
      {
        title: "Fast Moving",
        value: fastMovingItems.toLocaleString(),
        icon: TrendingUp,
        color: "text-warning",
      },
    ];
  };

  // Then update it when mockFinishedGoods changes:
  useEffect(() => {
    if (mockFinishedGoods && mockFinishedGoods.length > 0) {
      const stats = calculateQuickStats(mockFinishedGoods);
      setQuickStats(stats);
    }
  }, [mockFinishedGoods]);

  useEffect(() => {
    fetchFinishedGoodsData();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        // Show user-friendly error
        toast({
          title: "Authentication Error",
          description: "You must be logged in to download the template.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${BASE_URL}/production-receipts/download-template/${token}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are not authorized to download this template.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "Template not found.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        contentDisposition?.match(/filename="?(.+)"?/)?.[1] ||
        "bulk_upload_template.xlsx";

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const isValidFileType = (file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv")
    );
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        console.log("File dropped:", file.name);
      } else {
        toast({
          title: "Invalid File",
          description: "Please drop a valid Excel or CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && isValidFileType(file)) {
      setSelectedFile(file);
      console.log("File selected:", file.name);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid Excel or CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("excelFile", selectedFile);
    formData.append("token", token);

    try {
      const response = await fetch(
        `${BASE_URL}/production-receipts/bulk-upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        if (data.errFlag !== 0) {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Success",
          description: "Raw materials uploaded successfully",
        });
        setSelectedFile(null);
        setIsBulkUploadDialogOpen(false);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Finished Goods Inventory
            </h1>
            <p className="text-muted-foreground">
              Track and manage finished product inventory across all brands and
              categories
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Inventory Actions
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  setReceiveFromProductionOpen(true);
                  setMode("add");
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Receive from Production
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStockAdjustmentOpen(true)}>
                <FileEdit className="h-4 w-4 mr-2" />
                Stock Adjustment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBulkUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setQuickDispatchOpen(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Quick Dispatch
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Finished Goods Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Finished Goods Inventory</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      {/* <TableHead>Min/Max Level</TableHead> */}
                      <TableHead>Storage Location</TableHead>
                      {/* <TableHead>Unit Price</TableHead> */}
                      {/* <TableHead>Total Value</TableHead> */}
                      <TableHead>Raw Material Cost</TableHead>
                      {/* <TableHead>Velocity</TableHead> */}
                      <TableHead>Status</TableHead>
                      <TableHead>Last Produced</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div 
                            className="w-12 h-12 bg-muted rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedImage(product.product_image);
                              setIsImageModalOpen(true);
                            }}
                          >
                            <img
                              src={product.product_image}
                              alt={product.product_name}
                              className="max-w-full max-h-full object-cover rounded"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {product.product_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {product.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.sku_code}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.brand_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.product_category_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {product.stock_qty}
                            </span>
                            {product.status === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {product.status === "out-of-stock" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        {/* <TableCell className="text-sm">
                          <div>
                            <div>Min: {product.min_level}</div>
                            <div>Max: {product.max_level}</div>
                          </div>
                        </TableCell> */}
                        <TableCell
                          className="text-sm max-w-32 truncate"
                          title={product.location_label}
                        >
                          {product.location_label}
                        </TableCell>
                        {/* <TableCell>
                          ₹{product?.unit_price?.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{product?.total_value?.toLocaleString()}
                        </TableCell> */}
                        <TableCell>
                          ₹{product?.raw_material_cost?.toLocaleString()}
                        </TableCell>
                        {/* <TableCell>
                          <Badge variant={getVelocityColor(product.velocity)}>
                            {getVelocityLabel(product.velocity)}
                          </Badge>
                        </TableCell> */}
                        <TableCell>
                          <Badge variant={getStatusColor(product.goods_status)}>
                            {getStatusLabel(product.goods_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(product.last_produced).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProductDetails(product);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMode("edit");
                                setSelectedProduct(product);
                                setReceiveFromProductionOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Action Dialogs */}

      {/* Image View Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex items-center justify-center p-1 bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex justify-center">
            <img
              src={selectedImage || ""}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finished Good Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Product Details
            </DialogTitle>
          </DialogHeader>

          {selectedProductDetails && (
            <div className="space-y-6 py-4">
              <div className="flex gap-6 items-start">
                <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0 border">
                  <img
                    src={selectedProductDetails.product_image}
                    alt={selectedProductDetails.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold">
                    {selectedProductDetails.product_name}
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary">
                      {selectedProductDetails.brand_name}
                    </Badge>
                    <Badge variant="outline">
                      {selectedProductDetails.product_category_name}
                    </Badge>
                    <Badge
                      variant={getStatusColor(selectedProductDetails.goods_status)}
                    >
                      {getStatusLabel(selectedProductDetails.goods_status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">
                    SKU:{" "}
                    <span className="font-mono">
                      {selectedProductDetails.sku_code}
                    </span>{" "}
                    | ID: {selectedProductDetails.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Stock Quantity
                  </p>
                  <p className="text-lg font-bold">
                    {selectedProductDetails.stock_qty}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Location
                  </p>
                  <p className="text-lg font-bold">
                    {selectedProductDetails.location_label}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Unit Price
                  </p>
                  <p className="text-lg font-bold">
                    ₹
                    {Number(
                      selectedProductDetails.unit_price
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Value
                  </p>
                  <p className="text-lg font-bold">
                    ₹
                    {Number(
                      selectedProductDetails.total_value
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Raw Material Cost
                  </p>
                  <p className="text-lg font-bold">
                    ₹
                    {Number(
                      selectedProductDetails.raw_material_cost
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Velocity
                  </p>
                  <p className="text-lg font-bold capitalize">
                    {selectedProductDetails.velocity || "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4 bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Tracking & History
                </h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.created_admin_name || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Last Updated By
                    </p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.updated_admin_name || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Last Production Date
                    </p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.last_production_date
                        ? new Date(
                            selectedProductDetails.last_production_date
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Last Dispatch Date
                    </p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.last_dispatch_date
                        ? new Date(
                            selectedProductDetails.last_dispatch_date
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Last Produced (Log)
                    </p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.last_produced
                        ? new Date(
                            selectedProductDetails.last_produced
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="text-sm font-medium">
                      {selectedProductDetails.created_at
                        ? new Date(
                            selectedProductDetails.created_at
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Capacity
                  </p>
                  <p className="text-sm">
                    {selectedProductDetails.capacity || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Occupancy
                  </p>
                  <p className="text-sm">
                    {selectedProductDetails.current_occupancy || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Goods Upload</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Download Template Section */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <Download className="h-8 w-8 mb-2 text-gray-500" />
              <h3 className="text-lg font-medium">Download Template</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Download the Excel template with pre-filled headers to fill in
                your stock data
              </p>
              <Button onClick={handleDownloadTemplate} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Upload Section */}
            <div
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mb-2 text-gray-500" />
              <h3 className="text-lg font-medium">Upload Filled Template</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Drag and drop your filled Excel file here, or click to browse
              </p>

              {/* Show selected file name and clear option */}
              {selectedFile && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded border border-green-200">
                  <span className="text-sm text-green-700 flex-1">
                    Selected: {selectedFile.name}
                  </span>
                  <button
                    onClick={handleClearFile}
                    className="text-red-500 hover:text-red-700 text-sm"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-upload-file"
              />

              <div className="flex gap-2 flex-wrap justify-center">
                <label htmlFor="bulk-upload-file" className="cursor-pointer">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      document.getElementById("bulk-upload-file").click()
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {selectedFile ? "Change File" : "Choose File"}
                  </Button>
                </label>

                {/* Upload button that appears after file selection */}
                {selectedFile && (
                  <>
                    <Button
                      onClick={handleUpload}
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>

                    {/* Optional: Clear button for better UX */}
                    <Button
                      onClick={handleClearFile}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Supported formats: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ReceiveFromProductionForm
        mode={mode}
        token={token}
        open={receiveFromProductionOpen}
        onOpenChange={setReceiveFromProductionOpen}
        onSuccess={fetchFinishedGoodsData}
        editData={selectedProduct}
      />
      <StockAdjustmentForm
        token={token}
        open={stockAdjustmentOpen}
        onOpenChange={setStockAdjustmentOpen}
        data={mockFinishedGoods}
        onSuccess={fetchFinishedGoodsData}
      />
      <TransferStockForm
        open={transferStockOpen}
        onOpenChange={setTransferStockOpen}
      />
      <QuickDispatchForm
        open={quickDispatchOpen}
        onOpenChange={setQuickDispatchOpen}
      />
      <BulkStockUpdateForm
        open={bulkUpdateOpen}
        onOpenChange={setBulkUpdateOpen}
        data={mockFinishedGoods}
        type="finished-goods"
        onUpdate={handleBulkUpdate}
      />
    </MainLayout>
  );
};

export default FinishedGoods;

import { useEffect, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ItemAvatar } from "@/components/common/ItemAvatar";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Warehouse,
  Search,
  Edit,
  Eye,
  Plus,
  ShoppingCart,
  Truck,
  Upload,
  FileText,
  ToggleRight,
  ToggleLeft,
  X,
} from "lucide-react";
import { PaginationControls } from "../components/ui/pagination-controls";
import { AddRawMaterialForm } from "@/components/inventory/AddRawMaterialForm";
import { CreateQuickPOForm } from "@/components/inventory/CreateQuickPOForm";
import { ReceiveStockForm } from "@/components/inventory/ReceiveStockForm";
import { BulkStockUpdateForm } from "@/components/inventory/BulkStockUpdateForm";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { BASE_URL as API_BASE } from "@/hooks/baseUrls";
import { UpdateRawMaterialForm } from "@/components/inventory/updateRawMaterial";
import { useNavigate } from "react-router-dom";

// ✅ Get all raw materials
export async function getAllRawMaterials(token: string) {
  const res = await axios.get(`${API_BASE}/raw-materials/get-all/${token}`);
  console.log(res.data);
  return res.data;
}

// ✅ Get raw materials by category IDs
export async function getRawMaterialsByCategoryIds(
  categoryIds: number[],
  token: string,
) {
  const res = await axios.post(
    `${API_BASE}/raw-materials/get-by-category-ids`,
    {
      categoryIds,
      token,
    },
  );
  return res.data;
}

// ✅ Get raw material details
export async function getRawMaterialDetails(materialId: number, token: string) {
  const res = await axios.get(
    `${API_BASE}/raw-materials/get-details/${materialId}/${token}`,
  );
  return res.data;
}

// ✅ Add raw material
export async function addRawMaterial({
  materialCode,
  materialName,
  materialDescription,
  rawMaterialCategoryId,
  vendorIds,
  specification,
  stockQty,
  minStockLevel,
  maxStockLevel,
  unitOfMeasure,
  storageLocation,
  unitCost,
  materialImage,
  token,
}: any) {
  const formData = new FormData();
  formData.append("materialCode", materialCode);
  formData.append("materialName", materialName);
  if (materialDescription)
    formData.append("materialDescription", materialDescription);
  formData.append("rawMaterialCategoryId", rawMaterialCategoryId);
  formData.append("vendorIds", vendorIds);
  formData.append("specification", specification);
  if (typeof stockQty !== "undefined") {
    formData.append("stockQty", stockQty);
  }
  formData.append("minStockLevel", minStockLevel);
  formData.append("maxStockLevel", maxStockLevel);
  formData.append("unitOfMeasure", unitOfMeasure);
  formData.append("storageLocationId", storageLocation);
  formData.append("unitCost", unitCost);
  if (materialImage) formData.append("materialImage", materialImage);
  formData.append("token", token);

  const res = await axios.post(`${API_BASE}/raw-materials/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ✅ Update raw material
export async function updateRawMaterial({
  materialId,
  materialCode,
  materialName,
  materialDescription,
  rawMaterialCategoryId,
  vendorIds,
  specification,
  stockQty,
  minStockLevel,
  maxStockLevel,
  unitOfMeasure,
  storageLocation,
  unitCost,
  materialImage,
  token,
}: any) {
  const formData = new FormData();
  formData.append("materialId", materialId);
  formData.append("materialCode", materialCode);
  formData.append("materialName", materialName);
  if (materialDescription)
    formData.append("materialDescription", materialDescription);
  formData.append("rawMaterialCategoryId", rawMaterialCategoryId);
  formData.append("vendorIds", vendorIds);
  formData.append("specification", specification);
  formData.append("stockQty", stockQty);
  formData.append("minStockLevel", minStockLevel.toString());
  formData.append("maxStockLevel", maxStockLevel.toString());
  formData.append("unitOfMeasure", unitOfMeasure);
  formData.append("storageLocationId", storageLocation);
  formData.append("unitCost", unitCost);
  if (materialImage) formData.append("materialImage", materialImage);
  formData.append("token", token);

  // console.log(Object.fromEntries(formData.entries()));

  const res = await axios.post(
    `${API_BASE}/raw-materials/update`,
    formData,
    {},
  );
  console.log(res.data);
  return res.data;
}

// ✅ Change status for raw material
export async function changeRawMaterialStatus(
  materialId: number,
  status: number,
  token: string,
) {
  const res = await axios.get(
    `${API_BASE}/raw-materials/change-status/${materialId}/${status}/${token}`,
  );
  return res.data;
}

interface RawMaterial {
  id: number;
  category_name: string;
  created_admin_id: number;
  created_at: string; // ISO / GMT date string
  last_restocked: string | null;
  material_code: string;
  material_description: string;
  material_name: string;
  max_stock_level: number;
  min_stock_level: number;
  raw_material_category_id: number;
  raw_material_image: string;
  raw_material_image_public_id: string;
  specification: string;
  status: number; // 0 = inactive, 1 = active
  stock_qty: number;
  stock_status: "in-stock" | "out-of-stock" | string; // if API may send more values
  storage_location: string;
  total_value: string; // looks like formatted numeric string
  unit_cost: string; // same here
  unit_of_measure: string;
  updated_admin_id: number | null;
  updated_at: string;
  vendor_ids: string;
  vendor_names: string | null;
  location_label: string;
}

function getRawMaterialStats(materials: RawMaterial[]) {
  console.log(materials);
  const totalRawMaterials = materials.length;
  const lowStockItems = materials.filter(
    (m) => m.stock_status === "low-stock",
  ).length;
  const outOfStockItems = materials.filter(
    (m) => m.stock_status === "out-of-stock",
  ).length;

  // Count unique, non-null, non-empty warehouse names
  const uniqueLocations = new Set(
    materials.map((m) => m.location_label?.trim()).filter((name) => !!name),
  );
  const storageLocations = uniqueLocations.size;

  return {
    totalRawMaterials,
    lowStockItems,
    storageLocations,
    outOfStockItems,
  };
}

const RawMaterials = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] =
    useState(false);
  const [isReceiveStockDialogOpen, setIsReceiveStockDialogOpen] =
    useState(false);
  const [viewMaterialOpen, setViewMaterialOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(
    null,
  );
  const [totalRawMaterials, setTotalRawMaterials] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [storageLocations, setStorageLocations] = useState(0);
  const [outOfStockItems, setOutOfStockItems] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);

  const quickStats = [
    {
      title: "Total Raw Materials",
      value: totalRawMaterials,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Storage Locations",
      value: storageLocations,
      icon: Warehouse,
      color: "text-success",
    },
    {
      title: "Out of Stock",
      value: outOfStockItems,
      icon: TrendingDown,
      color: "text-warning",
    },
  ];
  const { toast } = useToast();
  const [quickPODialog, setQuickPODialog] = useState<{
    open: boolean;
    material?: RawMaterial;
  }>({ open: false });

  const [mockRawMaterials, setMockRawMaterials] = useState<RawMaterial[]>([]);

  const token = localStorage.getItem("token") || "";

  console.log(mockRawMaterials);

  const uniqueCategories = Array.from(
    new Set(
      mockRawMaterials.map((item) => item?.category_name).filter(Boolean),
    ),
  );

  const filteredData = Array.isArray(mockRawMaterials)
    ? mockRawMaterials.filter((item) => {
        const matchesSearch =
          item?.material_name
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          item?.category_name
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          item?.vendor_names
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          item?.material_code
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          item?.id?.toString().includes(searchTerm);

        const matchesCategory =
          selectedCategory === "all" ||
          item?.category_name === selectedCategory;

        return matchesSearch && matchesCategory;
      })
    : [];

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);
  const navigate = useNavigate();

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

  const openQuickPODialog = (material: RawMaterial) => {
    setQuickPODialog({ open: true, material });
  };

  const handleViewMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setViewMaterialOpen(true);
  };

  const handleBulkUpdate = (updates: any[]) => {
    // In a real app, this would make API calls to update the stock
    console.log("Bulk updating stock:", updates);
    toast({
      title: "Bulk Update Complete",
      description: `Successfully updated ${updates.length} items.`,
    });
  };

  const handleToggleStatus = async (material: (typeof mockRawMaterials)[0]) => {
    const newStatus = material.status === 1 ? 0 : 1;

    console.log(material.status, newStatus);

    console.log(material.id);

    try {
      const res = await changeRawMaterialStatus(
        Number(material.id), // adjust to your API’s key
        newStatus,
        token, // replace with your actual token
      );

      if (res.errFlag !== 0) {
        toast({
          title: "Error",
          description: res.message || "Failed to update brand status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `${material.material_name} is now ${
          newStatus === 0 ? "inactive" : "active"
        }`,
      });

      fetchRawMaterials(token);

      // optional: update local state/UI to reflect new status
      // setBrands(prev =>
      //   prev.map(b => b.id === brand.id ? { ...b, status: newStatus } : b)
      // );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchRawMaterials = async (token) => {
    try {
      const data = await getAllRawMaterials(token);
      const materialsArray = Array.isArray(data) ? data : [];
      setMockRawMaterials(materialsArray);

      // Update quick stats state here
      const stats = getRawMaterialStats(materialsArray);
      setTotalRawMaterials(stats.totalRawMaterials);
      setLowStockItems(stats.lowStockItems);
      setStorageLocations(stats.storageLocations);
      setOutOfStockItems(stats.outOfStockItems);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      // Set empty array on error to prevent UI collapse
      setMockRawMaterials([]);
      setTotalRawMaterials(0);
      setLowStockItems(0);
      setStorageLocations(0);
      setOutOfStockItems(0);
      toast({
        title: "Error",
        description: "Failed to load raw materials. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRawMaterials(token);
  }, []);

  // Handler functions
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
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
        `${API_BASE}/raw-materials/bulk-upload-template/download/${token}`,
        {
          method: "GET",
        },
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
    } finally {
      setIsDownloading(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
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

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("token", token);

    try {
      const response = await fetch(`${API_BASE}/raw-materials/bulk-upload`, {
        method: "POST",
        body: formData,
      });

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

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Raw Materials Inventory
            </h1>
            <p className="text-muted-foreground">
              Track and manage raw material stock levels, suppliers, and storage
              locations
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={isReceiveStockDialogOpen}
              onOpenChange={setIsReceiveStockDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Receive Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Receive Stock from Vendor</DialogTitle>
                </DialogHeader>
                <ReceiveStockForm
                  existingMaterials={mockRawMaterials}
                  onSuccess={() => setIsReceiveStockDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAddMaterialDialogOpen}
              onOpenChange={setIsAddMaterialDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Raw Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Raw Material</DialogTitle>
                </DialogHeader>
                <AddRawMaterialForm
                  setMockRawMaterials={setMockRawMaterials}
                  onSuccess={() => setIsAddMaterialDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isBulkUploadDialogOpen}
              onOpenChange={setIsBulkUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Stock Upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Download Template Section */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Download className="h-8 w-8 mb-2 text-gray-500" />
                    <h3 className="text-lg font-medium">Download Template</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Download the Excel template with pre-filled headers to
                      fill in your stock data
                    </p>
                    <Button onClick={handleDownloadTemplate} variant="default">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload Section */}
                  <div
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 mb-2 text-gray-500" />
                    <h3 className="text-lg font-medium">
                      Upload Filled Template
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Drag and drop your filled Excel file here, or click to
                      browse
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
                      <label
                        htmlFor="bulk-upload-file"
                        className="cursor-pointer"
                      >
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
          </div>
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

        {/* Raw Materials Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Raw Materials Inventory</CardTitle>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search raw materials..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
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
                      <TableHead>Material Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Stock Qty</TableHead>
                      <TableHead>Min/Max Level</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Storage Location</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <ItemAvatar
                            src={material.raw_material_image}
                            name={material.material_name}
                            onClick={() => {
                              setSelectedImage(material.raw_material_image);
                              setIsImageModalOpen(true);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {material.material_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {material.material_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {material.category_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {material.vendor_names}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {material.stock_qty}
                            </span>
                            {material.stock_status === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {material.stock_status === "out-of-stock" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <div>Min: {material.min_stock_level}</div>
                            <div>Max: {material.max_stock_level}</div>
                          </div>
                        </TableCell>
                        <TableCell>{material.unit_of_measure}</TableCell>
                        <TableCell
                          className="text-sm max-w-32 truncate"
                          title={material.location_label}
                        >
                          {material.location_label}
                        </TableCell>
                        <TableCell>₹{material.unit_cost}</TableCell>
                        <TableCell className="font-medium">
                          ₹{material.total_value.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(material.stock_status)}
                          >
                            {getStatusLabel(material.stock_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(
                            material.last_restocked,
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            {(material.stock_status === "low-stock" ||
                              material.stock_status === "out-of-stock") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/purchases`)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Create PO
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewMaterial(material)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMaterial(material);
                                setIsEditMaterialDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMaterial(material);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              {material.status === 1 ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
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

        {/* Quick PO Dialog */}
        <Dialog
          open={quickPODialog.open}
          onOpenChange={(open) => setQuickPODialog({ open })}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Quick Purchase Order</DialogTitle>
            </DialogHeader>
            {/* {quickPODialog.material && (
              <CreateQuickPOForm
                materialName={quickPODialog.material.material_name}
                materialId={quickPODialog.material.id}
                vendor={quickPODialog.material.vendor_name}
                currentStock={quickPODialog.material.stock_qty}
                minStock={quickPODialog.material.min_stock_level}
                onSuccess={() => setQuickPODialog({ open: false })}
              />
            )} */}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Raw Material</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete Raw Material?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleToggleStatus(selectedMaterial)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <BulkStockUpdateForm
          open={bulkUpdateOpen}
          onOpenChange={setBulkUpdateOpen}
          data={mockRawMaterials}
          type="raw-materials"
          onUpdate={handleBulkUpdate}
        />

        {/* View Material Details Dialog */}
        <Dialog open={viewMaterialOpen} onOpenChange={setViewMaterialOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Raw Material Details - {selectedMaterial?.material_name}
              </DialogTitle>
            </DialogHeader>
            {selectedMaterial && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Material ID</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterial.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <Badge variant="outline">
                      {selectedMaterial.category_name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vendor</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterial.vendor_names}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      variant={getStatusColor(selectedMaterial.stock_status)}
                    >
                      {getStatusLabel(selectedMaterial.stock_status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Current Stock</p>
                    <p className="text-lg font-semibold">
                      {selectedMaterial.stock_qty}{" "}
                      {selectedMaterial.unit_of_measure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Min Level</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterial.min_stock_level}{" "}
                      {selectedMaterial.unit_of_measure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max Level</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterial.max_stock_level}{" "}
                      {selectedMaterial.unit_of_measure}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Unit Cost</p>
                    <p className="text-lg font-semibold">
                      ₹{selectedMaterial.unit_cost}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Value</p>
                    <p className="text-lg font-semibold">
                      ₹{selectedMaterial.total_value.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Storage Location</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterial.location_label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Restocked</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedMaterial.last_restocked,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Edit Material Dialog */}
        <UpdateRawMaterialForm
          rawMaterial={selectedMaterial}
          setMockRawMaterials={setMockRawMaterials}
          isEditMaterialDialogOpen={isEditMaterialDialogOpen}
          setIsEditMaterialDialogOpen={setIsEditMaterialDialogOpen}
          onSuccess={() => setIsEditMaterialDialogOpen(false)}
        />

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
      </div>
    </MainLayout>
  );
};

export default RawMaterials;
